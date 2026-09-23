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
  incidenciaViajeFromRow,
  incidenciaViajeToRow,
  mensajeViajeFromRow,
  mensajeViajeToRow,
  pagoClienteFromRow,
  pagoClienteToRow,
  notaCreditoFromRow,
  notaCreditoToRow,
  movimientoBancarioFromRow,
  movimientoBancarioToRow,
  pagoProveedorFromRow,
  pagoProveedorToRow,
  conciliacionBancariaFromRow,
  conciliacionBancariaToRow,
  estatusUnidadFromRow,
  estatusUnidadToRow,
  estatusViajeFromRow,
  estatusViajeToRow,
  facturaFromRow,
  facturaToRow,
  facturaSistemaFromRow,
  facturaSistemaToRow,
  formatoImpresionFromRow,
  formatoImpresionToRow,
  gastoViajeFromRow,
  gastoViajeToRow,
  grupoUnidadFromRow,
  grupoUnidadToRow,
  operadorFromRow,
  operadorToRow,
  parqueHistorialFromRow,
  parqueHistorialToRow,
  parqueNotaFromRow,
  parqueNotaToRow,
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
  EstatusUnidadCustom,
  EstatusViajeCustom,
  Factura,
  FacturaSistema,
  FormatoImpresion,
  GastoViaje,
  GrupoUnidad,
  IncidenciaViaje,
  ConciliacionBancaria,
  MensajeViaje,
  MovimientoBancario,
  NotaCredito,
  PagoCliente,
  PagoProveedor,
  Operador,
  ParqueHistorial,
  ParqueNota,
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
  parqueNotas: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, ParqueNota>>;
  parqueHistorial: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, ParqueHistorial>>;
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
  gastosViaje: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, GastoViaje>>;
  estatusViajes: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, EstatusViajeCustom>>;
  incidenciasViaje: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, IncidenciaViaje>>;
  mensajesViaje: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, MensajeViaje>>;
  facturas: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Factura>>;
  facturasSistema: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, FacturaSistema>>;
  pagosCliente: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, PagoCliente>>;
  notasCredito: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, NotaCredito>>;
  movimientosBancarios: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, MovimientoBancario>>;
  pagosProveedor: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, PagoProveedor>>;
  conciliacionesBancarias: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, ConciliacionBancaria>>;
  reportes: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, ReporteExterno>>;
  formatosImpresion: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, FormatoImpresion>>;
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
  const parqueNotas = useSupabaseCollection<Record<string, unknown>, ParqueNota>(
    'parque_notas',
    parqueNotaFromRow,
    parqueNotaToRow,
  );
  const parqueHistorial = useSupabaseCollection<Record<string, unknown>, ParqueHistorial>(
    'parque_historial',
    parqueHistorialFromRow,
    parqueHistorialToRow,
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
  const formatosImpresion = useSupabaseCollection<Record<string, unknown>, FormatoImpresion>(
    'formatos_impresion',
    formatoImpresionFromRow,
    formatoImpresionToRow,
  );
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
  const gastosViaje = useSupabaseCollection<Record<string, unknown>, GastoViaje>(
    'gastos_viaje',
    gastoViajeFromRow,
    gastoViajeToRow,
  );
  const estatusViajes = useSupabaseCollection<Record<string, unknown>, EstatusViajeCustom>(
    'estatus_viaje',
    estatusViajeFromRow,
    estatusViajeToRow,
  );
  const incidenciasViaje = useSupabaseCollection<Record<string, unknown>, IncidenciaViaje>(
    'incidencias_viaje',
    incidenciaViajeFromRow,
    incidenciaViajeToRow,
  );
  const mensajesViaje = useSupabaseCollection<Record<string, unknown>, MensajeViaje>(
    'comunicacion_viaje',
    mensajeViajeFromRow,
    mensajeViajeToRow,
  );
  const facturas = useSupabaseCollection<Record<string, unknown>, Factura>('facturas', facturaFromRow, facturaToRow);
  const facturasSistema = useSupabaseCollection<Record<string, unknown>, FacturaSistema>(
    'facturas_sistema',
    facturaSistemaFromRow,
    facturaSistemaToRow,
  );
  const pagosCliente = useSupabaseCollection<Record<string, unknown>, PagoCliente>(
    'pagos_cliente',
    pagoClienteFromRow,
    pagoClienteToRow,
  );
  const notasCredito = useSupabaseCollection<Record<string, unknown>, NotaCredito>(
    'notas_credito',
    notaCreditoFromRow,
    notaCreditoToRow,
  );
  const movimientosBancarios = useSupabaseCollection<Record<string, unknown>, MovimientoBancario>(
    'movimientos_bancarios',
    movimientoBancarioFromRow,
    movimientoBancarioToRow,
  );
  const pagosProveedor = useSupabaseCollection<Record<string, unknown>, PagoProveedor>(
    'pagos_proveedor',
    pagoProveedorFromRow,
    pagoProveedorToRow,
  );
  const conciliacionesBancarias = useSupabaseCollection<Record<string, unknown>, ConciliacionBancaria>(
    'conciliaciones_bancarias',
    conciliacionBancariaFromRow,
    conciliacionBancariaToRow,
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
        parqueNotas,
        parqueHistorial,
        cuentasBancarias,
        estatusUnidades,
        clasificacionesViaje,
        clasificacionesOperador,
        conceptosFacturacion,
        gruposUnidad,
        rutas,
        formatosImpresion,
        tiposViaje,
        viajes,
        viajeUbicaciones,
        gastosViaje,
        estatusViajes,
        incidenciasViaje,
        mensajesViaje,
        facturas,
        facturasSistema,
        pagosCliente,
        notasCredito,
        movimientosBancarios,
        pagosProveedor,
        conciliacionesBancarias,
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
