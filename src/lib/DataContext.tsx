import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useSupabaseCollection } from './supabaseCollection';
import {
  cajaFromRow,
  cajaToRow,
  clasificacionOperadorFromRow,
  clasificacionOperadorToRow,
  clasificacionViajeFromRow,
  clasificacionViajeToRow,
  clienteFromRow,
  clienteToRow,
  conceptoFacturacionFromRow,
  conceptoFacturacionToRow,
  cuentaBancariaFromRow,
  cuentaBancariaToRow,
  destinatarioFromRow,
  destinatarioToRow,
  empresaFromRow,
  empresaToRow,
  entregaTurnoNotaFromRow,
  entregaTurnoNotaToRow,
  entregaTurnoUnidadFromRow,
  entregaTurnoUnidadToRow,
  estatusUnidadFromRow,
  estatusUnidadToRow,
  estatusViajeFromRow,
  estatusViajeToRow,
  facturaFromRow,
  facturaToRow,
  facturaSistemaFromRow,
  facturaSistemaToRow,
  grupoUnidadFromRow,
  grupoUnidadToRow,
  operadorFromRow,
  operadorToRow,
  proveedorFromRow,
  proveedorToRow,
  reporteFromRow,
  reporteToRow,
  rolFromRow,
  rolToRow,
  rutaFromRow,
  rutaToRow,
  tipoViajeFromRow,
  tipoViajeToRow,
  unidadFromRow,
  unidadToRow,
  usuarioFromRow,
  usuarioToRow,
  viajeFromRow,
  viajeToRow,
  viajeUbicacionFromRow,
  viajeUbicacionToRow,
} from './mappers';
import { seedEmpresa } from './seed';
import type {
  Caja,
  ClasificacionOperador,
  ClasificacionViaje,
  Cliente,
  ConceptoFacturacion,
  CuentaBancaria,
  Destinatario,
  Empresa,
  EntregaTurnoNota,
  EntregaTurnoUnidad,
  EstatusUnidadCustom,
  EstatusViajeCustom,
  Factura,
  FacturaSistema,
  GrupoUnidad,
  Operador,
  Proveedor,
  ReporteExterno,
  Rol,
  Ruta,
  TipoViaje,
  Unidad,
  Usuario,
  Viaje,
  ViajeUbicacion,
} from '../types';

