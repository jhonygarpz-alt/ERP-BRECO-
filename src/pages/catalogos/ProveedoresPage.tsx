import { useEffect, useMemo, useState } from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { mensajeDeError } from '../../lib/errors';
import { proveedorToRow } from '../../lib/mappers';
import { uid } from '../../lib/storage';
import { useColoniasPorCP } from '../../lib/useColoniasPorCP';
import type { Proveedor, ProveedorDocumento, TipoProveedor } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, IconButton, Input, PrimaryButton, Select } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const BUCKET = 'proveedor-documentos';

const ESTADOS_MEXICO = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
  'Ciudad de México', 'Coahuila de Zaragoza', 'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo',
  'Jalisco', 'México', 'Michoacán de Ocampo', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla',
  'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala',
  'Veracruz de Ignacio de la Llave', 'Yucatán', 'Zacatecas',
];

const emptyForm: Omit<Proveedor, 'id'> = {
  numero: '',
  fecha: new Date().toISOString().slice(0, 10),
  estatus: 'activo',
  tipo: 'Nacional',
  rfc: '',
  nombre: '',
  nombreCorto: '',
  esProveedorCombustible: false,
  proveedorBienes: false,
  proveedorServicios: false,
  grupo: '',
  tipoOperacion: '',
  tipoTercero: '',
  shortNameSap: '',
  pais: 'Mexico',
  estado: '',
  cp: '',
  municipio: '',
  colonia: '',
  localidad: '',
  calle: '',
  numeroExterior: '',
  numeroInterior: '',
  correo: '',
  telefonos: '',
  celular: '',
  nextel: '',
  formaPago: 'Efectivo',
  diasCredito: 0,
  limiteCreditoMxn: 0,
  limiteCreditoUsd: 0,
  banco: '',
  cuentaClabe: '',
  noCuenta: '',
  documentos: [],
};

