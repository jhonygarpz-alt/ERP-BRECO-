"""Pruebas del clasificador por palabras clave que usa MockAgentEngine."""

from app.agent.clasificador import clasificar
from app.domain.enums import CategoriaMotivoDetencion


def test_clasifica_carga_combustible():
    assert clasificar("me pare a cargar gasolina") == CategoriaMotivoDetencion.CARGA_COMBUSTIBLE


def test_clasifica_falla_mecanica():
    assert clasificar("se me ponchó una llanta y no prende bien el motor") == CategoriaMotivoDetencion.FALLA_MECANICA


def test_clasifica_accidente():
    assert clasificar("tuve un choque leve en la carretera") == CategoriaMotivoDetencion.ACCIDENTE


def test_clasifica_revision_autoridad():
    assert clasificar("me detuvo la guardia nacional en un reten") == CategoriaMotivoDetencion.REVISION_AUTORIDAD


def test_clasifica_alimentos_descanso():
    assert clasificar("pare a comer un rato") == CategoriaMotivoDetencion.ALIMENTOS_DESCANSO


def test_clasifica_espera_cliente():
    assert clasificar("estoy esperando que me reciban en el cliente") == CategoriaMotivoDetencion.ESPERA_CLIENTE


def test_clasifica_trafico_bloqueo():
    assert clasificar("hay un bloqueo mas adelante en la carretera") == CategoriaMotivoDetencion.TRAFICO_BLOQUEO


def test_clasifica_otro_cuando_no_coincide_nada():
    assert clasificar("todo bien, ahorita sigo") == CategoriaMotivoDetencion.OTRO
