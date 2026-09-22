import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export interface ClaveProdServSugerida {
  clave: string;
  descripcion: string;
}

export interface ClaveUnidadSugerida {
  clave: string;
  nombre: string;
  simbolo: string;
}

const MIN_CARACTERES = 3;
const LIMITE_RESULTADOS = 30;

/** Busca en el catalogo oficial del SAT c_ClaveProdServ (~52,500 claves) por clave o descripcion. */
export function useClaveProdServSat(termino: string): ClaveProdServSugerida[] {
  const [resultados, setResultados] = useState<ClaveProdServSugerida[]>([]);

  useEffect(() => {
    const limpio = termino.trim();
    if (limpio.length < MIN_CARACTERES) {
      setResultados([]);
      return;
    }
    let cancelado = false;
    const timeout = setTimeout(async () => {
      const { data, error } = await supabase
        .from('clave_prod_serv_sat')
        .select('clave, descripcion')
        .or(`clave.ilike.${limpio}%,descripcion.ilike.%${limpio}%`)
        .limit(LIMITE_RESULTADOS);
      if (error) console.error('Error buscando clave_prod_serv_sat:', error);
      if (!cancelado) setResultados(data ?? []);
    }, 350);
    return () => {
      cancelado = true;
      clearTimeout(timeout);
    };
  }, [termino]);

  return resultados;
}

/** Busca en el catalogo oficial del SAT c_ClaveUnidad (~2,400 claves) por clave o nombre. */
export function useClaveUnidadSat(termino: string): ClaveUnidadSugerida[] {
  const [resultados, setResultados] = useState<ClaveUnidadSugerida[]>([]);

  useEffect(() => {
    const limpio = termino.trim();
    if (limpio.length < MIN_CARACTERES) {
      setResultados([]);
      return;
    }
    let cancelado = false;
    const timeout = setTimeout(async () => {
      const { data, error } = await supabase
        .from('clave_unidad_sat')
        .select('clave, nombre, simbolo')
        .or(`clave.ilike.${limpio}%,nombre.ilike.%${limpio}%`)
        .limit(LIMITE_RESULTADOS);
      if (error) console.error('Error buscando clave_unidad_sat:', error);
      if (!cancelado) setResultados(data ?? []);
    }, 350);
    return () => {
      cancelado = true;
      clearTimeout(timeout);
    };
  }, [termino]);

  return resultados;
}
