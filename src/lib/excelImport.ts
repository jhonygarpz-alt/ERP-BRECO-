import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';
import { facturaSistemaToRow } from './mappers';
import type { FacturaSistema } from '../types';

function normalizarEncabezado(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');
}

function texto(valor: unknown): string {
  return valor === null || valor === undefined ? '' : String(valor).trim();
}

function numero(valor: unknown): number {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  if (typeof valor === 'string') {
    const n = Number(valor.replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function fechaISO(valor: unknown): string {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    const y = valor.getFullYear();
    const m = String(valor.getMonth() + 1).padStart(2, '0');
    const d = String(valor.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
}

export interface ResultadoImportFacturasSistema {
  hoja: string;
  totalFilasHoja: number;
  filasValidas: number;
  filasOmitidas: number;
  filas: FacturaSistema[];
}

const COLUMNAS_ESPERADAS: { clave: string; campo: string }[] = [
  { clave: '# ref', campo: 'ref' },
  { clave: 'cliente', campo: 'cliente' },
  { clave: 'economico tracto', campo: 'economicoTracto' },
  { clave: 'economico remolque', campo: 'economicoRemolque' },
  { clave: 'origen pedido', campo: 'origenPedido' },
  { clave: 'locacion origen', campo: 'locacionOrigen' },
  { clave: 'transportistas', campo: 'transportista' },
  { clave: 'fecha origen', campo: 'fechaOrigen' },
  { clave: 'destino pedido', campo: 'destinoPedido' },
  { clave: 'locacion destino', campo: 'locacionDestino' },
  { clave: 'fecha destino', campo: 'fechaDestino' },
  { clave: 'orden de trabajo', campo: 'ordenTrabajo' },
  { clave: 'tipo pedido', campo: 'tipoPedido' },
  { clave: 'fecha factura', campo: 'fechaFactura' },
  { clave: 'total factura', campo: 'totalFactura' },
  { clave: 'saldo pendiente de factura', campo: 'saldoPendiente' },
  { clave: 'estado del pedido', campo: 'estadoPedido' },
  { clave: 'moneda', campo: 'moneda' },
  { clave: 'tipo cambio', campo: 'tipoCambio' },
  { clave: 'tarifa', campo: 'tarifa' },
  { clave: 'adicional', campo: 'adicional' },
  { clave: 'total tarifa', campo: 'totalTarifa' },
  { clave: 'utilidad', campo: 'utilidad' },
];

/**
 * Lee el archivo real "Facturacion Diaria por Sistema.xlsx" (la hoja
 * BASE_DATOS) directamente en el navegador, sin subirlo a ningun servidor
 * externo. A diferencia del OCR de imagenes, esto lee la estructura real
 * del Excel -- no hay adivinanzas, solo se omiten filas sin numero de
 * referencia (encabezados, totales, filas en blanco).
 */
export async function leerFacturacionSistemaExcel(file: File): Promise<ResultadoImportFacturasSistema> {
  const buffer = await file.arrayBuffer();
  const libro = XLSX.read(buffer, { type: 'array', cellDates: true });

  const nombreHoja = libro.SheetNames.find((n) => normalizarEncabezado(n) === 'base_datos');
  if (!nombreHoja) {
    throw new Error(
      `No se encontro la hoja "BASE_DATOS" en este archivo. Hojas disponibles: ${libro.SheetNames.join(', ')}`,
    );
  }

  const hoja = libro.Sheets[nombreHoja];
  const filas2d = XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, raw: true, defval: null });
  if (filas2d.length === 0) throw new Error('La hoja BASE_DATOS esta vacia.');

  const encabezados = (filas2d[0] as unknown[]).map((h) => normalizarEncabezado(texto(h)));
  const indices = new Map<string, number>();
  for (const { clave, campo } of COLUMNAS_ESPERADAS) {
    indices.set(campo, encabezados.indexOf(clave));
  }

  if ((indices.get('ref') ?? -1) === -1 || (indices.get('cliente') ?? -1) === -1) {
    throw new Error(
      'La hoja BASE_DATOS no tiene las columnas esperadas ("# Ref", "Cliente", ...). Puede que el formato del archivo real haya cambiado -- avisale a Claude para actualizar el lector.',
    );
  }

  const col = (campo: string, fila: unknown[]) => {
    const i = indices.get(campo) ?? -1;
    return i === -1 ? null : fila[i];
  };

  const filas: FacturaSistema[] = [];
  let omitidas = 0;
  for (let i = 1; i < filas2d.length; i++) {
    const fila = filas2d[i] as unknown[];
    const ref = col('ref', fila);
    const refNum = Number(ref);
    if (ref === null || ref === '' || !Number.isFinite(refNum)) {
      omitidas++;
      continue;
    }
    filas.push({
      id: String(refNum),
      cliente: texto(col('cliente', fila)),
      economicoTracto: texto(col('economicoTracto', fila)),
      economicoRemolque: texto(col('economicoRemolque', fila)),
      origenPedido: texto(col('origenPedido', fila)),
      locacionOrigen: texto(col('locacionOrigen', fila)),
      transportista: texto(col('transportista', fila)),
      fechaOrigen: fechaISO(col('fechaOrigen', fila)),
      destinoPedido: texto(col('destinoPedido', fila)),
      locacionDestino: texto(col('locacionDestino', fila)),
      fechaDestino: fechaISO(col('fechaDestino', fila)),
      ordenTrabajo: texto(col('ordenTrabajo', fila)),
      tipoPedido: texto(col('tipoPedido', fila)),
      fechaFactura: texto(col('fechaFactura', fila)),
      totalFactura: numero(col('totalFactura', fila)),
      saldoPendiente: numero(col('saldoPendiente', fila)),
      estadoPedido: texto(col('estadoPedido', fila)),
      moneda: texto(col('moneda', fila)),
      tipoCambio: numero(col('tipoCambio', fila)),
      tarifa: numero(col('tarifa', fila)),
      adicional: numero(col('adicional', fila)),
      totalTarifa: numero(col('totalTarifa', fila)),
      utilidad: numero(col('utilidad', fila)),
    });
  }

  return { hoja: nombreHoja, totalFilasHoja: filas2d.length - 1, filasValidas: filas.length, filasOmitidas: omitidas, filas };
}

const TAMANO_LOTE = 500;

/**
 * Sube las filas a Supabase en lotes (upsert por id/REF), para no mandar
 * miles de filas en una sola peticion. Cada vez que se vuelva a importar
 * el mismo Excel actualizado, las filas con el mismo REF se actualizan en
 * vez de duplicarse.
 */
export async function guardarFacturasSistema(
  filas: FacturaSistema[],
  onProgreso?: (hecho: number, total: number) => void,
): Promise<void> {
  for (let i = 0; i < filas.length; i += TAMANO_LOTE) {
    const lote = filas.slice(i, i + TAMANO_LOTE).map(facturaSistemaToRow);
    const { error } = await supabase.from('facturas_sistema').upsert(lote as never, { onConflict: 'id' });
    if (error) throw error;
    onProgreso?.(Math.min(i + TAMANO_LOTE, filas.length), filas.length);
  }
}
