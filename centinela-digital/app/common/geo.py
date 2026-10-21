"""Utilidades geograficas compartidas por gps_adapters/ y el calculo de ETA."""

import math

RADIO_TIERRA_M = 6_371_000.0


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distancia en linea recta entre dos puntos, en metros."""
    f1, f2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(f1) * math.cos(f2) * math.sin(dlambda / 2) ** 2
    return 2 * RADIO_TIERRA_M * math.asin(math.sqrt(a))
