import type { Cliente, Operador, PosicionGpsUnidad, Ruta, Unidad, Viaje } from '../types';
import type { Tone } from '../components/ui/Badge';

// Si el proveedor de GPS de la unidad deja de reportar (se apago, perdio
// senal) su ultima posicion se vuelve vieja -- pasado este tiempo se deja de
// mostrar como "en vivo" y se regresa a la posicion CALCULADA sobre la Ruta,
// para nunca mostrar una señal real como si fuera actual cuando ya no lo es.
const MINUTOS_VIGENCIA_POSICION_GPS = 30;

function posicionGpsVigente(posicion: PosicionGpsUnidad | undefined, ahora: Date): [number, number] | null {
  if (!posicion) return null;
  const fecha = new Date(posicion.fechaHoraGps);
  if (Number.isNaN(fecha.getTime())) return null;
  const minutos = (ahora.getTime() - fecha.getTime()) / 60000;
  if (minutos < 0 || minutos > MINUTOS_VIGENCIA_POSICION_GPS) return null;
  return [posicion.latitud, posicion.longitud];
}

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
  /** true si `posicion` viene de una plataforma de GPS real conectada (reciente); false si es la posicion calculada sobre el trazo de la Ruta. */
  posicionEnVivo: boolean;
  /** Rumbo en grados (0=Norte, 90=Este, 180=Sur, 270=Oeste) para orientar el icono del camion; null si no se puede determinar (ej. Ruta sin trazo). */
  rumbo: number | null;
  trazo: [number, number][] | null;
  eta: string;
}

/** Arma una fila de tabla/mapa de Monitoreo con todo lo ya calculado (etiqueta,
 * avance, posicion) para un viaje, reusado por Centro de Control, Monitoreo
 * de Viajes y Mapa GPS para garantizar que las 3 pantallas siempre coincidan.
 * `posicionesGps` (opcional) es la ultima lectura real por unidad -- si hay
 * una vigente para la unidad de este viaje, se usa en vez de la posicion
 * calculada sobre la Ruta. */
export function construirFilaMonitoreo(
  v: Viaje,
  ahora: Date,
  rutas: Ruta[],
  unidades: Unidad[],
  operadores: Operador[],
  clientes: Cliente[],
  colorEstatus: (nombre: string) => Tone | null,
  posicionesGps: PosicionGpsUnidad[] = [],
): FilaMonitoreo {
  const horasViaje = horasAutorizadas(v, rutas);
  const etiqueta = etiquetaTablero(v, ahora, colorEstatus(v.estatus), horasViaje);
  const fraccion = avanceTransito(v, ahora, horasViaje);
  const ruta = v.rutaCodigo ? rutas.find((r) => r.codigo === v.rutaCodigo) : undefined;
  const posicionGpsCruda = posicionesGps.find((p) => p.id === v.unidadId);
  const posicionGps = posicionGpsVigente(posicionGpsCruda, ahora);
  const posicionEnVivo = posicionGps !== null;
  const posicion = posicionGps ?? posicionEnRuta(ruta, fraccion);
  const rumbo = posicionEnVivo ? (posicionGpsCruda?.rumboGrados ?? null) : rumboEnRuta(ruta, fraccion);
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
    posicionEnVivo,
    rumbo,
    trazo,
    eta: limite ? limite.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '--:--',
  };
}

function parseTrazo(ruta: Ruta | undefined): [number, number][] | null {
  if (!ruta || !ruta.trazoRuta) return null;
  try {
    const puntos = JSON.parse(ruta.trazoRuta);
    return Array.isArray(puntos) && puntos.length > 0 ? puntos : null;
  } catch {
    return null;
  }
}

function indiceEnTrazo(puntos: [number, number][], fraccion: number): number {
  const f = Math.min(Math.max(fraccion, 0), 1);
  return Math.min(puntos.length - 1, Math.floor(f * (puntos.length - 1)));
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
  if (fraccion === null) return null;
  const puntos = parseTrazo(ruta);
  if (!puntos) return null;
  return puntos[indiceEnTrazo(puntos, fraccion)] ?? null;
}

/** Angulo (0-360, sentido horario desde el Norte) del punto `desde` hacia el punto `hasta`, formula de rumbo inicial (great-circle bearing). */
function rumboEntrePuntos([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]): number {
  const aRad = (g: number) => (g * Math.PI) / 180;
  const aGrados = (r: number) => (r * 180) / Math.PI;
  const f1 = aRad(lat1);
  const f2 = aRad(lat2);
  const dl = aRad(lon2 - lon1);
  const y = Math.sin(dl) * Math.cos(f2);
  const x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl);
  return (aGrados(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Rumbo aproximado (0=Norte, 90=Este, 180=Sur, 270=Oeste) hacia donde avanza
 * la unidad sobre el trazo de la Ruta, para orientar el icono del camion
 * mientras la posicion es CALCULADA (sin GPS real conectado). null si no hay
 * trazo o no hay suficientes puntos para saber la direccion.
 */
export function rumboEnRuta(ruta: Ruta | undefined, fraccion: number | null): number | null {
  if (fraccion === null) return null;
  const puntos = parseTrazo(ruta);
  if (!puntos || puntos.length < 2) return null;
  const idx = indiceEnTrazo(puntos, fraccion);
  const desde = puntos[Math.max(0, idx - 1)];
  const hasta = puntos[Math.min(puntos.length - 1, idx + 1)];
  if (desde[0] === hasta[0] && desde[1] === hasta[1]) return null;
  return rumboEntrePuntos(desde, hasta);
}
