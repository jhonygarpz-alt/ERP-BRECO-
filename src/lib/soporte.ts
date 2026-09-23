import type { TicketSoporte } from '../types';

export const MINUTOS_AUTO_CIERRE = 5;

/** El chat se cierra solo si el ultimo mensaje lo escribio soporte y el cliente no contesto en MINUTOS_AUTO_CIERRE. */
export function debeAutoCerrarse(ticket: TicketSoporte): boolean {
  if (ticket.estatus !== 'Atendido') return false;
  const ultimo = ticket.mensajes[ticket.mensajes.length - 1];
  if (!ultimo || ultimo.autor !== 'soporte') return false;
  const transcurridoMs = Date.now() - new Date(ultimo.fecha).getTime();
  return transcurridoMs > MINUTOS_AUTO_CIERRE * 60 * 1000;
}
