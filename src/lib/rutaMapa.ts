// Geocodificacion y trazado de ruta. El ruteo (calcularRuta) siempre usa
// OSRM, publico y gratuito. La geocodificacion (encontrar coordenadas a
// partir de un texto) usa Google Places cuando esta configurada la llave
// VITE_GOOGLE_MAPS_API_KEY (googlePlaces.ts) -- necesario para reconocer
// nombres de negocios/marcas (ej. "Grupo Modelo, Lago Alberto"), algo que
// OpenStreetMap/Nominatim no puede hacer al no tener un directorio de
// negocios. Si esa llave no esta configurada, o si Google falla, se usa
// Nominatim (gratuito, sin registro) como respaldo -- se usan solo bajo
// accion explicita del usuario (boton "Trazar Ruta" o al escribir en el
// buscador, con debounce), nunca de forma automatica al cargar la pagina.
import { googleMapsDisponible, geocodificarTextoGoogle, buscarSugerenciasDireccionGoogle } from './googlePlaces';

export interface PuntoGeocodificado {
  lat: number;
  lon: number;
  displayName: string;
}

// Una sugerencia del autocompletado: `texto` se muestra de inmediato en la
// lista, y `resolver()` obtiene las coordenadas exactas solo cuando el
// usuario la elige (con Nominatim ya vienen incluidas; con Google Places
// requiere una segunda consulta -- "Place Details" -- que solo se hace al
// seleccionar, no por cada sugerencia mostrada, para no generar consultas
// de mas).
export interface SugerenciaDireccion {
  texto: string;
  resolver: () => Promise<PuntoGeocodificado>;
}

// Todas las rutas del sistema son nacionales, asi que la busqueda de
// direcciones se acota a Mexico (countrycodes=mx) para que no aparezcan
// coincidencias homonimas en otros paises (ej. una calle "La Merced" en
// otro continente) ni desvien el trazo cuando no se encuentra la direccion
// exacta.
const PAIS_BUSQUEDA = 'mx';

