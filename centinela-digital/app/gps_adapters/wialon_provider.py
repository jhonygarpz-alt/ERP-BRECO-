"""Placeholder para integrar la plataforma Wialon (https://wialon.com/).

No implementado en la Fase 1 -- se deja declarado para que quede claro
donde va la integracion real cuando se necesite (ver NUEVO_PROVEEDOR.md)."""

from app.domain.schemas import PosicionGpsDTO
from app.gps_adapters.base import GPSProvider


class WialonProvider(GPSProvider):
    def __init__(self, token: str, base_url: str = "https://hst-api.wialon.com"):
        self._token = token
        self._base_url = base_url

    def obtener_posiciones_actuales(self, unidad_ids: list[str]) -> list[PosicionGpsDTO]:
        raise NotImplementedError(
            "WialonProvider aun no esta implementado -- ver NUEVO_PROVEEDOR.md. "
            "Wialon expone 'token/login' para autenticarse y luego "
            "'core/search_items' + 'unit/get_position' para leer posiciones."
        )
