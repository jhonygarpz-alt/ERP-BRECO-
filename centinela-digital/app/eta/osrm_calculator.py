"""Placeholder para OSRM self-hosted (http://project-osrm.org/). No
implementado en la Fase 1 -- mismo patron de interfaz intercambiable que
gps_adapters/ (ver gps_adapters/NUEVO_PROVEEDOR.md)."""

from datetime import datetime

from app.eta.base import EtaCalculator


class OsrmEtaCalculator(EtaCalculator):
    def __init__(self, base_url: str):
        self._base_url = base_url

    def calcular_eta(
        self,
        origen: tuple[float, float],
        destino: tuple[float, float],
        velocidad_actual_kmh: float,
        ahora: datetime,
    ) -> datetime:
        raise NotImplementedError(
            "OsrmEtaCalculator aun no esta implementado. OSRM expone "
            "'GET /route/v1/driving/{lon1},{lat1};{lon2},{lat2}' devolviendo "
            "'duration' en segundos en la respuesta JSON."
        )
