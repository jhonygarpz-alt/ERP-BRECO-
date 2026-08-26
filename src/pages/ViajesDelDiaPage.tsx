import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '../lib/DataContext';
import { useAuth } from '../lib/AuthContext';
import type { Viaje } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { GhostButton, inputClass } from '../components/ui/form';

function shiftDate(date: string, dias: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function servicioTexto(v: Viaje): string {
  if (v.importacion && v.exportacion) return 'IMPO / EXPO';
  if (v.importacion) return 'IMPO';
  if (v.exportacion) return 'EXPO';
  return '—';
}

function CeldaEditable({ valor, onGuardar, editable }: { valor: string; onGuardar: (v: string) => void; editable: boolean }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(valor);

  function guardar() {
    setEditando(false);
    if (texto !== valor) onGuardar(texto);
  }

  if (editando) {
    return (
      <input
        autoFocus
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={guardar}
        onKeyDown={(e) => {
          if (e.key === 'Enter') guardar();
          if (e.key === 'Escape') {
            setTexto(valor);
            setEditando(false);
          }
        }}
        className={`${inputClass} min-w-[160px] py-1`}
      />
    );
  }

  return (
    <div
      onClick={() => {
        if (!editable) return;
        setTexto(valor);
        setEditando(true);
      }}
      className={`min-h-[1.5rem] rounded px-1 -mx-1 ${editable ? 'cursor-text hover:bg-bg-700' : ''} ${valor ? 'text-ink-300' : 'text-ink-600'}`}
    >
      {valor || (editable ? 'Agregar...' : '—')}
    </div>
  );
}

export function ViajesDelDiaPage() {
  const { viajes, clientes, unidades, operadores } = useData();
  const { hasPermission } = useAuth();
  const puedeEditar = hasPermission('Viajes', 'editar');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));

  const clienteNombre = (id: string) => clientes.items.find((c) => c.id === id)?.nombre ?? 'N/D';
  const unidadNombre = (id: string) => unidades.items.find((u) => u.id === id)?.economico ?? 'N/D';
  const operadorNombre = (id: string) => operadores.items.find((o) => o.id === id)?.nombre ?? 'N/D';

  const viajesDelDia = useMemo(
    () =>
      viajes.items
        .filter((v) => v.fecha === fecha)
        .sort((a, b) => unidadNombre(a.unidadId).localeCompare(unidadNombre(b.unidadId))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viajes.items, fecha, unidades.items],
  );

  return (
    <div>
      <PageHeader
        title="Viajes del Dia"
        subtitle="Vista rapida de la operacion del dia: unidad, ruta y ubicacion actual."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
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

      <div className="overflow-x-auto rounded-2xl border border-line-800 bg-bg-800">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-bg-700 text-[11px] uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-3 py-2.5">Unidad</th>
              <th className="px-3 py-2.5">Operador</th>
              <th className="px-3 py-2.5">Remolque</th>
              <th className="px-3 py-2.5">Cliente</th>
              <th className="px-3 py-2.5">Servicio</th>
              <th className="px-3 py-2.5">Origen / Destino</th>
              <th className="px-3 py-2.5">Ubicacion actual</th>
              <th className="px-3 py-2.5">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {viajesDelDia.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-ink-600">
                  Sin viajes para esta fecha.
                </td>
              </tr>
            )}
            {viajesDelDia.map((v) => (
              <tr key={v.id} className="border-t border-line-800 align-top">
                <td className="px-3 py-2.5 font-medium text-ink-100">{unidadNombre(v.unidadId)}</td>
                <td className="px-3 py-2.5 text-ink-300">{operadorNombre(v.operadorId)}</td>
                <td className="px-3 py-2.5 text-ink-300">
                  {v.cajaNombre} {v.cajaEconomico}
                </td>
                <td className="px-3 py-2.5 text-ink-300">{clienteNombre(v.clienteId)}</td>
                <td className="px-3 py-2.5 text-ink-300">{servicioTexto(v)}</td>
                <td className="px-3 py-2.5 text-ink-300">
                  {v.origen} &rarr; {v.destino}
                </td>
                <td className="px-3 py-2.5">
                  <CeldaEditable
                    valor={v.ubicacionActual}
                    editable={puedeEditar}
                    onGuardar={(texto) => viajes.update(v.id, { ubicacionActual: texto })}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <CeldaEditable
                    valor={v.observaciones}
                    editable={puedeEditar}
                    onGuardar={(texto) => viajes.update(v.id, { observaciones: texto })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
