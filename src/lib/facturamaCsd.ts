import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { mensajeDeError } from './errors';

type AccionCsd = 'registrar' | 'actualizar' | 'eliminar' | 'consultar';

type RespuestaCsd = { ok?: boolean; registrado?: boolean; vigenciaHasta?: string | null };

async function invocar(body: Record<string, unknown>): Promise<RespuestaCsd | { error: string }> {
  const { data, error } = await supabase.functions.invoke<RespuestaCsd>('facturama-csd', { body });

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
  return data ?? { error: 'Sin respuesta del servidor.' };
}

function leerArchivoBase64(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const resultado = reader.result as string;
      // "data:application/x-x509-ca-cert;base64,XXXXX" -> solo lo de despues de la coma.
      resolve(resultado.slice(resultado.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(archivo);
  });
}

/** Registra (o actualiza, si ya existia) el CSD de la empresa ante el PAC Facturama. */
export async function registrarCsdFacturama(
  certificado: File,
  llave: File,
  password: string,
  accion: Extract<AccionCsd, 'registrar' | 'actualizar'> = 'registrar',
): Promise<{ error?: string }> {
  const [certificadoBase64, llaveBase64] = await Promise.all([leerArchivoBase64(certificado), leerArchivoBase64(llave)]);
  const resultado = await invocar({ accion, certificadoBase64, llaveBase64, password });
  if ('error' in resultado) return { error: resultado.error };
  return {};
}

export async function eliminarCsdFacturama(): Promise<{ error?: string }> {
  const resultado = await invocar({ accion: 'eliminar' });
  if ('error' in resultado) return { error: resultado.error };
  return {};
}

export async function consultarCsdFacturama(): Promise<{ registrado: boolean; vigenciaHasta?: string | null; error?: string }> {
  const resultado = await invocar({ accion: 'consultar' });
  if ('error' in resultado) return { registrado: false, error: resultado.error };
  return { registrado: resultado.registrado ?? false, vigenciaHasta: resultado.vigenciaHasta };
}
