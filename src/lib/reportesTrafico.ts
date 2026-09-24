// Calculos puros para los Reportes de Trafico: cada funcion recibe las
// colecciones ya cargadas (viajes, facturas, clientes, unidades,
// operadores) y un rango de fechas, y regresa filas listas para mostrar en
// pantalla, exportar a Excel o imprimir en PDF -- la MISMA funcion se usa en
// las tres pantallas para que los tres numeros siempre coincidan.
import type {
  AbonoDescuentoOperador,
  Caja,
  Cliente,
  DeduccionOperador,
  DescuentoOperador,
  EstatusUnidadCustom,
  Factura,
  GastoViaje,
  Operador,
  Unidad,
  Viaje,
} from '../types';
import { hoyISO, fechaLocal } from './fechas';
import { validarCartaPorteCompleta } from './cartaPorte';

export interface FiltroFechas {
  desde: string;
  hasta: string;
}

export function money(n: number): string {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function rangoHoy(): FiltroFechas {
  const hoy = hoyISO();
  return { desde: hoy, hasta: hoy };
}

export function rangoUltimosDias(dias: number): FiltroFechas {
  const hasta = new Date();
  const desde = new Date();
  desde.setDate(desde.getDate() - (dias - 1));
  return { desde: fechaLocal(desde), hasta: fechaLocal(hasta) };
}

export function rangoMesActual(): FiltroFechas {
  const hoy = new Date();
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  return { desde: fechaLocal(desde), hasta: fechaLocal(hoy) };
}

export function rangoAnioActual(): FiltroFechas {
  const hoy = new Date();
  const desde = new Date(hoy.getFullYear(), 0, 1);
  return { desde: fechaLocal(desde), hasta: fechaLocal(hoy) };
}

// Sin limite de historico: una fecha lo bastante vieja para incluir
// cualquier dato real capturado en el sistema.
export function rangoTodo(): FiltroFechas {
  return { desde: '2000-01-01', hasta: hoyISO() };
}

// Rango hacia adelante (para reportes de vencimientos: interesa lo que ya
// vencio recientemente y lo que esta por vencer, no el historico de viajes).
export function rangoVencimientos(diasAtras = 30, diasAdelante = 90): FiltroFechas {
  const desde = new Date();
  desde.setDate(desde.getDate() - diasAtras);
  const hasta = new Date();
  hasta.setDate(hasta.getDate() + diasAdelante);
  return { desde: fechaLocal(desde), hasta: fechaLocal(hasta) };
}

function diasEntreFechas(fechaIso: string, hoy: string): number {
  const [y1, m1, d1] = hoy.split('-').map(Number);
  const fecha = new Date(fechaIso);
  const hoyMs = Date.UTC(y1, m1 - 1, d1);
  return Math.round((fecha.getTime() - hoyMs) / 86400000);
}

export function viajesEnRango(viajes: Viaje[], filtro: FiltroFechas): Viaje[] {
  return viajes.filter((v) => v.fecha >= filtro.desde && v.fecha <= filtro.hasta);
}

export function nombreCliente(clientes: Cliente[], id: string): string {
  return clientes.find((c) => c.id === id)?.nombre ?? '—';
}
export function nombreOperador(operadores: Operador[], id: string): string {
  return operadores.find((o) => o.id === id)?.nombre ?? '—';
}
export function economicoUnidad(unidades: Unidad[], id: string): string {
  return unidades.find((u) => u.id === id)?.economico ?? '—';
}

// ---- 01. Listado de Viajes ----
export interface FilaListadoViajes {
  folio: string;
  fecha: string;
  cliente: string;
  operador: string;
  unidad: string;
  origen: string;
  destino: string;
  estatus: string;
}
export function calcularListadoViajes(
  viajes: Viaje[],
  clientes: Cliente[],
  operadores: Operador[],
  unidades: Unidad[],
  filtro: FiltroFechas,
): FilaListadoViajes[] {
  return viajesEnRango(viajes, filtro)
    .slice()
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.folio.localeCompare(b.folio))
    .map((v) => ({
      folio: v.folio,
      fecha: v.fecha,
      cliente: nombreCliente(clientes, v.clienteId),
      operador: nombreOperador(operadores, v.trayectos[0]?.operadorId || v.operadorId),
      unidad: economicoUnidad(unidades, v.trayectos[0]?.unidadId || v.unidadId),
      origen: v.trayectos[0]?.origen || v.origen || '—',
      destino: v.trayectos[0]?.destino || v.destino || '—',
      estatus: v.estatus,
    }));
}

