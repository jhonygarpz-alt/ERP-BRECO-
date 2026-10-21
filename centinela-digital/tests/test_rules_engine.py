"""Pruebas del rules_engine -- incluyen los escenarios minimos pedidos por
el usuario: parada en gasolinera autorizada (sin alerta), parada en zona de
riesgo (evento de seguridad), perdida de señal, operador no responde, y
cliente consultando un viaje ajeno. Cada prueba construye su propio
ContextoReglas sintetico; nunca pasa por la base de datos (eso se ejerce
manualmente con scripts/simular_dia.py)."""

from datetime import timedelta

from app.domain.enums import EstatusViaje, SeveridadEvento, TipoEvento, TipoGeocerca
from app.domain.schemas import ContextoReglas
from app.rules_engine.acceso_cliente import contacto_puede_consultar_viaje
from app.rules_engine.engine import evaluar_viaje


def test_parada_en_geocerca_autorizada_no_genera_alerta(ahora, config, hacer_viaje, hacer_posicion, hacer_geocerca):
    viaje = hacer_viaje(estatus=EstatusViaje.EN_RUTA)
    posicion = hacer_posicion(velocidad=0.0)
    gasolinera_autorizada = hacer_geocerca(tipo=TipoGeocerca.AUTORIZADA)
    posiciones_recientes = [
        hacer_posicion(velocidad=0.0, timestamp=ahora - timedelta(minutes=m)) for m in range(45, -1, -5)
    ]

    contexto = ContextoReglas(
        ahora=ahora,
        viaje=viaje,
        posicion_actual=posicion,
        posiciones_recientes=posiciones_recientes,
        geocercas=[gasolinera_autorizada],
        ruta_autorizada=None,
        palabra_coaccion=config.palabra_coaccion,
    )

    assert evaluar_viaje(contexto, config) == []


def test_parada_en_zona_de_riesgo_genera_evento_de_seguridad(ahora, config, hacer_viaje, hacer_posicion, hacer_geocerca):
    viaje = hacer_viaje(estatus=EstatusViaje.EN_RUTA)
    posicion = hacer_posicion(velocidad=0.0)
    zona_riesgo = hacer_geocerca(id="zona-riesgo-1", tipo=TipoGeocerca.ZONA_RIESGO)

    contexto = ContextoReglas(
        ahora=ahora,
        viaje=viaje,
        posicion_actual=posicion,
        posiciones_recientes=[posicion],
        geocercas=[zona_riesgo],
        ruta_autorizada=None,
        palabra_coaccion=config.palabra_coaccion,
    )

    eventos = evaluar_viaje(contexto, config)
    assert len(eventos) == 1
    assert eventos[0].tipo == TipoEvento.DETENCION_ZONA_RIESGO
    assert eventos[0].severidad == SeveridadEvento.SEGURIDAD


def test_perdida_de_senal_genera_evento_de_seguridad(ahora, config, hacer_viaje, hacer_posicion):
    viaje = hacer_viaje(estatus=EstatusViaje.EN_RUTA)
    ultima_posicion_conocida = hacer_posicion(timestamp=ahora - timedelta(minutes=15))

    contexto = ContextoReglas(
        ahora=ahora,
        viaje=viaje,
        posicion_actual=None,
        posiciones_recientes=[ultima_posicion_conocida],
        geocercas=[],
        ruta_autorizada=None,
        palabra_coaccion=config.palabra_coaccion,
    )

    eventos = evaluar_viaje(contexto, config)
    assert len(eventos) == 1
    assert eventos[0].tipo == TipoEvento.PERDIDA_SENAL
    assert eventos[0].severidad == SeveridadEvento.SEGURIDAD


