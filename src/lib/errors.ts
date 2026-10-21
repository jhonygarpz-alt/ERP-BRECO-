/**
 * Los errores de Supabase (PostgrestError) no son instancias de Error de
 * JavaScript, solo objetos planos con un campo "message" -- por eso
 * "err instanceof Error" no los detecta y se perdia el mensaje real.
 */
export function mensajeDeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return 'Ocurrio un error inesperado.';
}
