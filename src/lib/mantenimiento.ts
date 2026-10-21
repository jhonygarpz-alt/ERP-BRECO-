import type { OrdenServicio, OrdenServicioLinea, PlanServicio, Unidad } from '../types';

export function nextFolioMantenimiento(registros: { folio: string }[], prefijo: string): string {
  const max = registros.reduce((acc, r) => {
    const n = Number(r.folio.replace(/\D/g, ''));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `${prefijo}${String(max + 1).padStart(9, '0')}`;
}

/** Horas transcurridas entre el inicio y el final de un renglon de servicio, o 0 si falta algun dato. */
export function tiempoRealHoras(linea: Pick<OrdenServicioLinea, 'fechaInicio' | 'horaInicio' | 'fechaFinal' | 'horaFinal'>): number {
  if (!linea.fechaInicio || !linea.horaInicio || !linea.fechaFinal || !linea.horaFinal) return 0;
  const inicio = new Date(`${linea.fechaInicio}T${linea.horaInicio}`);
  const final = new Date(`${linea.fechaFinal}T${linea.horaFinal}`);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(final.getTime())) return 0;
  const horas = (final.getTime() - inicio.getTime()) / (1000 * 60 * 60);
  return horas > 0 ? Math.round(horas * 100) / 100 : 0;
}

export function totalManoObra(lineas: OrdenServicioLinea[]): number {
  return Math.round(lineas.reduce((acc, l) => acc + l.manoObra, 0) * 100) / 100;
}

/**
 * La Orden de Servicio "activa" de una unidad (si tiene una): cualquiera que no este
 * Concluida ni Cancelada. Mientras exista, la unidad se considera en mantenimiento en
 * todo el sistema (Parque Vehicular, seleccion de unidad en Viajes, etc.).
 */
export function ordenServicioActivaDeUnidad(unidadId: string, ordenes: OrdenServicio[]): OrdenServicio | null {
  return (
    ordenes
      .filter((o) => o.unidadId === unidadId && o.estatus !== 'Concluida' && o.estatus !== 'Cancelada')
      .sort((a, b) => b.fecha.localeCompare(a.fecha))[0] ?? null
  );
}

function sumarMeses(fechaIso: string, meses: number): string {
  const [y, m, d] = fechaIso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + meses, d));
  return dt.toISOString().slice(0, 10);
}

