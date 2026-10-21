"""Agente real con Claude para consultas de clientes (R3/R4). Solo recibe
los HECHOS reales de este viaje (nunca el viaje completo de la base ni
datos de otros clientes/operadores) y tiene instrucciones explicitas de
no inventar nada que no este en esos hechos."""

import anthropic

from app.agent.cliente_base import ClientAgentEngine
from app.config import get_settings
from app.domain.schemas import ViajeDTO

_SISTEMA = (
    "Eres Centinela, hablando por WhatsApp con el cliente de una empresa de "
    "transporte de carga en Mexico que pregunta por el estatus de su viaje. "
    "Respondele de forma breve (1-3 oraciones), natural y cordial, en "
    "espanol mexicano, en primera persona. Usa UNICAMENTE los datos reales "
    "del viaje que se te dan a continuacion -- nunca inventes una ubicacion, "
    "hora o dato que no este ahi; si el cliente pregunta algo que esos datos "
    "no cubren (por ejemplo el peso de la carga, o el nombre del operador), "
    "dile honestamente que no tienes ese dato en este momento en vez de "
    "inventarlo. Si el viaje va con retraso sobre la cita de entrega, "
    "mencionalo de forma proactiva aunque no te lo pregunten directamente. "
    "No te presentes como un asistente automatizado por iniciativa propia, "
    "pero si te preguntan directamente si eres una persona o un bot/IA, "
    "contesta la verdad en una linea breve y sigue ayudando con normalidad."
)


def _hechos_del_viaje(viaje: ViajeDTO) -> str:
    lineas = [f"Folio: {viaje.folio}", f"Estatus: {viaje.estatus.value}"]
    if viaje.hora_llegada_real is not None:
        lineas.append(f"Ya llego a destino: {viaje.hora_llegada_real.strftime('%d/%b %H:%M')}")
    else:
        lineas.append(f"Cita de entrega acordada: {viaje.cita_entrega.strftime('%d/%b %H:%M')}")
        if viaje.eta_actual is not None:
            lineas.append(f"ETA actual (estimado): {viaje.eta_actual.strftime('%d/%b %H:%M')}")
            minutos_retraso = round((viaje.eta_actual - viaje.cita_entrega).total_seconds() / 60)
            if minutos_retraso > 0:
                lineas.append(f"Retraso estimado sobre la cita: {minutos_retraso} minutos")
        else:
            lineas.append("ETA actual: no disponible todavia")
    return "\n".join(lineas)


class ClaudeClientAgentEngine(ClientAgentEngine):
    def __init__(self) -> None:
        settings = get_settings()
        if not settings.anthropic_api_key:
            raise RuntimeError(
                "ClaudeClientAgentEngine requiere ANTHROPIC_API_KEY configurado en .env "
                "-- usa AGENT_ENGINE=mock mientras tanto (ver agent/cliente_mock_agent.py)."
            )
        self._client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self._model = settings.anthropic_model

    def responder(self, viaje: ViajeDTO, mensaje_cliente: str, le_compartiras_ubicacion: bool = False) -> str:
        system = f"{_SISTEMA}\n\nDatos reales de este viaje (lo unico que puedes usar):\n{_hechos_del_viaje(viaje)}"
        if le_compartiras_ubicacion:
            system += (
                "\n\nNota interna (no la repitas literal): justo despues de tu respuesta se le va a compartir "
                "al cliente la ubicacion actual de la unidad como un mensaje de ubicacion nativo de WhatsApp "
                "(ya esta resuelto, no lo haces tu). Puedes mencionarlo de forma breve y natural (por ejemplo "
                "'ahi te mando su ubicacion'), pero nunca inventes ni describas tu una coordenada o lugar "
                "especifico -- eso ya lo cubre ese mensaje aparte."
            )
        respuesta = self._client.messages.create(
            model=self._model,
            max_tokens=300,
            system=system,
            messages=[{"role": "user", "content": mensaje_cliente}],
        )
        partes_texto = [b.text for b in respuesta.content if b.type == "text"]
        return "".join(partes_texto).strip()
