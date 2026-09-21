import { useEffect, useMemo, useState } from 'react';
import { Download, Pencil, Plus, Trash2, Upload, UserRound } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useColoniasPorCP } from '../../lib/useColoniasPorCP';
import { mensajeDeError } from '../../lib/errors';
import { uid } from '../../lib/storage';
import type { EstatusOperador, Operador, OperadorDocumento, OperadorVencimiento } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, IconButton, Input, PrimaryButton, Select, Textarea } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const BUCKET = 'operador-documentos';

const ESTADOS_MEXICO = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
  'Ciudad de México', 'Coahuila de Zaragoza', 'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo',
  'Jalisco', 'México', 'Michoacán de Ocampo', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla',
  'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala',
  'Veracruz de Ignacio de la Llave', 'Yucatán', 'Zacatecas',
];

const GRUPOS_SANGUINEOS = ['A Positivo', 'A Negativo', 'B Positivo', 'B Negativo', 'AB Positivo', 'AB Negativo', 'O Positivo', 'O Negativo'];

const estatuses: EstatusOperador[] = ['Disponible', 'En viaje', 'Descanso', 'Baja'];

const emptyVencimiento: OperadorVencimiento = { documento: '', nombre: '', fecha: '', activo: true };

const emptyForm: Omit<Operador, 'id'> = {
  numero: '',
  nombre: '',
  nombres: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  activo: true,
  esPermisionario: false,
  esExtranjero: false,
  rfc: '',
  curp: '',
  fechaContratacion: '',
  sucursal: 'Matriz',
  telefono: '',
  celular: '',
  hashGmtgps: '',
  registroPatronal: '',
  fotoDataUrl: '',
  observaciones: '',
  pais: 'Mexico',
  estado: '',
  municipio: '',
  localidad: '',
  cp: '',
  colonia: '',
  calle: '',
  numeroExterior: '',
  numeroInterior: '',
  domicilioReferencia: '',
  licencia: '',
  vigenciaLicencia: '',
  pasaporte: '',
  vigenciaPasaporte: '',
  licenciaB: false,
  licenciaC: false,
  licenciaE: false,
  noImss: '',
  grupoSanguineo: '',
  alergias: '',
  diabetico: false,
  hipertenso: false,
  documentos: [],
  vencimientos: [],
  banco: '',
  cuentaClabe: '',
  noTarjeta: '',
  estatus: 'Disponible',
};

function nombreCompleto(f: { nombres: string; apellidoPaterno: string; apellidoMaterno: string }) {
  return [f.nombres, f.apellidoPaterno, f.apellidoMaterno].filter(Boolean).join(' ').trim();
}

