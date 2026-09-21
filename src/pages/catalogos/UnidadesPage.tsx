import { useMemo, useState } from 'react';
import { Download, Plus, Trash2, Truck, Upload } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { mensajeDeError } from '../../lib/errors';
import { unidadToRow } from '../../lib/mappers';
import { uid } from '../../lib/storage';
import { CONFIG_AUTOTRANSPORTE_SAT } from '../../lib/catalogosSat';
import type { EstatusUnidad, Unidad, UnidadArchivo, UnidadDocumentoVencimiento } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, IconButton, Input, PrimaryButton, Select } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const BUCKET = 'unidad-documentos';

const estatuses: EstatusUnidad[] = ['Disponible', 'En viaje', 'Taller', 'Fuera de servicio'];
const TIPOS_TRANSMISION = ['Manual', 'Automatica'];
const TIPOS_COMBUSTIBLE = ['Diesel', 'Gasolina', 'Gas Natural', 'Electrico'];

const emptyDocVencimiento: UnidadDocumentoVencimiento = { numeroDocumento: '', documento: '', fechaVencimiento: '' };

const emptyForm: Omit<Unidad, 'id'> = {
  economico: '',
  placas: '',
  tipo: '',
  marca: '',
  modelo: '',
  anio: new Date().getFullYear(),
  estatus: 'Disponible',
  operadorAsignadoId: '',
  clienteAsignadoId: '',
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
  tipoTransmision: '',
  tipoMotor: '',
  tipoCombustible: '',
  tarjetaCombustible1: '',
  tarjetaCombustible2: '',
  tarjetaCombustible3: '',
  capacidadTanqueLts: 0,
  rendimientoCargadoKmLt: 0,
  rendimientoVacioKmLt: 0,
  documentosVencimiento: [],
  archivosAdicionales: [],
  aseguradora: '',
  noPoliza: '',
  vigenciaDesde: '',
  vigenciaHasta: '',
};

