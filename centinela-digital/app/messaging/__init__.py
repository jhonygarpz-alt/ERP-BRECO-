"""Fabrica del canal de mensajeria activo, leyendo MESSAGING_CHANNEL de la
configuracion -- mismo patron que gps_adapters.construir_gps_provider()."""

from app.config import get_settings
from app.messaging.base import MessagingChannel
from app.messaging.console_channel import ConsoleMessagingChannel


def construir_messaging_channel() -> MessagingChannel:
    settings = get_settings()
    if settings.messaging_channel == "console":
        return ConsoleMessagingChannel()
    raise NotImplementedError(
        f"MESSAGING_CHANNEL={settings.messaging_channel!r} no esta implementado todavia -- "
        "ver app/messaging/whatsapp_cloud_channel.py y twilio_channel.py."
    )
