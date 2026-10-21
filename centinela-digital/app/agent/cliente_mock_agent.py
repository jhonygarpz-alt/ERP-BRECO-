"""Agente de prueba para consultas de clientes: redacta la respuesta con
reglas fijas a partir de los datos del viaje, sin ningun modelo de
lenguaje -- mismo contrato que ClaudeClientAgentEngine (ClientAgentEngine)."""

from app.agent.cliente_base import ClientAgentEngine
from app.domain.enums import EstatusViaje
from app.domain.schemas import ViajeDTO

MINUTOS_RETRASO_PARA_MENCIONAR = 20


class MockClientAgentEngine(ClientAgentEngine):
    def responder(self, viaje: ViajeDTO, mensaje_cliente: str) -> str:
        if viaje.hora_llegada_real is not None:
            return f"Tu viaje {viaje.folio} ya llegó a su destino ({viaje.hora_llegada_real.strftime('%d/%b %H:%M')})."

        if viaje.estatus == EstatusViaje.EN_RUTA and viaje.eta_actual is not None:
            base = (
                f"Tu viaje {viaje.folio} va en ruta, con llegada estimada "
                f"{viaje.eta_actual.strftime('%d/%b %H:%M')}."
            )
            minutos_retraso = round((viaje.eta_actual - viaje.cita_entrega).total_seconds() / 60)
            if minutos_retraso > MINUTOS_RETRASO_PARA_MENCIONAR:
                base += f" Va con un retraso estimado de {minutos_retraso} minutos sobre la cita acordada."
            return base

        if viaje.estatus in (EstatusViaje.PROGRAMADO, EstatusViaje.EN_ESPERA_INICIO):
            return (
                f"Tu viaje {viaje.folio} todavía no inicia; la cita de carga es "
                f"{viaje.cita_carga.strftime('%d/%b %H:%M')}."
            )

        return f"Tu viaje {viaje.folio} está en estatus '{viaje.estatus.value}'. Por el momento no tengo un ETA para darte."
