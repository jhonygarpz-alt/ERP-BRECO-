"""Loop que, cada vuelta, pide posiciones al GPSProvider configurado,
guarda la posicion de cada unidad, construye el ContextoReglas de cada
viaje activo y corre el rules_engine, notificando cualquier Evento por el
AlertChannel configurado. En Fase 1 corre con APScheduler en un proceso
propio ("worker" en docker-compose.yml), separado del API."""

import logging
from datetime import datetime, timedelta

from apscheduler.schedulers.blocking import BlockingScheduler
from sqlalchemy.orm import Session

from app.alerts.base import AlertChannel
from app.alerts.console_channel import ConsoleAlertChannel
from app.config import get_settings
from app.db import SessionLocal
from app.domain.enums import EstatusEvento, EstatusViaje, TipoEvento
from app.domain.models import Evento, Geocerca, PosicionGps, RutaAutorizada, Viaje
from app.domain.schemas import ContextoReglas, EventoDTO, GeocercaDTO, PosicionGpsDTO, RutaAutorizadaDTO, ViajeDTO
from app.eta.haversine_calculator import HaversineEtaCalculator
from app.gps_adapters.base import GPSProvider
from app.gps_adapters.mock_provider import MockGPSProvider
from app.logging_config import ahora_mx
from app.rules_engine.config_schema import cargar_configuracion_default
from app.rules_engine.engine import evaluar_viaje

logger = logging.getLogger("centinela.worker")

INTERVALO_POLLING_SEGUNDOS = 30
MINUTOS_HISTORIAL_PARA_REGLAS = 60

# RIESGO_RETRASO ya se autoregula en la propia regla (eta_ultima_notificada,
# ver rules_engine/rules.py): solo vuelve a disparar si el ETA cambio lo
# suficiente. Para el resto de los tipos, mientras siga abierto un Evento
# igual (mismo tipo+unidad+viaje) no se vuelve a notificar -- si no se
# hiciera esto, cualquier condicion que siga siendo cierta en la siguiente
# vuelta (una parada que continua, una señal que sigue perdida) generaria un
# aviso nuevo cada 30 segundos para siempre.
_TIPOS_SIN_DEDUPLICAR_POR_EVENTO_ABIERTO = {TipoEvento.RIESGO_RETRASO}


def construir_gps_provider() -> GPSProvider:
    settings = get_settings()
    if settings.gps_provider == "mock":
        return MockGPSProvider()
    raise NotImplementedError(
        f"GPS_PROVIDER={settings.gps_provider!r} no esta implementado todavia -- "
        "ver app/gps_adapters/NUEVO_PROVEEDOR.md."
    )


def _viaje_a_dto(viaje: Viaje) -> ViajeDTO:
    return ViajeDTO(
        id=viaje.id,
        empresa_id=viaje.empresa_id,
        unidad_id=viaje.unidad_id,
        operador_id=viaje.operador_id,
        cliente_id=viaje.cliente_id,
        folio=viaje.folio,
        origen_geocerca_id=viaje.origen_geocerca_id,
        destino_geocerca_id=viaje.destino_geocerca_id,
        ruta_autorizada_id=viaje.ruta_autorizada_id,
        cita_carga=viaje.cita_carga,
        cita_entrega=viaje.cita_entrega,
        estatus=viaje.estatus,
        eta_actual=viaje.eta_actual,
        eta_ultima_notificada=viaje.eta_ultima_notificada,
        hora_inicio_real=viaje.hora_inicio_real,
        hora_llegada_real=viaje.hora_llegada_real,
    )


def _geocerca_a_dto(g: Geocerca) -> GeocercaDTO:
    return GeocercaDTO(
        id=g.id, empresa_id=g.empresa_id, nombre=g.nombre, tipo=g.tipo, geometria=g.geometria, radio_m=g.radio_m
    )


def _ruta_a_dto(r: RutaAutorizada) -> RutaAutorizadaDTO:
    return RutaAutorizadaDTO(
        id=r.id, empresa_id=r.empresa_id, nombre=r.nombre, geometria=r.geometria, tolerancia_m=r.tolerancia_m
    )


def _posicion_a_dto(p: PosicionGps) -> PosicionGpsDTO:
    return PosicionGpsDTO(
        unidad_id=p.unidad_id,
        lat=p.lat,
        lon=p.lon,
        velocidad=p.velocidad,
        ignicion=p.ignicion,
        timestamp=p.timestamp,
        calidad_senal=p.calidad_senal,
        entradas_digitales=p.entradas_digitales,
        proveedor=p.proveedor,
    )


def _centro_geocerca(g: Geocerca) -> tuple[float, float] | None:
    if g.geometria.get("tipo") == "circulo":
        lon, lat = g.geometria["centro"]
        return (lat, lon)
    coordenadas = g.geometria.get("coordenadas")
    if not coordenadas:
        return None
    lats = [c[1] for c in coordenadas]
    lons = [c[0] for c in coordenadas]
    return (sum(lats) / len(lats), sum(lons) / len(lons))


def _evento_abierto_existente(db: Session, evento: EventoDTO) -> Evento | None:
    query = db.query(Evento).filter(
        Evento.unidad_id == evento.unidad_id,
        Evento.tipo == evento.tipo,
        Evento.estatus != EstatusEvento.CERRADO,
    )
    if evento.viaje_id is not None:
        query = query.filter(Evento.viaje_id == evento.viaje_id)
    return query.first()