export function UnidadesPage() {
  const { unidades, operadores, clientes, empresa } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Catalogos', 'crear');
  const puedeEditar = hasPermission('Catalogos', 'editar');
  const puedeEliminar = hasPermission('Catalogos', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Unidad | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [draftId, setDraftId] = useState('');
  const [tab, setTab] = useState<'general' | 'seguros'>('general');
  const [error, setError] = useState('');

  const [docForm, setDocForm] = useState(emptyDocVencimiento);
  const [archDescripcion, setArchDescripcion] = useState('');
  const [subiendoArch, setSubiendoArch] = useState(false);
  const [errorArch, setErrorArch] = useState('');

  const operadorNombre = (id?: string) => operadores.items.find((o) => o.id === id)?.nombre ?? '—';
  const clienteNombre = (id?: string) => clientes.items.find((c) => c.id === id)?.nombre ?? '—';

  const filtered = useMemo(
    () =>
      unidades.items.filter((u) =>
        `${u.economico} ${u.placas} ${u.marca} ${u.modelo} ${operadorNombre(u.operadorAsignadoId)} ${clienteNombre(u.clienteAsignadoId)}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unidades.items, search, operadores.items, clientes.items],
  );

  /** El Codigo (dato obligatorio) no se puede repetir dentro de la misma empresa. */
  function buscarDuplicado(): string | null {
    const codigo = form.economico.trim();
    const otras = unidades.items.filter((u) => u.id !== editing?.id);
    if (codigo && otras.some((u) => u.economico.trim() === codigo)) return `Ya existe una unidad con el codigo ${codigo}.`;
    return null;
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setDraftId(uid('uni'));
    setTab('general');
    setError('');
    setErrorArch('');
    setModalOpen(true);
  }

  function openEdit(u: Unidad) {
    setEditing(u);
    setForm({ operadorAsignadoId: '', clienteAsignadoId: '', ...u });
    setDraftId(u.id);
    setTab('general');
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
    const payload = {
      ...form,
      operadorAsignadoId: form.operadorAsignadoId || undefined,
      clienteAsignadoId: form.clienteAsignadoId || undefined,
    };
    if (editing) {
      unidades.update(editing.id, payload);
    } else {
      unidades.add({ id: draftId, ...payload });
    }
    setModalOpen(false);
  }

  function handleDelete(u: Unidad) {
    if (confirm(`Eliminar la unidad "${u.economico}"?`)) unidades.remove(u.id);
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, fotoDataUrl: reader.result as string }));
    reader.readAsDataURL(file);
  }

  async function crearUnidadComoDraft(): Promise<Unidad> {
    const nueva: Unidad = { ...form, id: draftId };
    const { error: errIns } = await supabase.from('unidades').insert(unidadToRow(nueva) as never);
    if (errIns) throw errIns;
    setEditing(nueva);
    setForm(nueva);
    unidades.reload();
    return nueva;
  }

  async function handleUploadArchivo(file: File) {
    setSubiendoArch(true);
    setErrorArch('');
    let unidad = editing;
    if (!unidad) {
      try {
        unidad = await crearUnidadComoDraft();
      } catch (err) {
        setSubiendoArch(false);
        setErrorArch(mensajeDeError(err));
        return;
      }
    }
    const path = `${empresa.value.id}/${unidad.id}/${Date.now()}_${file.name}`;
    const { error: errUp } = await supabase.storage.from(BUCKET).upload(path, file);
    setSubiendoArch(false);
    if (errUp) {
      setErrorArch(mensajeDeError(errUp));
      return;
    }
    const nuevoArch: UnidadArchivo = {
      id: uid('arch'),
      descripcion: archDescripcion || file.name,
      storagePath: path,
      nombreArchivo: file.name,
      subidoEn: new Date().toISOString(),
    };
    const nuevos = [...form.archivosAdicionales, nuevoArch];
    setForm((f) => ({ ...f, archivosAdicionales: nuevos }));
    setArchDescripcion('');
    await supabase.from('unidades').update({ archivos_adicionales: nuevos } as never).eq('id', unidad.id);
    unidades.reload();
  }

  async function handleVerArchivo(a: UnidadArchivo) {
    const { data, error: errUrl } = await supabase.storage.from(BUCKET).createSignedUrl(a.storagePath, 60);
    if (errUrl || !data) {
      alert(mensajeDeError(errUrl) || 'No se pudo abrir el archivo.');
      return;
    }
    window.open(data.signedUrl, '_blank');
  }

  async function handleEliminarArchivo(a: UnidadArchivo) {
    if (!editing) return;
    if (!confirm(`Eliminar el archivo "${a.descripcion}"?`)) return;
    await supabase.storage.from(BUCKET).remove([a.storagePath]);
    const nuevos = form.archivosAdicionales.filter((d) => d.id !== a.id);
    setForm({ ...form, archivosAdicionales: nuevos });
    await supabase.from('unidades').update({ archivos_adicionales: nuevos } as never).eq('id', editing.id);
    unidades.reload();
  }

  function agregarDocumento() {
    if (!docForm.numeroDocumento && !docForm.documento) return;
    setForm({ ...form, documentosVencimiento: [...form.documentosVencimiento, docForm] });
    setDocForm(emptyDocVencimiento);
  }

  function eliminarDocumento(index: number) {
    setForm({ ...form, documentosVencimiento: form.documentosVencimiento.filter((_, i) => i !== index) });
  }

  const columns: Column<Unidad>[] = [
    { header: 'Codigo', render: (u) => <span className="font-medium text-ink-100">{u.economico}</span> },
    {
      header: 'Placas / Marca',
      render: (u) => (
        <span className="text-xs">
          {u.placas || '—'} &middot; {u.marca || '—'} {u.modelo} {u.anio ? `(${u.anio})` : ''}
        </span>
      ),
    },
    { header: 'Operador asignado', render: (u) => operadorNombre(u.operadorAsignadoId) },
    { header: 'Cliente asignado', render: (u) => clienteNombre(u.clienteAsignadoId) },
    { header: 'Estatus', render: (u) => <StatusBadge status={u.estatus} /> },
    {
      header: 'Activa',
      render: (u) => <StatusBadge status={u.activa ? 'Si' : 'No'} tone={u.activa ? 'green' : 'red'} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Unidades"
        subtitle="Tractocamiones y unidades de la flota, con su asignacion actual."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por codigo, operador o cliente..."
        addLabel="Agregar"
        onAdd={puedeCrear ? openNew : undefined}
      />

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(u) => u.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
      />

      {modalOpen && (
        <Modal title={editing ? 'Editando Unidad' : 'Agregando Unidad'} onClose={() => setModalOpen(false)} wide="xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-breco-500">Información general de la unidad</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Código">
                    <Input required value={form.economico} onChange={(e) => setForm({ ...form, economico: e.target.value })} />
                  </Field>
                  <div className="flex flex-wrap items-center gap-5 sm:col-span-2 sm:self-end sm:pb-2">
                    <label className="flex items-center gap-2 text-sm text-ink-300">
                      <input type="checkbox" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })} />
                      Activa
                    </label>
                    <label className="flex items-center gap-2 text-sm text-ink-300">
                      <input type="checkbox" checked={form.rentada} onChange={(e) => setForm({ ...form, rentada: e.target.checked })} />
                      Rentada
                    </label>
                    <label className="flex items-center gap-2 text-sm text-ink-300">
                      <input
                        type="checkbox"
                        checked={form.esPermisionario}
                        onChange={(e) => setForm({ ...form, esPermisionario: e.target.checked })}
                      />
                      Unidad del permisionario
                    </label>
                  </div>
                  <div className="sm:col-span-3">
                    <Field label="Descripción">
                      <Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="Modelo (Año)">
                    <Input
                      type="number"
                      required
                      value={form.anio || ''}
                      onChange={(e) => setForm({ ...form, anio: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Tipo de unidad">
                    <Select required value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                      <option value="">Selecciona...</option>
                      {CONFIG_AUTOTRANSPORTE_SAT.map((t) => (
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
                    <Input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
                  </Field>
                  <Field label="Operador">
                    <Select value={form.operadorAsignadoId ?? ''} onChange={(e) => setForm({ ...form, operadorAsignadoId: e.target.value })}>
                      <option value="">Sin asignar</option>
                      {operadores.items.map((o) => (
                        <option key={o.id} value={o.id}>{o.nombre}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Cliente asignado">
                    <Select value={form.clienteAsignadoId ?? ''} onChange={(e) => setForm({ ...form, clienteAsignadoId: e.target.value })}>
                      <option value="">Sin asignar</option>
                      {clientes.items.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Grupo de unidades">
                    <Input value={form.grupoUnidades} onChange={(e) => setForm({ ...form, grupoUnidades: e.target.value })} />
                  </Field>
                  <Field label="Estatus operativo">
                    <Select value={form.estatus} onChange={(e) => setForm({ ...form, estatus: e.target.value as EstatusUnidad })}>
                      {estatuses.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-breco-500">Foto de la unidad</h3>
                <div className="flex flex-col items-center gap-3 rounded-xl border border-line-800 bg-bg-900 p-4">
                  <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-line-700 bg-bg-800">
                    {form.fotoDataUrl ? (
                      <img src={form.fotoDataUrl} alt={form.economico || 'Unidad'} className="h-full w-full object-cover" />
                    ) : (
                      <Truck size={44} className="text-ink-600" />
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
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-breco-500">Especificaciones de la unidad</h3>
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
                <Field label="Tipo transmisión">
                  <Select value={form.tipoTransmision} onChange={(e) => setForm({ ...form, tipoTransmision: e.target.value })}>
                    <option value="">Seleccione...</option>
                    {TIPOS_TRANSMISION.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Tipo motor">
                  <Input value={form.tipoMotor} onChange={(e) => setForm({ ...form, tipoMotor: e.target.value })} />
                </Field>
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-breco-500">Consumo de Combustible</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Field label="Tipo de combustible">
                  <Select value={form.tipoCombustible} onChange={(e) => setForm({ ...form, tipoCombustible: e.target.value })}>
                    <option value="">Seleccione...</option>
                    {TIPOS_COMBUSTIBLE.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Tarjeta de combustible 1">
                  <Input value={form.tarjetaCombustible1} onChange={(e) => setForm({ ...form, tarjetaCombustible1: e.target.value })} />
                </Field>
                <Field label="Tarjeta de combustible 2">
                  <Input value={form.tarjetaCombustible2} onChange={(e) => setForm({ ...form, tarjetaCombustible2: e.target.value })} />
                </Field>
                <Field label="Tarjeta de combustible 3">
                  <Input value={form.tarjetaCombustible3} onChange={(e) => setForm({ ...form, tarjetaCombustible3: e.target.value })} />
                </Field>
                <Field label="Capacidad tanque (Lts)">
                  <Input type="number" step="0.01" value={form.capacidadTanqueLts || ''} onChange={(e) => setForm({ ...form, capacidadTanqueLts: Number(e.target.value) })} />
                </Field>
                <Field label="Rendimiento cargado (Kms/Lts)">
                  <Input type="number" step="0.01" value={form.rendimientoCargadoKmLt || ''} onChange={(e) => setForm({ ...form, rendimientoCargadoKmLt: Number(e.target.value) })} />
                </Field>
                <Field label="Rendimiento vacío (Kms/Lts)">
                  <Input type="number" step="0.01" value={form.rendimientoVacioKmLt || ''} onChange={(e) => setForm({ ...form, rendimientoVacioKmLt: Number(e.target.value) })} />
                </Field>
              </div>
            </section>

            <section>
              <div className="mb-3 flex gap-1 border-b border-line-800">
                {[
                  { id: 'general' as const, label: 'Información General' },
                  { id: 'seguros' as const, label: 'Seguros' },
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

              {tab === 'general' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Documentos de la unidad</h4>
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
                </div>
              )}

              {tab === 'seguros' && (
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
              )}
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
