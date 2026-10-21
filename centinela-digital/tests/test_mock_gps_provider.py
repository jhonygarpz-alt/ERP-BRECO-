"""Pruebas de MockGPSProvider: que efectivamente simula el avance sobre la
ruta, las paradas programadas y la perdida de señal."""

from app.gps_adapters.mock_provider import (
    RUTA_SALAMANCA_GUADALAJARA,
    EventoProgramado,
    MockGPSProvider,
)


def test_unidad_sin_eventos_avanza_a_lo_largo_de_la_ruta():
    provider = MockGPSProvider()
    provider.registrar_unidad("u1", ruta=list(RUTA_SALAMANCA_GUADALAJARA), eventos=[], velocidad_kmh=80.0)

    posicion_inicial = provider.obtener_posiciones_actuales(["u1"])[0]
    provider.avanzar(3600)
    posicion_despues = provider.obtener_posiciones_actuales(["u1"])[0]

    assert posicion_despues.velocidad == 80.0
    assert (posicion_despues.lat, posicion_despues.lon) != (posicion_inicial.lat, posicion_inicial.lon)


def test_evento_de_parada_detiene_la_unidad_sin_mover_su_posicion():
    provider = MockGPSProvider()
    provider.registrar_unidad(
        "u1",
        ruta=list(RUTA_SALAMANCA_GUADALAJARA),
        eventos=[EventoProgramado(fraccion_inicio=0.0, tipo="parada", duracion_s=600)],
        velocidad_kmh=80.0,
    )

    provider.avanzar(60)
    posicion_a = provider.obtener_posiciones_actuales(["u1"])[0]
    provider.avanzar(60)
    posicion_b = provider.obtener_posiciones_actuales(["u1"])[0]

    assert posicion_a.velocidad == 0.0
    assert posicion_b.velocidad == 0.0
    assert (posicion_a.lat, posicion_a.lon) == (posicion_b.lat, posicion_b.lon)


def test_perdida_de_senal_oculta_la_posicion_mientras_dura():
    provider = MockGPSProvider()
    provider.registrar_unidad(
        "u1",
        ruta=list(RUTA_SALAMANCA_GUADALAJARA),
        eventos=[EventoProgramado(fraccion_inicio=0.0, tipo="perdida_senal", duracion_s=600)],
        velocidad_kmh=80.0,
    )

    provider.avanzar(60)
    assert provider.obtener_posiciones_actuales(["u1"]) == []

    provider.avanzar(600)
    assert len(provider.obtener_posiciones_actuales(["u1"])) == 1


def test_registrar_unidad_con_ruta_default_reparte_ciclicamente():
    provider = MockGPSProvider()
    for i in range(5):
        provider.registrar_unidad_con_ruta_default(f"u{i}", i)

    posiciones = provider.obtener_posiciones_actuales([f"u{i}" for i in range(5)])
    assert len(posiciones) == 5
