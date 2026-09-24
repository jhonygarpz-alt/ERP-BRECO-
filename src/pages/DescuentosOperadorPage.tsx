import { useMemo, useState } from 'react';
import { Ban, HandCoins, Plus } from 'lucide-react';
import { useData } from '../lib/DataContext';
import { useAuth } from '../lib/AuthContext';
import { uid } from '../lib/storage';
import { hoyISO } from '../lib/fechas';
import { importeDescontado, saldoDescuento, siguienteFolioDescuento, siguienteNumeroDeduccion } from '../lib/descuentosOperador';
import type { AbonoDescuentoOperador, DeduccionOperador, DescuentoOperador } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { CrudTable, type Column } from '../components/ui/CrudTable';
import { Modal } from '../components/ui/Modal';
import { ComboBoxCodigo } from '../components/ui/ComboBoxCodigo';
import { Field, GhostButton, Input, PrimaryButton, Select, Textarea, ToolbarButton } from '../components/ui/form';
import { StatusBadge } from '../components/ui/Badge';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

const emptyForm: Omit<DescuentoOperador, 'id' | 'creadoEn'> = {
  folio: '',
  descontarAPartir: hoyISO(),
  operadorId: '',
  deduccionId: '',
  tipoDescuento: 'Permanente',
  formaDescontar: 'Dinero',
  importePorLiquidacion: 0,
  moneda: 'MXN',
  importeTotalADescontar: 0,
  observaciones: '',
  estatus: 'Activo',
};

