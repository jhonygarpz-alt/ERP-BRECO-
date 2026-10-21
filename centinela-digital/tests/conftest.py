"""Fixtures compartidas para las pruebas del rules_engine y del
MockGPSProvider. Nunca tocan la base de datos -- construyen los DTOs de
dominio directamente, que es todo lo que el rules_engine necesita."""

from datetime import datetime, timezone

import pytest

from app.domain.enums import EstatusViaje, TipoGeocerca
from app.domain.schemas import GeocercaDTO, PosicionGpsDTO, ViajeDTO
from app.rules_engine.config_schema import cargar_configuracion_default

AHORA = datetime(2026, 10, 21, 12, 0, 0, tzinfo=timezone.utc)


@pytest.fixture
def ahora() -> datetime:
    return AHORA


@pytest.fixture
def config():
    return cargar_configuracion_default()


@pytest.fixture
def hacer_viaje(ahora):
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
            cita_carga=ahora,
            cita_entrega=ahora,
            estatus=EstatusViaje.EN_RUTA,
            eta_actual=None,
            eta_ultima_notificada=None,
            hora_inicio_real=ahora,
            hora_llegada_real=None,
        )
        base.update(overrides)
        return ViajeDTO(**base)

    return _hacer


@pytest.fixture
def hacer_posicion(ahora):
    def _hacer(**overrides) -> PosicionGpsDTO:
        base = dict(
            unidad_id="unidad-1",
            lat=20.0,
            lon=-100.0,
            velocidad=80.0,
            ignicion=True,
            timestamp=ahora,
            calidad_senal="buena",
            entradas_digitales={},
            proveedor="mock",
        )
        base.update(overrides)
        return PosicionGpsDTO(**base)

    return _hacer


@pytest.fixture
def hacer_geocerca():
    def _hacer(**overrides) -> GeocercaDTO:
        base = dict(
            id="geocerca-1",
            empresa_id="empresa-1",
            nombre="Geocerca",
            tipo=TipoGeocerca.AUTORIZADA,
            geometria={"tipo": "circulo", "centro": [-100.0, 20.0]},
            radio_m=300.0,
        )
        base.update(overrides)
        return GeocercaDTO(**base)

    return _hacer
