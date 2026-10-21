"""Placeholder para integrar un servidor Traccar (https://www.traccar.org/),
tipico en flotas que usan un GPS autoalojado en vez de una plataforma
comercial. No implementado en la Fase 1 (ver NUEVO_PROVEEDOR.md)."""

from app.domain.schemas import PosicionGpsDTO
from app.gps_adapters.base import GPSProvider


class TraccarProvider(GPSProvider):
    def __init__(self, base_url: str, usuario: str, password: str):
        self._base_url = base_url
        self._usuario = usuario
        self._password = password

    def obtener_posiciones_actuales(self, unidad_ids: list[str]) -> list[PosicionGpsDTO]:
        raise NotImplementedError(
            "TraccarProvider aun no esta implementado -- ver NUEVO_PROVEEDOR.md. "
            "Traccar expone 'GET /api/positions' (autenticacion basica o sesion) "
            "mapeando cada 'deviceId' a una unidad."
        )
