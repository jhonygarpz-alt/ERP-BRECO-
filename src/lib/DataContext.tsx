import { createContext, useContext, type ReactNode } from 'react';
import { useSupabaseCollection } from './supabaseCollection';
import { useSupabaseSingleton } from './supabaseSingleton';
import {
  cajaFromRow,
  cajaToRow,
  clienteFromRow,
  clienteToRow,
  empresaFromRow,
  empresaToRow,
  facturaFromRow,
  facturaToRow,
  facturaSistemaFromRow,
  facturaSistemaToRow,
  operadorFromRow,
  operadorToRow,
  reporteFromRow,
  reporteToRow,
  rolFromRow,
  rolToRow,
  unidadFromRow,
  unidadToRow,
  usuarioFromRow,
  usuarioToRow,
  viajeFromRow,
  viajeToRow,
} from './mappers';
import { seedEmpresa } from './seed';
import type {
  Caja,
  Cliente,
  Empresa,
  Factura,
  FacturaSistema,
  Operador,
  ReporteExterno,
  Rol,
  Unidad,
  Usuario,
  Viaje,
} from '../types';

interface DataContextValue {
  clientes: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Cliente>>;
  unidades: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Unidad>>;
  cajas: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Caja>>;
  operadores: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Operador>>;
  viajes: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Viaje>>;
  facturas: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Factura>>;
  facturasSistema: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, FacturaSistema>>;
  reportes: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, ReporteExterno>>;
  empresa: ReturnType<typeof useSupabaseSingleton<Record<string, unknown>, Empresa>>;
  usuarios: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Usuario>>;
  roles: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Rol>>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const clientes = useSupabaseCollection<Record<string, unknown>, Cliente>('clientes', clienteFromRow, clienteToRow);
  const unidades = useSupabaseCollection<Record<string, unknown>, Unidad>('unidades', unidadFromRow, unidadToRow);
  const cajas = useSupabaseCollection<Record<string, unknown>, Caja>('cajas', cajaFromRow, cajaToRow);
  const operadores = useSupabaseCollection<Record<string, unknown>, Operador>(
    'operadores',
    operadorFromRow,
    operadorToRow,
  );
  const viajes = useSupabaseCollection<Record<string, unknown>, Viaje>('viajes', viajeFromRow, viajeToRow);
  const facturas = useSupabaseCollection<Record<string, unknown>, Factura>('facturas', facturaFromRow, facturaToRow);
  const facturasSistema = useSupabaseCollection<Record<string, unknown>, FacturaSistema>(
    'facturas_sistema',
    facturaSistemaFromRow,
    facturaSistemaToRow,
  );
  const reportes = useSupabaseCollection<Record<string, unknown>, ReporteExterno>(
    'reportes',
    reporteFromRow,
    reporteToRow,
  );
  const empresa = useSupabaseSingleton<Record<string, unknown>, Empresa>(
    'empresa',
    'main',
    seedEmpresa,
    empresaFromRow,
    empresaToRow,
  );
  const usuarios = useSupabaseCollection<Record<string, unknown>, Usuario>('usuarios', usuarioFromRow, usuarioToRow);
  const roles = useSupabaseCollection<Record<string, unknown>, Rol>('roles', rolFromRow, rolToRow);

  return (
    <DataContext.Provider
      value={{
        clientes,
        unidades,
        cajas,
        operadores,
        viajes,
        facturas,
        facturasSistema,
        reportes,
        empresa,
        usuarios,
        roles,
      }}
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
