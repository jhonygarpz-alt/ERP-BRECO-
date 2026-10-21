"""Canal de mensajeria de esta entrega: imprime el mensaje en consola como
si fuera un WhatsApp real -- usado por scripts/chat_operador.py para poder
probar el agente conversacional sin WhatsApp Business conectado todavia."""

from app.messaging.base import MessagingChannel


class ConsoleMessagingChannel(MessagingChannel):
    def enviar(self, telefono: str, texto: str) -> None:
        print(f"[Centinela -> {telefono}] {texto}")

    def enviar_ubicacion(self, telefono: str, lat: float, lon: float, etiqueta: str) -> None:
        print(
            f"[Centinela -> {telefono}] 📍 {etiqueta} "
            f"({lat:.5f}, {lon:.5f}) -- https://maps.google.com/?q={lat},{lon}"
        )
