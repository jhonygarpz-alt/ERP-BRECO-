import { useEffect, useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { useColoniasPorCP } from '../../lib/useColoniasPorCP';
import { uid } from '../../lib/storage';
import type { Destinatario } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const ESTADOS_MEXICO = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
  'Ciudad de México', 'Coahuila de Zaragoza', 'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo',
  'Jalisco', 'México', 'Michoacán de Ocampo', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla',
  'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala',
  'Veracruz de Ignacio de la Llave', 'Yucatán', 'Zacatecas',
];

const emptyForm: Omit<Destinatario, 'id'> = {
  numero: '',
  rfc: '',
  noEquivalencia: '',
  nombre: '',
  estatus: 'activo',
  esPatio: false,
  clienteId: undefined,
  pais: 'Mexico',
  estado: '',
  municipio: '',
  cp: '',
  localidad: '',
  colonia: '',
  calle: '',
  numeroExterior: '',
  numeroInterior: '',
  telefono: '',
  contacto: '',
  correo: '',
};

export function DestinatariosPage() {
  const { destinatarios, clientes } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Catalogos', 'crear');
  const puedeEditar = hasPermission('Catalogos', 'editar');
  const puedeEliminar = hasPermission('Catalogos', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Destinatario | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const coloniasSugeridas = useColoniasPorCP(form.cp);

  /** El numero (dato obligatorio) no se puede repetir dentro de la misma empresa; el RFC si puede repetirse a proposito (varias ubicaciones del mismo cliente). */
  function buscarDuplicado(): string | null {
    const numero = form.numero.trim();
    const otros = destinatarios.items.filter((d) => d.id !== editing?.id);
    if (numero && otros.some((d) => d.numero === numero)) return `Ya existe un remitente-destinatario con el numero ${numero}.`;
    return null;
  }

  useEffect(() => {
    if (coloniasSugeridas.length > 0) {
      setForm((f) => ({ ...f, estado: coloniasSugeridas[0].estado, municipio: coloniasSugeridas[0].municipio }));
    }
  }, [coloniasSugeridas]);

  const clientePorId = useMemo(() => new Map(clientes.items.map((c) => [c.id, c])), [clientes.items]);

  const filtered = useMemo(
    () =>
      destinatarios.items.filter((d) =>
        `${d.nombre} ${d.rfc} ${d.numero}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [destinatarios.items, search],
  );

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(d: Destinatario) {
    setEditing(d);
    setForm(d);
    setError('');
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const duplicado = buscarDuplicado();
    if (duplicado) {
      setError(duplicado);
      return;
    }
    setError('');
    if (editing) {
      destinatarios.update(editing.id, form);
    } else {
      destinatarios.add({ id: uid('dest'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(d: Destinatario) {
    if (confirm(`Eliminar a "${d.nombre}"?`)) destinatarios.remove(d.id);
  }

  const columns: Column<Destinatario>[] = [
    { header: 'Número', render: (d) => <span className="font-mono text-xs text-ink-500">{d.numero}</span> },
    { header: 'RFC', render: (d) => d.rfc },
    { header: 'Remitente-Destinatario', render: (d) => <span className="font-medium text-ink-100">{d.nombre}</span> },
    {
      header: 'Activo',
      render: (d) => <StatusBadge status={d.estatus === 'activo' ? 'Si' : 'No'} tone={d.estatus === 'activo' ? 'green' : 'red'} />,
    },
    { header: 'Nro Cliente', render: (d) => (d.clienteId ? clientePorId.get(d.clienteId)?.numeroCliente ?? '' : '') },
    { header: 'Cliente', render: (d) => (d.clienteId ? clientePorId.get(d.clienteId)?.nombre ?? '' : '') },
  ];

  return (
    <div>
      <PageHeader
        title="Destinatarios"
        subtitle="Remitentes y destinatarios: origenes/destinos usados en los viajes, ligados o no a un cliente."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por numero, nombre o RFC..."
        addLabel="Agregar"
        onAdd={puedeCrear ? openNew : undefined}
      />

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(d) => d.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
      />

      {modalOpen && (
        <Modal title={editing ? 'Editando Remitente-Destinatario' : 'Agregando Remitente-Destinatario'} onClose={() => setModalOpen(false)} wide="xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Número">
                <Input
                  value={form.numero}
                  placeholder="Dejar en blanco para autoasignar"
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                />
              </Field>
              <Field label="RFC">
                <Input required value={form.rfc} onChange={(e) => setForm({ ...form, rfc: e.target.value.toUpperCase() })} />
              </Field>
              <Field label="No. Equivalencia">
                <Input value={form.noEquivalencia} onChange={(e) => setForm({ ...form, noEquivalencia: e.target.value })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Nombre">
                  <Input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                </Field>
              </div>
              <Field label="Cliente">
                <Select
                  value={form.clienteId ?? ''}
                  onChange={(e) => setForm({ ...form, clienteId: e.target.value || undefined })}
                >
                  <option value="">Sin cliente asignado</option>
                  {clientes.items.map((c) => (
                    <option key={c.id} value={c.id}>{c.numeroCliente} - {c.nombre}</option>
                  ))}
                </Select>
              </Field>
              <div className="flex flex-wrap items-center gap-5 sm:col-span-3">
                <label className="flex items-center gap-2 text-sm text-ink-300">
                  <input
                    type="checkbox"
                    checked={form.estatus === 'activo'}
                    onChange={(e) => setForm({ ...form, estatus: e.target.checked ? 'activo' : 'inactivo' })}
                  />
                  Activo
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-300">
                  <input
                    type="checkbox"
                    checked={form.esPatio}
                    onChange={(e) => setForm({ ...form, esPatio: e.target.checked })}
                  />
                  Es Patio
                </label>
              </div>
            </div>

            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-breco-500">Domicilio Fiscal</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="País">
                  <Input required value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })} />
                </Field>
                <Field label="Estado">
                  <Select required value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                    <option value="">Selecciona...</option>
                    {ESTADOS_MEXICO.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Municipio">
                  <Input value={form.municipio} onChange={(e) => setForm({ ...form, municipio: e.target.value })} />
                </Field>
                <Field label="Código Postal">
                  <Input
                    value={form.cp}
                    maxLength={5}
                    onChange={(e) => setForm({ ...form, cp: e.target.value.replace(/\D/g, '') })}
                  />
                </Field>
                <Field label="Localidad">
                  <Input value={form.localidad} onChange={(e) => setForm({ ...form, localidad: e.target.value })} />
                </Field>
                <Field label="Colonia">
                  {coloniasSugeridas.length > 0 ? (
                    <Select value={form.colonia} onChange={(e) => setForm({ ...form, colonia: e.target.value })}>
                      <option value="">Selecciona...</option>
                      {coloniasSugeridas.map((c) => (
                        <option key={c.colonia} value={c.colonia}>{c.colonia}</option>
                      ))}
                    </Select>
                  ) : (
                    <Input value={form.colonia} onChange={(e) => setForm({ ...form, colonia: e.target.value })} />
                  )}
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Calle">
                    <Input value={form.calle} onChange={(e) => setForm({ ...form, calle: e.target.value })} />
                  </Field>
                </div>
                <Field label="No. Exterior">
                  <Input value={form.numeroExterior} onChange={(e) => setForm({ ...form, numeroExterior: e.target.value })} />
                </Field>
                <Field label="No. Interior">
                  <Input value={form.numeroInterior} onChange={(e) => setForm({ ...form, numeroInterior: e.target.value })} />
                </Field>
                <Field label="Teléfono">
                  <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
                </Field>
                <Field label="Contacto">
                  <Input value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} />
                </Field>
                <Field label="Correo">
                  <Input type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
                </Field>
              </div>
              <p className="mt-3 text-xs text-ink-600">
                * Domicilio requerido para la elaboracion del complemento Carta Porte.
              </p>
            </section>

            <div className="flex items-center justify-end gap-3 border-t border-line-800 pt-4">
              {error && <p className="flex-1 text-sm text-breco-500">{error}</p>}
              <GhostButton type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit">{editing ? 'Guardar cambios' : 'Aceptar'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
