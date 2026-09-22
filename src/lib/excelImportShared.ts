import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';

export function normalizarEncabezado(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');
}

export function texto(valor: unknown): string {
  return valor === null || valor === undefined ? '' : String(valor).trim();
}

export function numero(valor: unknown): number {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  if (typeof valor === 'string') {
    const n = Number(valor.replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function booleano(valor: unknown): boolean {
  const t = normalizarEncabezado(texto(valor));
  return t === 'si' || t === 'sí' || t === 'x' || t === 'true' || t === '1';
}

/** Genera y descarga un .xlsx con una hoja de datos (solo encabezados) y una hoja "Instrucciones". */
export function descargarPlantilla(opciones: {
  nombreArchivo: string;
  nombreHojaDatos: string;
  encabezados: string[];
  tituloInstrucciones: string;
  notasGenerales: string[];
  instrucciones: [string, string][];
}): void {
  const libro = XLSX.utils.book_new();

  const hojaDatos = XLSX.utils.aoa_to_sheet([opciones.encabezados]);
  hojaDatos['!cols'] = opciones.encabezados.map((h) => ({ wch: Math.max(14, h.length + 2) }));
  XLSX.utils.book_append_sheet(libro, hojaDatos, opciones.nombreHojaDatos);

  const filasInstrucciones: (string | undefined)[][] = [
    [opciones.tituloInstrucciones],
    [],
    ...opciones.notasGenerales.map((n) => [n]),
    [],
    ['Columna', 'Como llenarla'],
    ...opciones.instrucciones,
  ];
  const hojaInstrucciones = XLSX.utils.aoa_to_sheet(filasInstrucciones);
  hojaInstrucciones['!cols'] = [{ wch: 26 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(libro, hojaInstrucciones, 'Instrucciones');

  XLSX.writeFile(libro, opciones.nombreArchivo);
}

/** Lee la primera hoja (o la que coincida con nombreHojaPreferida) de un .xlsx como filas 2D, con encabezados normalizados. */
export async function leerFilasHoja(
  file: File,
  nombreHojaPreferida: string,
): Promise<{ encabezados: string[]; filas2d: unknown[][] }> {
  const buffer = await file.arrayBuffer();
  const libro = XLSX.read(buffer, { type: 'array', cellDates: true });

  const nombreHoja =
    libro.SheetNames.find((n) => normalizarEncabezado(n) === normalizarEncabezado(nombreHojaPreferida)) ??
    libro.SheetNames[0];
  const hoja = libro.Sheets[nombreHoja];
  const filas2d = XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, raw: true, defval: null }) as unknown[][];
  if (filas2d.length === 0) throw new Error('La hoja esta vacia.');

  const encabezados = (filas2d[0] as unknown[]).map((h) => normalizarEncabezado(texto(h)));
  return { encabezados, filas2d };
}

export interface FilaImport<T> {
  fila: number;
  item: T;
  errores: string[];
}

const TAMANO_LOTE = 200;

/** Inserta los items validos en Supabase, en lotes, usando el toRow del catalogo correspondiente. */
export async function guardarEnLotes<T>(
  tabla: string,
  items: T[],
  toRow: (item: T) => Record<string, unknown>,
  onProgreso?: (hecho: number, total: number) => void,
): Promise<void> {
  for (let i = 0; i < items.length; i += TAMANO_LOTE) {
    const lote = items.slice(i, i + TAMANO_LOTE).map(toRow);
    const { error } = await supabase.from(tabla).insert(lote as never);
    if (error) throw error;
    onProgreso?.(Math.min(i + TAMANO_LOTE, items.length), items.length);
  }
}