async function buscarEnNominatim(direccion: string): Promise<{ lat: string; lon: string; display_name: string }[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=${PAIS_BUSQUEDA}&q=${encodeURIComponent(direccion)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('No se pudo consultar el geocodificador.');
  return (await res.json()) as { lat: string; lon: string; display_name: string }[];
}

// Nominatim exige una coincidencia casi literal de cada componente: nombres
// de colonia con sufijos como "I", "II", "1a Seccion" frecuentemente no
// coinciden tal cual aunque la direccion sea real. Si la busqueda completa
// falla, se reintenta quitando progresivamente el componente mas propenso a
// no coincidir (la colonia, que normalmente es el 2o elemento de la lista
// separada por comas) y luego el C.P., antes de rendirse.
async function geocodificarDireccionOSM(direccion: string, motivoRespaldo?: string): Promise<PuntoGeocodificado> {
  const partes = direccion.split(',').map((p) => p.trim()).filter(Boolean);
  const intentos = [direccion];
  if (partes.length > 2) intentos.push([partes[0], ...partes.slice(2)].join(', '));
  const sinCp = partes.filter((p) => !/^\d{4,5}$/.test(p));
  if (sinCp.length !== partes.length && sinCp.length > 0) intentos.push(sinCp.join(', '));

  for (const intento of intentos) {
    const data = await buscarEnNominatim(intento);
    if (data.length > 0) return { lat: Number(data[0].lat), lon: Number(data[0].lon), displayName: data[0].display_name };
  }

  throw new Error(
    `No se encontro "${direccion}" en OpenStreetMap (el buscador gratuito no reconoce nombres de empresas/marcas, ` +
      'solo direcciones reales). Intenta con calle, colonia y ciudad (ej. "Lago Alberto, Anahuac, Ciudad de Mexico"), ' +
      'sin el numero exterior ni el nombre del negocio, o elige una opcion de la lista de sugerencias mientras escribes.' +
      (motivoRespaldo ? ` [${motivoRespaldo}]` : ''),
  );
}

// Sugerencias tipo "autocompletado" mientras el usuario escribe. Se invoca
// con debounce desde el componente (nunca en cada tecla) para respetar el
// limite de uso razonable de Nominatim (maximo 1 solicitud por segundo).
async function buscarSugerenciasDireccionOSM(termino: string): Promise<SugerenciaDireccion[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=${PAIS_BUSQUEDA}&q=${encodeURIComponent(termino)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return [];
  const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  return data.map((d) => ({
    texto: d.display_name,
    resolver: async () => ({ lat: Number(d.lat), lon: Number(d.lon), displayName: d.display_name }),
  }));
}

export async function geocodificarDireccion(direccion: string): Promise<PuntoGeocodificado> {
  if (!googleMapsDisponible()) {
    return geocodificarDireccionOSM(direccion, 'Google Maps no esta configurado (falta VITE_GOOGLE_MAPS_API_KEY).');
  }
  try {
    return await geocodificarTextoGoogle(direccion);
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err);
    console.error('Google Places fallo, se intenta con OpenStreetMap como respaldo:', err);
    return geocodificarDireccionOSM(direccion, `Google Maps fallo: ${motivo}`);
  }
}

export async function buscarSugerenciasDireccion(termino: string): Promise<SugerenciaDireccion[]> {
  if (googleMapsDisponible()) {
    try {
      return await buscarSugerenciasDireccionGoogle(termino);
    } catch (err) {
      console.error('Google Places fallo, se intenta con OpenStreetMap como respaldo:', err);
    }
  }
  return buscarSugerenciasDireccionOSM(termino);
}

export interface RutaCalculada {
  distanciaKm: number;
  duracionHoras: number;
  coordenadas: [number, number][];
}

export async function calcularRuta(origen: PuntoGeocodificado, destino: PuntoGeocodificado): Promise<RutaCalculada> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origen.lon},${origen.lat};${destino.lon},${destino.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('No se pudo calcular la ruta.');
  const data = (await res.json()) as {
    code: string;
    routes: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
  };
  if (data.code !== 'Ok' || data.routes.length === 0) throw new Error('No se encontro una ruta entre esos dos puntos.');
  const ruta = data.routes[0];
  return {
    distanciaKm: Math.round((ruta.distance / 1000) * 10) / 10,
    duracionHoras: Math.round((ruta.duration / 3600) * 100) / 100,
    // OSRM entrega [lon, lat]; Leaflet espera [lat, lon].
    coordenadas: ruta.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
  };
}

const VELOCIDAD_PROMEDIO_MANUAL_KMH = 60;

function distanciaHaversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Para un trazado manual (lineas rectas entre los puntos que arrastra/agrega
// el usuario) no hay forma de medir duracion real como con OSRM, asi que se
// estima con una velocidad promedio fija -- el usuario siempre puede ajustar
// "Horas" a mano despues en el formulario de la Ruta.
export function rutaDesdePuntosManuales(puntos: [number, number][]): RutaCalculada {
  let distanciaKm = 0;
  for (let i = 1; i < puntos.length; i++) distanciaKm += distanciaHaversineKm(puntos[i - 1], puntos[i]);
  distanciaKm = Math.round(distanciaKm * 10) / 10;
  return {
    distanciaKm,
    duracionHoras: Math.round((distanciaKm / VELOCIDAD_PROMEDIO_MANUAL_KMH) * 100) / 100,
    coordenadas: puntos,
  };
}

// Decima un trazo de OSRM (puede traer cientos de puntos) a un numero
// manejable de "manijas" arrastrables para editar a mano, siempre
// conservando el primer y ultimo punto.
export function muestrearPuntos(puntos: [number, number][], maximo: number): [number, number][] {
  if (puntos.length <= maximo) return puntos;
  const paso = (puntos.length - 1) / (maximo - 1);
  const resultado: [number, number][] = [];
  for (let i = 0; i < maximo; i++) resultado.push(puntos[Math.round(i * paso)]);
  return resultado;
}
