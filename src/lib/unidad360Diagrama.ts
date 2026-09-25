import type { TipoHotspotUnidad, Unidad } from '../types';
import { familiaUnidad } from './unidad360';

/** Una caja del diagrama 3D: centro + tamano (largo x, alto y, ancho z), en metros aproximados. */
export interface ParteDiagrama {
  id: string;
  centro: [number, number, number];
  tamano: [number, number, number];
  colorUnidad: boolean;
}

export interface EjeDiagrama {
  x: number;
  ancho: number;
}

/** Punto fijo de informacion sobre el diagrama generico (modo '3d' de UnidadHotspot.posicion3d). */
export interface PosicionHotspot3D {
  key: string;
  label: string;
  tipoSugerido: TipoHotspotUnidad;
  pos: [number, number, number];
}

export interface LayoutDiagrama3D {
  partes: ParteDiagrama[];
  ejes: EjeDiagrama[];
  radioLlanta: number;
  hotspots: PosicionHotspot3D[];
  largoTotal: number;
}

/** Genera un diagrama esquematico (no fotorrealista) de la unidad, a partir de su familia (tractocamion/camion/etc.) y su numero de ejes -- suficiente para orientarse y para anclar los hotspots, no para representar el modelo exacto del fabricante. */
export function generarLayoutDiagrama3D(unidad: Unidad): LayoutDiagrama3D {
  const familia = familiaUnidad(unidad.tipo);
  const radioLlanta = 0.45;
  const anchoUnidad = 2.4;

  if (familia === 'tractocamion') {
    const ejesTrasero = Math.min(3, Math.max(1, (unidad.numeroEjes || 5) - 3));
    const partes: ParteDiagrama[] = [
      { id: 'cofre', centro: [-2.6, 0.95, 0], tamano: [0.9, 0.9, anchoUnidad - 0.2], colorUnidad: true },
      { id: 'cabina', centro: [-1.85, 1.55, 0], tamano: [1.3, 1.7, anchoUnidad], colorUnidad: true },
      { id: 'chasis', centro: [0.9, 0.55, 0], tamano: [7.2, 0.25, anchoUnidad - 0.6], colorUnidad: false },
      { id: 'caja', centro: [2.2, 1.9, 0], tamano: [4.6, 2.3, anchoUnidad], colorUnidad: true },
    ];
    const ejes: EjeDiagrama[] = [{ x: -1.9, ancho: anchoUnidad }];
    ejes.push({ x: -0.3, ancho: anchoUnidad });
    for (let i = 0; i < ejesTrasero; i++) ejes.push({ x: 3.3 + i * 0.85, ancho: anchoUnidad });

    const hotspots: PosicionHotspot3D[] = [
      { key: 'cabina', label: 'Cabina', tipoSugerido: 'cabina', pos: [-1.85, 1.55, anchoUnidad / 2 + 0.1] },
      { key: 'motor', label: 'Motor', tipoSugerido: 'motor', pos: [-2.6, 0.95, anchoUnidad / 2 + 0.1] },
      { key: 'bateria', label: 'Bateria', tipoSugerido: 'bateria', pos: [-1.3, 0.55, anchoUnidad / 2 + 0.1] },
      { key: 'caja', label: 'Caja / Remolque', tipoSugerido: 'caja', pos: [2.2, 1.9, anchoUnidad / 2 + 0.1] },
      { key: 'llanta_direccion_izq', label: 'Llanta direccion izquierda', tipoSugerido: 'llanta', pos: [-1.9, radioLlanta, -(anchoUnidad / 2 + 0.15)] },
      { key: 'llanta_direccion_der', label: 'Llanta direccion derecha', tipoSugerido: 'llanta', pos: [-1.9, radioLlanta, anchoUnidad / 2 + 0.15] },
      { key: 'llanta_traccion_izq', label: 'Llanta traccion izquierda', tipoSugerido: 'llanta', pos: [-0.3, radioLlanta, -(anchoUnidad / 2 + 0.15)] },
      { key: 'llanta_traccion_der', label: 'Llanta traccion derecha', tipoSugerido: 'llanta', pos: [-0.3, radioLlanta, anchoUnidad / 2 + 0.15] },
    ];
    for (let i = 0; i < ejesTrasero; i++) {
      const x = 3.3 + i * 0.85;
      hotspots.push({ key: `llanta_remolque_${i + 1}_izq`, label: `Llanta remolque ${i + 1} izquierda`, tipoSugerido: 'llanta', pos: [x, radioLlanta, -(anchoUnidad / 2 + 0.15)] });
      hotspots.push({ key: `llanta_remolque_${i + 1}_der`, label: `Llanta remolque ${i + 1} derecha`, tipoSugerido: 'llanta', pos: [x, radioLlanta, anchoUnidad / 2 + 0.15] });
    }
    return { partes, ejes, radioLlanta, hotspots, largoTotal: 8.5 };
  }

  if (familia === 'ligero') {
    const partes: ParteDiagrama[] = [
      { id: 'cabina', centro: [-0.6, 1.0, 0], tamano: [1.6, 1.1, anchoUnidad - 0.6], colorUnidad: true },
      { id: 'caja', centro: [0.9, 0.9, 0], tamano: [2.0, 0.9, anchoUnidad - 0.6], colorUnidad: true },
    ];
    const ejes: EjeDiagrama[] = [{ x: -0.8, ancho: anchoUnidad - 0.6 }, { x: 1.3, ancho: anchoUnidad - 0.6 }];
    const hotspots: PosicionHotspot3D[] = [
      { key: 'cabina', label: 'Cabina', tipoSugerido: 'cabina', pos: [-0.6, 1.0, anchoUnidad / 2 - 0.2] },
      { key: 'motor', label: 'Motor', tipoSugerido: 'motor', pos: [-1.3, 0.9, anchoUnidad / 2 - 0.2] },
      { key: 'caja', label: 'Caja', tipoSugerido: 'caja', pos: [0.9, 0.9, anchoUnidad / 2 - 0.2] },
      { key: 'llanta_del_izq', label: 'Llanta delantera izquierda', tipoSugerido: 'llanta', pos: [-0.8, radioLlanta * 0.85, -(anchoUnidad / 2 - 0.1)] },
      { key: 'llanta_del_der', label: 'Llanta delantera derecha', tipoSugerido: 'llanta', pos: [-0.8, radioLlanta * 0.85, anchoUnidad / 2 - 0.1] },
      { key: 'llanta_tras_izq', label: 'Llanta trasera izquierda', tipoSugerido: 'llanta', pos: [1.3, radioLlanta * 0.85, -(anchoUnidad / 2 - 0.1)] },
      { key: 'llanta_tras_der', label: 'Llanta trasera derecha', tipoSugerido: 'llanta', pos: [1.3, radioLlanta * 0.85, anchoUnidad / 2 - 0.1] },
    ];
    return { partes, ejes, radioLlanta: radioLlanta * 0.85, hotspots, largoTotal: 4.2 };
  }

  // camion unitario, grua u otro: una sola caja/plataforma sobre el chasis del camion (rabon/torton/grua).
  const ejesTrasero = Math.min(3, Math.max(1, (unidad.numeroEjes || 3) - 1));
  const partes: ParteDiagrama[] = [
    { id: 'cofre', centro: [-1.9, 0.9, 0], tamano: [0.7, 0.8, anchoUnidad - 0.2], colorUnidad: true },
    { id: 'cabina', centro: [-1.3, 1.45, 0], tamano: [1.1, 1.5, anchoUnidad], colorUnidad: true },
    { id: 'chasis', centro: [0.9, 0.5, 0], tamano: [4.6, 0.22, anchoUnidad - 0.6], colorUnidad: false },
    { id: 'caja', centro: [1.2, 1.6, 0], tamano: [3.8, 1.9, anchoUnidad], colorUnidad: true },
  ];
  const ejes: EjeDiagrama[] = [{ x: -1.4, ancho: anchoUnidad }];
  for (let i = 0; i < ejesTrasero; i++) ejes.push({ x: 1.3 + i * 0.85, ancho: anchoUnidad });

  const hotspots: PosicionHotspot3D[] = [
    { key: 'cabina', label: 'Cabina', tipoSugerido: 'cabina', pos: [-1.3, 1.45, anchoUnidad / 2 + 0.1] },
    { key: 'motor', label: 'Motor', tipoSugerido: 'motor', pos: [-1.9, 0.9, anchoUnidad / 2 + 0.1] },
    { key: 'bateria', label: 'Bateria', tipoSugerido: 'bateria', pos: [-0.9, 0.5, anchoUnidad / 2 + 0.1] },
    { key: 'caja', label: 'Caja', tipoSugerido: 'caja', pos: [1.2, 1.6, anchoUnidad / 2 + 0.1] },
    { key: 'llanta_direccion_izq', label: 'Llanta direccion izquierda', tipoSugerido: 'llanta', pos: [-1.4, radioLlanta, -(anchoUnidad / 2 + 0.15)] },
    { key: 'llanta_direccion_der', label: 'Llanta direccion derecha', tipoSugerido: 'llanta', pos: [-1.4, radioLlanta, anchoUnidad / 2 + 0.15] },
  ];
  for (let i = 0; i < ejesTrasero; i++) {
    const x = 1.3 + i * 0.85;
    hotspots.push({ key: `llanta_trasera_${i + 1}_izq`, label: `Llanta trasera ${i + 1} izquierda`, tipoSugerido: 'llanta', pos: [x, radioLlanta, -(anchoUnidad / 2 + 0.15)] });
    hotspots.push({ key: `llanta_trasera_${i + 1}_der`, label: `Llanta trasera ${i + 1} derecha`, tipoSugerido: 'llanta', pos: [x, radioLlanta, anchoUnidad / 2 + 0.15] });
  }
  return { partes, ejes, radioLlanta, hotspots, largoTotal: 6.5 };
}
