import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export interface ColoniaSugerida {
  colonia: string;
  municipio: string;
  estado: string;
}

/** Colonias reales de un C.P. de 5 digitos, segun el Catalogo Nacional de Codigos Postales cargado en Supabase. */
export function useColoniasPorCP(cp: string): ColoniaSugerida[] {
  const [colonias, setColonias] = useState<ColoniaSugerida[]>([]);

  useEffect(() => {
    const limpio = cp.trim();
    if (!/^\d{5}$/.test(limpio)) {
      setColonias([]);
      return;
    }
    let cancelado = false;
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('codigos_postales_mx')
        .select('colonia, municipio, estado')
        .eq('codigo_postal', limpio);
      if (!cancelado) setColonias(data ?? []);
    }, 350);
    return () => {
      cancelado = true;
      clearTimeout(timeout);
    };
  }, [cp]);

  return colonias;
}
