"""Punto de entrada del motor de reglas: nunca usa IA, es puramente
deterministico (ver README.md). Si cualquier regla de seguridad dispara,
esa es la unica salida de esta vuelta -- mientras haya un evento de
seguridad sin resolver, lo que diga una regla de servicio (p.ej. "notificar
al cliente de un retraso") deja de importar (ver security_rules.py)."""

from app.domain.schemas import ContextoReglas, EventoDTO
from app.rules_engine.config_schema import ConfiguracionReglas
from app.rules_engine.rules import REGLAS_SERVICIO
from app.rules_engine.security_rules import REGLAS_SEGURIDAD


def evaluar_viaje(contexto: ContextoReglas, config: ConfiguracionReglas) -> list[EventoDTO]:
    eventos_seguridad = [e for e in (regla(contexto) for regla in REGLAS_SEGURIDAD) if e is not None]
    if eventos_seguridad:
        return eventos_seguridad

    eventos_servicio = [e for e in (regla(contexto, config) for regla in REGLAS_SERVICIO) if e is not None]
    return eventos_servicio
