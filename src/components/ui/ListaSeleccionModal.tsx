import { useMemo, useState, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from './Modal';
import { GhostButton, Input } from './form';

/** Modal generico de busqueda/seleccion sobre una lista ya cargada en memoria (Cliente, Remolque, Concepto, Ruta...). */
export function ListaSeleccionModal<T>({
  title,
  items,
  filtro,
  renderRow,
  onSelect,
  onClose,
  accionExtra,
}: {
  title: string;
  items: T[];
  filtro: (item: T, termino: string) => boolean;
  renderRow: (item: T) => ReactNode;
  onSelect: (item: T) => void;
  onClose: () => void;
  accionExtra?: { label: string; onClick: () => void };
}) {
  const [termino, setTermino] = useState('');
  const filtrados = useMemo(() => items.filter((i) => filtro(i, termino.trim().toLowerCase())), [items, filtro, termino]);

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input autoFocus className="flex-1" placeholder="Buscar..." value={termino} onChange={(e) => setTermino(e.target.value)} />
          {accionExtra && (
            <GhostButton type="button" onClick={accionExtra.onClick}>
              <Plus size={14} />
              {accionExtra.label}
            </GhostButton>
          )}
        </div>
        <div className="max-h-96 overflow-auto rounded-xl border border-line-800">
          {filtrados.length === 0 ? (
            <p className="p-4 text-center text-sm text-ink-600">Sin resultados.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <tbody>
                {filtrados.map((item, i) => (
                  <tr
                    key={i}
                    onClick={() => onSelect(item)}
                    className="cursor-pointer border-b border-line-800/70 last:border-0 hover:bg-bg-800"
                  >
                    {renderRow(item)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
}
