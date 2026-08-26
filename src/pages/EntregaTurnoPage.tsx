import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { useData } from '../lib/DataContext';
import { useAuth } from '../lib/AuthContext';
import { uid } from '../lib/storage';
import type { EntregaTurnoUnidad, FacturaSistema, SemaforoEntrega, TipoNotaEntregaTurno, Viaje } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Modal } from '../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Textarea, inputClass } from '../components/ui/form';

function shiftDate(date: string, dias: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

const SEMAFORO_EMOJI: Record<SemaforoEntrega, string> = { verde: '🟩', amarillo: '🟨', rojo: '🟥' };
const SEMAFORO_DOT: Record<SemaforoEntrega, string> = {
  verde: 'bg-emerald-500',
  amarillo: 'bg-amber-500',
  rojo: 'bg-red-500',
};

function formatFechaLarga(fecha: string): string {
  const d = new Date(`${fecha}T00:00:00`);
  const dia = d.toLocaleDateString('es-MX', { weekday: 'long' }).toUpperCase();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dia} ${dd}/${mm}/${yyyy}`;
}

function bloqueUnidad(u: EntregaTurnoUnidad): string {
  const lineas: string[] = [];
  const encabezado = u.operadorTexto ? `${u.unidadTexto} – ${u.operadorTexto}` : u.unidadTexto;
  lineas.push(`### ${encabezado}`);
  lineas.push('');
  if (u.servicioAnterior) lineas.push(`**${u.servicioAnterior}**`);
  if (u.estatusActual) lineas.push(`${SEMAFORO_EMOJI[u.semaforo]} **${u.estatusActual}**`);
  if (u.notaAdicional) lineas.push(u.notaAdicional);
  if (u.cita) lineas.push(`**Cita:** ${u.cita}`);
  if (u.instruccion) lineas.push(`**Instrucción:** ${u.instruccion}`);
  if (u.proximoServicio) lineas.push(`**Próximo servicio:** ${u.proximoServicio}`);
  return lineas.join('\n');
}

function generarReporte(
  fecha: string,
  unidades: EntregaTurnoUnidad[],
  notas: { tipo: TipoNotaEntregaTurno; texto: string; orden: number }[],
): string {
  const partes: string[] = ['# ENTREGA DE TURNO ACTUALIZADA', '', `## ${formatFechaLarga(fecha)}`, ''];
  const ordenadas = [...unidades].sort((a, b) => a.orden - b.orden);
  for (const u of ordenadas) {
    partes.push(bloqueUnidad(u), '');
  }

  const citas = notas.filter((n) => n.tipo === 'cita').sort((a, b) => a.orden - b.orden);
  if (citas.length) {
    partes.push('## CITAS Y COMPROMISOS', '');
    for (const c of citas) partes.push(`* ${c.texto}`);
    partes.push('');
  }

  const prioridades = notas.filter((n) => n.tipo === 'prioridad').sort((a, b) => a.orden - b.orden);
  if (prioridades.length) {
    partes.push('## PRIORIDADES DEL TURNO', '');
    prioridades.forEach((p, i) => partes.push(`${i + 1}. ${p.texto}`));
    partes.push('');
  }

  const conResumen = ordenadas.filter((u) => u.resumenEstatus || u.resumenSiguiente);
  if (conResumen.length) {
    partes.push('## RESUMEN RAPIDO', '');
    partes.push('| UNIDAD | ESTATUS ACTUAL | SIGUIENTE MOVIMIENTO / CITA |');
    partes.push('| --- | --- | --- |');
    for (const u of conResumen) partes.push(`| **${u.unidadTexto}** | ${u.resumenEstatus} | ${u.resumenSiguiente} |`);
  }

  return partes.join('\n').trim();
}

// "Generar desde la operacion" arma lo que el sistema si sabe (ultimo
// servicio facturado, ruta y cita del viaje asignado) para no repetir a
// mano lo que ya esta capturado en Facturacion y Viajes. No hay
// rastreo/GPS en el sistema, asi que la ubicacion en tiempo real y la
// instruccion siguen siendo criterio del despachador -- esos campos
// quedan en blanco para que el se los agregue.

function textoFechaRelativa(fechaISO: string, fechaRef: string): string {
  const d = new Date(`${fechaISO}T00:00:00`);
  const dia = d.toLocaleDateString('es-MX', { weekday: 'long' });
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  if (fechaISO === fechaRef) return 'Hoy';
  const diffDias = Math.round(
    (new Date(`${fechaRef}T00:00:00`).getTime() - d.getTime()) / 86400000,
  );
  if (diffDias === 1) return `Ayer, ${dia} ${dd}/${mm}`;
  return `El ${dia} ${dd}/${mm}`;
}

