import { useMemo, useState } from 'react';
import { AlertTriangle, Ban, Eye, Plus, Printer, Search } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { hoyISO } from '../../lib/fechas';
import { uid } from '../../lib/storage';
import { comprasPendientesDePago, gastosPendientesDePago } from '../../lib/banco';
import type { PagoProveedor } from '../../types';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Input, ToolbarButton } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';
import { RegistrarPagoProveedorModal } from '../../components/banco/RegistrarPagoProveedorModal';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function CuentasPorPagarPage() {
  const { pagosProveedor, proveedores, gastosViaje, movimientosBancarios, compras } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Banco', 'crear');
  const puedeEditar = hasPermission('Banco', 'editar');

  const [desde, setDesde] = useState(() => hoyISO().slice(0, 8) + '01');
  const [hasta, setHasta] = useState(hoyISO());
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PagoProveedor | null>(null);
  const [soloLectura, setSoloLectura] = useState(false);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);

  function nombreProveedor(id: string) {
    return proveedores.items.find((p) => p.id === id)?.nombre ?? 'N/D';
  }

  const pendientesTotales = useMemo(() => {
    return proveedores.items.reduce((acc, p) => {
      const pendientesGastos = gastosPendientesDePago(gastosViaje.items, pagosProveedor.items, p.id);
      const pendientesCompras = comprasPendientesDePago(compras.items, pagosProveedor.items, p.id);
      return (
        acc + pendientesGastos.reduce((a, gc) => a + gc.saldo, 0) + pendientesCompras.reduce((a, cc) => a + cc.saldo, 0)
      );
    }, 0);
  }, [proveedores.items, gastosViaje.items, compras.items, pagosProveedor.items]);

  const filtered = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return pagosProveedor.items
      .filter((p) => p.fecha >= desde && p.fecha <= hasta)
      .filter((p) => !termino || p.folio.toLowerCase().includes(termino) || nombreProveedor(p.proveedorId).toLowerCase().includes(termino))
      .slice()
      .sort((a, b) => b.folio.localeCompare(a.folio));
  }, [pagosProveedor.items, desde, hasta, busqueda, proveedores.items]);

  const seleccionado = pagosProveedor.items.find((p) => p.id === seleccionadoId) ?? null;

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

  function cancelar() {
    if (!seleccionado) return;
    if (confirm(`Cancelar el pago "${seleccionado.folio}"? Los gastos que liquido volveran a estar pendientes de pago.`)) {
      pagosProveedor.update(seleccionado.id, { estatus: 'Cancelado' });
      const movimiento = movimientosBancarios.items.find((m) => m.origen === 'PagoProveedor' && m.origenId === seleccionado.id);
      if (movimiento) movimientosBancarios.update(movimiento.id, { estatus: 'Cancelado' });
    }
  }

  function guardar(datos: Omit<PagoProveedor, 'id'>) {
    if (editing) {
      pagosProveedor.update(editing.id, datos);
    } else {
      const nuevoId = uid('ppv');
      pagosProveedor.add({ id: nuevoId, ...datos });
      if (datos.cuentaBancariaId) {
        movimientosBancarios.add({
          id: uid('mov'),
          cuentaBancariaId: datos.cuentaBancariaId,
          fecha: datos.fecha,
          tipo: 'Egreso',
          concepto: datos.concepto || 'PAGO A PROVEEDOR',
          beneficiario: nombreProveedor(datos.proveedorId),
          importe: datos.importe,
          referencia: datos.referencia,
          observaciones: `Pago a proveedor ${datos.folio}`,
          origen: 'PagoProveedor',
          origenId: nuevoId,
          conciliado: false,
          estatus: 'Activo',
        });
      }
    }
    setModalOpen(false);
  }

  function imprimir() {
    if (!seleccionado) return;
    window.open(`#/banco/cuentas-por-pagar/imprimir/${seleccionado.id}`, '_blank');
  }

  const columns: Column<PagoProveedor>[] = [
    { header: 'Folio', render: (p) => <span className="font-mono text-xs font-semibold text-ink-100">{p.folio}</span> },
    { header: 'Fecha', render: (p) => p.fecha },
    { header: 'Proveedor', render: (p) => nombreProveedor(p.proveedorId) },
    { header: 'Forma Pago', render: (p) => p.formaPago },
    { header: 'Importe', render: (p) => <span className="font-semibold text-ink-100">{money(p.importe)}</span>, className: 'text-right' },
    { header: 'Estatus', render: (p) => <StatusBadge status={p.estatus} tone={p.estatus === 'Cancelado' ? 'red' : 'green'} /> },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink-100">Cuentas por Pagar</h1>
          <p className="mt-1 text-sm text-ink-500">
            Registra los pagos a proveedor que liquidan gastos de viaje o compras de almacen marcados "Genera pasivo".
          </p>
        </div>
        {pendientesTotales > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-400">
            <AlertTriangle size={16} />
            Pendiente de pagar a proveedores: <span className="font-bold">{money(pendientesTotales)}</span>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line-800 bg-bg-900 p-2">
        <span className="px-2 text-xs uppercase tracking-wide text-ink-500">
          {seleccionado ? `Pago ${seleccionado.folio}` : 'Selecciona un pago de la tabla'}
        </span>
        {puedeCrear && (
          <ToolbarButton type="button" onClick={openNew}>
            <Plus size={16} /> Registrar Pago
          </ToolbarButton>
        )}
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
            placeholder="Folio o proveedor..."
            className="w-full rounded-lg border border-line-700 bg-bg-900 py-2 pl-9 pr-3 text-sm text-ink-100 outline-none focus:border-breco-500"
          />
        </div>
      </div>

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(p) => p.id}
        onEdit={() => {}}
        onDelete={() => {}}
        canEdit={false}
        canDelete={false}
        emptyMessage="Sin pagos a proveedor registrados en el rango seleccionado."
        selectedKey={seleccionadoId}
        onRowClick={(p) => setSeleccionadoId((actual) => (actual === p.id ? null : p.id))}
      />

      {modalOpen && (
        <RegistrarPagoProveedorModal editing={editing} soloLectura={soloLectura} onClose={() => setModalOpen(false)} onGuardar={guardar} />
      )}
    </div>
  );
}
