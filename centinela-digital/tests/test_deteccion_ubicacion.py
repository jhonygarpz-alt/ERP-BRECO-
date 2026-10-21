"""Pruebas del detector de "el cliente esta pidiendo la ubicacion"."""

from app.agent.deteccion_ubicacion import cliente_pregunta_por_ubicacion


def test_detecta_donde_va():
    assert cliente_pregunta_por_ubicacion("¿y en dónde va mi camión?") is True


def test_detecta_mapa():
    assert cliente_pregunta_por_ubicacion("mándame un mapa de la unidad") is True


def test_detecta_captura():
    assert cliente_pregunta_por_ubicacion("pásame una captura de dónde va") is True


def test_no_detecta_pregunta_de_hora():
    assert cliente_pregunta_por_ubicacion("¿a qué hora llega?") is False
