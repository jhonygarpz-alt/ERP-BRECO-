import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import type { CategoriaFotoUnidad, EstatusDanoUnidad, TipoHotspotUnidad, Unidad } from '../types';

export const BUCKET_UNIDAD_360 = 'unidad-360-fotos';

export const CATEGORIAS_FOTO: { id: CategoriaFotoUnidad; label: string; requerida: boolean }[] = [
  { id: 'frontal', label: 'Frontal', requerida: true },
  { id: 'trasera', label: 'Trasera', requerida: true },
  { id: 'lateral_izquierdo', label: 'Lateral izquierdo', requerida: true },
  { id: 'lateral_derecho', label: 'Lateral derecho', requerida: true },
  { id: 'cabina', label: 'Cabina', requerida: false },
  { id: 'motor', label: 'Motor', requerida: false },
  { id: 'chasis', label: 'Chasis', requerida: false },
  { id: 'llantas', label: 'Llantas', requerida: false },
  { id: 'caja_remolque', label: 'Caja / Remolque', requerida: false },
  { id: 'otro', label: 'Otro', requerida: false },
];

export const CATEGORIAS_360 = CATEGORIAS_FOTO.filter((c) =>
  ['frontal', 'trasera', 'lateral_izquierdo', 'lateral_derecho'].includes(c.id),
);

export const etiquetaCategoriaFoto = (c: CategoriaFotoUnidad) => CATEGORIAS_FOTO.find((x) => x.id === c)?.label ?? c;

export const TIPOS_HOTSPOT: { id: TipoHotspotUnidad; label: string }[] = [
  { id: 'componente', label: 'Componente' },
  { id: 'llanta', label: 'Llanta' },
  { id: 'motor', label: 'Motor' },
  { id: 'cabina', label: 'Cabina' },
  { id: 'bateria', label: 'Bateria' },
  { id: 'caja', label: 'Caja / Remolque' },
];

/** Campos sugeridos por tipo de hotspot -- el usuario puede editarlos o agregar mas; se guardan como texto libre en `datos`. */
export const CAMPOS_POR_TIPO: Record<TipoHotspotUnidad, { key: string; label: string }[]> = {
  llanta: [
    { key: 'posicion', label: 'Posicion' },
    { key: 'marca', label: 'Marca' },
    { key: 'modelo', label: 'Modelo' },
    { key: 'medida', label: 'Medida' },
    { key: 'profundidad', label: 'Profundidad (mm)' },
    { key: 'kilometraje', label: 'Kilometraje de instalacion' },
    { key: 'fechaInstalacion', label: 'Fecha de instalacion' },
    { key: 'ultimoCambio', label: 'Ultimo cambio' },
    { key: 'condicion', label: 'Condicion' },
  ],
  cabina: [
    { key: 'placas', label: 'Placas' },
    { key: 'vin', label: 'VIN / Numero de serie' },
    { key: 'economico', label: 'Numero economico' },
    { key: 'marca', label: 'Marca' },
    { key: 'modelo', label: 'Modelo' },
    { key: 'anio', label: 'Anio' },
    { key: 'kilometraje', label: 'Kilometraje actual' },
    { key: 'operador', label: 'Operador asignado' },
  ],
  motor: [
    { key: 'ultimoServicio', label: 'Ultimo servicio' },
    { key: 'proximoMantenimiento', label: 'Proximo mantenimiento' },
    { key: 'kilometraje', label: 'Kilometraje' },
    { key: 'fallas', label: 'Fallas registradas' },
    { key: 'componentesReemplazados', label: 'Componentes reemplazados' },
  ],
  bateria: [
    { key: 'marca', label: 'Marca' },
    { key: 'capacidad', label: 'Capacidad' },
    { key: 'fechaInstalacion', label: 'Fecha de instalacion' },
    { key: 'vidaEstimada', label: 'Vida estimada' },
    { key: 'historial', label: 'Historial' },
  ],
  caja: [
    { key: 'placas', label: 'Placas' },
    { key: 'economico', label: 'Numero economico' },
    { key: 'dimensiones', label: 'Dimensiones' },
    { key: 'capacidad', label: 'Capacidad' },
    { key: 'documentacion', label: 'Documentacion' },
  ],
  componente: [
    { key: 'descripcion', label: 'Descripcion' },
    { key: 'estado', label: 'Estado' },
  ],
};

