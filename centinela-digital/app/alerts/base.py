"""Interfaz de canal de alertas. En Fase 1 solo existe ConsoleAlertChannel;
mas adelante se agrega el grupo de WhatsApp de seguridad y el panel web
(ver escalation/ y dashboard/, fases siguientes) sin que worker/poller.py
tenga que cambiar."""

from abc import ABC, abstractmethod

from app.domain.schemas import EventoDTO


class AlertChannel(ABC):
    @abstractmethod
    def notificar(self, evento: EventoDTO) -> None:
        raise NotImplementedError
