"""La decision de escalar es del codigo, no del engine: aqui se prueba con
un AgentEngine falso para demostrar que accidente/falla_mecanica escalan
siempre sin importar lo que un engine "decida", y que las demas categorias
nunca escalan por si solas."""

from app.agent.base import AgentEngine
from app.agent.flujo_detencion import procesar_respuesta_operador
from app.domain.enums import CategoriaMotivoDetencion


class _EngineFalsoSiempreCategoria(AgentEngine):
    def __init__(self, categoria: CategoriaMotivoDetencion):
        self._categoria = categoria

    def clasificar(self, texto_operador: str) -> CategoriaMotivoDetencion:
        return self._categoria

    def redactar_respuesta(self, categoria: CategoriaMotivoDetencion, va_a_escalar: bool, texto_operador: str) -> str:
        return f"respuesta-{categoria.value}-{va_a_escalar}"


def test_accidente_siempre_escala():
    engine = _EngineFalsoSiempreCategoria(CategoriaMotivoDetencion.ACCIDENTE)
    resultado = procesar_respuesta_operador(engine, "cualquier texto")
    assert resultado.va_a_escalar is True
    assert resultado.categoria == CategoriaMotivoDetencion.ACCIDENTE


def test_falla_mecanica_siempre_escala():
    engine = _EngineFalsoSiempreCategoria(CategoriaMotivoDetencion.FALLA_MECANICA)
    resultado = procesar_respuesta_operador(engine, "cualquier texto")
    assert resultado.va_a_escalar is True


def test_carga_combustible_nunca_escala():
    engine = _EngineFalsoSiempreCategoria(CategoriaMotivoDetencion.CARGA_COMBUSTIBLE)
    resultado = procesar_respuesta_operador(engine, "cualquier texto")
    assert resultado.va_a_escalar is False


def test_mensaje_para_operador_viene_del_engine():
    engine = _EngineFalsoSiempreCategoria(CategoriaMotivoDetencion.OTRO)
    resultado = procesar_respuesta_operador(engine, "cualquier texto")
    assert resultado.mensaje_para_operador == "respuesta-otro-False"
