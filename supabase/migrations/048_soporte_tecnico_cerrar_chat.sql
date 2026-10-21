-- ============================================================================
-- Soporte Tecnico: agrega el estatus "Cerrado" para poder finalizar una
-- conversacion desde el Panel de plataforma, y para el cierre automatico
-- cuando el cliente no responde 5 minutos despues de que soporte contesto.
-- ============================================================================

alter table public.tickets_soporte drop constraint if exists tickets_soporte_estatus_check;
alter table public.tickets_soporte add constraint tickets_soporte_estatus_check
  check (estatus in ('Nuevo', 'Atendido', 'Cerrado'));
