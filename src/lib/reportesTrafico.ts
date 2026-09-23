// Calculos puros para los Reportes de Trafico: cada funcion recibe las
// colecciones ya cargadas (viajes, facturas, clientes, unidades,
// operadores) y un rango de fechas, y regresa filas listas para mostrar en
// pantalla, exportar a Excel o imprimir en PDF -- la MISMA funcion se usa en
// las tres pantallas para que los tres numeros siempre coincidan.
import type { Cliente, Factura, Operador, Unidad, Viaje } from '../types';
import { hoyISO, fechaLocal } from './fechas';

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
