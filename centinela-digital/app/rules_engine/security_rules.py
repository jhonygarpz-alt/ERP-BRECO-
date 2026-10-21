"""Reglas de seguridad para transporte de hidrocarburos -- maxima
prioridad. Cualquier evento que generan es severidad SEGURIDAD y debe
escalarse de inmediato a un monitorista de seguridad sin pasar por una
conversacion con el operador ni degradarse nunca (ver escalation/, fases
siguientes). Deterministico, igual que rules.py: el agente de IA (Claude)
nunca participa en esta clasificacion."""

from app.domain.enums import EstatusViaje, SeveridadEvento, TipoEvento, TipoGeocerca
from app.domain.schemas import ContextoReglas, EventoDTO
from app.rules_engine.geometria import distancia_a_corredor_m, punto_dentro_de_geocerca

SEGUNDOS_SIN_POSICION_PARA_PERDIDA_SENAL = 10 * 60


def _evento_seguridad(contexto: ContextoReglas, tipo: TipoEvento, detalle: dict) -> EventoDTO:
    return EventoDTO(
        empresa_id=contexto.viaje.empresa_id,
        viaje_id=contexto.viaje.id,
        unidad_id=contexto.viaje.unidad_id,
        tipo=tipo,
        severidad=SeveridadEvento.SEGURIDAD,
        detalle=detalle,
    )


def evaluar_boton_panico(contexto: ContextoReglas) -> EventoDTO | None:
    posicion = contexto.posicion_actual
    if posicion is None or not posicion.entradas_digitales.get("boton_panico"):
        return None
    return _evento_seguridad(contexto, TipoEvento.BOTON_PANICO, {"lat": posicion.lat, "lon": posicion.lon})


def evaluar_perdida_senal(contexto: ContextoReglas) -> EventoDTO | None:
    if contexto.viaje.estatus != EstatusViaje.EN_RUTA:
        return None
    if contexto.posicion_actual is not None:
        return None
    if not contexto.posiciones_recientes:
        return None
    ultima = contexto.posiciones_recientes[-1]
    segundos_sin_senal = (contexto.ahora - ultima.timestamp).total_seconds()
    if segundos_sin_senal < SEGUNDOS_SIN_POSICION_PARA_PERDIDA_SENAL:
        return None
    return _evento_seguridad(contexto, TipoEvento.PERDIDA_SENAL, {"segundos_sin_senal": round(segundos_sin_senal)})


def evaluar_desvio_corredor(contexto: ContextoReglas) -> EventoDTO | None:
    posicion = contexto.posicion_actual
    ruta = contexto.ruta_autorizada
    if posicion is None or ruta is None:
        return None
    distancia_m = distancia_a_corredor_m(posicion.lat, posicion.lon, ruta)
    if distancia_m <= ruta.tolerancia_m:
        return None
    return _evento_seguridad(
        contexto,
        TipoEvento.DESVIO_CORREDOR,
        {"distancia_m": round(distancia_m), "tolerancia_m": ruta.tolerancia_m},
    )


def evaluar_detencion_zona_riesgo(contexto: ContextoReglas) -> EventoDTO | None:
    posicion = contexto.posicion_actual
    if posicion is None or posicion.velocidad > 0:
        return None
    zonas_riesgo = [g for g in contexto.geocercas if g.tipo == TipoGeocerca.ZONA_RIESGO]
    for zona in zonas_riesgo:
        if punto_dentro_de_geocerca(posicion.lat, posicion.lon, zona):
            return _evento_seguridad(contexto, TipoEvento.DETENCION_ZONA_RIESGO, {"geocerca_id": zona.id})
    return None


def evaluar_apertura_valvula_sello(contexto: ContextoReglas) -> EventoDTO | None:
    posicion = contexto.posicion_actual
    if posicion is None or not posicion.entradas_digitales.get("valvula_sello_abierta"):
        return None
    return _evento_seguridad(contexto, TipoEvento.APERTURA_VALVULA_SELLO, {})


def evaluar_desenganche(contexto: ContextoReglas) -> EventoDTO | None:
    posicion = contexto.posicion_actual
    if posicion is None or not posicion.entradas_digitales.get("desenganchado"):
        return None
    return _evento_seguridad(contexto, TipoEvento.DESENGANCHE, {})


def evaluar_palabra_coaccion(contexto: ContextoReglas, texto_mensaje: str) -> EventoDTO | None:
    """La palabra de coaccion dispara el protocolo de seguridad EN SECRETO:
    quien llame a esta funcion debe seguir respondiendole al operador como
    si nada (ver especificacion del agente conversacional, Fase 4) y nunca
    debe mencionarle que se detecto. No forma parte de REGLAS_SEGURIDAD
    porque necesita el texto del mensaje entrante, no solo el GPS."""
    palabra = contexto.palabra_coaccion.strip().lower()
    if not palabra:
        return None
    palabras_mensaje = texto_mensaje.lower().split()
    if palabra not in palabras_mensaje:
        return None
    return _evento_seguridad(contexto, TipoEvento.PALABRA_COACCION, {})


REGLAS_SEGURIDAD = [
    evaluar_boton_panico,
    evaluar_perdida_senal,
    evaluar_desvio_corredor,
    evaluar_detencion_zona_riesgo,
    evaluar_apertura_valvula_sello,
    evaluar_desenganche,
]
