import { createContext, useContext, type ReactNode } from 'react';
import { useCollection } from './storage';
import {
  seedCajas,
  seedClientes,
  seedFacturas,
  seedOperadores,
  seedUnidades,
  seedViajes,
} from './seed';
import type { Caja, Cliente, Factura, Operador, Unidad, Viaje } from '../types';

interface DataContextValue {
  clientes: ReturnType<typeof useCollection<Cliente>>;
  unidades: ReturnType<typeof useCollection<Unidad>>;
  cajas: ReturnType<typeof useCollection<Caja>>;
  operadores: ReturnType<typeof useCollection<Operador>>;
  viajes: ReturnType<typeof useCollection<Viaje>>;
  facturas: ReturnType<typeof useCollection<Factura>>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const clientes = useCollection<Cliente>('clientes', seedClientes);
  const unidades = useCollection<Unidad>('unidades', seedUnidades);
  const cajas = useCollection<Caja>('cajas', seedCajas);
  const operadores = useCollection<Operador>('operadores', seedOperadores);
  const viajes = useCollection<Viaje>('viajes', seedViajes);
  const facturas = useCollection<Factura>('facturas', seedFacturas);

  return (
    <DataContext.Provider
      value={{ clientes, unidades, cajas, operadores, viajes, facturas }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData debe usarse dentro de DataProvider');
  return ctx;
}
