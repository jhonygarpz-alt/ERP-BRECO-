import type { Ruta, Viaje, ViajeUbicacion } from '../types';
import {
  formatearDuracion,
  horasAutorizadas,
  inicioTransito,
  limiteTransito,
  viajeActivo,
  viajeEnTransito,
} from './monitoreoViajes';

/*
 * El sistema no tiene hardware de GPS conectado, asi que estas alertas NO
 * son senales de un sensor -- son condiciones reales calculadas a partir de
 * datos que si existen (hora de salida, horas autorizadas de la Ruta,
 * bitacora de ubicacion). Por esto mismo se descartan a proposito alertas
 * que si requerian telemetria real y hubieran sido inventadas (exceso de
 * velocidad, desviacion de ruta): solo se generan las dos que se pueden
 * sostener con datos reales.
 */
export type TipoAlerta = 'retraso' | 'sin_actualizacion';

export interface AlertaMonitoreo {
  id: string;
  tipo: TipoAlerta;
  severidad: 'alta' | 'media';
  viajeId: string;
  mensaje: string;
  detalle: string;
  creadoEn: string;
}

const HORAS_SIN_ACTUALIZAR = 2;

export function calcularAlertas(viajes: Viaje[], rutas: Ruta[], ubicaciones: ViajeUbicacion[], ahora: Date): AlertaMonitoreo[] {
  const alertas: AlertaMonitoreo[] = [];

  for (const v of viajes) {
    if (!viajeActivo(v)) continue;
    const horasViaje = horasAutorizadas(v, rutas);
    const limite = limiteTransito(v, horasViaje);
    if (limite && ahora.getTime() > limite.getTime()) {
      alertas.push({
        id: `retraso:${v.id}`,
        tipo: 'retraso',
        severidad: 'alta',
        viajeId: v.id,
        mensaje: `Retraso en ETA -- ${v.folio}`,
        detalle: `${formatearDuracion(ahora.getTime() - limite.getTime())} de retraso`,
        creadoEn: limite.toISOString(),
      });
    }

    if (viajeEnTransito(v)) {
      const checkpoints = ubicaciones
        .filter((u) => u.viajeId === v.id)
        .sort((a, b) => (b.creadoEn ?? '').localeCompare(a.creadoEn ?? ''));
      const referencia = checkpoints[0]?.creadoEn ? new Date(checkpoints[0].creadoEn as string) : inicioTransito(v);
      if (referencia) {
        const horasSinActualizar = (ahora.getTime() - referencia.getTime()) / (60 * 60 * 1000);
        if (horasSinActualizar > HORAS_SIN_ACTUALIZAR) {
          alertas.push({
            id: `sin_actualizacion:${v.id}`,
            tipo: 'sin_actualizacion',
            severidad: 'media',
            viajeId: v.id,
            mensaje: `Sin actualizacion de ubicacion -- ${v.folio}`,
            detalle: `${formatearDuracion(ahora.getTime() - referencia.getTime())} sin registrar avance`,
            creadoEn: referencia.toISOString(),
          });
        }
      }
    }
  }

  return alertas.sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}
