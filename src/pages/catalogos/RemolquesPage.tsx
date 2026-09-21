import { useMemo, useState } from 'react';
import { Download, Package, Plus, Trash2, Upload } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { mensajeDeError } from '../../lib/errors';
import { cajaToRow } from '../../lib/mappers';
import { uid } from '../../lib/storage';
import { SUBTIPO_REMOLQUE_SAT } from '../../lib/catalogosSat';
import type { Caja, CajaArchivo, CajaDocumentoVencimiento, EstatusCaja } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, IconButton, Input, PrimaryButton, Select } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const BUCKET = 'remolque-documentos';
const estatuses: EstatusCaja[] = ['Disponible', 'En uso', 'Mantenimiento'];

const emptyDocVencimiento: CajaDocumentoVencimiento = { numeroDocumento: '', documento: '', fechaVencimiento: '' };

const emptyForm: Omit<Caja, 'id'> = {
  economico: '',
  placas: '',
  tipo: '',
  capacidad: '',
  estatus: 'Disponible',
  marca: '',
  modelo: '',
  anio: undefined,
  activa: true,
  rentada: false,
  esPermisionario: false,
  descripcion: '',
  sucursal: 'Matriz',
  identidadSatelital: '',
  identificadorConvoy: '',
  numeroSerie: '',
  color: '',
  grupoUnidades: '',
  fotoDataUrl: '',
  largoMetros: 0,
  anchoMetros: 0,
  altoMetros: 0,
  capacidadKg: 0,
  numeroEjes: 0,
  pesoTaraTon: 0,
  documentosVencimiento: [],
  archivosAdicionales: [],
  aseguradora: '',
  noPoliza: '',
  vigenciaDesde: '',
  vigenciaHasta: '',
};

