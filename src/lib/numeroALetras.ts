const UNIDADES = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
const DIEZ_A_DIECINUEVE = [
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE',
];
const DECENAS = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const CENTENAS = [
  '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS',
];

function centenasATexto(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';
  const c = Math.floor(n / 100);
  const resto = n % 100;
  const partes: string[] = [];
  if (c > 0) partes.push(CENTENAS[c]);
  if (resto > 0) {
    if (resto < 10) partes.push(UNIDADES[resto]);
    else if (resto < 20) partes.push(DIEZ_A_DIECINUEVE[resto - 10]);
    else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      if (d === 2 && u > 0) partes.push(`VEINTI${UNIDADES[u].toLowerCase().replace(/^./, (m) => m.toUpperCase())}`.toUpperCase());
      else if (u > 0) partes.push(`${DECENAS[d]} Y ${UNIDADES[u]}`);
      else partes.push(DECENAS[d]);
    }
  }
  return partes.join(' ');
}

function milesATexto(n: number): string {
  if (n === 0) return 'CERO';
  const millones = Math.floor(n / 1000000);
  const miles = Math.floor((n % 1000000) / 1000);
  const cientos = n % 1000;
  const partes: string[] = [];
  if (millones > 0) partes.push(millones === 1 ? 'UN MILLON' : `${centenasATexto(millones)} MILLONES`);
  if (miles > 0) partes.push(miles === 1 ? 'MIL' : `${centenasATexto(miles)} MIL`);
  if (cientos > 0) partes.push(centenasATexto(cientos));
  return partes.join(' ');
}

/** Convierte un monto a su representacion en letras, como la piden los formatos fiscales (ej. "SIETE MIL CUATROCIENTOS CUARENTA Y OCHO PESOS 00/100 M.N."). */
export function importeALetras(monto: number, moneda: 'MXN' | 'USD' | string = 'MXN'): string {
  const negativo = monto < 0;
  const absoluto = Math.abs(monto);
  const entero = Math.floor(absoluto);
  const centavos = Math.round((absoluto - entero) * 100);
  const nombreMoneda = moneda === 'USD' ? 'DOLARES' : 'PESOS';
  const sufijo = moneda === 'USD' ? 'USD' : 'M.N.';
  const texto = `${milesATexto(entero)} ${nombreMoneda} ${String(centavos).padStart(2, '0')}/100 ${sufijo}`;
  return negativo ? `MENOS ${texto}` : texto;
}
