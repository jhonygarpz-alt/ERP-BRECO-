import { descargarPlantilla, leerFilasHoja, numero, texto } from './excelImportShared';
import type { TipoMovimientoBancario } from '../types';

const COLUMNAS: { clave: string; campo: string }[] = [
  { clave: 'fecha', campo: 'fecha' },
  { clave: 'descripcion', campo: 'descripcion' },
  { clave: 'referencia', campo: 'referencia' },
  { clave: 'importe', campo: 'importe' },
  { clave: 'tipo', campo: 'tipo' },
];

const ENCABEZADOS = ['Fecha', 'Descripcion', 'Referencia', 'Importe', 'Tipo'];

export function descargarPlantillaConciliacion(): void {
  descargarPlantilla({
    nombreArchivo: 'Plantilla_Movimientos_Banco.xlsx',
    nombreHojaDatos: 'Movimientos',
    encabezados: ENCABEZADOS,
    tituloInstrucciones: 'Instrucciones para llenar la plantilla de Movimientos del Banco',
    notasGenerales: [
      '1. No cambies el nombre ni el orden de las columnas de la hoja "Movimientos".',
      '2. Copia aqui los movimientos de tu estado de cuenta bancario, una fila por movimiento.',
      '3. Guarda el archivo en formato .xlsx antes de subirlo.',
    ],
    instrucciones: [
      ['Fecha', 'Obligatoria. Formato AAAA-MM-DD (ej. 2026-09-22) o como fecha de Excel.'],
      ['Descripcion', 'Obligatoria. Concepto o descripcion del movimiento tal como aparece en el banco.'],
      ['Referencia', 'Opcional. Numero de referencia, folio o clave de rastreo.'],
      ['Importe', 'Obligatorio. Numero positivo. Usa la columna Tipo para indicar si es Ingreso o Egreso.'],
      ['Tipo', 'Ingreso o Egreso. Si se deja en blanco, se toma como Egreso cuando el importe viene negativo, o Ingreso si viene positivo.'],
    ],
  });
}

function fechaDesdeCelda(valor: unknown): string {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    const y = valor.getFullYear();
    const m = String(valor.getMonth() + 1).padStart(2, '0');
    const d = String(valor.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const t = texto(valor);
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const conBarras = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (conBarras) {
    const [, d, m, y] = conBarras;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return '';
}

export interface LineaBancoImportada {
  fecha: string;
  descripcion: string;
  referencia: string;
  importe: number;
  tipo: TipoMovimientoBancario;
}

export interface FilaImportBanco {
  fila: number;
  item: LineaBancoImportada;
  errores: string[];
}

export async function leerMovimientosBancoExcel(file: File): Promise<{ totalFilasHoja: number; filas: FilaImportBanco[] }> {
  const { encabezados, filas2d } = await leerFilasHoja(file, 'Movimientos');
  const indices = new Map<string, number>();
  for (const { clave, campo } of COLUMNAS) indices.set(campo, encabezados.indexOf(clave));

  if ((indices.get('fecha') ?? -1) === -1 || (indices.get('importe') ?? -1) === -1) {
    throw new Error('No se encontraron las columnas "Fecha" y/o "Importe". Usa la plantilla descargable sin modificar los encabezados.');
  }

  const col = (campo: string, fila: unknown[]) => {
    const i = indices.get(campo) ?? -1;
    return i === -1 ? null : fila[i];
  };

  const filas: FilaImportBanco[] = [];
  for (let i = 1; i < filas2d.length; i++) {
    const fila = filas2d[i];
    if (fila.every((v) => v === null || v === undefined || String(v).trim() === '')) continue;

    const fecha = fechaDesdeCelda(col('fecha', fila));
    const importeCrudo = numero(col('importe', fila));
    const tipoTexto = texto(col('tipo', fila)).toLowerCase();
    const tipo: TipoMovimientoBancario = tipoTexto === 'ingreso' ? 'Ingreso' : tipoTexto === 'egreso' ? 'Egreso' : importeCrudo < 0 ? 'Egreso' : 'Ingreso';

    const errores: string[] = [];
    if (!fecha) errores.push('Fecha invalida o vacia.');
    if (importeCrudo === 0) errores.push('El importe no puede ser 0.');

    filas.push({
      fila: i + 1,
      item: { fecha, descripcion: texto(col('descripcion', fila)), referencia: texto(col('referencia', fila)), importe: Math.abs(importeCrudo), tipo },
      errores,
    });
  }

  return { totalFilasHoja: filas2d.length - 1, filas };
}
