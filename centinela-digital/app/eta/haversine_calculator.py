"""Implementacion de Fase 1: distancia en linea recta (haversine) entre
origen y destino, multiplicada por un factor de sinuosidad para aproximar
que una carretera real no es una linea recta, dividida entre una
velocidad. Suficiente para ejercitar R3 (riesgo de retraso) del
rules_engine sin depender de un servicio externo; se reemplaza por OSRM o
Google Routes cuando se necesite precision real de ruteo."""

from datetime import datetime, timedelta

from app.common.geo import haversine_m
from app.eta.base import EtaCalculator

VELOCIDAD_MINIMA_KMH = 40.0
FACTOR_SINUOSIDAD = 1.3


class HaversineEtaCalculator(EtaCalculator):
    def calcular_eta(
        self,
        origen: tuple[float, float],
        destino: tuple[float, float],
        velocidad_actual_kmh: float,
        ahora: datetime,
    ) -> datetime:
        distancia_m = haversine_m(*origen, *destino) * FACTOR_SINUOSIDAD
        velocidad_kmh = max(velocidad_actual_kmh, VELOCIDAD_MINIMA_KMH)
        horas = (distancia_m / 1000) / velocidad_kmh
        return ahora + timedelta(hours=horas)
