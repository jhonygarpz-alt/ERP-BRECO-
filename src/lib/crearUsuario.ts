import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { mensajeDeError } from './errors';

/**
 * Da de alta la cuenta de acceso (Supabase Auth) de un usuario nuevo, ya
 * confirmada -- puede iniciar sesion de inmediato con la liga del sistema,
 * sin que nadie tenga que confirmarla a mano desde el dashboard de Supabase.
 * Llama a la Edge Function "crear-usuario" (unica que puede usar la Admin
 * API de Supabase, via la service_role key, que nunca toca el navegador).
 */
export async function crearUsuarioAuth(email: string, password: string): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabase.functions.invoke<{ id: string }>('crear-usuario', {
    body: { email, password },
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
  if (!data?.id) {
    return { error: 'No se pudo crear el usuario. Intenta de nuevo.' };
  }
  return { id: data.id };
}
