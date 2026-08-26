-- Campo de texto libre para que trafico anote la ubicacion actual de cada
-- viaje (no hay rastreo GPS en el sistema, se actualiza a mano).
alter table public.viajes add column if not exists ubicacion_actual text not null default '';
