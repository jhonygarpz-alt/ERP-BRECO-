import { useEffect, useMemo, useState } from 'react';
import { useData } from './DataContext';
import { hoyISO } from './fechas';

export interface Alerta {
  id: string;
  mensaje: string;
  detalle: string;
  nivel: 'alto' | 'medio';
}

const DISMISSED_KEY = 'breco-alertas-atendidas';

// Guarda, por id de alerta, el mensaje que tenia cuando se marco como
// atendida: si la condicion vuelve a ocurrir con un mensaje distinto (ej.
// cambia el numero de facturas pendientes), la alerta reaparece.
function leerAtendidas(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function guardarAtendidas(atendidas: Record<string, string>) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(atendidas));
  } catch {
    // localStorage no disponible (modo privado, etc.) -- se ignora, solo se pierde la persistencia.
  }
}

function calcularAlertas(
  unidades: ReturnType<typeof useData>['unidades']['items'],
  operadores: ReturnType<typeof useData>['operadores']['items'],
  facturas: ReturnType<typeof useData>['facturas']['items'],
  viajes: ReturnType<typeof useData>['viajes']['items'],
  estatusViajes: ReturnType<typeof useData>['estatusViajes']['items'],
  hoy: string,
): Alerta[] {
  const alertas: Alerta[] = [];

  for (const u of unidades) {
    if (u.estatus === 'Fuera de servicio') {
      alertas.push({
        id: `unidad-${u.id}`,
        mensaje: `Unidad ${u.economico} esta fuera de servicio`,
        detalle: 'Catalogo de Unidades',
        nivel: 'alto',
      });
    }
  }

  for (const o of operadores) {
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

  const pendientes = facturas.filter((f) => f.estatus === 'Pendiente');
  if (pendientes.length > 0) {
    alertas.push({
      id: 'facturas-pendientes',
      mensaje: `${pendientes.length} factura${pendientes.length === 1 ? '' : 's'} pendiente${pendientes.length === 1 ? '' : 's'} de cobro`,
      detalle: 'Facturacion Diaria',
      nivel: 'medio',
    });
  }

  const rojos = new Set(estatusViajes.filter((e) => e.color === 'red').map((e) => e.nombre));
  for (const v of viajes) {
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
}

/**
 * Alertas derivadas de datos reales (nada inventado): unidades fuera de
 * servicio, licencias de operador por vencer, facturas pendientes de
 * cobro y viajes de hoy con un estatus personalizado en rojo (ej. "SIN
 * OPERADOR", "ROBADA"). Marcar una como atendida la oculta (guardado en
 * este navegador) hasta que su condicion cambie de mensaje.
 */
export function useAlertas() {
  const { unidades, operadores, facturas, viajes, estatusViajes } = useData();
  const hoy = hoyISO();
  const [atendidas, setAtendidas] = useState<Record<string, string>>(() => leerAtendidas());

  useEffect(() => {
    guardarAtendidas(atendidas);
  }, [atendidas]);

  const todas = useMemo(
    () => calcularAlertas(unidades.items, operadores.items, facturas.items, viajes.items, estatusViajes.items, hoy),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unidades.items, operadores.items, facturas.items, viajes.items, estatusViajes.items],
  );

  const alertas = useMemo(() => todas.filter((a) => atendidas[a.id] !== a.mensaje), [todas, atendidas]);

  function marcarAtendida(alerta: Alerta) {
    setAtendidas((actual) => ({ ...actual, [alerta.id]: alerta.mensaje }));
  }

  function marcarTodasAtendidas() {
    setAtendidas((actual) => {
      const nuevo = { ...actual };
      alertas.forEach((a) => (nuevo[a.id] = a.mensaje));
      return nuevo;
    });
  }

  return { alertas, marcarAtendida, marcarTodasAtendidas };
}
