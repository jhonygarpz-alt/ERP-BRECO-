import type { AbonoDescuentoOperador, DescuentoOperador } from '../types';

export function importeDescontado(descuentoId: string, abonos: AbonoDescuentoOperador[]): number {
  const total = abonos.filter((a) => a.descuentoOperadorId === descuentoId).reduce((acc, a) => acc + (a.monto || 0), 0);
  return Math.round(total * 100) / 100;
}

/** null = sin tope (ej. un descuento "Permanente" sin importeTotalADescontar capturado). */
export function saldoDescuento(descuento: DescuentoOperador, abonos: AbonoDescuentoOperador[]): number | null {
  if (!descuento.importeTotalADescontar) return null;
  const saldo = descuento.importeTotalADescontar - importeDescontado(descuento.id, abonos);
  return Math.max(0, Math.round(saldo * 100) / 100);
}

export function siguienteFolioDescuento(descuentos: DescuentoOperador[]): string {
  const max = descuentos.reduce((acc, d) => {
    const n = Number(d.folio.replace(/\D/g, ''));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return String(max + 1).padStart(6, '0');
}

export function siguienteNumeroDeduccion(deducciones: { numero: string }[]): string {
  const max = deducciones.reduce((acc, d) => {
    const n = Number(d.numero.replace(/\D/g, ''));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return String(max + 1);
}