export function ProveedoresPage() {
  const { proveedores, empresa } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Catalogos', 'crear');
  const puedeEditar = hasPermission('Catalogos', 'editar');
  const puedeEliminar = hasPermission('Catalogos', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [draftId, setDraftId] = useState('');
  const [tab, setTab] = useState<'domicilio' | 'creditos' | 'bancaria' | 'documentos'>('domicilio');
  const [error, setError] = useState('');

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
    () =>
      proveedores.items.filter((p) =>
        `${p.nombre} ${p.nombreCorto} ${p.rfc} ${p.numero}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [proveedores.items, search],
  );

  /** Numero y RFC (datos obligatorios) no se pueden repetir dentro de la misma empresa. */
  function buscarDuplicado(): string | null {
    const numero = form.numero.trim();
    const rfc = form.rfc.trim().toUpperCase();
    const otros = proveedores.items.filter((p) => p.id !== editing?.id);
    if (numero && otros.some((p) => p.numero === numero)) return `Ya existe un proveedor con el numero ${numero}.`;
    if (rfc && otros.some((p) => p.rfc.trim().toUpperCase() === rfc)) return `Ya existe un proveedor con el RFC ${rfc}.`;
    return null;
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setDraftId(uid('prov'));
    setTab('domicilio');
    setError('');
    setErrorDoc('');
    setModalOpen(true);
  }

  function openEdit(p: Proveedor) {
    setEditing(p);
    setForm(p);
    setDraftId(p.id);
    setTab('domicilio');
    setError('');
    setErrorDoc('');
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
      proveedores.update(editing.id, form);
    } else {
      proveedores.add({ id: draftId, ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(p: Proveedor) {
    if (confirm(`Eliminar al proveedor "${p.nombre}"?`)) proveedores.remove(p.id);
  }

  async function crearProveedorComoDraft(): Promise<Proveedor> {
    const nuevo: Proveedor = { ...form, id: draftId };
    const { error: errIns } = await supabase.from('proveedores').insert(proveedorToRow(nuevo) as never);
    if (errIns) throw errIns;
    setEditing(nuevo);
    setForm(nuevo);
    proveedores.reload();
    return nuevo;
  }

  async function handleUploadDocumento(file: File) {
    setSubiendoDoc(true);
    setErrorDoc('');
    let proveedor = editing;
    if (!proveedor) {
      try {
        proveedor = await crearProveedorComoDraft();
      } catch (err) {
        setSubiendoDoc(false);
        setErrorDoc(mensajeDeError(err));
        return;
      }
    }
    const path = `${empresa.value.id}/${proveedor.id}/${Date.now()}_${file.name}`;
    const { error: errUp } = await supabase.storage.from(BUCKET).upload(path, file);
    setSubiendoDoc(false);
    if (errUp) {
      setErrorDoc(mensajeDeError(errUp));
      return;
    }
    const nuevoDoc: ProveedorDocumento = {
      id: uid('doc'),
      descripcion: docDescripcion || file.name,
      storagePath: path,
      nombreArchivo: file.name,
      subidoEn: new Date().toISOString(),
    };
    const nuevos = [...form.documentos, nuevoDoc];
    setForm((f) => ({ ...f, documentos: nuevos }));
    setDocDescripcion('');
    await supabase.from('proveedores').update({ documentos: nuevos } as never).eq('id', proveedor.id);
    proveedores.reload();
  }

  async function handleVerDocumento(doc: ProveedorDocumento) {
    const { data, error: errUrl } = await supabase.storage.from(BUCKET).createSignedUrl(doc.storagePath, 60);
    if (errUrl || !data) {
      alert(mensajeDeError(errUrl) || 'No se pudo abrir el documento.');
      return;
    }
    window.open(data.signedUrl, '_blank');
  }

  async function handleEliminarDocumento(doc: ProveedorDocumento) {
    if (!editing) return;
    if (!confirm(`Eliminar el documento "${doc.descripcion}"?`)) return;
    await supabase.storage.from(BUCKET).remove([doc.storagePath]);
    const nuevos = form.documentos.filter((d) => d.id !== doc.id);
    setForm({ ...form, documentos: nuevos });
    await supabase.from('proveedores').update({ documentos: nuevos } as never).eq('id', editing.id);
    proveedores.reload();
  }

  const columns: Column<Proveedor>[] = [
    { header: 'Numero', render: (p) => <span className="font-mono text-xs text-ink-500">{p.numero}</span> },
    { header: 'RFC', render: (p) => p.rfc },
    { header: 'Nombre Fiscal', render: (p) => <span className="font-medium text-ink-100">{p.nombre}</span> },
    { header: 'Tipo', render: (p) => p.tipo },
    {
      header: 'Activo',
      render: (p) => <StatusBadge status={p.estatus === 'activo' ? 'Si' : 'No'} tone={p.estatus === 'activo' ? 'green' : 'red'} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Proveedores"
        subtitle="Proveedores de bienes y servicios de la operacion."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por numero, nombre o RFC..."
        addLabel="Agregar"
        onAdd={puedeCrear ? openNew : undefined}
      />

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(p) => p.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
      />

      {modalOpen && (
        <Modal title={editing ? 'Editando proveedor' : 'Catalogo de proveedores'} onClose={() => setModalOpen(false)} wide="xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-breco-500">Datos Generales</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <Field label="Numero Proveedor">
                  <Input value={form.numero} placeholder="Dejar en blanco para autoasignar" onChange={(e) => setForm({ ...form, numero: e.target.value })} />
                </Field>
                <Field label="Fecha">
                  <Input type="date" required value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
                </Field>
                <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-300">
                  <input
                    type="checkbox"
                    checked={form.estatus === 'activo'}
                    onChange={(e) => setForm({ ...form, estatus: e.target.checked ? 'activo' : 'inactivo' })}
                  />
                  Activo
                </label>
                <Field label="Tipo Proveedor">
                  <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoProveedor })}>
                    <option value="Nacional">Nacional</option>
                    <option value="Extranjero">Extranjero</option>
                  </Select>
                </Field>
                <div className="sm:col-span-3">
                  <Field label="RFC">
                    <Input value={form.rfc} onChange={(e) => setForm({ ...form, rfc: e.target.value.toUpperCase() })} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Nombre Fiscal">
                    <Input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Nombre Corto">
                    <Input value={form.nombreCorto} onChange={(e) => setForm({ ...form, nombreCorto: e.target.value })} />
                  </Field>
                </div>
                <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-300">
                  <input
                    type="checkbox"
                    checked={form.esProveedorCombustible}
                    onChange={(e) => setForm({ ...form, esProveedorCombustible: e.target.checked })}
                  />
                  Es Proveedor de Combustible
                </label>
                <div className="flex items-center gap-5 self-end pb-2 sm:col-span-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-ink-500">Proveedor de</span>
                  <label className="flex items-center gap-2 text-sm text-ink-300">
                    <input type="checkbox" checked={form.proveedorBienes} onChange={(e) => setForm({ ...form, proveedorBienes: e.target.checked })} />
                    Bienes
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink-300">
                    <input type="checkbox" checked={form.proveedorServicios} onChange={(e) => setForm({ ...form, proveedorServicios: e.target.checked })} />
                    Servicios
                  </label>
                </div>
                <Field label="Grupo">
                  <Input value={form.grupo} onChange={(e) => setForm({ ...form, grupo: e.target.value })} />
                </Field>
                <Field label="Tipo De Operacion">
                  <Input value={form.tipoOperacion} onChange={(e) => setForm({ ...form, tipoOperacion: e.target.value })} />
                </Field>
                <Field label="Tipo De Tercero">
                  <Input value={form.tipoTercero} onChange={(e) => setForm({ ...form, tipoTercero: e.target.value })} />
                </Field>
                <Field label="ShortName SAP">
                  <Input value={form.shortNameSap} onChange={(e) => setForm({ ...form, shortNameSap: e.target.value })} />
                </Field>
              </div>
            </section>

            <section>
              <div className="mb-3 flex gap-1 border-b border-line-800">
                {[
                  { id: 'domicilio' as const, label: 'Domicilio' },
                  { id: 'creditos' as const, label: 'Creditos' },
                  { id: 'bancaria' as const, label: 'Cuenta Bancaria' },
                  { id: 'documentos' as const, label: 'Documentos' },
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

              {tab === 'domicilio' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Pais">
                    <Input required value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })} />
                  </Field>
                  <Field label="Estado">
                    <Select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                      <option value="">Selecciona...</option>
                      {ESTADOS_MEXICO.map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Codigo Postal">
                    <Input value={form.cp} maxLength={5} onChange={(e) => setForm({ ...form, cp: e.target.value.replace(/\D/g, '') })} />
                  </Field>
                  <Field label="Municipio">
                    <Input value={form.municipio} onChange={(e) => setForm({ ...form, municipio: e.target.value })} />
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
                  <Field label="Localidad">
                    <Input value={form.localidad} onChange={(e) => setForm({ ...form, localidad: e.target.value })} />
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
                    <Field label="Correo">
                      <Input type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="Telefonos">
                    <Input value={form.telefonos} onChange={(e) => setForm({ ...form, telefonos: e.target.value })} />
                  </Field>
                  <Field label="Celular">
                    <Input value={form.celular} onChange={(e) => setForm({ ...form, celular: e.target.value })} />
                  </Field>
                  <Field label="Nextel">
                    <Input value={form.nextel} onChange={(e) => setForm({ ...form, nextel: e.target.value })} />
                  </Field>
                </div>
              )}

              {tab === 'creditos' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Forma de Pago">
                    <Select value={form.formaPago} onChange={(e) => setForm({ ...form, formaPago: e.target.value })}>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Cheque">Cheque</option>
                    </Select>
                  </Field>
                  <Field label="Dias Credito">
                    <Input type="number" min={0} value={form.diasCredito} onChange={(e) => setForm({ ...form, diasCredito: Number(e.target.value) })} />
                  </Field>
                  <Field label="Limite Credito (Pesos)">
                    <Input type="number" min={0} step="0.01" value={form.limiteCreditoMxn} onChange={(e) => setForm({ ...form, limiteCreditoMxn: Number(e.target.value) })} />
                  </Field>
                  <Field label="Limite Credito (Dolares)">
                    <Input type="number" min={0} step="0.01" value={form.limiteCreditoUsd} onChange={(e) => setForm({ ...form, limiteCreditoUsd: Number(e.target.value) })} />
                  </Field>
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
                  <Field label="No. Cuenta">
                    <Input value={form.noCuenta} onChange={(e) => setForm({ ...form, noCuenta: e.target.value })} />
                  </Field>
                </div>
              )}

              {tab === 'documentos' && (
                <div>
                  <div className="flex flex-wrap items-end gap-2">
                    <Field label="Descripción">
                      <Input value={docDescripcion} onChange={(e) => setDocDescripcion(e.target.value)} />
                    </Field>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line-700 bg-bg-800 px-4 py-2 text-sm font-medium text-ink-300 hover:border-line-600 hover:text-ink-100">
                      <Upload size={15} />
                      {subiendoDoc ? 'Subiendo...' : 'Seleccionar archivo'}
                      <input
                        type="file"
                        accept=".pdf,.zip,.rar,.7z,image/*"
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
                  {errorDoc && <p className="mt-2 text-sm text-breco-500">{errorDoc}</p>}
                  <div className="mt-3 overflow-hidden rounded-xl border border-line-800">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-line-800 bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                          <th className="px-3 py-2 font-medium">Descripción</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {form.documentos.length === 0 && (
                          <tr>
                            <td colSpan={2} className="px-3 py-6 text-center text-ink-600">No hay documentos registrados.</td>
                          </tr>
                        )}
                        {form.documentos.map((doc) => (
                          <tr key={doc.id} className="border-b border-line-800/70 last:border-0">
                            <td className="px-3 py-2 text-ink-200">{doc.descripcion}</td>
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
              )}
            </section>

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
