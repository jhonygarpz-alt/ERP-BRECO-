import { useMemo, useState } from 'react';
import { MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import { CONFIG_AUTOTRANSPORTE_SAT } from '../../lib/catalogosSat';
import type {
  Cliente,
  ClasificacionViaje,
  ConceptoFacturacion,
  Destinatario,
  Ruta,
  RutaTrayecto,
  TipoViaje,
  ViajeMaterial,
} from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { ListaSeleccionModal } from '../../components/ui/ListaSeleccionModal';
import { Field, GhostButton, IconButton, Input, PrimaryButton, Select } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';
import { TrazarRutaModal } from '../../components/viajes/TrazarRutaModal';

const UNIDADES_EMPAQUE = ['BALDES', 'CAJAS', 'TARIMAS', 'BULTOS', 'PIEZAS', 'ROLLOS', 'SACOS', 'TAMBOS'];
const UNIDADES_PESO = ['KILOGRAMOS', 'TONELADAS', 'LIBRAS'];

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

const emptyForm: Omit<Ruta, 'id'> = {
  codigo: '',
  activo: true,
  facturable: true,
  internacional: false,
  tipoOperacion: 'Importacion',
  clienteId: undefined,
  descripcion: '',
  origenId: undefined,
  destinoId: undefined,
  tipoUnidad: '',
  tipoViajeId: undefined,
  clasificacionId: undefined,
  origenDireccion: '',
  destinoDireccion: '',
  horas: 0,
  eta: '',
  kilometros: 0,
  tipoTrayecto: 'Permanente',
  trayectoLiquidable: true,
  trazoRuta: '',
  trayectos: [],
  conceptosFacturacion: [],
  materialesCarga: [],
};

const emptyTrayecto: Omit<RutaTrayecto, 'id'> = {
  secuencia: 1,
  origen: '',
  destino: '',
  kilometros: 0,
  horas: 0,
  eta: '',
  tipoTrayecto: 'Permanente',
  trazoRuta: '',
};

const emptyMaterial: Omit<ViajeMaterial, 'id'> = {
  cantidad: 0,
  unidadEmpaque: UNIDADES_EMPAQUE[0],
  descripcion: '',
  peso: 0,
  unidadPeso: UNIDADES_PESO[0],
};

export function RutasPage() {
  const { rutas, clientes, destinatarios, tiposViaje, clasificacionesViaje, conceptosFacturacion } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Catalogos', 'crear');
  const puedeEditar = hasPermission('Catalogos', 'editar');
  const puedeEliminar = hasPermission('Catalogos', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Ruta | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'trayectos' | 'conceptos' | 'mercancias'>('trayectos');

  const [clientePickerOpen, setClientePickerOpen] = useState(false);
  const [origenPickerOpen, setOrigenPickerOpen] = useState(false);
  const [destinoPickerOpen, setDestinoPickerOpen] = useState(false);
  const [tipoViajePickerOpen, setTipoViajePickerOpen] = useState(false);
  const [clasificacionPickerOpen, setClasificacionPickerOpen] = useState(false);
  const [conceptoPickerOpen, setConceptoPickerOpen] = useState(false);
  const [trazarRutaOpen, setTrazarRutaOpen] = useState(false);

  // ---- Alta rapida (sin salir del catalogo de Rutas) ----
  const emptyNuevoCliente = { nombre: '', rfc: '', tipo: 'Nacional' as Cliente['tipo'], moneda: 'MXN' as Cliente['moneda'] };
  const [nuevoClienteOpen, setNuevoClienteOpen] = useState(false);
  const [nuevoClienteForm, setNuevoClienteForm] = useState(emptyNuevoCliente);
  const [nuevoClienteError, setNuevoClienteError] = useState('');

  const emptyNuevoDestinatario = { nombre: '', rfc: '' };
  const [nuevoDestinatarioOpen, setNuevoDestinatarioOpen] = useState(false);
  const [nuevoDestinatarioDestino, setNuevoDestinatarioDestino] = useState<'origen' | 'destino'>('origen');
  const [nuevoDestinatarioForm, setNuevoDestinatarioForm] = useState(emptyNuevoDestinatario);
  const [nuevoDestinatarioError, setNuevoDestinatarioError] = useState('');

  const emptyNuevoTipoViaje = { tipoViaje: '' };
  const [nuevoTipoViajeOpen, setNuevoTipoViajeOpen] = useState(false);
  const [nuevoTipoViajeForm, setNuevoTipoViajeForm] = useState(emptyNuevoTipoViaje);
  const [nuevoTipoViajeError, setNuevoTipoViajeError] = useState('');

  const emptyNuevaClasificacion = { clasificacion: '' };
  const [nuevaClasificacionOpen, setNuevaClasificacionOpen] = useState(false);
  const [nuevaClasificacionForm, setNuevaClasificacionForm] = useState(emptyNuevaClasificacion);
  const [nuevaClasificacionError, setNuevaClasificacionError] = useState('');

  const [trayectoModalOpen, setTrayectoModalOpen] = useState(false);
  const [trayectoEditandoId, setTrayectoEditandoId] = useState<string | null>(null);
  const [trayectoForm, setTrayectoForm] = useState<Omit<RutaTrayecto, 'id'>>(emptyTrayecto);
  const [trayectoSeleccionadoId, setTrayectoSeleccionadoId] = useState<string | null>(null);
  const [trazarTrayectoOpen, setTrazarTrayectoOpen] = useState(false);

  const [materialForm, setMaterialForm] = useState<Omit<ViajeMaterial, 'id'>>(emptyMaterial);

  const emptyConceptoLinea = {
    conceptoFacturacionId: '',
    concepto: '',
    unidadMedida: '',
    importe: 0,
    traslada: '',
    retiene: '',
    importeIsr: 0,
  };
  const [conceptoLineaForm, setConceptoLineaForm] = useState(emptyConceptoLinea);

  const filtered = useMemo(
    () =>
      rutas.items.filter(
        (r) => r.descripcion.toLowerCase().includes(search.toLowerCase()) || r.codigo.toLowerCase().includes(search.toLowerCase()),
      ),
    [rutas.items, search],
  );

  function siguienteCodigo(): string {
    const numeros = rutas.items.map((r) => parseInt(r.codigo, 10)).filter((n) => !Number.isNaN(n));
    return String((numeros.length ? Math.max(...numeros) : 0) + 1);
  }

  function buscarDuplicado(): string | null {
    const codigo = form.codigo.trim();
    const otras = rutas.items.filter((r) => r.id !== editing?.id);
    if (codigo && otras.some((r) => r.codigo.trim() === codigo)) return `Ya existe una ruta con el codigo "${codigo}".`;
    return null;
  }

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, codigo: siguienteCodigo() });
    setError('');
    setTab('trayectos');
    setTrayectoSeleccionadoId(null);
    setModalOpen(true);
  }

  function openEdit(r: Ruta) {
    setEditing(r);
    setForm(r);
    setError('');
    setTab('trayectos');
    setTrayectoSeleccionadoId(null);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const duplicado = buscarDuplicado();
    if (duplicado) {
      setError(duplicado);
      return;
    }
    if (!form.descripcion.trim()) {
      setError('Falta la Descripcion de la ruta.');
      return;
    }
    setError('');
    if (editing) {
      rutas.update(editing.id, form);
    } else {
      rutas.add({ id: uid('rt'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(r: Ruta) {
    if (confirm(`Eliminar la ruta "${r.descripcion}"?`)) rutas.remove(r.id);
  }

  // ---- Alta rapida de cliente ----
  function abrirNuevoCliente() {
    setNuevoClienteForm(emptyNuevoCliente);
    setNuevoClienteError('');
    setClientePickerOpen(false);
    setNuevoClienteOpen(true);
  }

  function guardarNuevoCliente() {
    const nombre = nuevoClienteForm.nombre.trim();
    const rfc = nuevoClienteForm.rfc.trim().toUpperCase();
    if (!nombre) {
      setNuevoClienteError('Falta el Nombre Fiscal.');
      return;
    }
    if (rfc && clientes.items.some((c) => c.rfc.trim().toUpperCase() === rfc)) {
      setNuevoClienteError(`Ya existe un cliente con el RFC ${rfc}.`);
      return;
    }
    const nuevoId = uid('cli');
    clientes.add({
      id: nuevoId,
      numeroCliente: '',
      nombre,
      nombreCorto: '',
      fechaAlta: new Date().toISOString().slice(0, 10),
      rfc,
      tipo: nuevoClienteForm.tipo,
      moneda: nuevoClienteForm.moneda,
      iva: 'IVA 16%',
      grupo: '',
      sucursal: 'Matriz',
      estatus: 'activo',
      operadorLogistico: false,
      aplicarDetalleViajeXml: false,
      pais: 'Mexico',
      cp: '',
      estado: '',
      municipio: '',
      colonia: '',
      localidad: '',
      calle: '',
      numeroExterior: '',
      numeroInterior: '',
      telefonos: '',
      celular: '',
      correo: '',
      contactos: [],
      formaPago: 'Efectivo',
      diasCredito: 0,
      limiteCreditoMxn: 0,
      limiteCreditoUsd: 0,
      limitarViajes: false,
      limiteFacturasVencidas: null,
      bancoOrdenante: '',
      bancoOrdenanteExtranjero: false,
      bancoRfc: '',
      bancoNoCuenta: '',
    });
    setForm((f) => ({ ...f, clienteId: nuevoId }));
    setNuevoClienteOpen(false);
  }

  // ---- Alta rapida de destinatario (Origen / Destino) ----
  function abrirNuevoDestinatario(destino: 'origen' | 'destino') {
    setNuevoDestinatarioDestino(destino);
    setNuevoDestinatarioForm(emptyNuevoDestinatario);
    setNuevoDestinatarioError('');
    setOrigenPickerOpen(false);
    setDestinoPickerOpen(false);
    setNuevoDestinatarioOpen(true);
  }

  function guardarNuevoDestinatario() {
    const nombre = nuevoDestinatarioForm.nombre.trim();
    if (!nombre) {
      setNuevoDestinatarioError('Falta el Nombre.');
      return;
    }
    const nuevoId = uid('dest');
    destinatarios.add({
      id: nuevoId,
      numero: '',
      rfc: nuevoDestinatarioForm.rfc.trim().toUpperCase(),
      noEquivalencia: '',
      nombre,
      estatus: 'activo',
      esPatio: false,
      clienteId: undefined,
      pais: 'Mexico',
      estado: '',
      municipio: '',
      cp: '',
      localidad: '',
      colonia: '',
      calle: '',
      numeroExterior: '',
      numeroInterior: '',
      telefono: '',
      contacto: '',
      correo: '',
    });
    const campo = nuevoDestinatarioDestino === 'origen' ? 'origenId' : 'destinoId';
    setForm((f) => ({ ...f, [campo]: nuevoId }));
    setNuevoDestinatarioOpen(false);
  }

  // ---- Alta rapida de Tipo de Viaje ----
  function abrirNuevoTipoViaje() {
    setNuevoTipoViajeForm(emptyNuevoTipoViaje);
    setNuevoTipoViajeError('');
    setTipoViajePickerOpen(false);
    setNuevoTipoViajeOpen(true);
  }

  function guardarNuevoTipoViaje() {
    const tipoViaje = nuevoTipoViajeForm.tipoViaje.trim();
    if (!tipoViaje) {
      setNuevoTipoViajeError('Falta el Tipo de Viaje.');
      return;
    }
    const nuevoId = uid('tpv');
    tiposViaje.add({ id: nuevoId, codigo: '', tipoViaje, activo: true });
    setForm((f) => ({ ...f, tipoViajeId: nuevoId }));
    setNuevoTipoViajeOpen(false);
  }

  // ---- Alta rapida de Clasificacion ----
  function abrirNuevaClasificacion() {
    setNuevaClasificacionForm(emptyNuevaClasificacion);
    setNuevaClasificacionError('');
    setClasificacionPickerOpen(false);
    setNuevaClasificacionOpen(true);
  }

  function guardarNuevaClasificacion() {
    const clasificacion = nuevaClasificacionForm.clasificacion.trim();
    if (!clasificacion) {
      setNuevaClasificacionError('Falta la Clasificacion.');
      return;
    }
    const nuevoId = uid('clv');
    clasificacionesViaje.add({ id: nuevoId, codigo: '', clasificacion, activo: true });
    setForm((f) => ({ ...f, clasificacionId: nuevoId }));
    setNuevaClasificacionOpen(false);
  }

  // ---- Trayectos ----
  function abrirNuevoTrayecto() {
    setTrayectoEditandoId(null);
    setTrayectoForm({ ...emptyTrayecto, secuencia: form.trayectos.length + 1 });
    setTrayectoModalOpen(true);
  }

  function abrirConsultarTrayecto() {
    const t = form.trayectos.find((tr) => tr.id === trayectoSeleccionadoId);
    if (!t) return;
    setTrayectoEditandoId(t.id);
    setTrayectoForm(t);
    setTrayectoModalOpen(true);
  }

  function guardarTrayecto() {
    if (trayectoEditandoId) {
      setForm((f) => ({
        ...f,
        trayectos: f.trayectos.map((t) => (t.id === trayectoEditandoId ? { id: t.id, ...trayectoForm } : t)),
      }));
    } else {
      setForm((f) => ({ ...f, trayectos: [...f.trayectos, { id: uid('rtt'), ...trayectoForm }] }));
    }
    setTrayectoModalOpen(false);
  }

  function eliminarTrayectoSeleccionado() {
    if (!trayectoSeleccionadoId) return;
    setForm((f) => ({ ...f, trayectos: f.trayectos.filter((t) => t.id !== trayectoSeleccionadoId) }));
    setTrayectoSeleccionadoId(null);
  }

  // ---- Mercancias ----
  function agregarMaterial() {
    if (!materialForm.descripcion.trim() && !materialForm.cantidad) return;
    setForm((f) => ({ ...f, materialesCarga: [...f.materialesCarga, { id: uid('mat'), ...materialForm }] }));
    setMaterialForm(emptyMaterial);
  }

  function eliminarMaterial(id: string) {
    setForm((f) => ({ ...f, materialesCarga: f.materialesCarga.filter((m) => m.id !== id) }));
  }

  // ---- Conceptos de facturacion ----
  function seleccionarConcepto(c: ConceptoFacturacion) {
    const trasladaPredeterminado = c.traslados.find((t) => t.predeterminado)?.impuesto ?? '';
    const retienePredeterminado = c.retenciones.find((t) => t.predeterminado)?.impuesto ?? '';
    setConceptoLineaForm({
      conceptoFacturacionId: c.id,
      concepto: c.concepto,
      unidadMedida: c.unidadMedida,
      importe: 0,
      traslada: trasladaPredeterminado,
      retiene: retienePredeterminado,
      importeIsr: 0,
    });
    setConceptoPickerOpen(false);
  }

  function agregarConceptoLinea() {
    if (!conceptoLineaForm.conceptoFacturacionId) return;
    setForm((f) => ({ ...f, conceptosFacturacion: [...f.conceptosFacturacion, { id: uid('cfr'), ...conceptoLineaForm }] }));
    setConceptoLineaForm(emptyConceptoLinea);
  }

  function eliminarConceptoLinea(id: string) {
    setForm((f) => ({ ...f, conceptosFacturacion: f.conceptosFacturacion.filter((c) => c.id !== id) }));
  }

  const totalConceptos = useMemo(
    () => form.conceptosFacturacion.reduce((acc, c) => acc + (c.importe || 0), 0),
    [form.conceptosFacturacion],
  );
  const conceptoOpcionesTraslada = useMemo(() => {
    const c = conceptosFacturacion.items.find((x) => x.id === conceptoLineaForm.conceptoFacturacionId);
    return c ? c.traslados.filter((t) => t.aplica) : [];
  }, [conceptosFacturacion.items, conceptoLineaForm.conceptoFacturacionId]);
  const conceptoOpcionesRetiene = useMemo(() => {
    const c = conceptosFacturacion.items.find((x) => x.id === conceptoLineaForm.conceptoFacturacionId);
    return c ? c.retenciones.filter((t) => t.aplica) : [];
  }, [conceptosFacturacion.items, conceptoLineaForm.conceptoFacturacionId]);

  const clienteSeleccionado = clientes.items.find((c) => c.id === form.clienteId);
  const origenSeleccionado = destinatarios.items.find((d) => d.id === form.origenId);
  const destinoSeleccionado = destinatarios.items.find((d) => d.id === form.destinoId);
  const tipoViajeSeleccionado = tiposViaje.items.find((t) => t.id === form.tipoViajeId);
  const clasificacionSeleccionada = clasificacionesViaje.items.find((c) => c.id === form.clasificacionId);

  const columns: Column<Ruta>[] = [
    { header: 'Folio', render: (r) => r.codigo },
    { header: 'Descripcion', render: (r) => r.descripcion },
    { header: 'Cliente', render: (r) => clientes.items.find((c) => c.id === r.clienteId)?.nombre ?? '—' },
    { header: 'Kilometros', render: (r) => r.kilometros },
    { header: 'Activo', render: (r) => <StatusBadge status={r.activo ? 'Si' : 'No'} tone={r.activo ? 'green' : 'red'} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Rutas"
        subtitle="Rutas y tarifas reutilizables: al elegirlas en un viaje, precargan sus trayectos, conceptos y mercancias."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar ruta..."
        addLabel="Agregar"
        onAdd={puedeCrear ? openNew : undefined}
      />

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(r) => r.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
        emptyMessage="No hay rutas registradas."
      />

      {modalOpen && (
        <Modal title={editing ? 'Editando Ruta/Tarifa' : 'Agregando Ruta/Tarifa'} onClose={() => setModalOpen(false)} wide="xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3 rounded-xl border border-line-800 bg-bg-900 p-4">
              <h3 className="text-center text-xs font-semibold uppercase tracking-wide text-ink-300">Informacion general de la ruta</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="w-24">
                  <Field label="Folio Ruta">
                    <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
                  </Field>
                </div>
                <label className="flex items-center gap-2 pt-6 text-sm text-ink-300">
                  <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
                  Ruta Activa
                </label>
                <label className="flex items-center gap-2 pt-6 text-sm text-ink-300">
                  <input
                    type="checkbox"
                    checked={form.facturable}
                    onChange={(e) => setForm({ ...form, facturable: e.target.checked })}
                  />
                  Viaje Facturable
                </label>
                <label className="flex items-center gap-2 pt-6 text-sm text-ink-300">
                  <input
                    type="checkbox"
                    checked={form.internacional}
                    onChange={(e) => setForm({ ...form, internacional: e.target.checked })}
                  />
                  Viaje Internacional
                </label>
                <div className="col-span-2 flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 text-sm text-ink-300">
                    <input
                      type="radio"
                      checked={form.tipoOperacion === 'Importacion'}
                      onChange={() => setForm({ ...form, tipoOperacion: 'Importacion' })}
                    />
                    Importacion
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink-300">
                    <input
                      type="radio"
                      checked={form.tipoOperacion === 'Exportacion'}
                      onChange={() => setForm({ ...form, tipoOperacion: 'Exportacion' })}
                    />
                    Exportacion
                  </label>
                </div>
              </div>

              <Field label="Cliente">
                <div className="flex gap-2">
                  <Input readOnly className="flex-1" value={clienteSeleccionado?.nombre ?? ''} placeholder="Sin cliente" />
                  <GhostButton type="button" onClick={() => setClientePickerOpen(true)}>
                    <MoreHorizontal size={16} />
                  </GhostButton>
                </div>
              </Field>

              <Field label="Descripcion">
                <Input required value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Origen">
                  <div className="flex gap-2">
                    <Input readOnly className="flex-1" value={origenSeleccionado?.nombre ?? ''} placeholder="Sin asignar" />
                    <GhostButton type="button" onClick={() => setOrigenPickerOpen(true)}>
                      <MoreHorizontal size={16} />
                    </GhostButton>
                  </div>
                </Field>
                <Field label="Destino">
                  <div className="flex gap-2">
                    <Input readOnly className="flex-1" value={destinoSeleccionado?.nombre ?? ''} placeholder="Sin asignar" />
                    <GhostButton type="button" onClick={() => setDestinoPickerOpen(true)}>
                      <MoreHorizontal size={16} />
                    </GhostButton>
                  </div>
                </Field>
              </div>

              <Field label="Tipo Unidad">
                <Select value={form.tipoUnidad} onChange={(e) => setForm({ ...form, tipoUnidad: e.target.value })}>
                  <option value="">Todos los tipos de unidades</option>
                  {CONFIG_AUTOTRANSPORTE_SAT.map((c) => (
                    <option key={c.clave} value={c.clave}>
                      {c.descripcion}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Tipo de Viaje">
                  <div className="flex gap-2">
                    <Input readOnly className="flex-1" value={tipoViajeSeleccionado?.tipoViaje ?? ''} placeholder="Sin asignar" />
                    <GhostButton type="button" onClick={() => setTipoViajePickerOpen(true)}>
                      <MoreHorizontal size={16} />
                    </GhostButton>
                  </div>
                </Field>
                <Field label="Clasificacion">
                  <div className="flex gap-2">
                    <Input readOnly className="flex-1" value={clasificacionSeleccionada?.clasificacion ?? ''} placeholder="Sin asignar" />
                    <GhostButton type="button" onClick={() => setClasificacionPickerOpen(true)}>
                      <MoreHorizontal size={16} />
                    </GhostButton>
                  </div>
                </Field>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-line-800 bg-bg-900 p-4">
              <h3 className="text-center text-xs font-semibold uppercase tracking-wide text-ink-300">Origen y Destino del Trayecto</h3>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Field label="Origen">
                    <Input value={form.origenDireccion} onChange={(e) => setForm({ ...form, origenDireccion: e.target.value })} />
                  </Field>
                </div>
                <div className="flex-1">
                  <Field label="Destino">
                    <Input value={form.destinoDireccion} onChange={(e) => setForm({ ...form, destinoDireccion: e.target.value })} />
                  </Field>
                </div>
                <PrimaryButton type="button" onClick={() => setTrazarRutaOpen(true)}>
                  Trazar Ruta
                </PrimaryButton>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Horas">
                  <Input readOnly value={form.horas} />
                </Field>
                <Field label="ETA">
                  <Input value={form.eta} onChange={(e) => setForm({ ...form, eta: e.target.value })} />
                </Field>
                <Field label="Kilometros">
                  <Input readOnly value={form.kilometros} />
                </Field>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-xs font-medium uppercase tracking-wide text-ink-500">Tipo Trayecto:</span>
                <label className="flex items-center gap-2 text-sm text-ink-300">
                  <input
                    type="radio"
                    checked={form.tipoTrayecto === 'Permanente'}
                    onChange={() => setForm({ ...form, tipoTrayecto: 'Permanente' })}
                  />
                  Permanente
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-300">
                  <input
                    type="radio"
                    checked={form.tipoTrayecto === 'Eventual'}
                    onChange={() => setForm({ ...form, tipoTrayecto: 'Eventual' })}
                  />
                  Eventual
                </label>
                <label className="ml-auto flex items-center gap-2 text-sm text-ink-300">
                  <input
                    type="checkbox"
                    checked={form.trayectoLiquidable}
                    onChange={(e) => setForm({ ...form, trayectoLiquidable: e.target.checked })}
                  />
                  Trayecto liquidable
                </label>
              </div>
            </div>

            <div className="flex gap-1 border-b border-line-800">
              {[
                { id: 'trayectos' as const, label: 'Trayectos' },
                { id: 'conceptos' as const, label: 'Conceptos de Facturacion' },
                { id: 'mercancias' as const, label: 'Mercancias' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
                    tab === t.id ? 'bg-breco-500 text-white' : 'text-ink-400 hover:text-ink-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'trayectos' && (
              <div className="space-y-3 rounded-b-xl rounded-tr-xl border border-line-800 bg-bg-900 p-4">
                <div className="flex flex-wrap gap-2">
                  <PrimaryButton type="button" onClick={abrirNuevoTrayecto}>
                    Agregar
                  </PrimaryButton>
                  <GhostButton type="button" disabled={!trayectoSeleccionadoId} onClick={abrirConsultarTrayecto}>
                    Modificar
                  </GhostButton>
                  <GhostButton type="button" disabled={!trayectoSeleccionadoId} onClick={abrirConsultarTrayecto}>
                    Consultar
                  </GhostButton>
                  <GhostButton type="button" disabled={!trayectoSeleccionadoId} onClick={eliminarTrayectoSeleccionado}>
                    Eliminar
                  </GhostButton>
                </div>
                <div className="overflow-hidden rounded-xl border border-line-800">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">Secuencia</th>
                        <th className="px-3 py-2 font-medium">Origen</th>
                        <th className="px-3 py-2 font-medium">Destino</th>
                        <th className="px-3 py-2 font-medium">Kilometros</th>
                        <th className="px-3 py-2 font-medium">Horas</th>
                        <th className="px-3 py-2 font-medium">ETA</th>
                        <th className="px-3 py-2 font-medium">Tipo Trayecto</th>
                        <th className="px-3 py-2 font-medium">Trazo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.trayectos.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-3 py-6 text-center text-ink-600">
                            Sin trayectos agregados.
                          </td>
                        </tr>
                      )}
                      {form.trayectos.map((t) => (
                        <tr
                          key={t.id}
                          onClick={() => setTrayectoSeleccionadoId(t.id)}
                          className={`cursor-pointer border-t border-line-800/70 ${
                            trayectoSeleccionadoId === t.id ? 'bg-breco-500/10' : 'hover:bg-bg-800'
                          }`}
                        >
                          <td className="px-3 py-2 text-ink-300">{t.secuencia}</td>
                          <td className="px-3 py-2 text-ink-300">{t.origen}</td>
                          <td className="px-3 py-2 text-ink-300">{t.destino}</td>
                          <td className="px-3 py-2 text-ink-300">{t.kilometros}</td>
                          <td className="px-3 py-2 text-ink-300">{t.horas}</td>
                          <td className="px-3 py-2 text-ink-300">{t.eta}</td>
                          <td className="px-3 py-2 text-ink-300">{t.tipoTrayecto}</td>
                          <td className="px-3 py-2 text-ink-500">{t.trazoRuta ? 'Si' : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'conceptos' && (
              <div className="space-y-3 rounded-b-xl rounded-tr-xl border border-line-800 bg-bg-900 p-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-6">
                  <Field label="Concepto de Facturacion">
                    <div className="flex gap-2">
                      <Input readOnly className="w-16" value={conceptoLineaForm.conceptoFacturacionId ? '...' : ''} />
                      <GhostButton type="button" onClick={() => setConceptoPickerOpen(true)}>
                        <MoreHorizontal size={16} />
                      </GhostButton>
                    </div>
                    {conceptoLineaForm.concepto && <p className="mt-1 text-xs text-ink-400">{conceptoLineaForm.concepto}</p>}
                  </Field>
                  <Field label="Unidad de Medida">
                    <Input
                      value={conceptoLineaForm.unidadMedida}
                      onChange={(e) => setConceptoLineaForm({ ...conceptoLineaForm, unidadMedida: e.target.value })}
                    />
                  </Field>
                  <Field label="Importe">
                    <Input
                      type="number"
                      step="0.01"
                      value={conceptoLineaForm.importe || ''}
                      onChange={(e) => setConceptoLineaForm({ ...conceptoLineaForm, importe: Number(e.target.value) || 0 })}
                    />
                  </Field>
                  <Field label="Traslada">
                    <Select
                      value={conceptoLineaForm.traslada}
                      onChange={(e) => setConceptoLineaForm({ ...conceptoLineaForm, traslada: e.target.value })}
                    >
                      <option value="">-</option>
                      {conceptoOpcionesTraslada.map((t) => (
                        <option key={t.impuesto} value={t.impuesto}>
                          {t.impuesto}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Retiene">
                    <Select
                      value={conceptoLineaForm.retiene}
                      onChange={(e) => setConceptoLineaForm({ ...conceptoLineaForm, retiene: e.target.value })}
                    >
                      <option value="">-</option>
                      {conceptoOpcionesRetiene.map((t) => (
                        <option key={t.impuesto} value={t.impuesto}>
                          {t.impuesto}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <div className="flex items-end gap-2">
                    <Field label="Importe ISR">
                      <Input
                        type="number"
                        step="0.01"
                        value={conceptoLineaForm.importeIsr || ''}
                        onChange={(e) => setConceptoLineaForm({ ...conceptoLineaForm, importeIsr: Number(e.target.value) || 0 })}
                      />
                    </Field>
                    <IconButton
                      type="button"
                      title="Agregar concepto"
                      onClick={agregarConceptoLinea}
                      className="mb-0.5 text-emerald-500 hover:text-emerald-400"
                    >
                      <Plus size={20} />
                    </IconButton>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-line-800">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">Concepto</th>
                        <th className="px-3 py-2 font-medium">Unidad</th>
                        <th className="px-3 py-2 font-medium">Importe</th>
                        <th className="px-3 py-2 font-medium">Traslada</th>
                        <th className="px-3 py-2 font-medium">Retiene</th>
                        <th className="px-3 py-2 font-medium">ISR</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {form.conceptosFacturacion.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-3 py-6 text-center text-ink-600">
                            No hay conceptos agregados.
                          </td>
                        </tr>
                      )}
                      {form.conceptosFacturacion.map((c) => (
                        <tr key={c.id} className="border-t border-line-800/70">
                          <td className="px-3 py-2 text-ink-300">{c.concepto}</td>
                          <td className="px-3 py-2 text-ink-300">{c.unidadMedida}</td>
                          <td className="px-3 py-2 text-ink-300">{money(c.importe)}</td>
                          <td className="px-3 py-2 text-ink-300">{c.traslada}</td>
                          <td className="px-3 py-2 text-ink-300">{c.retiene}</td>
                          <td className="px-3 py-2 text-ink-300">{money(c.importeIsr)}</td>
                          <td className="px-3 py-2">
                            <IconButton type="button" onClick={() => eliminarConceptoLinea(c.id)} className="hover:text-breco-500">
                              <Trash2 size={14} />
                            </IconButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <div className="w-48">
                    <Field label="Total">
                      <Input readOnly value={money(totalConceptos)} />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {tab === 'mercancias' && (
              <div className="grid grid-cols-1 gap-4 rounded-b-xl rounded-tr-xl border border-line-800 bg-bg-900 p-4 sm:grid-cols-2">
                <div className="rounded-xl border border-line-800">
                  <div className="bg-bg-700/60 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-300">
                    Descripciones / Materiales Carga
                  </div>
                  <div className="space-y-3 p-3">
                    <Field label="Cantidad">
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={materialForm.cantidad || ''}
                          onChange={(e) => setMaterialForm({ ...materialForm, cantidad: Number(e.target.value) || 0 })}
                        />
                        <Select
                          value={materialForm.unidadEmpaque}
                          onChange={(e) => setMaterialForm({ ...materialForm, unidadEmpaque: e.target.value })}
                        >
                          {UNIDADES_EMPAQUE.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </Field>
                    <Field label="Descripcion Material Carga">
                      <Input
                        value={materialForm.descripcion}
                        onChange={(e) => setMaterialForm({ ...materialForm, descripcion: e.target.value })}
                      />
                    </Field>
                    <Field label="Peso">
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={materialForm.peso || ''}
                          onChange={(e) => setMaterialForm({ ...materialForm, peso: Number(e.target.value) || 0 })}
                        />
                        <Select
                          value={materialForm.unidadPeso}
                          onChange={(e) => setMaterialForm({ ...materialForm, unidadPeso: e.target.value })}
                        >
                          {UNIDADES_PESO.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </Field>
                    <div className="flex justify-end">
                      <PrimaryButton type="button" onClick={agregarMaterial}>
                        Agregar
                      </PrimaryButton>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-line-800">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">Cant.</th>
                        <th className="px-3 py-2 font-medium">Descripcion</th>
                        <th className="px-3 py-2 font-medium">Peso</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {form.materialesCarga.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-ink-600">
                            No hay materiales agregados.
                          </td>
                        </tr>
                      )}
                      {form.materialesCarga.map((m) => (
                        <tr key={m.id} className="border-t border-line-800/70">
                          <td className="px-3 py-2 text-ink-300">
                            {m.cantidad} {m.unidadEmpaque}
                          </td>
                          <td className="px-3 py-2 text-ink-300">{m.descripcion}</td>
                          <td className="px-3 py-2 text-ink-300">
                            {m.peso} {m.unidadPeso}
                          </td>
                          <td className="px-3 py-2">
                            <IconButton type="button" onClick={() => eliminarMaterial(m.id)} className="hover:text-breco-500">
                              <Trash2 size={14} />
                            </IconButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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

      {trazarRutaOpen && (
        <TrazarRutaModal
          origenInicial={form.origenDireccion}
          destinoInicial={form.destinoDireccion}
          onConfirmar={(datos) => {
            setForm((f) => ({ ...f, ...datos }));
            setTrazarRutaOpen(false);
          }}
          onClose={() => setTrazarRutaOpen(false)}
        />
      )}

      {clientePickerOpen && (
        <ListaSeleccionModal<Cliente>
          title="Buscar Cliente"
          items={clientes.items}
          filtro={(c, t) => `${c.nombre} ${c.numeroCliente} ${c.rfc}`.toLowerCase().includes(t)}
          renderRow={(c) => (
            <>
              <td className="px-3 py-2 font-mono text-xs text-ink-500">{c.numeroCliente}</td>
              <td className="px-3 py-2 text-ink-200">{c.nombre}</td>
            </>
          )}
          onSelect={(c) => {
            setForm((f) => ({ ...f, clienteId: c.id }));
            setClientePickerOpen(false);
          }}
          onClose={() => setClientePickerOpen(false)}
          accionExtra={{ label: 'Agregar Cliente', onClick: abrirNuevoCliente }}
        />
      )}

      {origenPickerOpen && (
        <ListaSeleccionModal<Destinatario>
          title="Buscar Origen"
          items={destinatarios.items}
          filtro={(d, t) => `${d.nombre} ${d.numero}`.toLowerCase().includes(t)}
          renderRow={(d) => (
            <>
              <td className="px-3 py-2 font-mono text-xs text-ink-500">{d.numero}</td>
              <td className="px-3 py-2 text-ink-200">{d.nombre}</td>
            </>
          )}
          onSelect={(d) => {
            setForm((f) => ({ ...f, origenId: d.id }));
            setOrigenPickerOpen(false);
          }}
          onClose={() => setOrigenPickerOpen(false)}
          accionExtra={{ label: 'Agregar Origen', onClick: () => abrirNuevoDestinatario('origen') }}
        />
      )}

      {destinoPickerOpen && (
        <ListaSeleccionModal<Destinatario>
          title="Buscar Destino"
          items={destinatarios.items}
          filtro={(d, t) => `${d.nombre} ${d.numero}`.toLowerCase().includes(t)}
          renderRow={(d) => (
            <>
              <td className="px-3 py-2 font-mono text-xs text-ink-500">{d.numero}</td>
              <td className="px-3 py-2 text-ink-200">{d.nombre}</td>
            </>
          )}
          onSelect={(d) => {
            setForm((f) => ({ ...f, destinoId: d.id }));
            setDestinoPickerOpen(false);
          }}
          onClose={() => setDestinoPickerOpen(false)}
          accionExtra={{ label: 'Agregar Destino', onClick: () => abrirNuevoDestinatario('destino') }}
        />
      )}

      {tipoViajePickerOpen && (
        <ListaSeleccionModal<TipoViaje>
          title="Buscar Tipo de Viaje"
          items={tiposViaje.items.filter((t) => t.activo)}
          filtro={(t, term) => `${t.codigo} ${t.tipoViaje}`.toLowerCase().includes(term)}
          renderRow={(t) => (
            <>
              <td className="px-3 py-2 font-mono text-xs text-ink-500">{t.codigo}</td>
              <td className="px-3 py-2 text-ink-200">{t.tipoViaje}</td>
            </>
          )}
          onSelect={(t) => {
            setForm((f) => ({ ...f, tipoViajeId: t.id }));
            setTipoViajePickerOpen(false);
          }}
          onClose={() => setTipoViajePickerOpen(false)}
          accionExtra={{ label: 'Agregar Tipo de Viaje', onClick: abrirNuevoTipoViaje }}
        />
      )}

      {clasificacionPickerOpen && (
        <ListaSeleccionModal<ClasificacionViaje>
          title="Buscar Clasificacion"
          items={clasificacionesViaje.items.filter((c) => c.activo)}
          filtro={(c, t) => `${c.codigo} ${c.clasificacion}`.toLowerCase().includes(t)}
          renderRow={(c) => (
            <>
              <td className="px-3 py-2 font-mono text-xs text-ink-500">{c.codigo}</td>
              <td className="px-3 py-2 text-ink-200">{c.clasificacion}</td>
            </>
          )}
          onSelect={(c) => {
            setForm((f) => ({ ...f, clasificacionId: c.id }));
            setClasificacionPickerOpen(false);
          }}
          onClose={() => setClasificacionPickerOpen(false)}
          accionExtra={{ label: 'Agregar Clasificacion', onClick: abrirNuevaClasificacion }}
        />
      )}

      {conceptoPickerOpen && (
        <ListaSeleccionModal<ConceptoFacturacion>
          title="Buscar Concepto de Facturacion"
          items={conceptosFacturacion.items.filter((c) => c.activo)}
          filtro={(c, t) => `${c.codigo} ${c.concepto}`.toLowerCase().includes(t)}
          renderRow={(c) => (
            <>
              <td className="px-3 py-2 font-mono text-xs text-ink-500">{c.codigo}</td>
              <td className="px-3 py-2 text-ink-200">{c.concepto}</td>
            </>
          )}
          onSelect={seleccionarConcepto}
          onClose={() => setConceptoPickerOpen(false)}
        />
      )}

      {trayectoModalOpen && (
        <Modal title={trayectoEditandoId ? 'Editando Trayecto' : 'Agregando Trayecto'} onClose={() => setTrayectoModalOpen(false)}>
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Field label="Origen">
                  <Input value={trayectoForm.origen} onChange={(e) => setTrayectoForm({ ...trayectoForm, origen: e.target.value })} />
                </Field>
              </div>
              <div className="flex-1">
                <Field label="Destino">
                  <Input value={trayectoForm.destino} onChange={(e) => setTrayectoForm({ ...trayectoForm, destino: e.target.value })} />
                </Field>
              </div>
              <PrimaryButton type="button" onClick={() => setTrazarTrayectoOpen(true)}>
                Trazar Ruta
              </PrimaryButton>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Kilometros">
                <Input readOnly value={trayectoForm.kilometros} />
              </Field>
              <Field label="Horas">
                <Input readOnly value={trayectoForm.horas} />
              </Field>
              <Field label="ETA">
                <Input value={trayectoForm.eta} onChange={(e) => setTrayectoForm({ ...trayectoForm, eta: e.target.value })} />
              </Field>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-500">Tipo Trayecto:</span>
              <label className="flex items-center gap-2 text-sm text-ink-300">
                <input
                  type="radio"
                  checked={trayectoForm.tipoTrayecto === 'Permanente'}
                  onChange={() => setTrayectoForm({ ...trayectoForm, tipoTrayecto: 'Permanente' })}
                />
                Permanente
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-300">
                <input
                  type="radio"
                  checked={trayectoForm.tipoTrayecto === 'Eventual'}
                  onChange={() => setTrayectoForm({ ...trayectoForm, tipoTrayecto: 'Eventual' })}
                />
                Eventual
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-line-800 pt-4">
              <GhostButton type="button" onClick={() => setTrayectoModalOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="button" onClick={guardarTrayecto}>
                Guardar
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}

      {trazarTrayectoOpen && (
        <TrazarRutaModal
          origenInicial={trayectoForm.origen}
          destinoInicial={trayectoForm.destino}
          onConfirmar={(datos) => {
            setTrayectoForm((f) => ({
              ...f,
              origen: datos.origenDireccion,
              destino: datos.destinoDireccion,
              kilometros: datos.kilometros,
              horas: datos.horas,
              trazoRuta: datos.trazoRuta,
            }));
            setTrazarTrayectoOpen(false);
          }}
          onClose={() => setTrazarTrayectoOpen(false)}
        />
      )}

      {nuevoClienteOpen && (
        <Modal title="Agregando Cliente" onClose={() => setNuevoClienteOpen(false)}>
          <div className="space-y-4">
            <Field label="Nombre Fiscal">
              <Input
                required
                autoFocus
                value={nuevoClienteForm.nombre}
                onChange={(e) => setNuevoClienteForm({ ...nuevoClienteForm, nombre: e.target.value })}
              />
            </Field>
            <Field label="RFC">
              <Input
                value={nuevoClienteForm.rfc}
                onChange={(e) => setNuevoClienteForm({ ...nuevoClienteForm, rfc: e.target.value.toUpperCase() })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo Cliente">
                <Select
                  value={nuevoClienteForm.tipo}
                  onChange={(e) => setNuevoClienteForm({ ...nuevoClienteForm, tipo: e.target.value as Cliente['tipo'] })}
                >
                  <option value="Nacional">Nacional</option>
                  <option value="Extranjero">Extranjero</option>
                </Select>
              </Field>
              <Field label="Moneda">
                <Select
                  value={nuevoClienteForm.moneda}
                  onChange={(e) => setNuevoClienteForm({ ...nuevoClienteForm, moneda: e.target.value as Cliente['moneda'] })}
                >
                  <option value="MXN">Pesos</option>
                  <option value="USD">Dolares</option>
                </Select>
              </Field>
            </div>
            <p className="text-xs text-ink-500">El resto de los datos del cliente se completan despues en el catalogo de Clientes.</p>
            <div className="flex items-center justify-end gap-3 border-t border-line-800 pt-4">
              {nuevoClienteError && <p className="flex-1 text-sm text-breco-500">{nuevoClienteError}</p>}
              <GhostButton type="button" onClick={() => setNuevoClienteOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="button" onClick={guardarNuevoCliente}>
                Aceptar
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}

      {nuevoDestinatarioOpen && (
        <Modal
          title={nuevoDestinatarioDestino === 'origen' ? 'Agregando Origen' : 'Agregando Destino'}
          onClose={() => setNuevoDestinatarioOpen(false)}
        >
          <div className="space-y-4">
            <Field label="Nombre">
              <Input
                required
                autoFocus
                value={nuevoDestinatarioForm.nombre}
                onChange={(e) => setNuevoDestinatarioForm({ ...nuevoDestinatarioForm, nombre: e.target.value })}
              />
            </Field>
            <Field label="RFC">
              <Input
                value={nuevoDestinatarioForm.rfc}
                onChange={(e) => setNuevoDestinatarioForm({ ...nuevoDestinatarioForm, rfc: e.target.value.toUpperCase() })}
              />
            </Field>
            <p className="text-xs text-ink-500">
              El domicilio y demas datos se completan despues en el catalogo de Destinatarios.
            </p>
            <div className="flex items-center justify-end gap-3 border-t border-line-800 pt-4">
              {nuevoDestinatarioError && <p className="flex-1 text-sm text-breco-500">{nuevoDestinatarioError}</p>}
              <GhostButton type="button" onClick={() => setNuevoDestinatarioOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="button" onClick={guardarNuevoDestinatario}>
                Aceptar
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}

      {nuevoTipoViajeOpen && (
        <Modal title="Agregando Tipo de Viaje" onClose={() => setNuevoTipoViajeOpen(false)}>
          <div className="space-y-4">
            <Field label="Tipo de Viaje">
              <Input
                required
                autoFocus
                value={nuevoTipoViajeForm.tipoViaje}
                onChange={(e) => setNuevoTipoViajeForm({ tipoViaje: e.target.value })}
              />
            </Field>
            <div className="flex items-center justify-end gap-3 border-t border-line-800 pt-4">
              {nuevoTipoViajeError && <p className="flex-1 text-sm text-breco-500">{nuevoTipoViajeError}</p>}
              <GhostButton type="button" onClick={() => setNuevoTipoViajeOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="button" onClick={guardarNuevoTipoViaje}>
                Aceptar
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}

      {nuevaClasificacionOpen && (
        <Modal title="Agregando Clasificacion de Viaje" onClose={() => setNuevaClasificacionOpen(false)}>
          <div className="space-y-4">
            <Field label="Clasificacion">
              <Input
                required
                autoFocus
                value={nuevaClasificacionForm.clasificacion}
                onChange={(e) => setNuevaClasificacionForm({ clasificacion: e.target.value })}
              />
            </Field>
            <div className="flex items-center justify-end gap-3 border-t border-line-800 pt-4">
              {nuevaClasificacionError && <p className="flex-1 text-sm text-breco-500">{nuevaClasificacionError}</p>}
              <GhostButton type="button" onClick={() => setNuevaClasificacionOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="button" onClick={guardarNuevaClasificacion}>
                Aceptar
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
