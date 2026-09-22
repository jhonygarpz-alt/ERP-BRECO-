import { useMemo, useState } from 'react';
import { Ban, Eye, Printer } from 'lucide-react';
import { useData } from '../lib/DataContext';
import { useAuth } from '../lib/AuthContext';
import { uid } from '../lib/storage';
import type { GastoViaje, TipoCombustible } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { CrudTable, type Column } from '../components/ui/CrudTable';
import { Modal } from '../components/ui/Modal';
import { ComboBoxCodigo } from '../components/ui/ComboBoxCodigo';
import { Field, GhostButton, Input, PrimaryButton, Select, Textarea, ToolbarButton } from '../components/ui/form';
import { StatusBadge } from '../components/ui/Badge';

const TIPOS_GASTO = ['Peajes', 'Combustible', 'Viaticos / Anticipo', 'Otro'];
const TIPOS_COMBUSTIBLE: TipoCombustible[] = ['Diesel', 'Gasolina'];

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

const emptyForm: Omit<GastoViaje, 'id'> = {
  viajeId: '',
  operadorId: undefined,
  tipo: 'Peajes',
  concepto: '',
  proveedorId: undefined,
  fecha: new Date().toISOString().slice(0, 10),
  numeroReferencia: '',
  moneda: 'PESOS',
  monto: 0,
  generaPasivo: false,
  notas: '',
  estatus: 'Activo',
  combustibleTipo: undefined,
  litros: undefined,
  precioLitro: undefined,
};

