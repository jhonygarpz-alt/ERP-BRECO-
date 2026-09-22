import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import type { FormatoImpresion } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, IconButton, Input, PrimaryButton, Select, Textarea } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';
import { Pencil, Plus, Power, Trash2 } from 'lucide-react';

const AREAS = ['Viajes', 'Facturacion', 'Complementos de Pago'];

const emptyForm: Omit<FormatoImpresion, 'id'> = {
  area: AREAS[0],
  clave: '',
  nombre: '',
  descripcion: '',
  activo: true,
};

export function FormatosSection() {
  const { formatosImpresion } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Catalogos', 'crear');
  const puedeEditar = hasPermission('Catalogos', 'editar');
  const puedeEliminar = hasPermission('Catalogos', 'eliminar');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FormatoImpresion | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const porArea = useMemo(() => {
    const areas = Array.from(new Set([...AREAS, ...formatosImpresion.items.map((f) => f.area)]));
    return areas.map((area) => ({
      area,
      formatos: formatosImpresion.items.filter((f) => f.area === area),
    }));
  }, [formatosImpresion.items]);

  function buscarDuplicado(): string | null {
    const nombre = form.nombre.trim();
    const otros = formatosImpresion.items.filter((f) => f.id !== editing?.id);
    if (nombre && otros.some((f) => f.area === form.area && f.nombre.toLowerCase() === nombre.toLowerCase())) {
      return `Ya existe un formato llamado "${nombre}" en el area "${form.area}".`;
    }
    return null;
  }

  function openNew(area: string) {
    setEditing(null);
    setForm({ ...emptyForm, area });
    setError('');
    setModalOpen(true);
  }

  function openEdit(f: FormatoImpresion) {
    setEditing(f);
    setForm(f);
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
      formatosImpresion.update(editing.id, form);
    } else {
      formatosImpresion.add({ id: uid('fmt'), ...form, clave: form.clave.trim() || uid('clave') });
    }
    setModalOpen(false);
  }

  function handleDelete(f: FormatoImpresion) {
    if (confirm(`Eliminar el formato "${f.nombre}"?`)) formatosImpresion.remove(f.id);
  }

  function toggleActivo(f: FormatoImpresion) {
    formatosImpresion.update(f.id, { activo: !f.activo });
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-ink-100">Formatos de Impresion</h2>
        <p className="mt-1 text-sm text-ink-500">
          Formatos disponibles para imprimir en cada proceso de la herramienta (Viajes, Facturacion, Complementos de
          Pago, etc.). Deshabilita los que no quieras que aparezcan al imprimir.
        </p>
      </div>

      <div className="space-y-6">
        {porArea.map(({ area, formatos }) => (
          <div key={area} className="overflow-hidden rounded-2xl border border-line-800 bg-bg-800">
            <div className="flex items-center justify-between border-b border-line-800 bg-bg-700/50 px-4 py-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-300">{area}</h3>
              {puedeCrear && (
                <GhostButton type="button" onClick={() => openNew(area)}>
                  <Plus size={15} /> Agregar Formato
                </GhostButton>
              )}
            </div>
            {formatos.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-600">Sin formatos registrados en esta area.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <tbody>
                  {formatos.map((f) => (
                    <tr key={f.id} className="border-b border-line-800/70 last:border-0 hover:bg-bg-700/40">
                      <td className="px-4 py-3 text-ink-100">
                        {f.nombre}
                        {f.descripcion && <p className="text-xs font-normal text-ink-500">{f.descripcion}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={f.activo ? 'Habilitado' : 'Deshabilitado'} tone={f.activo ? 'green' : 'red'} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {puedeEditar && (
                            <IconButton
                              onClick={() => toggleActivo(f)}
                              title={f.activo ? 'Deshabilitar' : 'Habilitar'}
                              className={f.activo ? 'hover:text-breco-500' : 'hover:text-green-500'}
                            >
                              <Power size={15} />
                            </IconButton>
                          )}
                          {puedeEditar && (
                            <IconButton onClick={() => openEdit(f)} title="Editar">
                              <Pencil size={15} />
                            </IconButton>
                          )}
                          {puedeEliminar && (
                            <IconButton onClick={() => handleDelete(f)} title="Eliminar" className="hover:text-breco-500">
                              <Trash2 size={15} />
                            </IconButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Editando Formato' : 'Agregando Formato'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Area">
              <Select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nombre del Formato">
              <Input required autoFocus value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </Field>
            <Field label="Descripcion">
              <Textarea rows={2} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-ink-300">
              <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
              Habilitado
            </label>

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
