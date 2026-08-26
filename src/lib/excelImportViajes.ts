import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';
import { viajeToRow } from './mappers';
import type { EstatusViaje, Viaje } from '../types';

function normalizarEncabezado(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');
}

function normalizarTexto(texto: string): string {
  return texto
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

function texto(valor: unknown): string {
  return valor === null || valor === undefined ? '' : String(valor).trim();
}

function esX(valor: unknown): boolean {
  return /^x$/i.test(texto(valor));
}

function distanciaLevenshtein(a: string, b: string): number {
  const filas = a.length + 1;
  const columnas = b.length + 1;
  const dp: number[][] = Array.from({ length: filas }, () => new Array(columnas).fill(0));
  for (let i = 0; i < filas; i++) dp[i][0] = i;
  for (let j = 0; j < columnas; j++) dp[0][j] = j;
  for (let i = 1; i < filas; i++) {
    for (let j = 1; j < columnas; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + costo);
    }
  }
  return dp[filas - 1][columnas - 1];
}

interface UnidadConocida {
  id: string;
  economico: string;
}
interface EntidadConocida {
  id: string;
  nombre: string;
}

/**
 * La columna UNIDAD del Excel real casi siempre es un numero de posicion
 * (1, 2, 3...) que corresponde a T01, T02, T03... en ese orden, y las
 * unidades de refuerzo aparecen como texto ("FLEED", "FLEDD"). Aqui se
 * traduce ese numero/texto al id real de la unidad.
 */
function resolverUnidad(valorCrudo: unknown, unidades: UnidadConocida[]): string | null {
  const crudo = texto(valorCrudo);
  if (!crudo) return null;
  const n = Number(crudo);
  if (Number.isFinite(n) && n >= 1 && n <= 90) {
    const economico = `T${String(n).padStart(2, '0')}`;
    const match = unidades.find((u) => normalizarTexto(u.economico) === economico);
    if (match) return match.id;
  }
  const candidato = normalizarTexto(crudo);
  const exacto = unidades.find((u) => normalizarTexto(u.economico) === candidato);
  if (exacto) return exacto.id;
  const porPrefijo = unidades.find((u) => normalizarTexto(u.economico).startsWith(candidato.slice(0, 3)));
  if (porPrefijo) return porPrefijo.id;
  return null;
}

function resolverEntidad(valorCrudo: unknown, entidades: EntidadConocida[]): string {
  const crudo = normalizarTexto(texto(valorCrudo));
  if (!crudo || crudo.length < 2) return '';
  const exacto = entidades.find((e) => normalizarTexto(e.nombre) === crudo);
  if (exacto) return exacto.id;
  const porSubcadena = entidades.find(
    (e) => normalizarTexto(e.nombre).includes(crudo) || crudo.includes(normalizarTexto(e.nombre)),
  );
  if (porSubcadena) return porSubcadena.id;
  let mejor: EntidadConocida | null = null;
  let mejorDistancia = Infinity;
  for (const e of entidades) {
    const d = distanciaLevenshtein(normalizarTexto(e.nombre), crudo);
    if (d < mejorDistancia) {
      mejorDistancia = d;
      mejor = e;
    }
  }
  if (mejor && mejorDistancia <= 2) return mejor.id;
  return '';
}

const CANDIDATOS_ENCABEZADO: Record<string, string[]> = {
  unidad: ['unidad'],
  operador: ['operador'],
  cliente: ['cliente'],
  materiales: ['materiales'],
  origen: ['ubicacion'],
  destino: ['destino'],
  cajaNombre: ['caja', 'linea de caja'],
  cajaEconomico: ['eco caja', 'cajas'],
  imp: ['imp', 'impo'],
  exp: ['exp', 'expo'],
  cita: ['cita'],
  transito: ['transito'],
  taller: ['taller'],
  dedicado: ['dedicado'],
  observaciones: ['observaciones'],
};

