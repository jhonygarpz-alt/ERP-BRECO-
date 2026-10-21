"""Interfaz de canal de mensajeria -- mismo patron que gps_adapters/ y
eta/ (ver gps_adapters/NUEVO_PROVEEDOR.md). En esta entrega de la Fase 2
solo existe ConsoleMessagingChannel (simulado); WhatsApp Cloud API y
Twilio se conectan despues sin que agent/ ni los scripts de demo sepan la
diferencia."""

from abc import ABC, abstractmethod


class MessagingChannel(ABC):
    @abstractmethod
    def enviar(self, telefono: str, texto: str) -> None:
        raise NotImplementedError
