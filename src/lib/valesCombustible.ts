export function nextFolioValeCombustible(registros: { folio: string }[]): string {
  const max = registros.reduce((acc, r) => {
    const n = Number(r.folio.replace(/\D/g, ''));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `VC-${String(max + 1).padStart(9, '0')}`;
}