export function DescuentosOperadorPage() {
  const { descuentosOperador, abonosDescuentoOperador, deduccionesOperador, operadores } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Viajes', 'crear');
  const puedeEditar = hasPermission('Viajes', 'editar');
  const puedeEliminar = hasPermission('Viajes', 'eliminar');

  const [search, setSearch] = useState('');
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DescuentoOperador | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [abonoOpen, setAbonoOpen] = useState(false);
  const [catalogoOpen, setCatalogoOpen] = useState(false);

  const operadorSeleccionado = operadores.items.find((o) => o.id === form.operadorId);
  const deduccionSeleccionada = deduccionesOperador.items.find((d) => d.id === form.deduccionId);
  const descuentoSeleccionado = descuentosOperador.items.find((d) => d.id === seleccionadoId) ?? null;

  function nombreOperador(id: string) {
    return operadores.items.find((o) => o.id === id)?.nombre ?? 'N/D';
  }
  function nombreDeduccion(id: string) {
    const d = deduccionesOperador.items.find((x) => x.id === id);
    return d ? `${d.numero} ${d.nombre}` : 'N/D';
  }

  const filtered = useMemo(() => {
    const termino = search.toLowerCase();
    return descuentosOperador.items
      .filter(
        (d) =>
          !termino ||
          d.folio.toLowerCase().includes(termino) ||
          nombreOperador(d.operadorId).toLowerCase().includes(termino) ||
          nombreDeduccion(d.deduccionId).toLowerCase().includes(termino),
      )
      .slice()
      .sort((a, b) => b.folio.localeCompare(a.folio));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descuentosOperador.items, search, operadores.items, deduccionesOperador.items]);

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, folio: siguienteFolioDescuento(descuentosOperador.items) });
    setError('');
    setModalOpen(true);
  }

  function openEdit(d: DescuentoOperador) {
    setEditing(d);
    setForm(d);
    setError('');
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.operadorId) {
      setError('Selecciona el operador al que se le va a aplicar el descuento.');
      return;
    }
    if (!form.deduccionId) {
      setError('Selecciona la deduccion (o agrega una nueva en el catalogo).');
      return;
    }
    if (!form.importePorLiquidacion) {
      setError('Captura el importe (o porcentaje) a descontar por liquidacion.');
      return;
    }
    setError('');
    if (editing) {
      descuentosOperador.update(editing.id, form);
    } else {
      descuentosOperador.add({ id: uid('do'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(d: DescuentoOperador) {
    const tieneAbonos = abonosDescuentoOperador.items.some((a) => a.descuentoOperadorId === d.id);
    if (tieneAbonos) {
      alert('No se puede eliminar un descuento que ya tiene abonos aplicados. Cancelalo en su lugar.');
      return;
    }
    if (confirm(`Eliminar el descuento ${d.folio} de ${nombreOperador(d.operadorId)}?`)) descuentosOperador.remove(d.id);
  }

  function cancelarSeleccionado() {
    if (!descuentoSeleccionado) return;
    if (confirm(`Cancelar el descuento ${descuentoSeleccionado.folio} de ${nombreOperador(descuentoSeleccionado.operadorId)}?`)) {
      descuentosOperador.update(descuentoSeleccionado.id, { estatus: 'Cancelado' });
    }
  }

  const columns: Column<DescuentoOperador>[] = [
    { header: 'Folio', render: (d) => d.folio },
    { header: 'Operador', render: (d) => nombreOperador(d.operadorId) },
    { header: 'Deduccion', render: (d) => nombreDeduccion(d.deduccionId) },
    { header: 'Tipo', render: (d) => d.tipoDescuento },
    {
      header: 'Importe/Liq.',
      render: (d) => (d.formaDescontar === 'Porcentaje' ? `${d.importePorLiquidacion}%` : money(d.importePorLiquidacion)),
    },
    {
      header: 'Descontado',
      render: (d) => money(importeDescontado(d.id, abonosDescuentoOperador.items)),
    },
    {
      header: 'Saldo',
      render: (d) => {
        const saldo = saldoDescuento(d, abonosDescuentoOperador.items);
        return saldo === null ? 'Sin tope' : money(saldo);
      },
    },
    {
      header: 'Estatus',
      render: (d) => <StatusBadge status={d.estatus} tone={d.estatus === 'Cancelado' ? 'red' : 'green'} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Descuentos a Operador"
        subtitle="Prestamos y otras deducciones que se le van a descontar a un operador, con sus abonos."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por folio, operador o deduccion..."
        addLabel="Agregar descuento"
        onAdd={puedeCrear ? openNew : undefined}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-line-800 bg-bg-900 p-2">
        <span className="px-2 text-xs uppercase tracking-wide text-ink-500">
          {descuentoSeleccionado ? `Descuento ${descuentoSeleccionado.folio}` : 'Selecciona un descuento de la tabla'}
        </span>
        <ToolbarButton
          type="button"
          disabled={!descuentoSeleccionado || descuentoSeleccionado?.estatus === 'Cancelado'}
          onClick={() => setAbonoOpen(true)}
        >
          <HandCoins size={16} /> Abonos
        </ToolbarButton>
        <ToolbarButton
          type="button"
          disabled={!descuentoSeleccionado || !puedeEditar || descuentoSeleccionado?.estatus === 'Cancelado'}
          onClick={cancelarSeleccionado}
        >
          <Ban size={16} /> Cancelar
        </ToolbarButton>
      </div>

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(d) => d.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
        emptyMessage="Sin descuentos capturados todavia."
        selectedKey={seleccionadoId}
        onRowClick={(d) => setSeleccionadoId((actual) => (actual === d.id ? null : d.id))}
      />

      {modalOpen && (
        <Modal title={editing ? 'Editar descuento a operador' : 'Agregar descuento a operador'} onClose={() => setModalOpen(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="rounded-lg bg-breco-500/10 px-3 py-2 text-sm text-breco-500">{error}</p>}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Folio">
                <Input value={form.folio} readOnly />
              </Field>
              <Field label="Descontar a partir">
                <Input type="date" value={form.descontarAPartir} onChange={(e) => setForm({ ...form, descontarAPartir: e.target.value })} />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Operador" required>
                <ComboBoxCodigo
                  items={operadores.items}
                  valor={operadorSeleccionado?.numero ?? ''}
                  obtenerCodigo={(o) => o.numero}
                  obtenerEtiqueta={(o) => o.nombre}
                  onSeleccionar={(o) => setForm((f) => ({ ...f, operadorId: o.id }))}
                  onLimpiar={() => setForm((f) => ({ ...f, operadorId: '' }))}
                  placeholder="Numero de operador"
                />
              </Field>
              <Field label="Deduccion" required>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <ComboBoxCodigo
                      items={deduccionesOperador.items.filter((d) => d.activa)}
                      valor={deduccionSeleccionada?.numero ?? ''}
                      obtenerCodigo={(d) => d.numero}
                      obtenerEtiqueta={(d) => d.nombre}
                      onSeleccionar={(d) => setForm((f) => ({ ...f, deduccionId: d.id }))}
                      onLimpiar={() => setForm((f) => ({ ...f, deduccionId: '' }))}
                      placeholder="Numero de deduccion"
                    />
                  </div>
                  <GhostButton type="button" onClick={() => setCatalogoOpen(true)} title="Catalogo de deducciones">
                    <Plus size={16} />
                  </GhostButton>
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Tipo Descuento">
                <Select
                  value={form.tipoDescuento}
                  onChange={(e) => setForm({ ...form, tipoDescuento: e.target.value as DescuentoOperador['tipoDescuento'] })}
                >
                  <option value="Permanente">PERMANENTE</option>
                  <option value="Otros Descuentos">OTROS DESCUENTOS</option>
                </Select>
              </Field>
              <Field label="Forma Descontar">
                <Select
                  value={form.formaDescontar}
                  onChange={(e) => setForm({ ...form, formaDescontar: e.target.value as DescuentoOperador['formaDescontar'] })}
                >
                  <option value="Dinero">DINERO</option>
                  <option value="Porcentaje">PORCENTAJE</option>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-xl border border-line-800 bg-bg-900 p-4 sm:grid-cols-3">
              <Field label={form.formaDescontar === 'Porcentaje' ? 'Porcentaje x descontar x liq.' : 'Importe x descontar x liq.'}>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.importePorLiquidacion}
                  onChange={(e) => setForm({ ...form, importePorLiquidacion: Number(e.target.value) || 0 })}
                />
              </Field>
              {form.formaDescontar === 'Dinero' && (
                <Field label="Moneda">
                  <Select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value as DescuentoOperador['moneda'] })}>
                    <option value="MXN">PESOS</option>
                    <option value="USD">DOLARES</option>
                  </Select>
                </Field>
              )}
              <Field label="Importe total a descontar (0 = sin tope)">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.importeTotalADescontar}
                  onChange={(e) => setForm({ ...form, importeTotalADescontar: Number(e.target.value) || 0 })}
                />
              </Field>
            </div>

            <Field label="Observaciones">
              <Textarea rows={2} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <GhostButton type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit">Aceptar</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {abonoOpen && descuentoSeleccionado && (
        <AbonarDescuentoModal
          descuento={descuentoSeleccionado}
          onClose={() => setAbonoOpen(false)}
          nombreOperador={nombreOperador(descuentoSeleccionado.operadorId)}
          nombreDeduccion={nombreDeduccion(descuentoSeleccionado.deduccionId)}
        />
      )}

      {catalogoOpen && <CatalogoDeduccionesModal onClose={() => setCatalogoOpen(false)} />}
    </div>
  );
}

