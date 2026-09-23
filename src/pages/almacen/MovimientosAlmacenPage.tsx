import { useMemo, useState } from 'react';
import { Ban, Eye, Pencil, Plus, Printer, Search } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { hoyISO } from '../../lib/fechas';
import { calcularTotalesArticulos } from '../../lib/almacen';
import type { MovimientoAlmacen } from '../../types';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Input, ToolbarButton } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';
import { MovimientoAlmacenFormModal } from '../../components/almacen/MovimientoAlmacenFormModal';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function MovimientosAlmacenPage() {
  const { movimientosAlmacen, almacenes, tiposMovimientoAlmacen } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Almacen', 'crear');
  const puedeEditar = hasPermission('Almacen', 'editar');

  const [desde, setDesde] = useState(() => hoyISO().slice(0, 8) + '01');
  const [hasta, setHasta] = useState(hoyISO());
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MovimientoAlmacen | null>(null);
  const [soloLectura, setSoloLectura] = useState(false);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);

  function almacenTexto(id: string) {
    const a = almacenes.items.find((aa) => aa.id === id);
    return a ? `${a.codigo} - ${a.nombre}` : 'N/D';
  }
  function tipoTexto(id: string) {
    return tiposMovimientoAlmacen.items.find((t) => t.id === id)?.nombre ?? 'N/D';
  }
  function naturalezaDe(id: string) {
    return tiposMovimientoAlmacen.items.find((t) => t.id === id)?.naturaleza;
  }

  const filtered = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return movimientosAlmacen.items
      .filter((m) => m.fecha >= desde && m.fecha <= hasta)
      .filter((m) => !termino || m.folio.toLowerCase().includes(termino) || almacenTexto(m.almacenId).toLowerCase().includes(termino))
      .slice()
      .sort((a, b) => b.folio.localeCompare(a.folio));
  }, [movimientosAlmacen.items, desde, hasta, busqueda, almacenes.items]);

  const seleccionado = movimientosAlmacen.items.find((m) => m.id === seleccionadoId) ?? null;

  function openNew() {
    setEditing(null);
    setSoloLectura(false);
    setModalOpen(true);
  }
  function abrirConsultar() {
    if (!seleccionado) return;
    setEditing(seleccionado);
    setSoloLectura(true);
    setModalOpen(true);
  }
  function abrirEditar() {
    if (!seleccionado) return;
    setEditing(seleccionado);
    setSoloLectura(false);
    setModalOpen(true);
  }
  function cancelar() {
    if (!seleccionado) return;
    if (confirm(`Cancelar el movimiento "${seleccionado.folio}"? Dejara de contar en el inventario.`)) {
      movimientosAlmacen.update(seleccionado.id, { estatus: 'Cancelado' });
    }
  }
  function guardar(datos: MovimientoAlmacen) {
    const yaExiste = movimientosAlmacen.items.some((m) => m.id === datos.id);
    if (yaExiste) {
      movimientosAlmacen.update(datos.id, datos);
    } else {
      movimientosAlmacen.add(datos);
    }
    setModalOpen(false);
  }
  function imprimir() {
    if (!seleccionado) return;
    window.open(`#/almacen/movimientos/imprimir/${seleccionado.id}`, '_blank');
  }

  const columns: Column<MovimientoAlmacen>[] = [
    { header: 'Folio', render: (m) => <span className="font-mono text-xs font-semibold text-ink-100">{m.folio}</span> },
    { header: 'Fecha', render: (m) => m.fecha },
    { header: 'Tipo Movimiento', render: (m) => tipoTexto(m.tipoMovimientoId) },
    {
      header: 'Naturaleza',
      render: (m) => <StatusBadge status={naturalezaDe(m.tipoMovimientoId) ?? 'N/D'} tone={naturalezaDe(m.tipoMovimientoId) === 'Entrada' ? 'green' : 'amber'} />,
    },
    { header: 'Almacen', render: (m) => almacenTexto(m.almacenId) },
    { header: 'Total', render: (m) => money(calcularTotalesArticulos(m.lineas).total), className: 'text-right' },
    { header: 'Estatus', render: (m) => <StatusBadge status={m.estatus} tone={m.estatus === 'Cancelado' ? 'red' : 'green'} /> },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Movimientos de Almacen</h1>
        <p className="mt-1 text-sm text-ink-500">Entradas y salidas manuales de inventario por almacen.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line-800 bg-bg-900 p-2">
        <span className="px-2 text-xs uppercase tracking-wide text-ink-500">
          {seleccionado ? `Movimiento ${seleccionado.folio}` : 'Selecciona un movimiento de la tabla'}
        </span>
        {puedeCrear && (
          <ToolbarButton type="button" onClick={openNew}>
            <Plus size={16} /> Agregar
          </ToolbarButton>
        )}
        <ToolbarButton type="button" disabled={!seleccionado || !puedeEditar || seleccionado?.estatus === 'Cancelado'} onClick={abrirEditar}>
          <Pencil size={16} /> Editar
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!seleccionado} onClick={abrirConsultar}>
          <Eye size={16} /> Consultar
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!seleccionado} onClick={imprimir}>
          <Printer size={16} /> Imprimir
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!seleccionado || !puedeEditar || seleccionado?.estatus === 'Cancelado'} onClick={cancelar}>
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
            placeholder="Folio o almacen..."
            className="w-full rounded-lg border border-line-700 bg-bg-900 py-2 pl-9 pr-3 text-sm text-ink-100 outline-none focus:border-breco-500"
          />
        </div>
      </div>

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(m) => m.id}
        onEdit={() => {}}
        onDelete={() => {}}
        canEdit={false}
        canDelete={false}
        emptyMessage="Sin movimientos de almacen en el rango seleccionado."
        selectedKey={seleccionadoId}
        onRowClick={(m) => setSeleccionadoId((actual) => (actual === m.id ? null : m.id))}
      />

      {modalOpen && (
        <MovimientoAlmacenFormModal editing={editing} soloLectura={soloLectura} onClose={() => setModalOpen(false)} onGuardar={guardar} />
      )}
    </div>
  );
}
