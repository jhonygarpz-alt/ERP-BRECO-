// Integracion opcional con Google Places (API nueva) para poder encontrar
// tambien nombres de negocios/marcas (ej. "Grupo Modelo, Lago Alberto"),
// algo que el buscador gratuito de OpenStreetMap/Nominatim no puede hacer
// porque no tiene un directorio de negocios, solo direcciones reales.
//
// Se activa unicamente si esta configurada la variable de entorno
// VITE_GOOGLE_MAPS_API_KEY (en Vercel, Project Settings -> Environment
// Variables). Si no esta configurada, rutaMapa.ts sigue usando
// OpenStreetMap exactamente como hasta ahora -- ver googleMapsDisponible().
import type { PuntoGeocodificado, SugerenciaDireccion } from './rutaMapa';

export function googleMapsDisponible(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
}

// Memoizado a nivel de modulo: este archivo es el unico punto donde se
// carga el script de Google Maps en toda la app, asi que basta con
// recordar la promesa de carga (nunca se inserta el script dos veces).
let cargaEnCurso: Promise<void> | null = null;

function cargarGoogleMaps(): Promise<void> {
  if (cargaEnCurso) return cargaEnCurso;
  cargaEnCurso = new Promise<void>((resolve, reject) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
    const nombreCallback = '__erpBrecoGoogleMapsListo__';
    (window as unknown as Record<string, () => void>)[nombreCallback] = () => resolve();
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&callback=${nombreCallback}&v=weekly&language=es&region=MX`;
    script.async = true;
    script.onerror = () => reject(new Error('No se pudo cargar Google Maps (revisa la llave configurada).'));
    document.head.appendChild(script);
  }).then(() => google.maps.importLibrary('places').then(() => undefined));
  return cargaEnCurso;
}

export async function buscarSugerenciasDireccionGoogle(termino: string): Promise<SugerenciaDireccion[]> {
  await cargarGoogleMaps();
  const { AutocompleteSuggestion } = await google.maps.importLibrary('places');
  const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input: termino,
    includedRegionCodes: ['mx'],
    language: 'es',
  });
  return suggestions
    .filter((s): s is google.maps.places.AutocompleteSuggestion & { placePrediction: google.maps.places.PlacePrediction } =>
      Boolean(s.placePrediction),
    )
    .map((s) => {
      const prediccion = s.placePrediction;
      return {
        texto: prediccion.text.text,
        resolver: async (): Promise<PuntoGeocodificado> => {
          const place = prediccion.toPlace();
          await place.fetchFields({ fields: ['location', 'formattedAddress'] });
          if (!place.location) throw new Error('No se pudo obtener la ubicacion de ese resultado.');
          return {
            lat: place.location.lat(),
            lon: place.location.lng(),
            displayName: place.formattedAddress ?? prediccion.text.text,
          };
        },
      };
    });
}

export async function geocodificarTextoGoogle(direccion: string): Promise<PuntoGeocodificado> {
  await cargarGoogleMaps();
  const { Place } = await google.maps.importLibrary('places');
  const { places } = await Place.searchByText({
    textQuery: direccion,
    fields: ['location', 'formattedAddress'],
    region: 'mx',
    language: 'es',
    maxResultCount: 1,
  });
  const lugar = places[0];
  if (!lugar || !lugar.location) {
    throw new Error(`No se encontro "${direccion}" en Google Maps.`);
  }
  return { lat: lugar.location.lat(), lon: lugar.location.lng(), displayName: lugar.formattedAddress ?? direccion };
}
