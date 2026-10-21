"""El acceso se valida en codigo, nunca en el engine: estas pruebas usan un
ClientAgentEngine falso que "respondería lo que sea" para demostrar que, si
el viaje no es del cliente que pregunta, el engine nunca llega a ejecutarse."""

from datetime import datetime, timedelta, timezone

import pytest

from app.agent.cliente_base import ClientAgentEngine
from app.agent.flujo_consulta_cliente import procesar_consulta_cliente
from app.domain.enums import EstatusViaje
from app.domain.schemas import ViajeDTO

AHORA = datetime(2026, 10, 21, 12, 0, 0, tzinfo=timezone.utc)


class _EngineFalsoRevelaTodo(ClientAgentEngine):
    def __init__(self):
        self.fue_llamado = False

    def responder(self, viaje: ViajeDTO, mensaje_cliente: str, le_compartiras_ubicacion: bool = False) -> str:
        self.fue_llamado = True
        return f"respuesta-para-{viaje.folio}"


@pytest.fixture
def viaje_de_cliente_1():
    return ViajeDTO(
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


def test_cliente_dueno_del_viaje_obtiene_respuesta(viaje_de_cliente_1):
    engine = _EngineFalsoRevelaTodo()
    resultado = procesar_consulta_cliente(engine, "cliente-1", viaje_de_cliente_1, "¿cómo va mi viaje?")
    assert resultado.acceso_permitido is True
    assert resultado.mensaje_para_cliente == "respuesta-para-F-001"
    assert engine.fue_llamado is True


def test_cliente_ajeno_nunca_llega_al_engine(viaje_de_cliente_1):
    engine = _EngineFalsoRevelaTodo()
    resultado = procesar_consulta_cliente(engine, "cliente-2", viaje_de_cliente_1, "¿cómo va el viaje F-001?")
    assert resultado.acceso_permitido is False
    assert "F-001" not in resultado.mensaje_para_cliente
    assert engine.fue_llamado is False


def test_viaje_inexistente_nunca_llega_al_engine():
    engine = _EngineFalsoRevelaTodo()
    resultado = procesar_consulta_cliente(engine, "cliente-1", None, "¿cómo va el viaje F-404?")
    assert resultado.acceso_permitido is False
    assert engine.fue_llamado is False


def test_envia_ubicacion_si_la_piden_y_hay_posicion(viaje_de_cliente_1):
    engine = _EngineFalsoRevelaTodo()
    resultado = procesar_consulta_cliente(
        engine, "cliente-1", viaje_de_cliente_1, "¿dónde va mi camión?", posicion_actual=(20.4, -101.9)
    )
    assert resultado.enviar_ubicacion is True


def test_no_envia_ubicacion_si_no_la_piden(viaje_de_cliente_1):
    engine = _EngineFalsoRevelaTodo()
    resultado = procesar_consulta_cliente(
        engine, "cliente-1", viaje_de_cliente_1, "¿a qué hora llega?", posicion_actual=(20.4, -101.9)
    )
    assert resultado.enviar_ubicacion is False


def test_no_envia_ubicacion_si_no_hay_posicion_conocida(viaje_de_cliente_1):
    engine = _EngineFalsoRevelaTodo()
    resultado = procesar_consulta_cliente(
        engine, "cliente-1", viaje_de_cliente_1, "¿dónde va mi camión?", posicion_actual=None
    )
    assert resultado.enviar_ubicacion is False


def test_acceso_denegado_nunca_envia_ubicacion(viaje_de_cliente_1):
    engine = _EngineFalsoRevelaTodo()
    resultado = procesar_consulta_cliente(
        engine, "cliente-2", viaje_de_cliente_1, "¿dónde va mi camión?", posicion_actual=(20.4, -101.9)
    )
    assert resultado.acceso_permitido is False
    assert resultado.enviar_ubicacion is False