/** Valores iniciales sugeridos para un hotspot de cabina, tomados de la propia unidad -- el usuario los puede editar; quedan guardados en el hotspot, no ligados en vivo. */
export function datosIniciales(tipo: TipoHotspotUnidad, unidad: Unidad): Record<string, string> {
  if (tipo === 'cabina') {
    return {
      placas: unidad.placas || '',
      vin: unidad.numeroSerie || '',
      economico: unidad.economico || '',
      marca: unidad.marca || '',
      modelo: unidad.modelo || '',
      anio: unidad.anio ? String(unidad.anio) : '',
      kilometraje: unidad.kilometrajeActual ? String(unidad.kilometrajeActual) : '',
      operador: '',
    };
  }
  return {};
}

export const ESTATUS_DANO: { id: EstatusDanoUnidad; label: string; tone: 'green' | 'amber' | 'red' | 'blue' }[] = [
  { id: 'Activo', label: 'Dano activo', tone: 'red' },
  { id: 'En revision', label: 'Revision requerida', tone: 'amber' },
  { id: 'Programado', label: 'Mantenimiento programado', tone: 'blue' },
  { id: 'Resuelto', label: 'Resuelto', tone: 'green' },
];

const TONE_HEX: Record<'green' | 'amber' | 'red' | 'blue', string> = {
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
};

export function colorEstatusDano(estatus: EstatusDanoUnidad): string {
  const tone = ESTATUS_DANO.find((e) => e.id === estatus)?.tone ?? 'green';
  return TONE_HEX[tone];
}

/** Familia visual de la unidad, a partir de la clave SAT c_ConfigAutotransporte (Unidad.tipo), para elegir la silueta del diagrama 3D y para agrupar el garaje digital. */
export type FamiliaUnidad = 'tractocamion' | 'camion' | 'grua' | 'ligero' | 'otro';

export function familiaUnidad(tipoSat: string): FamiliaUnidad {
  const clave = (tipoSat || '').toUpperCase();
  if (clave.startsWith('T')) return 'tractocamion';
  if (clave.startsWith('C')) return 'camion';
  if (clave.startsWith('G')) return 'grua';
  if (clave === 'VL') return 'ligero';
  return 'otro';
}

export const LABEL_FAMILIA: Record<FamiliaUnidad, string> = {
  tractocamion: 'Tractocamiones',
  camion: 'Camiones',
  grua: 'Gruas',
  ligero: 'Vehiculos ligeros',
  otro: 'Otros',
};

/** Colores comunes en espanol -> hex, para pintar el diagrama 3D del color real de la unidad. Sin match, gris neutro. */
const COLOR_MAP: Record<string, string> = {
  blanco: '#e8eaed',
  negro: '#1f2937',
  gris: '#9ca3af',
  plata: '#c0c4cc',
  plateado: '#c0c4cc',
  rojo: '#dc2626',
  azul: '#2563eb',
  verde: '#16a34a',
  amarillo: '#eab308',
  naranja: '#ea580c',
  cafe: '#78350f',
  marron: '#78350f',
  dorado: '#ca8a04',
  beige: '#d6c7a1',
  vino: '#7f1d1d',
};

export function colorHexUnidad(color: string): string {
  const clave = (color || '').trim().toLowerCase();
  for (const nombre of Object.keys(COLOR_MAP)) {
    if (clave.includes(nombre)) return COLOR_MAP[nombre];
  }
  return '#9ca3af';
}

/** Firma una URL temporal (1 hora) para mostrar una foto privada de Storage inline; null mientras carga o si no hay path. */
export function useSignedUrl(path: string | undefined | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }
    let cancelado = false;
    supabase.storage
      .from(BUCKET_UNIDAD_360)
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!cancelado && data) setUrl(data.signedUrl);
      });
    return () => {
      cancelado = true;
    };
  }, [path]);
  return url;
}

export async function subirFotoUnidad(empresaId: string, unidadId: string, file: File): Promise<{ path: string } | { error: string }> {
  const path = `${empresaId}/${unidadId}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from(BUCKET_UNIDAD_360).upload(path, file);
  if (error) return { error: error.message };
  return { path };
}

export async function eliminarFotoUnidadStorage(path: string) {
  await supabase.storage.from(BUCKET_UNIDAD_360).remove([path]);
}
