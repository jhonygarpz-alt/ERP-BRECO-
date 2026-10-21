import type {
  Compra,
  LineaArticuloAlmacen,
  LineaOrdenCompra,
  MovimientoAlmacen,
  OrdenCompra,
} from '../types';

export function nextFolioAlmacen(registros: { folio: string }[], prefijo: string): string {
  const max = registros.reduce((acc, r) => {
    const n = Number(r.folio.replace(/\D/g, ''));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `${prefijo}${String(max + 1).padStart(9, '0')}`;
}

export function importeLinea(l: { cantidad: number; precioUnitario: number }): number {
  return Math.round(l.cantidad * l.precioUnitario * 100) / 100;
}

export interface TotalesArticulos {
  subtotal: number;
  totalIva: number;
  total: number;
}

export function calcularTotalesArticulos(lineas: LineaArticuloAlmacen[]): TotalesArticulos {
  const subtotal = lineas.reduce((acc, l) => acc + importeLinea(l), 0);
  const totalIva = Math.round(subtotal * 0.16 * 100) / 100;
  return { subtotal: Math.round(subtotal * 100) / 100, totalIva, total: Math.round((subtotal + totalIva) * 100) / 100 };
}

/** Cuanto falta por recibir de una linea de Orden de Compra (nunca negativo). */
export function cantidadPendiente(linea: LineaOrdenCompra): number {
  return Math.max(0, Math.round((linea.cantidad - linea.cantidadRecibida) * 100) / 100);
}

/** Ordenes de Compra de un proveedor que todavia tienen algo pendiente de recibir. */
export function ordenesCompraPendientes(proveedorId: string, ordenes: OrdenCompra[]): OrdenCompra[] {
  return ordenes.filter(
    (o) => o.proveedorId === proveedorId && o.estatus !== 'Cancelada' && o.lineas.some((l) => cantidadPendiente(l) > 0),
  );
}

/**
 * Inventario en existencia por almacen+articulo: suma de Entradas menos Salidas de todos los
 * movimientos aplicados. Nunca se guarda -- se calcula en vivo, igual que los saldos de Banco.
 */
export interface ExistenciaArticulo {
  almacenId: string;
  codigo: string;
  descripcion: string;
  unidadMedida: string;
  existencia: number;
}

export function calcularExistencias(
  movimientos: MovimientoAlmacen[],
  tiposMovimiento: { id: string; naturaleza: 'Entrada' | 'Salida' }[],
): ExistenciaArticulo[] {
  const naturalezaPorTipo = new Map(tiposMovimiento.map((t) => [t.id, t.naturaleza]));
  const acumulado = new Map<string, ExistenciaArticulo>();

  for (const m of movimientos) {
    if (m.estatus !== 'Aplicado') continue;
    const naturaleza = naturalezaPorTipo.get(m.tipoMovimientoId);
    if (!naturaleza) continue;
    const signo = naturaleza === 'Entrada' ? 1 : -1;

    for (const l of m.lineas) {
      const clave = `${m.almacenId}::${l.codigo}`;
      const actual = acumulado.get(clave) ?? {
        almacenId: m.almacenId,
        codigo: l.codigo,
        descripcion: l.descripcion,
        unidadMedida: l.unidadMedida,
        existencia: 0,
      };
      actual.existencia = Math.round((actual.existencia + signo * l.cantidad) * 100) / 100;
      acumulado.set(clave, actual);
    }

    // Un traspaso (Salida de almacenId + Entrada automatica en almacenDestinoId) se modela con
    // una sola linea de movimiento: la salida ya se sumo arriba, aqui se agrega la entrada del destino.
    if (m.almacenDestinoId) {
      for (const l of m.lineas) {
        const claveDestino = `${m.almacenDestinoId}::${l.codigo}`;
        const actual = acumulado.get(claveDestino) ?? {
          almacenId: m.almacenDestinoId,
          codigo: l.codigo,
          descripcion: l.descripcion,
          unidadMedida: l.unidadMedida,
          existencia: 0,
        };
        actual.existencia = Math.round((actual.existencia + l.cantidad) * 100) / 100;
        acumulado.set(claveDestino, actual);
      }
    }
  }

  return Array.from(acumulado.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
}

export function totalCompra(c: Compra): number {
  return calcularTotalesArticulos(c.lineas).total;
}
