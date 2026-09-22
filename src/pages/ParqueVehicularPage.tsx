import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  History,
  MapPin,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  StickyNote,
  X,
} from 'lucide-react';
import { useData } from '../lib/DataContext';
import { useAuth } from '../lib/AuthContext';
import { uid } from '../lib/storage';
import { exportarExcel } from '../lib/exportarExcel';
import {
  construirFilasParque,
  filtrarFilasParque,
  filtrosVaciosParque,
  type FilaParque,
  type FiltrosParque,
} from '../lib/parqueVehicular';
import type { EstadoCarga, EstatusCaja } from '../types';
import { Field, GhostButton, Input, Select, ToolbarButton, inputClass } from '../components/ui/form';
import { Modal } from '../components/ui/Modal';
import { StatusBadge, TONE_DOT, resolverTono, type Tone } from '../components/ui/Badge';

const ESTATUS_CAJA_FIJO: EstatusCaja[] = ['Disponible', 'En uso', 'Mantenimiento', 'Asignado', 'Fuera de servicio'];
const POR_PAGINA = 10;

export function ParqueVehicularPage() {
  const { unidades, cajas, viajes, clientes, estatusUnidades, parqueNotas, parqueHistorial } = useData();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const puedeEditar = hasPermission('Catalogos', 'editar');

  const [filtros, setFiltros] = useState<FiltrosParque>(filtrosVaciosParque);
  const [pagina, setPagina] = useState(1);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [agregarAbierto, setAgregarAbierto] = useState(false);
  const [cambiarEstatusOpen, setCambiarEstatusOpen] = useState(false);
  const [nuevoEstatus, setNuevoEstatus] = useState('');
  const [historialOpen, setHistorialOpen] = useState(false);
  const [notaOpen, setNotaOpen] = useState(false);
  const [notaTexto, setNotaTexto] = useState('');
  const [ubicacionOpen, setUbicacionOpen] = useState(false);
  const [ubicacionTexto, setUbicacionTexto] = useState('');
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleSoloLectura, setDetalleSoloLectura] = useState(true);
  const [detalleForm, setDetalleForm] = useState({ propietario: '', ubicacion: '', estadoCarga: 'Vacio' as EstadoCarga });

  const colorEstatusUnidad = (nombre: string): Tone | null =>
    (estatusUnidades.items.find((e) => e.nombre === nombre)?.color as Tone | undefined) ?? null;

  const todasLasFilas = useMemo(
    () => construirFilasParque(unidades.items, cajas.items, viajes.items, colorEstatusUnidad),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unidades.items, cajas.items, viajes.items, estatusUnidades.items],
  );

  const filasFiltradas = useMemo(() => filtrarFilasParque(todasLasFilas, filtros), [todasLasFilas, filtros]);

  const propietariosDisponibles = useMemo(
    () => Array.from(new Set(todasLasFilas.map((f) => f.propietario).filter(Boolean))).sort(),
    [todasLasFilas],
  );

  const totalPaginas = Math.max(1, Math.ceil(filasFiltradas.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const filasPagina = filasFiltradas.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA);

  function actualizarFiltro<K extends keyof FiltrosParque>(campo: K, valor: FiltrosParque[K]) {
    setFiltros((f) => ({ ...f, [campo]: valor }));
    setPagina(1);
  }

  function limpiarFiltros() {
    setFiltros(filtrosVaciosParque);
    setPagina(1);
  }

  function nombreCliente(id?: string) {
    if (!id) return '-';
    return clientes.items.find((c) => c.id === id)?.nombre ?? 'N/D';
  }

  function ultimaNota(fila: FilaParque) {
    const notas = parqueNotas.items
      .filter((n) => n.entidadTipo === fila.entidadTipo && n.entidadId === fila.id)
      .sort((a, b) => (b.creadoEn ?? '').localeCompare(a.creadoEn ?? ''));
    return notas[0]?.texto ?? '';
  }

  function toggleFila(key: string) {
    setSeleccionados((s) => {
      const nuevo = new Set(s);
      if (nuevo.has(key)) nuevo.delete(key);
      else nuevo.add(key);
      return nuevo;
    });
  }

  function toggleTodasPagina() {
    setSeleccionados((s) => {
      const nuevo = new Set(s);
      const todasMarcadas = filasPagina.every((f) => nuevo.has(f.key));
      filasPagina.forEach((f) => (todasMarcadas ? nuevo.delete(f.key) : nuevo.add(f.key)));
      return nuevo;
    });
  }

  const filasSeleccionadas = todasLasFilas.filter((f) => seleccionados.has(f.key));
  const unicaSeleccionada = filasSeleccionadas.length === 1 ? filasSeleccionadas[0] : null;

  function registrarHistorial(fila: FilaParque, campo: string, valorAnterior: string, valorNuevo: string) {
    if (valorAnterior === valorNuevo) return;
    parqueHistorial.add({
      id: uid('ph'),
      entidadTipo: fila.entidadTipo,
      entidadId: fila.id,
      campo,
      valorAnterior,
      valorNuevo,
    });
  }

  function aplicarCambioEstatus() {
    if (!nuevoEstatus || filasSeleccionadas.length === 0) return;
    let omitidos = 0;
    filasSeleccionadas.forEach((fila) => {
      if (fila.entidadTipo === 'unidad') {
        registrarHistorial(fila, 'estatus', fila.estatus, nuevoEstatus);
        unidades.update(fila.id, { estatus: nuevoEstatus });
      } else if ((ESTATUS_CAJA_FIJO as string[]).includes(nuevoEstatus)) {
        registrarHistorial(fila, 'estatus', fila.estatus, nuevoEstatus);
        cajas.update(fila.id, { estatus: nuevoEstatus as EstatusCaja });
      } else {
        omitidos++;
      }
    });
    if (omitidos > 0) {
      alert(`"${nuevoEstatus}" no es un estatus valido para remolques -- se omitieron ${omitidos} remolque(s) seleccionados.`);
    }
    setCambiarEstatusOpen(false);
    setSeleccionados(new Set());
  }

  function abrirCambiarEstatus() {
    setNuevoEstatus('');
    setCambiarEstatusOpen(true);
  }

  function guardarNota() {
    if (!unicaSeleccionada || !notaTexto.trim()) return;
    parqueNotas.add({ id: uid('pn'), entidadTipo: unicaSeleccionada.entidadTipo, entidadId: unicaSeleccionada.id, texto: notaTexto.trim() });
    setNotaOpen(false);
    setNotaTexto('');
  }

  function guardarUbicacion() {
    if (!unicaSeleccionada) return;
    registrarHistorial(unicaSeleccionada, 'ubicacion', unicaSeleccionada.ubicacion, ubicacionTexto);
    if (unicaSeleccionada.entidadTipo === 'unidad') unidades.update(unicaSeleccionada.id, { ubicacion: ubicacionTexto });
    else cajas.update(unicaSeleccionada.id, { ubicacion: ubicacionTexto });
    setUbicacionOpen(false);
  }

  function abrirDetalle(fila: FilaParque, soloLectura: boolean) {
    setSeleccionados(new Set([fila.key]));
    setDetalleForm({ propietario: fila.propietario, ubicacion: fila.ubicacion, estadoCarga: fila.estadoCarga });
    setDetalleSoloLectura(soloLectura);
    setDetalleOpen(true);
  }

  function guardarDetalle() {
    if (!unicaSeleccionada) return;
    registrarHistorial(unicaSeleccionada, 'estado_carga', unicaSeleccionada.estadoCarga, detalleForm.estadoCarga);
    const patch = { propietario: detalleForm.propietario, ubicacion: detalleForm.ubicacion, estadoCarga: detalleForm.estadoCarga };
    if (unicaSeleccionada.entidadTipo === 'unidad') unidades.update(unicaSeleccionada.id, patch);
    else cajas.update(unicaSeleccionada.id, patch);
    setDetalleOpen(false);
  }

  function exportar() {
    exportarExcel(
      'parque-vehicular',
      ['Codigo', 'Descripcion', 'Tipo', 'Estatus', 'Cliente', 'Propietario', 'Ubicacion', 'Cargado/Vacio'],
      filasFiltradas.map((f) => [
        f.codigo,
        f.descripcion,
        f.entidadTipo === 'unidad' ? 'Unidad' : 'Remolque',
        f.estatus,
        nombreCliente(f.clienteId),
        f.propietario,
        f.ubicacion,
        f.estadoCarga,
      ]),
    );
  }

  function imprimir() {
    const params = new URLSearchParams({
      tipo: filtros.tipo,
      propiedad: filtros.propiedad,
      clienteId: filtros.clienteId,
      propietario: filtros.propietario,
      buscarPor: filtros.buscarPor,
      q: filtros.busqueda,
    });
    window.open(`#/parque-vehicular/imprimir?${params.toString()}`, '_blank');
  }

  const historialSeleccion = unicaSeleccionada
    ? parqueHistorial.items
        .filter((h) => h.entidadTipo === unicaSeleccionada.entidadTipo && h.entidadId === unicaSeleccionada.id)
        .sort((a, b) => (b.creadoEn ?? '').localeCompare(a.creadoEn ?? ''))
    : [];

  const opcionesEstatus = Array.from(new Set([...estatusUnidades.items.map((e) => e.nombre), ...ESTATUS_CAJA_FIJO]));

  const legend = useMemo(() => {
    const usados = new Map<string, Tone>();
    filasFiltradas.forEach((f) => {
      if (!usados.has(f.estatus)) usados.set(f.estatus, resolverTono(f.estatus, f.tono));
    });
    return Array.from(usados.entries());
  }, [filasFiltradas]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-100">Parque Vehicular</h1>
          <p className="mt-1 text-sm text-ink-500">Administra y consulta todas las unidades y remolques de la flota.</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <ToolbarButton type="button" onClick={() => setAgregarAbierto((v) => !v)}>
            <Plus size={16} /> Agregar Unidad <ChevronDown size={14} />
          </ToolbarButton>
          {agregarAbierto && (
            <div className="absolute z-20 mt-1 w-44 overflow-hidden rounded-lg border border-line-700 bg-bg-800 shadow-xl">
              <button
                className="block w-full px-3 py-2 text-left text-sm text-ink-200 hover:bg-bg-700"
                onClick={() => {
                  setAgregarAbierto(false);
                  navigate('/catalogos/unidades');
                }}
              >
                Nueva Unidad
              </button>
              <button
                className="block w-full px-3 py-2 text-left text-sm text-ink-200 hover:bg-bg-700"
                onClick={() => {
                  setAgregarAbierto(false);
                  navigate('/catalogos/remolques');
                }}
              >
                Nuevo Remolque
              </button>
            </div>
          )}
        </div>
        <ToolbarButton type="button" disabled={!puedeEditar || filasSeleccionadas.length === 0} onClick={abrirCambiarEstatus}>
          <RefreshCw size={16} /> Cambiar Estatus
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!unicaSeleccionada} onClick={() => setHistorialOpen(true)}>
          <History size={16} /> Historial
        </ToolbarButton>
        <ToolbarButton type="button" onClick={imprimir}>
          <Printer size={16} /> Imprimir
        </ToolbarButton>
        <ToolbarButton type="button" onClick={exportar}>
          <FileSpreadsheet size={16} /> Exportar XLS
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!puedeEditar || !unicaSeleccionada} onClick={() => { setUbicacionTexto(unicaSeleccionada?.ubicacion ?? ''); setUbicacionOpen(true); }}>
          <MapPin size={16} /> Ubicacion Unidad
        </ToolbarButton>
        <ToolbarButton type="button" disabled={!puedeEditar || !unicaSeleccionada} onClick={() => { setNotaTexto(''); setNotaOpen(true); }}>
          <StickyNote size={16} /> Agregar Nota
        </ToolbarButton>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-line-800 bg-bg-900 p-3 sm:grid-cols-3 lg:grid-cols-6">
        <Field label="Tipo de Unidades">
          <Select value={filtros.tipo} onChange={(e) => actualizarFiltro('tipo', e.target.value as FiltrosParque['tipo'])}>
            <option value="todas">Todas</option>
            <option value="unidad">Unidades</option>
            <option value="remolque">Remolques</option>
          </Select>
        </Field>
        <Field label="Unidades">
          <Select value={filtros.propiedad} onChange={(e) => actualizarFiltro('propiedad', e.target.value as FiltrosParque['propiedad'])}>
            <option value="todas">Todas</option>
            <option value="propias">Propias</option>
            <option value="rentadas">Rentadas</option>
          </Select>
        </Field>
        <Field label="Clientes">
          <Select value={filtros.clienteId} onChange={(e) => actualizarFiltro('clienteId', e.target.value)}>
            <option value="">Todos</option>
            {clientes.items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Propietarios">
          <Select value={filtros.propietario} onChange={(e) => actualizarFiltro('propietario', e.target.value)}>
            <option value="">Todos</option>
            {propietariosDisponibles.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Buscar Por">
          <Select value={filtros.buscarPor} onChange={(e) => actualizarFiltro('buscarPor', e.target.value as FiltrosParque['buscarPor'])}>
            <option value="codigo">Codigo</option>
            <option value="descripcion">Descripcion</option>
          </Select>
        </Field>
        <Field label="Buscar">
          <div className="flex gap-2">
            <Input
              value={filtros.busqueda}
              onChange={(e) => actualizarFiltro('busqueda', e.target.value)}
              placeholder="Buscar..."
            />
            <GhostButton type="button" onClick={limpiarFiltros} title="Limpiar filtros">
              <X size={16} />
            </GhostButton>
          </div>
        </Field>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line-800 bg-bg-800">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-line-800 bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={filasPagina.length > 0 && filasPagina.every((f) => seleccionados.has(f.key))}
                    onChange={toggleTodasPagina}
                    className="h-4 w-4 rounded border-line-600 bg-bg-900 accent-breco-500"
                  />
                </th>
                <th className="px-4 py-3 font-medium">Codigo</th>
                <th className="px-4 py-3 font-medium">Descripcion</th>
                <th className="px-4 py-3 font-medium">Estatus</th>
                <th className="px-4 py-3 font-medium">Fecha / hora est.</th>
                <th className="px-4 py-3 font-medium">Nota</th>
                <th className="px-4 py-3 font-medium">Cargado/Vacio</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Ubicacion</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filasPagina.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-ink-600">
                    Sin unidades ni remolques que coincidan con los filtros.
                  </td>
                </tr>
              )}
              {filasPagina.map((fila) => (
                <tr
                  key={fila.key}
                  className={`border-b border-line-800/70 last:border-0 hover:bg-bg-700/40 ${seleccionados.has(fila.key) ? 'bg-breco-500/10' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={seleccionados.has(fila.key)}
                      onChange={() => toggleFila(fila.key)}
                      className="h-4 w-4 rounded border-line-600 bg-bg-900 accent-breco-500"
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink-100">{fila.codigo}</td>
                  <td className="px-4 py-3 text-ink-300">{fila.descripcion || '-'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={fila.estatus} tone={fila.tono} />
                  </td>
                  <td className="px-4 py-3 text-ink-500">{fila.fechaHoraEst || '-'}</td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-ink-500" title={ultimaNota(fila)}>
                    {ultimaNota(fila) || '-'}
                  </td>
                  <td className="px-4 py-3 text-ink-300">{fila.estadoCarga}</td>
                  <td className="px-4 py-3 text-ink-300">{nombreCliente(fila.clienteId)}</td>
                  <td className="px-4 py-3 text-ink-300">{fila.ubicacion || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => abrirDetalle(fila, true)}
                        title="Ver detalle"
                        className="rounded-lg p-1.5 text-ink-500 transition hover:bg-bg-700 hover:text-ink-100"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setSeleccionados(new Set([fila.key]));
                          setUbicacionTexto(fila.ubicacion);
                          setUbicacionOpen(true);
                        }}
                        title="Ubicacion"
                        disabled={!puedeEditar}
                        className="rounded-lg p-1.5 text-ink-500 transition hover:bg-bg-700 hover:text-ink-100 disabled:opacity-40"
                      >
                        <MapPin size={15} />
                      </button>
                      <button
                        onClick={() => abrirDetalle(fila, false)}
                        title="Editar"
                        disabled={!puedeEditar}
                        className="rounded-lg p-1.5 text-ink-500 transition hover:bg-bg-700 hover:text-ink-100 disabled:opacity-40"
                      >
                        <Pencil size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-line-800 px-4 py-3 text-sm text-ink-500 sm:flex-row">
          <span>
            Mostrando {filasFiltradas.length === 0 ? 0 : (paginaSegura - 1) * POR_PAGINA + 1} a{' '}
            {Math.min(paginaSegura * POR_PAGINA, filasFiltradas.length)} de {filasFiltradas.length} registros
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaSegura <= 1}
              className="rounded-lg border border-line-700 p-1.5 disabled:opacity-40"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="px-2">
              {paginaSegura} / {totalPaginas}
            </span>
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaSegura >= totalPaginas}
              className="rounded-lg border border-line-700 p-1.5 disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {legend.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-ink-500">
          {legend.map(([nombre, tone]) => (
            <span key={nombre} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${TONE_DOT[tone] ?? 'bg-ink-500'}`} />
              {nombre}
            </span>
          ))}
        </div>
      )}

      {cambiarEstatusOpen && (
        <Modal title="Cambiar estatus" subtitle={`${filasSeleccionadas.length} seleccionado(s)`} onClose={() => setCambiarEstatusOpen(false)}>
          <div className="space-y-4">
            <Field label="Nuevo estatus">
              <Select value={nuevoEstatus} onChange={(e) => setNuevoEstatus(e.target.value)}>
                <option value="">Selecciona...</option>
                {opcionesEstatus.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </Select>
            </Field>
            <p className="text-xs text-ink-600">
              Si hay remolques seleccionados, solo se aplica cuando el estatus elegido es uno de: {ESTATUS_CAJA_FIJO.join(', ')}.
            </p>
            <div className="flex justify-end gap-2">
              <GhostButton type="button" onClick={() => setCambiarEstatusOpen(false)}>
                Cancelar
              </GhostButton>
              <ToolbarButton type="button" disabled={!nuevoEstatus} onClick={aplicarCambioEstatus}>
                Aplicar
              </ToolbarButton>
            </div>
          </div>
        </Modal>
      )}

      {historialOpen && unicaSeleccionada && (
        <Modal title={`Historial de ${unicaSeleccionada.codigo}`} onClose={() => setHistorialOpen(false)}>
          {historialSeleccion.length === 0 ? (
            <p className="text-sm text-ink-500">Sin cambios registrados todavia.</p>
          ) : (
            <ul className="space-y-3">
              {historialSeleccion.map((h) => (
                <li key={h.id} className="rounded-lg border border-line-800 p-3 text-sm">
                  <div className="flex items-center justify-between text-xs text-ink-600">
                    <span className="uppercase tracking-wide">{h.campo}</span>
                    <span>{h.creadoEn ? new Date(h.creadoEn).toLocaleString('es-MX') : ''}</span>
                  </div>
                  <p className="mt-1 text-ink-200">
                    <span className="text-ink-500 line-through">{h.valorAnterior || '(vacio)'}</span>
                    {' -> '}
                    <span className="font-medium text-ink-100">{h.valorNuevo || '(vacio)'}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {notaOpen && unicaSeleccionada && (
        <Modal title={`Agregar nota a ${unicaSeleccionada.codigo}`} onClose={() => setNotaOpen(false)}>
          <div className="space-y-4">
            <Field label="Nota">
              <textarea
                className={`${inputClass} min-h-24`}
                value={notaTexto}
                onChange={(e) => setNotaTexto(e.target.value)}
                placeholder="Escribe una nota..."
              />
            </Field>
            <div className="flex justify-end gap-2">
              <GhostButton type="button" onClick={() => setNotaOpen(false)}>
                Cancelar
              </GhostButton>
              <ToolbarButton type="button" disabled={!notaTexto.trim()} onClick={guardarNota}>
                Guardar
              </ToolbarButton>
            </div>
          </div>
        </Modal>
      )}

      {ubicacionOpen && unicaSeleccionada && (
        <Modal title={`Ubicacion de ${unicaSeleccionada.codigo}`} onClose={() => setUbicacionOpen(false)}>
          <div className="space-y-4">
            <Field label="Ubicacion actual">
              <Input value={ubicacionTexto} onChange={(e) => setUbicacionTexto(e.target.value)} placeholder="Ej. Patios Empresa, direccion, ciudad..." />
            </Field>
            <div className="flex justify-end gap-2">
              <GhostButton type="button" onClick={() => setUbicacionOpen(false)}>
                Cancelar
              </GhostButton>
              <ToolbarButton type="button" onClick={guardarUbicacion}>
                Guardar
              </ToolbarButton>
            </div>
          </div>
        </Modal>
      )}

      {detalleOpen && unicaSeleccionada && (
        <Modal title={detalleSoloLectura ? `Detalle de ${unicaSeleccionada.codigo}` : `Editar ${unicaSeleccionada.codigo}`} onClose={() => setDetalleOpen(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-ink-500">Tipo</div>
                <div className="text-ink-200">{unicaSeleccionada.entidadTipo === 'unidad' ? 'Unidad' : 'Remolque'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-ink-500">Estatus</div>
                <StatusBadge status={unicaSeleccionada.estatus} tone={unicaSeleccionada.tono} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-ink-500">Descripcion</div>
                <div className="text-ink-200">{unicaSeleccionada.descripcion || '-'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-ink-500">Cliente</div>
                <div className="text-ink-200">{nombreCliente(unicaSeleccionada.clienteId)}</div>
              </div>
            </div>
            <fieldset disabled={detalleSoloLectura} className="space-y-4">
              <Field label="Propietario">
                <Input value={detalleForm.propietario} onChange={(e) => setDetalleForm((f) => ({ ...f, propietario: e.target.value }))} />
              </Field>
              <Field label="Ubicacion">
                <Input value={detalleForm.ubicacion} onChange={(e) => setDetalleForm((f) => ({ ...f, ubicacion: e.target.value }))} />
              </Field>
              <Field label="Cargado / Vacio">
                <Select value={detalleForm.estadoCarga} onChange={(e) => setDetalleForm((f) => ({ ...f, estadoCarga: e.target.value as EstadoCarga }))}>
                  <option value="Vacio">Vacio</option>
                  <option value="Cargado">Cargado</option>
                </Select>
              </Field>
            </fieldset>
            <div className="flex justify-end gap-2">
              <GhostButton type="button" onClick={() => setDetalleOpen(false)}>
                {detalleSoloLectura ? 'Cerrar' : 'Cancelar'}
              </GhostButton>
              {!detalleSoloLectura && (
                <ToolbarButton type="button" onClick={guardarDetalle}>
                  Guardar cambios
                </ToolbarButton>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
