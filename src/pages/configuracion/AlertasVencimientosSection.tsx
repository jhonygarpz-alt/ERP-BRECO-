import { useState } from 'react';
import { useData } from '../../lib/DataContext';
import { DEFAULT_ALERTAS_VENCIMIENTOS } from '../../lib/alertasVencimientosConfig';
import type { AlertasVencimientosConfig } from '../../types';
import { Field, GhostButton, Input, PrimaryButton } from '../../components/ui/form';

const CHECKS_UNIDAD: { key: keyof AlertasVencimientosConfig['unidad']; label: string }[] = [
  { key: 'placas', label: 'Placas' },
  { key: 'permisos', label: 'Permisos' },
  { key: 'seguroPlacaMexicana', label: 'Seguro placa mexicana' },
  { key: 'seguroPlacaAmericana', label: 'Seguro placa americana' },
  { key: 'documentosAdicionales', label: 'Documentos Adicionales' },
];

const CHECKS_OPERADOR: { key: keyof AlertasVencimientosConfig['operador']; label: string }[] = [
  { key: 'licencia', label: 'Licencia' },
  { key: 'pasaporte', label: 'Pasaporte' },
  { key: 'documentosAdicionales', label: 'Documentos Adicionales' },
];

export function AlertasVencimientosSection() {
  const { empresa } = useData();
  const [config, setConfig] = useState<AlertasVencimientosConfig>(empresa.value.alertasVencimientos ?? DEFAULT_ALERTAS_VENCIMIENTOS);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  function toggleUnidad(key: keyof AlertasVencimientosConfig['unidad']) {
    setConfig((c) => ({ ...c, unidad: { ...c.unidad, [key]: !c.unidad[key] } }));
    setGuardado(false);
  }

  function toggleOperador(key: keyof AlertasVencimientosConfig['operador']) {
    setConfig((c) => ({ ...c, operador: { ...c.operador, [key]: !c.operador[key] } }));
    setGuardado(false);
  }

  async function guardar() {
    setGuardando(true);
    await empresa.update({ alertasVencimientos: config });
    setGuardando(false);
    setGuardado(true);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-100">Alertas de Vencimientos</h2>
        <p className="mt-1 text-sm text-ink-500">
          Elige que documentos de Unidades y Operadores generan una alerta en el sistema cuando estan por vencer, y con cuantos dias
          de anticipacion.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line-800 bg-bg-800 p-4">
          <h3 className="mb-3 text-sm font-semibold text-ink-100">Vencimiento de Doc. Unidad</h3>
          <div className="space-y-2">
            {CHECKS_UNIDAD.map((c) => (
              <label key={c.key} className="flex items-center gap-2 text-sm text-ink-300">
                <input
                  type="checkbox"
                  checked={config.unidad[c.key] as boolean}
                  onChange={() => toggleUnidad(c.key)}
                  className="h-4 w-4 accent-breco-500"
                />
                {c.label}
              </label>
            ))}
          </div>
          <div className="mt-4">
            <Field label="Dias para notificar proximo vencimiento">
              <Input
                type="number"
                min="0"
                value={config.unidad.diasNotificar}
                onChange={(e) => {
                  setConfig((c) => ({ ...c, unidad: { ...c.unidad, diasNotificar: Number(e.target.value) || 0 } }));
                  setGuardado(false);
                }}
              />
            </Field>
          </div>
        </div>

        <div className="rounded-2xl border border-line-800 bg-bg-800 p-4">
          <h3 className="mb-3 text-sm font-semibold text-ink-100">Vencimiento de Doc. Operador</h3>
          <div className="space-y-2">
            {CHECKS_OPERADOR.map((c) => (
              <label key={c.key} className="flex items-center gap-2 text-sm text-ink-300">
                <input
                  type="checkbox"
                  checked={config.operador[c.key] as boolean}
                  onChange={() => toggleOperador(c.key)}
                  className="h-4 w-4 accent-breco-500"
                />
                {c.label}
              </label>
            ))}
          </div>
          <div className="mt-4">
            <Field label="Dias para notificar proximo vencimiento">
              <Input
                type="number"
                min="0"
                value={config.operador.diasNotificar}
                onChange={(e) => {
                  setConfig((c) => ({ ...c, operador: { ...c.operador, diasNotificar: Number(e.target.value) || 0 } }));
                  setGuardado(false);
                }}
              />
            </Field>
          </div>
        </div>
      </div>

      <p className="text-xs text-ink-500">
        Las alertas aparecen en la campana de notificaciones y en el Dashboard. Un documento marca alerta cuando le faltan estos dias
        (o menos) para vencer, incluyendo los que ya vencieron.
      </p>

      <div className="flex items-center gap-3">
        <PrimaryButton type="button" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar'}
        </PrimaryButton>
        {guardado && <span className="text-sm text-emerald-400">Guardado.</span>}
        <GhostButton
          type="button"
          onClick={() => {
            setConfig(DEFAULT_ALERTAS_VENCIMIENTOS);
            setGuardado(false);
          }}
        >
          Restaurar valores por defecto
        </GhostButton>
      </div>
    </div>
  );
}