// ---- 02 / 24. Viajes Pendientes de Facturar / a Facturar ----
export interface FilaViajePendienteFacturar {
  folio: string;
  fecha: string;
  cliente: string;
  origen: string;
  destino: string;
  estatus: string;
}
export function calcularViajesPendientesFacturar(
  viajes: Viaje[],
  facturas: Factura[],
  clientes: Cliente[],
  filtro: FiltroFechas,
): FilaViajePendienteFacturar[] {
  const facturados = new Set(facturas.filter((f) => f.estatus !== 'Cancelado').map((f) => f.viajeId));
  return viajesEnRango(viajes, filtro)
    .filter((v) => v.estatus !== 'Cancelado' && !facturados.has(v.id))
    .slice()
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((v) => ({
      folio: v.folio,
      fecha: v.fecha,
      cliente: nombreCliente(clientes, v.clienteId),
      origen: v.trayectos[0]?.origen || v.origen || '—',
      destino: v.trayectos[0]?.destino || v.destino || '—',
      estatus: v.estatus,
    }));
}

// ---- 07. Ingresos por Operador ----
export interface FilaIngresoOperador {
  operador: string;
  viajes: number;
  ingreso: number;
}
export function calcularIngresosPorOperador(
  viajes: Viaje[],
  operadores: Operador[],
  filtro: FiltroFechas,
): FilaIngresoOperador[] {
  const enRango = viajesEnRango(viajes, filtro).filter((v) => v.estatus !== 'Cancelado');
  const porOperador = new Map<string, { viajes: number; ingreso: number }>();
  for (const v of enRango) {
    const operadorId = v.trayectos[0]?.operadorId || v.operadorId;
    if (!operadorId) continue;
    const ingresoViaje = v.conceptosFacturacionViaje.reduce((acc, c) => acc + (c.importe || 0), 0);
    const actual = porOperador.get(operadorId) ?? { viajes: 0, ingreso: 0 };
    actual.viajes += 1;
    actual.ingreso += ingresoViaje;
    porOperador.set(operadorId, actual);
  }
  return Array.from(porOperador.entries())
    .map(([operadorId, datos]) => ({ operador: nombreOperador(operadores, operadorId), ...datos }))
    .sort((a, b) => b.ingreso - a.ingreso);
}

// ---- 08. Viajes por Unidad ----
export interface FilaViajePorUnidad {
  unidad: string;
  viajes: number;
  kilometros: number;
}
export function calcularViajesPorUnidad(viajes: Viaje[], unidades: Unidad[], filtro: FiltroFechas): FilaViajePorUnidad[] {
  const enRango = viajesEnRango(viajes, filtro).filter((v) => v.estatus !== 'Cancelado');
  const porUnidad = new Map<string, { viajes: number; kilometros: number }>();
  for (const v of enRango) {
    const unidadId = v.trayectos[0]?.unidadId || v.unidadId;
    if (!unidadId) continue;
    const actual = porUnidad.get(unidadId) ?? { viajes: 0, kilometros: 0 };
    actual.viajes += 1;
    actual.kilometros += v.kilometros || 0;
    porUnidad.set(unidadId, actual);
  }
  return Array.from(porUnidad.entries())
    .map(([unidadId, datos]) => ({ unidad: economicoUnidad(unidades, unidadId), ...datos }))
    .sort((a, b) => b.viajes - a.viajes);
}

