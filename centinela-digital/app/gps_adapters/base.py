"""Interfaz que debe implementar cualquier proveedor de GPS. El resto del
sistema (worker/poller.py, rules_engine/) solo conoce esta interfaz, nunca
una API de GPS en concreto, para poder cambiar de proveedor sin tocar nada
mas (ver NUEVO_PROVEEDOR.md)."""

from abc import ABC, abstractmethod

from app.domain.schemas import PosicionGpsDTO


class GPSProvider(ABC):
    @abstractmethod
    def obtener_posiciones_actuales(self, unidad_ids: list[str]) -> list[PosicionGpsDTO]:
        """Ultima posicion conocida de cada unidad solicitada. Una unidad sin
        posicion reciente (p.ej. sin señal) simplemente no aparece en el
        resultado -- eso es lo que el rules_engine usa para detectar
        perdida de señal, nunca una posicion con un valor inventado."""
        raise NotImplementedError
