"""Reexporta todos los modelos para que Base.metadata los conozca a todos
(Alembic autogenerate y Base.metadata.create_all() en pruebas dependen de
que este modulo se haya importado una vez)."""

from app.domain.models.cliente import Cliente, ContactoCliente
from app.domain.models.conversacion import Conversacion, Mensaje
from app.domain.models.empresa import Empresa
from app.domain.models.evento import Evento, Incidencia
from app.domain.models.geocerca import Geocerca, RutaAutorizada
from app.domain.models.monitorista import Monitorista
from app.domain.models.operador import Operador
from app.domain.models.posicion_gps import PosicionGps
from app.domain.models.unidad import Unidad
from app.domain.models.viaje import Viaje

__all__ = [
    "Cliente",
    "ContactoCliente",
    "Conversacion",
    "Mensaje",
    "Empresa",
    "Evento",
    "Incidencia",
    "Geocerca",
    "RutaAutorizada",
    "Monitorista",
    "Operador",
    "PosicionGps",
    "Unidad",
    "Viaje",
]