// ---- Detallado de Gastos por Viaje (tambien 06. Gastos de Viaje por Liquidacion) ----
// El desglose distingue los mismos tipos que se capturan en Gastos de Viaje
// (Peajes/Combustible/Viaticos, ver TIPOS_GASTO en GastosViajePage.tsx);
// cualquier tipo libre ("Otro", o el texto que capture el usuario) cae en
// "otros" para no perder el gasto aunque no encaje en esas 3 categorias.
export interface DesgloseGastosViaje {
  casetas: number;
  combustible: number;
  viaticos: number;
  otros: number;
}
function categoriaGasto(tipo: string): keyof DesgloseGastosViaje {
  if (tipo === 'Peajes') return 'casetas';
  if (tipo === 'Combustible') return 'combustible';
  if (tipo === 'Viaticos / Anticipo') return 'viaticos';
  return 'otros';
}
export interface FilaGastoPorViaje extends DesgloseGastosViaje {
  viajeId: string;
  folio: string;
  fecha: string;
  cliente: string;
  ingreso: number;
  gastos: number;
  utilidad: number;
}
export function calcularGastosPorViaje(
  viajes: Viaje[],
  gastos: GastoViaje[],
  clientes: Cliente[],
  filtro: FiltroFechas,
): FilaGastoPorViaje[] {
  const desglosePorViaje = new Map<string, DesgloseGastosViaje>();
  for (const g of gastos) {
    if (g.estatus === 'Cancelado') continue;
    const actual = desglosePorViaje.get(g.viajeId) ?? { casetas: 0, combustible: 0, viaticos: 0, otros: 0 };
    actual[categoriaGasto(g.tipo)] += g.monto || 0;
    desglosePorViaje.set(g.viajeId, actual);
  }
  return viajesEnRango(viajes, filtro)
    .filter((v) => v.estatus !== 'Cancelado')
    .map((v) => {
      const ingreso = v.conceptosFacturacionViaje.reduce((acc, c) => acc + (c.importe || 0), 0);
      const desglose = desglosePorViaje.get(v.id) ?? { casetas: 0, combustible: 0, viaticos: 0, otros: 0 };
      const gastosViaje = desglose.casetas + desglose.combustible + desglose.viaticos + desglose.otros;
      return {
        viajeId: v.id,
        folio: v.folio,
        fecha: v.fecha,
        cliente: nombreCliente(clientes, v.clienteId),
        ingreso,
        ...desglose,
        gastos: gastosViaje,
        utilidad: ingreso - gastosViaje,
      };
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || a.folio.localeCompare(b.folio));
}

// ---- 05. Ingresos Generados por Unidad ----
export interface FilaIngresoUnidad {
  unidad: string;
  viajes: number;
  ingreso: number;
}
export function calcularIngresosPorUnidad(viajes: Viaje[], unidades: Unidad[], filtro: FiltroFechas): FilaIngresoUnidad[] {
  const enRango = viajesEnRango(viajes, filtro).filter((v) => v.estatus !== 'Cancelado');
  const porUnidad = new Map<string, { viajes: number; ingreso: number }>();
  for (const v of enRango) {
    const unidadId = v.trayectos[0]?.unidadId || v.unidadId;
    if (!unidadId) continue;
    const ingresoViaje = v.conceptosFacturacionViaje.reduce((acc, c) => acc + (c.importe || 0), 0);
    const actual = porUnidad.get(unidadId) ?? { viajes: 0, ingreso: 0 };
    actual.viajes += 1;
    actual.ingreso += ingresoViaje;
    porUnidad.set(unidadId, actual);
  }
  return Array.from(porUnidad.entries())
    .map(([unidadId, datos]) => ({ unidad: economicoUnidad(unidades, unidadId), ...datos }))
    .sort((a, b) => b.ingreso - a.ingreso);
}

// ---- 11. Detallado de Viajes ----
export interface FilaDetalladoViaje {
  folio: string;
  fecha: string;
  cliente: string;
  operador: string;
  unidad: string;
  origen: string;
  destino: string;
  kilometros: number;
  ingreso: number;
  gastos: number;
  utilidad: number;
  estatus: string;
}
export function calcularDetalladoViajes(
  viajes: Viaje[],
  clientes: Cliente[],
  operadores: Operador[],
  unidades: Unidad[],
  gastos: GastoViaje[],
  filtro: FiltroFechas,
): FilaDetalladoViaje[] {
  const gastosPorViaje = new Map<string, number>();
  for (const g of gastos) {
    if (g.estatus === 'Cancelado') continue;
    gastosPorViaje.set(g.viajeId, (gastosPorViaje.get(g.viajeId) ?? 0) + (g.monto || 0));
  }
  return viajesEnRango(viajes, filtro)
    .slice()
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.folio.localeCompare(b.folio))
    .map((v) => {
      const ingreso = v.conceptosFacturacionViaje.reduce((acc, c) => acc + (c.importe || 0), 0);
      const gastosViaje = gastosPorViaje.get(v.id) ?? 0;
      return {
        folio: v.folio,
        fecha: v.fecha,
        cliente: nombreCliente(clientes, v.clienteId),
        operador: nombreOperador(operadores, v.trayectos[0]?.operadorId || v.operadorId),
        unidad: economicoUnidad(unidades, v.trayectos[0]?.unidadId || v.unidadId),
        origen: v.trayectos[0]?.origen || v.origen || '—',
        destino: v.trayectos[0]?.destino || v.destino || '—',
        kilometros: v.kilometros || 0,
        ingreso,
        gastos: gastosViaje,
        utilidad: ingreso - gastosViaje,
        estatus: v.estatus,
      };
    });
}

