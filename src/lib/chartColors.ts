import type { Tone } from '../components/ui/Badge';

// Mismos colores que ya usan los badges de estatus (Badge.tsx TONE_DOT), en
// hex, para que las graficas de los reportes usen exactamente la misma
// paleta que el resto del sistema en vez de inventar una nueva.
export const TONE_HEX: Record<Tone, string> = {
  green: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
  blue: '#3b82f6',
  gray: '#8992a6',
  purple: '#8b5cf6',
  orange: '#f97316',
  pink: '#ec4899',
  cyan: '#06b6d4',
  yellow: '#eab308',
  teal: '#14b8a6',
  indigo: '#6366f1',
  lime: '#84cc16',
  sky: '#0ea5e9',
};

export const ORDEN_CATEGORICO: Tone[] = ['blue', 'amber', 'green', 'red', 'purple', 'orange', 'cyan', 'pink', 'teal', 'indigo'];

export const COLOR_MARCA = '#e11d2e';
