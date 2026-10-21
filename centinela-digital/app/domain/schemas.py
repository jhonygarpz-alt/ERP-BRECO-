"""DTOs Pydantic -- lo que entra/sale de la API y lo que se pasa entre
rules_engine, gps_adapters y el resto de modulos (nunca los modelos de
SQLAlchemy directamente, para no acoplar la forma de la base de datos con
estos contratos internos)."""

from datetime import datetime

from pydantic import BaseModel

from app.domain.enums import (
    CanalConversacion,
    EstatusEvento,
    EstatusViaje,
    SeveridadEvento,
    TipoEvento,
    TipoGeocerca,
    TipoParticipante,
)


class PosicionGpsDTO(BaseModel):
    unidad_id: str
    lat: float
    lon: float
    velocidad: float
    ignicion: bool
    timestamp: datetime
    calidad_senal: str
    entradas_digitales: dict[str, bool] = {}
    proveedor: str


class GeocercaDTO(BaseModel):
    id: str
    empresa_id: str
    nombre: str
    tipo: TipoGeocerca
    geometria: dict
    radio_m: float | None = None


class RutaAutorizadaDTO(BaseModel):
    id: str
    empresa_id: str
    nombre: str
    geometria: dict
    tolerancia_m: float


class ViajeDTO(BaseModel):
    id: str
    empresa_id: str
    unidad_id: str
    operador_id: str
    cliente_id: str
    folio: str
    origen_geocerca_id: str | None
    destino_geocerca_id: str | None
    ruta_autorizada_id: str | None
    cita_carga: datetime
    cita_entrega: datetime
    estatus: EstatusViaje
    eta_actual: datetime | None
    eta_ultima_notificada: datetime | None
    hora_inicio_real: datetime | None
    hora_llegada_real: datetime | None


class EventoDTO(BaseModel):
    empresa_id: str
    viaje_id: str | None
    unidad_id: str
    tipo: TipoEvento
    severidad: SeveridadEvento
    estatus: EstatusEvento = EstatusEvento.ABIERTO
    detalle: dict = {}


class ContextoReglas(BaseModel):
    """Lo que el rules_engine necesita para evaluar un viaje en un instante
    dado -- se construye una vez por vuelta del poller y se le pasa a cada
    regla, para no repetir queries a la base por cada regla individual."""

    ahora: datetime
    viaje: ViajeDTO
    posicion_actual: PosicionGpsDTO | None
    posiciones_recientes: list[PosicionGpsDTO]
    geocercas: list[GeocercaDTO]
    ruta_autorizada: RutaAutorizadaDTO | None
    palabra_coaccion: str
    # Estos dos son None en Fase 1 (aun no hay canal de WhatsApp real); se
    # llenan a partir de conversaciones/mensajes a partir de la Fase 2 para
    # que R1/R5 sepan si el operador respondio al ultimo intento de contacto.
    ultimo_intento_contacto_operador: datetime | None = None
    ultima_respuesta_operador: datetime | None = None


class MensajeEntranteDTO(BaseModel):
    """Un mensaje de WhatsApp (o su simulacion) listo para que el agente o
    el rules_engine de seguridad lo revisen."""

    telefono_origen: str
    tipo_participante: TipoParticipante
    canal: CanalConversacion
    contenido: str
    viaje_id: str | None = None
