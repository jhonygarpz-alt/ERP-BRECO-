import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

/**
 * Igual que useSupabaseCollection pero para una sola fila de una tabla
 * (por ejemplo la fila unica de "empresa"). Empieza con el valor de
 * respaldo (seed) mientras llega el dato real de Supabase.
 */
export function useSupabaseSingleton<Row extends Record<string, unknown>, Item>(
  table: string,
  rowId: string,
  fallback: Item,
  fromRow: (row: Row) => Item,
  toRow: (item: Item) => Partial<Row>,
) {
  const [value, setValue] = useState<Item>(fallback);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from(table).select('*').eq('id', rowId).maybeSingle();
    if (error) {
      console.error(`Error cargando ${table}:`, error.message);
      return;
    }
    if (data) setValue(fromRow(data as Row));
  }, [table, rowId, fromRow]);

  useEffect(() => {
    load();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => listener.subscription.unsubscribe();
  }, [load]);

  const update = useCallback(
    async (patch: Partial<Item>) => {
      const merged = { ...value, ...patch };
      const { error } = await supabase.from(table).update(toRow(merged) as never).eq('id', rowId);
      if (error) {
        alert(`No se pudo guardar: ${error.message}`);
        return;
      }
      setValue(merged);
    },
    [table, rowId, toRow, value],
  );

  return { value, update };
}
