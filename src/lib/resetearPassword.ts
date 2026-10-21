import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { mensajeDeError } from './errors';

/**
 * Le pone una contrasena nueva a un usuario existente sin pedirle que
 * confirme un link por correo -- para que el Super Admin (torre de control)
 * pueda ayudar a cualquier cliente que perdio su contrasena. Llama a la
 * Edge Function "resetear-password" (unica que puede usar la Admin API de
 * Supabase, via la service_role key, que nunca toca el navegador).
 */
export async function resetearPasswordUsuario(usuarioId: string, password: string): Promise<{ ok: true } | { error: string }> {
  const { data, error } = await supabase.functions.invoke<{ ok: boolean }>('resetear-password', {
    body: { usuarioId, password },
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
    return { error: 'No se pudo restablecer la contrasena. Intenta de nuevo.' };
  }
  return { ok: true };
}
