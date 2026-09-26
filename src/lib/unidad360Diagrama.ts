import type { TipoHotspotUnidad } from '../types';

/**
 * Puntos de informacion fijos sobre el modelo 3D real (Freightliner Cascadia
 * 2020, /models/cascadia-2020.glb). No son coordenadas absolutas: son
 * fracciones relativas a la caja delimitadora del modelo ya cargado --
 * [adelante, arriba, lado], cada uno de -1 a 1 (excepto "arriba", de 0 a 1) --
 * para que el visor los convierta a posiciones 3D reales sin importar la
 * escala/orientacion exacta con la que se exporto el archivo.
 */
export interface PosicionHotspot3D {
  key: string;
  label: string;
  tipoSugerido: TipoHotspotUnidad;
  fraccion: [number, number, number];
}

export const HOTSPOTS_CASCADIA: PosicionHotspot3D[] = [
  { key: 'cabina', label: 'Cabina', tipoSugerido: 'cabina', fraccion: [0.55, 0.72, 0] },
  { key: 'motor', label: 'Motor', tipoSugerido: 'motor', fraccion: [0.92, 0.32, 0] },
  { key: 'defensa', label: 'Defensa', tipoSugerido: 'componente', fraccion: [1, 0.12, 0] },
  { key: 'quinta_rueda', label: 'Quinta rueda', tipoSugerido: 'componente', fraccion: [-0.35, 0.12, 0] },
  { key: 'eje_delantero', label: 'Eje delantero', tipoSugerido: 'componente', fraccion: [0.72, 0.1, 0] },
  { key: 'llanta_delantera_izq', label: 'Llanta delantera izquierda', tipoSugerido: 'llanta', fraccion: [0.72, 0.1, -1] },
  { key: 'llanta_delantera_der', label: 'Llanta delantera derecha', tipoSugerido: 'llanta', fraccion: [0.72, 0.1, 1] },
  { key: 'llanta_trasera_izq', label: 'Llanta trasera izquierda', tipoSugerido: 'llanta', fraccion: [-0.8, 0.12, -1] },
  { key: 'llanta_trasera_der', label: 'Llanta trasera derecha', tipoSugerido: 'llanta', fraccion: [-0.8, 0.12, 1] },
];

/** Posiciones de llanta que se le pueden preguntar al usuario al registrar un dano de llanta (RegistrarDanoModal) -- subconjunto de HOTSPOTS_CASCADIA cuyo tipoSugerido es 'llanta'. */
export const POSICIONES_LLANTA = HOTSPOTS_CASCADIA.filter((h) => h.tipoSugerido === 'llanta');

/** Categoria de foto de la unidad que mejor corresponde a cada tipo de hotspot, para mostrar miniaturas relacionadas en el panel de informacion. */
export const CATEGORIA_FOTO_POR_TIPO: Partial<Record<TipoHotspotUnidad, string>> = {
  cabina: 'cabina',
  motor: 'motor',
  llanta: 'llantas',
  caja: 'caja_remolque',
};
