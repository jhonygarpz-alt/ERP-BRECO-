import { useMemo, useState } from 'react';
import { Ban, ChevronLeft, ChevronRight, Copy, Eye, MoreHorizontal, Pencil, Plus, Printer, ScanLine, Trash2 } from 'lucide-react';
import { useData } from '../lib/DataContext';
import { useAuth } from '../lib/AuthContext';
import { uid } from '../lib/storage';
import type { Caja, Cliente, ConceptoFacturacion, Ruta, Unidad, Viaje, ViajeMaterial, ViajeTrayecto } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { CrudTable, type Column } from '../components/ui/CrudTable';
import { Modal } from '../components/ui/Modal';
import { ListaSeleccionModal } from '../components/ui/ListaSeleccionModal';
import { ComboBoxCodigo } from '../components/ui/ComboBoxCodigo';
import { Field, GhostButton, IconButton, Input, PrimaryButton, Select, Textarea, ToolbarButton, inputClass } from '../components/ui/form';
import { StatusBadge, TONE_DOT, TONES, type Tone } from '../components/ui/Badge';
import { ImportarProgramaModal } from '../components/viajes/ImportarProgramaModal';
import { TrazarRutaModal } from '../components/viajes/TrazarRutaModal';
import { hoyISO, fechaLocal } from '../lib/fechas';

const COLORES_DISPONIBLES = Object.keys(TONES) as Tone[];
const UNIDADES_EMPAQUE = ['BALDES', 'CAJAS', 'TARIMAS', 'BULTOS', 'PIEZAS', 'ROLLOS', 'SACOS', 'TAMBOS'];
const UNIDADES_PESO = ['KILOGRAMOS', 'TONELADAS', 'LIBRAS'];

