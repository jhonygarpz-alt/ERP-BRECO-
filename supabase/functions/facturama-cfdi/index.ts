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
/**
 * IdCCP: un UUID (RFC 4122, 8-4-4-4-12 hex con guiones, 36 caracteres en
 * total) con los primeros 3 caracteres reemplazados por "CCC" -- no se le
 * agregan 3 caracteres extra al inicio, se sustituyen, para mantener los
 * 36 caracteres y la posicion de los guiones que exige el patron del SAT.
 */
function generarIdCcp(): string {
  return `CCC${crypto.randomUUID().slice(3)}`;
}

/**
 * El nodo "Fecha" del CFDI (y el de Carta Porte) no lleva zona horaria -- el
 * SAT lo interpreta como hora local de Mexico. El servidor de la Edge
 * Function corre en UTC, asi que hay que convertir explicitamente: usar
 * new Date().toISOString() tal cual manda la hora ~6 horas adelantada,
 * lo que el SAT lee como "fecha de generacion en el futuro" (periodo
 * negativo) y rechaza el timbrado con "la fecha de generacion no puede
 * ser mayor a 72 horas".
 */
function fechaHoraLocalMexico(fecha?: Date): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(fecha ?? new Date());
  const obj: Record<string, string> = {};
  for (const p of partes) obj[p.type] = p.value;
  return `${obj.year}-${obj.month}-${obj.day}T${obj.hour}:${obj.minute}:${obj.second}`;
}

