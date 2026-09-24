import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import { campoClass, Input, ToolbarButton } from '../ui/form';
import { useCampoResaltado, estaLleno } from '../../lib/CampoResaltadoContext';

/**
 * Campo de "clave SAT" tecleable con autocompletado: al escribir se busca en
 * el catalogo oficial (via el hook `useCatalogo` recibido) y, en cuanto el
 * texto coincide exactamente con una clave, se autocompleta la
 * descripcion/nombre sin tener que abrir el buscador. El boton "..." sigue
 * disponible para abrir el buscador completo cuando no se recuerda la clave.
 */
export function ClaveSatField<T>({
  clave,
  etiqueta,
  useCatalogo,
  obtenerClave,
  obtenerEtiqueta,
  onSeleccionar,
  onLimpiar,
  onAbrirBuscador,
  placeholderClave = 'Clave',
  placeholderEtiqueta = 'Descripcion',
  claveClassName = 'w-28',
  icono: Icono = MoreHorizontal,
}: {
  clave: string;
  etiqueta: string;
  useCatalogo: (termino: string) => T[];
  obtenerClave: (item: T) => string;
  obtenerEtiqueta: (item: T) => string;
  onSeleccionar: (item: T) => void;
  onLimpiar?: () => void;
  onAbrirBuscador: () => void;
  placeholderClave?: string;
  placeholderEtiqueta?: string;
  claveClassName?: string;
  icono?: LucideIcon;
}) {
  const [texto, setTexto] = useState(clave);
  const [abierto, setAbierto] = useState(false);
  const enfocadoRef = useRef(false);
  const resaltar = useCampoResaltado();
  const sugerencias = useCatalogo(texto);

  useEffect(() => {
    if (!enfocadoRef.current) setTexto(clave);
  }, [clave]);

  useEffect(() => {
    const limpio = texto.trim();
    if (!limpio) return;
    const exacto = sugerencias.find((item) => obtenerClave(item).toLowerCase() === limpio.toLowerCase());
    if (exacto) {
      onSeleccionar(exacto);
      setAbierto(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sugerencias]);

  function manejarCambio(nuevoTexto: string) {
    setTexto(nuevoTexto);
    setAbierto(true);
    if (!nuevoTexto.trim()) onLimpiar?.();
  }

  function seleccionar(item: T) {
    setTexto(obtenerClave(item));
    onSeleccionar(item);
    setAbierto(false);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex flex-shrink-0 gap-2">
        <input
          className={`${campoClass(resaltar && estaLleno(clave))} ${claveClassName}`}
          value={texto}
          placeholder={placeholderClave}
          autoComplete="off"
          onChange={(e) => manejarCambio(e.target.value)}
          onFocus={() => {
            enfocadoRef.current = true;
            setAbierto(true);
          }}
          onBlur={() => {
            enfocadoRef.current = false;
            setAbierto(false);
            setTexto(clave);
          }}
        />
        <ToolbarButton type="button" title="Buscar en el catalogo SAT" onClick={onAbrirBuscador}>
          <Icono size={16} />
        </ToolbarButton>
        {abierto && sugerencias.length > 0 && (
          <ul className="absolute left-0 top-full z-20 mt-1 w-72 max-w-xs overflow-hidden rounded-lg border border-line-700 bg-bg-800 shadow-xl">
            {sugerencias.map((item, i) => (
              <li
                key={i}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => seleccionar(item)}
                className="cursor-pointer px-3 py-2 text-sm text-ink-200 hover:bg-bg-700"
              >
                <span className="font-mono text-xs text-breco-400">{obtenerClave(item)}</span>
                <span className="ml-2 truncate text-ink-300">{obtenerEtiqueta(item)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Input className="flex-1" value={etiqueta} readOnly placeholder={placeholderEtiqueta} />
    </div>
  );
}
