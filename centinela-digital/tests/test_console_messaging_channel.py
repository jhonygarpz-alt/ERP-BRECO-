"""Prueba minima del canal de mensajeria simulado."""

from app.messaging.console_channel import ConsoleMessagingChannel


def test_enviar_imprime_el_telefono_y_el_texto(capsys):
    ConsoleMessagingChannel().enviar("+52-477-000-0000", "hola operador")
    salida = capsys.readouterr().out
    assert "+52-477-000-0000" in salida
    assert "hola operador" in salida
