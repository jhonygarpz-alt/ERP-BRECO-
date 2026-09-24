import { useEffect, useMemo, useRef, useState } from 'react';
import { campoClass } from './form';
import { useCampoResaltado, estaLleno } from '../../lib/CampoResaltadoContext';

// Campo "codigo" tecleable con autocompletado, para reemplazar los campos
// de solo lectura que obligaban a abrir el buscador completo para asignar
// un cliente/unidad/remolque/ruta, etc. Al escribir el numero o codigo que
// corresponde en el catalogo, se filtra en el momento (sin llamadas a
// servidor, ya que las colecciones ya estan cargadas en memoria) y, en
// cuanto el texto coincide exactamente con un codigo, se selecciona solo.
export function ComboBoxCodigo<T>({
  items,
  valor,
  obtenerCodigo,
  obtenerEtiqueta,
  onSeleccionar,
  onLimpiar,
  placeholder,
  className,
}: {
  items: T[];
  valor: string;
  obtenerCodigo: (item: T) => string;
  obtenerEtiqueta: (item: T) => string;
  onSeleccionar: (item: T) => void;
  onLimpiar?: () => void;
  placeholder?: string;
  className?: string;
}) {
  const [texto, setTexto] = useState(valor);
  const [abierto, setAbierto] = useState(false);
  const enfocadoRef = useRef(false);
  const resaltar = useCampoResaltado();

  useEffect(() => {
    if (!enfocadoRef.current) setTexto(valor);
  }, [valor]);

  const sugerencias = useMemo(() => {
    const termino = texto.trim().toLowerCase();
    // Sin nada escrito se muestran los primeros registros (para poder
    // "navegar" el catalogo aunque no se recuerde el codigo exacto), y al
    // escribir se busca tanto en el codigo como en la etiqueta (nombre,
    // marca/modelo, etc.) para que un termino parcial tambien encuentre
    // coincidencias.
    if (!termino) return items.slice(0, 8);
    return items
      .filter((item) => `${obtenerCodigo(item)} ${obtenerEtiqueta(item)}`.toLowerCase().includes(termino))
      .slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, texto]);

  function manejarCambio(nuevoTexto: string) {
    setTexto(nuevoTexto);
    setAbierto(true);
    const termino = nuevoTexto.trim().toLowerCase();
    if (!termino) {
      onLimpiar?.();
      return;
    }
    const exacto = items.find((item) => obtenerCodigo(item).toLowerCase() === termino);
    if (exacto) onSeleccionar(exacto);
  }

  function seleccionar(item: T) {
    setTexto(obtenerCodigo(item));
    onSeleccionar(item);
    setAbierto(false);
  }

  return (
    <div className="relative">
      <input
        className={`${campoClass(resaltar && estaLleno(valor))} ${className ?? ''}`}
        value={texto}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => manejarCambio(e.target.value)}
        onFocus={() => {
          enfocadoRef.current = true;
          setAbierto(true);
        }}
        onBlur={() => {
          enfocadoRef.current = false;
          setAbierto(false);
          setTexto(valor);
        }}
      />
      {abierto && sugerencias.length > 0 && (
        <ul className="absolute z-20 mt-1 w-64 max-w-xs overflow-hidden rounded-lg border border-line-700 bg-bg-800 shadow-xl">
          {sugerencias.map((item, i) => (
            <li
              key={i}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => seleccionar(item)}
              className="cursor-pointer px-3 py-2 text-sm text-ink-200 hover:bg-bg-700"
            >
              <span className="font-mono text-xs text-breco-400">{obtenerCodigo(item)}</span>
              <span className="ml-2 truncate text-ink-300">{obtenerEtiqueta(item)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
