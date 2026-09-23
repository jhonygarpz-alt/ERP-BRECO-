import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import { hoyISO } from '../../lib/fechas';
import { CHECKLIST_FISICOMECANICO_TEMPLATE, nextFolioMantenimiento } from '../../lib/mantenimiento';
import type { ChecklistFisicomecanico, ChecklistFisicomecanicoItem, ResultadoChecklistItem } from '../../types';
import { Modal } from '../ui/Modal';
import { ListaSeleccionModal } from '../ui/ListaSeleccionModal';
import { Field, GhostButton, Input, PrimaryButton, Textarea, ToolbarButton } from '../ui/form';

const RESULTADOS: { value: ResultadoChecklistItem; label: string; tono: string }[] = [
  { value: 'Bien', label: 'Bien', tono: 'border-emerald-500 bg-emerald-500/10 text-emerald-400' },
  { value: 'Regular', label: 'Regular', tono: 'border-amber-500 bg-amber-500/10 text-amber-400' },
  { value: 'Malo', label: 'Malo', tono: 'border-red-500 bg-red-500/10 text-red-400' },
  { value: 'N/A', label: 'N/A', tono: 'border-line-700 bg-bg-800 text-ink-500' },
];

function construirChecklist(checklists: ChecklistFisicomecanico[]): Omit<ChecklistFisicomecanico, 'id'> {
  return {
    folio: nextFolioMantenimiento(checklists, 'CHK-'),
    fecha: hoyISO(),
    unidadId: '',
    operadorId: undefined,
    items: CHECKLIST_FISICOMECANICO_TEMPLATE.map((t) => ({ id: uid('cki'), seccion: t.seccion, concepto: t.concepto, resultado: 'Bien', observaciones: '' })),
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

  const totalMalo = form.items.filter((i) => i.resultado === 'Malo').length;

  return (
    <Modal title={soloLectura ? `Consultar checklist ${form.folio}` : editing ? `Editar checklist ${form.folio}` : 'Checklist Fisicomecanico Rapido'} onClose={onClose} wide="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-breco-500/10 px-3 py-2 text-sm text-breco-500">{error}</p>}
        {totalMalo > 0 && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {totalMalo} punto{totalMalo === 1 ? '' : 's'} marcado{totalMalo === 1 ? '' : 's'} como "Malo" -- considera generar un Reporte de Falla.
          </p>
        )}

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
            {secciones.map((seccion) => (
              <div key={seccion} className="rounded-xl border border-line-800 p-3">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-breco-500">{seccion}</h4>
                <div className="space-y-2">
                  {form.items
                    .filter((i) => i.seccion === seccion)
                    .map((i) => (
                      <div key={i.id} className="flex flex-wrap items-center gap-2 border-t border-line-800/70 pt-2 first:border-0 first:pt-0">
                        <span className="min-w-[220px] flex-1 text-sm text-ink-200">{i.concepto}</span>
                        <div className="flex gap-1">
                          {RESULTADOS.map((r) => (
                            <button
                              key={r.value}
                              type="button"
                              onClick={() => actualizarItem(i.id, { resultado: r.value })}
                              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                                i.resultado === r.value ? r.tono : 'border-line-700 text-ink-500 hover:border-line-600'
                              }`}
                            >
                              {r.label}
                            </button>
                          ))}
                        </div>
                        <Input
                          value={i.observaciones}
                          onChange={(e) => actualizarItem(i.id, { observaciones: e.target.value })}
                          placeholder="Observaciones..."
                          className="w-48"
                        />
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          <Field label="Observaciones Generales">
            <Textarea rows={3} value={form.observacionesGenerales} onChange={(e) => setForm({ ...form, observacionesGenerales: e.target.value })} />
          </Field>
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
