import { useEffect, useMemo, useState } from 'react';
import { useData } from './DataContext';
import { hoyISO } from './fechas';
import type { AlertasVencimientosConfig, Operador, Unidad } from '../types';

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

function diasHasta(fechaVencimiento: string, hoy: string): number | null {
  if (!fechaVencimiento) return null;
  const [y1, m1, d1] = hoy.split('-').map(Number);
  const fecha = new Date(fechaVencimiento);
  if (Number.isNaN(fecha.getTime())) return null;
  const hoyMs = Date.UTC(y1, m1 - 1, d1);
  return Math.round((fecha.getTime() - hoyMs) / 86400000);
}

function alertaVencimiento(id: string, etiqueta: string, detalle: string, dias: number): Alerta {
  return {
    id,
    mensaje: dias < 0 ? `${etiqueta} vencio hace ${Math.abs(dias)} dia${Math.abs(dias) === 1 ? '' : 's'}` : `${etiqueta} vence en ${dias} dia${dias === 1 ? '' : 's'}`,
    detalle,
    nivel: dias <= 7 ? 'alto' : 'medio',
  };
}

function alertasDocumentosUnidad(unidad: Unidad, config: AlertasVencimientosConfig['unidad'], hoy: string): Alerta[] {
  const alertas: Alerta[] = [];
  unidad.documentosVencimiento.forEach((doc, i) => {
    const tipo = doc.tipo ?? 'Otro';
    const habilitado =
      (tipo === 'Placas' && config.placas) ||
      (tipo === 'Permisos' && config.permisos) ||
      (tipo === 'Seguro Placa Mexicana' && config.seguroPlacaMexicana) ||
      (tipo === 'Seguro Placa Americana' && config.seguroPlacaAmericana) ||
      (tipo === 'Otro' && config.documentosAdicionales);
    if (!habilitado) return;
    const dias = diasHasta(doc.fechaVencimiento, hoy);
    if (dias === null || dias > config.diasNotificar) return;
    alertas.push(
      alertaVencimiento(
        `unidad-doc-${unidad.id}-${i}`,
        `${doc.documento || tipo} de la unidad ${unidad.economico}`,
        'Catalogo de Unidades',
        dias,
      ),
    );
  });
  return alertas;
}

function alertasDocumentosOperador(operador: Operador, config: AlertasVencimientosConfig['operador'], hoy: string): Alerta[] {
  const alertas: Alerta[] = [];

  if (config.licencia && operador.vigenciaLicencia) {
    const dias = diasHasta(operador.vigenciaLicencia, hoy);
    if (dias !== null && dias <= config.diasNotificar) {
      alertas.push(alertaVencimiento(`operador-licencia-${operador.id}`, `Licencia de ${operador.nombre}`, `Vigencia: ${operador.vigenciaLicencia}`, dias));
    }
  }

  if (config.pasaporte && operador.pasaporte && operador.vigenciaPasaporte) {
    const dias = diasHasta(operador.vigenciaPasaporte, hoy);
    if (dias !== null && dias <= config.diasNotificar) {
      alertas.push(alertaVencimiento(`operador-pasaporte-${operador.id}`, `Pasaporte de ${operador.nombre}`, `Vigencia: ${operador.vigenciaPasaporte}`, dias));
    }
  }

  if (config.documentosAdicionales) {
    operador.vencimientos.forEach((v, i) => {
      if (!v.activo) return;
      const dias = diasHasta(v.fecha, hoy);
      if (dias === null || dias > config.diasNotificar) return;
      alertas.push(alertaVencimiento(`operador-doc-${operador.id}-${i}`, `${v.documento || v.nombre} de ${operador.nombre}`, 'Catalogo de Operadores', dias));
    });
  }

  return alertas;
}

function calcularAlertas(
  unidades: ReturnType<typeof useData>['unidades']['items'],
  operadores: ReturnType<typeof useData>['operadores']['items'],
  facturas: ReturnType<typeof useData>['facturas']['items'],
  viajes: ReturnType<typeof useData>['viajes']['items'],
  estatusViajes: ReturnType<typeof useData>['estatusViajes']['items'],
  config: AlertasVencimientosConfig,
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
    alertas.push(...alertasDocumentosUnidad(u, config.unidad, hoy));
  }

  for (const o of operadores) {
    alertas.push(...alertasDocumentosOperador(o, config.operador, hoy));
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
 * servicio, documentos de unidad/operador por vencer (segun Configuracion >
 * Alertas de Vencimientos), facturas pendientes de cobro y viajes de hoy con
 * un estatus personalizado en rojo (ej. "SIN OPERADOR", "ROBADA"). Marcar una
 * como atendida la oculta (guardado en este navegador) hasta que su
 * condicion cambie de mensaje.
 */
export function useAlertas() {
  const { unidades, operadores, facturas, viajes, estatusViajes, empresa } = useData();
  const hoy = hoyISO();
  const [atendidas, setAtendidas] = useState<Record<string, string>>(() => leerAtendidas());

  useEffect(() => {
    guardarAtendidas(atendidas);
  }, [atendidas]);

  const todas = useMemo(
    () =>
      calcularAlertas(
        unidades.items,
        operadores.items,
        facturas.items,
        viajes.items,
        estatusViajes.items,
        empresa.value.alertasVencimientos,
        hoy,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unidades.items, operadores.items, facturas.items, viajes.items, estatusViajes.items, empresa.value.alertasVencimientos],
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