function componerServicioAnterior(f: FacturaSistema, fechaRef: string): string {
  const rel = textoFechaRelativa(f.fechaOrigen, fechaRef);
  const caja = f.economicoRemolque || f.economicoTracto;
  const origen = f.locacionOrigen || f.origenPedido;
  const destino = f.locacionDestino || f.destinoPedido;
  const tipo = f.tipoPedido || 'servicio';
  const ruta = origen && destino ? `, de ${origen} hacia ${destino}` : '';
  return `${rel} facturo una ${tipo} de ${f.cliente} con la caja ${caja}${ruta}.`;
}

function componerEstatusActual(v: Viaje): string {
  if (v.observaciones) return v.observaciones;
  const ruta = v.origen && v.destino ? ` ${v.origen} -> ${v.destino}` : '';
  return `${v.estatus}${ruta ? ':' + ruta : ''}`.trim();
}

function semaforoDesdeTono(tono: string | null): SemaforoEntrega {
  if (tono === 'red') return 'rojo';
  if (tono === 'amber') return 'amarillo';
  return 'verde';
}

function ListaNotas({
  fecha,
  tipo,
  titulo,
  numerada,
  puedeEditar,
}: {
  fecha: string;
  tipo: TipoNotaEntregaTurno;
  titulo: string;
  numerada: boolean;
  puedeEditar: boolean;
}) {
  const { entregaTurnoNotas } = useData();
  const [nuevoTexto, setNuevoTexto] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoTexto, setEditandoTexto] = useState('');

  const notas = useMemo(
    () =>
      entregaTurnoNotas.items
        .filter((n) => n.fecha === fecha && n.tipo === tipo)
        .sort((a, b) => a.orden - b.orden),
    [entregaTurnoNotas.items, fecha, tipo],
  );

  function agregar() {
    const texto = nuevoTexto.trim();
    if (!texto) return;
    const orden = notas.reduce((max, n) => Math.max(max, n.orden), 0) + 1;
    entregaTurnoNotas.add({ id: uid('not'), fecha, tipo, texto, orden });
    setNuevoTexto('');
  }

  function guardarEdicion(id: string) {
    const texto = editandoTexto.trim();
    if (texto) entregaTurnoNotas.update(id, { texto });
    setEditandoId(null);
  }

  return (
    <div className="rounded-2xl border border-line-800 bg-bg-800 p-5">
      <h3 className="mb-3 text-sm font-semibold text-ink-100">{titulo}</h3>
      {notas.length === 0 && <p className="mb-3 text-sm text-ink-600">Sin notas todavia.</p>}
      <ul className="mb-3 space-y-2">
        {notas.map((n, i) => (
          <li key={n.id} className="flex items-start gap-2 text-sm text-ink-300">
            <span className="mt-0.5 text-ink-600">{numerada ? `${i + 1}.` : '•'}</span>
            {editandoId === n.id ? (
              <input
                autoFocus
                value={editandoTexto}
                onChange={(e) => setEditandoTexto(e.target.value)}
                onBlur={() => guardarEdicion(n.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') guardarEdicion(n.id);
                  if (e.key === 'Escape') setEditandoId(null);
                }}
                className={`${inputClass} flex-1 py-1`}
              />
            ) : (
              <span
                className={`flex-1 ${puedeEditar ? 'cursor-pointer hover:text-ink-100' : ''}`}
                onClick={() => {
                  if (!puedeEditar) return;
                  setEditandoId(n.id);
                  setEditandoTexto(n.texto);
                }}
              >
                {n.texto}
              </span>
            )}
            {puedeEditar && (
              <button
                type="button"
                onClick={() => entregaTurnoNotas.remove(n.id)}
                className="text-ink-600 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            )}
          </li>
        ))}
      </ul>
      {puedeEditar && (
        <div className="flex items-center gap-2">
          <input
            value={nuevoTexto}
            onChange={(e) => setNuevoTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                agregar();
              }
            }}
            placeholder="Agregar..."
            className={`${inputClass} flex-1`}
          />
          <GhostButton type="button" onClick={agregar}>
            <Plus size={14} />
          </GhostButton>
        </div>
      )}
    </div>
  );
}

