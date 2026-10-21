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
  messaging/             Interfaz MessagingChannel + ConsoleMessagingChannel
                        (Fase 2); stubs documentados de WhatsApp Cloud/Twilio
  agent/
    clasificador.py       Clasificador por palabras clave (solo lo usa
                         MockAgentEngine)
    mock_agent.py          Agente de prueba, sin IA (default)
    claude_agent.py        Agente real con la API de Anthropic
    flujo_detencion.py     La decision de escalar es del codigo, nunca
                         del engine -- ver mas abajo
alembic/                 Migraciones (esquema inicial ya generado)
scripts/simular_dia.py   Demo Fase 1: 10 unidades, 24h aceleradas, en memoria
scripts/chat_operador.py Demo Fase 2: chat interactivo con el agente
tests/                   pytest del rules_engine, MockGPSProvider y del
                        agente conversacional
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

## Fase 2 (esta entrega): flujo de R2 con un agente intercambiable

Lo que se agrega en esta entrega no es todavia la Fase 2 completa de la
especificacion original -- es el primer corte funcional, de punta a punta,
del patron que el resto de la Fase 2 va a reusar: el flujo de **R2
(detencion no programada)**, donde el bot le pregunta al operador por que
se detuvo, clasifica su respuesta, y decide si eso se escala a un
monitorista humano.

- `app/messaging/`: interfaz `MessagingChannel` intercambiable, igual que
  `gps_adapters/`. Por ahora solo existe `ConsoleMessagingChannel`
  (imprime el mensaje como si fuera WhatsApp); `WhatsAppCloudChannel` y
  `TwilioChannel` son stubs documentados.
- `app/agent/`: interfaz `AgentEngine` intercambiable via `AGENT_ENGINE`
  en `.env` (`mock` por default, o `claude`). `MockAgentEngine` clasifica
  por palabras clave (`clasificador.py`) y responde con texto fijo, sin
  llamar a ningun modelo. `ClaudeAgentEngine` hace lo mismo pero con la
  API de Anthropic (requiere `ANTHROPIC_API_KEY`).
- **La decision de escalar nunca la toma el engine.** `agent/flujo_detencion.py`
  calcula `va_a_escalar = categoria in CATEGORIAS_ESCALAN_SIEMPRE`
  (accidente, falla_mecanica) en codigo normal, sin IA de por medio, y solo
  le pide al engine que clasifique el texto y redacte la respuesta --
  mismo principio que `rules_engine/`: la IA conversa, nunca decide solas
  las cosas que importan.

### Probar el flujo conversacional

```bash
python -m scripts.chat_operador
```

Simula que el bot ya detecto una parada no programada y te pregunta el
motivo; escribe como si fueras el operador (ej. "se me ponchó una llanta")
y ve la respuesta y si se escalo o no. Con `AGENT_ENGINE=mock` (el
default) no se necesita ninguna API key.

Tambien hay una demo visual en el navegador con el mismo comportamiento
(la logica esta reescrita en JavaScript solo para esa pagina, el motor
real sigue siendo el de Python):
https://claude.ai/artifact/Fd8N2CmkaCcnkepyrniiV8

### Pendiente de la Fase 2 completa

- R1 (inicio de viaje demorado) y R5 (operador no responde) con
  escalamiento por niveles (llamada de voz a los 10 min, escalar a los 20).
- El agente con tool use real (`obtener_viaje`, `calcular_eta`,
  `escalar_a_monitorista`, `enviar_mensaje_cliente` como herramientas de
  Claude, no como llamadas directas).
- Conectar el canal de WhatsApp real (Meta Cloud API) con plantillas
  aprobadas (ver `templates.md`).

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

- **Fase 1 (completa)**: modelos, migraciones, GPSProvider simulado,
  motor de reglas completo (servicio + seguridad), alertas por consola,
  demo de 24h, pruebas.
- **Fase 2 (en progreso -- primer corte en esta entrega)**: flujo de R2
  (detencion no programada) con agente intercambiable Mock/Claude y canal
  de mensajeria simulado. Pendiente: R1/R5 con escalamiento por niveles,
  tool use real del agente, canal de WhatsApp real (Meta Cloud API +
  Twilio).
- **Fase 3**: flujo con el cliente (consulta de estatus, R3/R4), panel web
  de monitoristas.
- **Fase 4**: reglas de seguridad conectadas a WhatsApp/llamadas de voz
  reales, palabra de coaccion en produccion.
