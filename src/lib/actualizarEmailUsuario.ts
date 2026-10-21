import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { mensajeDeError } from './errors';

/**
 * Cambia el email de acceso (Supabase Auth) de un usuario existente, ya
 * confirmado -- puede iniciar sesion de inmediato con el nuevo email. Llama
 * a la Edge Function "actualizar-email-usuario" (unica que puede usar la
 * Admin API de Supabase, via la service_role key, que nunca toca el
 * navegador).
 */
export async function actualizarEmailUsuario(usuarioId: string, nuevoEmail: string): Promise<{ ok: true } | { error: string }> {
  const { data, error } = await supabase.functions.invoke<{ ok: boolean }>('actualizar-email-usuario', {
    body: { usuarioId, nuevoEmail },
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
  if (!data?.ok) {
    return { error: 'No se pudo actualizar el email. Intenta de nuevo.' };
  }
  return { ok: true };
}