function nextFolio(viajes: Viaje[]) {
  const max = viajes.reduce((acc, v) => {
    const n = Number(v.folio.split('-')[1] ?? 0);
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `V-${String(max + 1).padStart(4, '0')}`;
}

function shiftDate(date: string, dias: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return fechaLocal(d);
}

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

const emptyTrayecto: Omit<ViajeTrayecto, 'id'> = {
  operadorId: '',
  unidadId: '',
  origen: '',
  destino: '',
  cvR1: '',
  cvR2: '',
};

const emptyMaterial: Omit<ViajeMaterial, 'id'> = {
  cantidad: 0,
  unidadEmpaque: UNIDADES_EMPAQUE[0],
  descripcion: '',
  peso: 0,
  unidadPeso: UNIDADES_PESO[0],
};

export function ViajesPage() {
  const { viajes, clientes, unidades, operadores, cajas, rutas, estatusViajes, conceptosFacturacion, facturas, formatosImpresion } =
    useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Viajes', 'crear');
  const puedeEditar = hasPermission('Viajes', 'editar');
  const puedeEliminar = hasPermission('Viajes', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [importarOpen, setImportarOpen] = useState(false);
  const [editing, setEditing] = useState<Viaje | null>(null);
  const [soloLectura, setSoloLectura] = useState(false);
  const [viajeSeleccionadoId, setViajeSeleccionadoId] = useState<string | null>(null);
  const [imprimirFormatoOpen, setImprimirFormatoOpen] = useState(false);
  const [fecha, setFecha] = useState(hoyISO());
  const [todasLasFechas, setTodasLasFechas] = useState(false);
  const [nuevoEstatusOpen, setNuevoEstatusOpen] = useState(false);
  const [nuevoEstatusNombre, setNuevoEstatusNombre] = useState('');
  const [nuevoEstatusColor, setNuevoEstatusColor] = useState<Tone>('blue');
  const [editarColorOpen, setEditarColorOpen] = useState(false);
  const [tab, setTab] = useState<'general' | 'mercancias' | 'conceptos'>('general');

  const emptyForm = (): Omit<Viaje, 'id'> => ({
    folio: nextFolio(viajes.items),
    fecha: hoyISO(),
    clienteId: '',
    unidadId: '',
    operadorId: '',
    materiales: '',
    cajaNombre: '',
    cajaEconomico: '',
    origen: '',
    destino: '',
    horaSalida: '',
    horaLlegadaEstimada: '',
    cita: '',
    importacion: false,
    exportacion: false,
    estatus: 'Programado',
    observaciones: '',
    ubicacionActual: '',
    sucursal: 'MA',
    loadNumber: '',
    moneda: 'PESOS',
    tipoCambio: 1,
    rutaCodigo: '',
    rutaDescripcion: '',
    facturable: true,
    kilometros: 0,
    item: '',
    planta: '',
    convenio: '',
    candadoOficial: '',
    estatusFecha: hoyISO(),
    estatusHora: new Date().toTimeString().slice(0, 5),
    fechaCarga: '',
    horaCarga: '',
    cargarEn: '',
    identificador: '',
    fechaEntrega: '',
    horaEntregaReal: '',
    descargarEn: '',
    remolque1Id: undefined,
    dollyId: undefined,
    remolque2Id: undefined,
    trayectos: [],
    materialesCarga: [],
    pesoCargaTotal: 0,
    pesoCargaUnidad: 'KILOGRAMOS',
    conceptosFacturacionViaje: [],
  });

  const [form, setForm] = useState<Omit<Viaje, 'id'>>(emptyForm);

  // ---- Selectores (modales de busqueda) ----
  const [clientePickerOpen, setClientePickerOpen] = useState(false);
  const [remolque1PickerOpen, setRemolque1PickerOpen] = useState(false);
  const [dollyPickerOpen, setDollyPickerOpen] = useState(false);
  const [remolque2PickerOpen, setRemolque2PickerOpen] = useState(false);
  const [conceptoPickerOpen, setConceptoPickerOpen] = useState(false);
  const [rutaPickerOpen, setRutaPickerOpen] = useState(false);
  const [unidadPickerOpen, setUnidadPickerOpen] = useState(false);

  // ---- Alta rapida de cliente (sin salir de la asignacion del viaje) ----
  const emptyNuevoCliente = { nombre: '', rfc: '', tipo: 'Nacional' as Cliente['tipo'], moneda: 'MXN' as Cliente['moneda'] };
  const [nuevoClienteOpen, setNuevoClienteOpen] = useState(false);
  const [nuevoClienteForm, setNuevoClienteForm] = useState(emptyNuevoCliente);
  const [nuevoClienteError, setNuevoClienteError] = useState('');

  // ---- Alta rapida de remolque/dolly ----
  const emptyNuevaCaja = { economico: '', placas: '', marca: '', modelo: '' };
  const [nuevaCajaOpen, setNuevaCajaOpen] = useState(false);
  const [nuevaCajaDestino, setNuevaCajaDestino] = useState<'remolque1' | 'dolly' | 'remolque2'>('remolque1');
  const [nuevaCajaForm, setNuevaCajaForm] = useState(emptyNuevaCaja);
  const [nuevaCajaError, setNuevaCajaError] = useState('');

  // ---- Alta rapida de unidad ----
  const emptyNuevaUnidad = { economico: '', placas: '', marca: '', modelo: '' };
  const [nuevaUnidadOpen, setNuevaUnidadOpen] = useState(false);
  const [nuevaUnidadForm, setNuevaUnidadForm] = useState(emptyNuevaUnidad);
  const [nuevaUnidadError, setNuevaUnidadError] = useState('');

  // ---- Alta rapida de ruta ----
  const emptyNuevaRuta = {
    descripcion: '',
    clienteId: '' as string,
    origenDireccion: '',
    destinoDireccion: '',
    kilometros: 0,
    horas: 0,
    trazoRuta: '',
  };
  const [nuevaRutaOpen, setNuevaRutaOpen] = useState(false);
  const [nuevaRutaForm, setNuevaRutaForm] = useState(emptyNuevaRuta);
  const [nuevaRutaError, setNuevaRutaError] = useState('');
  const [nuevaRutaTrazarOpen, setNuevaRutaTrazarOpen] = useState(false);

  // ---- Convoy / trayectos ----
  const [trayectoModalOpen, setTrayectoModalOpen] = useState(false);
  const [trayectoEditandoId, setTrayectoEditandoId] = useState<string | null>(null);
  const [trayectoForm, setTrayectoForm] = useState<Omit<ViajeTrayecto, 'id'>>(emptyTrayecto);
  const [trayectoSeleccionadoId, setTrayectoSeleccionadoId] = useState<string | null>(null);

  // ---- Mercancias ----
  const [materialForm, setMaterialForm] = useState<Omit<ViajeMaterial, 'id'>>(emptyMaterial);

  // ---- Conceptos de facturacion del viaje ----
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

  const clienteNombre = (id: string) => clientes.items.find((c) => c.id === id)?.nombre ?? 'N/D';
  const unidadNombre = (id: string) => unidades.items.find((u) => u.id === id)?.economico ?? 'N/D';
  const operadorNombre = (id: string) => operadores.items.find((o) => o.id === id)?.nombre ?? 'N/D';

  const filtered = useMemo(
    () =>
      viajes.items
        .filter((v) => todasLasFechas || v.fecha === fecha)
        .filter((v) =>
          `${v.folio} ${v.loadNumber} ${clienteNombre(v.clienteId)} ${v.origen} ${v.destino} ${unidadNombre(v.unidadId)}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viajes.items, search, fecha, todasLasFechas, clientes.items, unidades.items],
  );

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setTab('general');
    setTrayectoSeleccionadoId(null);
    setSoloLectura(false);
    setModalOpen(true);
  }

  function openEdit(v: Viaje) {
    setEditing(v);
    setForm(v);
    setTab('general');
    setTrayectoSeleccionadoId(null);
    setSoloLectura(false);
    setModalOpen(true);
  }

  function seleccionarFilaViaje(v: Viaje) {
    setViajeSeleccionadoId((id) => (id === v.id ? null : v.id));
  }

  const viajeSeleccionado = filtered.find((v) => v.id === viajeSeleccionadoId) ?? null;

  function abrirConsultarViajeSeleccionado() {
    if (!viajeSeleccionado) return;
    setEditing(viajeSeleccionado);
    setForm(viajeSeleccionado);
    setTab('general');
    setTrayectoSeleccionadoId(null);
    setSoloLectura(true);
    setModalOpen(true);
  }

  function editarViajeSeleccionado() {
    if (!viajeSeleccionado) return;
    openEdit(viajeSeleccionado);
  }

  function clonarViajeSeleccionado() {
    if (!viajeSeleccionado) return;
    const { id: _idOriginal, ...resto } = viajeSeleccionado;
    setEditing(null);
    setForm({
      ...resto,
      folio: nextFolio(viajes.items),
      loadNumber: '',
      estatus: 'Programado',
      estatusFecha: hoyISO(),
      estatusHora: new Date().toTimeString().slice(0, 5),
      trayectos: resto.trayectos.map((t) => ({ ...t, id: uid('tr') })),
      materialesCarga: resto.materialesCarga.map((m) => ({ ...m, id: uid('mat') })),
      conceptosFacturacionViaje: resto.conceptosFacturacionViaje.map((c) => ({ ...c, id: uid('cfv') })),
    });
    setTab('general');
    setTrayectoSeleccionadoId(null);
    setSoloLectura(false);
    setModalOpen(true);
  }

  function cancelarViajeSeleccionado() {
    if (!viajeSeleccionado) return;
    if (!confirm(`Cancelar el viaje "${viajeSeleccionado.folio}"? Su estatus quedara como Cancelado.`)) return;
    viajes.update(viajeSeleccionado.id, {
      estatus: 'Cancelado',
      estatusFecha: hoyISO(),
      estatusHora: new Date().toTimeString().slice(0, 5),
    });
    setViajeSeleccionadoId(null);
  }

  const formatosViajeHabilitados = formatosImpresion.items.filter((f) => f.area === 'Viajes' && f.activo);

  function imprimirViajeSeleccionado() {
    if (!viajeSeleccionado) return;
    setImprimirFormatoOpen(true);
  }

  function imprimirConFormato(clave: string) {
    if (!viajeSeleccionado) return;
    window.open(`#/viajes/imprimir/${viajeSeleccionado.id}?modo=${clave}`, '_blank');
    setImprimirFormatoOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (soloLectura) {
      setModalOpen(false);
      return;
    }
    const primerTrayecto = form.trayectos[0];
    const remolquePrincipal = cajas.items.find((c) => c.id === form.remolque1Id);
    const payload: Omit<Viaje, 'id'> = {
      ...form,
      operadorId: primerTrayecto?.operadorId || form.operadorId,
      unidadId: primerTrayecto?.unidadId || form.unidadId,
      origen: primerTrayecto?.origen || form.origen,
      destino: primerTrayecto?.destino || form.destino,
      cajaEconomico: remolquePrincipal?.economico || form.cajaEconomico,
      cajaNombre: remolquePrincipal?.marca || form.cajaNombre,
    };
    if (editing) {
      viajes.update(editing.id, payload);
    } else {
      viajes.add({ id: uid('via'), ...payload });
    }
    setModalOpen(false);
  }

  function handleDelete(v: Viaje) {
    if (confirm(`Eliminar el viaje "${v.folio}"?`)) viajes.remove(v.id);
  }

  function estatusTono(nombre: string): Tone | null {
    return (estatusViajes.items.find((e) => e.nombre === nombre)?.color as Tone | undefined) ?? null;
  }

  async function handleAgregarEstatus() {
    const nombre = nuevoEstatusNombre.trim();
    if (!nombre) return;
    const existente = estatusViajes.items.find((e) => e.nombre.toLowerCase() === nombre.toLowerCase());
    if (existente) {
      if (existente.color !== nuevoEstatusColor) {
        await estatusViajes.update(existente.id, { color: nuevoEstatusColor });
      }
    } else {
      await estatusViajes.add({
        id: uid('est'),
        nombre,
        color: nuevoEstatusColor,
        activo: true,
        esCarga: false,
        esDescarga: false,
        esTerminoDescarga: false,
      });
    }
    setForm((f) => ({
      ...f,
      estatus: nombre,
      estatusFecha: hoyISO(),
      estatusHora: new Date().toTimeString().slice(0, 5),
    }));
    setNuevoEstatusOpen(false);
    setNuevoEstatusNombre('');
  }

  async function handleCambiarColorActual(color: Tone) {
    const actual = estatusViajes.items.find((e) => e.nombre === form.estatus);
    if (actual) await estatusViajes.update(actual.id, { color });
    setEditarColorOpen(false);
  }

  function cambiarEstatus(nombre: string) {
    setForm((f) => ({
      ...f,
      estatus: nombre,
      estatusFecha: hoyISO(),
      estatusHora: new Date().toTimeString().slice(0, 5),
    }));
  }

  // ---- Convoy / trayectos ----
  function abrirNuevoTrayecto() {
    setTrayectoEditandoId(null);
    setTrayectoForm(emptyTrayecto);
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
      setForm((f) => ({ ...f, trayectos: [...f.trayectos, { id: uid('tr'), ...trayectoForm }] }));
    }
    setTrayectoModalOpen(false);
  }

  function eliminarTrayectoSeleccionado() {
    if (!trayectoSeleccionadoId) return;
    setForm((f) => ({ ...f, trayectos: f.trayectos.filter((t) => t.id !== trayectoSeleccionadoId) }));
    setTrayectoSeleccionadoId(null);
  }

  // La Ruta funciona como plantilla: al elegirla se copian sus trayectos,
  // conceptos de facturacion y mercancias precargados.
  function seleccionarRuta(r: Ruta) {
    const trayectosCopiados: ViajeTrayecto[] = r.trayectos.map((t) => ({
      id: uid('tr'),
      operadorId: '',
      unidadId: '',
      origen: t.origen,
      destino: t.destino,
      cvR1: '',
      cvR2: '',
    }));
    const conceptosCopiados = r.conceptosFacturacion.map((c) => ({ ...c, id: uid('cfv') }));
    const materialesCopiados = r.materialesCarga.map((m) => ({ ...m, id: uid('mat') }));
    setForm((f) => ({
      ...f,
      rutaCodigo: r.codigo,
      rutaDescripcion: r.descripcion,
      kilometros: r.kilometros || f.kilometros,
      clienteId: f.clienteId || r.clienteId || '',
      trayectos: trayectosCopiados.length > 0 ? trayectosCopiados : f.trayectos,
      conceptosFacturacionViaje: conceptosCopiados.length > 0 ? conceptosCopiados : f.conceptosFacturacionViaje,
      materialesCarga: materialesCopiados.length > 0 ? materialesCopiados : f.materialesCarga,
      pesoCargaTotal:
        materialesCopiados.length > 0 ? materialesCopiados.reduce((acc, m) => acc + (m.peso || 0), 0) : f.pesoCargaTotal,
    }));
    setRutaPickerOpen(false);
  }

  // ---- Mercancias ----
  function agregarMaterial() {
    if (!materialForm.descripcion.trim() && !materialForm.cantidad) return;
    const nuevos = [...form.materialesCarga, { id: uid('mat'), ...materialForm }];
    const pesoTotal = nuevos.reduce((acc, m) => acc + (m.peso || 0), 0);
    setForm((f) => ({ ...f, materialesCarga: nuevos, pesoCargaTotal: pesoTotal }));
    setMaterialForm(emptyMaterial);
  }

  function eliminarMaterial(id: string) {
    const nuevos = form.materialesCarga.filter((m) => m.id !== id);
    const pesoTotal = nuevos.reduce((acc, m) => acc + (m.peso || 0), 0);
    setForm((f) => ({ ...f, materialesCarga: nuevos, pesoCargaTotal: pesoTotal }));
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
    setForm((f) => ({
      ...f,
      conceptosFacturacionViaje: [...f.conceptosFacturacionViaje, { id: uid('cfv'), ...conceptoLineaForm }],
    }));
    setConceptoLineaForm(emptyConceptoLinea);
  }

  function eliminarConceptoLinea(id: string) {
    setForm((f) => ({ ...f, conceptosFacturacionViaje: f.conceptosFacturacionViaje.filter((c) => c.id !== id) }));
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
      fechaAlta: hoyISO(),
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

  // ---- Alta rapida de remolque/dolly ----
  function abrirNuevaCaja(destino: 'remolque1' | 'dolly' | 'remolque2') {
    setNuevaCajaDestino(destino);
    setNuevaCajaForm(emptyNuevaCaja);
    setNuevaCajaError('');
    setRemolque1PickerOpen(false);
    setDollyPickerOpen(false);
    setRemolque2PickerOpen(false);
    setNuevaCajaOpen(true);
  }

  function guardarNuevaCaja() {
    const economico = nuevaCajaForm.economico.trim();
    if (!economico) {
      setNuevaCajaError('Falta el Codigo.');
      return;
    }
    if (cajas.items.some((c) => c.economico.trim() === economico)) {
      setNuevaCajaError(`Ya existe un remolque con el codigo ${economico}.`);
      return;
    }
    const nuevoId = uid('caj');
    cajas.add({
      id: nuevoId,
      economico,
      placas: nuevaCajaForm.placas,
      tipo: '',
      capacidad: '',
      estatus: 'Disponible',
      marca: nuevaCajaForm.marca,
      modelo: nuevaCajaForm.modelo,
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
      grupoUnidades: nuevaCajaDestino === 'dolly' ? 'DOLLY' : '',
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
      propietario: '',
      ubicacion: '',
      estadoCarga: 'Vacio',
    });
    const campo = nuevaCajaDestino === 'remolque1' ? 'remolque1Id' : nuevaCajaDestino === 'dolly' ? 'dollyId' : 'remolque2Id';
    setForm((f) => ({ ...f, [campo]: nuevoId }));
    setNuevaCajaOpen(false);
  }

  // ---- Alta rapida de unidad ----
  function abrirNuevaUnidad() {
    setNuevaUnidadForm(emptyNuevaUnidad);
    setNuevaUnidadError('');
    setUnidadPickerOpen(false);
    setNuevaUnidadOpen(true);
  }

  function guardarNuevaUnidad() {
    const economico = nuevaUnidadForm.economico.trim();
    if (!economico) {
      setNuevaUnidadError('Falta el Codigo.');
      return;
    }
    if (unidades.items.some((u) => u.economico.trim() === economico)) {
      setNuevaUnidadError(`Ya existe una unidad con el codigo ${economico}.`);
      return;
    }
    const nuevoId = uid('uni');
    unidades.add({
      id: nuevoId,
      economico,
      placas: nuevaUnidadForm.placas,
      tipo: '',
      marca: nuevaUnidadForm.marca,
      modelo: nuevaUnidadForm.modelo,
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
      propietario: '',
      ubicacion: '',
      estadoCarga: 'Vacio',
      kilometrajeActual: 0,
    });
    setTrayectoForm((f) => ({ ...f, unidadId: nuevoId }));
    setNuevaUnidadOpen(false);
  }

  // ---- Alta rapida de ruta ----
  function abrirNuevaRuta() {
    setNuevaRutaForm(emptyNuevaRuta);
    setNuevaRutaError('');
    setRutaPickerOpen(false);
    setNuevaRutaOpen(true);
  }

  function guardarNuevaRuta() {
    const descripcion = nuevaRutaForm.descripcion.trim();
    if (!descripcion) {
      setNuevaRutaError('Falta la descripcion de la ruta.');
      return;
    }
    const nuevaRuta: Ruta = {
      id: uid('rt'),
      codigo: '',
      activo: true,
      facturable: true,
      internacional: false,
      tipoOperacion: 'Importacion',
      clienteId: nuevaRutaForm.clienteId || undefined,
      descripcion,
      origenId: undefined,
      destinoId: undefined,
      tipoUnidad: '',
      tipoViajeId: undefined,
      clasificacionId: undefined,
      origenDireccion: nuevaRutaForm.origenDireccion,
      destinoDireccion: nuevaRutaForm.destinoDireccion,
      horas: nuevaRutaForm.horas,
      eta: '',
      kilometros: nuevaRutaForm.kilometros,
      tipoTrayecto: 'Permanente',
      trayectoLiquidable: true,
      trazoRuta: nuevaRutaForm.trazoRuta,
      trayectos: [],
      conceptosFacturacion: [],
      materialesCarga: [],
    };
    rutas.add(nuevaRuta);
    seleccionarRuta(nuevaRuta);
    setNuevaRutaOpen(false);
  }

  const totalConceptos = useMemo(
    () => form.conceptosFacturacionViaje.reduce((acc, c) => acc + (c.importe || 0), 0),
    [form.conceptosFacturacionViaje],
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
  const creditoDisponible = useMemo(() => {
    if (!clienteSeleccionado) return 0;
    const saldoPendiente = facturas.items
      .filter((f) => f.clienteId === clienteSeleccionado.id && f.estatus !== 'Pagado' && f.estatus !== 'Cancelado')
      .reduce((acc, f) => acc + f.importe, 0);
    return clienteSeleccionado.limiteCreditoMxn - saldoPendiente;
  }, [clienteSeleccionado, facturas.items]);

  const remolque1 = cajas.items.find((c) => c.id === form.remolque1Id);
  const dolly = cajas.items.find((c) => c.id === form.dollyId);
  const remolque2 = cajas.items.find((c) => c.id === form.remolque2Id);

  const columns: Column<Viaje>[] = [
    {
      header: 'Folio / Fecha',
      render: (v) => (
        <div>
          <div className="font-medium text-ink-100">{v.folio}</div>
          <div className="text-xs text-ink-600">
            {v.fecha} {v.horaSalida}
          </div>
        </div>
      ),
    },
    { header: 'Numero de Viaje del Cliente', render: (v) => v.loadNumber || '—' },
    { header: 'Unidad', render: (v) => unidadNombre(v.unidadId) },
    { header: 'Cliente', render: (v) => clienteNombre(v.clienteId) },
    { header: 'Ruta', render: (v) => `${v.origen} -> ${v.destino}` },
    {
      header: 'Materiales / Caja',
      render: (v) => (
        <div className="text-xs">
          {v.materiales || '—'}
          <br />
          {v.cajaNombre} {v.cajaEconomico}
        </div>
      ),
    },
    { header: 'Operador', render: (v) => operadorNombre(v.operadorId) },
    {
      header: 'Imp / Exp',
      render: (v) => (
        <div className="flex gap-1">
          {v.importacion && <span className="rounded border border-line-700 px-1.5 py-0.5 text-[11px] text-ink-400">IMP</span>}
          {v.exportacion && <span className="rounded border border-line-700 px-1.5 py-0.5 text-[11px] text-ink-400">EXP</span>}
        </div>
      ),
    },
    { header: 'Estatus', render: (v) => <StatusBadge status={v.estatus} tone={estatusTono(v.estatus)} /> },
  ];

  const tabs: { id: 'general' | 'mercancias' | 'conceptos'; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'mercancias', label: 'Mercancias' },
    { id: 'conceptos', label: 'Conceptos Facturacion' },
  ];

  return (
    <div>
      <PageHeader
        title="Asignacion de Viajes"
        subtitle="Asigna cliente, unidad, caja y operador a cada viaje."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por folio, load number, unidad, cliente o ruta..."
        addLabel="Asignar viaje"
        onAdd={puedeCrear ? openNew : undefined}
        extra={
          puedeCrear && (
            <ToolbarButton type="button" onClick={() => setImportarOpen(true)}>
              <ScanLine size={16} />
              Importar Excel o captura
            </ToolbarButton>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFecha((f) => shiftDate(f, -1))}
          disabled={todasLasFechas}
          className="rounded-lg border border-blue-400/50 bg-blue-400/5 p-2 text-blue-400 transition hover:border-blue-400 hover:bg-blue-400/10 disabled:cursor-not-allowed disabled:border-line-700 disabled:bg-transparent disabled:text-ink-600"
        >
          <ChevronLeft size={16} />
        </button>
        <input
          type="date"
          value={fecha}
          disabled={todasLasFechas}
          onChange={(e) => setFecha(e.target.value)}
          className={`${inputClass} w-44 border-blue-400/50 focus:border-blue-400 disabled:opacity-40`}
        />
        <button
          onClick={() => setFecha((f) => shiftDate(f, 1))}
          disabled={todasLasFechas}
          className="rounded-lg border border-blue-400/50 bg-blue-400/5 p-2 text-blue-400 transition hover:border-blue-400 hover:bg-blue-400/10 disabled:cursor-not-allowed disabled:border-line-700 disabled:bg-transparent disabled:text-ink-600"
        >
          <ChevronRight size={16} />
        </button>
        <ToolbarButton
          type="button"
          disabled={todasLasFechas}
          onClick={() => setFecha(hoyISO())}
        >
          Hoy
        </ToolbarButton>
        <label className="ml-2 flex items-center gap-2 text-sm text-ink-400">
          <input
            type="checkbox"
            checked={todasLasFechas}
            onChange={(e) => setTodasLasFechas(e.target.checked)}
            className="h-4 w-4 rounded border-line-600 bg-bg-900 accent-breco-500"
          />
          Ver todas las fechas
        </label>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-line-800 bg-bg-900 p-2">
        <span className="px-2 text-xs uppercase tracking-wide text-ink-500">
          {viajeSeleccionado ? `Viaje ${viajeSeleccionado.folio}` : 'Selecciona un viaje de la tabla'}
        </span>
        <ToolbarButton type="button" disabled={!viajeSeleccionado} onClick={abrirConsultarViajeSeleccionado}>
          <Eye size={16} /> Consultar Viaje
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!viajeSeleccionado} onClick={imprimirViajeSeleccionado}>
          <Printer size={16} /> Imprimir Viaje
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!viajeSeleccionado || !puedeEditar} onClick={editarViajeSeleccionado}>
          <Pencil size={16} /> Editar Viaje
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!viajeSeleccionado || !puedeCrear} onClick={clonarViajeSeleccionado}>
          <Copy size={16} /> Clonar Viaje
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!viajeSeleccionado || !puedeEditar} onClick={cancelarViajeSeleccionado}>
          <Ban size={16} /> Cancelar Viaje
        </ToolbarButton>
      </div>

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(v) => v.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
        selectedKey={viajeSeleccionadoId}
        onRowClick={seleccionarFilaViaje}
      />

      {modalOpen && (
        <Modal
          title={soloLectura ? `Consultando Viaje ${editing?.folio ?? ''}` : editing ? `Editando Viaje ${editing.folio}` : 'Agregando Viaje'}
          onClose={() => setModalOpen(false)}
          wide="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={soloLectura} className="space-y-4">
            {/* ---- Encabezado ---- */}
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-line-800 bg-bg-900 p-4 sm:grid-cols-5">
              <Field label="Sucursal">
                <Input value={form.sucursal} onChange={(e) => setForm({ ...form, sucursal: e.target.value })} />
              </Field>
              <Field label="Numero de Viaje del Cliente">
                <Input value={form.loadNumber} onChange={(e) => setForm({ ...form, loadNumber: e.target.value })} />
              </Field>
              <Field label="Fecha">
                <Input type="date" required value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
              </Field>
              <Field label="Moneda">
                <Select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })}>
                  <option value="PESOS">PESOS</option>
                  <option value="DOLARES">DOLARES</option>
                </Select>
              </Field>
              <Field label="Tipo de Cambio">
                <Input
                  type="number"
                  step="0.0001"
                  value={form.tipoCambio}
                  onChange={(e) => setForm({ ...form, tipoCambio: Number(e.target.value) || 0 })}
                />
              </Field>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-line-800 bg-bg-900 p-4 sm:flex-row sm:items-end">
              <div className="flex flex-1 gap-2">
                <div className="w-28">
                  <Field label="Nro Cliente">
                    <ComboBoxCodigo<Cliente>
                      items={clientes.items}
                      valor={clienteSeleccionado?.numeroCliente ?? ''}
                      obtenerCodigo={(c) => c.numeroCliente}
                      obtenerEtiqueta={(c) => c.nombre}
                      onSeleccionar={(c) => setForm((f) => ({ ...f, clienteId: c.id }))}
                      onLimpiar={() => setForm((f) => ({ ...f, clienteId: '' }))}
                    />
                  </Field>
                </div>
                <div className="flex-1">
                  <Field label=" ">
                    <Input value={clienteSeleccionado?.nombre ?? ''} readOnly placeholder="Sin cliente asignado" />
                  </Field>
                </div>
                <ToolbarButton type="button" title="Buscar cliente" onClick={() => setClientePickerOpen(true)} className="mb-0.5">
                  <MoreHorizontal size={16} />
                </ToolbarButton>
              </div>
              <div className="w-40">
                <Field label="Credito Disponible">
                  <Input readOnly value={clienteSeleccionado ? money(creditoDisponible) : money(0)} />
                </Field>
              </div>
            </div>

            {/* ---- Pestanas ---- */}
            <div className="flex gap-1 border-b border-line-800">
              {tabs.map((t) => (
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

            {tab === 'general' && (
              <div className="space-y-4 rounded-b-xl rounded-tr-xl border border-line-800 bg-bg-900 p-4">
                <div className="space-y-3">
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Field label="Ruta">
                          <div className="flex gap-2">
                            <ComboBoxCodigo<Ruta>
                              className="w-20"
                              items={rutas.items.filter((r) => r.activo)}
                              valor={form.rutaCodigo}
                              obtenerCodigo={(r) => r.codigo}
                              obtenerEtiqueta={(r) => r.descripcion}
                              onSeleccionar={seleccionarRuta}
                              onLimpiar={() => setForm((f) => ({ ...f, rutaCodigo: '', rutaDescripcion: '' }))}
                            />
                            <ToolbarButton type="button" onClick={() => setRutaPickerOpen(true)}>
                              <MoreHorizontal size={16} />
                            </ToolbarButton>
                            <Input className="flex-1" readOnly value={form.rutaDescripcion} />
                          </div>
                        </Field>
                      </div>
                      <label className="mb-2 flex items-center gap-2 whitespace-nowrap text-sm text-ink-300">
                        <input
                          type="checkbox"
                          checked={form.facturable}
                          onChange={(e) => setForm({ ...form, facturable: e.target.checked })}
                        />
                        Facturable
                      </label>
                      <div className="w-24">
                        <Field label="Kilometros">
                          <Input
                            type="number"
                            value={form.kilometros}
                            onChange={(e) => setForm({ ...form, kilometros: Number(e.target.value) || 0 })}
                          />
                        </Field>
                      </div>
                    </div>

                    <div>
                      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">Estatus</span>
                      <div className="flex items-center gap-2">
                        <Select value={form.estatus} onChange={(e) => cambiarEstatus(e.target.value)}>
                          {!estatusViajes.items.some((es) => es.nombre === form.estatus) && (
                            <option value={form.estatus}>{form.estatus}</option>
                          )}
                          {estatusViajes.items.map((es) => (
                            <option key={es.id} value={es.nombre}>
                              {es.nombre}
                            </option>
                          ))}
                        </Select>
                        <Input type="date" className="w-36" value={form.estatusFecha} onChange={(e) => setForm({ ...form, estatusFecha: e.target.value })} />
                        <Input type="time" className="w-24" value={form.estatusHora} onChange={(e) => setForm({ ...form, estatusHora: e.target.value })} />
                        <button
                          type="button"
                          title="Cambiar color de este estatus"
                          onClick={() => setEditarColorOpen((o) => !o)}
                          disabled={!estatusViajes.items.some((es) => es.nombre === form.estatus)}
                          className="shrink-0 rounded-lg border border-line-700 bg-bg-800 p-2 disabled:opacity-30"
                        >
                          <span className={`block h-4 w-4 rounded-full ${TONE_DOT[estatusTono(form.estatus) ?? 'gray']}`} />
                        </button>
                        <button
                          type="button"
                          title="Agregar nuevo estatus"
                          onClick={() => {
                            setNuevoEstatusOpen(true);
                            setNuevoEstatusNombre('');
                            setNuevoEstatusColor('blue');
                          }}
                          className="shrink-0 rounded-lg border border-line-700 bg-bg-800 p-2 text-ink-400 hover:text-ink-100"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      {editarColorOpen && (
                        <div className="mt-2 flex items-center gap-2">
                          {COLORES_DISPONIBLES.map((c) => (
                            <button
                              key={c}
                              type="button"
                              title={c}
                              onClick={() => handleCambiarColorActual(c)}
                              className={`h-6 w-6 rounded-full ${TONE_DOT[c]} ${
                                estatusTono(form.estatus) === c ? 'ring-2 ring-offset-2 ring-offset-bg-900 ring-white' : ''
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      {nuevoEstatusOpen && (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              autoFocus
                              placeholder="Nombre del nuevo estatus"
                              value={nuevoEstatusNombre}
                              onChange={(e) => setNuevoEstatusNombre(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAgregarEstatus();
                                }
                              }}
                            />
                            <GhostButton type="button" onClick={handleAgregarEstatus}>
                              Guardar
                            </GhostButton>
                            <GhostButton type="button" onClick={() => setNuevoEstatusOpen(false)}>
                              Cancelar
                            </GhostButton>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-ink-500">Color:</span>
                            {COLORES_DISPONIBLES.map((c) => (
                              <button
                                key={c}
                                type="button"
                                title={c}
                                onClick={() => setNuevoEstatusColor(c)}
                                className={`h-6 w-6 rounded-full ${TONE_DOT[c]} ${
                                  nuevoEstatusColor === c ? 'ring-2 ring-offset-2 ring-offset-bg-900 ring-white' : ''
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Carga">
                        <div className="flex gap-2">
                          <Input type="date" value={form.fechaCarga} onChange={(e) => setForm({ ...form, fechaCarga: e.target.value })} />
                          <Input type="time" value={form.horaCarga} onChange={(e) => setForm({ ...form, horaCarga: e.target.value })} />
                        </div>
                      </Field>
                      <Field label="Cargar En">
                        <Input value={form.cargarEn} onChange={(e) => setForm({ ...form, cargarEn: e.target.value })} />
                      </Field>
                      <Field label="Entrega">
                        <div className="flex gap-2">
                          <Input type="date" value={form.fechaEntrega} onChange={(e) => setForm({ ...form, fechaEntrega: e.target.value })} />
                          <Input type="time" value={form.horaEntregaReal} onChange={(e) => setForm({ ...form, horaEntregaReal: e.target.value })} />
                        </div>
                      </Field>
                      <Field label="Descargar En">
                        <Input value={form.descargarEn} onChange={(e) => setForm({ ...form, descargarEn: e.target.value })} />
                      </Field>
                    </div>

                    <div className="flex items-center gap-6 pt-1">
                      <label className="flex items-center gap-2 text-sm text-ink-300">
                        <input
                          type="checkbox"
                          checked={form.importacion}
                          onChange={(e) => setForm({ ...form, importacion: e.target.checked })}
                        />
                        Importacion
                      </label>
                      <label className="flex items-center gap-2 text-sm text-ink-300">
                        <input
                          type="checkbox"
                          checked={form.exportacion}
                          onChange={(e) => setForm({ ...form, exportacion: e.target.checked })}
                        />
                        Exportacion
                      </label>
                    </div>
                  </div>

                {/* ---- Convoy ---- */}
                <div className="rounded-xl border border-line-800">
                  <div className="bg-bg-700/60 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-300">
                    Convoy
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Field label="Remolque">
                        <div className="flex gap-2">
                          <ComboBoxCodigo<Caja>
                            items={cajas.items.filter((c) => c.grupoUnidades.toUpperCase() !== 'DOLLY')}
                            valor={remolque1?.economico ?? ''}
                            obtenerCodigo={(c) => c.economico}
                            obtenerEtiqueta={(c) => `${c.marca ?? ''} ${c.modelo ?? ''}`}
                            onSeleccionar={(c) => setForm((f) => ({ ...f, remolque1Id: c.id }))}
                            onLimpiar={() => setForm((f) => ({ ...f, remolque1Id: undefined }))}
                          />
                          <ToolbarButton type="button" onClick={() => setRemolque1PickerOpen(true)}>
                            <MoreHorizontal size={16} />
                          </ToolbarButton>
                          <Input readOnly className="flex-1" value={remolque1 ? `${remolque1.marca ?? ''} ${remolque1.modelo ?? ''}` : ''} />
                        </div>
                      </Field>
                      <Field label="Placas">
                        <Input readOnly value={remolque1?.placas ?? ''} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Field label="Dolly">
                        <div className="flex gap-2">
                          <ComboBoxCodigo<Caja>
                            items={cajas.items.filter((c) => c.grupoUnidades.toUpperCase() === 'DOLLY')}
                            valor={dolly?.economico ?? ''}
                            obtenerCodigo={(c) => c.economico}
                            obtenerEtiqueta={(c) => `${c.marca ?? ''} ${c.modelo ?? ''}`}
                            onSeleccionar={(c) => setForm((f) => ({ ...f, dollyId: c.id }))}
                            onLimpiar={() => setForm((f) => ({ ...f, dollyId: undefined }))}
                          />
                          <ToolbarButton type="button" onClick={() => setDollyPickerOpen(true)}>
                            <MoreHorizontal size={16} />
                          </ToolbarButton>
                          <Input readOnly className="flex-1" value={dolly ? `${dolly.marca ?? ''} ${dolly.modelo ?? ''}` : ''} />
                        </div>
                      </Field>
                      <Field label="Placas">
                        <Input readOnly value={dolly?.placas ?? ''} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Field label="Remolque">
                        <div className="flex gap-2">
                          <ComboBoxCodigo<Caja>
                            items={cajas.items.filter((c) => c.grupoUnidades.toUpperCase() !== 'DOLLY')}
                            valor={remolque2?.economico ?? ''}
                            obtenerCodigo={(c) => c.economico}
                            obtenerEtiqueta={(c) => `${c.marca ?? ''} ${c.modelo ?? ''}`}
                            onSeleccionar={(c) => setForm((f) => ({ ...f, remolque2Id: c.id }))}
                            onLimpiar={() => setForm((f) => ({ ...f, remolque2Id: undefined }))}
                          />
                          <ToolbarButton type="button" onClick={() => setRemolque2PickerOpen(true)}>
                            <MoreHorizontal size={16} />
                          </ToolbarButton>
                          <Input readOnly className="flex-1" value={remolque2 ? `${remolque2.marca ?? ''} ${remolque2.modelo ?? ''}` : ''} />
                        </div>
                      </Field>
                      <Field label="Placas">
                        <Input readOnly value={remolque2?.placas ?? ''} />
                      </Field>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <PrimaryButton type="button" onClick={abrirNuevoTrayecto}>
                        Asignar Operador/Camion
                      </PrimaryButton>
                      <GhostButton type="button" onClick={abrirNuevoTrayecto}>
                        Mas Trayectos
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
                            <th className="px-3 py-2 font-medium">Nro Oper</th>
                            <th className="px-3 py-2 font-medium">Oper/Perm</th>
                            <th className="px-3 py-2 font-medium">Camion</th>
                            <th className="px-3 py-2 font-medium">Origen</th>
                            <th className="px-3 py-2 font-medium">Destino</th>
                            <th className="px-3 py-2 font-medium">C/V R1</th>
                            <th className="px-3 py-2 font-medium">C/V R2</th>
                          </tr>
                        </thead>
                        <tbody>
                          {form.trayectos.length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-3 py-6 text-center text-ink-600">
                                Sin trayectos asignados.
                              </td>
                            </tr>
                          )}
                          {form.trayectos.map((t) => {
                            const op = operadores.items.find((o) => o.id === t.operadorId);
                            const un = unidades.items.find((u) => u.id === t.unidadId);
                            return (
                              <tr
                                key={t.id}
                                onClick={() => setTrayectoSeleccionadoId(t.id)}
                                className={`cursor-pointer border-t border-line-800/70 ${
                                  trayectoSeleccionadoId === t.id ? 'bg-breco-500/10' : 'hover:bg-bg-800'
                                }`}
                              >
                                <td className="px-3 py-2 text-ink-300">{op?.numero ?? ''}</td>
                                <td className="px-3 py-2 text-ink-300">{op?.nombre ?? ''}</td>
                                <td className="px-3 py-2 text-ink-300">{un?.economico ?? ''}</td>
                                <td className="px-3 py-2 text-ink-300">{t.origen}</td>
                                <td className="px-3 py-2 text-ink-300">{t.destino}</td>
                                <td className="px-3 py-2 text-ink-300">{t.cvR1}</td>
                                <td className="px-3 py-2 text-ink-300">{t.cvR2}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'mercancias' && (
              <div className="grid grid-cols-1 gap-4 rounded-b-xl rounded-tr-xl border border-line-800 bg-bg-900 p-4 sm:grid-cols-2">
                <div className="space-y-3">
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
                        <Textarea
                          rows={2}
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

                  <div className="rounded-xl border border-line-800">
                    <div className="bg-bg-700/60 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-300">
                      Observaciones
                    </div>
                    <div className="p-3">
                      <Textarea
                        rows={5}
                        value={form.observaciones}
                        onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
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

                  <Field label="Peso Carga">
                    <div className="flex gap-2">
                      <Input readOnly value={form.pesoCargaTotal} />
                      <Select
                        value={form.pesoCargaUnidad}
                        onChange={(e) => setForm({ ...form, pesoCargaUnidad: e.target.value })}
                      >
                        {UNIDADES_PESO.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {tab === 'conceptos' && (
              <div className="space-y-3 rounded-b-xl rounded-tr-xl border border-line-800 bg-bg-900 p-4">
                <div className="rounded-xl border border-line-800">
                  <div className="bg-bg-700/60 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-300">
                    Conceptos Cobro
                  </div>
                  <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-6">
                    <Field label="Concepto de Facturacion">
                      <div className="flex gap-2">
                        <ComboBoxCodigo<ConceptoFacturacion>
                          className="w-16"
                          items={conceptosFacturacion.items.filter((c) => c.activo)}
                          valor={conceptosFacturacion.items.find((c) => c.id === conceptoLineaForm.conceptoFacturacionId)?.codigo ?? ''}
                          obtenerCodigo={(c) => c.codigo}
                          obtenerEtiqueta={(c) => c.concepto}
                          onSeleccionar={seleccionarConcepto}
                        />
                        <ToolbarButton type="button" onClick={() => setConceptoPickerOpen(true)}>
                          <MoreHorizontal size={16} />
                        </ToolbarButton>
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

                  <div className="overflow-hidden border-t border-line-800">
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
                        {form.conceptosFacturacionViaje.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-3 py-6 text-center text-ink-600">
                              No hay conceptos agregados.
                            </td>
                          </tr>
                        )}
                        {form.conceptosFacturacionViaje.map((c) => (
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

          </fieldset>

            <div className="flex justify-end gap-2 border-t border-line-800 pt-4">
              {soloLectura ? (
                <GhostButton type="button" onClick={() => setModalOpen(false)}>
                  Cerrar
                </GhostButton>
              ) : (
                <>
                  <GhostButton type="button" onClick={() => setModalOpen(false)}>
                    Cancelar
                  </GhostButton>
                  <PrimaryButton type="submit">{editing ? 'Guardar cambios' : 'Aceptar'}</PrimaryButton>
                </>
              )}
            </div>
          </form>
        </Modal>
      )}

      {importarOpen && <ImportarProgramaModal onClose={() => setImportarOpen(false)} />}

      {imprimirFormatoOpen && viajeSeleccionado && (
        <Modal title="Imprimir Viaje" subtitle="Elige el formato de impresion" onClose={() => setImprimirFormatoOpen(false)}>
          <div className="space-y-3">
            {formatosViajeHabilitados.length === 0 && (
              <p className="text-sm text-ink-500">
                No hay formatos de impresion habilitados para Viajes. Actívalos en Configuracion → Formatos de Impresion.
              </p>
            )}
            {formatosViajeHabilitados.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => imprimirConFormato(f.clave)}
                className="block w-full rounded-xl border border-line-700 bg-bg-900 p-4 text-left transition hover:border-breco-500"
              >
                <p className="font-medium text-ink-100">{f.nombre}</p>
                {f.descripcion && <p className="text-sm text-ink-500">{f.descripcion}</p>}
              </button>
            ))}
          </div>
          <div className="flex justify-end pt-4">
            <GhostButton type="button" onClick={() => setImprimirFormatoOpen(false)}>
              Cancelar
            </GhostButton>
          </div>
        </Modal>
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
              <td className="px-3 py-2 text-ink-500">{c.rfc}</td>
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
            <p className="text-xs text-ink-500">
              El resto de los datos del cliente (domicilio, contactos, credito, etc.) se pueden completar despues desde el catalogo de Clientes.
            </p>
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

      {remolque1PickerOpen && (
        <ListaSeleccionModal<Caja>
          title="Buscar Remolque"
          items={cajas.items.filter((c) => c.grupoUnidades.toUpperCase() !== 'DOLLY')}
          filtro={(c, t) => `${c.economico} ${c.placas} ${c.marca ?? ''}`.toLowerCase().includes(t)}
          renderRow={(c) => (
            <>
              <td className="px-3 py-2 font-mono text-xs text-ink-500">{c.economico}</td>
              <td className="px-3 py-2 text-ink-200">
                {c.marca} {c.modelo}
              </td>
              <td className="px-3 py-2 text-ink-500">{c.placas}</td>
            </>
          )}
          onSelect={(c) => {
            setForm((f) => ({ ...f, remolque1Id: c.id }));
            setRemolque1PickerOpen(false);
          }}
          onClose={() => setRemolque1PickerOpen(false)}
          accionExtra={{ label: 'Agregar Remolque', onClick: () => abrirNuevaCaja('remolque1') }}
        />
      )}

      {dollyPickerOpen && (
        <ListaSeleccionModal<Caja>
          title="Buscar Dolly"
          items={cajas.items.filter((c) => c.grupoUnidades.toUpperCase() === 'DOLLY')}
          filtro={(c, t) => `${c.economico} ${c.placas} ${c.marca ?? ''}`.toLowerCase().includes(t)}
          renderRow={(c) => (
            <>
              <td className="px-3 py-2 font-mono text-xs text-ink-500">{c.economico}</td>
              <td className="px-3 py-2 text-ink-200">
                {c.marca} {c.modelo}
              </td>
              <td className="px-3 py-2 text-ink-500">{c.placas}</td>
            </>
          )}
          onSelect={(c) => {
            setForm((f) => ({ ...f, dollyId: c.id }));
            setDollyPickerOpen(false);
          }}
          onClose={() => setDollyPickerOpen(false)}
          accionExtra={{ label: 'Agregar Dolly', onClick: () => abrirNuevaCaja('dolly') }}
        />
      )}

      {remolque2PickerOpen && (
        <ListaSeleccionModal<Caja>
          title="Buscar Remolque"
          items={cajas.items.filter((c) => c.grupoUnidades.toUpperCase() !== 'DOLLY')}
          filtro={(c, t) => `${c.economico} ${c.placas} ${c.marca ?? ''}`.toLowerCase().includes(t)}
          renderRow={(c) => (
            <>
              <td className="px-3 py-2 font-mono text-xs text-ink-500">{c.economico}</td>
              <td className="px-3 py-2 text-ink-200">
                {c.marca} {c.modelo}
              </td>
              <td className="px-3 py-2 text-ink-500">{c.placas}</td>
            </>
          )}
          onSelect={(c) => {
            setForm((f) => ({ ...f, remolque2Id: c.id }));
            setRemolque2PickerOpen(false);
          }}
          onClose={() => setRemolque2PickerOpen(false)}
          accionExtra={{ label: 'Agregar Remolque', onClick: () => abrirNuevaCaja('remolque2') }}
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

      {rutaPickerOpen && (
        <ListaSeleccionModal<Ruta>
          title="Buscar Ruta"
          items={rutas.items.filter((r) => r.activo)}
          filtro={(r, t) => `${r.codigo} ${r.descripcion}`.toLowerCase().includes(t)}
          renderRow={(r) => (
            <>
              <td className="px-3 py-2 font-mono text-xs text-ink-500">{r.codigo}</td>
              <td className="px-3 py-2 text-ink-200">{r.descripcion}</td>
            </>
          )}
          onSelect={seleccionarRuta}
          onClose={() => setRutaPickerOpen(false)}
          accionExtra={{ label: 'Agregar Ruta', onClick: abrirNuevaRuta }}
        />
      )}

      {unidadPickerOpen && (
        <ListaSeleccionModal<Unidad>
          title="Buscar Unidad"
          items={unidades.items}
          filtro={(u, t) => `${u.economico} ${u.placas} ${u.marca ?? ''}`.toLowerCase().includes(t)}
          renderRow={(u) => (
            <>
              <td className="px-3 py-2 font-mono text-xs text-ink-500">{u.economico}</td>
              <td className="px-3 py-2 text-ink-200">
                {u.marca} {u.modelo}
              </td>
              <td className="px-3 py-2 text-ink-500">{u.placas}</td>
            </>
          )}
          onSelect={(u) => {
            setTrayectoForm((f) => ({ ...f, unidadId: u.id }));
            setUnidadPickerOpen(false);
          }}
          onClose={() => setUnidadPickerOpen(false)}
          accionExtra={{ label: 'Agregar Unidad', onClick: abrirNuevaUnidad }}
        />
      )}

      {nuevaCajaOpen && (
        <Modal title={nuevaCajaDestino === 'dolly' ? 'Agregando Dolly' : 'Agregando Remolque'} onClose={() => setNuevaCajaOpen(false)}>
          <div className="space-y-4">
            <Field label="Codigo">
              <Input
                required
                autoFocus
                value={nuevaCajaForm.economico}
                onChange={(e) => setNuevaCajaForm({ ...nuevaCajaForm, economico: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Marca">
                <Input value={nuevaCajaForm.marca} onChange={(e) => setNuevaCajaForm({ ...nuevaCajaForm, marca: e.target.value })} />
              </Field>
              <Field label="Modelo">
                <Input value={nuevaCajaForm.modelo} onChange={(e) => setNuevaCajaForm({ ...nuevaCajaForm, modelo: e.target.value })} />
              </Field>
            </div>
            <Field label="Placas">
              <Input value={nuevaCajaForm.placas} onChange={(e) => setNuevaCajaForm({ ...nuevaCajaForm, placas: e.target.value })} />
            </Field>
            <p className="text-xs text-ink-500">
              El resto de los datos (especificaciones, documentos, seguros) se pueden completar despues desde el catalogo de Remolques.
            </p>
            <div className="flex items-center justify-end gap-3 border-t border-line-800 pt-4">
              {nuevaCajaError && <p className="flex-1 text-sm text-breco-500">{nuevaCajaError}</p>}
              <GhostButton type="button" onClick={() => setNuevaCajaOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="button" onClick={guardarNuevaCaja}>
                Aceptar
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}

      {nuevaUnidadOpen && (
        <Modal title="Agregando Unidad" onClose={() => setNuevaUnidadOpen(false)}>
          <div className="space-y-4">
            <Field label="Codigo">
              <Input
                required
                autoFocus
                value={nuevaUnidadForm.economico}
                onChange={(e) => setNuevaUnidadForm({ ...nuevaUnidadForm, economico: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Marca">
                <Input value={nuevaUnidadForm.marca} onChange={(e) => setNuevaUnidadForm({ ...nuevaUnidadForm, marca: e.target.value })} />
              </Field>
              <Field label="Modelo">
                <Input value={nuevaUnidadForm.modelo} onChange={(e) => setNuevaUnidadForm({ ...nuevaUnidadForm, modelo: e.target.value })} />
              </Field>
            </div>
            <Field label="Placas">
              <Input value={nuevaUnidadForm.placas} onChange={(e) => setNuevaUnidadForm({ ...nuevaUnidadForm, placas: e.target.value })} />
            </Field>
            <p className="text-xs text-ink-500">
              El resto de los datos (especificaciones, documentos, seguros) se pueden completar despues desde el catalogo de Unidades.
            </p>
            <div className="flex items-center justify-end gap-3 border-t border-line-800 pt-4">
              {nuevaUnidadError && <p className="flex-1 text-sm text-breco-500">{nuevaUnidadError}</p>}
              <GhostButton type="button" onClick={() => setNuevaUnidadOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="button" onClick={guardarNuevaUnidad}>
                Aceptar
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}

      {nuevaRutaOpen && (
        <Modal title="Agregando Ruta" onClose={() => setNuevaRutaOpen(false)}>
          <div className="space-y-4">
            <Field label="Descripcion">
              <Input
                required
                autoFocus
                value={nuevaRutaForm.descripcion}
                onChange={(e) => setNuevaRutaForm({ ...nuevaRutaForm, descripcion: e.target.value })}
              />
            </Field>
            <Field label="Cliente (opcional)">
              <ComboBoxCodigo<Cliente>
                items={clientes.items}
                valor={clientes.items.find((c) => c.id === nuevaRutaForm.clienteId)?.numeroCliente ?? ''}
                obtenerCodigo={(c) => c.numeroCliente}
                obtenerEtiqueta={(c) => c.nombre}
                onSeleccionar={(c) => setNuevaRutaForm({ ...nuevaRutaForm, clienteId: c.id })}
                onLimpiar={() => setNuevaRutaForm({ ...nuevaRutaForm, clienteId: '' })}
                placeholder="Nro. de cliente"
              />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Origen">
                <Input
                  value={nuevaRutaForm.origenDireccion}
                  onChange={(e) => setNuevaRutaForm({ ...nuevaRutaForm, origenDireccion: e.target.value })}
                  placeholder="Direccion, ciudad, planta..."
                />
              </Field>
              <Field label="Destino">
                <Input
                  value={nuevaRutaForm.destinoDireccion}
                  onChange={(e) => setNuevaRutaForm({ ...nuevaRutaForm, destinoDireccion: e.target.value })}
                  placeholder="Direccion, ciudad, planta..."
                />
              </Field>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-line-800 bg-bg-900 p-3">
              <div className="text-xs text-ink-400">
                {nuevaRutaForm.kilometros > 0 ? (
                  <span>
                    {nuevaRutaForm.kilometros} km · {nuevaRutaForm.horas} hrs (estimado)
                  </span>
                ) : (
                  <span>Traza la ruta en el mapa para calcular kilometros y tiempo.</span>
                )}
              </div>
              <GhostButton type="button" onClick={() => setNuevaRutaTrazarOpen(true)}>
                Trazar Ruta
              </GhostButton>
            </div>
            <p className="text-xs text-ink-500">
              El resto de los datos (tipo de viaje, clasificacion, trayectos, conceptos de facturacion, mercancias) se completan
              despues en el catalogo de Rutas.
            </p>
            <div className="flex items-center justify-end gap-3 border-t border-line-800 pt-4">
              {nuevaRutaError && <p className="flex-1 text-sm text-breco-500">{nuevaRutaError}</p>}
              <GhostButton type="button" onClick={() => setNuevaRutaOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="button" onClick={guardarNuevaRuta}>
                Aceptar
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}

      {nuevaRutaTrazarOpen && (
        <TrazarRutaModal
          origenInicial={nuevaRutaForm.origenDireccion}
          destinoInicial={nuevaRutaForm.destinoDireccion}
          onConfirmar={(datos) => {
            setNuevaRutaForm({
              ...nuevaRutaForm,
              origenDireccion: datos.origenDireccion,
              destinoDireccion: datos.destinoDireccion,
              kilometros: datos.kilometros,
              horas: datos.horas,
              trazoRuta: datos.trazoRuta,
            });
            setNuevaRutaTrazarOpen(false);
          }}
          onClose={() => setNuevaRutaTrazarOpen(false)}
        />
      )}

      {trayectoModalOpen && (
        <Modal title={trayectoEditandoId ? 'Editando Trayecto' : 'Asignar Operador/Camion'} onClose={() => setTrayectoModalOpen(false)}>
          <div className="space-y-3">
            <Field label="Operador">
              <Select value={trayectoForm.operadorId} onChange={(e) => setTrayectoForm({ ...trayectoForm, operadorId: e.target.value })}>
                <option value="">Selecciona...</option>
                {operadores.items.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.numero} - {o.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Camion">
              <div className="flex gap-2">
                <ComboBoxCodigo<Unidad>
                  className="flex-1"
                  items={unidades.items}
                  valor={unidades.items.find((u) => u.id === trayectoForm.unidadId)?.economico ?? ''}
                  obtenerCodigo={(u) => u.economico}
                  obtenerEtiqueta={(u) => `${u.marca ?? ''} ${u.modelo ?? ''}`}
                  onSeleccionar={(u) => setTrayectoForm((f) => ({ ...f, unidadId: u.id }))}
                  onLimpiar={() => setTrayectoForm((f) => ({ ...f, unidadId: '' }))}
                  placeholder="Sin asignar"
                />
                <ToolbarButton type="button" onClick={() => setUnidadPickerOpen(true)}>
                  <MoreHorizontal size={16} />
                </ToolbarButton>
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Origen">
                <Input value={trayectoForm.origen} onChange={(e) => setTrayectoForm({ ...trayectoForm, origen: e.target.value })} />
              </Field>
              <Field label="Destino">
                <Input value={trayectoForm.destino} onChange={(e) => setTrayectoForm({ ...trayectoForm, destino: e.target.value })} />
              </Field>
              <Field label="C/V R1">
                <Input value={trayectoForm.cvR1} onChange={(e) => setTrayectoForm({ ...trayectoForm, cvR1: e.target.value })} />
              </Field>
              <Field label="C/V R2">
                <Input value={trayectoForm.cvR2} onChange={(e) => setTrayectoForm({ ...trayectoForm, cvR2: e.target.value })} />
              </Field>
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
    </div>
  );
}