interface FilaViajeImportada {
  unidadId: string;
  fecha: string;
  clienteId: string;
  operadorId: string;
  materiales: string;
  origen: string;
  destino: string;
  cajaNombre: string;
  cajaEconomico: string;
  cita: string;
  importacion: boolean;
  exportacion: boolean;
  estatus: EstatusViaje;
  observaciones: string;
}

export interface ResultadoImportViajes {
  hojasTotales: number;
  hojasProcesadas: number;
  hojasSinFecha: number;
  filasValidas: number;
  filasSinUnidad: number;
  filas: FilaViajeImportada[];
}

function fechaDesdeCelda(valor: unknown): string {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    const y = valor.getFullYear();
    const m = String(valor.getMonth() + 1).padStart(2, '0');
    const d = String(valor.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
}

/**
 * Lee TODAS las hojas del libro "Reporte Diario" (una hoja por dia). El
 * formato de columnas cambio varias veces a lo largo del tiempo (algunas
 * hojas viejas no tienen MATERIALES/DESTINO/CITA, otras usan "LINEA DE
 * CAJA" en vez de "CAJA"/"ECO CAJA"), asi que cada hoja se lee segun sus
 * propios encabezados en vez de asumir una posicion fija de columna.
 */
export async function leerReporteDiarioExcel(
  file: File,
  unidadesConocidas: UnidadConocida[],
  clientesConocidos: EntidadConocida[],
  operadoresConocidos: EntidadConocida[],
  opciones: { soloHojaMasReciente?: boolean } = {},
): Promise<ResultadoImportViajes> {
  const buffer = await file.arrayBuffer();
  const libro = XLSX.read(buffer, { type: 'array', cellDates: true });

  let nombresHojas = libro.SheetNames;
  if (opciones.soloHojaMasReciente) {
    let mejorNombre = '';
    let mejorFecha = '';
    for (const nombreHoja of libro.SheetNames) {
      const hoja = libro.Sheets[nombreHoja];
      const filaFecha = XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, raw: true, range: 0, defval: null })[0] as
        | unknown[]
        | undefined;
      const fecha = fechaDesdeCelda(filaFecha?.[1]);
      if (fecha && fecha > mejorFecha) {
        mejorFecha = fecha;
        mejorNombre = nombreHoja;
      }
    }
    nombresHojas = mejorNombre ? [mejorNombre] : [];
  }

  let hojasProcesadas = 0;
  let hojasSinFecha = 0;
  let filasSinUnidad = 0;
  const filas: FilaViajeImportada[] = [];

  for (const nombreHoja of nombresHojas) {
    const hoja = libro.Sheets[nombreHoja];
    const filas2d = XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, raw: true, defval: null });
    if (filas2d.length < 2) continue;

    const fecha = fechaDesdeCelda((filas2d[0] as unknown[])[1]);
    if (!fecha) {
      hojasSinFecha++;
      continue;
    }

    const encabezados = (filas2d[1] as unknown[]).map((h) => normalizarEncabezado(texto(h)));
    const indices: Record<string, number> = {};
    for (const [campo, candidatos] of Object.entries(CANDIDATOS_ENCABEZADO)) {
      indices[campo] = -1;
      for (const candidato of candidatos) {
        const i = encabezados.indexOf(candidato);
        if (i !== -1) {
          indices[campo] = i;
          break;
        }
      }
    }
    if (indices.unidad === -1) continue;

    hojasProcesadas++;
    const col = (campo: string, fila: unknown[]) => (indices[campo] === -1 ? null : fila[indices[campo]]);

    for (let i = 2; i < filas2d.length; i++) {
      const fila = filas2d[i] as unknown[];
      const unidadCruda = col('unidad', fila);
      if (unidadCruda === null || texto(unidadCruda) === '') break;

      const unidadId = resolverUnidad(unidadCruda, unidadesConocidas);
      if (!unidadId) {
        filasSinUnidad++;
        continue;
      }

      const etiquetas: string[] = [];
      if (esX(col('transito', fila))) etiquetas.push('TRANSITO');
      if (esX(col('taller', fila))) etiquetas.push('TALLER');
      if (esX(col('dedicado', fila))) etiquetas.push('DEDICADO');
      const observacionesBase = texto(col('observaciones', fila));
      const observaciones = etiquetas.length
        ? `[${etiquetas.join('][')}] ${observacionesBase}`.trim()
        : observacionesBase;

      let estatus: EstatusViaje = 'Programado';
      if (esX(col('transito', fila))) estatus = 'En transito';
      if (normalizarTexto(observacionesBase).includes('CANCEL')) estatus = 'Cancelado';

      filas.push({
        unidadId,
        fecha,
        clienteId: resolverEntidad(col('cliente', fila), clientesConocidos),
        operadorId: resolverEntidad(col('operador', fila), operadoresConocidos),
        materiales: texto(col('materiales', fila)),
        origen: texto(col('origen', fila)),
        destino: texto(col('destino', fila)),
        cajaNombre: texto(col('cajaNombre', fila)),
        cajaEconomico: texto(col('cajaEconomico', fila)),
        cita: texto(col('cita', fila)),
        importacion: esX(col('imp', fila)),
        exportacion: esX(col('exp', fila)),
        estatus,
        observaciones,
      });
    }
  }

  return {
    hojasTotales: libro.SheetNames.length,
    hojasProcesadas,
    hojasSinFecha,
    filasValidas: filas.length,
    filasSinUnidad,
    filas,
  };
}

