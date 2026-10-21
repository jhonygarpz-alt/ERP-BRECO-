import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { mensajeDeError } from './errors';

export interface MensajeFlotaIA {
  rol: 'user' | 'assistant';
  texto: string;
}

const TIMEOUT_MS = 25_000;

/** Le pregunta algo a Flota IA, mandando el historial de la conversacion (la Edge Function no guarda memoria entre llamadas). */
export async function preguntarFlotaIA(
  mensajes: MensajeFlotaIA[],
  pantallaActual: string | null,
): Promise<{ respuesta?: string; error?: string }> {
  const controlador = new AbortController();
  // Sin esto, un problema de red que se queda a medias (nunca resuelve ni
  // rechaza) deja el chat diciendo "esta escribiendo..." para siempre.
  const timeoutId = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  try {
    const { data, error } = await supabase.functions.invoke<{ respuesta?: string }>('flota-ia-chat', {
      body: { mensajes, pantallaActual },
      signal: controlador.signal,
    });

    if (error) {
      if (error instanceof FunctionsHttpError) {
        try {
          const cuerpo = await error.context.json();
          if (cuerpo?.error) return { error: cuerpo.error as string };
        } catch {
          // Sin cuerpo JSON legible -- se usa el mensaje generico de abajo.
        }
      }
      return { error: mensajeDeError(error) };
    }
    if (!data?.respuesta) return { error: 'Sin respuesta del asistente.' };
    return { respuesta: data.respuesta };
  } catch (err) {
    if (controlador.signal.aborted) return { error: 'Flota IA tardo demasiado en responder. Intenta de nuevo.' };
    return { error: mensajeDeError(err) };
  } finally {
    clearTimeout(timeoutId);
  }
}
