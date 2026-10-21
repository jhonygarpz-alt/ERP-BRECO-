"""Reglas de servicio R1-R6: generan Eventos a partir de GPS/tiempo, cada
una deterministica y sin IA (ver rules_engine/engine.py). Las reglas de
seguridad de hidrocarburos viven aparte en security_rules.py porque su
prioridad y su manejo son distintos (nunca se conversan con el operador)."""

from app.domain.enums import EstatusViaje, SeveridadEvento, TipoEvento
from app.domain.schemas import ContextoReglas, EventoDTO
from app.rules_engine.config_schema import ConfiguracionReglas
from app.rules_engine.geometria import punto_dentro_de_geocerca


def _evento(contexto: ContextoReglas, tipo: TipoEvento, severidad: SeveridadEvento, detalle: dict) -> EventoDTO:
    return EventoDTO(
        empresa_id=contexto.viaje.empresa_id,
        viaje_id=contexto.viaje.id,
        unidad_id=contexto.viaje.unidad_id,
        tipo=tipo,
        severidad=severidad,
        detalle=detalle,
    )


def evaluar_r1_inicio_viaje_demorado(contexto: ContextoReglas, config: ConfiguracionReglas) -> EventoDTO | None:
    """Deteccion GPS/tiempo de que el viaje deberia haber iniciado y no se
    ha movido. El escalamiento por niveles ("llamar a los 10 min, escalar
    a los 20") depende de si el operador respondio a un intento de
    contacto -- eso se arma en Fase 2 sobre este mismo evento, reusando el
    patron de evaluar_r5_operador_no_responde en este archivo."""
    viaje = contexto.viaje
    if viaje.estatus not in (EstatusViaje.PROGRAMADO, EstatusViaje.EN_ESPERA_INICIO):
        return None
    if viaje.hora_inicio_real is not None:
        return None
    minutos_para_cita = (viaje.cita_carga - contexto.ahora).total_seconds() / 60
    if minutos_para_cita > config.r1_inicio_viaje.minutos_antes_cita_para_vigilar:
        return None
    return _evento(
        contexto,
        TipoEvento.INICIO_VIAJE_DEMORADO,
        SeveridadEvento.SERVICIO,
        {"minutos_para_cita": round(minutos_para_cita, 1)},
    )


def _minutos_detenido(contexto: ContextoReglas) -> float:
    detenido_desde = None
    for posicion in reversed(contexto.posiciones_recientes):
        if posicion.velocidad > 0:
            break
        detenido_desde = posicion.timestamp
    if detenido_desde is None:
        return 0.0
    return (contexto.ahora - detenido_desde).total_seconds() / 60


def evaluar_r2_detencion_no_programada(contexto: ContextoReglas, config: ConfiguracionReglas) -> EventoDTO | None:
    posicion = contexto.posicion_actual
    if posicion is None or contexto.viaje.estatus != EstatusViaje.EN_RUTA:
        return None
    if posicion.velocidad > 0:
        return None
    dentro_de_geocerca_autorizada = any(
        punto_dentro_de_geocerca(posicion.lat, posicion.lon, g) for g in contexto.geocercas
    )
    if dentro_de_geocerca_autorizada:
        return None
    minutos_detenido = _minutos_detenido(contexto)
    if minutos_detenido < config.r2_detencion_no_programada.minutos_detenido_para_alertar:
        return None
    return _evento(
        contexto,
        TipoEvento.DETENCION_NO_PROGRAMADA,
        SeveridadEvento.SERVICIO,
        {"minutos_detenido": round(minutos_detenido, 1)},
    )


def evaluar_r3_riesgo_retraso(contexto: ContextoReglas, config: ConfiguracionReglas) -> EventoDTO | None:
    viaje = contexto.viaje
    if viaje.estatus != EstatusViaje.EN_RUTA or viaje.eta_actual is None:
        return None
    if viaje.eta_actual <= viaje.cita_entrega:
        return None
    minutos_retraso = (viaje.eta_actual - viaje.cita_entrega).total_seconds() / 60
    if viaje.eta_ultima_notificada is not None:
        minutos_cambio = abs((viaje.eta_actual - viaje.eta_ultima_notificada).total_seconds() / 60)
        if minutos_cambio < config.r3_riesgo_retraso.minutos_cambio_eta_para_notificar:
            return None
    return _evento(
        contexto,
        TipoEvento.RIESGO_RETRASO,
        SeveridadEvento.SERVICIO,
        {"minutos_retraso_estimado": round(minutos_retraso, 1), "eta": viaje.eta_actual.isoformat()},
    )


def evaluar_r4_llegada_salida(contexto: ContextoReglas, config: ConfiguracionReglas) -> EventoDTO | None:
    posicion = contexto.posicion_actual
    viaje = contexto.viaje
    destino = next((g for g in contexto.geocercas if g.id == viaje.destino_geocerca_id), None)
    if posicion is None or destino is None:
        return None
    dentro = punto_dentro_de_geocerca(posicion.lat, posicion.lon, destino)
    if dentro and viaje.hora_llegada_real is None:
        return _evento(contexto, TipoEvento.LLEGADA_DESTINO, SeveridadEvento.INFO, {"geocerca_id": destino.id})
    if not dentro and viaje.hora_llegada_real is not None and viaje.estatus != EstatusViaje.ENTREGADO:
        return _evento(contexto, TipoEvento.SALIDA_DESTINO, SeveridadEvento.INFO, {"geocerca_id": destino.id})
    return None


def evaluar_r5_operador_no_responde(contexto: ContextoReglas, config: ConfiguracionReglas) -> EventoDTO | None:
    intento = contexto.ultimo_intento_contacto_operador
    if intento is None:
        return None
    respuesta = contexto.ultima_respuesta_operador
    if respuesta is not None and respuesta >= intento:
        return None
    minutos_sin_responder = (contexto.ahora - intento).total_seconds() / 60
    if minutos_sin_responder < config.r5_operador_no_responde.minutos_sin_respuesta_para_escalar:
        return None
    return _evento(
        contexto,
        TipoEvento.OPERADOR_NO_RESPONDE,
        SeveridadEvento.CRITICO,
        {"minutos_sin_responder": round(minutos_sin_responder, 1)},
    )


def evaluar_r6_exceso_velocidad(contexto: ContextoReglas, config: ConfiguracionReglas) -> EventoDTO | None:
    posicion = contexto.posicion_actual
    if posicion is None:
        return None
    cfg = config.r6_exceso_velocidad
    if posicion.velocidad > cfg.velocidad_maxima_kmh:
        return _evento(
            contexto,
            TipoEvento.EXCESO_VELOCIDAD,
            SeveridadEvento.SERVICIO,
            {"velocidad_kmh": posicion.velocidad, "limite_kmh": cfg.velocidad_maxima_kmh},
        )
    hora = posicion.timestamp.hour
    en_horario_restringido = hora >= cfg.hora_inicio_restriccion_nocturna or hora < cfg.hora_fin_restriccion_nocturna
    if en_horario_restringido and posicion.velocidad > 0:
        return _evento(
            contexto,
            TipoEvento.CONDUCCION_NOCTURNA_RESTRINGIDA,
            SeveridadEvento.SERVICIO,
            {"hora": hora},
        )
    return None


REGLAS_SERVICIO = [
    evaluar_r1_inicio_viaje_demorado,
    evaluar_r2_detencion_no_programada,
    evaluar_r3_riesgo_retraso,
    evaluar_r4_llegada_salida,
    evaluar_r5_operador_no_responde,
    evaluar_r6_exceso_velocidad,
]
