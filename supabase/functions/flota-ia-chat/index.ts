// Edge Function: backend de "Flota IA", el asistente de ayuda embebido en
// el ERP. Solo responde dudas sobre como usar el sistema (ver manual.ts) --
// en esta version NO consulta la base de datos del usuario ni ningun dato
// real de su empresa, asi que no necesita mas permiso que estar
// autenticado.
//
// Necesita ser una Edge Function porque la API key de Anthropic
// (ANTHROPIC_API_KEY) es un secreto del servidor que nunca debe llegar al
// navegador.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { MANUAL_ERP } from './manual.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MODELO = 'claude-sonnet-5-5';
const MAX_TOKENS_RESPUESTA = 700;
const MAX_MENSAJES_HISTORIAL = 20; // evita prompts gigantes si el chat se alarga mucho

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

interface MensajeChat {
  rol: 'user' | 'assistant';
  texto: string;
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
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

  if (!anthropicApiKey) {
    return jsonResponse({ error: 'Falta configurar ANTHROPIC_API_KEY en el servidor.' }, 500);
  }

  try {
    // Solo verificamos que sea un usuario real y autenticado del ERP --
    // esta version no lee ninguna tabla, asi que no hace falta un permiso
    // especifico por modulo.
    const clienteLlamante = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: errUser } = await clienteLlamante.auth.getUser();
    if (errUser || !userData?.user) {
      return jsonResponse({ error: 'Sesion invalida o expirada.' }, 401);
    }

    const body = await req.json();
    const mensajes = body.mensajes as MensajeChat[] | undefined;
    const pantallaActual = typeof body.pantallaActual === 'string' ? body.pantallaActual : null;

    if (!Array.isArray(mensajes) || mensajes.length === 0) {
      return jsonResponse({ error: 'Falta el mensaje.' }, 400);
    }
    const ultimoMensaje = mensajes[mensajes.length - 1];
    if (ultimoMensaje.rol !== 'user' || !ultimoMensaje.texto?.trim()) {
      return jsonResponse({ error: 'El ultimo mensaje debe ser del usuario.' }, 400);
    }

    const historialRecortado = mensajes.slice(-MAX_MENSAJES_HISTORIAL);

    let system = MANUAL_ERP;
    if (pantallaActual) {
      system += `\n\nEl usuario esta viendo ahora mismo la pantalla: "${pantallaActual}". Puedes usar ese contexto si es util, pero responde lo que te pregunten aunque sea sobre otra pantalla.`;
    }

    const respuestaAnthropic = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: MAX_TOKENS_RESPUESTA,
        system,
        messages: historialRecortado.map((m) => ({ role: m.rol, content: m.texto })),
      }),
    });

    if (!respuestaAnthropic.ok) {
      const texto = await respuestaAnthropic.text();
      console.error('Error de Anthropic:', respuestaAnthropic.status, texto);
      return jsonResponse({ error: 'No se pudo contactar al asistente en este momento.' }, 502);
    }

    const datos = await respuestaAnthropic.json();
    const texto = (datos.content ?? [])
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('')
      .trim();

    if (!texto) {
      return jsonResponse({ error: 'El asistente no genero respuesta.' }, 502);
    }

    return jsonResponse({ respuesta: texto }, 200);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Error inesperado.' }, 500);
  }
});
