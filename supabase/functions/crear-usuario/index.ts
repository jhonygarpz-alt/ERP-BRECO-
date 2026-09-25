// Edge Function: crea un usuario de Supabase Auth YA CONFIRMADO (email_confirm:
// true), para que pueda iniciar sesion de inmediato con la liga del sistema sin
// que nadie tenga que confirmarlo a mano desde el dashboard de Supabase.
//
// Se necesita una funcion de servidor para esto porque solo la Admin API de
// Supabase (auth.admin.createUser) puede crear una cuenta ya confirmada, y esa
// API requiere la service_role key -- una clave que NUNCA debe mandarse al
// navegador (da acceso total a la base saltandose RLS). Aqui vive solo del
// lado del servidor; el frontend nunca la ve.
//
// Quien puede llamar esta funcion: un usuario ya logueado que tenga permiso
// 'Configuracion' -> 'crear' (Configuracion > Usuarios) o que sea super admin
// (panel de Super Admin > Empresas, para crear el primer admin de una empresa
// nueva) -- se reutiliza la misma logica de permisos (has_permission /
// es_super_admin) que ya protege el resto del sistema via RLS, en vez de
// duplicarla aqui.
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
    const { email, password } = await req.json();
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string' || password.length < 6) {
      return jsonResponse({ error: 'Falta email o la contrasena tiene menos de 6 caracteres.' }, 400);
    }

    // Cliente "como el usuario que llama" (con su propio token, no la
    // service_role key) -- solo para verificar sus permisos reutilizando
    // has_permission/es_super_admin, tal cual las usa el resto del sistema.
    const clienteLlamante = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const [{ data: puedeCrear }, { data: esSuperAdmin }] = await Promise.all([
      clienteLlamante.rpc('has_permission', { p_modulo: 'Configuracion', p_accion: 'crear' }),
      clienteLlamante.rpc('es_super_admin'),
    ]);

    if (!puedeCrear && !esSuperAdmin) {
      return jsonResponse({ error: 'No tienes permiso para crear usuarios.' }, 403);
    }

    // Cliente con la service_role key -- unico que puede usar la Admin API.
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await admin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      return jsonResponse({ error: error?.message ?? 'No se pudo crear el usuario.' }, 400);
    }

    return jsonResponse({ id: data.user.id }, 200);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Error inesperado.' }, 500);
  }
});
