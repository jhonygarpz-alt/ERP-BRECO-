import { useState } from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import { hoyISO } from '../../lib/fechas';
import { mensajeDeError } from '../../lib/errors';
import { supabase } from '../../lib/supabaseClient';
import { nextFolioMantenimiento } from '../../lib/mantenimiento';
import { reporteFallaToRow } from '../../lib/mappers';
import type { ReporteFalla, ReporteFallaDocumento } from '../../types';
import { Modal } from '../ui/Modal';
import { ListaSeleccionModal } from '../ui/ListaSeleccionModal';
import { Field, GhostButton, IconButton, Input, PrimaryButton, Select, Textarea, ToolbarButton } from '../ui/form';

const BUCKET = 'mantenimiento-documentos';

function construirReporte(reportes: ReporteFalla[]): Omit<ReporteFalla, 'id'> {
  return {
    folio: nextFolioMantenimiento(reportes, 'RF-'),
    fecha: hoyISO(),
    codigoFalla: '',
    sucursal: 'MATRIZ',
    unidadId: '',
    operadorId: undefined,
    clasificacionServicioId: undefined,
    descripcion: '',
    documentos: [],
    estatus: 'Abierto',
  };
}

export function ReporteFallaFormModal({
  editing,
  soloLectura,
  onClose,
  onGuardar,
}: {
  editing: ReporteFalla | null;
  soloLectura: boolean;
  onClose: () => void;
  onGuardar: (datos: ReporteFalla) => void;
}) {
  const { unidades, operadores, clasificacionesServicio, reportesFalla, empresa } = useData();
  const [form, setForm] = useState<Omit<ReporteFalla, 'id'>>(editing ? { ...editing } : construirReporte(reportesFalla.items));
  const [draftId] = useState(() => editing?.id ?? uid('rf'));
  const [guardadoComoDraft, setGuardadoComoDraft] = useState(Boolean(editing));
  const [unidadPickerOpen, setUnidadPickerOpen] = useState(false);
  const [operadorPickerOpen, setOperadorPickerOpen] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [errorArchivo, setErrorArchivo] = useState('');
  const [descripcionArchivo, setDescripcionArchivo] = useState('');
  const [error, setError] = useState('');

  const unidadSeleccionada = unidades.items.find((u) => u.id === form.unidadId);
  const operadorSeleccionado = operadores.items.find((o) => o.id === form.operadorId);

  async function asegurarDraftGuardado(): Promise<void> {
    if (guardadoComoDraft) return;
    const { error: errIns } = await supabase.from('reportes_falla').insert(reporteFallaToRow({ ...form, id: draftId }) as never);
    if (errIns) throw errIns;
    setGuardadoComoDraft(true);
    reportesFalla.reload();
  }

  async function handleUpload(file: File) {
    if (!form.unidadId) {
      setErrorArchivo('Selecciona la unidad antes de adjuntar documentos.');
      return;
    }
    setSubiendo(true);
    setErrorArchivo('');
    try {
      await asegurarDraftGuardado();
    } catch (err) {
      setSubiendo(false);
      setErrorArchivo(mensajeDeError(err));
      return;
    }
    const path = `${empresa.value.id}/${draftId}/${Date.now()}_${file.name}`;
    const { error: errUp } = await supabase.storage.from(BUCKET).upload(path, file);
    setSubiendo(false);
    if (errUp) {
      setErrorArchivo(mensajeDeError(errUp));
      return;
    }
    const nuevoDoc: ReporteFallaDocumento = {
      id: uid('doc'),
      descripcion: descripcionArchivo || file.name,
      storagePath: path,
      nombreArchivo: file.name,
      subidoEn: new Date().toISOString(),
    };
    const nuevos = [...form.documentos, nuevoDoc];
    setForm((f) => ({ ...f, documentos: nuevos }));
    setDescripcionArchivo('');
    await supabase.from('reportes_falla').update({ documentos: nuevos } as never).eq('id', draftId);
    reportesFalla.reload();
  }

  async function handleVerDocumento(d: ReporteFallaDocumento) {
    const { data, error: errUrl } = await supabase.storage.from(BUCKET).createSignedUrl(d.storagePath, 60);
    if (errUrl || !data) {
      alert(mensajeDeError(errUrl) || 'No se pudo abrir el archivo.');
      return;
    }
    window.open(data.signedUrl, '_blank');
  }

  async function handleEliminarDocumento(d: ReporteFallaDocumento) {
    if (!confirm(`Eliminar el documento "${d.descripcion}"?`)) return;
    await supabase.storage.from(BUCKET).remove([d.storagePath]);
    const nuevos = form.documentos.filter((doc) => doc.id !== d.id);
    setForm((f) => ({ ...f, documentos: nuevos }));
    if (guardadoComoDraft) {
      await supabase.from('reportes_falla').update({ documentos: nuevos } as never).eq('id', draftId);
      reportesFalla.reload();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.unidadId) {
      setError('Selecciona la unidad.');
      return;
    }
    if (!form.descripcion.trim()) {
      setError('Describe la falla.');
      return;
    }
    setError('');
    onGuardar({ ...form, id: draftId });
  }

  return (
    <Modal title={soloLectura ? `Consultar reporte ${form.folio}` : editing ? `Editar reporte ${form.folio}` : 'Agregar Reporte de Falla'} onClose={onClose} wide="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-breco-500/10 px-3 py-2 text-sm text-breco-500">{error}</p>}

        <fieldset disabled={soloLectura} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Folio">
              <Input readOnly value={form.folio} />
            </Field>
            <Field label="Fecha del reporte">
              <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </Field>
            <Field label="Codigo de falla (opcional)">
              <Input value={form.codigoFalla} onChange={(e) => setForm({ ...form, codigoFalla: e.target.value })} placeholder="Ej. F-001, MOT-05..." />
            </Field>
            <Field label="Estatus">
              <Select value={form.estatus} onChange={(e) => setForm({ ...form, estatus: e.target.value as ReporteFalla['estatus'] })}>
                <option value="Abierto">Abierto</option>
                <option value="Atendido">Atendido</option>
                <option value="Cancelado">Cancelado</option>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Sucursal">
              <Input value={form.sucursal} onChange={(e) => setForm({ ...form, sucursal: e.target.value })} />
            </Field>
            <Field label="Unidad / Camion">
              <div className="flex items-center gap-2">
                <Input readOnly value={unidadSeleccionada ? `${unidadSeleccionada.economico} - ${unidadSeleccionada.placas}` : ''} placeholder="Buscar unidad, numero economico o placas..." />
                <ToolbarButton type="button" onClick={() => setUnidadPickerOpen(true)}>
                  ...
                </ToolbarButton>
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Operador">
              <div className="flex items-center gap-2">
                <Input readOnly value={operadorSeleccionado?.nombre ?? ''} placeholder="Buscar operador..." />
                <ToolbarButton type="button" onClick={() => setOperadorPickerOpen(true)}>
                  ...
                </ToolbarButton>
              </div>
            </Field>
            <Field label="Clasificacion de Servicio">
              <Select
                value={form.clasificacionServicioId ?? ''}
                onChange={(e) => setForm({ ...form, clasificacionServicioId: e.target.value || undefined })}
              >
                <option value="">Selecciona la clasificacion...</option>
                {clasificacionesServicio.items
                  .filter((c) => c.activo)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.clasificacion}
                    </option>
                  ))}
              </Select>
            </Field>
          </div>

          <Field label="Descripcion de la Falla">
            <Textarea
              rows={4}
              maxLength={1000}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Describe la falla, sintomas, condiciones en las que ocurrio, etc..."
            />
          </Field>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Documentos Digitalizados</h4>
            <div className="flex flex-wrap items-end gap-2">
              <Field label="Descripcion">
                <Input value={descripcionArchivo} onChange={(e) => setDescripcionArchivo(e.target.value)} />
              </Field>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line-700 bg-bg-800 px-4 py-2 text-sm font-medium text-ink-300 hover:border-line-600 hover:text-ink-100">
                <Upload size={15} />
                {subiendo ? 'Subiendo...' : 'Agregar archivo'}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  disabled={subiendo}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            {errorArchivo && <p className="mt-2 text-sm text-breco-500">{errorArchivo}</p>}
            <div className="mt-3 overflow-hidden rounded-xl border border-line-800">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line-800 bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                    <th className="px-3 py-2 font-medium">Descripcion</th>
                    <th className="px-3 py-2 font-medium">Archivo</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {form.documentos.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-ink-600">
                        Sin documentos adjuntos.
                      </td>
                    </tr>
                  )}
                  {form.documentos.map((d) => (
                    <tr key={d.id} className="border-b border-line-800/70 last:border-0">
                      <td className="px-3 py-2 text-ink-200">{d.descripcion}</td>
                      <td className="px-3 py-2 text-ink-400">{d.nombreArchivo}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-1">
                          <IconButton type="button" onClick={() => handleVerDocumento(d)} title="Ver/Descargar">
                            <Download size={14} />
                          </IconButton>
                          <IconButton type="button" onClick={() => handleEliminarDocumento(d)} className="hover:text-breco-500" title="Eliminar">
                            <Trash2 size={14} />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end gap-2 pt-2">
          <GhostButton type="button" onClick={onClose}>
            {soloLectura ? 'Cerrar' : 'Cancelar'}
          </GhostButton>
          {!soloLectura && <PrimaryButton type="submit">Aceptar</PrimaryButton>}
        </div>
      </form>

      {unidadPickerOpen && (
        <ListaSeleccionModal
          title="Buscar unidad"
          items={unidades.items.filter((u) => u.activa)}
          filtro={(u, t) => !t || u.economico.toLowerCase().includes(t) || u.placas.toLowerCase().includes(t)}
          renderRow={(u) => (
            <>
              <td className="px-3 py-2 font-mono text-xs text-breco-400">{u.economico}</td>
              <td className="px-3 py-2 text-ink-200">{u.placas}</td>
            </>
          )}
          onSelect={(u) => {
            setForm({ ...form, unidadId: u.id });
            setUnidadPickerOpen(false);
          }}
          onClose={() => setUnidadPickerOpen(false)}
        />
      )}

      {operadorPickerOpen && (
        <ListaSeleccionModal
          title="Buscar operador"
          items={operadores.items}
          filtro={(o, t) => !t || o.nombre.toLowerCase().includes(t)}
          renderRow={(o) => <td className="px-3 py-2 text-ink-200">{o.nombre}</td>}
          onSelect={(o) => {
            setForm({ ...form, operadorId: o.id });
            setOperadorPickerOpen(false);
          }}
          onClose={() => setOperadorPickerOpen(false)}
        />
      )}
    </Modal>
  );
}