interface DataContextValue {
  clientes: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Cliente>>;
  destinatarios: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Destinatario>>;
  unidades: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Unidad>>;
  cajas: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Caja>>;
  operadores: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Operador>>;
  proveedores: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Proveedor>>;
  cuentasBancarias: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, CuentaBancaria>>;
  estatusUnidades: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, EstatusUnidadCustom>>;
  clasificacionesViaje: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, ClasificacionViaje>>;
  clasificacionesOperador: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, ClasificacionOperador>>;
  conceptosFacturacion: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, ConceptoFacturacion>>;
  gruposUnidad: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, GrupoUnidad>>;
  rutas: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Ruta>>;
  tiposViaje: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, TipoViaje>>;
  viajes: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Viaje>>;
  viajeUbicaciones: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, ViajeUbicacion>>;
  estatusViajes: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, EstatusViajeCustom>>;
  entregaTurnoUnidades: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, EntregaTurnoUnidad>>;
  entregaTurnoNotas: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, EntregaTurnoNota>>;
  facturas: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Factura>>;
  facturasSistema: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, FacturaSistema>>;
  reportes: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, ReporteExterno>>;
  empresas: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Empresa>>;
  /** Compatibilidad: la empresa del usuario conectado (antes era una tabla singleton "empresa"). */
  empresa: { value: Empresa; update: (patch: Partial<Empresa>) => Promise<void> };
  usuarios: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Usuario>>;
  roles: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Rol>>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const clientes = useSupabaseCollection<Record<string, unknown>, Cliente>('clientes', clienteFromRow, clienteToRow);
  const destinatarios = useSupabaseCollection<Record<string, unknown>, Destinatario>(
    'destinatarios',
    destinatarioFromRow,
    destinatarioToRow,
  );
  const unidades = useSupabaseCollection<Record<string, unknown>, Unidad>('unidades', unidadFromRow, unidadToRow);
  const cajas = useSupabaseCollection<Record<string, unknown>, Caja>('cajas', cajaFromRow, cajaToRow);
  const operadores = useSupabaseCollection<Record<string, unknown>, Operador>(
    'operadores',
    operadorFromRow,
    operadorToRow,
  );
  const proveedores = useSupabaseCollection<Record<string, unknown>, Proveedor>(
    'proveedores',
    proveedorFromRow,
    proveedorToRow,
  );
  const cuentasBancarias = useSupabaseCollection<Record<string, unknown>, CuentaBancaria>(
    'cuentas_bancarias',
    cuentaBancariaFromRow,
    cuentaBancariaToRow,
  );
  const estatusUnidades = useSupabaseCollection<Record<string, unknown>, EstatusUnidadCustom>(
    'estatus_unidad',
    estatusUnidadFromRow,
    estatusUnidadToRow,
  );
  const clasificacionesViaje = useSupabaseCollection<Record<string, unknown>, ClasificacionViaje>(
    'clasificaciones_viaje',
    clasificacionViajeFromRow,
    clasificacionViajeToRow,
  );
  const clasificacionesOperador = useSupabaseCollection<Record<string, unknown>, ClasificacionOperador>(
    'clasificaciones_operador',
    clasificacionOperadorFromRow,
    clasificacionOperadorToRow,
  );
  const conceptosFacturacion = useSupabaseCollection<Record<string, unknown>, ConceptoFacturacion>(
    'conceptos_facturacion',
    conceptoFacturacionFromRow,
    conceptoFacturacionToRow,
  );
  const gruposUnidad = useSupabaseCollection<Record<string, unknown>, GrupoUnidad>(
    'grupos_unidad',
    grupoUnidadFromRow,
    grupoUnidadToRow,
  );
  const rutas = useSupabaseCollection<Record<string, unknown>, Ruta>('rutas', rutaFromRow, rutaToRow);
  const tiposViaje = useSupabaseCollection<Record<string, unknown>, TipoViaje>(
    'tipos_viaje',
    tipoViajeFromRow,
    tipoViajeToRow,
  );
  const viajes = useSupabaseCollection<Record<string, unknown>, Viaje>('viajes', viajeFromRow, viajeToRow);
  const viajeUbicaciones = useSupabaseCollection<Record<string, unknown>, ViajeUbicacion>(
    'viaje_ubicacion',
    viajeUbicacionFromRow,
    viajeUbicacionToRow,
  );
  const estatusViajes = useSupabaseCollection<Record<string, unknown>, EstatusViajeCustom>(
    'estatus_viaje',
    estatusViajeFromRow,
    estatusViajeToRow,
  );
  const entregaTurnoUnidades = useSupabaseCollection<Record<string, unknown>, EntregaTurnoUnidad>(
    'entrega_turno_unidad',
    entregaTurnoUnidadFromRow,
    entregaTurnoUnidadToRow,
  );
  const entregaTurnoNotas = useSupabaseCollection<Record<string, unknown>, EntregaTurnoNota>(
    'entrega_turno_nota',
    entregaTurnoNotaFromRow,
    entregaTurnoNotaToRow,
  );
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
  const empresas = useSupabaseCollection<Record<string, unknown>, Empresa>('empresas', empresaFromRow, empresaToRow);
  const usuarios = useSupabaseCollection<Record<string, unknown>, Usuario>('usuarios', usuarioFromRow, usuarioToRow);
  const roles = useSupabaseCollection<Record<string, unknown>, Rol>('roles', rolFromRow, rolToRow);

  // Compatibilidad hacia atras: decenas de paginas ya usan
  // useData().empresa.value / .update() como si fuera una fila unica (asi
  // era antes, con la tabla singleton "empresa"). Ahora "empresas" es una
  // coleccion real con RLS, pero para un usuario normal (no super admin)
  // siempre trae exactamente su propia empresa -- por eso items[0] alcanza.
  const empresa = useMemo(
    () => ({
      value: empresas.items[0] ?? seedEmpresa,
      update: async (patch: Partial<Empresa>) => {
        const actual = empresas.items[0];
        if (actual) await empresas.update(actual.id, patch);
      },
    }),
    [empresas],
  );

  return (
    <DataContext.Provider
      value={{
        clientes,
        destinatarios,
        unidades,
        cajas,
        operadores,
        proveedores,
        cuentasBancarias,
        estatusUnidades,
        clasificacionesViaje,
        clasificacionesOperador,
        conceptosFacturacion,
        gruposUnidad,
        rutas,
        tiposViaje,
        viajes,
        viajeUbicaciones,
        estatusViajes,
        entregaTurnoUnidades,
        entregaTurnoNotas,
        facturas,
        facturasSistema,
        reportes,
        empresas,
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
