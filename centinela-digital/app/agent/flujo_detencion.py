"""Orquesta el flujo de R2 (detencion no programada): el agente clasifica
el motivo que da el operador, pero la decision de escalar siempre la toma
este codigo -- nunca el motor de IA -- para que accidente/falla_mecanica
escalen siempre sin depender de que el LLM "decida" bien (ver
domain/enums.py::CATEGORIAS_ESCALAN_SIEMPRE)."""

from dataclasses import dataclass

from app.agent.base import AgentEngine
from app.domain.enums import CATEGORIAS_ESCALAN_SIEMPRE, CategoriaMotivoDetencion


@dataclass
class ResultadoMotivoDetencion:
    categoria: CategoriaMotivoDetencion
    va_a_escalar: bool
    mensaje_para_operador: str


def procesar_respuesta_operador(engine: AgentEngine, texto_operador: str) -> ResultadoMotivoDetencion:
    categoria = engine.clasificar(texto_operador)
    va_a_escalar = categoria in CATEGORIAS_ESCALAN_SIEMPRE
    mensaje = engine.redactar_respuesta(categoria, va_a_escalar)
    return ResultadoMotivoDetencion(categoria=categoria, va_a_escalar=va_a_escalar, mensaje_para_operador=mensaje)
