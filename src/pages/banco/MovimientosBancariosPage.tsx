import { useMemo, useState } from 'react';
import { Ban, Eye, Landmark, Pencil, Plus, Search, TrendingDown, TrendingUp } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { hoyISO } from '../../lib/fechas';
import { uid } from '../../lib/storage';
import { saldoCuenta, saldosCorridosCuenta, totalesMovimientos } from '../../lib/banco';
import type { MovimientoBancario, TipoMovimientoBancario } from '../../types';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Input, Select, ToolbarButton } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';
import { NuevoMovimientoModal } from '../../components/banco/NuevoMovimientoModal';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function MovimientosBancariosPage() {
  const { cuentasBancarias, movimientosBancarios } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Banco', 'crear');
  const puedeEditar = hasPermission('Banco', 'editar');

  const cuentasActivas = cuentasBancarias.items.filter((c) => c.activa);
  const [cuentaId, setCuentaId] = useState<string>(cuentasActivas[0]?.id ?? '');
  const [tab, setTab] = useState<'Todos' | TipoMovimientoBancario>('Todos');
  const [desde, setDesde] = useState(() => hoyISO().slice(0, 8) + '01');
  const [hasta, setHasta] = useState(hoyISO());
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MovimientoBancario | null>(null);
  const [soloLectura, setSoloLectura] = useState(false);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);

  const saldosCorridos = useMemo(
    () => (cuentaId ? saldosCorridosCuenta(cuentaId, movimientosBancarios.items) : new Map<string, number>()),
    [cuentaId, movimientosBancarios.items],
  );

  const filtered = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return movimientosBancarios.items
      .filter((m) => m.cuentaBancariaId === cuentaId)
      .filter((m) => m.fecha >= desde && m.fecha <= hasta)
      .filter((m) => tab === 'Todos' || m.tipo === tab)
      .filter(
        (m) =>
          !termino ||
          m.concepto.toLowerCase().includes(termino) ||
          m.beneficiario.toLowerCase().includes(termino) ||
          m.referencia.toLowerCase().includes(termino),
      )
      .slice()
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || (b.creadoEn ?? '').localeCompare(a.creadoEn ?? ''));
  }, [movimientosBancarios.items, cuentaId, desde, hasta, tab, busqueda]);

  const totalesRango = totalesMovimientos(filtered);
  const seleccionado = movimientosBancarios.items.find((m) => m.id === seleccionadoId) ?? null;

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
    if (confirm(`Cancelar el movimiento "${seleccionado.concepto}" por ${money(seleccionado.importe)}?`)) {
      movimientosBancarios.update(seleccionado.id, { estatus: 'Cancelado' });
    }
  }

  function guardar(datos: Omit<MovimientoBancario, 'id'>) {
    if (editing) {
      movimientosBancarios.update(editing.id, datos);
    } else {
      movimientosBancarios.add({ id: uid('mov'), ...datos });
    }
    setModalOpen(false);
  }

  const columns: Column<MovimientoBancario>[] = [
    { header: 'Fecha', render: (m) => m.fecha },
    { header: 'Concepto', render: (m) => m.concepto },
    { header: 'Beneficiario / Origen', render: (m) => m.beneficiario || '-' },
    { header: 'Referencia', render: (m) => m.referencia || '-' },
    {
      header: 'Tipo',
      render: (m) => <StatusBadge status={m.tipo} tone={m.tipo === 'Ingreso' ? 'green' : 'red'} />,
    },
    {
      header: 'Monto',
      render: (m) => (
        <span className={`font-semibold ${m.tipo === 'Ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>
          {m.tipo === 'Egreso' ? '-' : ''}
          {money(m.importe)}
        </span>
      ),
      className: 'text-right',
    },
    {
      header: 'Saldo',
      render: (m) => money(saldosCorridos.get(m.id) ?? 0),
      className: 'text-right',
    },
    {
      header: 'Estatus',
      render: (m) => (m.estatus === 'Cancelado' ? <StatusBadge status="Cancelado" tone="red" /> : <span className="text-ink-600">-</span>),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Movimientos Bancarios</h1>
        <p className="mt-1 text-sm text-ink-500">Consulta, registra y administra los movimientos de tus cuentas bancarias.</p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cuentasActivas.length === 0 && (
          <p className="col-span-full rounded-2xl border border-line-800 bg-bg-800 p-4 text-sm text-ink-600">
            No hay cuentas bancarias activas. Da de alta una en Catalogos &gt; Cuentas Bancarias.
          </p>
        )}
        {cuentasActivas.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCuentaId(c.id)}
            className={`rounded-2xl border p-4 text-left transition ${
              cuentaId === c.id ? 'border-breco-500 bg-breco-500/5' : 'border-line-800 bg-bg-800 hover:border-line-700'
            }`}
          >
            <div className="mb-2 flex items-center gap-2 text-card-header font-medium text-ink-100">
              <Landmark size={16} className="text-breco-500" /> {c.banco}
            </div>
            <p className="text-xs text-ink-500">•••• {c.numero.slice(-4)}</p>
            <p className="mt-0.5 text-xs text-ink-600">{c.descripcion}</p>
            <p className="mt-2 text-lg font-bold text-ink-100">
              {money(saldoCuenta(c.id, movimientosBancarios.items))} <span className="text-xs font-normal text-ink-500">{c.moneda}</span>
            </p>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line-800 bg-bg-900 p-2">
        <span className="px-2 text-xs uppercase tracking-wide text-ink-500">
          {seleccionado ? `${seleccionado.tipo} ${money(seleccionado.importe)}` : 'Selecciona un movimiento de la tabla'}
        </span>
        {puedeCrear && (
          <ToolbarButton type="button" onClick={openNew} disabled={!cuentaId}>
            <Plus size={16} /> Nuevo Movimiento
          </ToolbarButton>
        )}
        <ToolbarButton type="button" disabled={!seleccionado} onClick={abrirConsultar}>
          <Eye size={16} /> Consultar
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!seleccionado || !puedeEditar || seleccionado?.origen !== 'Manual'} onClick={abrirEditar}>
          <Pencil size={16} /> Editar
        </ToolbarButton>
        <ToolbarButton
          type="button"
          disabled={!seleccionado || !puedeEditar || seleccionado?.estatus === 'Cancelado'}
          onClick={cancelar}
        >
          <Ban size={16} /> Cancelar
        </ToolbarButton>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['Todos', 'Ingreso', 'Egreso'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              tab === t ? 'border-breco-500 bg-breco-500/10 text-breco-500' : 'border-line-700 text-ink-500 hover:border-line-600'
            }`}
          >
            {t}
          </button>
        ))}
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
        <label className="flex flex-col gap-1 text-xs text-ink-500">
          Cuenta
          <Select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} className="w-56">
            {cuentasActivas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.banco} - {c.numero}
              </option>
            ))}
          </Select>
        </label>
        <div className="relative flex-1">
          <label className="mb-1 block text-xs text-ink-500">Buscar</label>
          <Search size={15} className="pointer-events-none absolute left-3 top-[34px] text-ink-600" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Concepto, beneficiario o referencia..."
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
        emptyMessage="Sin movimientos en el rango seleccionado."
        selectedKey={seleccionadoId}
        onRowClick={(m) => setSeleccionadoId((actual) => (actual === m.id ? null : m.id))}
      />

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <TrendingUp size={14} /> Ingresos
          </div>
          <p className="mt-1 text-lg font-bold text-ink-100">{money(totalesRango.ingresos)}</p>
        </div>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
          <div className="flex items-center gap-1.5 text-xs text-red-400">
            <TrendingDown size={14} /> Egresos
          </div>
          <p className="mt-1 text-lg font-bold text-ink-100">{money(totalesRango.egresos)}</p>
        </div>
        <div className="rounded-xl border border-line-800 bg-bg-800 p-3">
          <div className="flex items-center gap-1.5 text-xs text-ink-500">
            <Landmark size={14} /> Saldo actual
          </div>
          <p className="mt-1 text-lg font-bold text-ink-100">{cuentaId ? money(saldoCuenta(cuentaId, movimientosBancarios.items)) : '-'}</p>
        </div>
        <div className="rounded-xl border border-line-800 bg-bg-800 p-3">
          <div className="text-xs text-ink-500">Movimientos</div>
          <p className="mt-1 text-lg font-bold text-ink-100">{totalesRango.movimientos}</p>
        </div>
      </div>

      {modalOpen && (
        <NuevoMovimientoModal editing={editing} soloLectura={soloLectura} onClose={() => setModalOpen(false)} onGuardar={guardar} />
      )}
    </div>
  );
}
