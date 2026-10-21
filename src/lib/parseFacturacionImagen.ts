export interface FilaFacturacionDetectada {
  ref: string;
  cliente: string;
  economicoTracto: string;
  economicoRemolque: string;
  origenPedido: string;
  destinoPedido: string;
  locacionDestino: string;
  fechaOrigen: string;
  fechaDestino: string;
  moneda: string;
  tipoCambio: string;
  tarifa: string;
  adicional: string;
  totalTarifa: string;
  lineaOriginal: string;
}

/**
 * Igual de aproximado que el lector de imagenes del Programa Diario: el
 * OCR no conserva la separacion real de columnas, asi que solo se usa
 * para dar un punto de partida editable con los datos del dia (pocas
 * filas). Cualquier linea sin un numero de referencia reconocible se
 * ignora. El resultado siempre se revisa y corrige a mano antes de
 * guardarse -- nunca se sube directo a la base de datos.
 */
export function parseFacturacionTexto(texto: string): FilaFacturacionDetectada[] {
  const lineas = texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const filas: FilaFacturacionDetectada[] = [];

  for (const linea of lineas) {
    const tokens = linea
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length === 0) continue;

    let indiceRef = -1;
    for (let i = 0; i < Math.min(tokens.length, 2); i++) {
      if (/^\d{3,7}$/.test(tokens[i].replace(/[^0-9]/g, ''))) {
        indiceRef = i;
        break;
      }
    }
    if (indiceRef === -1) continue;

    const ref = tokens[indiceRef].replace(/[^0-9]/g, '');
    const resto = tokens.slice(indiceRef + 1);
    const [
      cliente = '',
      economicoTracto = '',
      economicoRemolque = '',
      origenPedido = '',
      destinoPedido = '',
      locacionDestino = '',
      fechaOrigen = '',
      fechaDestino = '',
      moneda = '',
      tipoCambio = '',
      tarifa = '',
      adicional = '',
      totalTarifa = '',
    ] = resto;

    filas.push({
      ref,
      cliente,
      economicoTracto,
      economicoRemolque,
      origenPedido,
      destinoPedido,
      locacionDestino,
      fechaOrigen,
      fechaDestino,
      moneda,
      tipoCambio,
      tarifa,
      adicional,
      totalTarifa,
      lineaOriginal: linea,
    });
  }

  return filas;
}
