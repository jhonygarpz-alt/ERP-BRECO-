"""Interfaz intercambiable para el calculo de ETA (tiempo estimado de
llegada). La Fase 1 usa HaversineEtaCalculator; OSRM o Google Routes se
conectan despues sin que rules_engine ni el worker sepan la diferencia
(mismo patron que gps_adapters/, ver NUEVO_PROVEEDOR.md)."""

from abc import ABC, abstractmethod
from datetime import datetime


class EtaCalculator(ABC):
    @abstractmethod
    def calcular_eta(
        self,
        origen: tuple[float, float],
        destino: tuple[float, float],
        velocidad_actual_kmh: float,
        ahora: datetime,
    ) -> datetime:
        """ETA estimada para ir de origen a destino (lat, lon) partiendo de
        ahora. Si no hay velocidad actual confiable (unidad detenida), la
        implementacion debe usar una velocidad promedio razonable en vez de
        devolver un ETA infinito o cero."""
        raise NotImplementedError