def test_perdida_de_senal_reciente_no_genera_evento_todavia(ahora, config, hacer_viaje, hacer_posicion):
    viaje = hacer_viaje(estatus=EstatusViaje.EN_RUTA)
    ultima_posicion_conocida = hacer_posicion(timestamp=ahora - timedelta(minutes=2))

    contexto = ContextoReglas(
        ahora=ahora,
        viaje=viaje,
        posicion_actual=None,
        posiciones_recientes=[ultima_posicion_conocida],
        geocercas=[],
        ruta_autorizada=None,
        palabra_coaccion=config.palabra_coaccion,
    )

    assert evaluar_viaje(contexto, config) == []


def test_operador_no_responde_escala(ahora, config, hacer_viaje, hacer_posicion):
    viaje = hacer_viaje(estatus=EstatusViaje.EN_RUTA)
    posicion = hacer_posicion()

    contexto = ContextoReglas(
        ahora=ahora,
        viaje=viaje,
        posicion_actual=posicion,
        posiciones_recientes=[posicion],
        geocercas=[],
        ruta_autorizada=None,
        palabra_coaccion=config.palabra_coaccion,
        ultimo_intento_contacto_operador=ahora - timedelta(minutes=35),
        ultima_respuesta_operador=None,
    )

    eventos = evaluar_viaje(contexto, config)
    assert len(eventos) == 1
    assert eventos[0].tipo == TipoEvento.OPERADOR_NO_RESPONDE
    assert eventos[0].severidad == SeveridadEvento.CRITICO


def test_operador_responde_a_tiempo_no_escala(ahora, config, hacer_viaje, hacer_posicion):
    viaje = hacer_viaje(estatus=EstatusViaje.EN_RUTA)
    posicion = hacer_posicion()

    contexto = ContextoReglas(
        ahora=ahora,
        viaje=viaje,
        posicion_actual=posicion,
        posiciones_recientes=[posicion],
        geocercas=[],
        ruta_autorizada=None,
        palabra_coaccion=config.palabra_coaccion,
        ultimo_intento_contacto_operador=ahora - timedelta(minutes=35),
        ultima_respuesta_operador=ahora - timedelta(minutes=30),
    )

    assert evaluar_viaje(contexto, config) == []


def test_llegada_a_destino_no_vuelve_a_disparar_si_ya_se_registro(ahora, config, hacer_viaje, hacer_posicion, hacer_geocerca):
    """R4 es pura (no muta el viaje): si quien la llama ya reflejo la llegada
    en hora_llegada_real, no debe volver a generar el mismo evento en la
    siguiente vuelta -- la regresion real fue no hacer esa actualizacion en
    worker/poller.py ni en scripts/simular_dia.py, lo que generaba un aviso
    de "llegada" en cada vuelta para siempre."""
    destino = hacer_geocerca(id="destino-1", tipo=TipoGeocerca.DESTINO)
    viaje = hacer_viaje(destino_geocerca_id=destino.id, hora_llegada_real=None)
    posicion = hacer_posicion()  # misma ubicacion que el centro de "destino"

    contexto = ContextoReglas(
        ahora=ahora,
        viaje=viaje,
        posicion_actual=posicion,
        posiciones_recientes=[posicion],
        geocercas=[destino],
        ruta_autorizada=None,
        palabra_coaccion=config.palabra_coaccion,
    )

    primera_vuelta = evaluar_viaje(contexto, config)
    assert len(primera_vuelta) == 1
    assert primera_vuelta[0].tipo == TipoEvento.LLEGADA_DESTINO

    viaje.hora_llegada_real = ahora  # lo que worker/poller.py y simular_dia.py deben hacer

    segunda_vuelta = evaluar_viaje(contexto, config)
    assert segunda_vuelta == []


def test_cliente_no_puede_consultar_viaje_de_otro_cliente(hacer_viaje):
    viaje = hacer_viaje(cliente_id="cliente-1")
    assert contacto_puede_consultar_viaje("cliente-1", viaje) is True
    assert contacto_puede_consultar_viaje("cliente-2", viaje) is False
