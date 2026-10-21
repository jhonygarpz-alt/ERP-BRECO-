"""Interfaz intercambiable del agente conversacional -- mismo patron que
gps_adapters/ y eta/. MockAgentEngine (por defecto, sin IA) y
ClaudeAgentEngine (API real de Anthropic) implementan este mismo
contrato. La decision de ESCALAR nunca vive aqui -- la clasificacion es
lo unico que el engine aporta; quien la usa (ver agent/flujo_detencion.py)
decide deterministicamente si eso escala, para que accidente/falla_mecanica
siempre escalen sin depender de que el engine "decida" bien."""

from abc import ABC, abstractmethod

from app.domain.enums import CategoriaMotivoDetencion


class AgentEngine(ABC):
    @abstractmethod
    def clasificar(self, texto_operador: str) -> CategoriaMotivoDetencion:
        raise NotImplementedError

    @abstractmethod
    def redactar_respuesta(self, categoria: CategoriaMotivoDetencion, va_a_escalar: bool, texto_operador: str) -> str:
        raise NotImplementedError