export function GastosViajePage() {
  const { gastosViaje, viajes, operadores, proveedores, clientes } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Viajes', 'crear');
  const puedeEditar = hasPermission('Viajes', 'editar');
  const puedeEliminar = hasPermission('Viajes', 'eliminar');

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GastoViaje | null>(null);
  const [soloLectura, setSoloLectura] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [tipoOtro, setTipoOtro] = useState('');
  const [error, setError] = useState('');
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);

  const viajeSeleccionado = viajes.items.find((v) => v.id === form.viajeId);
  const operadorSeleccionado = operadores.items.find((o) => o.id === form.operadorId);
  const proveedorSeleccionado = proveedores.items.find((p) => p.id === form.proveedorId);
  const gastoSeleccionado = gastosViaje.items.find((g) => g.id === seleccionadoId) ?? null;

  function folioViaje(id: string) {
    return viajes.items.find((v) => v.id === id)?.folio ?? 'N/D';
  }
  function nombreOperador(id?: string) {
    if (!id) return '';
    return operadores.items.find((o) => o.id === id)?.nombre ?? 'N/D';
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
    return gastosViaje.items
      .filter(
        (g) =>
          !termino ||
          folioViaje(g.viajeId).toLowerCase().includes(termino) ||
          g.concepto.toLowerCase().includes(termino) ||
          g.tipo.toLowerCase().includes(termino) ||
          nombreProveedor(g.proveedorId).toLowerCase().includes(termino),
      )
      .slice()
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gastosViaje.items, search, viajes.items, proveedores.items]);

  const totalFiltrado = filtered.reduce((acc, g) => acc + g.monto, 0);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setTipoOtro('');
    setSoloLectura(false);
    setError('');
    setModalOpen(true);
  }

  function openEdit(g: GastoViaje) {
    setEditing(g);
    const esOtro = !TIPOS_GASTO.includes(g.tipo);
    setForm({ ...g });
    setTipoOtro(esOtro ? g.tipo : '');
    setSoloLectura(false);
    setError('');
    setModalOpen(true);
  }

  function abrirConsultar() {
    if (!gastoSeleccionado) return;
    setEditing(gastoSeleccionado);
    const esOtro = !TIPOS_GASTO.includes(gastoSeleccionado.tipo);
    setForm({ ...gastoSeleccionado });
    setTipoOtro(esOtro ? gastoSeleccionado.tipo : '');
    setSoloLectura(true);
    setError('');
    setModalOpen(true);
  }

  function imprimirSeleccionado() {
    if (!gastoSeleccionado) return;
    window.open(`#/gastos-viaje/imprimir/${gastoSeleccionado.id}`, '_blank');
  }

  function cancelarSeleccionado() {
    if (!gastoSeleccionado) return;
    if (confirm(`Cancelar el gasto "${gastoSeleccionado.concepto}" (${money(gastoSeleccionado.monto)})?`)) {
      gastosViaje.update(gastoSeleccionado.id, { estatus: 'Cancelado' });
    }
  }

  function seleccionarViaje(v: (typeof viajes.items)[number]) {
    setForm((f) => ({ ...f, viajeId: v.id, operadorId: f.operadorId || v.operadorId || undefined }));
  }

  // Cuando el gasto es de Combustible, el monto se calcula solo
  // (litros x precio por litro) en vez de capturarse a mano.
  function actualizarCombustible(patch: Partial<Pick<GastoViaje, 'combustibleTipo' | 'litros' | 'precioLitro'>>) {
    setForm((f) => {
      const siguiente = { ...f, ...patch };
      const litros = siguiente.litros ?? 0;
      const precioLitro = siguiente.precioLitro ?? 0;
      return { ...siguiente, monto: Math.round(litros * precioLitro * 100) / 100 };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.viajeId) {
      setError('Selecciona el viaje al que pertenece este gasto.');
      return;
    }
    if (!form.concepto.trim()) {
      setError('Captura un concepto para el gasto.');
      return;
    }
    const tipoFinal = form.tipo === 'Otro' ? tipoOtro.trim() || 'Otro' : form.tipo;
    setError('');
    const datos: Omit<GastoViaje, 'id'> = {
      ...form,
      tipo: tipoFinal,
      combustibleTipo: form.tipo === 'Combustible' ? form.combustibleTipo : undefined,
      litros: form.tipo === 'Combustible' ? form.litros : undefined,
      precioLitro: form.tipo === 'Combustible' ? form.precioLitro : undefined,
    };
    if (editing) {
      gastosViaje.update(editing.id, datos);
    } else {
      gastosViaje.add({ id: uid('gv'), ...datos });
    }
    setModalOpen(false);
  }

  function handleDelete(g: GastoViaje) {
    if (confirm(`Eliminar el gasto "${g.concepto}" (${money(g.monto)})?`)) gastosViaje.remove(g.id);
  }

  const columns: Column<GastoViaje>[] = [
    { header: 'Fecha', render: (g) => g.fecha },
    {
      header: 'Viaje',
      render: (g) => {
        const v = viajes.items.find((x) => x.id === g.viajeId);
        return (
          <div>
            <div className="font-semibold text-ink-100">{v?.folio ?? 'N/D'}</div>
            {v && <div className="text-xs text-ink-600">{nombreCliente(v.clienteId)}</div>}
          </div>
        );
      },
    },
    { header: 'Operador', render: (g) => nombreOperador(g.operadorId) || '-' },
    { header: 'Tipo', render: (g) => (g.tipo === 'Combustible' && g.combustibleTipo ? `${g.tipo} (${g.combustibleTipo})` : g.tipo) },
    { header: 'Concepto', render: (g) => g.concepto },
    { header: 'Proveedor', render: (g) => nombreProveedor(g.proveedorId) || '-' },
    {
      header: 'Monto',
      render: (g) => <span className="font-semibold text-ink-100">{money(g.monto)}</span>,
      className: 'text-right',
    },
    {
      header: 'Pasivo',
      render: (g) =>
        g.generaPasivo ? (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-500">Cuentas x pagar</span>
        ) : (
          <span className="text-ink-600">-</span>
        ),
    },
    {
      header: 'Estatus',
      render: (g) => <StatusBadge status={g.estatus} tone={g.estatus === 'Cancelado' ? 'red' : 'green'} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Gastos de Viaje"
        subtitle="Peajes, combustible, viaticos/anticipos y otros gastos capturados contra cada viaje."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por viaje, tipo, concepto o proveedor..."
        addLabel="Agregar gasto"
        onAdd={puedeCrear ? openNew : undefined}
        extra={
          <span className="rounded-lg border border-blue-400/30 bg-blue-400/5 px-3 py-2 text-sm text-ink-300">
            Total mostrado: <span className="font-semibold text-ink-100">{money(totalFiltrado)}</span>
          </span>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-line-800 bg-bg-900 p-2">
        <span className="px-2 text-xs uppercase tracking-wide text-ink-500">
          {gastoSeleccionado ? `Gasto de ${gastoSeleccionado.concepto}` : 'Selecciona un gasto de la tabla'}
        </span>
        <ToolbarButton type="button" disabled={!gastoSeleccionado} onClick={abrirConsultar}>
          <Eye size={16} /> Consultar
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!gastoSeleccionado} onClick={imprimirSeleccionado}>
          <Printer size={16} /> Imprimir
        </ToolbarButton>
        <ToolbarButton
          type="button"
          disabled={!gastoSeleccionado || !puedeEditar || gastoSeleccionado?.estatus === 'Cancelado'}
          onClick={cancelarSeleccionado}
        >
          <Ban size={16} /> Cancelar
        </ToolbarButton>
      </div>

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(g) => g.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
        emptyMessage="Sin gastos capturados todavia."
        selectedKey={seleccionadoId}
        onRowClick={(g) => setSeleccionadoId((actual) => (actual === g.id ? null : g.id))}
      />

      {modalOpen && (
        <Modal
          title={soloLectura ? 'Consultar gasto de viaje' : editing ? 'Editar gasto de viaje' : 'Agregar gasto de viaje'}
          onClose={() => setModalOpen(false)}
          wide
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="rounded-lg bg-breco-500/10 px-3 py-2 text-sm text-breco-500">{error}</p>}

            <fieldset disabled={soloLectura} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Viaje">
                  <ComboBoxCodigo
                    items={viajes.items}
                    valor={viajeSeleccionado?.folio ?? ''}
                    obtenerCodigo={(v) => v.folio}
                    obtenerEtiqueta={(v) => `${nombreCliente(v.clienteId)} · ${v.rutaDescripcion || `${v.origen} -> ${v.destino}`}`}
                    onSeleccionar={seleccionarViaje}
                    onLimpiar={() => setForm((f) => ({ ...f, viajeId: '' }))}
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
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Tipo de gasto">
                  <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                    {TIPOS_GASTO.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </Field>
                {form.tipo === 'Otro' && (
                  <Field label="Especifica el tipo">
                    <Input value={tipoOtro} onChange={(e) => setTipoOtro(e.target.value)} placeholder="Ej. Verificacion, Grua, etc." />
                  </Field>
                )}
                <Field label="Fecha">
                  <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
                </Field>
                <Field label="Numero / Referencia">
                  <Input
                    value={form.numeroReferencia}
                    onChange={(e) => setForm({ ...form, numeroReferencia: e.target.value })}
                    placeholder="Folio del ticket/recibo"
                  />
                </Field>
              </div>

              {form.tipo === 'Combustible' && (
                <div className="grid grid-cols-1 gap-4 rounded-xl border border-blue-400/30 bg-blue-400/5 p-4 sm:grid-cols-3">
                  <Field label="Combustible">
                    <Select
                      value={form.combustibleTipo ?? ''}
                      onChange={(e) => actualizarCombustible({ combustibleTipo: (e.target.value || undefined) as TipoCombustible | undefined })}
                    >
                      <option value="">Selecciona...</option>
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
                      value={form.litros ?? ''}
                      onChange={(e) => actualizarCombustible({ litros: e.target.value === '' ? undefined : Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Precio por litro">
                    <Input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={form.precioLitro ?? ''}
                      onChange={(e) => actualizarCombustible({ precioLitro: e.target.value === '' ? undefined : Number(e.target.value) })}
                    />
                  </Field>
                </div>
              )}

              <Field label="Concepto">
                <Input value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} placeholder="Descripcion del gasto" />
              </Field>

              <Field label="Proveedor">
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
                <Field label="Monto">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    readOnly={form.tipo === 'Combustible'}
                    value={form.monto}
                    onChange={(e) => setForm({ ...form, monto: Number(e.target.value) || 0 })}
                  />
                </Field>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm text-ink-300">
                    <input
                      type="checkbox"
                      checked={form.generaPasivo}
                      onChange={(e) => setForm({ ...form, generaPasivo: e.target.checked })}
                      className="h-4 w-4 rounded border-line-600 bg-bg-900 accent-breco-500"
                    />
                    Generar pasivo en cuentas por pagar
                  </label>
                </div>
              </div>

              <Field label="Notas">
                <Textarea rows={2} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
              </Field>
            </fieldset>

            <div className="flex justify-end gap-2 pt-2">
              <GhostButton type="button" onClick={() => setModalOpen(false)}>
                {soloLectura ? 'Cerrar' : 'Cancelar'}
              </GhostButton>
              {!soloLectura && <PrimaryButton type="submit">{editing ? 'Guardar cambios' : 'Agregar gasto'}</PrimaryButton>}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
