"""Pruebas de MockAgentEngine: cada categoria tiene una respuesta
razonable, y las que escalan avisan explicitamente que se escalo."""

from app.agent.mock_agent import MockAgentEngine
from app.domain.enums import CategoriaMotivoDetencion


def test_clasificar_delega_al_clasificador():
    engine = MockAgentEngine()
    assert engine.clasificar("me pare a cargar diesel") == CategoriaMotivoDetencion.CARGA_COMBUSTIBLE


def test_respuesta_escalada_menciona_monitorista():
    engine = MockAgentEngine()
    texto = engine.redactar_respuesta(CategoriaMotivoDetencion.ACCIDENTE, va_a_escalar=True)
    assert "monitorista" in texto.lower()


def test_respuesta_no_escalada_no_menciona_monitorista():
    engine = MockAgentEngine()
    texto = engine.redactar_respuesta(CategoriaMotivoDetencion.CARGA_COMBUSTIBLE, va_a_escalar=False)
    assert "monitorista" not in texto.lower()