export function RemolquesPage() {
  const { cajas, empresa, gruposUnidad } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Catalogos', 'crear');
  const puedeEditar = hasPermission('Catalogos', 'editar');
  const puedeEliminar = hasPermission('Catalogos', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Caja | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [draftId, setDraftId] = useState('');
  const [error, setError] = useState('');

  const [docForm, setDocForm] = useState(emptyDocVencimiento);
  const [archDescripcion, setArchDescripcion] = useState('');
  const [subiendoArch, setSubiendoArch] = useState(false);
  const [errorArch, setErrorArch] = useState('');

  const filtered = useMemo(
    () => cajas.items.filter((c) => `${c.economico} ${c.placas} ${c.tipo}`.toLowerCase().includes(search.toLowerCase())),
    [cajas.items, search],
  );

  /** El Codigo (dato obligatorio) no se puede repetir dentro de la misma empresa. */
  function buscarDuplicado(): string | null {
    const codigo = form.economico.trim();
    const otras = cajas.items.filter((c) => c.id !== editing?.id);
    if (codigo && otras.some((c) => c.economico.trim() === codigo)) return `Ya existe un remolque con el codigo ${codigo}.`;
    return null;
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setDraftId(uid('caj'));
    setError('');
    setErrorArch('');
    setModalOpen(true);
  }

  function openEdit(c: Caja) {
    setEditing(c);
    setForm(c);
    setDraftId(c.id);
    setError('');
    setErrorArch('');
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
      cajas.update(editing.id, form);
    } else {
      cajas.add({ id: draftId, ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(c: Caja) {
    if (confirm(`Eliminar el remolque "${c.economico}"?`)) cajas.remove(c.id);
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, fotoDataUrl: reader.result as string }));
    reader.readAsDataURL(file);
  }

  async function crearRemolqueComoDraft(): Promise<Caja> {
    const nuevo: Caja = { ...form, id: draftId };
    const { error: errIns } = await supabase.from('cajas').insert(cajaToRow(nuevo) as never);
    if (errIns) throw errIns;
    setEditing(nuevo);
    setForm(nuevo);
    cajas.reload();
    return nuevo;
  }

  async function handleUploadArchivo(file: File) {
    setSubiendoArch(true);
    setErrorArch('');
    let remolque = editing;
    if (!remolque) {
      try {
        remolque = await crearRemolqueComoDraft();
      } catch (err) {
        setSubiendoArch(false);
        setErrorArch(mensajeDeError(err));
        return;
      }
    }
    const path = `${empresa.value.id}/${remolque.id}/${Date.now()}_${file.name}`;
    const { error: errUp } = await supabase.storage.from(BUCKET).upload(path, file);
    setSubiendoArch(false);
    if (errUp) {
      setErrorArch(mensajeDeError(errUp));
      return;
    }
    const nuevoArch: CajaArchivo = {
      id: uid('arch'),
      descripcion: archDescripcion || file.name,
      storagePath: path,
      nombreArchivo: file.name,
      subidoEn: new Date().toISOString(),
    };
    const nuevos = [...form.archivosAdicionales, nuevoArch];
    setForm((f) => ({ ...f, archivosAdicionales: nuevos }));
    setArchDescripcion('');
    await supabase.from('cajas').update({ archivos_adicionales: nuevos } as never).eq('id', remolque.id);
    cajas.reload();
  }

  async function handleVerArchivo(a: CajaArchivo) {
    const { data, error: errUrl } = await supabase.storage.from(BUCKET).createSignedUrl(a.storagePath, 60);
    if (errUrl || !data) {
      alert(mensajeDeError(errUrl) || 'No se pudo abrir el archivo.');
      return;
    }
    window.open(data.signedUrl, '_blank');
  }

  async function handleEliminarArchivo(a: CajaArchivo) {
    if (!editing) return;
    if (!confirm(`Eliminar el archivo "${a.descripcion}"?`)) return;
    await supabase.storage.from(BUCKET).remove([a.storagePath]);
    const nuevos = form.archivosAdicionales.filter((d) => d.id !== a.id);
    setForm({ ...form, archivosAdicionales: nuevos });
    await supabase.from('cajas').update({ archivos_adicionales: nuevos } as never).eq('id', editing.id);
    cajas.reload();
  }

  function agregarDocumento() {
    if (!docForm.numeroDocumento && !docForm.documento) return;
    setForm({ ...form, documentosVencimiento: [...form.documentosVencimiento, docForm] });
    setDocForm(emptyDocVencimiento);
  }

  function eliminarDocumento(index: number) {
    setForm({ ...form, documentosVencimiento: form.documentosVencimiento.filter((_, i) => i !== index) });
  }

  const columns: Column<Caja>[] = [
    { header: 'Codigo', render: (c) => <span className="font-medium text-ink-100">{c.economico}</span> },
    { header: 'Placas', render: (c) => c.placas },
    { header: 'Tipo', render: (c) => c.tipo },
    { header: 'Estatus', render: (c) => <StatusBadge status={c.estatus} /> },
    {
      header: 'Activo',
      render: (c) => <StatusBadge status={c.activa ? 'Si' : 'No'} tone={c.activa ? 'green' : 'red'} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Remolques"
        subtitle="Remolques y semirremolques de la flota."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por codigo, placas o tipo..."
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
        <Modal title={editing ? 'Editando Remolque' : 'Agregando Remolque'} onClose={() => setModalOpen(false)} wide="xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-breco-500">Información general del remolque</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Código">
                    <Input required value={form.economico} onChange={(e) => setForm({ ...form, economico: e.target.value })} />
                  </Field>
                  <div className="flex flex-wrap items-center gap-5 sm:col-span-2 sm:self-end sm:pb-2">
                    <label className="flex items-center gap-2 text-sm text-ink-300">
                      <input type="checkbox" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })} />
                      Activo
                    </label>
                    <label className="flex items-center gap-2 text-sm text-ink-300">
                      <input type="checkbox" checked={form.rentada} onChange={(e) => setForm({ ...form, rentada: e.target.checked })} />
                      Rentado
                    </label>
                    <label className="flex items-center gap-2 text-sm text-ink-300">
                      <input
                        type="checkbox"
                        checked={form.esPermisionario}
                        onChange={(e) => setForm({ ...form, esPermisionario: e.target.checked })}
                      />
                      Del permisionario
                    </label>
                  </div>
                  <div className="sm:col-span-3">
                    <Field label="Descripción">
                      <Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="Modelo (Año)">
                    <Input type="number" value={form.anio || ''} onChange={(e) => setForm({ ...form, anio: Number(e.target.value) })} />
                  </Field>
                  <Field label="Tipo de remolque">
                    <Select required value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                      <option value="">Selecciona...</option>
                      {SUBTIPO_REMOLQUE_SAT.map((t) => (
                        <option key={t.clave} value={t.clave}>{t.clave} - {t.descripcion}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Sucursal">
                    <Input required value={form.sucursal} onChange={(e) => setForm({ ...form, sucursal: e.target.value })} />
                  </Field>
                  <Field label="Identidad satelital">
                    <Input value={form.identidadSatelital} onChange={(e) => setForm({ ...form, identidadSatelital: e.target.value })} />
                  </Field>
                  <Field label="Identificador de convoy">
                    <Input value={form.identificadorConvoy} onChange={(e) => setForm({ ...form, identificadorConvoy: e.target.value })} />
                  </Field>
                  <Field label="Número de serie">
                    <Input value={form.numeroSerie} onChange={(e) => setForm({ ...form, numeroSerie: e.target.value })} />
                  </Field>
                  <Field label="Placas">
                    <Input value={form.placas} onChange={(e) => setForm({ ...form, placas: e.target.value })} />
                  </Field>
                  <Field label="Color">
                    <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                  </Field>
                  <Field label="Marca">
                    <Input value={form.marca ?? ''} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
                  </Field>
                  <Field label="Grupo de unidades">
                    <Select value={form.grupoUnidades} onChange={(e) => setForm({ ...form, grupoUnidades: e.target.value })}>
                      <option value="">Sin grupo</option>
                      {gruposUnidad.items.map((g) => (
                        <option key={g.id} value={g.nombre}>{g.nombre}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Capacidad (descripción)">
                    <Input placeholder="Ej. 53 pies" value={form.capacidad} onChange={(e) => setForm({ ...form, capacidad: e.target.value })} />
                  </Field>
                  <Field label="Estatus operativo">
                    <Select value={form.estatus} onChange={(e) => setForm({ ...form, estatus: e.target.value as EstatusCaja })}>
                      {estatuses.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-breco-500">Foto del remolque</h3>
                <div className="flex flex-col items-center gap-3 rounded-xl border border-line-800 bg-bg-900 p-4">
                  <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-line-700 bg-bg-800">
                    {form.fotoDataUrl ? (
                      <img src={form.fotoDataUrl} alt={form.economico || 'Remolque'} className="h-full w-full object-cover" />
                    ) : (
                      <Package size={44} className="text-ink-600" />
                    )}
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line-700 bg-bg-800 px-3 py-2 text-xs font-medium text-ink-300 hover:border-line-600 hover:text-ink-100">
                    <Upload size={14} />
                    Seleccionar archivo
                    <input type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
                  </label>
                  {form.fotoDataUrl && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, fotoDataUrl: '' })}
                      className="text-xs font-medium text-breco-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-breco-500">Especificaciones del remolque</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Field label="Largo (metros)">
                  <Input type="number" step="0.01" value={form.largoMetros || ''} onChange={(e) => setForm({ ...form, largoMetros: Number(e.target.value) })} />
                </Field>
                <Field label="Ancho (metros)">
                  <Input type="number" step="0.01" value={form.anchoMetros || ''} onChange={(e) => setForm({ ...form, anchoMetros: Number(e.target.value) })} />
                </Field>
                <Field label="Alto (metros)">
                  <Input type="number" step="0.01" value={form.altoMetros || ''} onChange={(e) => setForm({ ...form, altoMetros: Number(e.target.value) })} />
                </Field>
                <Field label="Capacidad (Kgs)">
                  <Input type="number" step="0.01" value={form.capacidadKg || ''} onChange={(e) => setForm({ ...form, capacidadKg: Number(e.target.value) })} />
                </Field>
                <Field label="Número de ejes">
                  <Input type="number" value={form.numeroEjes || ''} onChange={(e) => setForm({ ...form, numeroEjes: Number(e.target.value) })} />
                </Field>
                <Field label="Peso Tara (Ton)">
                  <Input type="number" step="0.01" value={form.pesoTaraTon || ''} onChange={(e) => setForm({ ...form, pesoTaraTon: Number(e.target.value) })} />
                </Field>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Documentos del remolque</h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Input
                    placeholder="Número de documento"
                    value={docForm.numeroDocumento}
                    onChange={(e) => setDocForm({ ...docForm, numeroDocumento: e.target.value })}
                  />
                  <Input
                    placeholder="Documento"
                    value={docForm.documento}
                    onChange={(e) => setDocForm({ ...docForm, documento: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={docForm.fechaVencimiento}
                      onChange={(e) => setDocForm({ ...docForm, fechaVencimiento: e.target.value })}
                    />
                    <GhostButton type="button" onClick={agregarDocumento}>
                      <Plus size={14} />
                    </GhostButton>
                  </div>
                </div>
                <div className="mt-3 overflow-hidden rounded-xl border border-line-800">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-line-800 bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                        <th className="px-3 py-2 font-medium">Número de documento</th>
                        <th className="px-3 py-2 font-medium">Documento</th>
                        <th className="px-3 py-2 font-medium">Vencimiento</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {form.documentosVencimiento.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-ink-600">No hay documentos registrados.</td>
                        </tr>
                      )}
                      {form.documentosVencimiento.map((d, i) => (
                        <tr key={i} className="border-b border-line-800/70 last:border-0">
                          <td className="px-3 py-2 text-ink-200">{d.numeroDocumento}</td>
                          <td className="px-3 py-2 text-ink-400">{d.documento}</td>
                          <td className="px-3 py-2 text-ink-400">{d.fechaVencimiento}</td>
                          <td className="px-3 py-2">
                            <IconButton type="button" onClick={() => eliminarDocumento(i)} className="hover:text-breco-500">
                              <Trash2 size={14} />
                            </IconButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Archivos adicionales</h4>
                <div className="flex flex-wrap items-end gap-2">
                  <Field label="Descripción">
                    <Input value={archDescripcion} onChange={(e) => setArchDescripcion(e.target.value)} />
                  </Field>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line-700 bg-bg-800 px-4 py-2 text-sm font-medium text-ink-300 hover:border-line-600 hover:text-ink-100">
                    <Upload size={15} />
                    {subiendoArch ? 'Subiendo...' : 'Seleccionar archivo'}
                    <input
                      type="file"
                      accept=".pdf,.zip,.rar,.7z,image/*"
                      className="hidden"
                      disabled={subiendoArch}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadArchivo(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                {errorArch && <p className="mt-2 text-sm text-breco-500">{errorArch}</p>}
                <div className="mt-3 overflow-hidden rounded-xl border border-line-800">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-line-800 bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                        <th className="px-3 py-2 font-medium">Descripción</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {form.archivosAdicionales.length === 0 && (
                        <tr>
                          <td colSpan={2} className="px-3 py-6 text-center text-ink-600">No hay archivos registrados.</td>
                        </tr>
                      )}
                      {form.archivosAdicionales.map((a) => (
                        <tr key={a.id} className="border-b border-line-800/70 last:border-0">
                          <td className="px-3 py-2 text-ink-200">{a.descripcion}</td>
                          <td className="px-3 py-2">
                            <div className="flex justify-end gap-1">
                              <IconButton type="button" onClick={() => handleVerArchivo(a)} title="Ver/Descargar">
                                <Download size={14} />
                              </IconButton>
                              <IconButton type="button" onClick={() => handleEliminarArchivo(a)} className="hover:text-breco-500" title="Eliminar">
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
            </section>

            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-breco-500">Seguros</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <Field label="Aseguradora">
                  <Input value={form.aseguradora} onChange={(e) => setForm({ ...form, aseguradora: e.target.value })} />
                </Field>
                <Field label="No. Póliza">
                  <Input value={form.noPoliza} onChange={(e) => setForm({ ...form, noPoliza: e.target.value })} />
                </Field>
                <Field label="Vigencia desde">
                  <Input type="date" value={form.vigenciaDesde} onChange={(e) => setForm({ ...form, vigenciaDesde: e.target.value })} />
                </Field>
                <Field label="Vigencia hasta">
                  <Input type="date" value={form.vigenciaHasta} onChange={(e) => setForm({ ...form, vigenciaHasta: e.target.value })} />
                </Field>
              </div>
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