// ---- 17. Vencimientos de Unidades ----
export interface FilaVencimientoUnidad {
  unidad: string;
  documento: string;
  fechaVencimiento: string;
  dias: number;
  estatus: 'Vencido' | 'Por vencer' | 'Vigente';
}
export function calcularVencimientosUnidades(unidades: Unidad[], filtro: FiltroFechas): FilaVencimientoUnidad[] {
  const hoy = hoyISO();
  const filas: FilaVencimientoUnidad[] = [];

  function agregar(unidad: Unidad, documento: string, fechaVencimiento: string) {
    if (!fechaVencimiento || fechaVencimiento < filtro.desde || fechaVencimiento > filtro.hasta) return;
    const dias = diasEntreFechas(fechaVencimiento, hoy);
    filas.push({
      unidad: unidad.economico,
      documento,
      fechaVencimiento,
      dias,
      estatus: dias < 0 ? 'Vencido' : dias <= 30 ? 'Por vencer' : 'Vigente',
    });
  }

  for (const u of unidades) {
    u.documentosVencimiento.forEach((doc) => agregar(u, doc.documento || doc.tipo || 'Documento', doc.fechaVencimiento));
    agregar(u, 'Seguro', u.vigenciaHasta);
    agregar(u, 'Permiso SCT', u.vigenciaPermisoSct);
  }

  return filas.sort((a, b) => a.dias - b.dias);
}

