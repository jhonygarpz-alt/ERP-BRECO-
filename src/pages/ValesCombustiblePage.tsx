import { useMemo, useState } from 'react';
import { Ban, CheckCircle2, Eye, Printer } from 'lucide-react';
import { useData } from '../lib/DataContext';
import { useAuth } from '../lib/AuthContext';
import { uid } from '../lib/storage';
import { nextFolioValeCombustible } from '../lib/valesCombustible';
import type { TipoCombustible, ValeCombustible } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { CrudTable, type Column } from '../components/ui/CrudTable';
import { Modal } from '../components/ui/Modal';
import { ComboBoxCodigo } from '../components/ui/ComboBoxCodigo';
import { Field, GhostButton, Input, PrimaryButton, Select, Textarea, ToolbarButton } from '../components/ui/form';
import { StatusBadge } from '../components/ui/Badge';
import { hoyISO } from '../lib/fechas';

const TIPOS_COMBUSTIBLE: TipoCombustible[] = ['Diesel', 'Gasolina'];

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function construirVale(vales: ValeCombustible[]): Omit<ValeCombustible, 'id'> {
  return {
    folio: nextFolioValeCombustible(vales),
    fecha: hoyISO(),
    viajeId: undefined,
    operadorId: undefined,
    unidadId: undefined,
    combustibleTipo: 'Diesel',
    litrosAutorizados: 0,
    precioLitroEstimado: undefined,
    proveedorId: undefined,
    numeroReferencia: '',
    moneda: 'PESOS',
    monto: 0,
    estatus: 'Vigente',
    notas: '',
  };
}

