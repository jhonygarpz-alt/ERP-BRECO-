"""Placeholder para WhatsApp Business Platform (Meta Cloud API). No
implementado todavia -- requiere plantillas aprobadas por Meta para
mensajes iniciados por el sistema (ver templates.md) y manejo de firma de
webhook/idempotencia antes de poder recibir respuestas reales."""

from app.messaging.base import MessagingChannel


class WhatsAppCloudChannel(MessagingChannel):
    def __init__(self, token: str, phone_number_id: str):
        self._token = token
        self._phone_number_id = phone_number_id

    def enviar(self, telefono: str, texto: str) -> None:
        raise NotImplementedError(
            "WhatsAppCloudChannel aun no esta implementado. Meta expone "
            "'POST https://graph.facebook.com/v21.0/{phone_number_id}/messages' "
            "-- mensajes iniciados por el sistema deben usar una plantilla "
            "aprobada, no texto libre (ver templates.md)."
        )

    def enviar_ubicacion(self, telefono: str, lat: float, lon: float, etiqueta: str) -> None:
        raise NotImplementedError(
            "WhatsAppCloudChannel aun no esta implementado. El mismo endpoint de "
            "mensajes acepta 'type': 'location' con 'location': {'latitude', "
            "'longitude', 'name'} -- WhatsApp dibuja el mapa en el chat del "
            "destinatario, no hace falta generar ninguna imagen ni usar un "
            "proveedor de mapas aparte."
        )
