import type { Cliente, Operador, Ruta, Unidad, Viaje } from '../types';
import type { Tone } from '../components/ui/Badge';

// Solo se usa como respaldo cuando el viaje no tiene una Ruta capturada (o
// esa Ruta no trae sus horas estimadas) -- siempre que se pueda, el limite
// se calcula con las horas reales de esa Ruta, no con un numero fijo.
export const HORAS_MAX_TRANSITO_RESPALDO = 24;

// El catalogo de Estatus de Viaje es texto libre (EstatusViaje = string), asi
// que dos capturas del mismo estatus pueden diferir en mayusculas/minusculas
// ("En transito" vs "en transito"). Todas las comparaciones normalizan antes
// de comparar para no depender de que coincida el case exacto.
export function normalizarEstatus(estatus: string): string {
  return estatus.trim().toLowerCase();
}

export function formatearDuracion(ms: number): string {
  const totalMin = Math.max(0, Math.round(Math.abs(ms) / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

/** Horas autorizadas de transito para este viaje: las de su Ruta (si tiene
 * una capturada con horas > 0) o, si no, el respaldo fijo. */
export function horasAutorizadas(v: Viaje, rutas: Ruta[]): number {
  const ruta = v.rutaCodigo ? rutas.find((r) => r.codigo === v.rutaCodigo) : undefined;
  return ruta && ruta.horas > 0 ? ruta.horas : HORAS_MAX_TRANSITO_RESPALDO;
}

/**
 * Origen/destino real del viaje, con 3 niveles de respaldo: el primer
 * trayecto capturado, los campos legacy Viaje.origen/destino, y -- el caso
 * mas comun cuando el viaje se armo eligiendo una Ruta del catalogo -- la
 * direccion de esa Ruta (Ruta.origenDireccion/destinoDireccion). Al elegir
 * una Ruta el formulario de Viaje solo copia rutaCodigo/rutaDescripcion (y
 * los trayectos si la Ruta ya traia los suyos, lo cual casi nunca pasa), asi
 * que sin este tercer nivel el origen/destino del viaje se ve vacio aunque
 * la Ruta si lo tenga capturado.
 */
export function origenViaje(v: Viaje, rutas: Ruta[]): string {
  if (v.trayectos[0]?.origen) return v.trayectos[0].origen;
  if (v.origen) return v.origen;
  const ruta = v.rutaCodigo ? rutas.find((r) => r.codigo === v.rutaCodigo) : undefined;
  return ruta?.origenDireccion || '';
}
export function destinoViaje(v: Viaje, rutas: Ruta[]): string {
  if (v.trayectos[0]?.destino) return v.trayectos[0].destino;
  if (v.destino) return v.destino;
  const ruta = v.rutaCodigo ? rutas.find((r) => r.codigo === v.rutaCodigo) : undefined;
  return ruta?.destinoDireccion || '';
}

/** Inicio real del transito: fecha + hora de salida a ruta. null si aun no se ha registrado. */
export function inicioTransito(v: Viaje): Date | null {
  if (!v.horaSalida) return null;
  const d = new Date(`${v.fecha}T${v.horaSalida}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Limite autorizado: hora de salida + las horas autorizadas para esta Ruta. */
export function limiteTransito(v: Viaje, horasAutorizadasViaje: number): Date | null {
  const inicio = inicioTransito(v);
  return inicio ? new Date(inicio.getTime() + horasAutorizadasViaje * 60 * 60 * 1000) : null;
}

export interface EtiquetaEstatus {
  texto: string;
  tono: Tone;
  detalle?: string;
}

/**
 * Traduce el estatus real del viaje al lenguaje de un tablero de operacion.
 * En cuanto hay hora de salida registrada, "EN TIEMPO"/"DEMORADO" se
 * calculan contra el limite real (salida + horas de ETA de la Ruta) y
 * muestran cuanto falta o cuanto de retraso lleva.
 */
export function etiquetaTablero(v: Viaje, ahora: Date, colorPersonalizado: Tone | null, horasAutorizadasViaje: number): EtiquetaEstatus {
  const est = normalizarEstatus(v.estatus);
  if (est === 'cancelado') return { texto: 'CANCELADO', tono: 'red' };
  if (est === 'entregado') return { texto: 'ENTREGADO', tono: 'green' };

  const limite = limiteTransito(v, horasAutorizadasViaje);
  if (limite) {
    const diff = ahora.getTime() - limite.getTime();
    if (diff > 0) return { texto: 'DEMORADO', tono: 'red', detalle: `${formatearDuracion(diff)} de retraso` };
    return { texto: 'EN TIEMPO', tono: 'green', detalle: `ETA en ${formatearDuracion(diff)}` };
  }

  if (est === 'en transito') return { texto: 'EN TRANSITO', tono: 'blue' };
  if (est === 'programado') return { texto: 'PROGRAMADO', tono: 'gray' };
  return { texto: v.estatus.toUpperCase(), tono: colorPersonalizado ?? 'gray' };
}

/**
 * Fraccion 0-1 del avance del viaje. Si ya se entrego, se va directo al 100%
 * (destino) sin importar cuanto tiempo real haya pasado -- un viaje corto ya
 * entregado no debe verse "atorado" cerca del origen solo porque transcurrio
 * una fraccion chica de las horas autorizadas.
 */
export function avanceTransito(v: Viaje, ahora: Date, horasAutorizadasViaje: number): number | null {
  const est = normalizarEstatus(v.estatus);
  if (est === 'entregado') return 1;
  if (est === 'cancelado') return null;
  const inicio = inicioTransito(v);
  if (!inicio) return null;
  const transcurrido = ahora.getTime() - inicio.getTime();
  return transcurrido / (horasAutorizadasViaje * 60 * 60 * 1000);
}

export function viajeEnTransito(v: Viaje): boolean {
  return normalizarEstatus(v.estatus) === 'en transito';
}

export function viajeActivo(v: Viaje): boolean {
  const est = normalizarEstatus(v.estatus);
  return est !== 'entregado' && est !== 'cancelado';
}

export interface FilaMonitoreo {
  viaje: Viaje;
  unidadCodigo: string;
  operadorNombre: string;
  clienteNombre: string;
  etiqueta: EtiquetaEstatus;
  fraccion: number | null;
  posicion: [number, number] | null;
  trazo: [number, number][] | null;
  eta: string;
}

/** Arma una fila de tabla/mapa de Monitoreo con todo lo ya calculado (etiqueta,
 * avance, posicion) para un viaje, reusado por Centro de Control, Monitoreo
 * de Viajes y Mapa GPS para garantizar que las 3 pantallas siempre coincidan. */
export function construirFilaMonitoreo(
  v: Viaje,
  ahora: Date,
  rutas: Ruta[],
  unidades: Unidad[],
  operadores: Operador[],
  clientes: Cliente[],
  colorEstatus: (nombre: string) => Tone | null,
): FilaMonitoreo {
  const horasViaje = horasAutorizadas(v, rutas);
  const etiqueta = etiquetaTablero(v, ahora, colorEstatus(v.estatus), horasViaje);
  const fraccion = avanceTransito(v, ahora, horasViaje);
  const ruta = v.rutaCodigo ? rutas.find((r) => r.codigo === v.rutaCodigo) : undefined;
  const posicion = posicionEnRuta(ruta, fraccion);
  const limite = limiteTransito(v, horasViaje);
  let trazo: [number, number][] | null = null;
  if (ruta?.trazoRuta) {
    try {
      trazo = JSON.parse(ruta.trazoRuta);
    } catch {
      trazo = null;
    }
  }
  return {
    viaje: v,
    unidadCodigo: unidades.find((u) => u.id === v.unidadId)?.economico ?? 'N/D',
    operadorNombre: operadores.find((o) => o.id === v.operadorId)?.nombre ?? 'N/D',
    clienteNombre: clientes.find((c) => c.id === v.clienteId)?.nombre ?? 'N/D',
    etiqueta,
    fraccion,
    posicion,
    trazo,
    eta: limite ? limite.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '--:--',
  };
}

/**
 * Posicion aproximada [lat, lon] de la unidad sobre el trazo real de su Ruta,
 * segun la fraccion de avance (0-1, la misma que ya calcula avanceTransito).
 * No hay hardware de GPS conectado al sistema -- esta es una posicion
 * CALCULADA (tiempo transcurrido / horas autorizadas, proyectado sobre las
 * coordenadas reales guardadas al trazar la Ruta), no una senal real. Si la
 * Ruta no tiene trazo guardado, regresa null y quien la llame debe omitir el
 * marcador (nunca inventar coordenadas).
 */
export function posicionEnRuta(ruta: Ruta | undefined, fraccion: number | null): [number, number] | null {
  if (!ruta || !ruta.trazoRuta || fraccion === null) return null;
  let puntos: [number, number][];
  try {
    puntos = JSON.parse(ruta.trazoRuta);
  } catch {
    return null;
  }
  if (!Array.isArray(puntos) || puntos.length === 0) return null;
  const f = Math.min(Math.max(fraccion, 0), 1);
  const idx = Math.min(puntos.length - 1, Math.floor(f * (puntos.length - 1)));
  return puntos[idx] ?? null;
}
