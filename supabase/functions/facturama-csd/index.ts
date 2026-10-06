// Edge Function: registra/actualiza/consulta/elimina el CSD (certificado de
// sello digital) de la empresa que llama ante el PAC Facturama, usando su
// API Multiemisor -- cada empresa (tenant) del ERP timbra bajo su PROPIO
// RFC, no bajo el de SECUREFLEET CONSULTING. El certificado (.cer), la
// llave privada (.key) y su contrasena viajan del navegador a este
// servidor y de aqui directo a Facturama: el ERP nunca los guarda en su
// base de datos, solo el estatus que Facturama regresa (registrado si/no,
// vigencia).
//
// Necesita ser una Edge Function porque las credenciales de la cuenta
// Facturama (usuario/contrasena para HTTP Basic Auth) son secretos del
// servidor (FACTURAMA_SANDBOX_USER/PASSWORD, luego FACTURAMA_PROD_USER/
// PASSWORD) que nunca deben llegar al navegador.
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

type Accion = 'registrar' | 'actualizar' | 'eliminar' | 'consultar';

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
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    const body = await req.json();
    const accion = body.accion as Accion;
    if (!['registrar', 'actualizar', 'eliminar', 'consultar'].includes(accion)) {
      return jsonResponse({ error: 'Accion invalida.' }, 400);
    }

    // Cliente "como el usuario que llama": solo para verificar permiso y
    // leer SU PROPIA empresa (RLS ya la acota a empresa_id = current_empresa_id()).
    const clienteLlamante = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: puedeEditar } = await clienteLlamante.rpc('has_permission', {
      p_modulo: 'Configuracion',
      p_accion: 'editar',
    });
    if (!puedeEditar) {
      return jsonResponse({ error: 'No tienes permiso para administrar la facturacion electronica.' }, 403);
    }

    const { data: empresa, error: errEmpresa } = await clienteLlamante
      .from('empresas')
      .select('id, rfc, facturama_ambiente')
      .single();
    if (errEmpresa || !empresa) {
      return jsonResponse({ error: 'No se encontro la empresa del usuario.' }, 404);
    }
    const rfc = (empresa.rfc as string | null)?.trim().toUpperCase();
    if (!rfc) {
      return jsonResponse({ error: 'Primero captura el RFC de tu empresa en Configuracion.' }, 400);
    }

    const ambiente = (empresa.facturama_ambiente as string) ?? 'sandbox';
    const credenciales = credencialesPara(ambiente);
    if (!credenciales) {
      return jsonResponse({ error: `Faltan las credenciales del PAC (ambiente "${ambiente}") en el servidor.` }, 500);
    }
    const authFacturama = 'Basic ' + btoa(`${credenciales.usuario}:${credenciales.contrasena}`);
    const baseUrl = baseUrlPara(ambiente);

    const admin = createClient(supabaseUrl, serviceRoleKey);

    if (accion === 'registrar' || accion === 'actualizar') {
      const { certificadoBase64, llaveBase64, password } = body as {
        certificadoBase64?: string;
        llaveBase64?: string;
        password?: string;
      };
      if (!certificadoBase64 || !llaveBase64 || !password) {
        return jsonResponse({ error: 'Falta el certificado (.cer), la llave (.key) o la contrasena.' }, 400);
      }

      const metodo = accion === 'registrar' ? 'POST' : 'PUT';
      const url = accion === 'registrar' ? `${baseUrl}/api-lite/csds` : `${baseUrl}/api-lite/csds/${rfc}`;
      const respuesta = await fetch(url, {
        method: metodo,
        headers: { Authorization: authFacturama, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Rfc: rfc,
          Certificate: certificadoBase64,
          PrivateKey: llaveBase64,
          PrivateKeyPassword: password,
        }),
      });

      if (!respuesta.ok) {
        const texto = await respuesta.text();
        return jsonResponse({ error: `El PAC rechazo el CSD: ${texto || respuesta.statusText}` }, 400);
      }

      await admin
        .from('empresas')
        .update({ facturama_csd_registrado: true, facturama_csd_actualizado_en: new Date().toISOString() })
        .eq('id', empresa.id);

      return jsonResponse({ ok: true }, 200);
    }

    if (accion === 'eliminar') {
      const respuesta = await fetch(`${baseUrl}/api-lite/csds/${rfc}`, {
        method: 'DELETE',
        headers: { Authorization: authFacturama },
      });
      if (!respuesta.ok && respuesta.status !== 404) {
        const texto = await respuesta.text();
        return jsonResponse({ error: `El PAC no pudo eliminar el CSD: ${texto || respuesta.statusText}` }, 400);
      }

      await admin
        .from('empresas')
        .update({
          facturama_csd_registrado: false,
          facturama_csd_vigencia_hasta: null,
          facturama_csd_actualizado_en: new Date().toISOString(),
        })
        .eq('id', empresa.id);

      return jsonResponse({ ok: true }, 200);
    }

    // accion === 'consultar'
    const respuesta = await fetch(`${baseUrl}/api-lite/csds/${rfc}`, {
      method: 'GET',
      headers: { Authorization: authFacturama },
    });
    if (respuesta.status === 404) {
      await admin.from('empresas').update({ facturama_csd_registrado: false }).eq('id', empresa.id);
      return jsonResponse({ registrado: false }, 200);
    }
    if (!respuesta.ok) {
      const texto = await respuesta.text();
      return jsonResponse({ error: `El PAC no pudo consultar el CSD: ${texto || respuesta.statusText}` }, 400);
    }
    const datos = await respuesta.json();
    const vigencia = (datos?.CsdExpirationDate as string | undefined) ?? null;
    await admin
      .from('empresas')
      .update({ facturama_csd_registrado: true, facturama_csd_vigencia_hasta: vigencia })
      .eq('id', empresa.id);
    return jsonResponse({ registrado: true, vigenciaHasta: vigencia }, 200);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Error inesperado.' }, 500);
  }
});
