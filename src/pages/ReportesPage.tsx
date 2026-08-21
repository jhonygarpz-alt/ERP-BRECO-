import { useState } from 'react';
import { ExternalLink, FileSpreadsheet, Info, Pencil, Trash2 } from 'lucide-react';
import { useData } from '../lib/DataContext';
import { useAuth } from '../lib/AuthContext';
import { uid } from '../lib/storage';
import type { ReporteExterno } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Modal } from '../components/ui/Modal';
import { Field, GhostButton, IconButton, Input, PrimaryButton, Textarea } from '../components/ui/form';

const emptyForm: Omit<ReporteExterno, 'id'> = {
  nombre: '',
  descripcion: '',
  url: '',
  actualizado: '',
};

export function ReportesPage() {
  const { reportes } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Reportes', 'crear');
  const puedeEditar = hasPermission('Reportes', 'editar');
  const puedeEliminar = hasPermission('Reportes', 'eliminar');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ReporteExterno | null>(null);
  const [form, setForm] = useState(emptyForm);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(r: ReporteExterno) {
    setEditing(r);
    setForm(r);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      reportes.update(editing.id, form);
    } else {
      reportes.add({ id: uid('rep'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(r: ReporteExterno) {
    if (confirm(`Quitar el reporte "${r.nombre}" de esta lista?`)) reportes.remove(r.id);
  }

  return (
    <div>
      <PageHeader
        title="Reportes"
        subtitle="Reportes de la operacion que hoy se llenan en OneDrive."
        addLabel="Agregar reporte"
        onAdd={puedeCrear ? openNew : undefined}
      />

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-line-800 bg-bg-800 p-4">
        <Info size={18} className="mt-0.5 flex-shrink-0 text-breco-500" />
        <p className="text-sm text-ink-300">
          Estos reportes todavia se llenan a mano en OneDrive; el ERP solo enlaza a la carpeta compartida, no lee ni
          actualiza los datos en vivo. Conectar una sincronizacion automatica es un paso aparte que estamos
          evaluando contigo.
        </p>
      </div>

      {reportes.items.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-600">No hay reportes registrados todavia.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {reportes.items.map((r) => (
            <div key={r.id} className="flex flex-col rounded-2xl border border-line-800 bg-bg-800 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                  <FileSpreadsheet size={19} />
                </div>
                <div className="flex gap-1">
                  {puedeEditar && (
                    <IconButton onClick={() => openEdit(r)} title="Editar">
                      <Pencil size={15} />
                    </IconButton>
                  )}
                  {puedeEliminar && (
                    <IconButton onClick={() => handleDelete(r)} title="Eliminar" className="hover:text-breco-500">
                      <Trash2 size={15} />
                    </IconButton>
                  )}
                </div>
              </div>

              <h2 className="mt-3 text-sm font-semibold text-ink-100">{r.nombre}</h2>
              {r.descripcion && <p className="mt-1 text-xs text-ink-500">{r.descripcion}</p>}
              {r.actualizado && <p className="mt-2 text-[11px] text-ink-600">{r.actualizado}</p>}

              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-line-700 bg-bg-900 px-3 py-2 text-sm font-medium text-ink-300 transition hover:border-line-600 hover:text-ink-100"
              >
                Abrir en OneDrive
                <ExternalLink size={14} />
              </a>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal
          title={editing ? 'Editar reporte' : 'Agregar reporte'}
          subtitle="Enlace a un reporte que vive fuera del ERP"
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nombre">
              <Input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </Field>
            <Field label="Descripcion">
              <Textarea
                rows={2}
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </Field>
            <Field label="URL">
              <Input
                type="url"
                required
                placeholder="https://..."
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </Field>
            <Field label="Nota de actualizacion">
              <Input
                placeholder="Ej. Se llena a mano en OneDrive"
                value={form.actualizado}
                onChange={(e) => setForm({ ...form, actualizado: e.target.value })}
              />
            </Field>

            <div className="mt-2 flex justify-end gap-2">
              <GhostButton type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit">{editing ? 'Guardar cambios' : 'Agregar reporte'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
