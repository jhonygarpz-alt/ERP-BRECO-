import type { FolioAutorizado, TipoDocumentoFolio } from '../types';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const NOMBRES_DOCUMENTO_FOLIO: Record<TipoDocumentoFolio, string> = {
  Factura: 'Factura',
  CartaPorte: 'Carta Porte',
  NotaCredito: 'Nota de Credito',
};

export interface ResultadoFolio {
  /** null cuando no hay ningun folio disponible (rangos activos agotados). */
  folio: string | null;
  /** El renglon del catalogo del que salio el folio, o null si vino del generador legacy. */
  folioAutorizadoId: string | null;
  /** Mensaje a mostrar al usuario cuando folio es null. */
  error: string | null;
}

/**
 * Folio a usar para un documento nuevo (Factura/CartaPorte/NotaCredito).
 *
 * - Si NO hay ningun rango ACTIVO en el Catalogo de Folios (Configuracion)
 *   para ese tipo de documento, se usa folioLegacy() tal cual -- asi el
 *   comportamiento de siempre no cambia para quien no haya configurado el
 *   catalogo todavia.
 * - Si SI hay rangos activos, el folio sale de ahi: "SERIE-NUMERO" (o solo
 *   "NUMERO" si la serie viene vacia), avanzando al siguiente numero libre
 *   dentro del rango segun los folios ya usados de ese mismo documento/serie.
 *   Si todos los rangos activos ya se agotaron, no se genera folio (hay que
 *   capturar un nuevo rango en Configuracion antes de poder seguir).
 */
export function siguienteFolioDocumento(
  documento: TipoDocumentoFolio,
  folios: FolioAutorizado[],
  foliosExistentes: string[],
  folioLegacy: () => string,
): ResultadoFolio {
  const rangos = folios
    .filter((f) => f.documento === documento && f.activo)
    .slice()
    .sort((a, b) => a.folioInicial - b.folioInicial);

  if (rangos.length === 0) {
    return { folio: folioLegacy(), folioAutorizadoId: null, error: null };
  }

  for (const rango of rangos) {
    const serie = rango.serie.trim();
    const regex = serie ? new RegExp(`^${escapeRegExp(serie)}-(\\d+)$`) : /^(\d+)$/;
    const usados = foliosExistentes
      .map((f) => f.match(regex))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => Number(m[1]))
      .filter((n) => n >= rango.folioInicial && n <= rango.folioFinal);
    const siguienteNumero = usados.length > 0 ? Math.max(...usados) + 1 : rango.folioInicial;
    if (siguienteNumero <= rango.folioFinal) {
      return {
        folio: serie ? `${serie}-${siguienteNumero}` : String(siguienteNumero),
        folioAutorizadoId: rango.id,
        error: null,
      };
    }
  }

  return {
    folio: null,
    folioAutorizadoId: null,
    error: `Se agotaron los folios autorizados para ${NOMBRES_DOCUMENTO_FOLIO[documento]}. Agrega un nuevo rango en Configuracion > Catalogo de Folios.`,
  };
}
