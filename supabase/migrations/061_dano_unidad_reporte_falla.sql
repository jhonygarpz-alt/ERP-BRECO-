-- ============================================================================
-- Enlaza cada dano registrado en Flota Digital 360 con el Reporte de Falla
-- que se genera automaticamente en Mantenimiento, para que el usuario pueda
-- ver de un vistazo (desde la pestana Danos de la unidad) el folio del
-- reporte al que dio pie -- sin duplicar logica de negocio: el reporte
-- sigue viviendo y editandose solo en Mantenimiento > Reportes de Fallas.
-- ============================================================================

alter table public.unidad_danos
  add column if not exists reporte_falla_id text references public.reportes_falla (id) on delete set null;

create index if not exists idx_unidad_danos_reporte_falla_id on public.unidad_danos (reporte_falla_id);

-- Quien puede registrar un dano (permiso 'Flota') tambien puede generar el
-- Reporte de Falla que ese dano dispara en Mantenimiento, aunque su rol no
-- tenga por separado permiso de captura en el modulo Mantenimiento -- el
-- acto de reportar el dano YA es la autorizacion para levantar el reporte.
drop policy if exists reportes_falla_insert on public.reportes_falla;
create policy reportes_falla_insert on public.reportes_falla for insert
  with check (empresa_id = current_empresa_id() and (has_permission('Mantenimiento', 'crear') or has_permission('Flota', 'crear')));
