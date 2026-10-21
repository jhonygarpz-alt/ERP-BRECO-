"""Fabrica del motor de agente activo, leyendo AGENT_ENGINE de la
configuracion -- mismo patron que gps_adapters.construir_gps_provider()."""

from app.agent.base import AgentEngine
from app.agent.cliente_base import ClientAgentEngine
from app.config import get_settings


def construir_agent_engine() -> AgentEngine:
    settings = get_settings()
    if settings.agent_engine == "mock":
        from app.agent.mock_agent import MockAgentEngine

        return MockAgentEngine()
    if settings.agent_engine == "claude":
        from app.agent.claude_agent import ClaudeAgentEngine

        return ClaudeAgentEngine()
    raise NotImplementedError(f"AGENT_ENGINE={settings.agent_engine!r} no reconocido -- usa 'mock' o 'claude'.")


def construir_client_agent_engine() -> ClientAgentEngine:
    settings = get_settings()
    if settings.agent_engine == "mock":
        from app.agent.cliente_mock_agent import MockClientAgentEngine

        return MockClientAgentEngine()
    if settings.agent_engine == "claude":
        from app.agent.cliente_claude_agent import ClaudeClientAgentEngine

        return ClaudeClientAgentEngine()
    raise NotImplementedError(f"AGENT_ENGINE={settings.agent_engine!r} no reconocido -- usa 'mock' o 'claude'.")
