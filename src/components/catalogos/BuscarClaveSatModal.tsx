import { useState } from 'react';
import { Search } from 'lucide-react';
import { useClaveProdServSat, useClaveUnidadSat, useClaveMaterialPeligrosoSat, useClaveProdServCPSat } from '../../lib/useClaveSat';
import { Modal } from '../ui/Modal';
import { inputClass } from '../ui/form';

export function BuscarClaveProdServModal({
  onSelect,
  onClose,
}: {
  onSelect: (clave: string, descripcion: string) => void;
  onClose: () => void;
}) {
  const [termino, setTermino] = useState('');
  const resultados = useClaveProdServSat(termino);

  return (
    <Modal title="Buscar Clave de Productos y Servicios (SAT)" onClose={onClose}>
      <div className="space-y-3">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-600" />
          <input
            autoFocus
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            placeholder="Escribe al menos 3 letras (clave o descripcion)..."
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="max-h-96 overflow-auto rounded-xl border border-line-800">
          {termino.trim().length < 3 ? (
            <p className="p-4 text-center text-sm text-ink-600">Escribe para buscar en el catalogo del SAT (~52,500 claves).</p>
          ) : resultados.length === 0 ? (
            <p className="p-4 text-center text-sm text-ink-600">Sin resultados.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <tbody>
                {resultados.map((r) => (
                  <tr
                    key={r.clave}
                    onClick={() => onSelect(r.clave, r.descripcion)}
                    className="cursor-pointer border-b border-line-800/70 last:border-0 hover:bg-bg-800"
                  >
                    <td className="px-3 py-2 font-mono text-xs text-ink-500">{r.clave}</td>
                    <td className="px-3 py-2 text-ink-200">{r.descripcion}</td>
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

export function BuscarClaveUnidadModal({
  onSelect,
  onClose,
}: {
  onSelect: (clave: string, nombre: string) => void;
  onClose: () => void;
}) {
  const [termino, setTermino] = useState('');
  const resultados = useClaveUnidadSat(termino);

  return (
    <Modal title="Buscar Clave de Unidad (SAT)" onClose={onClose}>
      <div className="space-y-3">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-600" />
          <input
            autoFocus
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            placeholder="Escribe al menos 3 letras (clave o nombre)..."
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="max-h-96 overflow-auto rounded-xl border border-line-800">
          {termino.trim().length < 3 ? (
            <p className="p-4 text-center text-sm text-ink-600">Escribe para buscar en el catalogo del SAT (~2,400 claves).</p>
          ) : resultados.length === 0 ? (
            <p className="p-4 text-center text-sm text-ink-600">Sin resultados.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <tbody>
                {resultados.map((r) => (
                  <tr
                    key={r.clave}
                    onClick={() => onSelect(r.clave, r.nombre)}
                    className="cursor-pointer border-b border-line-800/70 last:border-0 hover:bg-bg-800"
                  >
                    <td className="px-3 py-2 font-mono text-xs text-ink-500">{r.clave}</td>
                    <td className="px-3 py-2 text-ink-200">{r.nombre}</td>
                    <td className="px-3 py-2 text-ink-500">{r.simbolo}</td>
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

export function BuscarClaveProdServCPModal({
  onSelect,
  onClose,
}: {
  onSelect: (clave: string, descripcion: string) => void;
  onClose: () => void;
}) {
  const [termino, setTermino] = useState('');
  const resultados = useClaveProdServCPSat(termino);

  return (
    <Modal title="Buscar Clave de Bienes Transportados - Carta Porte (SAT)" onClose={onClose}>
      <div className="space-y-3">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-600" />
          <input
            autoFocus
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            placeholder="Escribe al menos 3 letras (clave o descripcion)..."
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="max-h-96 overflow-auto rounded-xl border border-line-800">
          {termino.trim().length < 3 ? (
            <p className="p-4 text-center text-sm text-ink-600">Escribe para buscar en el catalogo del SAT (~48,800 claves).</p>
          ) : resultados.length === 0 ? (
            <p className="p-4 text-center text-sm text-ink-600">Sin resultados.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <tbody>
                {resultados.map((r) => (
                  <tr
                    key={r.clave}
                    onClick={() => onSelect(r.clave, r.descripcion)}
                    className="cursor-pointer border-b border-line-800/70 last:border-0 hover:bg-bg-800"
                  >
                    <td className="px-3 py-2 font-mono text-xs text-ink-500">{r.clave}</td>
                    <td className="px-3 py-2 text-ink-200">{r.descripcion}</td>
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

export function BuscarClaveMaterialPeligrosoModal({
  onSelect,
  onClose,
}: {
  onSelect: (clave: string, descripcion: string) => void;
  onClose: () => void;
}) {
  const [termino, setTermino] = useState('');
  const resultados = useClaveMaterialPeligrosoSat(termino);

  return (
    <Modal title="Buscar Clave de Material Peligroso (SAT)" onClose={onClose}>
      <div className="space-y-3">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-600" />
          <input
            autoFocus
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            placeholder="Escribe al menos 3 letras (clave o descripcion)..."
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="max-h-96 overflow-auto rounded-xl border border-line-800">
          {termino.trim().length < 3 ? (
            <p className="p-4 text-center text-sm text-ink-600">Escribe para buscar en el catalogo del SAT (~2,346 claves). Una misma clave puede tener varias descripciones (distinta concentracion/variante).</p>
          ) : resultados.length === 0 ? (
            <p className="p-4 text-center text-sm text-ink-600">Sin resultados.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <tbody>
                {resultados.map((r, i) => (
                  <tr
                    key={`${r.clave}-${i}`}
                    onClick={() => onSelect(r.clave, r.descripcion)}
                    className="cursor-pointer border-b border-line-800/70 last:border-0 hover:bg-bg-800"
                  >
                    <td className="px-3 py-2 font-mono text-xs text-ink-500">{r.clave}</td>
                    <td className="px-3 py-2 text-ink-200">{r.descripcion}</td>
                    <td className="px-3 py-2 text-xs text-ink-500">{r.claseODivision}</td>
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
