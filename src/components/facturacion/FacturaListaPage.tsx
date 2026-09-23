import { useMemo, useState } from 'react';
import { Ban, ChevronDown, Download, Eye, Pencil, Plus, Printer, Search } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import { hoyISO } from '../../lib/fechas';
import { descargarFacturaPdf, descargarFacturasZip } from '../../lib/facturaPdf';
import type { Factura, TipoFactura } from '../../types';
import { CrudTable, type Column } from '../ui/CrudTable';
import { Input, ToolbarButton } from '../ui/form';
import { StatusBadge } from '../ui/Badge';
import { FacturaFormModal } from './FacturaFormModal';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function FacturaListaPage({ tipo, titulo, subtitulo }: { tipo: TipoFactura; titulo: string; subtitulo: string }) {
  const { facturas, clientes, viajes, empresa } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Facturacion', 'crear');
  const puedeEditar = hasPermission('Facturacion', 'editar');
  const puedeEliminar = hasPermission('Facturacion', 'eliminar');

  const [desde, setDesde] = useState(() => hoyISO().slice(0, 8) + '01');
  const [hasta, setHasta] = useState(hoyISO());
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Factura | null>(null);
  const [soloLectura, setSoloLectura] = useState(false);
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null);
  const [descargarAbierto, setDescargarAbierto] = useState(false);

  function nombreCliente(id: string) {
    return clientes.items.find((c) => c.id === id)?.nombre ?? 'N/D';
  }

  const filtered = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return facturas.items
      .filter((f) => f.tipo === tipo)
      .filter((f) => f.fecha >= desde && f.fecha <= hasta)
      .filter((f) => !termino || f.folio.toLowerCase().includes(termino) || nombreCliente(f.clienteId).toLowerCase().includes(termino))
      .slice()
      .sort((a, b) => b.folio.localeCompare(a.folio));
  }, [facturas.items, tipo, desde, hasta, busqueda, clientes.items]);

  const seleccionada = facturas.items.find((f) => f.id === seleccionadaId) ?? null;

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

  function abrirEditar() {
    if (!seleccionada) return;
    setEditing(seleccionada);
    setSoloLectura(false);
    setModalOpen(true);
  }

  function editarDesdeTabla(f: Factura) {
    setEditing(f);
    setSoloLectura(false);
    setModalOpen(true);
  }

  function cancelar() {
    if (!seleccionada) return;
    if (confirm(`Cancelar la factura "${seleccionada.folio}"? Sus viajes volveran a estar disponibles para facturar.`)) {
      facturas.update(seleccionada.id, { estatus: 'Cancelado' });
    }
  }

  function eliminar(f: Factura) {
    if (confirm(`Eliminar la factura "${f.folio}"?`)) facturas.remove(f.id);
  }

  function guardar(datos: Omit<Factura, 'id'>) {
    if (editing) {
      facturas.update(editing.id, datos);
    } else {
      facturas.add({ id: uid('fac'), ...datos });
    }
    setModalOpen(false);
  }

  function imprimir(f: Factura) {
    window.open(`#/facturacion/imprimir/${f.id}`, '_blank');
  }

  function viajesDeFactura(f: Factura) {
    return f.viajeIds.map((vid) => viajes.items.find((v) => v.id === vid)).filter((v): v is (typeof viajes.items)[number] => Boolean(v));
  }

  function descargarSeleccionada() {
    if (!seleccionada) return;
    descargarFacturaPdf(seleccionada, clientes.items.find((c) => c.id === seleccionada.clienteId), viajesDeFactura(seleccionada), empresa.value);
    setDescargarAbierto(false);
  }

  async function descargarMasiva() {
    setDescargarAbierto(false);
    for (const f of filtered) {
      descargarFacturaPdf(f, clientes.items.find((c) => c.id === f.clienteId), viajesDeFactura(f), empresa.value);
      // Pequena pausa entre descargas: el navegador bloquea multiples
      // descargas disparadas en el mismo instante como si fueran popups.
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  async function descargarZip() {
    setDescargarAbierto(false);
    await descargarFacturasZip(filtered, clientes.items, viajes.items, empresa.value, `Facturas-${tipo}-${desde}-a-${hasta}.zip`);
  }

  const columns: Column<Factura>[] = [
    { header: 'Folio', render: (f) => <span className="font-mono text-xs font-semibold text-ink-100">{f.folio}</span> },
    { header: 'Fecha', render: (f) => f.fecha },
    { header: 'Cliente', render: (f) => nombreCliente(f.clienteId) },
    { header: 'Moneda', render: (f) => (f.moneda === 'MXN' ? 'PESOS' : 'DOLARES') },
    { header: 'Total', render: (f) => <span className="font-semibold text-ink-100">{money(f.importe)}</span>, className: 'text-right' },
    { header: 'Estatus', render: (f) => <StatusBadge status={f.estatus} /> },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">{titulo}</h1>
        <p className="mt-1 text-sm text-ink-500">{subtitulo}</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line-800 bg-bg-900 p-2">
        <span className="px-2 text-xs uppercase tracking-wide text-ink-500">
          {seleccionada ? `Factura ${seleccionada.folio}` : 'Selecciona una factura de la tabla'}
        </span>
        {puedeCrear && (
          <ToolbarButton type="button" onClick={openNew}>
            <Plus size={16} /> Agregar
          </ToolbarButton>
        )}
        <ToolbarButton type="button" disabled={!seleccionada || !puedeEditar} onClick={abrirEditar}>
          <Pencil size={16} /> Modificar
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!seleccionada} onClick={abrirConsultar}>
          <Eye size={16} /> Consultar
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!seleccionada} onClick={() => seleccionada && imprimir(seleccionada)}>
          <Printer size={16} /> Imprimir
        </ToolbarButton>
        <div className="relative">
          <ToolbarButton type="button" disabled={filtered.length === 0} onClick={() => setDescargarAbierto((v) => !v)}>
            <Download size={16} /> Descargar <ChevronDown size={14} />
          </ToolbarButton>
          {descargarAbierto && (
            <div className="absolute z-20 mt-1 w-48 overflow-hidden rounded-lg border border-line-700 bg-bg-800 shadow-xl">
              <button
                type="button"
                disabled={!seleccionada}
                onClick={descargarSeleccionada}
                className="block w-full px-3 py-2 text-left text-sm text-ink-200 hover:bg-bg-700 disabled:cursor-not-allowed disabled:text-ink-600"
              >
                Descargar (seleccionada)
              </button>
              <button
                type="button"
                onClick={descargarMasiva}
                className="block w-full px-3 py-2 text-left text-sm text-ink-200 hover:bg-bg-700"
              >
                Descarga Masiva ({filtered.length})
              </button>
              <button
                type="button"
                onClick={descargarZip}
                className="block w-full px-3 py-2 text-left text-sm text-ink-200 hover:bg-bg-700"
              >
                Descargar Zip ({filtered.length})
              </button>
            </div>
          )}
        </div>
        <ToolbarButton
          type="button"
          disabled={!seleccionada || !puedeEditar || seleccionada?.estatus === 'Cancelado'}
          onClick={cancelar}
        >
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
            placeholder="Folio o cliente..."
            className="w-full rounded-lg border border-line-700 bg-bg-900 py-2 pl-9 pr-3 text-sm text-ink-100 outline-none focus:border-breco-500"
          />
        </div>
      </div>

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(f) => f.id}
        onEdit={editarDesdeTabla}
        onDelete={eliminar}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
        emptyMessage="Sin facturas en el rango seleccionado."
        selectedKey={seleccionadaId}
        onRowClick={(f) => setSeleccionadaId((actual) => (actual === f.id ? null : f.id))}
      />

      {modalOpen && (
        <FacturaFormModal tipo={tipo} editing={editing} soloLectura={soloLectura} onClose={() => setModalOpen(false)} onGuardar={guardar} />
      )}
    </div>
  );
}