function fechaHoraSat(fecha: string, hora: string): string {
  const f = fecha || fechaHoraLocalMexico().slice(0, 10);
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
        // c_Localidad/c_Colonia), no el nombre libre capturado en Destinatarios --
        // se calculan a partir del C.P. usando los catalogos oficiales que se
        // cargaron en sat_codigos_postales y sat_colonias (Anexo 20 del SAT).
        const cps = [...new Set([origenDest.cp, destinoDest.cp].filter(Boolean))] as string[];
        const [{ data: cpRows }, { data: colRows }] = await Promise.all([
          cps.length
            ? cliente.from('sat_codigos_postales').select('codigo_postal, clave_estado, clave_municipio, clave_localidad').in('codigo_postal', cps)
            : Promise.resolve({ data: [] as { codigo_postal: string; clave_estado: string; clave_municipio: string; clave_localidad: string }[] }),
          cps.length
            ? cliente.from('sat_colonias').select('codigo_postal, clave_colonia, nombre').in('codigo_postal', cps)
            : Promise.resolve({ data: [] as { codigo_postal: string; clave_colonia: string; nombre: string }[] }),
        ]);
        const claveSatPorCp = new Map((cpRows ?? []).map((r) => [r.codigo_postal, r]));
        const coloniasPorCp = new Map<string, { clave_colonia: string; nombre: string }[]>();
        for (const r of colRows ?? []) {
          const lista = coloniasPorCp.get(r.codigo_postal) ?? [];
          lista.push(r);
          coloniasPorCp.set(r.codigo_postal, lista);
        }

        const normalizar = (s: string) =>
          s
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();

        const claveColoniaPorDestinatario = new Map<string, string>();
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
          const candidatas = coloniasPorCp.get(d.cp as string) ?? [];
          if (candidatas.length === 0) {
            return jsonResponse(
              {
                error: `El codigo postal "${d.cp}" del Destinatario de ${etiqueta} ("${d.nombre}") no tiene colonias registradas en el catalogo del SAT.`,
              },
              400,
            );
          }
          let clave = '';
          if (candidatas.length === 1) {
            clave = candidatas[0].clave_colonia;
          } else if (d.colonia) {
            const buscado = normalizar(d.colonia as string);
            clave = candidatas.find((c) => normalizar(c.nombre) === buscado)?.clave_colonia ?? '';
          }
          if (!clave) {
            const opciones = candidatas.map((c) => c.nombre).slice(0, 15).join(', ');
            return jsonResponse(
              {
                error: `No se pudo determinar la Colonia (catalogo del SAT) del Destinatario de ${etiqueta} ("${d.nombre}") para el C.P. "${d.cp}". Captura la Colonia exactamente como aparece en el catalogo del SAT, por ejemplo: ${opciones}.`,
              },
              400,
            );
          }
          claveColoniaPorDestinatario.set(d.id as string, clave);
        }

        const domicilio = (d: Record<string, unknown>) => {
          const clave = claveSatPorCp.get(d.cp as string)!;
          return {
            Calle: d.calle || 'SIN CALLE',
            NumeroExterior: d.numero_exterior || undefined,
            NumeroInterior: d.numero_interior || undefined,
            Colonia: claveColoniaPorDestinatario.get(d.id as string),
            Localidad: clave.clave_localidad || undefined,
            Referencia: undefined,
            Municipio: clave.clave_municipio || undefined,
            Estado: clave.clave_estado,
            // Clave fija del catalogo SAT c_Pais (no el nombre libre del catalogo de Destinatarios).
            Pais: 'MEX',
            CodigoPostal: clave.codigo_postal,
          };
        };

        // El sandbox de Facturama valida los RFC contra el padron real del SAT: cualquier
        // RFC "de prueba" capturado en el catalogo (aunque tenga formato valido) casi
        // siempre sale rechazado por no estar realmente inscrito, asi que en sandbox
        // SIEMPRE se manda el RFC generico de pruebas del SAT, sin importar lo capturado.
        // En produccion si se usa el RFC real capturado, cayendo al generico publico solo
        // si falta.
        const rfcFallback = ambiente === 'sandbox' ? 'EKU9003173C9' : 'XAXX010101000';
        const rfcPara = (capturado: unknown) =>
          ambiente === 'sandbox' ? rfcFallback : (capturado as string)?.trim() || rfcFallback;

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
                RFCRemitenteDestinatario: rfcPara(origenDest.rfc),
                NombreRemitenteDestinatario: origenDest.nombre,
                FechaHoraSalidaLlegada: fechaHoraSat(v.fecha as string, v.hora_salida as string),
                Domicilio: domicilio(origenDest),
              },
              {
                TipoUbicacion: 'Destino',
                IDUbicacion: 'DE000001',
                RFCRemitenteDestinatario: rfcPara(destinoDest.rfc),
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
                RFCFigura: rfcPara(operador.rfc),
                NumLicencia: operador.licencia || undefined,
              },
            ],
          },
        };
      }
    }

    // El sandbox de Facturama tambien valida que el Nombre del receptor
    // coincida exactamente con el nombre registrado ante el SAT para ese RFC;
    // el cliente real capturado en el catalogo casi nunca lo tiene exacto
    // porque no es el verdadero dueno del RFC. En sandbox se manda siempre el
    // RFC/Nombre/Regimen/C.P. del contribuyente de pruebas oficial del SAT
    // (el mismo que ya se usa como RFC generico en Carta Porte).
    const receptor =
      ambiente === 'sandbox'
        ? { rfc: 'EKU9003173C9', nombre: 'ESCUELA KEMPER URGATE', regimenFiscal: '601', cp: '42501' }
        : {
            rfc: clienteFiscal.rfc as string,
            nombre: clienteFiscal.nombre as string,
            regimenFiscal: (clienteFiscal.regimen_fiscal as string).split(' ')[0],
            cp: (clienteFiscal.cp as string) || '00000',
          };

    const payload: Record<string, unknown> = {
      NameId: complemento ? '36' : '1',
      Currency: f.moneda,
      Folio: f.folio,
      CfdiType: 'I',
      PaymentForm: f.formaPago || '01',
      PaymentMethod: f.metodoPago || 'PUE',
      ExpeditionPlace: (empresa.direccion as string)?.match(/\b\d{5}\b/)?.[0] ?? clienteFiscal.cp ?? '00000',
      Date: fechaHoraLocalMexico(),
      Exportation: '01',
      Issuer: {
        Rfc: rfcEmisor,
        Name: (empresa.razon_social as string) || (empresa.nombre as string),
        FiscalRegime: (empresa.regimen_fiscal as string).split(' ')[0],
      },
      Receiver: {
        Rfc: receptor.rfc,
        Name: receptor.nombre,
        CfdiUse: f.usoCfdi || 'G03',
        FiscalRegime: receptor.regimenFiscal,
        TaxZipCode: receptor.cp,
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
    const ahora = fechaHoraLocalMexico();
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
