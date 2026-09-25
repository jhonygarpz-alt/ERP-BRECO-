// Edge Function: le pone una contrasena nueva a un usuario ya existente,
// sin necesitar que el confirme un link de recuperacion por correo. Sirve
// para que el Super Admin (torre de control de la plataforma) pueda ayudar
// a cualquier cliente que perdio u olvido su contrasena, sin tocar el
// dashboard de Supabase.
//
// Igual que "crear-usuario", solo la Admin API (auth.admin.updateUserById)
// puede hacer esto, y esa API requiere la service_role key -- que nunca
// debe llegar al navegador. Aqui vive solo del lado del servidor.
//
// Quien puede llamar esta funcion: unicamente el Super Admin (es_super_admin()),
// reutilizando la misma funcion SQL que ya protege el resto del panel de
// Super Admin.
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
    const { usuarioId, password } = await req.json();
    if (!usuarioId || typeof usuarioId !== 'string' || !password || typeof password !== 'string' || password.length < 6) {
      return jsonResponse({ error: 'Falta el usuario o la contrasena tiene menos de 6 caracteres.' }, 400);
    }

    const clienteLlamante = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: esSuperAdmin } = await clienteLlamante.rpc('es_super_admin');
    if (!esSuperAdmin) {
      return jsonResponse({ error: 'Solo el Super Admin puede restablecer contrasenas desde aqui.' }, 403);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await admin.auth.admin.updateUserById(usuarioId, { password });

    if (error) {
      return jsonResponse({ error: error.message ?? 'No se pudo restablecer la contrasena.' }, 400);
    }

    return jsonResponse({ ok: true }, 200);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Error inesperado.' }, 500);
  }
});
