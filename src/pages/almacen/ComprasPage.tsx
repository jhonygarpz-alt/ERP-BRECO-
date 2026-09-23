import { useMemo, useState } from 'react';
import { Ban, Eye, Plus, Search } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { hoyISO } from '../../lib/fechas';
import { calcularTotalesArticulos, cantidadPendiente } from '../../lib/almacen';
import { uid } from '../../lib/storage';
import type { Compra, LineaOrdenCompra, MovimientoAlmacen } from '../../types';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Input, ToolbarButton } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';
import { CompraFormModal } from '../../components/almacen/CompraFormModal';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function ComprasPage() {
  const { compras, proveedores, ordenesCompra, movimientosAlmacen } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Almacen', 'crear');
  const puedeEditar = hasPermission('Almacen', 'editar');

  const [desde, setDesde] = useState(() => hoyISO().slice(0, 8) + '01');
  const [hasta, setHasta] = useState(hoyISO());
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Compra | null>(null);
  const [soloLectura, setSoloLectura] = useState(false);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);

  function proveedorTexto(id: string) {
    return proveedores.items.find((p) => p.id === id)?.nombre ?? 'N/D';
  }

  const filtered = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return compras.items
      .filter((c) => c.fecha >= desde && c.fecha <= hasta)
      .filter((c) => !termino || c.folio.toLowerCase().includes(termino) || proveedorTexto(c.proveedorId).toLowerCase().includes(termino))
      .slice()
      .sort((a, b) => b.folio.localeCompare(a.folio));
  }, [compras.items, desde, hasta, busqueda, proveedores.items]);

  const seleccionada = compras.items.find((c) => c.id === seleccionadoId) ?? null;

  function openNew() {
    setEditing(null);
    setSoloLectura(false);
    setModalOpen(true);
  }
  function abrirConsultar() {
    if (!seleccionada) return;
    setEditing(seleccionada);
    setSoloLectura(true);
    setModalOpen(true);
  }
  function cancelar() {
    if (!seleccionada) return;
    if (!confirm(`Cancelar la compra "${seleccionada.folio}"? Esto revierte lo recibido en las Ordenes de Compra y cancela sus movimientos de almacen.`)) return;
    compras.update(seleccionada.id, { estatus: 'Cancelada' });

    // Revertir cantidadRecibida en las Ordenes de Compra ligadas.
    for (const ordenCompraId of seleccionada.ordenesCompraIds) {
      const oc = ordenesCompra.items.find((o) => o.id === ordenCompraId);
      if (!oc) continue;
      const lineasCompra = seleccionada.lineas.filter((l) => l.ordenCompraId === ordenCompraId);
      const nuevasLineas: LineaOrdenCompra[] = oc.lineas.map((l) => {
        const lc = lineasCompra.find((x) => x.ordenCompraLineaId === l.id);
        return lc ? { ...l, cantidadRecibida: Math.max(0, l.cantidadRecibida - lc.cantidad) } : l;
      });
      const todoPendiente = nuevasLineas.every((l) => l.cantidadRecibida <= 0);
      const algoPendiente = nuevasLineas.some((l) => cantidadPendiente(l) > 0);
      ordenesCompra.update(ordenCompraId, {
        lineas: nuevasLineas,
        estatus: oc.estatus === 'Cancelada' ? 'Cancelada' : todoPendiente ? 'Abierta' : algoPendiente ? 'Parcialmente Recibida' : 'Recibida',
      });
    }

    // Cancelar los Movimientos de Almacen que esta compra genero.
    movimientosAlmacen.items
      .filter((m) => m.origen === 'Compra' && m.origenId === seleccionada.id)
      .forEach((m) => movimientosAlmacen.update(m.id, { estatus: 'Cancelado' }));
  }

  function guardar(datos: Compra, tipoMovimientoEntradaId: string) {
    const yaExiste = compras.items.some((c) => c.id === datos.id);
    if (yaExiste) {
      compras.update(datos.id, datos);
      return;
    }
    compras.add(datos);

    // Descontar lo recibido en cada Orden de Compra ligada y recalcular su estatus.
    const ordenesAfectadas = new Set(datos.lineas.map((l) => l.ordenCompraId).filter((x): x is string => Boolean(x)));
    for (const ordenCompraId of ordenesAfectadas) {
      const oc = ordenesCompra.items.find((o) => o.id === ordenCompraId);
      if (!oc) continue;
      const lineasCompra = datos.lineas.filter((l) => l.ordenCompraId === ordenCompraId);
      const nuevasLineas: LineaOrdenCompra[] = oc.lineas.map((l) => {
        const lc = lineasCompra.find((x) => x.ordenCompraLineaId === l.id);
        return lc ? { ...l, cantidadRecibida: l.cantidadRecibida + lc.cantidad } : l;
      });
      const algoPendiente = nuevasLineas.some((l) => cantidadPendiente(l) > 0);
      ordenesCompra.update(ordenCompraId, { lineas: nuevasLineas, estatus: algoPendiente ? 'Parcialmente Recibida' : 'Recibida' });
    }

    // Generar el/los Movimiento(s) de Almacen de entrada -- uno por cada almacen distinto entre las lineas.
    const almacenesUsados = new Set(datos.lineas.map((l) => l.almacenId).filter(Boolean));
    for (const almacenId of almacenesUsados) {
      const lineasDeEsteAlmacen = datos.lineas.filter((l) => l.almacenId === almacenId);
      const movimiento: MovimientoAlmacen = {
        id: uid('mov'),
        folio: `${datos.folio}-${almacenId.slice(-4)}`,
        fecha: datos.fecha,
        tipoMovimientoId: tipoMovimientoEntradaId,
        almacenId,
        proveedorId: datos.proveedorId,
        referencia: `Compra ${datos.folio}`,
        moneda: datos.moneda,
        tipoCambio: datos.tipoCambio,
        lineas: lineasDeEsteAlmacen.map((l) => ({
          id: uid('lin'),
          articuloId: l.articuloId,
          codigo: l.codigo,
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
          unidadMedida: l.unidadMedida,
          observaciones: l.observaciones,
        })),
        observaciones: `Generado automaticamente al registrar la Compra ${datos.folio}.`,
        origen: 'Compra',
        origenId: datos.id,
        estatus: 'Aplicado',
      };
      movimientosAlmacen.add(movimiento);
    }

    setModalOpen(false);
  }

  const columns: Column<Compra>[] = [
    { header: 'Folio', render: (c) => <span className="font-mono text-xs font-semibold text-ink-100">{c.folio}</span> },
    { header: 'Fecha', render: (c) => c.fecha },
    { header: 'Proveedor', render: (c) => proveedorTexto(c.proveedorId) },
    { header: 'Documento', render: (c) => (c.serieDocumento || c.numeroDocumento ? `${c.serieDocumento}-${c.numeroDocumento}` : 'N/D') },
    { header: 'Total', render: (c) => money(calcularTotalesArticulos(c.lineas).total), className: 'text-right' },
    { header: 'Estatus', render: (c) => <StatusBadge status={c.estatus} tone={c.estatus === 'Cancelada' ? 'red' : 'green'} /> },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Compras</h1>
        <p className="mt-1 text-sm text-ink-500">Registra la mercancia que entrega el proveedor; genera entrada de almacen y, si aplica, pasivo en Cuentas por Pagar.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line-800 bg-bg-900 p-2">
        <span className="px-2 text-xs uppercase tracking-wide text-ink-500">
          {seleccionada ? `Compra ${seleccionada.folio}` : 'Selecciona una compra de la tabla'}
        </span>
        {puedeCrear && (
          <ToolbarButton type="button" onClick={openNew}>
            <Plus size={16} /> Agregar
          </ToolbarButton>
        )}
        <ToolbarButton type="button" disabled={!seleccionada} onClick={abrirConsultar}>
          <Eye size={16} /> Consultar
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!seleccionada || !puedeEditar || seleccionada?.estatus === 'Cancelada'} onClick={cancelar}>
          <Ban size={16} /> Cancelar
        </ToolbarButton>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-ink-500">
          Desde
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-40" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-500">
          Hasta
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-40" />
        </label>
        <div className="relative flex-1">
          <label className="mb-1 block text-xs text-ink-500">Buscar</label>
          <Search size={15} className="pointer-events-none absolute left-3 top-[34px] text-ink-600" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Folio o proveedor..."
            className="w-full rounded-lg border border-line-700 bg-bg-900 py-2 pl-9 pr-3 text-sm text-ink-100 outline-none focus:border-breco-500"
          />
        </div>
      </div>

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(c) => c.id}
        onEdit={() => {}}
        onDelete={() => {}}
        canEdit={false}
        canDelete={false}
        emptyMessage="Sin compras en el rango seleccionado."
        selectedKey={seleccionadoId}
        onRowClick={(c) => setSeleccionadoId((actual) => (actual === c.id ? null : c.id))}
      />

      {modalOpen && <CompraFormModal editing={editing} soloLectura={soloLectura} onClose={() => setModalOpen(false)} onGuardar={guardar} />}
    </div>
  );
}
