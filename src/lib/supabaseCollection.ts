import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

/**
 * Colección respaldada en una tabla real de Supabase (Postgres + RLS), en
 * vez de localStorage. Misma forma que el viejo useCollection ({items, add,
 * update, remove}) para que las paginas no tengan que cambiar.
 *
 * No usa Realtime todavia: cada mutacion vuelve a pedir los datos, y ademas
 * se vuelve a pedir cuando cambia la sesion (login/logout), asi que los
 * datos son los mismos para todos, pero para verlos actualizarse en otra
 * pestaña sin recargar hace falta agregar Realtime mas adelante.
 */
export function useSupabaseCollection<Row extends Record<string, unknown>, Item extends { id: string }>(
  table: string,
  fromRow: (row: Row) => Item,
  toRow: (item: Item) => Row,
) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.error(`Error cargando ${table}:`, error.message);
      setLoading(false);
      return;
    }
    setItems((data as Row[]).map(fromRow));
    setLoading(false);
  }, [table, fromRow]);

  useEffect(() => {
    load();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => listener.subscription.unsubscribe();
  }, [load]);

  const add = useCallback(
    async (item: Item) => {
      const { error } = await supabase.from(table).insert(toRow(item) as never);
      if (error) {
        alert(`No se pudo guardar: ${error.message}`);
        return;
      }
      await load();
    },
    [table, toRow, load],
  );

  const update = useCallback(
    async (id: string, patch: Partial<Item>) => {
      const actual = items.find((it) => it.id === id);
      if (!actual) return;
      const { error } = await supabase
        .from(table)
        .update(toRow({ ...actual, ...patch }) as never)
        .eq('id', id);
      if (error) {
        alert(`No se pudo actualizar: ${error.message}`);
        return;
      }
      await load();
    },
    [table, toRow, load, items],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) {
        alert(`No se pudo eliminar: ${error.message}`);
        return;
      }
      await load();
    },
    [table, load],
  );

  return { items, add, update, remove, loading };
}
