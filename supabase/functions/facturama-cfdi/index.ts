// Edge Function: timbra (crea), consulta y cancela el CFDI real de una
// Factura ante el PAC Facturama (API Multiemisor), usando el CSD que la
// empresa ya registro (ver Edge Function "facturama-csd"). Si el viaje
// facturado es de tipo 'CartaPorte', arma tambien el Complemento Carta
// Porte 3.1 con los datos ya capturados en Unidad/Operador/Caja(s)/Ruta/
// Destinatario -- el usuario no vuelve a capturar nada aparte.
//
// Necesita ser Edge Function porque las credenciales de Facturama (Basic
// Auth) son secretos de servidor (FACTURAMA_SANDBOX_USER/PASSWORD, luego
// FACTURAMA_PROD_USER/PASSWORD) que nunca deben llegar al navegador.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function baseUrlPara(ambiente: string): string {
  return ambiente === 'produccion' ? 'https://api.facturama.mx' : 'https://apisandbox.facturama.mx';
}

function credencialesPara(ambiente: string): { usuario: string; contrasena: string } | null {
  const usuario = Deno.env.get(ambiente === 'produccion' ? 'FACTURAMA_PROD_USER' : 'FACTURAMA_SANDBOX_USER');
  const contrasena = Deno.env.get(ambiente === 'produccion' ? 'FACTURAMA_PROD_PASSWORD' : 'FACTURAMA_SANDBOX_PASSWORD');
  if (!usuario || !contrasena) return null;
  return { usuario, contrasena };
}

/** "CCC" + 33 caracteres alfanumericos en mayusculas, formato que exige el SAT para el IdCCP. */
/** "CCC" + un UUID (RFC 4122, 8-4-4-4-12 hex con guiones) -- formato que exige el SAT para el IdCCP. */
function generarIdCcp(): string {
  return `CCC${crypto.randomUUID()}`;
}

function fechaHoraSat(fecha: string, hora: string): string {
  const f = fecha || new Date().toISOString().slice(0, 10);
  const h = hora && /^\d{2}:\d{2}/.test(hora) ? hora.slice(0, 5) : '12:00';
  return `${f}T${h}:00`;
}

/** Convierte el JSON de error de Facturama ({Message, ModelState:{campo:[...]}}) en un texto humano, uniendo todos los detalles. */
function mensajeErrorPac(texto: string): string {
  try {
    const j = JSON.parse(texto);
    const detalles = new Set<string>();
    if (j.ModelState && typeof j.ModelState === 'object') {
      for (const valor of Object.values(j.ModelState)) {
        if (Array.isArray(valor)) valor.forEach((v) => detalles.add(String(v)));
      }
    }
    if (detalles.size > 0) return [...detalles].map((d) => `• ${d}`).join('\n');
    if (j.Message) return j.Message as string;
  } catch {
    // No era JSON -- se regresa el texto tal cual abajo.
  }
  return texto || 'Error desconocido del PAC.';
}

/** Extrae NoCertificado="..." del XML del CFDI (no viene aparte en la respuesta de Facturama V4). */
function extraerNoCertificado(xmlBase64: string): string {
  try {
    const xml = atob(xmlBase64);
    const m = xml.match(/NoCertificado="(\d+)"/);
    return m ? m[1] : '';
  } catch {
    return '';
  }
}

type Linea = {
  concepto: string;
  unidadMedida: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  importe: number;
  conceptoFacturacionId?: string;
};

