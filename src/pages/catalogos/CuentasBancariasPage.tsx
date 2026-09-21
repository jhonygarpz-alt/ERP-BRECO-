import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import { BANCOS_MEXICO } from '../../lib/bancosMexico';
import type { CuentaBancaria } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const emptyForm: Omit<CuentaBancaria, 'id'> = {
  numero: '',
  activa: true,
  descripcion: '',
  contabilizar: true,
  banco: BANCOS_MEXICO[0],
  moneda: 'MXN',
};

export function CuentasBancariasPage() {
  const { cuentasBancarias } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Catalogos', 'crear');
  const puedeEditar = hasPermission('Catalogos', 'editar');
  const puedeEliminar = hasPermission('Catalogos', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CuentaBancaria | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const filtered = useMemo(
    () =>
      cuentasBancarias.items.filter((c) =>
        `${c.numero} ${c.descripcion} ${c.banco}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [cuentasBancarias.items, search],
  );

  /** El numero de cuenta (dato obligatorio) no se puede repetir dentro de la misma empresa. */
  function buscarDuplicado(): string | null {
    const numero = form.numero.trim();
    const otras = cuentasBancarias.items.filter((c) => c.id !== editing?.id);
    if (numero && otras.some((c) => c.numero.trim() === numero)) return `Ya existe una cuenta con el numero ${numero}.`;
    return null;
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(c: CuentaBancaria) {
    setEditing(c);
    setForm(c);
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
      cuentasBancarias.update(editing.id, form);
    } else {
      cuentasBancarias.add({ id: uid('cta'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(c: CuentaBancaria) {
    if (confirm(`Eliminar la cuenta "${c.numero}"?`)) cuentasBancarias.remove(c.id);
  }

  const columns: Column<CuentaBancaria>[] = [
    { header: 'Número de cuenta', render: (c) => <span className="font-medium text-ink-100">{c.numero}</span> },
    { header: 'Descripción Cuenta', render: (c) => c.descripcion },
    { header: 'Banco', render: (c) => c.banco },
    { header: 'Moneda', render: (c) => (c.moneda === 'MXN' ? 'Pesos' : 'Dólares') },
    {
      header: 'Activa',
      render: (c) => <StatusBadge status={c.activa ? 'Si' : 'No'} tone={c.activa ? 'green' : 'red'} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Cuentas Bancarias"
        subtitle="Cuentas bancarias de la empresa."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por numero, descripcion o banco..."
        addLabel="Agregar"
        onAdd={puedeCrear ? openNew : undefined}
      />

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(c) => c.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
      />

      {modalOpen && (
        <Modal title={editing ? 'Editando cuenta bancaria' : 'Agregando cuenta bancaria'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 flex items-end gap-3">
              <div className="flex-1">
                <Field label="Número de cuenta">
                  <Input required value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
                </Field>
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm text-ink-300">
                <input type="checkbox" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })} />
                Activa
              </label>
            </div>
            <div className="sm:col-span-2 flex items-end gap-3">
              <div className="flex-1">
                <Field label="Descripción Cuenta">
                  <Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
                </Field>
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm text-ink-300">
                <input
                  type="checkbox"
                  checked={form.contabilizar}
                  onChange={(e) => setForm({ ...form, contabilizar: e.target.checked })}
                />
                Contabilizar
              </label>
            </div>
            <Field label="Banco">
              <Select value={form.banco} onChange={(e) => setForm({ ...form, banco: e.target.value })}>
                {BANCOS_MEXICO.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </Select>
            </Field>
            <Field label="Moneda">
              <Select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value as CuentaBancaria['moneda'] })}>
                <option value="MXN">Pesos</option>
                <option value="USD">Dólares</option>
              </Select>
            </Field>

            <div className="mt-2 flex items-center justify-end gap-3 sm:col-span-2">
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
