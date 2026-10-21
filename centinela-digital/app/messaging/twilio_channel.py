"""Placeholder para el canal de WhatsApp de Twilio -- la alternativa a
WhatsApp Cloud API que el usuario pidio tener disponible detras de la
misma interfaz (ver domain spec). No implementado todavia."""

from app.messaging.base import MessagingChannel


class TwilioChannel(MessagingChannel):
    def __init__(self, account_sid: str, auth_token: str, numero_desde: str):
        self._account_sid = account_sid
        self._auth_token = auth_token
        self._numero_desde = numero_desde

    def enviar(self, telefono: str, texto: str) -> None:
        raise NotImplementedError(
            "TwilioChannel aun no esta implementado. Twilio expone "
            "'POST https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json' "
            "con 'From'/'To' en formato 'whatsapp:+52...'."
        )

    def enviar_ubicacion(self, telefono: str, lat: float, lon: float, etiqueta: str) -> None:
        raise NotImplementedError(
            "TwilioChannel aun no esta implementado. El mismo endpoint de Messages "
            "acepta 'PersistentAction': 'geo:{lat},{lon}|{etiqueta}' para mandar "
            "una ubicacion nativa de WhatsApp a traves de Twilio."
        )
