import { useMemo, useState } from 'react';
import { Download, Plus, Trash2, Upload } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import { hoyISO } from '../../lib/fechas';
import { mensajeDeError } from '../../lib/errors';
import { supabase } from '../../lib/supabaseClient';
import { nextFolioMantenimiento, tiempoRealHoras, totalManoObra } from '../../lib/mantenimiento';
import { ordenServicioToRow } from '../../lib/mappers';
import type { CatalogoServicio, OrdenServicio, OrdenServicioFoto, OrdenServicioLinea } from '../../types';
import { Modal } from '../ui/Modal';
import { ListaSeleccionModal } from '../ui/ListaSeleccionModal';
import { Field, GhostButton, IconButton, Input, PrimaryButton, Select, Textarea, ToolbarButton } from '../ui/form';

const BUCKET = 'mantenimiento-documentos';

const emptyLineaForm = {
  catalogoServicioId: undefined as string | undefined,
  codigo: '',
  descripcion: '',
  manoObra: 0,
  fechaInicio: hoyISO(),
  horaInicio: '',
  fechaFinal: hoyISO(),
  horaFinal: '',
  tiempoServicioHoras: 0,
};

function construirOrden(ordenes: OrdenServicio[]): Omit<OrdenServicio, 'id'> {
  return {
    folio: nextFolioMantenimiento(ordenes, 'OS-'),
    fecha: hoyISO(),
    tipo: 'Interno',
    moneda: 'PESOS',
    tipoCambio: 1,
    tipoServicio: 'Correctivo',
    unidadId: '',
    estatus: 'Abierta',
    proveedorId: undefined,
    proveedorNota: '',
    lugarReparacion: '',
    notas: '',
    noChecklist: '',
    vidaProbableAnios: null,
    vidaProbableKm: null,
    quienRealizaId: undefined,
    mecanicosIds: [],
    observaciones: '',
    reporteFallaIds: [],
    planesServicioIds: [],
    kilometrajeAlMomento: 0,
    lineas: [],
    fotos: [],
  };
}

