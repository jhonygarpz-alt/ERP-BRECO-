"""Logs estructurados en JSON, siempre en hora de America/Mexico_City
(independiente de la zona horaria del servidor donde corra el contenedor)."""

import logging
import sys
from datetime import datetime
from zoneinfo import ZoneInfo

from pythonjsonlogger import json as jsonlogger

from app.config import get_settings

ZONA_OPERACION = ZoneInfo("America/Mexico_City")


def ahora_mx() -> datetime:
    """Hora actual en la zona horaria de la operacion -- usar siempre esta
    funcion (nunca datetime.now() a secas) para que todos los timestamps
    del sistema sean consistentes sin importar donde corra el servidor."""
    return datetime.now(ZONA_OPERACION)


class _FormatterConHoraMx(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        log_record["timestamp"] = ahora_mx().isoformat()
        log_record["level"] = record.levelname


def configurar_logging() -> None:
    settings = get_settings()
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(_FormatterConHoraMx("%(timestamp)s %(level)s %(name)s %(message)s"))
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(settings.log_level)
