import { useMemo } from 'react';
import { useData } from './DataContext';

export interface Alerta {
  id: string;
  mensaje: string;
  detalle: string;
  nivel: 'alto' | 'medio';
}

/**
 * Alertas derivadas de datos reales (nada inventado): unidades fuera de
 * servicio, licencias de operador por vencer, facturas pendientes de
 * cobro y viajes de hoy con un estatus personalizado en rojo (ej. "SIN
 * OPERADOR", "ROBADA").
 */
export function useAlertas(): Alerta[] {
  const { unidades, operadores, facturas, viajes, estatusViajes } = useData();
  const hoy = new Date().toISOString().slice(0, 10);

  return useMemo(() => {
    const alertas: Alerta[] = [];

    for (const u of unidades.items) {
      if (u.estatus === 'Fuera de servicio') {
        alertas.push({
          id: `unidad-${u.id}`,
          mensaje: `Unidad ${u.economico} esta fuera de servicio`,
          detalle: 'Catalogo de Unidades',
          nivel: 'alto',
        });
      }
    }

    for (const o of operadores.items) {
      const dias = (new Date(o.vigenciaLicencia).getTime() - Date.now()) / 86400000;
      if (Number.isFinite(dias) && dias <= 60) {
        alertas.push({
          id: `operador-${o.id}`,
          mensaje: dias < 0 ? `Licencia de ${o.nombre} esta vencida` : `Licencia de ${o.nombre} vence pronto`,
          detalle: `Vigencia: ${o.vigenciaLicencia}`,
          nivel: dias <= 15 ? 'alto' : 'medio',
        });
      }
    }

    const pendientes = facturas.items.filter((f) => f.estatus === 'Pendiente');
    if (pendientes.length > 0) {
      alertas.push({
        id: 'facturas-pendientes',
        mensaje: `${pendientes.length} factura${pendientes.length === 1 ? '' : 's'} pendiente${pendientes.length === 1 ? '' : 's'} de cobro`,
        detalle: 'Facturacion Diaria',
        nivel: 'medio',
      });
    }

    const rojos = new Set(estatusViajes.items.filter((e) => e.color === 'red').map((e) => e.nombre));
    for (const v of viajes.items) {
      if (v.fecha === hoy && rojos.has(v.estatus)) {
        alertas.push({
          id: `viaje-${v.id}`,
          mensaje: `Viaje ${v.folio}: ${v.estatus}`,
          detalle: 'Asignacion de Viajes',
          nivel: 'alto',
        });
      }
    }

    return alertas.sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === 'alto' ? -1 : 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidades.items, operadores.items, facturas.items, viajes.items, estatusViajes.items]);
}
