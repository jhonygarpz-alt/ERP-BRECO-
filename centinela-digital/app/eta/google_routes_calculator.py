"""Placeholder para Google Routes API
(https://developers.google.com/maps/documentation/routes). No implementado
en la Fase 1 -- mismo patron de interfaz intercambiable que gps_adapters/
(ver gps_adapters/NUEVO_PROVEEDOR.md)."""

from datetime import datetime

from app.eta.base import EtaCalculator


class GoogleRoutesEtaCalculator(EtaCalculator):
    def __init__(self, api_key: str):
        self._api_key = api_key

    def calcular_eta(
        self,
        origen: tuple[float, float],
        destino: tuple[float, float],
        velocidad_actual_kmh: float,
        ahora: datetime,
    ) -> datetime:
        raise NotImplementedError(
            "GoogleRoutesEtaCalculator aun no esta implementado. Google Routes "
            "expone 'POST https://routes.googleapis.com/directions/v2:computeRoutes' "
            "devolviendo 'duration' en la respuesta."
        )
