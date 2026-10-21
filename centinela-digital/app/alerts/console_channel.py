"""Canal de alertas de Fase 1: imprime el evento como log estructurado en
vez de mandarlo a un monitorista real -- suficiente para demostrar el
rules_engine funcionando de punta a punta sin WhatsApp/Twilio conectados
todavia (ver escalation/, fases siguientes)."""

import logging

from app.alerts.base import AlertChannel
from app.domain.enums import EVENTOS_SEGURIDAD, SeveridadEvento
from app.domain.schemas import EventoDTO

logger = logging.getLogger("centinela.alertas")


class ConsoleAlertChannel(AlertChannel):
    def notificar(self, evento: EventoDTO) -> None:
        nivel = logging.CRITICAL if evento.severidad == SeveridadEvento.SEGURIDAD else logging.WARNING
        etiqueta = "EVENTO DE SEGURIDAD" if evento.tipo in EVENTOS_SEGURIDAD else "evento"
        logger.log(
            nivel,
            "%s: %s (unidad=%s viaje=%s severidad=%s) detalle=%s",
            etiqueta,
            evento.tipo.value,
            evento.unidad_id,
            evento.viaje_id,
            evento.severidad.value,
            evento.detalle,
        )