function diferenciaDias(desdeIso: string, hastaIso: string): number {
  const [y1, m1, d1] = desdeIso.split('-').map(Number);
  const [y2, m2, d2] = hastaIso.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

export interface EstadoServicioProgramado {
  unidad: Unidad;
  plan: PlanServicio;
  ultimoServicio: OrdenServicio | null;
  kmRecorridos: number | null;
  kmRestantes: number | null;
  fechaVencimiento: string | null;
  diasRestantes: number | null;
  vencido: boolean;
}

/** Ultima orden de servicio concluida de una unidad que cumplio un plan de servicio dado. */
function ultimaOrdenDelPlan(unidadId: string, planId: string, ordenes: OrdenServicio[]): OrdenServicio | null {
  return (
    ordenes
      .filter((o) => o.unidadId === unidadId && o.estatus === 'Concluida' && o.planesServicioIds.includes(planId))
      .sort((a, b) => b.fecha.localeCompare(a.fecha))[0] ?? null
  );
}

/** Cruza cada Unidad activa contra cada Plan de Servicio que le aplica, y calcula si ya vencio o cuanto le falta. */
export function calcularServiciosProgramados(unidades: Unidad[], planes: PlanServicio[], ordenes: OrdenServicio[], hoy: string): EstadoServicioProgramado[] {
  const resultados: EstadoServicioProgramado[] = [];

  for (const unidad of unidades.filter((u) => u.activa)) {
    for (const plan of planes.filter((p) => p.activo && (p.aplicaA === 'Todas' || p.aplicaA === unidad.grupoUnidades))) {
      const ultimoServicio = ultimaOrdenDelPlan(unidad.id, plan.id, ordenes);

      const kmRecorridos = plan.intervaloKm !== null ? unidad.kilometrajeActual - (ultimoServicio?.kilometrajeAlMomento ?? 0) : null;
      const kmRestantes = plan.intervaloKm !== null && kmRecorridos !== null ? plan.intervaloKm - kmRecorridos : null;

      const fechaBase = ultimoServicio?.fecha;
      const fechaVencimiento = plan.intervaloMeses !== null && fechaBase ? sumarMeses(fechaBase, plan.intervaloMeses) : null;
      const diasRestantes = fechaVencimiento ? diferenciaDias(hoy, fechaVencimiento) : null;

      const vencido = (kmRestantes !== null && kmRestantes <= 0) || (diasRestantes !== null && diasRestantes <= 0);

      resultados.push({ unidad, plan, ultimoServicio, kmRecorridos, kmRestantes, fechaVencimiento, diasRestantes, vencido });
    }
  }

  return resultados.sort((a, b) => {
    if (a.vencido !== b.vencido) return a.vencido ? -1 : 1;
    return (a.kmRestantes ?? a.diasRestantes ?? 0) - (b.kmRestantes ?? b.diasRestantes ?? 0);
  });
}

export const CHECKLIST_FISICOMECANICO_TEMPLATE: { seccion: string; concepto: string; descripcion: string }[] = [
  { seccion: 'Llantas y Rines', concepto: 'Estado y presion de llantas', descripcion: 'Verificar presion, desgaste y danos.' },
  { seccion: 'Llantas y Rines', concepto: 'Birlos y tuercas completos', descripcion: 'Verificar que no existan faltantes o flojos.' },
  { seccion: 'Llantas y Rines', concepto: 'Llanta de refaccion', descripcion: 'Verificar estado, presion y sujecion.' },
  { seccion: 'Frenos', concepto: 'Sistema de frenos de servicio', descripcion: 'Revisar fugas, mangueras, camaras y estado general.' },
  { seccion: 'Frenos', concepto: 'Freno de estacionamiento', descripcion: 'Verificar funcionamiento y ajuste.' },
  { seccion: 'Luces', concepto: 'Luces delanteras y direccionales', descripcion: 'Verificar funcionamiento y limpieza.' },
  { seccion: 'Luces', concepto: 'Luces traseras y de freno', descripcion: 'Verificar funcionamiento.' },
  { seccion: 'Luces', concepto: 'Torreta y luces de emergencia', descripcion: 'Verificar encendido y visibilidad.' },
  { seccion: 'Espejos y Cristales', concepto: 'Espejos laterales', descripcion: 'Verificar fijacion, ajuste y estado del cristal.' },
  { seccion: 'Espejos y Cristales', concepto: 'Parabrisas y limpiadores', descripcion: 'Verificar visibilidad y funcionamiento de limpiaparabrisas.' },
  { seccion: 'Niveles de Fluidos', concepto: 'Nivel de aceite de motor', descripcion: 'Verificar nivel y ausencia de fugas.' },
  { seccion: 'Niveles de Fluidos', concepto: 'Nivel de refrigerante', descripcion: 'Verificar nivel en el deposito.' },
  { seccion: 'Niveles de Fluidos', concepto: 'Nivel de liquido de frenos', descripcion: 'Verificar nivel en el deposito.' },
  { seccion: 'Suspension', concepto: 'Amortiguadores y muelles', descripcion: 'Verificar fugas, roturas o desgaste.' },
  { seccion: 'Carroceria', concepto: 'Estado general de la carroceria', descripcion: 'Verificar golpes, corrosion o danos visibles.' },
  { seccion: 'Carroceria', concepto: 'Quinta rueda / acoplamiento', descripcion: 'Verificar seguro y estado del acoplamiento.' },
  { seccion: 'Seguridad', concepto: 'Extintor vigente', descripcion: 'Verificar carga, sello y fecha de vigencia.' },
  { seccion: 'Seguridad', concepto: 'Botiquin de primeros auxilios', descripcion: 'Verificar que este completo y a bordo.' },
  { seccion: 'Seguridad', concepto: 'Triangulos / senales de emergencia', descripcion: 'Verificar que esten completos y en buen estado.' },
  { seccion: 'Documentos', concepto: 'Documentos de la unidad a bordo', descripcion: 'Verificar tarjeta de circulacion, poliza y permisos.' },
];
