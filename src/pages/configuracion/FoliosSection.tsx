import { useState } from 'react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import { hoyISO } from '../../lib/fechas';
import type { FolioAutorizado } from '../../types';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const DOCUMENTOS: { value: FolioAutorizado['documento']; label: string }[] = [
  { value: 'Factura', label: 'FACTURA CFDI' },
  { value: 'CartaPorte', label: 'CARTA PORTE CFDI' },
  { value: 'NotaCredito', label: 'NOTA DE CREDITO CFDI' },
];

function nombreDocumento(documento: FolioAutorizado['documento']): string {
  return DOCUMENTOS.find((d) => d.value === documento)?.label ?? documento;
}

const emptyForm: Omit<FolioAutorizado, 'id' | 'creadoEn'> = {
  documento: 'Factura',
  sucursal: 'MATRIZ',
  serie: '',
  folioInicial: 1,
  folioFinal: 1,
  noAprobacion: '',
  anioAprobacion: new Date().getFullYear(),
  fechaAprobacion: hoyISO(),
  activo: true,
};

export function FoliosSection() {
  const { foliosAutorizados } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Catalogos', 'crear');
  const puedeEditar = hasPermission('Catalogos', 'editar');
  const puedeEliminar = hasPermission('Catalogos', 'eliminar');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FolioAutorizado | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(f: FolioAutorizado) {
    setEditing(f);
    setForm(f);
    setError('');
    setModalOpen(true);
  }

  function traslape(): string | null {
    const otros = foliosAutorizados.items.filter(
      (f) => f.id !== editing?.id && f.documento === form.documento && f.serie.trim() === form.serie.trim() && f.sucursal.trim() === form.sucursal.trim(),
    );
    const choca = otros.some((f) => form.folioInicial <= f.folioFinal && form.folioFinal >= f.folioInicial);
    if (choca) {
      return `Ya existe un rango autorizado que se traslapa para ${nombreDocumento(form.documento)}, serie "${form.serie || '(sin serie)'}", sucursal "${form.sucursal}".`;
    }
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.folioFinal < form.folioInicial) {
      setError('El Folio Final no puede ser menor que el Folio Inicial.');
      return;
    }
    const conflicto = traslape();
    if (conflicto) {
      setError(conflicto);
      return;
    }
    setError('');
    if (editing) {
      foliosAutorizados.update(editing.id, form);
    } else {
      foliosAutorizados.add({ id: uid('fol'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(f: FolioAutorizado) {
    if (
      confirm(
        `Eliminar el folio autorizado de ${nombreDocumento(f.documento)}, serie "${f.serie || '(sin serie)'}", del folio ${f.folioInicial} al ${f.folioFinal}?`,
      )
    ) {
      foliosAutorizados.remove(f.id);
    }
  }

  const columns: Column<FolioAutorizado>[] = [
    { header: 'Documento', render: (f) => nombreDocumento(f.documento) },
    { header: 'Sucursal', render: (f) => f.sucursal || '—' },
    { header: 'Serie', render: (f) => f.serie || '—' },
    { header: 'Folio Inicial', render: (f) => f.folioInicial },
    { header: 'Folio Final', render: (f) => f.folioFinal },
    { header: 'No. Aprobacion', render: (f) => f.noAprobacion || '—' },
    { header: 'Año Aprob.', render: (f) => f.anioAprobacion || '—' },
    { header: 'Fecha Aprob.', render: (f) => f.fechaAprobacion || '—' },
    {
      header: 'Activo',
      render: (f) => <StatusBadge status={f.activo ? 'Si' : 'No'} tone={f.activo ? 'green' : 'red'} />,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink-100">Catalogo de Folios</h2>
          <p className="mt-1 text-sm text-ink-500">
            Rangos de folios autorizados (Serie + Folio Inicial + Folio Final) para Factura, Carta Porte y Nota de
            Credito, con sus datos de aprobacion. Para dar de baja un rango se elimina el renglon completo, del folio
            inicial al final.
          </p>
        </div>
        {puedeCrear && (
          <GhostButton type="button" onClick={openNew}>
            Agregar
          </GhostButton>
        )}
      </div>

      <CrudTable
        columns={columns}
        rows={foliosAutorizados.items}
        keyFn={(f) => f.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
        emptyMessage="Sin folios autorizados registrados."
      />

      {modalOpen && (
        <Modal title={editing ? 'Editando Folio' : 'Agregando Folio'} onClose={() => setModalOpen(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="rounded-lg bg-breco-500/10 px-3 py-2 text-sm text-breco-500">{error}</p>}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Documento">
                <Select
                  value={form.documento}
                  onChange={(e) => setForm({ ...form, documento: e.target.value as FolioAutorizado['documento'] })}
                >
                  {DOCUMENTOS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Sucursal">
                <Input value={form.sucursal} onChange={(e) => setForm({ ...form, sucursal: e.target.value })} />
              </Field>
            </div>

            <Field label="Serie">
              <Input value={form.serie} onChange={(e) => setForm({ ...form, serie: e.target.value.toUpperCase() })} placeholder="Ej. TLR" />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Folio Inicial" required>
                <Input
                  type="number"
                  min="0"
                  value={form.folioInicial}
                  onChange={(e) => setForm({ ...form, folioInicial: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field label="Folio Final" required>
                <Input
                  type="number"
                  min="0"
                  value={form.folioFinal}
                  onChange={(e) => setForm({ ...form, folioFinal: Number(e.target.value) || 0 })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-xl border border-line-800 bg-bg-900 p-4 sm:grid-cols-3">
              <Field label="No. Aprobacion">
                <Input value={form.noAprobacion} onChange={(e) => setForm({ ...form, noAprobacion: e.target.value })} />
              </Field>
              <Field label="Año Aprob.">
                <Input
                  type="number"
                  value={form.anioAprobacion}
                  onChange={(e) => setForm({ ...form, anioAprobacion: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field label="Fecha Aprob.">
                <Input type="date" value={form.fechaAprobacion} onChange={(e) => setForm({ ...form, fechaAprobacion: e.target.value })} />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm text-ink-300">
              <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
              Activo
            </label>

            <div className="flex items-center justify-end gap-3 border-t border-line-800 pt-4">
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
