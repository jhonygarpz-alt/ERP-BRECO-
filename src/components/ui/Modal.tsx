import { type ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean | 'xl';
}

/*
 * Muchos modales de esta app (buscadores, "alta rapida", trazar ruta, etc.)
 * se abren desde un boton dentro de OTRO modal que ya esta abierto -- y no
 * estan anidados en el arbol de React, sino como bloques hermanos en el
 * mismo componente. Con un z-index fijo, cual queda encima dependeria del
 * orden en el que aparecen en el JSX, y un modal "hijo" declarado antes que
 * su "padre" terminaria oculto e inutilizable detras de el. Este contador
 * le da a cada Modal que se monta un z-index mayor al del anterior, para
 * que el que se abrio mas recientemente siempre quede arriba sin importar
 * el orden en el codigo.
 */
let contadorModales = 0;

export function Modal({ title, subtitle, onClose, children, wide }: ModalProps) {
  const zIndexRef = useRef(0);
  if (!zIndexRef.current) {
    contadorModales += 1;
    zIndexRef.current = 50 + contadorModales;
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8 backdrop-blur-sm"
      style={{ zIndex: zIndexRef.current }}
    >
      <div
        className={`w-full ${wide === 'xl' ? 'max-w-5xl' : wide ? 'max-w-2xl' : 'max-w-lg'} rounded-2xl border border-line-700 bg-bg-800 shadow-2xl shadow-black/50`}
      >
        <div className="flex items-start justify-between border-b border-line-700 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink-100">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-500 transition hover:bg-bg-700 hover:text-ink-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
