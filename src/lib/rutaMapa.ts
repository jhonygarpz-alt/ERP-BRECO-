// Geocodificacion (Nominatim/OpenStreetMap) y trazado de ruta (OSRM), ambos
// servicios publicos gratuitos, sin necesidad de una API key de pago (ej.
// Google Maps). Se usan solo bajo accion explicita del usuario (boton
// "Trazar Ruta"), nunca en automatico mientras escribe, para respetar el
// limite de uso razonable de Nominatim.

export interface PuntoGeocodificado {
  lat: number;
  lon: number;
  displayName: string;
}

export async function geocodificarDireccion(direccion: string): Promise<PuntoGeocodificado> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(direccion)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('No se pudo consultar el geocodificador.');
  const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  if (data.length === 0) throw new Error(`No se encontro la direccion: "${direccion}"`);
  return { lat: Number(data[0].lat), lon: Number(data[0].lon), displayName: data[0].display_name };
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