export function OrdenServicioFormModal({
  editing,
  soloLectura,
  onClose,
  onGuardar,
}: {
  editing: OrdenServicio | null;
  soloLectura: boolean;
  onClose: () => void;
  onGuardar: (datos: OrdenServicio) => void;
}) {
  const { unidades, proveedores, mecanicos, catalogoServicios, reportesFalla, planesServicio, ordenesServicio, empresa } = useData();
  const [form, setForm] = useState<Omit<OrdenServicio, 'id'>>(editing ? { ...editing } : construirOrden(ordenesServicio.items));
  const [draftId] = useState(() => editing?.id ?? uid('os'));
  const [guardadoComoDraft, setGuardadoComoDraft] = useState(Boolean(editing));
  const [tab, setTab] = useState<'servicios' | 'mecanicos' | 'observaciones' | 'fallas' | 'planes'>('servicios');
  const [unidadPickerOpen, setUnidadPickerOpen] = useState(false);
  const [proveedorPickerOpen, setProveedorPickerOpen] = useState(false);
  const [catalogoPickerOpen, setCatalogoPickerOpen] = useState(false);
  const [lineaForm, setLineaForm] = useState(emptyLineaForm);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState('');
  const [error, setError] = useState('');

  const unidadSeleccionada = unidades.items.find((u) => u.id === form.unidadId);
  const proveedorSeleccionado = proveedores.items.find((p) => p.id === form.proveedorId);

  const reportesAbiertos = useMemo(
    () => reportesFalla.items.filter((r) => r.unidadId === form.unidadId && r.estatus !== 'Cancelado'),
    [reportesFalla.items, form.unidadId],
  );
  const planesAplicables = useMemo(
    () =>
      planesServicio.items.filter((p) => p.activo && (p.aplicaA === 'Todas' || p.aplicaA === unidadSeleccionada?.grupoUnidades)),
    [planesServicio.items, unidadSeleccionada],
  );

  function seleccionarUnidad(id: string) {
    const u = unidades.items.find((uu) => uu.id === id);
    setForm((f) => ({ ...f, unidadId: id, kilometrajeAlMomento: u?.kilometrajeActual ?? f.kilometrajeAlMomento, reporteFallaIds: [], planesServicioIds: [] }));
  }

  function seleccionarCatalogoServicio(c: CatalogoServicio) {
    setLineaForm({ ...lineaForm, catalogoServicioId: c.id, codigo: c.codigo, descripcion: c.descripcion, tiempoServicioHoras: c.tiempoEstandarHoras });
    setCatalogoPickerOpen(false);
  }

  function agregarLinea() {
    if (!lineaForm.descripcion.trim()) return;
    const nueva: OrdenServicioLinea = { id: uid('osl'), ...lineaForm };
    setForm((f) => ({ ...f, lineas: [...f.lineas, nueva] }));
    setLineaForm(emptyLineaForm);
  }

  function eliminarLinea(id: string) {
    setForm((f) => ({ ...f, lineas: f.lineas.filter((l) => l.id !== id) }));
  }

  function toggleMecanico(id: string) {
    setForm((f) => ({ ...f, mecanicosIds: f.mecanicosIds.includes(id) ? f.mecanicosIds.filter((m) => m !== id) : [...f.mecanicosIds, id] }));
  }

  function toggleReporteFalla(id: string) {
    setForm((f) => ({ ...f, reporteFallaIds: f.reporteFallaIds.includes(id) ? f.reporteFallaIds.filter((r) => r !== id) : [...f.reporteFallaIds, id] }));
  }

  function togglePlanServicio(id: string) {
    setForm((f) => ({ ...f, planesServicioIds: f.planesServicioIds.includes(id) ? f.planesServicioIds.filter((p) => p !== id) : [...f.planesServicioIds, id] }));
  }

  async function asegurarDraftGuardado(): Promise<void> {
    if (guardadoComoDraft) return;
    const { error: errIns } = await supabase.from('ordenes_servicio').insert(ordenServicioToRow({ ...form, id: draftId }) as never);
    if (errIns) throw errIns;
    setGuardadoComoDraft(true);
    ordenesServicio.reload();
  }

  async function handleUploadFoto(file: File) {
    if (!form.unidadId) {
      setErrorFoto('Selecciona la unidad antes de agregar fotos.');
      return;
    }
    setSubiendoFoto(true);
    setErrorFoto('');
    try {
      await asegurarDraftGuardado();
    } catch (err) {
      setSubiendoFoto(false);
      setErrorFoto(mensajeDeError(err));
      return;
    }
    const path = `${empresa.value.id}/${draftId}/${Date.now()}_${file.name}`;
    const { error: errUp } = await supabase.storage.from(BUCKET).upload(path, file);
    setSubiendoFoto(false);
    if (errUp) {
      setErrorFoto(mensajeDeError(errUp));
      return;
    }
    const nuevaFoto: OrdenServicioFoto = { id: uid('foto'), storagePath: path, nombreArchivo: file.name, subidoEn: new Date().toISOString() };
    const nuevas = [...form.fotos, nuevaFoto];
    setForm((f) => ({ ...f, fotos: nuevas }));
    await supabase.from('ordenes_servicio').update({ fotos: nuevas } as never).eq('id', draftId);
    ordenesServicio.reload();
  }

  async function handleVerFoto(f: OrdenServicioFoto) {
    const { data, error: errUrl } = await supabase.storage.from(BUCKET).createSignedUrl(f.storagePath, 60);
    if (errUrl || !data) {
      alert(mensajeDeError(errUrl) || 'No se pudo abrir el archivo.');
      return;
    }
    window.open(data.signedUrl, '_blank');
  }

  async function handleEliminarFoto(foto: OrdenServicioFoto) {
    if (!confirm('Eliminar esta foto?')) return;
    await supabase.storage.from(BUCKET).remove([foto.storagePath]);
    const nuevas = form.fotos.filter((f) => f.id !== foto.id);
    setForm((f) => ({ ...f, fotos: nuevas }));
    if (guardadoComoDraft) {
      await supabase.from('ordenes_servicio').update({ fotos: nuevas } as never).eq('id', draftId);
      ordenesServicio.reload();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.unidadId) {
      setError('Selecciona la unidad.');
      return;
    }
    setError('');
    onGuardar({ ...form, id: draftId });
  }

  const totalManoObraOrden = totalManoObra(form.lineas);

  return (
    <Modal title={soloLectura ? `Consultar orden ${form.folio}` : editing ? `Editar orden ${form.folio}` : 'Agregar Orden de Servicio'} onClose={onClose} wide="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-breco-500/10 px-3 py-2 text-sm text-breco-500">{error}</p>}

        <fieldset disabled={soloLectura} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Folio">
              <Input readOnly value={form.folio} />
            </Field>
            <Field label="Fecha">
              <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </Field>
            <Field label="Tipo">
              <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as OrdenServicio['tipo'] })}>
                <option value="Interno">Interno</option>
                <option value="Externo">Externo</option>
              </Select>
            </Field>
            <Field label="Estatus">
              <Select value={form.estatus} onChange={(e) => setForm({ ...form, estatus: e.target.value as OrdenServicio['estatus'] })}>
                <option value="Abierta">Abierta</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Concluida">Concluida</option>
                <option value="Cancelada">Cancelada</option>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Moneda">
              <Select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })}>
                <option value="PESOS">PESOS</option>
                <option value="DOLARES">DOLARES</option>
              </Select>
            </Field>
            <Field label="Tipo de Cambio">
              <Input type="number" step="0.0001" min="0" value={form.tipoCambio} onChange={(e) => setForm({ ...form, tipoCambio: Number(e.target.value) || 1 })} />
            </Field>
            <Field label="Tipo de Servicio">
              <Select value={form.tipoServicio} onChange={(e) => setForm({ ...form, tipoServicio: e.target.value as OrdenServicio['tipoServicio'] })}>
                <option value="Preventivo">Preventivo</option>
                <option value="Correctivo">Correctivo</option>
              </Select>
            </Field>
            <Field label="No. de Checklist">
              <Input value={form.noChecklist} onChange={(e) => setForm({ ...form, noChecklist: e.target.value })} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Unidad">
              <div className="flex items-center gap-2">
                <Input readOnly value={unidadSeleccionada ? `${unidadSeleccionada.economico} - ${unidadSeleccionada.placas}` : ''} placeholder="Buscar unidad, numero economico o placas..." />
                <ToolbarButton type="button" onClick={() => setUnidadPickerOpen(true)}>
                  ...
                </ToolbarButton>
              </div>
            </Field>
            <Field label="Kilometraje al momento">
              <Input
                type="number"
                min="0"
                value={form.kilometrajeAlMomento}
                onChange={(e) => setForm({ ...form, kilometrajeAlMomento: Number(e.target.value) || 0 })}
              />
            </Field>
          </div>

          {form.tipo === 'Externo' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Proveedor">
                <div className="flex items-center gap-2">
                  <Input readOnly value={proveedorSeleccionado?.nombre ?? ''} placeholder="Buscar proveedor..." />
                  <ToolbarButton type="button" onClick={() => setProveedorPickerOpen(true)}>
                    ...
                  </ToolbarButton>
                </div>
              </Field>
              <Field label="Referencia del Proveedor">
                <Input value={form.proveedorNota} onChange={(e) => setForm({ ...form, proveedorNota: e.target.value })} />
              </Field>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Lugar de Reparacion">
              <Input value={form.lugarReparacion} onChange={(e) => setForm({ ...form, lugarReparacion: e.target.value })} placeholder="Seleccione o escriba el lugar..." />
            </Field>
            <Field label="Quien realiza la reparacion">
              <Select value={form.quienRealizaId ?? ''} onChange={(e) => setForm({ ...form, quienRealizaId: e.target.value || undefined })}>
                <option value="">Seleccione...</option>
                {mecanicos.items.filter((m) => m.activo).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} ({m.tipo})
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Vida Probable (Anios)">
              <Input
                type="number"
                min="0"
                value={form.vidaProbableAnios ?? ''}
                onChange={(e) => setForm({ ...form, vidaProbableAnios: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </Field>
            <Field label="Vida Probable (Km)">
              <Input
                type="number"
                min="0"
                value={form.vidaProbableKm ?? ''}
                onChange={(e) => setForm({ ...form, vidaProbableKm: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </Field>
            <Field label="Nota">
              <Input value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Notas adicionales..." />
            </Field>
          </div>

          <div>
            <div className="mb-3 flex gap-1 border-b border-line-800">
              {[
                { id: 'servicios' as const, label: 'Servicios' },
                { id: 'mecanicos' as const, label: 'Mecanicos/Ayudantes' },
                { id: 'observaciones' as const, label: 'Observaciones' },
                { id: 'fallas' as const, label: 'Reportes de Falla' },
                { id: 'planes' as const, label: 'Servicios Programados' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
                    tab === t.id ? 'border-breco-500 text-ink-100' : 'border-transparent text-ink-500 hover:text-ink-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'servicios' && (
              <div className="space-y-3">
                <div className="rounded-xl border border-line-800 p-3">
                  <div className="mb-3 flex flex-wrap items-end gap-2">
                    <Field label="Servicio">
                      <div className="flex items-center gap-2">
                        <Input readOnly value={lineaForm.descripcion} placeholder="Selecciona un servicio" className="w-56" />
                        <ToolbarButton type="button" onClick={() => setCatalogoPickerOpen(true)}>
                          ...
                        </ToolbarButton>
                      </div>
                    </Field>
                    <Field label="Mano de Obra">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-28"
                        value={lineaForm.manoObra}
                        onChange={(e) => setLineaForm({ ...lineaForm, manoObra: Number(e.target.value) || 0 })}
                      />
                    </Field>
                    <Field label="Inicio">
                      <Input type="date" className="w-36" value={lineaForm.fechaInicio} onChange={(e) => setLineaForm({ ...lineaForm, fechaInicio: e.target.value })} />
                    </Field>
                    <Field label="Hora">
                      <Input type="time" className="w-28" value={lineaForm.horaInicio} onChange={(e) => setLineaForm({ ...lineaForm, horaInicio: e.target.value })} />
                    </Field>
                    <Field label="Final">
                      <Input type="date" className="w-36" value={lineaForm.fechaFinal} onChange={(e) => setLineaForm({ ...lineaForm, fechaFinal: e.target.value })} />
                    </Field>
                    <Field label="Hora">
                      <Input type="time" className="w-28" value={lineaForm.horaFinal} onChange={(e) => setLineaForm({ ...lineaForm, horaFinal: e.target.value })} />
                    </Field>
                    <GhostButton type="button" onClick={agregarLinea}>
                      <Plus size={14} /> Agregar Servicio
                    </GhostButton>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-line-800">
                    <table className="w-full min-w-[900px] text-left text-xs">
                      <thead className="bg-bg-700/50 uppercase tracking-wide text-ink-500">
                        <tr>
                          <th className="px-2 py-2">Codigo</th>
                          <th className="px-2 py-2">Descripcion del Servicio</th>
                          <th className="px-2 py-2">Mano de Obra</th>
                          <th className="px-2 py-2">Inicio</th>
                          <th className="px-2 py-2">Final</th>
                          <th className="px-2 py-2">Tiempo Serv.</th>
                          <th className="px-2 py-2">Tiempo Real</th>
                          <th className="px-2 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {form.lineas.length === 0 && (
                          <tr>
                            <td colSpan={8} className="px-2 py-6 text-center text-ink-600">
                              Sin servicios registrados.
                            </td>
                          </tr>
                        )}
                        {form.lineas.map((l) => (
                          <tr key={l.id} className="border-t border-line-800/70 text-ink-300">
                            <td className="px-2 py-1.5">{l.codigo || '-'}</td>
                            <td className="px-2 py-1.5">{l.descripcion}</td>
                            <td className="px-2 py-1.5">{l.manoObra.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                            <td className="px-2 py-1.5">
                              {l.fechaInicio} {l.horaInicio}
                            </td>
                            <td className="px-2 py-1.5">
                              {l.fechaFinal} {l.horaFinal}
                            </td>
                            <td className="px-2 py-1.5">{l.tiempoServicioHoras} hrs</td>
                            <td className="px-2 py-1.5">{tiempoRealHoras(l)} hrs</td>
                            <td className="px-2 py-1.5">
                              <button type="button" onClick={() => eliminarLinea(l.id)} className="text-ink-600 hover:text-red-400">
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-right text-sm font-semibold text-ink-100">
                    Total mano de obra: {totalManoObraOrden.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                  </p>
                </div>
              </div>
            )}

            {tab === 'mecanicos' && (
              <div className="max-h-56 overflow-auto rounded-xl border border-line-800">
                {mecanicos.items.filter((m) => m.activo).length === 0 ? (
                  <p className="p-4 text-center text-sm text-ink-600">No hay mecanicos activos registrados.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <tbody>
                      {mecanicos.items
                        .filter((m) => m.activo)
                        .map((m) => (
                          <tr key={m.id} onClick={() => toggleMecanico(m.id)} className="cursor-pointer border-b border-line-800/70 last:border-0 hover:bg-bg-800">
                            <td className="w-8 px-3 py-2">
                              <input type="checkbox" readOnly checked={form.mecanicosIds.includes(m.id)} className="h-4 w-4 accent-breco-500" />
                            </td>
                            <td className="px-3 py-2 text-ink-100">{m.nombre}</td>
                            <td className="px-3 py-2 text-ink-500">{m.tipo}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {tab === 'observaciones' && (
              <Field label="Observaciones">
                <Textarea rows={4} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
              </Field>
            )}

            {tab === 'fallas' && (
              <div className="max-h-56 overflow-auto rounded-xl border border-line-800">
                {!form.unidadId ? (
                  <p className="p-4 text-center text-sm text-ink-600">Selecciona una unidad para ver sus reportes de falla.</p>
                ) : reportesAbiertos.length === 0 ? (
                  <p className="p-4 text-center text-sm text-ink-600">Esta unidad no tiene reportes de falla.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <tbody>
                      {reportesAbiertos.map((r) => (
                        <tr key={r.id} onClick={() => toggleReporteFalla(r.id)} className="cursor-pointer border-b border-line-800/70 last:border-0 hover:bg-bg-800">
                          <td className="w-8 px-3 py-2">
                            <input type="checkbox" readOnly checked={form.reporteFallaIds.includes(r.id)} className="h-4 w-4 accent-breco-500" />
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-breco-400">{r.folio}</td>
                          <td className="px-3 py-2 text-ink-200">{r.descripcion}</td>
                          <td className="px-3 py-2 text-ink-500">{r.estatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {tab === 'planes' && (
              <div className="max-h-56 overflow-auto rounded-xl border border-line-800">
                {!form.unidadId ? (
                  <p className="p-4 text-center text-sm text-ink-600">Selecciona una unidad para ver sus planes de servicio.</p>
                ) : planesAplicables.length === 0 ? (
                  <p className="p-4 text-center text-sm text-ink-600">No hay planes de servicio aplicables a esta unidad.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <tbody>
                      {planesAplicables.map((p) => (
                        <tr key={p.id} onClick={() => togglePlanServicio(p.id)} className="cursor-pointer border-b border-line-800/70 last:border-0 hover:bg-bg-800">
                          <td className="w-8 px-3 py-2">
                            <input type="checkbox" readOnly checked={form.planesServicioIds.includes(p.id)} className="h-4 w-4 accent-breco-500" />
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-breco-400">{p.codigo}</td>
                          <td className="px-3 py-2 text-ink-200">{p.nombre}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Fotos de Evidencia</h4>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line-700 bg-bg-800 px-4 py-2 text-sm font-medium text-ink-300 hover:border-line-600 hover:text-ink-100">
              <Upload size={15} />
              {subiendoFoto ? 'Subiendo...' : 'Agregar foto'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={subiendoFoto}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadFoto(file);
                  e.target.value = '';
                }}
              />
            </label>
            {errorFoto && <p className="mt-2 text-sm text-breco-500">{errorFoto}</p>}
            <div className="mt-3 overflow-hidden rounded-xl border border-line-800">
              <table className="w-full text-left text-sm">
                <tbody>
                  {form.fotos.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-ink-600">Sin fotos agregadas.</td>
                    </tr>
                  )}
                  {form.fotos.map((f) => (
                    <tr key={f.id} className="border-b border-line-800/70 last:border-0">
                      <td className="px-3 py-2 text-ink-200">{f.nombreArchivo}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-1">
                          <IconButton type="button" onClick={() => handleVerFoto(f)} title="Ver">
                            <Download size={14} />
                          </IconButton>
                          <IconButton type="button" onClick={() => handleEliminarFoto(f)} className="hover:text-breco-500" title="Eliminar">
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
            seleccionarUnidad(u.id);
            setUnidadPickerOpen(false);
          }}
          onClose={() => setUnidadPickerOpen(false)}
        />
      )}

      {proveedorPickerOpen && (
        <ListaSeleccionModal
          title="Buscar proveedor"
          items={proveedores.items}
          filtro={(p, t) => !t || p.nombre.toLowerCase().includes(t) || p.numero.toLowerCase().includes(t)}
          renderRow={(p) => (
            <>
              <td className="px-3 py-2 font-mono text-xs text-breco-400">{p.numero}</td>
              <td className="px-3 py-2 text-ink-200">{p.nombre}</td>
            </>
          )}
          onSelect={(p) => {
            setForm({ ...form, proveedorId: p.id });
            setProveedorPickerOpen(false);
          }}
          onClose={() => setProveedorPickerOpen(false)}
        />
      )}

      {catalogoPickerOpen && (
        <ListaSeleccionModal
          title="Buscar servicio"
          items={catalogoServicios.items.filter((c) => c.activo)}
          filtro={(c, t) => !t || c.descripcion.toLowerCase().includes(t) || c.codigo.toLowerCase().includes(t)}
          renderRow={(c) => (
            <>
              <td className="px-3 py-2 font-mono text-xs text-breco-400">{c.codigo}</td>
              <td className="px-3 py-2 text-ink-200">{c.descripcion}</td>
            </>
          )}
          onSelect={seleccionarCatalogoServicio}
          onClose={() => setCatalogoPickerOpen(false)}
        />
      )}
    </Modal>
  );
}
