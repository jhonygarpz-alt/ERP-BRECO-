import { useMemo, useState } from 'react';
import {
  Disc,
  Droplet,
  Eye,
  FileText,
  Lightbulb,
  MessageSquare,
  OctagonAlert,
  ShieldCheck,
  Truck,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import { hoyISO } from '../../lib/fechas';
import { CHECKLIST_FISICOMECANICO_TEMPLATE, nextFolioMantenimiento } from '../../lib/mantenimiento';
import type { ChecklistFisicomecanico, ChecklistFisicomecanicoItem } from '../../types';
import { ChecklistIlustracion, tieneIlustracion } from './ChecklistIlustracion';
import { Modal } from '../ui/Modal';
import { ListaSeleccionModal } from '../ui/ListaSeleccionModal';
import { Field, GhostButton, Input, PrimaryButton, Textarea, ToolbarButton } from '../ui/form';

const SECCIONES: Record<string, { icon: LucideIcon; barra: string; icono: string }> = {
  'Llantas y Rines': { icon: Disc, barra: 'border-emerald-500/30 bg-emerald-500/10', icono: 'bg-emerald-500/15 text-emerald-400' },
  Frenos: { icon: OctagonAlert, barra: 'border-blue-500/30 bg-blue-500/10', icono: 'bg-blue-500/15 text-blue-400' },
  Luces: { icon: Lightbulb, barra: 'border-amber-500/30 bg-amber-500/10', icono: 'bg-amber-500/15 text-amber-400' },
  'Espejos y Cristales': { icon: Eye, barra: 'border-sky-500/30 bg-sky-500/10', icono: 'bg-sky-500/15 text-sky-400' },
  'Niveles de Fluidos': { icon: Droplet, barra: 'border-cyan-500/30 bg-cyan-500/10', icono: 'bg-cyan-500/15 text-cyan-400' },
  Suspension: { icon: Waves, barra: 'border-indigo-500/30 bg-indigo-500/10', icono: 'bg-indigo-500/15 text-indigo-400' },
  Carroceria: { icon: Truck, barra: 'border-orange-500/30 bg-orange-500/10', icono: 'bg-orange-500/15 text-orange-400' },
  Seguridad: { icon: ShieldCheck, barra: 'border-red-500/30 bg-red-500/10', icono: 'bg-red-500/15 text-red-400' },
  Documentos: { icon: FileText, barra: 'border-line-700 bg-bg-800', icono: 'bg-ink-500/15 text-ink-400' },
};

function construirChecklist(checklists: ChecklistFisicomecanico[]): Omit<ChecklistFisicomecanico, 'id'> {
  return {
    folio: nextFolioMantenimiento(checklists, 'CHK-'),
    fecha: hoyISO(),
    unidadId: '',
    operadorId: undefined,
    items: CHECKLIST_FISICOMECANICO_TEMPLATE.map((t) => ({
      id: uid('cki'),
      seccion: t.seccion,
      concepto: t.concepto,
      descripcion: t.descripcion,
      completado: false,
      observaciones: '',
    })),
    observacionesGenerales: '',
  };
}

export function ChecklistFisicomecanicoFormModal({
  editing,
  soloLectura,
  onClose,
  onGuardar,
}: {
  editing: ChecklistFisicomecanico | null;
  soloLectura: boolean;
  onClose: () => void;
  onGuardar: (datos: Omit<ChecklistFisicomecanico, 'id'>) => void;
}) {
  const { unidades, operadores, checklistsFisicomecanicos } = useData();
  const [form, setForm] = useState<Omit<ChecklistFisicomecanico, 'id'>>(editing ? { ...editing } : construirChecklist(checklistsFisicomecanicos.items));
  const [unidadPickerOpen, setUnidadPickerOpen] = useState(false);
  const [operadorPickerOpen, setOperadorPickerOpen] = useState(false);
  const [error, setError] = useState('');

  const unidadSeleccionada = unidades.items.find((u) => u.id === form.unidadId);
  const operadorSeleccionado = operadores.items.find((o) => o.id === form.operadorId);

  const secciones = useMemo(() => {
    const vistas = new Set<string>();
    const orden: string[] = [];
    form.items.forEach((i) => {
      if (!vistas.has(i.seccion)) {
        vistas.add(i.seccion);
        orden.push(i.seccion);
      }
    });
    return orden;
  }, [form.items]);

  function actualizarItem(id: string, patch: Partial<ChecklistFisicomecanicoItem>) {
    setForm((f) => ({ ...f, items: f.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.unidadId) {
      setError('Selecciona la unidad.');
      return;
    }
    setError('');
    onGuardar(form);
  }

  const totalItems = form.items.length;
  const completados = form.items.filter((i) => i.completado).length;
  const porcentaje = totalItems > 0 ? Math.round((completados / totalItems) * 100) : 0;

  return (
    <Modal
      title="Checklist Fisicomecanico Rapido"
      subtitle="Verifica el estado general de la unidad marcando cada punto de revision."
      onClose={onClose}
      wide="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-breco-500/10 px-3 py-2 text-sm text-breco-500">{error}</p>}

        <fieldset disabled={soloLectura} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Folio">
              <Input readOnly value={form.folio} />
            </Field>
            <Field label="Fecha">
              <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Unidad">
              <div className="flex items-center gap-2">
                <Input readOnly value={unidadSeleccionada ? `${unidadSeleccionada.economico} - ${unidadSeleccionada.placas}` : ''} placeholder="Buscar unidad..." />
                <ToolbarButton type="button" onClick={() => setUnidadPickerOpen(true)}>
                  ...
                </ToolbarButton>
              </div>
            </Field>
            <Field label="Operador">
              <div className="flex items-center gap-2">
                <Input readOnly value={operadorSeleccionado?.nombre ?? ''} placeholder="Buscar operador..." />
                <ToolbarButton type="button" onClick={() => setOperadorPickerOpen(true)}>
                  ...
                </ToolbarButton>
              </div>
            </Field>
          </div>

          <div className="space-y-4">
            {secciones.map((seccion) => {
              const meta = SECCIONES[seccion] ?? SECCIONES.Documentos;
              const Icon = meta.icon;
              const itemsSeccion = form.items.filter((i) => i.seccion === seccion);
              return (
                <div key={seccion} className="overflow-hidden rounded-2xl border border-line-800">
                  <div className={`flex items-center gap-2 border-b px-4 py-2.5 ${meta.barra}`}>
                    <Icon size={16} className="flex-shrink-0" />
                    <h4 className="flex-1 text-xs font-bold uppercase tracking-wide text-ink-100">{seccion}</h4>
                    <span className="text-xs text-ink-500">{itemsSeccion.length} elementos</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 bg-bg-900 p-3 sm:grid-cols-2 lg:grid-cols-3">
                    {itemsSeccion.map((i) => (
                      <div key={i.id} className="flex flex-col rounded-xl border border-line-800 bg-bg-800 p-3">
                        <label className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={i.completado}
                            onChange={(e) => actualizarItem(i.id, { completado: e.target.checked })}
                            className="mt-0.5 h-4 w-4 flex-shrink-0 accent-breco-500"
                          />
                          <span>
                            <span className="block text-sm font-semibold text-ink-100">{i.concepto}</span>
                            <span className="block text-xs text-ink-500">{i.descripcion}</span>
                          </span>
                        </label>
                        {tieneIlustracion(i.concepto) ? (
                          <div className="my-3 overflow-hidden rounded-lg">
                            <ChecklistIlustracion concepto={i.concepto} className="h-28 w-full" />
                          </div>
                        ) : (
                          <div className={`my-3 flex h-20 items-center justify-center rounded-lg ${meta.icono}`}>
                            <Icon size={32} strokeWidth={1.5} />
                          </div>
                        )}
                        <div className="relative">
                          <MessageSquare size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-600" />
                          <input
                            value={i.observaciones}
                            onChange={(e) => actualizarItem(i.id, { observaciones: e.target.value })}
                            placeholder="Observaciones (opcional)..."
                            className="w-full rounded-lg border border-line-700 bg-bg-900 py-1.5 pl-8 pr-2 text-xs text-ink-100 outline-none focus:border-breco-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <Field label="Observaciones Generales">
            <Textarea rows={3} value={form.observacionesGenerales} onChange={(e) => setForm({ ...form, observacionesGenerales: e.target.value })} />
          </Field>
        </fieldset>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-800 pt-4">
          <div className="min-w-[220px] flex-1">
            <div className="mb-1 flex items-center justify-between text-xs text-ink-500">
              <span>Progreso del checklist</span>
              <span>
                {porcentaje}% &middot; {completados} de {totalItems} completados
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-bg-700">
              <div className="h-full rounded-full bg-breco-500 transition-all" style={{ width: `${porcentaje}%` }} />
            </div>
          </div>
          <div className="flex gap-2">
            <GhostButton type="button" onClick={onClose}>
              Cancelar
            </GhostButton>
            {!soloLectura && <PrimaryButton type="submit">Guardar</PrimaryButton>}
          </div>
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
