"""Pruebas de MockClientAgentEngine: respuestas distintas segun el estatus
real del viaje, nunca inventadas."""

from datetime import datetime, timedelta, timezone

import pytest

from app.agent.cliente_mock_agent import MockClientAgentEngine
from app.domain.enums import EstatusViaje
from app.domain.schemas import ViajeDTO

AHORA = datetime(2026, 10, 21, 12, 0, 0, tzinfo=timezone.utc)


@pytest.fixture
def hacer_viaje():
    def _hacer(**overrides) -> ViajeDTO:
        base = dict(
            id="viaje-1",
            empresa_id="empresa-1",
            unidad_id="unidad-1",
            operador_id="operador-1",
            cliente_id="cliente-1",
            folio="F-001",
            origen_geocerca_id=None,
            destino_geocerca_id=None,
            ruta_autorizada_id=None,
            cita_carga=AHORA,
            cita_entrega=AHORA + timedelta(hours=2),
            estatus=EstatusViaje.EN_RUTA,
            eta_actual=None,
            eta_ultima_notificada=None,
            hora_inicio_real=AHORA,
            hora_llegada_real=None,
        )
        base.update(overrides)
        return ViajeDTO(**base)

    return _hacer


def test_viaje_ya_entregado(hacer_viaje):
    viaje = hacer_viaje(hora_llegada_real=AHORA + timedelta(hours=1, minutes=50))
    texto = MockClientAgentEngine().responder(viaje, "¿ya llegó?")
    assert "ya llegó" in texto.lower()
    assert "F-001" in texto


def test_en_ruta_sin_retraso_no_menciona_retraso(hacer_viaje):
    viaje = hacer_viaje(eta_actual=AHORA + timedelta(hours=1, minutes=55))
    texto = MockClientAgentEngine().responder(viaje, "¿cómo va?")
    assert "retraso" not in texto.lower()


def test_en_ruta_con_retraso_lo_menciona(hacer_viaje):
    viaje = hacer_viaje(eta_actual=AHORA + timedelta(hours=3))
    texto = MockClientAgentEngine().responder(viaje, "¿cómo va?")
    assert "retraso" in texto.lower()


def test_viaje_no_iniciado(hacer_viaje):
    viaje = hacer_viaje(estatus=EstatusViaje.PROGRAMADO, eta_actual=None, hora_inicio_real=None)
    texto = MockClientAgentEngine().responder(viaje, "¿ya salió?")
    assert "todavía no inicia" in texto.lower()
