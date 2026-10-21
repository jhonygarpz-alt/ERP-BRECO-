"""Agente real con Claude -- clasifica el motivo de la detencion y redacta
la respuesta para el operador usando el SDK oficial de Anthropic. Requiere
ANTHROPIC_API_KEY configurado (ver .env.example); mientras no lo tengas,
usa AGENT_ENGINE=mock (ver agent/mock_agent.py), que cumple exactamente el
mismo contrato.

redactar_respuesta recibe el texto ORIGINAL del operador (no solo la
categoria) para que Claude responda a lo que realmente escribio -- una
version anterior solo le mandaba un resumen tipo "categoria: X", lo que
sonaba generico/igual para cualquier mensaje de la misma categoria."""

import anthropic

from app.agent.base import AgentEngine
from app.config import get_settings
from app.domain.enums import CategoriaMotivoDetencion

_SISTEMA_CLASIFICAR = (
    "Eres el asistente de monitoreo de Centinela Digital, un sistema de "
    "transporte de carga en Mexico. Un operador de tractocamion te escribio "
    "por WhatsApp explicando por que se detuvo. Usa la herramienta "
    "registrar_motivo_detencion para clasificar su mensaje en la categoria "
    "que mejor lo describa."
)

_HERRAMIENTA_CLASIFICAR = {
    "name": "registrar_motivo_detencion",
    "description": "Registra la categoria del motivo de detencion que dio el operador.",
    "input_schema": {
        "type": "object",
        "properties": {
            "categoria": {
                "type": "string",
                "enum": [c.value for c in CategoriaMotivoDetencion],
                "description": "La categoria que mejor describe el motivo de la detencion.",
            }
        },
        "required": ["categoria"],
    },
}

_SISTEMA_RESPUESTA = (
    "Eres Centinela, hablando por WhatsApp con un operador de tractocamion "
    "de una empresa de transporte de carga en Mexico, que acaba de "
    "explicarte por que se detuvo. Respondele de forma breve (1-3 "
    "oraciones), natural y cordial, en espanol mexicano, en primera "
    "persona, como lo haria un despachador real: haz referencia a lo que "
    "el realmente te dijo (nunca repitas una plantilla generica), y nunca "
    "menciones palabras como 'sistema' o 'monitorista' ni la mecanica "
    "interna de como se registro su reporte. Si el contexto interno indica "
    "que esto se escalo, diselo de forma natural (por ejemplo: 'ya tengo tu "
    "reporte, en un momento alguien se pone en contacto contigo para "
    "apoyarte') y pidele que se mantenga en un lugar seguro; si no se "
    "escalo, simplemente confirma que quedo registrado y, si aplica, "
    "deseale buen viaje. Nunca inventes datos del viaje que no te dieron. "
    "No te presentes como un asistente automatizado ni lo menciones por "
    "iniciativa propia; pero si el operador te pregunta directamente si "
    "eres una persona o un bot/IA, contestale la verdad en una sola linea "
    "breve y sigue ayudando con normalidad, sin dar un discurso largo. "
    "Nunca le muestres al operador el nombre interno de la categoria."
)


class ClaudeAgentEngine(AgentEngine):
    def __init__(self) -> None:
        settings = get_settings()
        if not settings.anthropic_api_key:
            raise RuntimeError(
                "ClaudeAgentEngine requiere ANTHROPIC_API_KEY configurado en .env "
                "-- usa AGENT_ENGINE=mock mientras tanto (ver agent/mock_agent.py)."
            )
        self._client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self._model = settings.anthropic_model

    def clasificar(self, texto_operador: str) -> CategoriaMotivoDetencion:
        respuesta = self._client.messages.create(
            model=self._model,
            max_tokens=200,
            system=_SISTEMA_CLASIFICAR,
            tools=[_HERRAMIENTA_CLASIFICAR],
            tool_choice={"type": "tool", "name": "registrar_motivo_detencion"},
            messages=[{"role": "user", "content": texto_operador}],
        )
        for bloque in respuesta.content:
            if bloque.type == "tool_use" and bloque.name == "registrar_motivo_detencion":
                try:
                    return CategoriaMotivoDetencion(bloque.input["categoria"])
                except (KeyError, ValueError):
                    return CategoriaMotivoDetencion.OTRO
        return CategoriaMotivoDetencion.OTRO

    def redactar_respuesta(self, categoria: CategoriaMotivoDetencion, va_a_escalar: bool, texto_operador: str) -> str:
        system = (
            f"{_SISTEMA_RESPUESTA}\n\nContexto interno (no se lo repitas literal al operador): "
            f"categoria detectada = {categoria.value}; se escala a un monitorista humano = {va_a_escalar}."
        )
        respuesta = self._client.messages.create(
            model=self._model,
            max_tokens=300,
            system=system,
            messages=[{"role": "user", "content": texto_operador}],
        )
        partes_texto = [b.text for b in respuesta.content if b.type == "text"]
        return "".join(partes_texto).strip()
