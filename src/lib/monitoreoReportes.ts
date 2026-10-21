import type { IncidenciaViaje, Ruta, Viaje, ViajeUbicacion } from '../types';
import type { FiltroFechas } from './reportesTrafico';
import { calcularAlertas } from './monitoreoAlertas';

function fechaDeIncidencia(i: IncidenciaViaje): string {
  return (i.creadoEn ?? '').slice(0, 10);
}

export interface FilaIncidencia {
  folio: string;
  fecha: string;
  tipo: string;
  descripcion: string;
  severidad: string;
  estatus: string;
}

export function calcularReporteIncidencias(incidencias: IncidenciaViaje[], viajes: Viaje[], filtro: FiltroFechas): FilaIncidencia[] {
  return incidencias
    .filter((i) => {
      const f = fechaDeIncidencia(i);
      return f !== '' && f >= filtro.desde && f <= filtro.hasta;
    })
    .map((i) => ({
      folio: viajes.find((v) => v.id === i.viajeId)?.folio ?? 'N/D',
      fecha: fechaDeIncidencia(i),
      tipo: i.tipo,
      descripcion: i.descripcion,
      severidad: i.severidad,
      estatus: i.estatus,
    }))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export interface FilaAlerta {
  folio: string;
  fecha: string;
  tipo: string;
  mensaje: string;
  detalle: string;
}

/*
 * Las alertas no se guardan como historico (se calculan al vuelo a partir de
 * la condicion actual del viaje -- ver monitoreoAlertas.ts), asi que este
 * reporte es una fotografia de las alertas activas AHORA, filtradas por si
 * su condicion empezo dentro del rango de fechas -- no un archivo completo
 * de todas las alertas que alguna vez existieron (una que ya se resolvio, ej.
 * un retraso que ya se entrego, deja de aparecer).
 */
export function calcularReporteAlertas(
  viajes: Viaje[],
  rutas: Ruta[],
  ubicaciones: ViajeUbicacion[],
  filtro: FiltroFechas,
  ahora: Date,
): FilaAlerta[] {
  return calcularAlertas(viajes, rutas, ubicaciones, ahora)
    .filter((a) => {
      const f = a.creadoEn.slice(0, 10);
      return f >= filtro.desde && f <= filtro.hasta;
    })
    .map((a) => ({
      folio: viajes.find((v) => v.id === a.viajeId)?.folio ?? 'N/D',
      fecha: a.creadoEn.slice(0, 10),
      tipo: a.tipo === 'retraso' ? 'Retraso en ETA' : 'Sin actualizacion de ubicacion',
      mensaje: a.mensaje,
      detalle: a.detalle,
    }));
}