export function OperadoresPage() {
  const { operadores, empresa } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Catalogos', 'crear');
  const puedeEditar = hasPermission('Catalogos', 'editar');
  const puedeEliminar = hasPermission('Catalogos', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Operador | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState<'general' | 'expediente' | 'bancaria'>('general');
  const [docDescripcion, setDocDescripcion] = useState('');
  const [subiendoDoc, setSubiendoDoc] = useState(false);
  const [errorDoc, setErrorDoc] = useState('');
  const coloniasSugeridas = useColoniasPorCP(form.cp);

  useEffect(() => {
    if (coloniasSugeridas.length > 0) {
      setForm((f) => ({ ...f, estado: coloniasSugeridas[0].estado, municipio: coloniasSugeridas[0].municipio }));
    }
  }, [coloniasSugeridas]);

  const filtered = useMemo(
    () => operadores.items.filter((o) => `${o.nombre} ${o.licencia} ${o.numero}`.toLowerCase().includes(search.toLowerCase())),
    [operadores.items, search],
  );

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setTab('general');
    setDocDescripcion('');
    setErrorDoc('');
    setModalOpen(true);
  }

  function openEdit(o: Operador) {
    setEditing(o);
    setForm(o);
    setTab('general');
    setDocDescripcion('');
    setErrorDoc('');
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nombre = nombreCompleto(form) || form.nombre;
    if (editing) {
      operadores.update(editing.id, { ...form, nombre });
    } else {
      operadores.add({ id: uid('op'), ...form, nombre });
    }
    setModalOpen(false);
  }

  function handleDelete(o: Operador) {
    if (confirm(`Eliminar al operador "${o.nombre}"?`)) operadores.remove(o.id);
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, fotoDataUrl: reader.result as string }));
    reader.readAsDataURL(file);
  }

  async function handleUploadDocumento(file: File) {
    if (!editing) return;
    setSubiendoDoc(true);
    setErrorDoc('');
    const path = `${empresa.value.id}/${editing.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file);
    setSubiendoDoc(false);
    if (error) {
      setErrorDoc(mensajeDeError(error));
      return;
    }
    const nuevoDoc: OperadorDocumento = {
      id: uid('doc'),
      descripcion: docDescripcion || file.name,
      storagePath: path,
      nombreArchivo: file.name,
      subidoEn: new Date().toISOString(),
    };
    const nuevos = [...form.documentos, nuevoDoc];
    setForm({ ...form, documentos: nuevos });
    setDocDescripcion('');
    await operadores.update(editing.id, { documentos: nuevos });
  }

  async function handleVerDocumento(doc: OperadorDocumento) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.storagePath, 60);
    if (error || !data) {
      alert(mensajeDeError(error) || 'No se pudo abrir el documento.');
      return;
    }
    window.open(data.signedUrl, '_blank');
  }

  async function handleEliminarDocumento(doc: OperadorDocumento) {
    if (!editing) return;
    if (!confirm(`Eliminar el documento "${doc.descripcion}"?`)) return;
    await supabase.storage.from(BUCKET).remove([doc.storagePath]);
    const nuevos = form.documentos.filter((d) => d.id !== doc.id);
    setForm({ ...form, documentos: nuevos });
    await operadores.update(editing.id, { documentos: nuevos });
  }

  const [vencForm, setVencForm] = useState<OperadorVencimiento | null>(null);
  const [vencEditIndex, setVencEditIndex] = useState<number | null>(null);

  function guardarVencimiento() {
    if (!vencForm) return;
    const lista = [...form.vencimientos];
    if (vencEditIndex !== null) lista[vencEditIndex] = vencForm;
    else lista.push(vencForm);
    setForm({ ...form, vencimientos: lista });
    setVencForm(null);
    setVencEditIndex(null);
  }

  function eliminarVencimiento(index: number) {
    setForm({ ...form, vencimientos: form.vencimientos.filter((_, i) => i !== index) });
  }

  const columns: Column<Operador>[] = [
    { header: 'Número', render: (o) => <span className="font-mono text-xs text-ink-500">{o.numero}</span> },
    { header: 'Nombre', render: (o) => <span className="font-medium text-ink-100">{o.nombre}</span> },
    { header: 'Licencia', render: (o) => o.licencia },
    { header: 'Vigencia licencia', render: (o) => o.vigenciaLicencia },
    { header: 'Estatus', render: (o) => <StatusBadge status={o.estatus} /> },
    {
      header: 'Activo',
      render: (o) => <StatusBadge status={o.activo ? 'Si' : 'No'} tone={o.activo ? 'green' : 'red'} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Operadores"
        subtitle="Choferes disponibles para asignacion de viajes."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por numero, nombre o licencia..."
        addLabel="Agregar"
        onAdd={puedeCrear ? openNew : undefined}
      />

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(o) => o.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
      />

      {modalOpen && (
        <Modal title={editing ? 'Editando Operador' : 'Agregando Operador'} onClose={() => setModalOpen(false)} wide="xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-breco-500">Información general del operador</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Número">
                    <Input value={editing ? form.numero : ''} disabled placeholder="Automatico" />
                  </Field>
                  <div className="flex flex-wrap items-center gap-5 sm:col-span-2 sm:self-end sm:pb-2">
                    <label className="flex items-center gap-2 text-sm text-ink-300">
                      <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
                      Operador Activo
                    </label>
                    <label className="flex items-center gap-2 text-sm text-ink-300">
                      <input
                        type="checkbox"
                        checked={form.esPermisionario}
                        onChange={(e) => setForm({ ...form, esPermisionario: e.target.checked })}
                      />
                      Es un permisionario
                    </label>
                    <label className="flex items-center gap-2 text-sm text-ink-300">
                      <input
                        type="checkbox"
                        checked={form.esExtranjero}
                        onChange={(e) => setForm({ ...form, esExtranjero: e.target.checked })}
                      />
                      Operador Extranjero
                    </label>
                  </div>
                  <Field label="Nombre(s)">
                    <Input required value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} />
                  </Field>
                  <Field label="Apellido Paterno">
                    <Input required value={form.apellidoPaterno} onChange={(e) => setForm({ ...form, apellidoPaterno: e.target.value })} />
                  </Field>
                  <Field label="Apellido Materno">
                    <Input value={form.apellidoMaterno} onChange={(e) => setForm({ ...form, apellidoMaterno: e.target.value })} />
                  </Field>
                  <Field label="RFC">
                    <Input required value={form.rfc} onChange={(e) => setForm({ ...form, rfc: e.target.value.toUpperCase() })} />
                  </Field>
                  <Field label="CURP">
                    <Input value={form.curp} onChange={(e) => setForm({ ...form, curp: e.target.value.toUpperCase() })} />
                  </Field>
                  <Field label="Fecha de contratación">
                    <Input type="date" value={form.fechaContratacion} onChange={(e) => setForm({ ...form, fechaContratacion: e.target.value })} />
                  </Field>
                  <Field label="Sucursal">
                    <Input required value={form.sucursal} onChange={(e) => setForm({ ...form, sucursal: e.target.value })} />
                  </Field>
                  <Field label="Teléfono">
                    <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
                  </Field>
                  <Field label="Celular">
                    <Input value={form.celular} onChange={(e) => setForm({ ...form, celular: e.target.value })} />
                  </Field>
                  <Field label="Hash GMTGPS">
                    <Input value={form.hashGmtgps} onChange={(e) => setForm({ ...form, hashGmtgps: e.target.value })} />
                  </Field>
                  <Field label="Registro Patronal">
                    <Input value={form.registroPatronal} onChange={(e) => setForm({ ...form, registroPatronal: e.target.value })} />
                  </Field>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-breco-500">Foto del operador</h3>
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-line-800 bg-bg-900 p-4">
                    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-line-700 bg-bg-800">
                      {form.fotoDataUrl ? (
                        <img src={form.fotoDataUrl} alt={form.nombre || 'Operador'} className="h-full w-full object-cover" />
                      ) : (
                        <UserRound size={44} className="text-ink-600" />
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
                <Field label="Observaciones">
                  <Textarea rows={5} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
                </Field>
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-breco-500">Dirección del operador</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="País">
                  <Input required value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })} />
                </Field>
                <Field label="Estado">
                  <Select required value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                    <option value="">Selecciona...</option>
                    {ESTADOS_MEXICO.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Municipio">
                  <Input value={form.municipio} onChange={(e) => setForm({ ...form, municipio: e.target.value })} />
                </Field>
                <Field label="Localidad">
                  <Input value={form.localidad} onChange={(e) => setForm({ ...form, localidad: e.target.value })} />
                </Field>
                <Field label="C.P.">
                  <Input value={form.cp} maxLength={5} onChange={(e) => setForm({ ...form, cp: e.target.value.replace(/\D/g, '') })} />
                </Field>
                <Field label="Colonia">
                  {coloniasSugeridas.length > 0 ? (
                    <Select value={form.colonia} onChange={(e) => setForm({ ...form, colonia: e.target.value })}>
                      <option value="">Selecciona...</option>
                      {coloniasSugeridas.map((c) => (
                        <option key={c.colonia} value={c.colonia}>{c.colonia}</option>
                      ))}
                    </Select>
                  ) : (
                    <Input value={form.colonia} onChange={(e) => setForm({ ...form, colonia: e.target.value })} />
                  )}
                </Field>
                <Field label="Calle">
                  <Input value={form.calle} onChange={(e) => setForm({ ...form, calle: e.target.value })} />
                </Field>
                <Field label="No. Exterior">
                  <Input value={form.numeroExterior} onChange={(e) => setForm({ ...form, numeroExterior: e.target.value })} />
                </Field>
                <Field label="No. Interior">
                  <Input value={form.numeroInterior} onChange={(e) => setForm({ ...form, numeroInterior: e.target.value })} />
                </Field>
                <div className="sm:col-span-3">
                  <Field label="Domicilio / Referencia">
                    <Textarea rows={2} value={form.domicilioReferencia} onChange={(e) => setForm({ ...form, domicilioReferencia: e.target.value })} />
                  </Field>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-3 flex gap-1 border-b border-line-800">
                {[
                  { id: 'general' as const, label: 'Información General' },
                  { id: 'expediente' as const, label: 'Expediente' },
                  { id: 'bancaria' as const, label: 'Información bancaria' },
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
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Documentos de identidad</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Licencia">
                        <Input required value={form.licencia} onChange={(e) => setForm({ ...form, licencia: e.target.value })} />
                      </Field>
                      <Field label="Vencimiento">
                        <Input type="date" value={form.vigenciaLicencia} onChange={(e) => setForm({ ...form, vigenciaLicencia: e.target.value })} />
                      </Field>
                      <Field label="Pasaporte">
                        <Input value={form.pasaporte} onChange={(e) => setForm({ ...form, pasaporte: e.target.value })} />
                      </Field>
                      <Field label="Vencimiento">
                        <Input type="date" value={form.vigenciaPasaporte} onChange={(e) => setForm({ ...form, vigenciaPasaporte: e.target.value })} />
                      </Field>
                      <div className="col-span-2 flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-sm text-ink-300">
                          <input type="checkbox" checked={form.licenciaB} onChange={(e) => setForm({ ...form, licenciaB: e.target.checked })} />
                          Licencia B
                        </label>
                        <label className="flex items-center gap-2 text-sm text-ink-300">
                          <input type="checkbox" checked={form.licenciaC} onChange={(e) => setForm({ ...form, licenciaC: e.target.checked })} />
                          Licencia C
                        </label>
                        <label className="flex items-center gap-2 text-sm text-ink-300">
                          <input type="checkbox" checked={form.licenciaE} onChange={(e) => setForm({ ...form, licenciaE: e.target.checked })} />
                          Licencia E
                        </label>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Información médica</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="No. IMSS">
                        <Input value={form.noImss} onChange={(e) => setForm({ ...form, noImss: e.target.value })} />
                      </Field>
                      <Field label="Grupo Sanguíneo">
                        <Select value={form.grupoSanguineo} onChange={(e) => setForm({ ...form, grupoSanguineo: e.target.value })}>
                          <option value="">Selecciona...</option>
                          {GRUPOS_SANGUINEOS.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </Select>
                      </Field>
                      <div className="col-span-2">
                        <Field label="Alergias">
                          <Input value={form.alergias} onChange={(e) => setForm({ ...form, alergias: e.target.value })} />
                        </Field>
                      </div>
                      <div className="col-span-2 flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-sm text-ink-300">
                          <input type="checkbox" checked={form.diabetico} onChange={(e) => setForm({ ...form, diabetico: e.target.checked })} />
                          Diabético
                        </label>
                        <label className="flex items-center gap-2 text-sm text-ink-300">
                          <input type="checkbox" checked={form.hipertenso} onChange={(e) => setForm({ ...form, hipertenso: e.target.checked })} />
                          Hipertenso
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'expediente' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Fotos / Documentos</h4>
                    {!editing && (
                      <p className="mb-2 text-xs text-ink-600">Guarda el operador primero para poder subir documentos a su expediente.</p>
                    )}
                    {editing && (
                      <div className="flex flex-wrap items-end gap-2">
                        <Field label="Descripción">
                          <Input value={docDescripcion} onChange={(e) => setDocDescripcion(e.target.value)} placeholder="Ej. Licencia federal" />
                        </Field>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line-700 bg-bg-800 px-4 py-2 text-sm font-medium text-ink-300 hover:border-line-600 hover:text-ink-100">
                          <Upload size={15} />
                          {subiendoDoc ? 'Subiendo...' : 'Seleccionar archivo'}
                          <input
                            type="file"
                            className="hidden"
                            disabled={subiendoDoc}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadDocumento(file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    )}
                    {errorDoc && <p className="mt-2 text-sm text-breco-500">{errorDoc}</p>}
                    <div className="mt-3 overflow-hidden rounded-xl border border-line-800">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-line-800 bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                            <th className="px-3 py-2 font-medium">Descripción</th>
                            <th className="px-3 py-2 font-medium">Archivo</th>
                            <th className="px-3 py-2 font-medium">Subido</th>
                            <th className="px-3 py-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {form.documentos.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-3 py-6 text-center text-ink-600">Sin documentos cargados.</td>
                            </tr>
                          )}
                          {form.documentos.map((doc) => (
                            <tr key={doc.id} className="border-b border-line-800/70 last:border-0">
                              <td className="px-3 py-2 text-ink-200">{doc.descripcion}</td>
                              <td className="px-3 py-2 text-ink-400">{doc.nombreArchivo}</td>
                              <td className="px-3 py-2 text-ink-400">{new Date(doc.subidoEn).toLocaleDateString('es-MX')}</td>
                              <td className="px-3 py-2">
                                <div className="flex justify-end gap-1">
                                  <IconButton type="button" onClick={() => handleVerDocumento(doc)} title="Ver/Descargar">
                                    <Download size={14} />
                                  </IconButton>
                                  <IconButton type="button" onClick={() => handleEliminarDocumento(doc)} className="hover:text-breco-500" title="Eliminar">
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

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-500">Vencimientos de Documentos</h4>
                      <GhostButton type="button" onClick={() => { setVencEditIndex(null); setVencForm(emptyVencimiento); }}>
                        <Plus size={14} />
                        Agregar
                      </GhostButton>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-line-800">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-line-800 bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                            <th className="px-3 py-2 font-medium">Documento</th>
                            <th className="px-3 py-2 font-medium">Nombre</th>
                            <th className="px-3 py-2 font-medium">Vencimiento</th>
                            <th className="px-3 py-2 font-medium">Activo</th>
                            <th className="px-3 py-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {form.vencimientos.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-3 py-6 text-center text-ink-600">Sin vencimientos registrados.</td>
                            </tr>
                          )}
                          {form.vencimientos.map((v, i) => (
                            <tr key={i} className="border-b border-line-800/70 last:border-0">
                              <td className="px-3 py-2 text-ink-200">{v.documento}</td>
                              <td className="px-3 py-2 text-ink-400">{v.nombre}</td>
                              <td className="px-3 py-2 text-ink-400">{v.fecha}</td>
                              <td className="px-3 py-2 text-ink-400">{v.activo ? 'Si' : 'No'}</td>
                              <td className="px-3 py-2">
                                <div className="flex justify-end gap-1">
                                  <IconButton type="button" onClick={() => { setVencEditIndex(i); setVencForm(v); }} title="Editar">
                                    <Pencil size={14} />
                                  </IconButton>
                                  <IconButton type="button" onClick={() => eliminarVencimiento(i)} className="hover:text-breco-500">
                                    <Trash2 size={14} />
                                  </IconButton>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {vencForm && (
                      <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-line-700 bg-bg-900 p-4 sm:grid-cols-4">
                        <Field label="Documento">
                          <Input required value={vencForm.documento} onChange={(e) => setVencForm({ ...vencForm, documento: e.target.value })} />
                        </Field>
                        <Field label="Nombre">
                          <Input value={vencForm.nombre} onChange={(e) => setVencForm({ ...vencForm, nombre: e.target.value })} />
                        </Field>
                        <Field label="Vencimiento">
                          <Input type="date" required value={vencForm.fecha} onChange={(e) => setVencForm({ ...vencForm, fecha: e.target.value })} />
                        </Field>
                        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-300">
                          <input type="checkbox" checked={vencForm.activo} onChange={(e) => setVencForm({ ...vencForm, activo: e.target.checked })} />
                          Activo
                        </label>
                        <div className="flex justify-end gap-2 sm:col-span-4">
                          <GhostButton type="button" onClick={() => { setVencForm(null); setVencEditIndex(null); }}>
                            Cancelar
                          </GhostButton>
                          <PrimaryButton type="button" onClick={guardarVencimiento}>
                            Guardar
                          </PrimaryButton>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === 'bancaria' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Banco">
                    <Input value={form.banco} onChange={(e) => setForm({ ...form, banco: e.target.value })} />
                  </Field>
                  <Field label="Cuenta CLABE">
                    <Input value={form.cuentaClabe} onChange={(e) => setForm({ ...form, cuentaClabe: e.target.value })} />
                  </Field>
                  <Field label="No. Tarjeta">
                    <Input value={form.noTarjeta} onChange={(e) => setForm({ ...form, noTarjeta: e.target.value })} />
                  </Field>
                </div>
              )}
            </section>

            <div className="grid grid-cols-1 gap-4 border-t border-line-800 pt-4 sm:grid-cols-3">
              <Field label="Estatus operativo">
                <Select value={form.estatus} onChange={(e) => setForm({ ...form, estatus: e.target.value as EstatusOperador })}>
                  {estatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="flex justify-end gap-2 border-t border-line-800 pt-4">
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
