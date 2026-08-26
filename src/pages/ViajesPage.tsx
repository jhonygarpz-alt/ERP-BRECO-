import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, ScanLine } from 'lucide-react';
import { useData } from '../lib/DataContext';
import { useAuth } from '../lib/AuthContext';
import { uid } from '../lib/storage';
import type { Viaje } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { CrudTable, type Column } from '../components/ui/CrudTable';
import { Modal } from '../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select, Textarea, inputClass } from '../components/ui/form';
import { StatusBadge, TONE_DOT, TONES, type Tone } from '../components/ui/Badge';
import { ImportarProgramaModal } from '../components/viajes/ImportarProgramaModal';

const COLORES_DISPONIBLES = Object.keys(TONES) as Tone[];

function nextFolio(viajes: Viaje[]) {
  const max = viajes.reduce((acc, v) => {
    const n = Number(v.folio.split('-')[1] ?? 0);
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `V-${String(max + 1).padStart(4, '0')}`;
}

function shiftDate(date: string, dias: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function ViajesPage() {
  const { viajes, clientes, unidades, operadores, estatusViajes } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Viajes', 'crear');
  const puedeEditar = hasPermission('Viajes', 'editar');
  const puedeEliminar = hasPermission('Viajes', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [importarOpen, setImportarOpen] = useState(false);
  const [editing, setEditing] = useState<Viaje | null>(null);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [todasLasFechas, setTodasLasFechas] = useState(false);
  const [nuevoEstatusOpen, setNuevoEstatusOpen] = useState(false);
  const [nuevoEstatusNombre, setNuevoEstatusNombre] = useState('');
  const [nuevoEstatusColor, setNuevoEstatusColor] = useState<Tone>('blue');
  const [editarColorOpen, setEditarColorOpen] = useState(false);

  const emptyForm: Omit<Viaje, 'id'> = {
    folio: nextFolio(viajes.items),
    fecha: new Date().toISOString().slice(0, 10),
    clienteId: clientes.items[0]?.id ?? '',
    unidadId: unidades.items[0]?.id ?? '',
    operadorId: operadores.items[0]?.id ?? '',
    materiales: '',
    cajaNombre: '',
    cajaEconomico: '',
    origen: '',
    destino: '',
    horaSalida: '',
    horaLlegadaEstimada: '',
    cita: '',
    importacion: false,
    exportacion: false,
    estatus: 'Programado',
    observaciones: '',
  };

  const [form, setForm] = useState(emptyForm);

  const clienteNombre = (id: string) => clientes.items.find((c) => c.id === id)?.nombre ?? 'N/D';
  const unidadNombre = (id: string) => unidades.items.find((u) => u.id === id)?.economico ?? 'N/D';
  const operadorNombre = (id: string) => operadores.items.find((o) => o.id === id)?.nombre ?? 'N/D';

  const filtered = useMemo(
    () =>
      viajes.items
        .filter((v) => todasLasFechas || v.fecha === fecha)
        .filter((v) =>
          `${v.folio} ${clienteNombre(v.clienteId)} ${v.origen} ${v.destino} ${unidadNombre(v.unidadId)}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viajes.items, search, fecha, todasLasFechas, clientes.items, unidades.items],
  );

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, folio: nextFolio(viajes.items) });
    setModalOpen(true);
  }

  function openEdit(v: Viaje) {
    setEditing(v);
    setForm(v);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      viajes.update(editing.id, form);
    } else {
      viajes.add({ id: uid('via'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(v: Viaje) {
    if (confirm(`Eliminar el viaje "${v.folio}"?`)) viajes.remove(v.id);
  }

  function estatusTono(nombre: string): Tone | null {
    return (estatusViajes.items.find((e) => e.nombre === nombre)?.color as Tone | undefined) ?? null;
  }

  async function handleAgregarEstatus() {
    const nombre = nuevoEstatusNombre.trim();
    if (!nombre) return;
    const existente = estatusViajes.items.find((e) => e.nombre.toLowerCase() === nombre.toLowerCase());
    if (existente) {
      if (existente.color !== nuevoEstatusColor) {
        await estatusViajes.update(existente.id, { color: nuevoEstatusColor });
      }
    } else {
      await estatusViajes.add({ id: uid('est'), nombre, color: nuevoEstatusColor });
    }
    setForm({ ...form, estatus: nombre });
    setNuevoEstatusOpen(false);
    setNuevoEstatusNombre('');
  }

  async function handleCambiarColorActual(color: Tone) {
    const actual = estatusViajes.items.find((e) => e.nombre === form.estatus);
    if (actual) await estatusViajes.update(actual.id, { color });
    setEditarColorOpen(false);
  }

  const columns: Column<Viaje>[] = [
    {
      header: 'Folio / Fecha',
      render: (v) => (
        <div>
          <div className="font-medium text-ink-100">{v.folio}</div>
          <div className="text-xs text-ink-600">
            {v.fecha} {v.horaSalida}
          </div>
        </div>
      ),
    },
    { header: 'Unidad', render: (v) => unidadNombre(v.unidadId) },
    { header: 'Cliente', render: (v) => clienteNombre(v.clienteId) },
    { header: 'Ruta', render: (v) => `${v.origen} -> ${v.destino}` },
    {
      header: 'Materiales / Caja',
      render: (v) => (
        <div className="text-xs">
          {v.materiales || '—'}
          <br />
          {v.cajaNombre} {v.cajaEconomico}
        </div>
      ),
    },
    { header: 'Operador', render: (v) => operadorNombre(v.operadorId) },
    {
      header: 'Imp / Exp',
      render: (v) => (
        <div className="flex gap-1">
          {v.importacion && <span className="rounded border border-line-700 px-1.5 py-0.5 text-[11px] text-ink-400">IMP</span>}
          {v.exportacion && <span className="rounded border border-line-700 px-1.5 py-0.5 text-[11px] text-ink-400">EXP</span>}
        </div>
      ),
    },
    { header: 'Estatus', render: (v) => <StatusBadge status={v.estatus} tone={estatusTono(v.estatus)} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Asignacion de Viajes"
        subtitle="Asigna cliente, unidad, caja y operador a cada viaje."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por folio, unidad, cliente o ruta..."
        addLabel="Asignar viaje"
        onAdd={puedeCrear ? openNew : undefined}
        extra={
          puedeCrear && (
            <GhostButton type="button" onClick={() => setImportarOpen(true)}>
              <ScanLine size={16} />
              Importar Excel o captura
            </GhostButton>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFecha((f) => shiftDate(f, -1))}
          disabled={todasLasFechas}
          className="rounded-lg border border-line-700 bg-bg-800 p-2 text-ink-400 hover:text-ink-100 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        <input
          type="date"
          value={fecha}
          disabled={todasLasFechas}
          onChange={(e) => setFecha(e.target.value)}
          className={`${inputClass} w-44 disabled:opacity-40`}
        />
        <button
          onClick={() => setFecha((f) => shiftDate(f, 1))}
          disabled={todasLasFechas}
          className="rounded-lg border border-line-700 bg-bg-800 p-2 text-ink-400 hover:text-ink-100 disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
        <GhostButton
          type="button"
          disabled={todasLasFechas}
          onClick={() => setFecha(new Date().toISOString().slice(0, 10))}
        >
          Hoy
        </GhostButton>
        <label className="ml-2 flex items-center gap-2 text-sm text-ink-400">
          <input
            type="checkbox"
            checked={todasLasFechas}
            onChange={(e) => setTodasLasFechas(e.target.checked)}
            className="h-4 w-4 rounded border-line-600 bg-bg-900 accent-breco-500"
          />
          Ver todas las fechas
        </label>
      </div>

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(v) => v.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
      />

      {modalOpen && (
        <Modal
          title={editing ? `Editar viaje ${editing.folio}` : 'Asignar nuevo viaje'}
          subtitle="Define cliente, recursos y ruta del viaje"
          onClose={() => setModalOpen(false)}
          wide
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Folio">
              <Input required value={form.folio} onChange={(e) => setForm({ ...form, folio: e.target.value })} />
            </Field>
            <Field label="Fecha">
              <Input
                type="date"
                required
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </Field>

            <Field label="Cliente">
              <Select value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })}>
                {clientes.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Estatus">
              <div className="flex items-center gap-2">
                <Select value={form.estatus} onChange={(e) => setForm({ ...form, estatus: e.target.value })}>
                  {!estatusViajes.items.some((es) => es.nombre === form.estatus) && (
                    <option value={form.estatus}>{form.estatus}</option>
                  )}
                  {estatusViajes.items.map((es) => (
                    <option key={es.id} value={es.nombre}>
                      {es.nombre}
                    </option>
                  ))}
                </Select>
                <button
                  type="button"
                  title="Cambiar color de este estatus"
                  onClick={() => setEditarColorOpen((o) => !o)}
                  disabled={!estatusViajes.items.some((es) => es.nombre === form.estatus)}
                  className="shrink-0 rounded-lg border border-line-700 bg-bg-800 p-2 disabled:opacity-30"
                >
                  <span className={`block h-4 w-4 rounded-full ${TONE_DOT[estatusTono(form.estatus) ?? 'gray']}`} />
                </button>
                <button
                  type="button"
                  title="Agregar nuevo estatus"
                  onClick={() => {
                    setNuevoEstatusOpen(true);
                    setNuevoEstatusNombre('');
                    setNuevoEstatusColor('blue');
                  }}
                  className="shrink-0 rounded-lg border border-line-700 bg-bg-800 p-2 text-ink-400 hover:text-ink-100"
                >
                  <Plus size={16} />
                </button>
              </div>
              {editarColorOpen && (
                <div className="mt-2 flex items-center gap-2">
                  {COLORES_DISPONIBLES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      title={c}
                      onClick={() => handleCambiarColorActual(c)}
                      className={`h-6 w-6 rounded-full ${TONE_DOT[c]} ${
                        estatusTono(form.estatus) === c ? 'ring-2 ring-offset-2 ring-offset-bg-900 ring-white' : ''
                      }`}
                    />
                  ))}
                </div>
              )}
              {nuevoEstatusOpen && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      autoFocus
                      placeholder="Nombre del nuevo estatus"
                      value={nuevoEstatusNombre}
                      onChange={(e) => setNuevoEstatusNombre(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAgregarEstatus();
                        }
                      }}
                    />
                    <GhostButton type="button" onClick={handleAgregarEstatus}>
                      Guardar
                    </GhostButton>
                    <GhostButton type="button" onClick={() => setNuevoEstatusOpen(false)}>
                      Cancelar
                    </GhostButton>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-500">Color:</span>
                    {COLORES_DISPONIBLES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        title={c}
                        onClick={() => setNuevoEstatusColor(c)}
                        className={`h-6 w-6 rounded-full ${TONE_DOT[c]} ${
                          nuevoEstatusColor === c ? 'ring-2 ring-offset-2 ring-offset-bg-900 ring-white' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </Field>

            <Field label="Unidad">
              <Select value={form.unidadId} onChange={(e) => setForm({ ...form, unidadId: e.target.value })}>
                {unidades.items.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.economico} ({u.estatus})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Operador">
              <Select value={form.operadorId} onChange={(e) => setForm({ ...form, operadorId: e.target.value })}>
                {operadores.items.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nombre} ({o.estatus})
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Materiales">
              <Input
                placeholder="Ej. Autopartes, PVC, Vacio..."
                value={form.materiales}
                onChange={(e) => setForm({ ...form, materiales: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Caja">
                <Input
                  placeholder="Ej. WERNER"
                  value={form.cajaNombre}
                  onChange={(e) => setForm({ ...form, cajaNombre: e.target.value })}
                />
              </Field>
              <Field label="Economico de caja">
                <Input
                  placeholder="Ej. 45530"
                  value={form.cajaEconomico}
                  onChange={(e) => setForm({ ...form, cajaEconomico: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Origen">
              <Input required value={form.origen} onChange={(e) => setForm({ ...form, origen: e.target.value })} />
            </Field>
            <Field label="Destino">
              <Input required value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} />
            </Field>
            <Field label="Hora de salida">
              <Input
                type="time"
                value={form.horaSalida}
                onChange={(e) => setForm({ ...form, horaSalida: e.target.value })}
              />
            </Field>
            <Field label="Cita">
              <Input
                type="time"
                value={form.cita}
                onChange={(e) => setForm({ ...form, cita: e.target.value })}
              />
            </Field>

            <div className="flex items-center gap-6 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-ink-300">
                <input
                  type="checkbox"
                  checked={form.importacion}
                  onChange={(e) => setForm({ ...form, importacion: e.target.checked })}
                  className="h-4 w-4 rounded border-line-600 bg-bg-900 accent-breco-500"
                />
                Importacion
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-300">
                <input
                  type="checkbox"
                  checked={form.exportacion}
                  onChange={(e) => setForm({ ...form, exportacion: e.target.checked })}
                  className="h-4 w-4 rounded border-line-600 bg-bg-900 accent-breco-500"
                />
                Exportacion
              </label>
            </div>

            <div className="sm:col-span-2">
              <Field label="Observaciones">
                <Textarea
                  rows={3}
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                />
              </Field>
            </div>

            <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
              <GhostButton type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit">{editing ? 'Guardar cambios' : 'Asignar viaje'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {importarOpen && <ImportarProgramaModal onClose={() => setImportarOpen(false)} />}
    </div>
  );
}