def ejecutar_vuelta(db: Session, gps: GPSProvider, alertas: AlertChannel) -> int:
    """Una vuelta completa de polling: evalua todos los viajes activos de
    todas las empresas y notifica los eventos generados. Devuelve cuantos
    eventos se generaron (util para scripts/simular_dia.py y para logs)."""
    config = cargar_configuracion_default()
    eta_calculator = HaversineEtaCalculator()
    ahora = ahora_mx()

    viajes = (
        db.query(Viaje)
        .filter(
            Viaje.estatus.in_(
                [EstatusViaje.PROGRAMADO, EstatusViaje.EN_ESPERA_INICIO, EstatusViaje.EN_RUTA]
            )
        )
        .all()
    )
    if not viajes:
        return 0

    posiciones_actuales = {
        p.unidad_id: p for p in gps.obtener_posiciones_actuales([v.unidad_id for v in viajes])
    }
    for posicion in posiciones_actuales.values():
        db.add(
            PosicionGps(
                unidad_id=posicion.unidad_id,
                lat=posicion.lat,
                lon=posicion.lon,
                velocidad=posicion.velocidad,
                ignicion=posicion.ignicion,
                timestamp=posicion.timestamp,
                calidad_senal=posicion.calidad_senal,
                entradas_digitales=posicion.entradas_digitales,
                proveedor=posicion.proveedor,
            )
        )
    db.flush()

    total_eventos = 0
    desde = ahora - timedelta(minutes=MINUTOS_HISTORIAL_PARA_REGLAS)

    for viaje in viajes:
        geocercas_viaje = (
            db.query(Geocerca)
            .filter(
                Geocerca.id.in_(
                    [gid for gid in (viaje.origen_geocerca_id, viaje.destino_geocerca_id) if gid]
                )
            )
            .all()
        )
        ruta = db.get(RutaAutorizada, viaje.ruta_autorizada_id) if viaje.ruta_autorizada_id else None
        posicion_actual = posiciones_actuales.get(viaje.unidad_id)

        if posicion_actual is not None and viaje.estatus == EstatusViaje.EN_RUTA:
            destino = next((g for g in geocercas_viaje if g.id == viaje.destino_geocerca_id), None)
            centro = _centro_geocerca(destino) if destino else None
            if centro is not None:
                viaje.eta_actual = eta_calculator.calcular_eta(
                    (posicion_actual.lat, posicion_actual.lon), centro, posicion_actual.velocidad, ahora
                )

        posiciones_recientes = [
            _posicion_a_dto(p)
            for p in db.query(PosicionGps)
            .filter(PosicionGps.unidad_id == viaje.unidad_id, PosicionGps.timestamp >= desde)
            .order_by(PosicionGps.timestamp.asc())
            .all()
        ]

        contexto = ContextoReglas(
            ahora=ahora,
            viaje=_viaje_a_dto(viaje),
            posicion_actual=posicion_actual,
            posiciones_recientes=posiciones_recientes,
            geocercas=[_geocerca_a_dto(g) for g in geocercas_viaje],
            ruta_autorizada=_ruta_a_dto(ruta) if ruta else None,
            palabra_coaccion=config.palabra_coaccion,
        )

        for evento in evaluar_viaje(contexto, config):
            if evento.tipo not in _TIPOS_SIN_DEDUPLICAR_POR_EVENTO_ABIERTO:
                if _evento_abierto_existente(db, evento) is not None:
                    continue  # la condicion sigue igual de abierta; ya se avisó

            db.add(
                Evento(
                    empresa_id=evento.empresa_id,
                    viaje_id=evento.viaje_id,
                    unidad_id=evento.unidad_id,
                    tipo=evento.tipo,
                    severidad=evento.severidad,
                    estatus=evento.estatus,
                    detalle=evento.detalle,
                )
            )
            alertas.notificar(evento)
            total_eventos += 1
            # El rules_engine es puro/sin efectos: es responsabilidad de quien
            # lo llama reflejar en el viaje lo que el evento implica, para que
            # R4 no vuelva a disparar "llegada" en cada vuelta siguiente.
            if evento.tipo == TipoEvento.LLEGADA_DESTINO:
                viaje.hora_llegada_real = ahora

        if viaje.eta_actual is not None:
            viaje.eta_ultima_notificada = viaje.eta_actual

    db.commit()
    return total_eventos


def _vuelta_programada() -> None:
    db = SessionLocal()
    try:
        eventos = ejecutar_vuelta(db, construir_gps_provider(), ConsoleAlertChannel())
        logger.info("vuelta de polling completada", extra={"eventos_generados": eventos})
    finally:
        db.close()


def iniciar() -> None:
    from app.logging_config import configurar_logging

    configurar_logging()
    scheduler = BlockingScheduler(timezone="America/Mexico_City")
    scheduler.add_job(_vuelta_programada, "interval", seconds=INTERVALO_POLLING_SEGUNDOS)
    logger.info("worker de Centinela Digital iniciado", extra={"intervalo_segundos": INTERVALO_POLLING_SEGUNDOS})
    scheduler.start()


if __name__ == "__main__":
    iniciar()
