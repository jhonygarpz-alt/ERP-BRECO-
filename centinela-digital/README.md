# Centinela Digital

Agente autonomo 24/7 que monitorea viajes de tractocamion, se integra con
plataformas de GPS y se comunica por WhatsApp con operadores, clientes y
monitoristas humanos. Este documento cubre la **Fase 1**: el esqueleto,
los modelos de dominio, el motor de reglas (deterministico, sin IA), un
proveedor de GPS simulado y alertas por consola -- suficiente para
demostrar el sistema de punta a punta sin GPS/WhatsApp reales conectados.

## Por que existe un motor de reglas deterministico

La decision de que es un evento de seguridad (boton de panico, perdida de
señal, desvio de un corredor autorizado, parada en zona de riesgo, apertura
de valvula/sello, desenganche) **nunca** pasa por un modelo de lenguaje.
`app/rules_engine/` es codigo puro, sin IA, para que esa clasificacion sea
siempre predecible y auditable. El agente conversacional con Claude (Fase
2+) solo interviene en la conversacion en lenguaje natural con operadores y
clientes -- nunca decide si algo es un evento de seguridad.

## Arquitectura (Fase 1)

```
app/
  config.py            Configuracion via variables de entorno (.env)
  db.py                Engine/Session de SQLAlchemy
  logging_config.py    Logs JSON siempre en hora de America/Mexico_City
  main.py              FastAPI (solo healthcheck en Fase 1)
  common/geo.py         Haversine, compartido por gps_adapters/ y eta/
  domain/
    enums.py            Enums de dominio (incluye EVENTOS_SEGURIDAD)
    schemas.py          DTOs Pydantic (lo que se pasa entre modulos)
    models/             Modelos SQLAlchemy (empresa, unidad, operador,
                         cliente, monitorista, geocerca, viaje,
                         posicion_gps, evento, conversacion, ...)
  gps_adapters/         Interfaz GPSProvider + MockGPSProvider (Fase 1);
                        stubs documentados de Wialon/Traccar (ver
                        NUEVO_PROVEEDOR.md)
  eta/                  Interfaz EtaCalculator + HaversineEtaCalculator
                        (Fase 1); stubs de OSRM/Google Routes
  rules_engine/
    rules.py             Reglas de servicio R1-R6
    security_rules.py    Reglas de seguridad de hidrocarburos (prioridad
                          maxima, nunca se conversan con el operador)
    acceso_cliente.py    Un cliente solo puede consultar SUS viajes
    geometria.py         Geocercas/corredores con Shapely (no PostGIS)
    config_schema.py     Parametros de cada regla, configurables por
                         empresa (default_rules.yaml)
    engine.py            Punto de entrada: evaluar_viaje()
  alerts/                Interfaz AlertChannel + ConsoleAlertChannel
                        (Fase 1; WhatsApp/grupo de seguridad en fases
                        siguientes)
  worker/poller.py       Loop de polling GPS + rules_engine (APScheduler)
alembic/                 Migraciones (esquema inicial ya generado)
scripts/simular_dia.py   Demo: 10 unidades, 24h aceleradas, en memoria
tests/                   pytest del rules_engine y de MockGPSProvider
```

## Por que Shapely y no PostGIS

Las geocercas (circulo o poligono) y los corredores autorizados se guardan
como un dict tipo GeoJSON en una columna JSON normal, y se evaluan con
[Shapely](https://shapely.readthedocs.io/) (puro Python) en
`rules_engine/geometria.py`. Se eligio no usar PostGIS para no agregar una
extension de Postgres como infraestructura -- cualquier Postgres sirve.

## Instalacion

Requiere Python 3.12+ y, para correr el worker/API reales, Postgres y
Redis (`docker-compose.yml` los levanta a los tres).

```bash
cd centinela-digital
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env   # y ajusta DATABASE_URL si no usas los defaults
```

### Correr las pruebas

No requieren base de datos -- construyen los DTOs de dominio directamente:

```bash
pytest
```

### Generar/aplicar las migraciones

Con Postgres corriendo y `DATABASE_URL` apuntando a el:

```bash
alembic upgrade head
```

### Correr la demo de 24h simuladas

Tampoco requiere Postgres/Redis -- todo corre en memoria con
`MockGPSProvider`:

```bash
python -m scripts.simular_dia
```

Simula 10 unidades sobre dos corredores reales (Salamanca -> Guadalajara,
Tula -> Queretaro), inyecta paradas programadas y no programadas, perdida
de señal y el boton de panico, y muestra en consola (como JSON
estructurado) cada evento que el rules_engine genera. Cada condicion solo
se notifica una vez mientras siga abierta (no se repite cada vuelta).

### Levantar API + worker + Postgres + Redis con Docker

```bash
docker compose up --build
```

El API queda en `http://localhost:8000/salud`. El worker hace polling de
GPS cada 30s (`app/worker/poller.py`) usando el proveedor de
`GPS_PROVIDER` (`mock` por default).

## Como conectar un GPS real

Ver `app/gps_adapters/NUEVO_PROVEEDOR.md`. En resumen: se implementa la
interfaz `GPSProvider`, nunca se llama a la API de la plataforma desde
otro lado del sistema.

## Como registrar una plantilla de WhatsApp

Ver `templates.md` (contenido real pendiente de la Fase 2, cuando se
conecta el canal real de WhatsApp Business Platform).

## Palabra clave de coaccion

Configurable por empresa (`palabra_coaccion` en `ConfiguracionReglas`,
default en `.env` via `PALABRA_COACCION_DEFAULT`). La deteccion
(`rules_engine/security_rules.py::evaluar_palabra_coaccion`) debe usarse
desde el agente conversacional (Fase 2+) de forma que, si se detecta, el
bot sigue respondiendole al operador con normalidad y en secreto dispara
el protocolo de seguridad -- nunca se le informa al operador que fue
detectada.

## Estado por fase

- **Fase 1 (esta entrega)**: modelos, migraciones, GPSProvider simulado,
  motor de reglas completo (servicio + seguridad), alertas por consola,
  demo de 24h, pruebas.
- **Fase 2 (siguiente, pendiente de confirmacion)**: canal real de
  WhatsApp (Meta Cloud API + Twilio detras de la misma interfaz), agente
  conversacional con Claude y tool use, flujo completo con el operador
  (R1/R2/R5 con escalamiento por niveles).
- **Fase 3**: flujo con el cliente (consulta de estatus, R3/R4), panel web
  de monitoristas.
- **Fase 4**: reglas de seguridad conectadas a WhatsApp/llamadas de voz
  reales, palabra de coaccion en produccion.
