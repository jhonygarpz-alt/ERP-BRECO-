export interface FilaProgramaDetectada {
  unidadEconomico: string;
  operador: string;
  cliente: string;
  materiales: string;
  origen: string;
  destino: string;
  cajaNombre: string;
  cajaEconomico: string;
  importacion: boolean;
  exportacion: boolean;
  cita: string;
  observaciones: string;
  lineaOriginal: string;
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

function normalizar(texto: string): string {
  return texto
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9-]/g, '');
}

function buscarEconomico(token: string, economicosConocidos: string[]): string | null {
  const candidato = normalizar(token);
  if (!candidato) return null;
  const exacto = economicosConocidos.find((e) => normalizar(e) === candidato);
  if (exacto) return exacto;
  const cercano = economicosConocidos.find((e) => distanciaLevenshtein(normalizar(e), candidato) <= 1);
  return cercano ?? null;
}

/**
 * Convierte el texto crudo de OCR en filas candidatas, buscando en cada
 * linea un economico de unidad conocido (con tolerancia a errores de OCR)
 * y repartiendo el resto de la linea en las columnas esperadas del
 * programa diario. Es una aproximacion: cualquier linea sin un economico
 * reconocible se ignora, y el resultado siempre se muestra editable antes
 * de guardarse como viajes.
 */
export function parseProgramaTexto(texto: string, economicosConocidos: string[]): FilaProgramaDetectada[] {
  const lineas = texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const filas: FilaProgramaDetectada[] = [];

  for (const linea of lineas) {
    // El OCR de imagenes normalmente no conserva los espacios dobles que
    // separan columnas en la tabla original, asi que se parte por cualquier
    // espacio. Esto puede desalinear columnas de texto libre (materiales,
    // origen/destino con varias palabras) — por eso el resultado siempre se
    // revisa y corrige a mano antes de guardarse.
    const tokens = linea
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length === 0) continue;

    let indiceEconomico = -1;
    let economico = '';
    for (let i = 0; i < Math.min(tokens.length, 3); i++) {
      const match = buscarEconomico(tokens[i], economicosConocidos);
      if (match) {
        indiceEconomico = i;
        economico = match;
        break;
      }
    }
    if (indiceEconomico === -1) continue;

    const resto = tokens.slice(indiceEconomico + 1);
    const [
      operador = '',
      cliente = '',
      materiales = '',
      origen = '',
      destino = '',
      cajaNombre = '',
      cajaEconomico = '',
      imp = '',
      exp = '',
      cita = '',
      ...obsPartes
    ] = resto;

    filas.push({
      unidadEconomico: economico,
      operador,
      cliente,
      materiales,
      origen,
      destino,
      cajaNombre,
      cajaEconomico,
      importacion: /^x$/i.test(imp.trim()),
      exportacion: /^x$/i.test(exp.trim()),
      cita: /\d{1,2}:\d{2}/.test(cita) ? cita.trim() : '',
      observaciones: obsPartes.join(' '),
      lineaOriginal: linea,
    });
  }

  return filas;
}
