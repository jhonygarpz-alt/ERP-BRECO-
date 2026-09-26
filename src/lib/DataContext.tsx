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
  clasificacionServicioFromRow,
  clasificacionServicioToRow,
  catalogoServicioFromRow,
  catalogoServicioToRow,
  mecanicoFromRow,
  mecanicoToRow,
  planServicioFromRow,
  planServicioToRow,
  reporteFallaFromRow,
  reporteFallaToRow,
  ordenServicioFromRow,
  ordenServicioToRow,
  checklistFisicomecanicoFromRow,
  checklistFisicomecanicoToRow,
  ticketSoporteFromRow,
  ticketSoporteToRow,
  almacenFromRow,
  almacenToRow,
  articuloFromRow,
  articuloToRow,
  tipoMovimientoAlmacenFromRow,
  tipoMovimientoAlmacenToRow,
  cotizacionFromRow,
  cotizacionToRow,
  requisicionFromRow,
  requisicionToRow,
  ordenCompraFromRow,
  ordenCompraToRow,
  compraFromRow,
  compraToRow,
  movimientoAlmacenFromRow,
  movimientoAlmacenToRow,
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
  folioAutorizadoFromRow,
  folioAutorizadoToRow,
  gastoViajeFromRow,
  gastoViajeToRow,
  deduccionOperadorFromRow,
  deduccionOperadorToRow,
  descuentoOperadorFromRow,
  descuentoOperadorToRow,
  abonoDescuentoOperadorFromRow,
  abonoDescuentoOperadorToRow,
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
  unidadInspeccionFromRow,
  unidadInspeccionToRow,
  unidadFotoFromRow,
  unidadFotoToRow,
  unidadHotspotFromRow,
  unidadHotspotToRow,
  unidadDanoFromRow,
  unidadDanoToRow,
  usuarioFromRow,
  usuarioToRow,
  valeCombustibleFromRow,
  valeCombustibleToRow,
  viajeFromRow,
  viajeToRow,
  viajeUbicacionFromRow,
  viajeUbicacionToRow,
} from './mappers';
import { seedEmpresa } from './seed';
import type {
  Almacen,
  Articulo,
  Caja,
  CatalogoServicio,
  ChecklistFisicomecanico,
  ClasificacionOperador,
  ClasificacionServicio,
  ClasificacionViaje,
  Cliente,
  Compra,
  ConceptoFacturacion,
  Cotizacion,
  CuentaBancaria,
  Destinatario,
  Empresa,
  EstatusUnidadCustom,
  EstatusViajeCustom,
  Factura,
  FacturaSistema,
  FormatoImpresion,
  FolioAutorizado,
  GastoViaje,
  DeduccionOperador,
  DescuentoOperador,
  AbonoDescuentoOperador,
  GrupoUnidad,
  IncidenciaViaje,
  ConciliacionBancaria,
  Mecanico,
  MensajeViaje,
  MovimientoAlmacen,
  MovimientoBancario,
  NotaCredito,
  OrdenCompra,
  OrdenServicio,
  PagoCliente,
  PagoProveedor,
  Operador,
  ParqueHistorial,
  ParqueNota,
  PlanServicio,
  Proveedor,
  ReporteExterno,
  ReporteFalla,
  Requisicion,
  Rol,
  Ruta,
  TicketSoporte,
  TipoMovimientoAlmacen,
  TipoViaje,
  Unidad,
  UnidadInspeccion,
  UnidadFoto,
  UnidadHotspot,
  UnidadDano,
  Usuario,
  ValeCombustible,
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
  valesCombustible: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, ValeCombustible>>;
  deduccionesOperador: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, DeduccionOperador>>;
  descuentosOperador: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, DescuentoOperador>>;
  abonosDescuentoOperador: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, AbonoDescuentoOperador>>;
  unidadInspecciones: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, UnidadInspeccion>>;
  unidadFotos: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, UnidadFoto>>;
  unidadHotspots: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, UnidadHotspot>>;
  unidadDanos: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, UnidadDano>>;
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
  clasificacionesServicio: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, ClasificacionServicio>>;
  catalogoServicios: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, CatalogoServicio>>;
  mecanicos: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Mecanico>>;
  planesServicio: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, PlanServicio>>;
  reportesFalla: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, ReporteFalla>>;
  ordenesServicio: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, OrdenServicio>>;
  checklistsFisicomecanicos: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, ChecklistFisicomecanico>>;
  ticketsSoporte: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, TicketSoporte>>;
  almacenes: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Almacen>>;
  articulos: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Articulo>>;
  tiposMovimientoAlmacen: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, TipoMovimientoAlmacen>>;
  cotizaciones: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Cotizacion>>;
  requisiciones: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Requisicion>>;
  ordenesCompra: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, OrdenCompra>>;
  compras: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, Compra>>;
  movimientosAlmacen: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, MovimientoAlmacen>>;
  reportes: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, ReporteExterno>>;
  formatosImpresion: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, FormatoImpresion>>;
  foliosAutorizados: ReturnType<typeof useSupabaseCollection<Record<string, unknown>, FolioAutorizado>>;
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
  const foliosAutorizados = useSupabaseCollection<Record<string, unknown>, FolioAutorizado>(
    'folios_autorizados',
    folioAutorizadoFromRow,
    folioAutorizadoToRow,
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
  const valesCombustible = useSupabaseCollection<Record<string, unknown>, ValeCombustible>(
    'vales_combustible',
    valeCombustibleFromRow,
    valeCombustibleToRow,
  );
  const deduccionesOperador = useSupabaseCollection<Record<string, unknown>, DeduccionOperador>(
    'deducciones_operador',
    deduccionOperadorFromRow,
    deduccionOperadorToRow,
  );
  const descuentosOperador = useSupabaseCollection<Record<string, unknown>, DescuentoOperador>(
    'descuentos_operador',
    descuentoOperadorFromRow,
    descuentoOperadorToRow,
  );
  const abonosDescuentoOperador = useSupabaseCollection<Record<string, unknown>, AbonoDescuentoOperador>(
    'abonos_descuento_operador',
    abonoDescuentoOperadorFromRow,
    abonoDescuentoOperadorToRow,
  );
  const unidadInspecciones = useSupabaseCollection<Record<string, unknown>, UnidadInspeccion>(
    'unidad_inspecciones',
    unidadInspeccionFromRow,
    unidadInspeccionToRow,
  );
  const unidadFotos = useSupabaseCollection<Record<string, unknown>, UnidadFoto>(
    'unidad_fotos',
    unidadFotoFromRow,
    unidadFotoToRow,
  );
  const unidadHotspots = useSupabaseCollection<Record<string, unknown>, UnidadHotspot>(
    'unidad_hotspots',
    unidadHotspotFromRow,
    unidadHotspotToRow,
  );
  const unidadDanos = useSupabaseCollection<Record<string, unknown>, UnidadDano>(
    'unidad_danos',
    unidadDanoFromRow,
    unidadDanoToRow,
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
  const clasificacionesServicio = useSupabaseCollection<Record<string, unknown>, ClasificacionServicio>(
    'clasificaciones_servicio',
    clasificacionServicioFromRow,
    clasificacionServicioToRow,
  );
  const catalogoServicios = useSupabaseCollection<Record<string, unknown>, CatalogoServicio>(
    'catalogo_servicios',
    catalogoServicioFromRow,
    catalogoServicioToRow,
  );
  const mecanicos = useSupabaseCollection<Record<string, unknown>, Mecanico>('mecanicos', mecanicoFromRow, mecanicoToRow);
  const planesServicio = useSupabaseCollection<Record<string, unknown>, PlanServicio>(
    'planes_servicio',
    planServicioFromRow,
    planServicioToRow,
  );
  const reportesFalla = useSupabaseCollection<Record<string, unknown>, ReporteFalla>(
    'reportes_falla',
    reporteFallaFromRow,
    reporteFallaToRow,
  );
  const ordenesServicio = useSupabaseCollection<Record<string, unknown>, OrdenServicio>(
    'ordenes_servicio',
    ordenServicioFromRow,
    ordenServicioToRow,
  );
  const checklistsFisicomecanicos = useSupabaseCollection<Record<string, unknown>, ChecklistFisicomecanico>(
    'checklists_fisicomecanicos',
    checklistFisicomecanicoFromRow,
    checklistFisicomecanicoToRow,
  );
  const ticketsSoporte = useSupabaseCollection<Record<string, unknown>, TicketSoporte>(
    'tickets_soporte',
    ticketSoporteFromRow,
    ticketSoporteToRow,
  );
  const almacenes = useSupabaseCollection<Record<string, unknown>, Almacen>('almacenes', almacenFromRow, almacenToRow);
  const articulos = useSupabaseCollection<Record<string, unknown>, Articulo>('articulos', articuloFromRow, articuloToRow);
  const tiposMovimientoAlmacen = useSupabaseCollection<Record<string, unknown>, TipoMovimientoAlmacen>(
    'tipos_movimiento_almacen',
    tipoMovimientoAlmacenFromRow,
    tipoMovimientoAlmacenToRow,
  );
  const cotizaciones = useSupabaseCollection<Record<string, unknown>, Cotizacion>(
    'cotizaciones',
    cotizacionFromRow,
    cotizacionToRow,
  );
  const requisiciones = useSupabaseCollection<Record<string, unknown>, Requisicion>(
    'requisiciones',
    requisicionFromRow,
    requisicionToRow,
  );
  const ordenesCompra = useSupabaseCollection<Record<string, unknown>, OrdenCompra>(
    'ordenes_compra',
    ordenCompraFromRow,
    ordenCompraToRow,
  );
  const compras = useSupabaseCollection<Record<string, unknown>, Compra>('compras', compraFromRow, compraToRow);
  const movimientosAlmacen = useSupabaseCollection<Record<string, unknown>, MovimientoAlmacen>(
    'movimientos_almacen',
    movimientoAlmacenFromRow,
    movimientoAlmacenToRow,
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
        foliosAutorizados,
        tiposViaje,
        viajes,
        viajeUbicaciones,
        gastosViaje,
        valesCombustible,
        deduccionesOperador,
        descuentosOperador,
        abonosDescuentoOperador,
        unidadInspecciones,
        unidadFotos,
        unidadHotspots,
        unidadDanos,
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
        clasificacionesServicio,
        catalogoServicios,
        mecanicos,
        planesServicio,
        reportesFalla,
        ordenesServicio,
        checklistsFisicomecanicos,
        ticketsSoporte,
        almacenes,
        articulos,
        tiposMovimientoAlmacen,
        cotizaciones,
        requisiciones,
        ordenesCompra,
        compras,
        movimientosAlmacen,
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