// ---- 14 / 25. Estatus de Viajes / Resumen por Estatus ----
export interface FilaEstatusViajes {
  estatus: string;
  cantidad: number;
}
export function calcularEstatusViajes(viajes: Viaje[], filtro: FiltroFechas): FilaEstatusViajes[] {
  const enRango = viajesEnRango(viajes, filtro);
  const porEstatus = new Map<string, number>();
  for (const v of enRango) {
    porEstatus.set(v.estatus, (porEstatus.get(v.estatus) ?? 0) + 1);
  }
  return Array.from(porEstatus.entries())
    .map(([estatus, cantidad]) => ({ estatus, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);
}

// ---- 03. Salidas Diarias con Importes ----
export interface FilaSalidaDiaria {
  fecha: string;
  viajes: number;
  ingreso: number;
}
export function calcularSalidasDiarias(viajes: Viaje[], filtro: FiltroFechas): FilaSalidaDiaria[] {
  const enRango = viajesEnRango(viajes, filtro).filter((v) => v.estatus !== 'Cancelado');
  const porFecha = new Map<string, { viajes: number; ingreso: number }>();
  for (const v of enRango) {
    const ingreso = v.conceptosFacturacionViaje.reduce((acc, c) => acc + (c.importe || 0), 0);
    const actual = porFecha.get(v.fecha) ?? { viajes: 0, ingreso: 0 };
    actual.viajes += 1;
    actual.ingreso += ingreso;
    porFecha.set(v.fecha, actual);
  }
  return Array.from(porFecha.entries())
    .map(([fecha, datos]) => ({ fecha, ...datos }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// ---- 04. Combustible Conciliado ----
// "Conciliado" aqui compara, para cada carga de combustible capturada con
// litros y precio por litro, si el monto capturado a mano coincide con
// litros x precio -- una forma real de detectar errores de captura, ya que
// el sistema no tiene ningun proceso de conciliacion bancaria/de combustible.
export interface FilaCombustibleConciliado {
  fecha: string;
  unidad: string;
  litros: number;
  precioLitro: number;
  montoCalculado: number;
  montoCapturado: number;
  diferencia: number;
  conciliado: boolean;
}
export function calcularCombustibleConciliado(
  gastos: GastoViaje[],
  viajes: Viaje[],
  unidades: Unidad[],
  filtro: FiltroFechas,
): FilaCombustibleConciliado[] {
  const unidadPorViaje = new Map(viajes.map((v) => [v.id, v.trayectos[0]?.unidadId || v.unidadId]));
  return gastos
    .filter((g) => g.tipo === 'Combustible' && g.estatus !== 'Cancelado' && g.fecha >= filtro.desde && g.fecha <= filtro.hasta && g.litros && g.precioLitro)
    .map((g) => {
      const litros = g.litros ?? 0;
      const precioLitro = g.precioLitro ?? 0;
      const montoCalculado = Math.round(litros * precioLitro * 100) / 100;
      const diferencia = Math.round((g.monto - montoCalculado) * 100) / 100;
      return {
        fecha: g.fecha,
        unidad: economicoUnidad(unidades, unidadPorViaje.get(g.viajeId) ?? ''),
        litros,
        precioLitro,
        montoCalculado,
        montoCapturado: g.monto,
        diferencia,
        conciliado: Math.abs(diferencia) <= 1,
      };
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// ---- 10. Rendimiento por Unidad ----
export interface FilaRendimientoUnidad {
  unidad: string;
  kilometros: number;
  litros: number;
  rendimientoReal: number;
  rendimientoConfigCargado: number;
  rendimientoConfigVacio: number;
}
export function calcularRendimientoPorUnidad(
  viajes: Viaje[],
  gastos: GastoViaje[],
  unidades: Unidad[],
  filtro: FiltroFechas,
): FilaRendimientoUnidad[] {
  const enRango = viajesEnRango(viajes, filtro).filter((v) => v.estatus !== 'Cancelado');
  const kmPorUnidad = new Map<string, number>();
  for (const v of enRango) {
    const unidadId = v.trayectos[0]?.unidadId || v.unidadId;
    if (!unidadId) continue;
    kmPorUnidad.set(unidadId, (kmPorUnidad.get(unidadId) ?? 0) + (v.kilometros || 0));
  }
  const viajeAUnidad = new Map(viajes.map((v) => [v.id, v.trayectos[0]?.unidadId || v.unidadId]));
  const litrosPorUnidad = new Map<string, number>();
  for (const g of gastos) {
    if (g.tipo !== 'Combustible' || g.estatus === 'Cancelado' || !g.litros) continue;
    if (g.fecha < filtro.desde || g.fecha > filtro.hasta) continue;
    const unidadId = viajeAUnidad.get(g.viajeId);
    if (!unidadId) continue;
    litrosPorUnidad.set(unidadId, (litrosPorUnidad.get(unidadId) ?? 0) + g.litros);
  }
  const unidadIds = new Set([...kmPorUnidad.keys(), ...litrosPorUnidad.keys()]);
  return Array.from(unidadIds)
    .map((unidadId) => {
      const unidad = unidades.find((u) => u.id === unidadId);
      const km = kmPorUnidad.get(unidadId) ?? 0;
      const litros = litrosPorUnidad.get(unidadId) ?? 0;
      return {
        unidad: unidad?.economico ?? '—',
        kilometros: km,
        litros,
        rendimientoReal: litros > 0 ? Math.round((km / litros) * 100) / 100 : 0,
        rendimientoConfigCargado: unidad?.rendimientoCargadoKmLt ?? 0,
        rendimientoConfigVacio: unidad?.rendimientoVacioKmLt ?? 0,
      };
    })
    .sort((a, b) => b.kilometros - a.kilometros);
}

// ---- 12. Relacion de Anticipos ----
// Un "anticipo" en este sistema es un Gasto de Viaje capturado con el tipo
// "Viaticos / Anticipo" (no existe un campo de anticipo aparte en Viaje/Operador).
export interface FilaAnticipoOperador {
  fecha: string;
  folioViaje: string;
  operador: string;
  monto: number;
  referencia: string;
}
export function calcularAnticiposOperador(
  gastos: GastoViaje[],
  viajes: Viaje[],
  operadores: Operador[],
  filtro: FiltroFechas,
): FilaAnticipoOperador[] {
  const viajePorId = new Map(viajes.map((v) => [v.id, v]));
  return gastos
    .filter((g) => g.tipo === 'Viaticos / Anticipo' && g.estatus !== 'Cancelado' && g.fecha >= filtro.desde && g.fecha <= filtro.hasta)
    .map((g) => {
      const viaje = viajePorId.get(g.viajeId);
      const operadorId = g.operadorId || viaje?.trayectos[0]?.operadorId || viaje?.operadorId || '';
      return {
        fecha: g.fecha,
        folioViaje: viaje?.folio ?? '—',
        operador: nombreOperador(operadores, operadorId),
        monto: g.monto || 0,
        referencia: g.numeroReferencia || '—',
      };
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// ---- 13. Cartas Porte a Revision ----
// Reutiliza el mismo motor de validacion que bloquea el guardado de una
// Carta Porte incompleta (src/lib/cartaPorte.ts), aplicado a las Cartas
// Porte ya guardadas para saber cuales siguen incompletas.
export interface FilaCartaPorteRevision {
  folio: string;
  fecha: string;
  cliente: string;
  faltantesCount: number;
  faltantes: string;
}
export function calcularCartasPorteRevision(
  viajes: Viaje[],
  clientes: Cliente[],
  unidades: Unidad[],
  operadores: Operador[],
  cajas: Caja[],
  filtro: FiltroFechas,
): FilaCartaPorteRevision[] {
  return viajesEnRango(viajes, filtro)
    .filter((v) => v.tipoDocumento === 'CartaPorte' && v.estatus !== 'Cancelado')
    .map((v) => {
      const cliente = clientes.find((c) => c.id === v.clienteId);
      const unidadId = v.trayectos[0]?.unidadId || v.unidadId;
      const operadorId = v.trayectos[0]?.operadorId || v.operadorId;
      const unidad = unidades.find((u) => u.id === unidadId);
      const operador = operadores.find((o) => o.id === operadorId);
      const remolque1 = cajas.find((c) => c.id === v.remolque1Id);
      const remolque2 = cajas.find((c) => c.id === v.remolque2Id);
      const faltantes = validarCartaPorteCompleta(v, cliente, unidad, operador, remolque1, remolque2);
      return {
        folio: v.folio,
        fecha: v.fecha,
        cliente: nombreCliente(clientes, v.clienteId),
        faltantesCount: faltantes.length,
        faltantes: faltantes.join('; '),
      };
    })
    .filter((f) => f.faltantesCount > 0)
    .sort((a, b) => b.faltantesCount - a.faltantesCount);
}

// ---- 16. Listado de Viajes Concentrado ----
// Version "concentrada": une en un solo renglon por viaje los datos que en
// otros reportes estan repartidos (cliente/operador/unidad, remolques,
// ingreso, gastos y utilidad), a diferencia del Listado de Viajes (01) que
// solo trae cliente/operador/unidad/origen/destino.
export interface FilaViajeConcentrado {
  folio: string;
  fecha: string;
  cliente: string;
  operador: string;
  unidad: string;
  remolques: string;
  origen: string;
  destino: string;
  kilometros: number;
  ingreso: number;
  gastos: number;
  utilidad: number;
  estatus: string;
}
export function calcularListadoViajesConcentrado(
  viajes: Viaje[],
  clientes: Cliente[],
  operadores: Operador[],
  unidades: Unidad[],
  cajas: Caja[],
  gastos: GastoViaje[],
  filtro: FiltroFechas,
): FilaViajeConcentrado[] {
  const gastosPorViaje = new Map<string, number>();
  for (const g of gastos) {
    if (g.estatus === 'Cancelado') continue;
    gastosPorViaje.set(g.viajeId, (gastosPorViaje.get(g.viajeId) ?? 0) + (g.monto || 0));
  }
  return viajesEnRango(viajes, filtro)
    .slice()
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.folio.localeCompare(b.folio))
    .map((v) => {
      const ingreso = v.conceptosFacturacionViaje.reduce((acc, c) => acc + (c.importe || 0), 0);
      const gastosViaje = gastosPorViaje.get(v.id) ?? 0;
      const remolques = [v.remolque1Id, v.dollyId, v.remolque2Id]
        .filter((id): id is string => !!id)
        .map((id) => cajas.find((c) => c.id === id)?.economico ?? '—')
        .join(', ');
      return {
        folio: v.folio,
        fecha: v.fecha,
        cliente: nombreCliente(clientes, v.clienteId),
        operador: nombreOperador(operadores, v.trayectos[0]?.operadorId || v.operadorId),
        unidad: economicoUnidad(unidades, v.trayectos[0]?.unidadId || v.unidadId),
        remolques: remolques || '—',
        origen: v.trayectos[0]?.origen || v.origen || '—',
        destino: v.trayectos[0]?.destino || v.destino || '—',
        kilometros: v.kilometros || 0,
        ingreso,
        gastos: gastosViaje,
        utilidad: ingreso - gastosViaje,
        estatus: v.estatus,
      };
    });
}

// ---- 18. Relacion de Viajes para Uso de Trafico ----
// A diferencia de los demas reportes (que solo usan trayectos[0]), este
// genera un renglon POR TRAYECTO -- es la vista operativa que necesita
// Trafico para ver cada tramo/convoy que hay que despachar.
export interface FilaViajeTrafico {
  folio: string;
  trayectoNum: number;
  fecha: string;
  operador: string;
  unidad: string;
  origen: string;
  destino: string;
  cita: string;
  horaSalida: string;
  estatus: string;
}
export function calcularViajesUsoTrafico(viajes: Viaje[], operadores: Operador[], unidades: Unidad[], filtro: FiltroFechas): FilaViajeTrafico[] {
  const filas: FilaViajeTrafico[] = [];
  for (const v of viajesEnRango(viajes, filtro)) {
    if (v.estatus === 'Cancelado') continue;
    if (v.trayectos.length === 0) {
      filas.push({
        folio: v.folio,
        trayectoNum: 1,
        fecha: v.fecha,
        operador: nombreOperador(operadores, v.operadorId),
        unidad: economicoUnidad(unidades, v.unidadId),
        origen: v.origen || '—',
        destino: v.destino || '—',
        cita: v.cita || '—',
        horaSalida: v.horaSalida || '—',
        estatus: v.estatus,
      });
      continue;
    }
    v.trayectos.forEach((t, i) => {
      filas.push({
        folio: v.folio,
        trayectoNum: i + 1,
        fecha: v.fecha,
        operador: nombreOperador(operadores, t.operadorId),
        unidad: economicoUnidad(unidades, t.unidadId),
        origen: t.origen || '—',
        destino: t.destino || '—',
        cita: v.cita || '—',
        horaSalida: v.horaSalida || '—',
        estatus: v.estatus,
      });
    });
  }
  return filas.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.folio.localeCompare(b.folio) || a.trayectoNum - b.trayectoNum);
}

// ---- 19. Inventario de Equipo en Viajes ----
export interface FilaEquipoEnViaje {
  folio: string;
  fecha: string;
  unidad: string;
  remolque1: string;
  dolly: string;
  remolque2: string;
  estatus: string;
}
export function calcularInventarioEquipoEnViajes(viajes: Viaje[], unidades: Unidad[], cajas: Caja[], filtro: FiltroFechas): FilaEquipoEnViaje[] {
  return viajesEnRango(viajes, filtro)
    .filter((v) => v.estatus !== 'Cancelado' && (v.remolque1Id || v.dollyId || v.remolque2Id))
    .slice()
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((v) => ({
      folio: v.folio,
      fecha: v.fecha,
      unidad: economicoUnidad(unidades, v.trayectos[0]?.unidadId || v.unidadId),
      remolque1: cajas.find((c) => c.id === v.remolque1Id)?.economico ?? '—',
      dolly: cajas.find((c) => c.id === v.dollyId)?.economico ?? '—',
      remolque2: cajas.find((c) => c.id === v.remolque2Id)?.economico ?? '—',
      estatus: v.estatus,
    }));
}

// ---- 20. Anticipos vs Gastos por Viaje ----
// Solo se puede calcular a nivel Viaje completo: un Gasto de Viaje no trae
// identificador de trayecto, asi que no hay forma de desglosarlo por tramo.
export interface FilaAnticipoVsGasto {
  folio: string;
  fecha: string;
  cliente: string;
  anticipo: number;
  otrosGastos: number;
  totalGastos: number;
  diferencia: number;
}
export function calcularAnticiposVsGastos(viajes: Viaje[], gastos: GastoViaje[], clientes: Cliente[], filtro: FiltroFechas): FilaAnticipoVsGasto[] {
  const porViaje = new Map<string, { anticipo: number; otros: number }>();
  for (const g of gastos) {
    if (g.estatus === 'Cancelado') continue;
    const actual = porViaje.get(g.viajeId) ?? { anticipo: 0, otros: 0 };
    if (g.tipo === 'Viaticos / Anticipo') actual.anticipo += g.monto || 0;
    else actual.otros += g.monto || 0;
    porViaje.set(g.viajeId, actual);
  }
  return viajesEnRango(viajes, filtro)
    .filter((v) => v.estatus !== 'Cancelado' && porViaje.has(v.id))
    .map((v) => {
      const datos = porViaje.get(v.id)!;
      return {
        folio: v.folio,
        fecha: v.fecha,
        cliente: nombreCliente(clientes, v.clienteId),
        anticipo: datos.anticipo,
        otrosGastos: datos.otros,
        totalGastos: datos.anticipo + datos.otros,
        diferencia: datos.anticipo - datos.otros,
      };
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

// ---- 21. Just in Time Detallado ----
// El sistema solo captura un par "programado vs real" genuino: la hora de
// Cita (programada) contra la Hora de Salida (real) -- no existe una cita
// programada para la entrega, asi que este JIT cubre unicamente el momento
// de salida/carga, no el ciclo completo del viaje.
export interface FilaJustInTime {
  folio: string;
  fecha: string;
  cliente: string;
  cita: string;
  horaSalida: string;
  diferenciaMin: number | null;
  cumplio: boolean | null;
}
function minutosDesdeHora(hhmm: string): number | null {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}
export function calcularJustInTime(viajes: Viaje[], clientes: Cliente[], filtro: FiltroFechas): FilaJustInTime[] {
  return viajesEnRango(viajes, filtro)
    .filter((v) => v.estatus !== 'Cancelado' && v.cita && v.horaSalida)
    .map((v) => {
      const citaMin = minutosDesdeHora(v.cita);
      const salidaMin = minutosDesdeHora(v.horaSalida);
      const diferenciaMin = citaMin !== null && salidaMin !== null ? salidaMin - citaMin : null;
      return {
        folio: v.folio,
        fecha: v.fecha,
        cliente: nombreCliente(clientes, v.clienteId),
        cita: v.cita,
        horaSalida: v.horaSalida,
        diferenciaMin,
        cumplio: diferenciaMin === null ? null : diferenciaMin <= 15,
      };
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// ---- 22. Disponibilidad de Equipo ----
// Snapshot del estatus actual (no se filtra por fecha: es "ahora mismo").
export interface FilaDisponibilidadEquipo {
  tipo: 'Unidad' | 'Remolque';
  economico: string;
  estatus: string;
  disponible: boolean;
}
export function calcularDisponibilidadEquipo(unidades: Unidad[], cajas: Caja[], estatusUnidades: EstatusUnidadCustom[]): FilaDisponibilidadEquipo[] {
  const tipoPorEstatus = new Map(estatusUnidades.map((e) => [e.nombre, e.tipoEstatus]));
  const filasUnidades: FilaDisponibilidadEquipo[] = unidades
    .filter((u) => u.activa)
    .map((u) => ({
      tipo: 'Unidad',
      economico: u.economico,
      estatus: u.estatus,
      disponible: (tipoPorEstatus.get(u.estatus) ?? 'Disponible') === 'Disponible',
    }));
  const filasCajas: FilaDisponibilidadEquipo[] = cajas
    .filter((c) => c.activa)
    .map((c) => ({
      tipo: 'Remolque',
      economico: c.economico,
      estatus: c.estatus,
      disponible: c.estatus === 'Disponible',
    }));
  return [...filasUnidades, ...filasCajas].sort((a, b) => (a.disponible === b.disponible ? 0 : a.disponible ? -1 : 1));
}

// ---- 09. Descuentos por Operador ----
// Cada renglon es un abono realmente aplicado a un descuento/prestamo de
// operador (submodulo Descuentos a Operador) dentro del rango de fechas.
export interface FilaDescuentoOperador {
  fecha: string;
  operador: string;
  folioDescuento: string;
  deduccion: string;
  monto: number;
}
export function calcularDescuentosPorOperador(
  abonos: AbonoDescuentoOperador[],
  descuentos: DescuentoOperador[],
  operadores: Operador[],
  deducciones: DeduccionOperador[],
  filtro: FiltroFechas,
): FilaDescuentoOperador[] {
  const descuentoPorId = new Map(descuentos.map((d) => [d.id, d]));
  return abonos
    .filter((a) => a.fecha >= filtro.desde && a.fecha <= filtro.hasta)
    .map((a) => {
      const descuento = descuentoPorId.get(a.descuentoOperadorId);
      const deduccion = descuento ? deducciones.find((d) => d.id === descuento.deduccionId) : undefined;
      return {
        fecha: a.fecha,
        operador: descuento ? nombreOperador(operadores, descuento.operadorId) : '—',
        folioDescuento: descuento?.folio ?? '—',
        deduccion: deduccion ? `${deduccion.numero} ${deduccion.nombre}` : '—',
        monto: a.monto || 0,
      };
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}
