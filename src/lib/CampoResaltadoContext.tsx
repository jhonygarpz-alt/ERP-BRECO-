import { createContext, useContext } from 'react';

/**
 * Cuando esta activo, los campos Input/Select/Textarea de components/ui/form
 * se sombrean en verde en cuanto tienen contenido, para visualizar de un
 * vistazo que falta por llenar en formularios largos (Viaje/Carta Porte).
 * Desactivado por defecto para no afectar el resto de la app.
 */
const CampoResaltadoContext = createContext(false);

export const CampoResaltadoProvider = CampoResaltadoContext.Provider;

export function useCampoResaltado(): boolean {
  return useContext(CampoResaltadoContext);
}

export function estaLleno(valor: unknown): boolean {
  if (valor === undefined || valor === null) return false;
  if (typeof valor === 'string') return valor.trim() !== '';
  if (typeof valor === 'number') return valor !== 0;
  if (Array.isArray(valor)) return valor.length > 0;
  return Boolean(valor);
}