export function EntregaTurnoPage() {
  const { entregaTurnoUnidades, entregaTurnoNotas, unidades, operadores, viajes, facturasSistema, estatusViajes } =
    useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('EntregaTurno', 'crear');
  const puedeEditar = hasPermission('EntregaTurno', 'editar');
  const puedeEliminar = hasPermission('EntregaTurno', 'eliminar');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EntregaTurnoUnidad | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [generando, setGenerando] = useState(false);

  const unidadesDelDia = useMemo(
    () =>
      entregaTurnoUnidades.items
        .filter((u) => u.fecha === fecha)
        .sort((a, b) => a.orden - b.orden),
    [entregaTurnoUnidades.items, fecha],
  );

  const notasDelDia = useMemo(
    () => entregaTurnoNotas.items.filter((n) => n.fecha === fecha),
    [entregaTurnoNotas.items, fecha],
  );

  const emptyForm: Omit<EntregaTurnoUnidad, 'id'> = {
    fecha,
    unidadTexto: '',
    operadorTexto: '',
    servicioAnterior: '',
    semaforo: 'verde',
    estatusActual: '',
    notaAdicional: '',
    cita: '',
    instruccion: '',
    proximoServicio: '',
    resumenEstatus: '',
    resumenSiguiente: '',
    orden: unidadesDelDia.reduce((max, u) => Math.max(max, u.orden), 0) + 1,
  };
  const [form, setForm] = useState(emptyForm);

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, orden: unidadesDelDia.reduce((max, u) => Math.max(max, u.orden), 0) + 1 });
    setModalOpen(true);
  }

  function openEdit(u: EntregaTurnoUnidad) {
    setEditing(u);
    setForm(u);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      entregaTurnoUnidades.update(editing.id, form);
    } else {
      entregaTurnoUnidades.add({ id: uid('ent'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(u: EntregaTurnoUnidad) {
    if (confirm(`Quitar "${u.unidadTexto || 'esta unidad'}" de la entrega de turno?`)) {
      entregaTurnoUnidades.remove(u.id);
    }
  }

  function mover(u: EntregaTurnoUnidad, direccion: -1 | 1) {
    const idx = unidadesDelDia.findIndex((x) => x.id === u.id);
    const vecino = unidadesDelDia[idx + direccion];
    if (!vecino) return;
    entregaTurnoUnidades.update(u.id, { orden: vecino.orden });
    entregaTurnoUnidades.update(vecino.id, { orden: u.orden });
  }

  async function generarDesdeOperacion() {
    setGenerando(true);
    try {
      const yaCapturadas = new Set(unidadesDelDia.map((u) => u.unidadTexto.trim().toLowerCase()));
      let siguienteOrden = unidadesDelDia.reduce((max, u) => Math.max(max, u.orden), 0);
      for (const unidad of unidades.items) {
        if (yaCapturadas.has(unidad.economico.trim().toLowerCase())) continue;

        const viajeReciente = viajes.items
          .filter((v) => v.unidadId === unidad.id && v.fecha <= fecha)
          .sort((a, b) => b.fecha.localeCompare(a.fecha))[0];

        const facturaReciente = facturasSistema.items
          .filter(
            (f) =>
              f.fechaOrigen &&
              f.fechaOrigen <= fecha &&
              f.economicoTracto.trim().toLowerCase() === unidad.economico.trim().toLowerCase(),
          )
          .sort((a, b) => b.fechaOrigen.localeCompare(a.fechaOrigen))[0];

        if (!viajeReciente && !facturaReciente) continue;

        const operadorNombre = viajeReciente
          ? (operadores.items.find((o) => o.id === viajeReciente.operadorId)?.nombre ?? '')
          : (operadores.items.find((o) => o.id === unidad.operadorAsignadoId)?.nombre ?? '');
        const tono = viajeReciente
          ? (estatusViajes.items.find((e) => e.nombre === viajeReciente.estatus)?.color ?? null)
          : null;
        const ruta = viajeReciente && viajeReciente.origen && viajeReciente.destino
          ? `${viajeReciente.origen} -> ${viajeReciente.destino}`
          : '';

        siguienteOrden += 1;
        await entregaTurnoUnidades.add({
          id: uid('ent'),
          fecha,
          unidadTexto: unidad.economico,
          operadorTexto: operadorNombre,
          servicioAnterior: facturaReciente ? componerServicioAnterior(facturaReciente, fecha) : '',
          semaforo: semaforoDesdeTono(tono),
          estatusActual: viajeReciente ? componerEstatusActual(viajeReciente) : '',
          notaAdicional: '',
          cita: viajeReciente?.cita ?? '',
          instruccion: '',
          proximoServicio: '',
          resumenEstatus: ruta,
          resumenSiguiente: viajeReciente?.cita ? `Cita: ${viajeReciente.cita}` : '',
          orden: siguienteOrden,
        });
      }
    } finally {
      setGenerando(false);
    }
  }

  const reporte = useMemo(
    () => generarReporte(fecha, unidadesDelDia, notasDelDia),
    [fecha, unidadesDelDia, notasDelDia],
  );

  async function copiarReporte() {
    await navigator.clipboard.writeText(reporte);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  return (
    <div>
      <PageHeader
        title="Entrega de Turno"
        subtitle="Reporte narrativo por unidad para el cambio de turno de trafico."
        addLabel="Agregar unidad"
        onAdd={puedeCrear ? openNew : undefined}
        extra={
          puedeCrear && (
            <GhostButton type="button" onClick={generarDesdeOperacion} disabled={generando}>
              <Sparkles size={16} />
              {generando ? 'Generando...' : 'Generar desde operacion'}
            </GhostButton>
          )
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFecha((f) => shiftDate(f, -1))}
          className="rounded-lg border border-line-700 bg-bg-800 p-2 text-ink-400 hover:text-ink-100"
        >
          <ChevronLeft size={16} />
        </button>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={`${inputClass} w-44`} />
        <button
          onClick={() => setFecha((f) => shiftDate(f, 1))}
          className="rounded-lg border border-line-700 bg-bg-800 p-2 text-ink-400 hover:text-ink-100"
        >
          <ChevronRight size={16} />
        </button>
        <GhostButton type="button" onClick={() => setFecha(new Date().toISOString().slice(0, 10))}>
          Hoy
        </GhostButton>
      </div>

      <div className="space-y-3">
        {unidadesDelDia.length === 0 && (
          <p className="rounded-2xl border border-line-800 bg-bg-800 p-6 text-center text-sm text-ink-600">
            Sin unidades capturadas para esta fecha todavia.
          </p>
        )}
        {unidadesDelDia.map((u, i) => (
          <div key={u.id} className="rounded-2xl border border-line-800 bg-bg-800 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${SEMAFORO_DOT[u.semaforo]}`} />
                <div>
                  <div className="font-semibold text-ink-100">
                    {u.unidadTexto || 'Sin unidad'}
                    {u.operadorTexto && <span className="font-normal text-ink-400"> &ndash; {u.operadorTexto}</span>}
                  </div>
                  {u.estatusActual && <div className="mt-1 text-sm text-ink-300">{u.estatusActual}</div>}
                  {u.instruccion && (
                    <div className="mt-1 text-xs text-ink-500">
                      <span className="font-medium text-ink-400">Instrucción: </span>
                      {u.instruccion}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                {puedeEditar && (
                  <>
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => mover(u, -1)}
                      className="rounded p-1 text-ink-500 hover:text-ink-100 disabled:opacity-20"
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button
                      type="button"
                      disabled={i === unidadesDelDia.length - 1}
                      onClick={() => mover(u, 1)}
                      className="rounded p-1 text-ink-500 hover:text-ink-100 disabled:opacity-20"
                    >
                      <ChevronDown size={15} />
                    </button>
                    <button type="button" onClick={() => openEdit(u)} className="rounded p-1 text-ink-500 hover:text-ink-100">
                      <Pencil size={15} />
                    </button>
                  </>
                )}
                {puedeEliminar && (
                  <button type="button" onClick={() => handleDelete(u)} className="rounded p-1 text-ink-500 hover:text-red-400">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ListaNotas fecha={fecha} tipo="cita" titulo="Citas y compromisos" numerada={false} puedeEditar={puedeEditar} />
        <ListaNotas fecha={fecha} tipo="prioridad" titulo="Prioridades del turno" numerada puedeEditar={puedeEditar} />
      </div>

      {unidadesDelDia.some((u) => u.resumenEstatus || u.resumenSiguiente) && (
        <div className="mt-8 rounded-2xl border border-line-800 bg-bg-800 p-5">
          <h3 className="mb-3 text-sm font-semibold text-ink-100">Resumen rápido</h3>
          <div className="overflow-x-auto rounded-xl border border-line-800">
            <table className="w-full min-w-[480px] text-left text-xs">
              <thead className="bg-bg-700 text-[11px] uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-3 py-2.5">Unidad</th>
                  <th className="px-3 py-2.5">Estatus actual</th>
                  <th className="px-3 py-2.5">Siguiente movimiento / cita</th>
                </tr>
              </thead>
              <tbody>
                {unidadesDelDia
                  .filter((u) => u.resumenEstatus || u.resumenSiguiente)
                  .map((u) => (
                    <tr key={u.id} className="border-t border-line-800">
                      <td className="px-3 py-2 font-medium text-ink-100">{u.unidadTexto}</td>
                      <td className="px-3 py-2 text-ink-300">{u.resumenEstatus}</td>
                      <td className="px-3 py-2 text-ink-300">{u.resumenSiguiente}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-line-800 bg-bg-800 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-100">Reporte generado</h3>
          <GhostButton type="button" onClick={copiarReporte}>
            {copiado ? <Check size={14} /> : <Copy size={14} />}
            {copiado ? 'Copiado' : 'Copiar reporte'}
          </GhostButton>
        </div>
        <Textarea readOnly rows={16} value={reporte} className="font-mono text-xs" />
      </div>

      {modalOpen && (
        <Modal
          title={editing ? `Editar ${editing.unidadTexto || 'unidad'}` : 'Agregar unidad a la entrega'}
          subtitle="Describe el ultimo servicio, el estatus actual y las instrucciones para el siguiente turno"
          onClose={() => setModalOpen(false)}
          wide
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Unidad">
              <Input
                required
                list="entrega-unidades-lista"
                placeholder="Ej. T01, FLEET - FD41..."
                value={form.unidadTexto}
                onChange={(e) => setForm({ ...form, unidadTexto: e.target.value })}
              />
              <datalist id="entrega-unidades-lista">
                {unidades.items.map((u) => (
                  <option key={u.id} value={u.economico} />
                ))}
              </datalist>
            </Field>
            <Field label="Operador">
              <Input
                list="entrega-operadores-lista"
                placeholder="Ej. Orlando Dorbecker"
                value={form.operadorTexto}
                onChange={(e) => setForm({ ...form, operadorTexto: e.target.value })}
              />
              <datalist id="entrega-operadores-lista">
                {operadores.items.map((o) => (
                  <option key={o.id} value={o.nombre} />
                ))}
              </datalist>
            </Field>

            <div className="sm:col-span-2">
              <Field label="Semaforo del estatus">
                <div className="flex gap-2">
                  {(['verde', 'amarillo', 'rojo'] as SemaforoEntrega[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, semaforo: s })}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${
                        form.semaforo === s ? 'border-breco-500/50 bg-breco-500/10 text-ink-100' : 'border-line-700 text-ink-400'
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${SEMAFORO_DOT[s]}`} />
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Ultimo servicio facturado">
                <Textarea
                  rows={2}
                  placeholder="Ej. Ayer, martes 25/08, facturo una IMPO de Silverroute con la caja 210577, de Nuevo Laredo hacia Cuautitlan Izcalli."
                  value={form.servicioAnterior}
                  onChange={(e) => setForm({ ...form, servicioAnterior: e.target.value })}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Estatus actual">
                <Textarea
                  rows={2}
                  placeholder="Ej. Actualmente circula a la altura de Matehuala, en transito rumbo a Cuautitlan Izcalli."
                  value={form.estatusActual}
                  onChange={(e) => setForm({ ...form, estatusActual: e.target.value })}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Nota adicional (opcional)">
                <Textarea
                  rows={2}
                  placeholder="Ej. La caseta no paso y el operador no lleva tarjeta..."
                  value={form.notaAdicional}
                  onChange={(e) => setForm({ ...form, notaAdicional: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Cita">
              <Input
                placeholder="Ej. hoy, miercoles 26/08, a las 08:00 hrs"
                value={form.cita}
                onChange={(e) => setForm({ ...form, cita: e.target.value })}
              />
            </Field>
            <Field label="Proximo servicio">
              <Input
                placeholder="Ej. EXPO, pendiente de asignacion"
                value={form.proximoServicio}
                onChange={(e) => setForm({ ...form, proximoServicio: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Instruccion">
                <Textarea
                  rows={2}
                  placeholder="Ej. continuar con la IMPO de Silverroute rumbo a Cuautitlan Izcalli y confirmar llegada con cliente."
                  value={form.instruccion}
                  onChange={(e) => setForm({ ...form, instruccion: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Resumen: estatus actual (tabla)">
              <Input
                placeholder="Ej. Matehuala -> Cuautitlan"
                value={form.resumenEstatus}
                onChange={(e) => setForm({ ...form, resumenEstatus: e.target.value })}
              />
            </Field>
            <Field label="Resumen: siguiente movimiento (tabla)">
              <Input
                placeholder="Ej. IMPO 210577 / cita por confirmar"
                value={form.resumenSiguiente}
                onChange={(e) => setForm({ ...form, resumenSiguiente: e.target.value })}
              />
            </Field>

            <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
              <GhostButton type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit">{editing ? 'Guardar cambios' : 'Agregar'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
