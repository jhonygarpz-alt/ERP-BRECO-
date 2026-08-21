import { useCallback, useEffect, useState } from 'react';

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function readFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Persists a list of records to localStorage and exposes basic CRUD helpers.
 * This is the only data layer for the app: no backend exists yet, so each
 * catalog/tab owns its own key and everything lives in the browser.
 */
export function useCollection<T extends { id: string }>(key: string, seed: T[]) {
  const storageKey = `breco-erp:${key}`;
  const [items, setItems] = useState<T[]>(() => readFromStorage(storageKey, seed));

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [storageKey, items]);

  const add = useCallback((item: T) => {
    setItems((prev) => [item, ...prev]);
  }, []);

  const update = useCallback((id: string, patch: Partial<T>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  return { items, add, update, remove, setItems };
}