type FacturaDraft = {
  folio: string;
  fecha: string;
  clienteId: string;
  moneda: 'MXN' | 'USD';
  tipoCambio: number;
  usoCfdi: string;
  metodoPago: string;
  formaPago: string;
  viajeIds: string[];
  lineas: Linea[];
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Metodo no permitido.' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Falta autenticacion.' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  try {
    const body = await req.json();
    const accion = body.accion as 'timbrar' | 'cancelar' | 'consultar';
    if (!['timbrar', 'cancelar', 'consultar'].includes(accion)) {
      return jsonResponse({ error: 'Accion invalida.' }, 400);
    }

    const cliente = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: puedeCrear } = await cliente.rpc('has_permission', { p_modulo: 'Facturacion', p_accion: 'crear' });
    if (!puedeCrear) {
      return jsonResponse({ error: 'No tienes permiso para timbrar facturas.' }, 403);
    }

    const { data: empresa, error: errEmpresa } = await cliente
      .from('empresas')
      .select('rfc, nombre, razon_social, regimen_fiscal, facturama_ambiente, facturama_csd_registrado')
      .single();
    if (errEmpresa || !empresa) {
      return jsonResponse({ error: `No se encontro la empresa del usuario: ${errEmpresa?.message ?? 'sin datos'}` }, 404);
    }
    if (!empresa.facturama_csd_registrado) {
      return jsonResponse(
        { error: 'Esta empresa todavia no tiene un CSD registrado con el PAC. Ve a Configuracion > Empresa.' },
        400,
      );
    }
    const rfcEmisor = (empresa.rfc as string).trim().toUpperCase();
    const ambiente = (empresa.facturama_ambiente as string) ?? 'sandbox';
    const credenciales = credencialesPara(ambiente);
    if (!credenciales) {
      return jsonResponse({ error: `Faltan las credenciales del PAC (ambiente "${ambiente}") en el servidor.` }, 500);
    }
    const authFacturama = 'Basic ' + btoa(`${credenciales.usuario}:${credenciales.contrasena}`);
    const baseUrl = baseUrlPara(ambiente);

    if (accion === 'cancelar') {
      const { facturamaId, motivo, uuidReplacement } = body as {
        facturamaId?: string;
        motivo?: string;
        uuidReplacement?: string;
      };
      if (!facturamaId || !motivo) {
        return jsonResponse({ error: 'Falta el identificador del CFDI o el motivo de cancelacion.' }, 400);
      }
      const qs = new URLSearchParams({ motive: motivo });
      if (motivo === '01' && uuidReplacement) qs.set('uuidReplacement', uuidReplacement);
      const respuesta = await fetch(`${baseUrl}/api-lite/cfdis/${facturamaId}?${qs.toString()}`, {
        method: 'DELETE',
        headers: { Authorization: authFacturama },
      });
      if (!respuesta.ok) {
        const texto = await respuesta.text();
        return jsonResponse({ error: mensajeErrorPac(texto) || respuesta.statusText }, 400);
      }
      return jsonResponse({ ok: true }, 200);
    }

    if (accion === 'consultar') {
      const { facturamaId } = body as { facturamaId?: string };
      if (!facturamaId) return jsonResponse({ error: 'Falta el identificador del CFDI.' }, 400);
      const respuesta = await fetch(`${baseUrl}/api-lite/cfdis/${facturamaId}`, {
        method: 'GET',
        headers: { Authorization: authFacturama },
      });
      if (!respuesta.ok) {
        const texto = await respuesta.text();
        return jsonResponse({ error: mensajeErrorPac(texto) || respuesta.statusText }, 400);
      }
      const datos = await respuesta.json();
      return jsonResponse({ ok: true, datos }, 200);
    }

    // ---- accion === 'timbrar' ----
    const f = body.factura as FacturaDraft;
    if (!f?.clienteId || !f.lineas?.length) {
      return jsonResponse({ error: 'Faltan datos de la factura (cliente o conceptos).' }, 400);
    }

    const { data: clienteFiscal, error: errCliente } = await cliente
      .from('clientes')
      .select('rfc, nombre, regimen_fiscal, cp')
      .eq('id', f.clienteId)
      .single();
    if (errCliente || !clienteFiscal) {
      return jsonResponse({ error: 'No se encontro el cliente a facturar.' }, 404);
    }
    if (!clienteFiscal.rfc) {
      return jsonResponse({ error: 'El cliente a facturar no tiene RFC capturado.' }, 400);
    }
    if (!clienteFiscal.regimen_fiscal) {
      return jsonResponse(
        { error: `El cliente "${clienteFiscal.nombre}" no tiene Regimen Fiscal (SAT) capturado. Captura ese dato en el catalogo de Clientes antes de timbrar.` },
        400,
      );
    }
    if (!empresa.regimen_fiscal) {
      return jsonResponse({ error: 'La empresa no tiene Regimen Fiscal (SAT) capturado. Captura ese dato en Configuracion > Empresa antes de timbrar.' }, 400);
    }

    // ---- Conceptos (Items) -- toma clave SAT del catalogo de Conceptos de
    // Facturacion cuando la linea viene de ahi; si es una linea libre, usa
    // una clave generica de "Servicios de transporte de carga por carretera".
    const conceptoIds = [...new Set(f.lineas.map((l) => l.conceptoFacturacionId).filter(Boolean))] as string[];
    const conceptosPorId = new Map<string, { clave_prod_serv: string; clave_unidad: string; objeto_impuesto: string }>();
    if (conceptoIds.length > 0) {
      const { data: conceptosRows } = await cliente
        .from('conceptos_facturacion')
        .select('id, clave_prod_serv, clave_unidad, objeto_impuesto')
        .in('id', conceptoIds);
      for (const c of conceptosRows ?? []) {
        conceptosPorId.set(c.id as string, {
          clave_prod_serv: (c.clave_prod_serv as string) || '78101803',
          clave_unidad: (c.clave_unidad as string) || 'E48',
          objeto_impuesto: (c.objeto_impuesto as string) || '02',
        });
      }
    }
    const DEFAULT_CLAVE_PROD_SERV = '78101803'; // c_ClaveProdServ: Servicios de transporte de carga por carretera
    const DEFAULT_CLAVE_UNIDAD = 'E48'; // c_ClaveUnidad: Unidad de servicio
    const items = f.lineas.map((l) => {
      const c = l.conceptoFacturacionId ? conceptosPorId.get(l.conceptoFacturacionId) : undefined;
      const subtotal = l.cantidad * l.precioUnitario - l.descuento;
      const tasaIva = 0.16;
      const iva = Math.round(subtotal * tasaIva * 100) / 100;
      return {
        ProductCode: c?.clave_prod_serv || DEFAULT_CLAVE_PROD_SERV,
        Description: l.concepto,
        UnitCode: c?.clave_unidad || DEFAULT_CLAVE_UNIDAD,
        Unit: l.unidadMedida || 'Servicio',
        UnitPrice: l.precioUnitario,
        Quantity: l.cantidad,
        Subtotal: subtotal,
        Discount: l.descuento || undefined,
        TaxObject: c?.objeto_impuesto || '02',
        Taxes:
          (c?.objeto_impuesto || '02') === '02'
            ? [{ Total: iva, Name: 'IVA', Base: subtotal, Rate: tasaIva, IsRetention: false }]
            : [],
        Total: subtotal + iva,
      };
    });

    // ---- Carta Porte: solo si hay exactamente UN viaje y requiere el
    // complemento. Facturar varios viajes de Carta Porte juntos no esta
    // soportado todavia (cada uno tiene su propia unidad/operador/ruta).
    let complemento: Record<string, unknown> | undefined;
    let idCcp = '';
    if (f.viajeIds.length > 0) {
      const { data: viajesRows } = await cliente
        .from('viajes')
        .select(
          'id, tipo_documento, unidad_id, operador_id, ruta_codigo, kilometros, fecha, hora_salida, hora_llegada_estimada, fecha_entrega, hora_entrega_real, config_vehicular_clave_sat, materiales_carga, peso_carga_total, peso_carga_unidad, remolque1_id, remolque2_id, dolly_id',
        )
        .in('id', f.viajeIds);
      const viajesCartaPorte = (viajesRows ?? []).filter((v) => v.tipo_documento === 'CartaPorte');
      if (viajesCartaPorte.length > 1) {
        return jsonResponse(
          { error: 'No se pueden facturar juntos varios viajes de Carta Porte en un mismo CFDI. Facturalos por separado.' },
          400,
        );
      }
      if (viajesCartaPorte.length === 1) {
        const v = viajesCartaPorte[0];

        const [{ data: unidad }, { data: operador }, { data: ruta }] = await Promise.all([
          cliente
            .from('unidades')
            .select(
              'tipo, placas, anio, aseguradora, no_poliza, numero_permiso_sct, clave_tipo_permiso_sct, peso_tara_ton, capacidad_kg',
            )
            .eq('id', v.unidad_id)
            .single(),
          cliente.from('operadores').select('nombre, rfc, licencia').eq('id', v.operador_id).single(),
          cliente.from('rutas').select('origen_id, destino_id').eq('codigo', v.ruta_codigo).maybeSingle(),
        ]);

        if (!unidad || !operador) {
          return jsonResponse({ error: 'Faltan datos de la unidad o el operador asignados al viaje para el Complemento Carta Porte.' }, 400);
        }

        const remolqueIds = [v.remolque1_id, v.remolque2_id, v.dolly_id].filter(Boolean) as string[];
        const { data: remolques } = remolqueIds.length
          ? await cliente.from('cajas').select('tipo, placas').in('id', remolqueIds)
          : { data: [] as { tipo: string; placas: string }[] };

        let origenDest: Record<string, unknown> | null = null;
        let destinoDest: Record<string, unknown> | null = null;
        if (ruta?.origen_id || ruta?.destino_id) {
          const ids = [ruta.origen_id, ruta.destino_id].filter(Boolean) as string[];
          const { data: destinatarios } = await cliente
            .from('destinatarios')
            .select('id, rfc, nombre, calle, numero_exterior, numero_interior, colonia, localidad, municipio, estado, pais, cp')
            .in('id', ids);
          origenDest = (destinatarios ?? []).find((d) => d.id === ruta.origen_id) ?? null;
          destinoDest = (destinatarios ?? []).find((d) => d.id === ruta.destino_id) ?? null;
        }
        if (!origenDest || !destinoDest) {
          return jsonResponse(
            { error: 'La ruta de este viaje no tiene Origen/Destino (catalogo de Destinatarios) capturados; no se puede armar el Complemento Carta Porte.' },
            400,
          );
        }

        // El Carta Porte exige las claves internas del SAT (c_Estado/c_Municipio/
        // c_Localidad), no el nombre libre capturado en Destinatarios -- se calculan
        // a partir del C.P. usando el catalogo oficial que se cargo en
        // sat_codigos_postales (Anexo 20 del SAT).
        const cps = [...new Set([origenDest.cp, destinoDest.cp].filter(Boolean))] as string[];
        const { data: cpRows } = cps.length
          ? await cliente.from('sat_codigos_postales').select('codigo_postal, clave_estado, clave_municipio, clave_localidad').in('codigo_postal', cps)
          : { data: [] as { codigo_postal: string; clave_estado: string; clave_municipio: string; clave_localidad: string }[] };
        const claveSatPorCp = new Map((cpRows ?? []).map((r) => [r.codigo_postal, r]));

        for (const [etiqueta, d] of [
          ['Origen', origenDest],
          ['Destino', destinoDest],
        ] as const) {
          if (!d.cp || !claveSatPorCp.has(d.cp as string)) {
            return jsonResponse(
              {
                error: `El codigo postal "${d.cp || '(vacio)'}" del Destinatario de ${etiqueta} ("${d.nombre}") no se encontro en el catalogo del SAT. Revisa que el C.P. este bien capturado en el catalogo de Destinatarios.`,
              },
              400,
            );
          }
        }

        const domicilio = (d: Record<string, unknown>) => {
          const clave = claveSatPorCp.get(d.cp as string)!;
          return {
            Calle: d.calle || 'SIN CALLE',
            NumeroExterior: d.numero_exterior || undefined,
            NumeroInterior: d.numero_interior || undefined,
            Colonia: d.colonia || undefined,
            Localidad: clave.clave_localidad || undefined,
            Referencia: undefined,
            Municipio: clave.clave_municipio || undefined,
            Estado: clave.clave_estado,
            // Clave fija del catalogo SAT c_Pais (no el nombre libre del catalogo de Destinatarios).
            Pais: 'MEX',
            CodigoPostal: clave.codigo_postal,
          };
        };

        // El sandbox de Facturama valida los RFC contra el padron real del SAT; el unico
        // que siempre pasa ahi es el RFC generico de pruebas del SAT. En produccion, si
        // falta el RFC en el catalogo, se usa el RFC generico publico como ultimo recurso.
        const rfcFallback = ambiente === 'sandbox' ? 'EKU9003173C9' : 'XAXX010101000';

        idCcp = generarIdCcp();
        const materiales = (v.materiales_carga as Array<Record<string, unknown>>) ?? [];

        complemento = {
          CartaPorte31: {
            IdCCP: idCcp,
            TranspInternac: 'No',
            TotalDistRec: String(v.kilometros || 0),
            Ubicaciones: [
              {
                TipoUbicacion: 'Origen',
                IDUbicacion: 'OR000001',
                RFCRemitenteDestinatario: ((origenDest.rfc as string)?.trim() || rfcFallback),
                NombreRemitenteDestinatario: origenDest.nombre,
                FechaHoraSalidaLlegada: fechaHoraSat(v.fecha as string, v.hora_salida as string),
                Domicilio: domicilio(origenDest),
              },
              {
                TipoUbicacion: 'Destino',
                IDUbicacion: 'DE000001',
                RFCRemitenteDestinatario: ((destinoDest.rfc as string)?.trim() || rfcFallback),
                NombreRemitenteDestinatario: destinoDest.nombre,
                FechaHoraSalidaLlegada: fechaHoraSat((v.fecha_entrega as string) || (v.fecha as string), (v.hora_entrega_real as string) || (v.hora_llegada_estimada as string)),
                DistanciaRecorrida: String(v.kilometros || 0),
                Domicilio: domicilio(destinoDest),
              },
            ],
            Mercancias: {
              PesoBrutoTotal: String(v.peso_carga_total || 0),
              UnidadPeso: v.peso_carga_unidad === 'TONELADAS' ? 'TNE' : 'KGM',
              NumTotalMercancias: String(materiales.length || 1),
              Mercancia: materiales.length
                ? materiales.map((m) => ({
                    BienesTransp: m.claveProdServCP || '01010101',
                    Descripcion: m.descripcion,
                    Cantidad: String(m.cantidad ?? 1),
                    ClaveUnidad: m.claveUnidadSat || 'KGM',
                    MaterialPeligroso: m.materialPeligroso ? 'Si' : 'No',
                    ClaveMaterialPeligroso: m.materialPeligroso ? m.claveMaterialPeligroso : undefined,
                    PesoEnKg: String(m.peso ?? 0),
                  }))
                : [
                    {
                      BienesTransp: '01010101',
                      Descripcion: 'Mercancia general',
                      Cantidad: '1',
                      ClaveUnidad: 'KGM',
                      MaterialPeligroso: 'No',
                      PesoEnKg: String(v.peso_carga_total || 1),
                    },
                  ],
              Autotransporte: (() => {
                const configVehicular = unidad.tipo || v.config_vehicular_clave_sat || 'C2';
                // Segun el catalogo SAT c_ConfigAutotransporte, solo las configuraciones
                // articuladas (tractocamion "T..." o camion+remolque completo "C#R#")
                // llevan remolques; un camion unitario (ej. "C2", "C3") nunca los lleva,
                // aunque el viaje tenga una caja enganchada capturada en el sistema.
                const admiteRemolques = /^T/.test(configVehicular) || /R\d/.test(configVehicular);
                return {
                  PermSCT: unidad.clave_tipo_permiso_sct || 'TPAF01',
                  NumPermisoSCT: unidad.numero_permiso_sct || '',
                  IdentificacionVehicular: {
                    ConfigVehicular: configVehicular,
                    PesoBrutoVehicular: String(
                      Math.round((Number(unidad.peso_tara_ton) || 0) * 1000 + (Number(unidad.capacidad_kg) || 0)) / 1000,
                    ),
                    PlacaVM: unidad.placas,
                    AnioModeloVM: unidad.anio,
                  },
                  Seguros: {
                    AseguraRespCivil: unidad.aseguradora || '',
                    PolizaRespCivil: unidad.no_poliza || '',
                  },
                  // Facturama rechaza el atributo si se manda vacio o si la configuracion
                  // vehicular no admite remolques.
                  ...(admiteRemolques && (remolques ?? []).length > 0
                    ? { Remolques: (remolques ?? []).map((r) => ({ SubTipoRem: r.tipo, Placa: r.placas })) }
                    : {}),
                };
              })(),
            },
            FiguraTransporte: [
              {
                TipoFigura: '01',
                NombreFigura: operador.nombre,
                RFCFigura: ((operador.rfc as string)?.trim() || rfcFallback),
                NumLicencia: operador.licencia || undefined,
              },
            ],
          },
        };
      }
    }

    const payload: Record<string, unknown> = {
      NameId: complemento ? '36' : '1',
      Currency: f.moneda,
      Folio: f.folio,
      CfdiType: 'I',
      PaymentForm: f.formaPago || '01',
      PaymentMethod: f.metodoPago || 'PUE',
      ExpeditionPlace: (empresa.direccion as string)?.match(/\b\d{5}\b/)?.[0] ?? clienteFiscal.cp ?? '00000',
      Date: new Date().toISOString().slice(0, 19),
      Exportation: '01',
      Issuer: {
        Rfc: rfcEmisor,
        Name: (empresa.razon_social as string) || (empresa.nombre as string),
        FiscalRegime: (empresa.regimen_fiscal as string).split(' ')[0],
      },
      Receiver: {
        Rfc: clienteFiscal.rfc,
        Name: clienteFiscal.nombre,
        CfdiUse: f.usoCfdi || 'G03',
        FiscalRegime: (clienteFiscal.regimen_fiscal as string).split(' ')[0],
        TaxZipCode: clienteFiscal.cp || '00000',
      },
      Items: items,
    };
    if (complemento) payload.Complemento = complemento;

    const respuesta = await fetch(`${baseUrl}/api-lite/4/cfdis`, {
      method: 'POST',
      headers: { Authorization: authFacturama, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!respuesta.ok) {
      const texto = await respuesta.text();
      return jsonResponse({ error: mensajeErrorPac(texto) || respuesta.statusText }, 400);
    }

    const datos = await respuesta.json();
    const ahora = new Date().toISOString().slice(0, 19);
    const timbrado = {
      simulado: false,
      folioFiscal: datos.TaxStamp?.Uuid ?? '',
      noSerieCertificadoEmisor: extraerNoCertificado(datos.XmlBase64 ?? ''),
      noSerieCertificadoSat: datos.TaxStamp?.SatCertNumber ?? '',
      fechaHoraExpedicion: ahora,
      fechaHoraCertificacion: datos.TaxStamp?.Date ?? ahora,
      selloDigitalCfdi: datos.TaxStamp?.CfdiSign ?? '',
      selloDigitalSat: datos.TaxStamp?.SatSign ?? '',
      cadenaOriginal: datos.TaxStamp?.TaxStampOriginalString ?? '',
      idCcp,
      facturamaId: datos.Id ?? '',
      cancelado: false,
      motivoCancelacion: '',
      folioSustitutoCancelacion: '',
      fechaCancelacion: '',
    };

    return jsonResponse({ ok: true, timbrado }, 200);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Error inesperado.' }, 500);
  }
});
