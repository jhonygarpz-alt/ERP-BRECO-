import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import type { TipoMovimientoAlmacen } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select, ToolbarButton } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const emptyForm: Omit<TipoMovimientoAlmacen, 'id'> = { codigo: '', nombre: '', naturaleza: 'Entrada', activo: true };

const SUGERIDOS: Omit<TipoMovimientoAlmacen, 'id'>[] = [
  { codigo: 'ENT-AJUSTE', nombre: 'Entrada por Ajuste de Inventario', naturaleza: 'Entrada', activo: true },
  { codigo: 'ENT-INICIAL', nombre: 'Entrada por Inventario Inicial', naturaleza: 'Entrada', activo: true },
  { codigo: 'ENT-CONSIGNACION', nombre: 'Entrada para Consignacion', naturaleza: 'Entrada', activo: true },
  { codigo: 'ENT-DEVOLUCION', nombre: 'Entrada por Devolucion', naturaleza: 'Entrada', activo: true },
  { codigo: 'ENT-ALMACEN', nombre: 'Entrada al Almacen', naturaleza: 'Entrada', activo: true },
  { codigo: 'ENT-COMPRA', nombre: 'Movimiento Entrada por Compra', naturaleza: 'Entrada', activo: true },
  { codigo: 'ENT-DEVOL-TRASPASO', nombre: 'Entrada por Devolucion Traspaso', naturaleza: 'Entrada', activo: true },
  { codigo: 'SAL-AJUSTE', nombre: 'Salida por Ajuste de Inventario', naturaleza: 'Salida', activo: true },
  { codigo: 'SAL-CONSUMO', nombre: 'Salida por Consumo', naturaleza: 'Salida', activo: true },
  { codigo: 'SAL-DEVOL-PROVEEDOR', nombre: 'Salida por Devolucion a Proveedor', naturaleza: 'Salida', activo: true },
  { codigo: 'SAL-ALMACEN', nombre: 'Salida del Almacen', naturaleza: 'Salida', activo: true },
  { codigo: 'SAL-TRASPASO', nombre: 'Salida por Traspaso entre Almacenes', naturaleza: 'Salida', activo: true },
];

export function TiposMovimientoAlmacenPage() {
  const { tiposMovimientoAlmacen } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Almacen', 'crear');
  const puedeEditar = hasPermission('Almacen', 'editar');
  const puedeEliminar = hasPermission('Almacen', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TipoMovimientoAlmacen | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const filtered = useMemo(
    () =>
      tiposMovimientoAlmacen.items.filter(
        (t) => t.nombre.toLowerCase().includes(search.toLowerCase()) || t.codigo.toLowerCase().includes(search.toLowerCase()),
      ),
    [tiposMovimientoAlmacen.items, search],
  );

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(t: TipoMovimientoAlmacen) {
    setEditing(t);
    setForm(t);
    setError('');
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.codigo.trim() || !form.nombre.trim()) {
      setError('Falta el codigo o el nombre.');
      return;
    }
    setError('');
    if (editing) {
      tiposMovimientoAlmacen.update(editing.id, form);
    } else {
      tiposMovimientoAlmacen.add({ id: uid('tma'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(t: TipoMovimientoAlmacen) {
    if (confirm(`Eliminar el tipo de movimiento "${t.nombre}"?`)) tiposMovimientoAlmacen.remove(t.id);
  }

  function cargarSugeridos() {
    if (!confirm('Se agregaran los tipos de movimiento sugeridos (Entrada y Salida). Continuar?')) return;
    SUGERIDOS.forEach((s) => tiposMovimientoAlmacen.add({ id: uid('tma'), ...s }));
  }

  const columns: Column<TipoMovimientoAlmacen>[] = [
    { header: 'Codigo', render: (t) => <span className="font-mono text-xs font-semibold text-ink-100">{t.codigo}</span> },
    { header: 'Nombre', render: (t) => t.nombre },
    { header: 'Naturaleza', render: (t) => <StatusBadge status={t.naturaleza} tone={t.naturaleza === 'Entrada' ? 'green' : 'amber'} /> },
    { header: 'Activo', render: (t) => <StatusBadge status={t.activo ? 'Si' : 'No'} tone={t.activo ? 'green' : 'red'} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Tipos de Movimiento de Almacen"
        subtitle="Clasifica cada Movimiento de Almacen como Entrada o Salida para calcular el inventario."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar tipo..."
        addLabel="Agregar"
        onAdd={puedeCrear ? openNew : undefined}
        extra={
          puedeCrear && tiposMovimientoAlmacen.items.length === 0 ? (
            <ToolbarButton type="button" onClick={cargarSugeridos}>
              <Sparkles size={16} /> Cargar catalogo sugerido
            </ToolbarButton>
          ) : undefined
        }
      />

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(t) => t.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
        emptyMessage="No hay tipos de movimiento registrados."
      />

      {modalOpen && (
        <Modal title={editing ? 'Editando Tipo de Movimiento' : 'Agregando Tipo de Movimiento'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-[180px] flex-1">
                <Field label="Codigo">
                  <Input required autoFocus value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
                </Field>
              </div>
              <label className="flex items-center gap-2 pt-6 text-sm text-ink-300">
                <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
                Activo
              </label>
            </div>

            <Field label="Nombre">
              <Input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </Field>

            <Field label="Naturaleza">
              <Select
                value={form.naturaleza}
                onChange={(e) => setForm({ ...form, naturaleza: e.target.value as TipoMovimientoAlmacen['naturaleza'] })}
              >
                <option value="Entrada">Entrada</option>
                <option value="Salida">Salida</option>
              </Select>
            </Field>

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
