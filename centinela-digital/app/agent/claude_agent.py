"""Agente real con Claude -- clasifica el motivo de la detencion y redacta
la respuesta para el operador usando el SDK oficial de Anthropic. Requiere
ANTHROPIC_API_KEY configurado (ver .env.example); mientras no lo tengas,
usa AGENT_ENGINE=mock (ver agent/mock_agent.py), que cumple exactamente el
mismo contrato."""

import json

import anthropic

from app.agent.base import AgentEngine
from app.config import get_settings
from app.domain.enums import CategoriaMotivoDetencion

_SISTEMA_CLASIFICAR = (
    "Eres el asistente de monitoreo de Centinela Digital, un sistema de "
    "transporte de carga en Mexico. Un operador de tractocamion te escribio "
    "por WhatsApp explicando por que se detuvo. Clasifica su mensaje en "
    "UNA de estas categorias exactas: carga_combustible, alimentos_descanso, "
    "revision_autoridad, falla_mecanica, espera_cliente, trafico_bloqueo, "
    "accidente, otro. Responde SOLO con un JSON de la forma "
    '{"categoria": "..."} sin texto adicional.'
)

_SISTEMA_RESPUESTA = (
    "Eres el asistente de monitoreo de Centinela Digital. Redacta una "
    "respuesta breve, profesional y cordial en espanol mexicano para un "
    "operador de tractocamion, en 1-2 oraciones, confirmando que su motivo "
    "de detencion quedo registrado. Si se te indica que esto se escalo a un "
    "monitorista humano, dilo explicitamente y pidele que se mantenga en un "
    "lugar seguro. Nunca inventes datos del viaje que no te dieron."
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
            max_tokens=100,
            system=_SISTEMA_CLASIFICAR,
            messages=[{"role": "user", "content": texto_operador}],
        )
        texto = respuesta.content[0].text
        try:
            datos = json.loads(texto)
            return CategoriaMotivoDetencion(datos["categoria"])
        except (json.JSONDecodeError, KeyError, ValueError):
            return CategoriaMotivoDetencion.OTRO

    def redactar_respuesta(self, categoria: CategoriaMotivoDetencion, va_a_escalar: bool) -> str:
        contexto = f"Categoria detectada: {categoria.value}. Se escala a un monitorista humano: {va_a_escalar}."
        respuesta = self._client.messages.create(
            model=self._model,
            max_tokens=200,
            system=_SISTEMA_RESPUESTA,
            messages=[{"role": "user", "content": contexto}],
        )
        return respuesta.content[0].text.strip()
