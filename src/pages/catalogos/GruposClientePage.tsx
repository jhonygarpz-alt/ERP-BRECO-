import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import type { GrupoCliente } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton } from '../../components/ui/form';
import { StatusBadge, TONE_DOT, TONES, type Tone } from '../../components/ui/Badge';

const COLORES_DISPONIBLES = Object.keys(TONES) as Tone[];

const emptyForm: Omit<GrupoCliente, 'id'> = {
  codigo: '',
  nombre: '',
  color: 'gray',
};

export function GruposClientePage() {
  const { gruposCliente } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Catalogos', 'crear');
  const puedeEditar = hasPermission('Catalogos', 'editar');
  const puedeEliminar = hasPermission('Catalogos', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GrupoCliente | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const filtered = useMemo(
    () =>
      gruposCliente.items.filter(
        (g) => g.nombre.toLowerCase().includes(search.toLowerCase()) || g.codigo.toLowerCase().includes(search.toLowerCase()),
      ),
    [gruposCliente.items, search],
  );

  function siguienteCodigo(): string {
    const numeros = gruposCliente.items.map((g) => parseInt(g.codigo, 10)).filter((n) => !Number.isNaN(n));
    return String((numeros.length ? Math.max(...numeros) : 0) + 1);
  }

  function buscarDuplicado(): string | null {
    const codigo = form.codigo.trim();
    const nombre = form.nombre.trim();
    const otros = gruposCliente.items.filter((g) => g.id !== editing?.id);
    if (codigo && otros.some((g) => g.codigo.trim() === codigo)) {
      return `Ya existe un grupo con el codigo "${codigo}".`;
    }
    if (nombre && otros.some((g) => g.nombre.toLowerCase() === nombre.toLowerCase())) {
      return `Ya existe un grupo llamado "${nombre}".`;
    }
    return null;
  }

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, codigo: siguienteCodigo() });
    setError('');
    setModalOpen(true);
  }

  function openEdit(g: GrupoCliente) {
    setEditing(g);
    setForm(g);
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
      gruposCliente.update(editing.id, form);
    } else {
      gruposCliente.add({ id: uid('grc'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(g: GrupoCliente) {
    if (confirm(`Eliminar el grupo "${g.nombre}"?`)) gruposCliente.remove(g.id);
  }

  const columns: Column<GrupoCliente>[] = [
    { header: 'Codigo', render: (g) => g.codigo },
    { header: 'Grupo de Clientes', render: (g) => <StatusBadge status={g.nombre} tone={g.color as Tone} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Grupos de Clientes"
        subtitle="Grupos disponibles para clasificar y agrupar clientes."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar grupo..."
        addLabel="Agregar"
        onAdd={puedeCrear ? openNew : undefined}
      />

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(g) => g.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
        emptyMessage="No hay grupos registrados."
      />

      {modalOpen && (
        <Modal title={editing ? 'Editando Grupo de Clientes' : 'Agregando Grupo de Clientes'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Codigo">
              <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
            </Field>

            <Field label="Grupo de Clientes">
              <Input required autoFocus value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </Field>

            <div>
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-ink-500">Color</span>
              <div className="flex flex-wrap items-center gap-2">
                {COLORES_DISPONIBLES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`h-7 w-7 rounded-full ${TONE_DOT[c]} ${
                      form.color === c ? 'ring-2 ring-offset-2 ring-offset-bg-900 ring-white' : ''
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-line-800 pt-4">
              {error && <p className="flex-1 text-sm text-breco-500">{error}</p>}
              <GhostButton type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit">Aceptar</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
