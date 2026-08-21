import { createContext, useContext, type ReactNode } from 'react';
import { useCollection, useSingleton } from './storage';
import {
  seedCajas,
  seedClientes,
  seedEmpresa,
  seedFacturas,
  seedOperadores,
  seedRoles,
  seedUnidades,
  seedUsuarios,
  seedViajes,
} from './seed';
import type { Caja, Cliente, Empresa, Factura, Operador, Rol, Unidad, Usuario, Viaje } from '../types';

interface DataContextValue {
  clientes: ReturnType<typeof useCollection<Cliente>>;
  unidades: ReturnType<typeof useCollection<Unidad>>;
  cajas: ReturnType<typeof useCollection<Caja>>;
  operadores: ReturnType<typeof useCollection<Operador>>;
  viajes: ReturnType<typeof useCollection<Viaje>>;
  facturas: ReturnType<typeof useCollection<Factura>>;
  empresa: ReturnType<typeof useSingleton<Empresa>>;
  usuarios: ReturnType<typeof useCollection<Usuario>>;
  roles: ReturnType<typeof useCollection<Rol>>;
}

const DataContext = createContext<DataContextValue | null>(null);

// Se incrementa cada vez que se carga un nuevo snapshot de datos reales
// (unidades, operadores, clientes, viajes). Los navegadores que se hayan
// quedado en una version anterior se actualizan una sola vez con los datos
// nuevos; lo configurado en Configuracion (empresa, usuarios, roles) nunca
// se toca.
const SEED_VERSION = '3';

function ensureSeedVersion() {
  const key = 'breco-erp:seed-version';
  if (window.localStorage.getItem(key) === SEED_VERSION) return;
  ['clientes', 'unidades', 'cajas', 'operadores', 'viajes', 'facturas'].forEach((k) =>
    window.localStorage.removeItem(`breco-erp:${k}`),
  );
  window.localStorage.setItem(key, SEED_VERSION);
}

export function DataProvider({ children }: { children: ReactNode }) {
  ensureSeedVersion();
  const clientes = useCollection<Cliente>('clientes', seedClientes);
  const unidades = useCollection<Unidad>('unidades', seedUnidades);
  const cajas = useCollection<Caja>('cajas', seedCajas);
  const operadores = useCollection<Operador>('operadores', seedOperadores);
  const viajes = useCollection<Viaje>('viajes', seedViajes);
  const facturas = useCollection<Factura>('facturas', seedFacturas);
  const empresa = useSingleton<Empresa>('empresa', seedEmpresa);
  const usuarios = useCollection<Usuario>('usuarios', seedUsuarios, (u) => ({
    ...u,
    password: u.password || 'breco2026',
  }));
  const roles = useCollection<Rol>('roles', seedRoles);

  return (
    <DataContext.Provider
      value={{ clientes, unidades, cajas, operadores, viajes, facturas, empresa, usuarios, roles }}
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