export function ValesCombustiblePage() {
  const { valesCombustible, viajes, operadores, unidades, proveedores, clientes } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Viajes', 'crear');
  const puedeEditar = hasPermission('Viajes', 'editar');
  const puedeEliminar = hasPermission('Viajes', 'eliminar');

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ValeCombustible | null>(null);
  const [soloLectura, setSoloLectura] = useState(false);
  const [form, setForm] = useState<Omit<ValeCombustible, 'id'>>(() => construirVale([]));
  const [error, setError] = useState('');
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);

  const viajeSeleccionado = viajes.items.find((v) => v.id === form.viajeId);
  const operadorSeleccionado = operadores.items.find((o) => o.id === form.operadorId);
  const unidadSeleccionada = unidades.items.find((u) => u.id === form.unidadId);
  const proveedorSeleccionado = proveedores.items.find((p) => p.id === form.proveedorId);
  const valeSeleccionado = valesCombustible.items.find((v) => v.id === seleccionadoId) ?? null;

  function folioViaje(id?: string) {
    if (!id) return '';
    return viajes.items.find((v) => v.id === id)?.folio ?? 'N/D';
  }
  function nombreOperador(id?: string) {
    if (!id) return '';
    return operadores.items.find((o) => o.id === id)?.nombre ?? 'N/D';
  }
  function economicoUnidad(id?: string) {
    if (!id) return '';
    return unidades.items.find((u) => u.id === id)?.economico ?? 'N/D';
  }
  function nombreProveedor(id?: string) {
    if (!id) return '';
    return proveedores.items.find((p) => p.id === id)?.nombre ?? 'N/D';
  }
  function nombreCliente(clienteId: string) {
    return clientes.items.find((c) => c.id === clienteId)?.nombre ?? '';
  }

  const filtered = useMemo(() => {
    const termino = search.toLowerCase();
    return valesCombustible.items
      .filter(
        (v) =>
          !termino ||
          v.folio.toLowerCase().includes(termino) ||
          folioViaje(v.viajeId).toLowerCase().includes(termino) ||
          economicoUnidad(v.unidadId).toLowerCase().includes(termino) ||
          nombreOperador(v.operadorId).toLowerCase().includes(termino),
      )
      .slice()
      .sort((a, b) => b.folio.localeCompare(a.folio));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valesCombustible.items, search, viajes.items, unidades.items, operadores.items]);

  const totalFiltrado = filtered.reduce((acc, v) => acc + v.monto, 0);

  function openNew() {
    setEditing(null);
    setForm(construirVale(valesCombustible.items));
    setSoloLectura(false);
    setError('');
    setModalOpen(true);
  }

  function openEdit(v: ValeCombustible) {
    setEditing(v);
    setForm({ ...v });
    setSoloLectura(false);
    setError('');
    setModalOpen(true);
  }

  function abrirConsultar() {
    if (!valeSeleccionado) return;
    setEditing(valeSeleccionado);
    setForm({ ...valeSeleccionado });
    setSoloLectura(true);
    setError('');
    setModalOpen(true);
  }

  function imprimirSeleccionado() {
    if (!valeSeleccionado) return;
    window.open(`#/vales-combustible/imprimir/${valeSeleccionado.id}`, '_blank');
  }

  function cancelarSeleccionado() {
    if (!valeSeleccionado) return;
    if (confirm(`Cancelar el vale "${valeSeleccionado.folio}"?`)) {
      valesCombustible.update(valeSeleccionado.id, { estatus: 'Cancelado' });
    }
  }

  function marcarSurtidoSeleccionado() {
    if (!valeSeleccionado) return;
    valesCombustible.update(valeSeleccionado.id, { estatus: 'Surtido' });
  }

  function seleccionarViaje(v: (typeof viajes.items)[number]) {
    setForm((f) => ({
      ...f,
      viajeId: v.id,
      operadorId: f.operadorId || v.operadorId || undefined,
      unidadId: f.unidadId || v.unidadId || undefined,
    }));
  }

  // El monto se calcula solo (litros x precio estimado por litro) en vez de
  // capturarse a mano, igual que el gasto de Combustible en Gastos de Viaje.
  function actualizarCalculo(patch: Partial<Pick<ValeCombustible, 'litrosAutorizados' | 'precioLitroEstimado'>>) {
    setForm((f) => {
      const siguiente = { ...f, ...patch };
      const litros = siguiente.litrosAutorizados ?? 0;
      const precio = siguiente.precioLitroEstimado ?? 0;
      return { ...siguiente, monto: Math.round(litros * precio * 100) / 100 };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.unidadId) {
      setError('Selecciona la unidad que va a cargar combustible.');
      return;
    }
    if (!form.litrosAutorizados || form.litrosAutorizados <= 0) {
      setError('Captura los litros autorizados.');
      return;
    }
    setError('');
    if (editing) {
      valesCombustible.update(editing.id, form);
    } else {
      valesCombustible.add({ id: uid('vc'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(v: ValeCombustible) {
    if (confirm(`Eliminar el vale "${v.folio}"?`)) valesCombustible.remove(v.id);
  }

  const columns: Column<ValeCombustible>[] = [
    { header: 'Folio', render: (v) => <span className="font-mono text-xs font-semibold text-ink-100">{v.folio}</span> },
    { header: 'Fecha', render: (v) => v.fecha },
    {
      header: 'Viaje',
      render: (v) => {
        const viaje = viajes.items.find((x) => x.id === v.viajeId);
        if (!viaje) return <span className="text-ink-600">-</span>;
        return (
          <div>
            <div className="font-semibold text-ink-100">{viaje.folio}</div>
            <div className="text-xs text-ink-600">{nombreCliente(viaje.clienteId)}</div>
          </div>
        );
      },
    },
    { header: 'Unidad', render: (v) => economicoUnidad(v.unidadId) || '-' },
    { header: 'Operador', render: (v) => nombreOperador(v.operadorId) || '-' },
    { header: 'Combustible', render: (v) => `${v.combustibleTipo} · ${v.litrosAutorizados} L` },
    { header: 'Estacion', render: (v) => nombreProveedor(v.proveedorId) || '-' },
    {
      header: 'Monto Estimado',
      render: (v) => <span className="font-semibold text-ink-100">{money(v.monto)}</span>,
      className: 'text-right',
    },
    {
      header: 'Estatus',
      render: (v) => (
        <StatusBadge status={v.estatus} tone={v.estatus === 'Vigente' ? 'blue' : v.estatus === 'Surtido' ? 'green' : 'red'} />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Vales de Combustible"
        subtitle="Autorizacion de carga de combustible para una unidad, antes de comprobar el gasto real."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por folio, viaje, unidad u operador..."
        addLabel="Agregar vale"
        onAdd={puedeCrear ? openNew : undefined}
        extra={
          <span className="rounded-lg border border-blue-400/30 bg-blue-400/5 px-3 py-2 text-sm text-ink-300">
            Total mostrado: <span className="font-semibold text-ink-100">{money(totalFiltrado)}</span>
          </span>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-line-800 bg-bg-900 p-2">
        <span className="px-2 text-xs uppercase tracking-wide text-ink-500">
          {valeSeleccionado ? `Vale ${valeSeleccionado.folio}` : 'Selecciona un vale de la tabla'}
        </span>
        <ToolbarButton type="button" disabled={!valeSeleccionado} onClick={abrirConsultar}>
          <Eye size={16} /> Consultar
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!valeSeleccionado} onClick={imprimirSeleccionado}>
          <Printer size={16} /> Imprimir
        </ToolbarButton>
        <ToolbarButton
          type="button"
          disabled={!valeSeleccionado || !puedeEditar || valeSeleccionado?.estatus !== 'Vigente'}
          onClick={marcarSurtidoSeleccionado}
        >
          <CheckCircle2 size={16} /> Marcar Surtido
        </ToolbarButton>
        <ToolbarButton
          type="button"
          disabled={!valeSeleccionado || !puedeEditar || valeSeleccionado?.estatus === 'Cancelado'}
          onClick={cancelarSeleccionado}
        >
          <Ban size={16} /> Cancelar
        </ToolbarButton>
      </div>

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(v) => v.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
        emptyMessage="Sin vales de combustible capturados todavia."
        selectedKey={seleccionadoId}
        onRowClick={(v) => setSeleccionadoId((actual) => (actual === v.id ? null : v.id))}
      />

      {modalOpen && (
        <Modal
          title={soloLectura ? 'Consultar vale de combustible' : editing ? 'Editar vale de combustible' : 'Agregar vale de combustible'}
          onClose={() => setModalOpen(false)}
          wide
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="rounded-lg bg-breco-500/10 px-3 py-2 text-sm text-breco-500">{error}</p>}

            <fieldset disabled={soloLectura} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Field label="Folio">
                  <Input readOnly value={form.folio} />
                </Field>
                <Field label="Fecha">
                  <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
                </Field>
                <Field label="Estatus">
                  <Select value={form.estatus} onChange={(e) => setForm({ ...form, estatus: e.target.value as ValeCombustible['estatus'] })}>
                    <option value="Vigente">Vigente</option>
                    <option value="Surtido">Surtido</option>
                    <option value="Cancelado">Cancelado</option>
                  </Select>
                </Field>
                <Field label="Numero / Referencia">
                  <Input
                    value={form.numeroReferencia}
                    onChange={(e) => setForm({ ...form, numeroReferencia: e.target.value })}
                    placeholder="Folio del ticket en la estacion"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Viaje (opcional)">
                  <ComboBoxCodigo
                    items={viajes.items}
                    valor={viajeSeleccionado?.folio ?? ''}
                    obtenerCodigo={(v) => v.folio}
                    obtenerEtiqueta={(v) => `${nombreCliente(v.clienteId)} · ${v.rutaDescripcion || `${v.origen} -> ${v.destino}`}`}
                    onSeleccionar={seleccionarViaje}
                    onLimpiar={() => setForm((f) => ({ ...f, viajeId: undefined }))}
                    placeholder="Folio del viaje"
                  />
                </Field>
                <Field label="Operador">
                  <ComboBoxCodigo
                    items={operadores.items}
                    valor={operadorSeleccionado?.numero ?? ''}
                    obtenerCodigo={(o) => o.numero}
                    obtenerEtiqueta={(o) => o.nombre}
                    onSeleccionar={(o) => setForm((f) => ({ ...f, operadorId: o.id }))}
                    onLimpiar={() => setForm((f) => ({ ...f, operadorId: undefined }))}
                    placeholder="Numero de operador"
                  />
                </Field>
                <Field label="Unidad">
                  <ComboBoxCodigo
                    items={unidades.items}
                    valor={unidadSeleccionada?.economico ?? ''}
                    obtenerCodigo={(u) => u.economico}
                    obtenerEtiqueta={(u) => u.placas}
                    onSeleccionar={(u) => setForm((f) => ({ ...f, unidadId: u.id }))}
                    onLimpiar={() => setForm((f) => ({ ...f, unidadId: undefined }))}
                    placeholder="Numero economico"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 rounded-xl border border-blue-400/30 bg-blue-400/5 p-4 sm:grid-cols-3">
                <Field label="Combustible">
                  <Select
                    value={form.combustibleTipo}
                    onChange={(e) => setForm({ ...form, combustibleTipo: e.target.value as TipoCombustible })}
                  >
                    {TIPOS_COMBUSTIBLE.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Litros autorizados">
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={form.litrosAutorizados}
                    onChange={(e) => actualizarCalculo({ litrosAutorizados: Number(e.target.value) || 0 })}
                  />
                </Field>
                <Field label="Precio estimado por litro">
                  <Input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={form.precioLitroEstimado ?? ''}
                    onChange={(e) => actualizarCalculo({ precioLitroEstimado: e.target.value === '' ? undefined : Number(e.target.value) })}
                  />
                </Field>
              </div>

              <Field label="Estacion de servicio (proveedor, opcional)">
                <ComboBoxCodigo
                  items={proveedores.items}
                  valor={proveedorSeleccionado?.numero ?? ''}
                  obtenerCodigo={(p) => p.numero}
                  obtenerEtiqueta={(p) => p.nombre}
                  onSeleccionar={(p) => setForm((f) => ({ ...f, proveedorId: p.id }))}
                  onLimpiar={() => setForm((f) => ({ ...f, proveedorId: undefined }))}
                  placeholder="Numero de proveedor (opcional)"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Moneda">
                  <Select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })}>
                    <option value="PESOS">PESOS</option>
                    <option value="DOLARES">DOLARES</option>
                  </Select>
                </Field>
                <Field label="Monto Estimado">
                  <Input type="number" readOnly value={form.monto} />
                </Field>
              </div>

              <Field label="Notas">
                <Textarea rows={2} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
              </Field>
            </fieldset>

            <div className="flex justify-end gap-2 pt-2">
              <GhostButton type="button" onClick={() => setModalOpen(false)}>
                {soloLectura ? 'Cerrar' : 'Cancelar'}
              </GhostButton>
              {!soloLectura && <PrimaryButton type="submit">{editing ? 'Guardar cambios' : 'Agregar vale'}</PrimaryButton>}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