function AbonarDescuentoModal({
  descuento,
  onClose,
  nombreOperador,
  nombreDeduccion,
}: {
  descuento: DescuentoOperador;
  onClose: () => void;
  nombreOperador: string;
  nombreDeduccion: string;
}) {
  const { abonosDescuentoOperador } = useData();
  const [fecha, setFecha] = useState(hoyISO());
  const [abono, setAbono] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [verDetalle, setVerDetalle] = useState(false);

  const historial = abonosDescuentoOperador.items
    .filter((a) => a.descuentoOperadorId === descuento.id)
    .slice()
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const descontadoActual = importeDescontado(descuento.id, abonosDescuentoOperador.items);
  const saldoActual = saldoDescuento(descuento, abonosDescuentoOperador.items);

  function agregarAbono() {
    const monto = Number(abono) || 0;
    if (monto <= 0) return;
    const nuevo: AbonoDescuentoOperador = {
      id: uid('ado'),
      descuentoOperadorId: descuento.id,
      fecha,
      monto,
      observaciones,
    };
    abonosDescuentoOperador.add(nuevo);
    setAbono('');
    setObservaciones('');
  }

  return (
    <Modal title="Abonar descuentos a operador" onClose={onClose} wide>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-line-800 bg-bg-900 p-4 sm:grid-cols-3">
          <Field label="Folio">
            <Input value={descuento.folio} readOnly />
          </Field>
          <Field label="Descontar a partir">
            <Input value={descuento.descontarAPartir} readOnly />
          </Field>
          <Field label="Operador">
            <Input value={nombreOperador} readOnly />
          </Field>
          <Field label="Deduccion">
            <Input value={nombreDeduccion} readOnly />
          </Field>
          <Field label="Tipo Descuento">
            <Input value={descuento.tipoDescuento} readOnly />
          </Field>
          <Field label="Forma Descontar">
            <Input value={descuento.formaDescontar} readOnly />
          </Field>
          <Field label={descuento.formaDescontar === 'Porcentaje' ? 'Porcentaje x descontar x liq.' : 'Importe x descontar x liq.'}>
            <Input value={descuento.formaDescontar === 'Porcentaje' ? `${descuento.importePorLiquidacion}%` : money(descuento.importePorLiquidacion)} readOnly />
          </Field>
          <Field label="Importe descontado">
            <Input value={money(descontadoActual)} readOnly />
          </Field>
          <Field label="Saldo">
            <Input value={saldoActual === null ? 'Sin tope' : money(saldoActual)} readOnly />
          </Field>
        </div>

        <div className="rounded-xl border border-line-800 bg-bg-900 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-500">Informacion del Abono</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Fecha">
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </Field>
            <Field label="Abono">
              <Input type="number" step="0.01" min="0" value={abono} onChange={(e) => setAbono(e.target.value)} />
            </Field>
            <div className="flex items-end gap-2 pb-1">
              <PrimaryButton type="button" onClick={agregarAbono}>
                Agregar
              </PrimaryButton>
              <GhostButton type="button" onClick={() => setVerDetalle((v) => !v)}>
                Detalle del Descuento
              </GhostButton>
            </div>
          </div>
          <div className="mt-3">
            <Field label="Observaciones">
              <Textarea rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </Field>
          </div>
        </div>

        {verDetalle && (
          <div className="rounded-xl border border-line-800 bg-bg-900 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-500">Abonos aplicados</p>
            {historial.length === 0 ? (
              <p className="text-sm text-ink-600">Sin abonos capturados todavia.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase text-ink-500">
                    <th className="py-1">Fecha</th>
                    <th className="py-1">Monto</th>
                    <th className="py-1">Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((a) => (
                    <tr key={a.id} className="border-t border-line-800/70">
                      <td className="py-1">{a.fecha}</td>
                      <td className="py-1">{money(a.monto)}</td>
                      <td className="py-1 text-ink-400">{a.observaciones || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <GhostButton type="button" onClick={onClose}>
            Salir
          </GhostButton>
        </div>
      </div>
    </Modal>
  );
}

function CatalogoDeduccionesModal({ onClose }: { onClose: () => void }) {
  const { deduccionesOperador } = useData();
  const [editing, setEditing] = useState<DeduccionOperador | null>(null);
  const [numero, setNumero] = useState('');
  const [nombre, setNombre] = useState('');

  function nuevo() {
    setEditing(null);
    setNumero(siguienteNumeroDeduccion(deduccionesOperador.items));
    setNombre('');
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    if (editing) {
      deduccionesOperador.update(editing.id, { numero, nombre: nombre.trim().toUpperCase() });
    } else {
      deduccionesOperador.add({ id: uid('ded'), numero, nombre: nombre.trim().toUpperCase(), activa: true });
    }
    setEditing(null);
    setNumero(siguienteNumeroDeduccion(deduccionesOperador.items));
    setNombre('');
  }

  function editar(d: DeduccionOperador) {
    setEditing(d);
    setNumero(d.numero);
    setNombre(d.nombre);
  }

  function eliminar(d: DeduccionOperador) {
    if (confirm(`Eliminar la deduccion "${d.nombre}"?`)) deduccionesOperador.remove(d.id);
  }

  return (
    <Modal title="Catalogo de Deducciones" onClose={onClose}>
      <div className="space-y-4">
        <form onSubmit={guardar} className="grid grid-cols-1 gap-3 sm:grid-cols-[100px_1fr_auto]">
          <Field label="Numero">
            <Input value={numero} onChange={(e) => setNumero(e.target.value)} />
          </Field>
          <Field label="Nombre">
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. PRESTAMO, UNIFORME, HERRAMIENTA" autoFocus />
          </Field>
          <div className="flex items-end gap-2 pb-1">
            <PrimaryButton type="submit">{editing ? 'Guardar' : 'Agregar'}</PrimaryButton>
            {editing && (
              <GhostButton type="button" onClick={nuevo}>
                Cancelar
              </GhostButton>
            )}
          </div>
        </form>

        <div className="max-h-80 overflow-y-auto rounded-xl border border-line-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-900 text-xs uppercase text-ink-500">
              <tr>
                <th className="px-3 py-2">Numero</th>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Activa</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {deduccionesOperador.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-ink-600">
                    Sin deducciones registradas.
                  </td>
                </tr>
              ) : (
                deduccionesOperador.items.map((d) => (
                  <tr key={d.id} className="border-t border-line-800/70">
                    <td className="px-3 py-2">{d.numero}</td>
                    <td className="px-3 py-2">{d.nombre}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={d.activa ? 'Si' : 'No'} tone={d.activa ? 'green' : 'red'} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button type="button" className="text-xs text-ink-400 hover:text-ink-100" onClick={() => editar(d)}>
                        Editar
                      </button>
                      <button type="button" className="ml-3 text-xs text-breco-500 hover:text-breco-400" onClick={() => eliminar(d)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2">
          <GhostButton type="button" onClick={onClose}>
            Cerrar
          </GhostButton>
        </div>
      </div>
    </Modal>
  );
}
