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

    @abstractmethod
    def enviar_ubicacion(self, telefono: str, lat: float, lon: float, etiqueta: str) -> None:
        """Manda la posicion de una unidad como un mensaje de ubicacion
        nativo de WhatsApp (el mismo tipo que usa "compartir ubicacion" en
        un chat normal) -- no genera ninguna imagen ni necesita un
        proveedor de mapas con API key: WhatsApp renderiza el mapa solo."""
        raise NotImplementedError