const TAMANO_LOTE = 300;

/**
 * Guarda las filas importadas: para cada (unidad, fecha) actualiza el
 * viaje existente si ya hay uno capturado ese dia para esa unidad, o crea
 * uno nuevo si no. Igual que hace el importador de una sola captura, solo
 * que aqui puede ser para cientos de dias a la vez.
 */
export async function guardarViajesImportados(
  filas: FilaViajeImportada[],
  viajesExistentes: Viaje[],
  crearId: () => string,
  onProgreso?: (hecho: number, total: number) => void,
): Promise<void> {
  const existentesPorClave = new Map<string, Viaje>();
  for (const v of viajesExistentes) existentesPorClave.set(`${v.unidadId}|${v.fecha}`, v);

  let contadorFolio = viajesExistentes.reduce((acc, v) => {
    const n = Number(v.folio.split('-')[1] ?? 0);
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);

  const nuevos: Viaje[] = [];
  const actualizaciones: Viaje[] = [];
  const yaUsados = new Set<string>();

  for (const f of filas) {
    const clave = `${f.unidadId}|${f.fecha}`;
    if (yaUsados.has(clave)) continue;
    yaUsados.add(clave);
    const existente = existentesPorClave.get(clave);
    if (existente) {
      actualizaciones.push({ ...existente, ...f });
    } else {
      contadorFolio += 1;
      const folio = `V-${String(contadorFolio).padStart(4, '0')}`;
      nuevos.push({ id: crearId(), folio, horaSalida: '', horaLlegadaEstimada: '', ...f });
    }
  }

  let hecho = 0;
  const total = nuevos.length + actualizaciones.length;

  for (let i = 0; i < nuevos.length; i += TAMANO_LOTE) {
    const lote = nuevos.slice(i, i + TAMANO_LOTE).map(viajeToRow);
    const { error } = await supabase.from('viajes').insert(lote as never);
    if (error) throw error;
    hecho += lote.length;
    onProgreso?.(hecho, total);
  }

  const CONCURRENCIA = 8;
  for (let i = 0; i < actualizaciones.length; i += CONCURRENCIA) {
    const lote = actualizaciones.slice(i, i + CONCURRENCIA);
    await Promise.all(
      lote.map(async (v) => {
        const { error } = await supabase.from('viajes').update(viajeToRow(v) as never).eq('id', v.id);
        if (error) throw error;
      }),
    );
    hecho += lote.length;
    onProgreso?.(hecho, total);
  }
}
