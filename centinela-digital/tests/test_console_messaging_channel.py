"""Prueba minima del canal de mensajeria simulado."""

from app.messaging.console_channel import ConsoleMessagingChannel


def test_enviar_imprime_el_telefono_y_el_texto(capsys):
    ConsoleMessagingChannel().enviar("+52-477-000-0000", "hola operador")
    salida = capsys.readouterr().out
    assert "+52-477-000-0000" in salida
    assert "hola operador" in salida


def test_enviar_ubicacion_imprime_coordenadas_y_liga_de_mapa(capsys):
    ConsoleMessagingChannel().enviar_ubicacion("+52-477-000-0000", 20.41, -101.92, "Unidad 07")
    salida = capsys.readouterr().out
    assert "+52-477-000-0000" in salida
    assert "20.41" in salida
    assert "maps.google.com" in salida
