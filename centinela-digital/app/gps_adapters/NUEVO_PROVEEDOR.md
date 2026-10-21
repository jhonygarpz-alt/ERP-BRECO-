# Como agregar un proveedor de GPS nuevo

Centinela Digital nunca habla directamente con la API de una plataforma de
GPS: todo pasa por la interfaz `GPSProvider` (`app/gps_adapters/base.py`).
Así el worker (`app/worker/poller.py`) y el `rules_engine/` no cambian nada
cuando se agrega o se cambia de plataforma.

## Pasos

1. Crea `app/gps_adapters/<nombre>_provider.py` con una clase que herede de
   `GPSProvider` e implemente `obtener_posiciones_actuales(unidad_ids)`,
   devolviendo una lista de `PosicionGpsDTO` (`app/domain/schemas.py`).
2. Agrega sus credenciales a `app/config.py` y a `.env.example`.
3. Haz que `GPS_PROVIDER=<nombre>` seleccione tu clase en el punto donde se
   arma el provider (`app/worker/poller.py`).
4. Si la plataforma no da velocidad o entradas digitales (valvula, sello),
   usa el valor mas conservador -- nunca inventes un dato que pueda ocultar
   un evento de seguridad real. Si no hay posicion reciente de una unidad,
   simplemente no la incluyas en el resultado (asi es como el rules_engine
   detecta perdida de señal).
5. Escribe una prueba que mockee la respuesta HTTP de la plataforma y
   verifique el mapeo a `PosicionGpsDTO`.

## Proveedores ya documentados (pendientes de implementar)

- **Wialon** (`wialon_provider.py`): API REST, login con token
  (`token/login`), luego `core/search_items` + `unit/get_position`.
- **Traccar** (`traccar_provider.py`): API REST propia o self-hosted,
  `GET /api/positions`.
