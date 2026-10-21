// Edge Function: cambia el email de acceso (Supabase Auth) de un usuario ya
// existente, dejandolo confirmado de inmediato (no hace falta que nadie
// confirme un link).
//
// El email en la tabla publica "usuarios" es solo un espejo para mostrarlo
// en la interfaz; el que de verdad se usa para iniciar sesion vive en
// auth.users, y solo la Admin API (auth.admin.updateUserById) puede
// cambiarlo -- esa API requiere la service_role key, que nunca debe llegar
// al navegador. Por eso este cambio necesita una funcion de servidor,
// igual que "crear-usuario" y "resetear-password".
//
// Quien puede llamar esta funcion: un usuario con permiso 'Configuracion'
// -> 'editar' (Configuracion > Usuarios) o el super admin. Ademas, si quien
// llama no es super admin, se confirma que el usuario a editar pertenezca a
// su misma empresa consultandolo con su propio token (RLS ya lo filtra por
// empresa) -- asi un admin nunca puede tocar el email de un usuario de otra
// empresa.
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
    const { usuarioId, nuevoEmail } = await req.json();
    if (!usuarioId || typeof usuarioId !== 'string' || !nuevoEmail || typeof nuevoEmail !== 'string' || !nuevoEmail.includes('@')) {
      return jsonResponse({ error: 'Falta el usuario o el email no es valido.' }, 400);
    }

    const clienteLlamante = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const [{ data: puedeEditar }, { data: esSuperAdmin }] = await Promise.all([
      clienteLlamante.rpc('has_permission', { p_modulo: 'Configuracion', p_accion: 'editar' }),
      clienteLlamante.rpc('es_super_admin'),
    ]);

    if (!puedeEditar && !esSuperAdmin) {
      return jsonResponse({ error: 'No tienes permiso para editar usuarios.' }, 403);
    }

    // Si no es super admin, confirma (via RLS, con su propio token) que el
    // usuario a editar es de su misma empresa antes de tocar nada.
    if (!esSuperAdmin) {
      const { data: fila } = await clienteLlamante.from('usuarios').select('id').eq('id', usuarioId).maybeSingle();
      if (!fila) {
        return jsonResponse({ error: 'No se encontro ese usuario en tu empresa.' }, 404);
      }
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await admin.auth.admin.updateUserById(usuarioId, {
      email: nuevoEmail.trim(),
      email_confirm: true,
    });

    if (error) {
      return jsonResponse({ error: error.message ?? 'No se pudo actualizar el email.' }, 400);
    }

    return jsonResponse({ ok: true }, 200);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Error inesperado.' }, 500);
  }
});
