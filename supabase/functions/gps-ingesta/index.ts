// Edge Function: punto de entrada UNICO y normalizado para recibir posiciones
// reales de CUALQUIER plataforma de rastreo GPS que se conecte a futuro.
//
// Por que existe antes de tener un proveedor conectado: el mapa de Monitoreo
// (src/lib/monitoreoViajes.ts) ya sabe preferir una posicion real sobre la
// calculada en cuanto exista una fila reciente en unidad_posicion_gps -- lo
// unico que falta, cuando el cliente indique que proveedor usar, es un
// adaptador que traduzca EL FORMATO PROPIO de ese proveedor (su webhook o su
// API de consulta) a este mismo cuerpo normalizado y lo llame (o publique
// aqui su webhook directo si el proveedor permite configurar la URL y el
// cuerpo del POST). Mientras tanto, esta funcion no la llama nadie y la
// tabla se queda vacia.
//
// Autenticacion: NO es un usuario del ERP (el llamante es el servidor del
// proveedor de GPS o un script propio), asi que no hay sesion de Supabase
// que validar -- se protege con un secreto compartido en un header, guardado
// como variable de entorno de la funcion (GPS_INGESTA_SECRET), nunca en la
// base de datos ni en el frontend.
//
// La unidad se identifica por Unidad.identificadorGps (catalogo de
// Unidades), no por su id interno, porque ese es el campo que el cliente
// llena con la clave que le dio su proveedor de GPS.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface CuerpoIngesta {
  identificadorGps?: string;
  latitud?: number;
  longitud?: number;
  velocidadKmh?: number;
  rumboGrados?: number;
  fechaHoraGps?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Metodo no permitido.' }, 405);
  }

  const secretoEsperado = Deno.env.get('GPS_INGESTA_SECRET');
  const secretoRecibido = req.headers.get('x-gps-secret');
  if (!secretoEsperado || secretoRecibido !== secretoEsperado) {
    return jsonResponse({ error: 'No autorizado.' }, 401);
  }

  try {
    const body = (await req.json()) as CuerpoIngesta;
    const identificadorGps = body.identificadorGps?.trim();
    const { latitud, longitud } = body;

    if (!identificadorGps || typeof latitud !== 'number' || typeof longitud !== 'number') {
      return jsonResponse({ error: 'Faltan identificadorGps, latitud o longitud.' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: unidad, error: errorUnidad } = await admin
      .from('unidades')
      .select('id, empresa_id')
      .eq('identificador_gps', identificadorGps)
      .maybeSingle();

    if (errorUnidad) {
      return jsonResponse({ error: errorUnidad.message }, 500);
    }
    if (!unidad) {
      return jsonResponse({ error: `Ninguna unidad tiene el identificador GPS "${identificadorGps}".` }, 404);
    }

    const { error: errorUpsert } = await admin.from('unidad_posicion_gps').upsert(
      {
        unidad_id: unidad.id,
        empresa_id: unidad.empresa_id,
        latitud,
        longitud,
        velocidad_kmh: body.velocidadKmh ?? null,
        rumbo_grados: body.rumboGrados ?? null,
        fecha_hora_gps: body.fechaHoraGps ?? new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: 'unidad_id' },
    );

    if (errorUpsert) {
      return jsonResponse({ error: errorUpsert.message }, 500);
    }

    return jsonResponse({ ok: true, unidadId: unidad.id }, 200);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Error inesperado.' }, 500);
  }
});
