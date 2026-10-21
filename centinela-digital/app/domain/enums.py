"""Enums compartidos por los modelos de dominio. Se guardan como texto en la
base de datos (no enums nativos de Postgres) para poder agregar valores
nuevos sin una migracion de esquema."""

import enum


class TipoGeocerca(str, enum.Enum):
    ORIGEN = "origen"
    DESTINO = "destino"
    AUTORIZADA = "autorizada"
    ZONA_RIESGO = "zona_riesgo"


class EstatusViaje(str, enum.Enum):
    PROGRAMADO = "programado"
    EN_ESPERA_INICIO = "en_espera_inicio"
    EN_RUTA = "en_ruta"
    DETENIDO = "detenido"
    ENTREGADO = "entregado"
    CANCELADO = "cancelado"
    INCIDENCIA = "incidencia"


class SeveridadEvento(str, enum.Enum):
    INFO = "info"
    SERVICIO = "servicio"
    CRITICO = "critico"
    SEGURIDAD = "seguridad"


class TipoEvento(str, enum.Enum):
    INICIO_VIAJE_DEMORADO = "inicio_viaje_demorado"
    DETENCION_NO_PROGRAMADA = "detencion_no_programada"
    RIESGO_RETRASO = "riesgo_retraso"
    LLEGADA_DESTINO = "llegada_destino"
    SALIDA_DESTINO = "salida_destino"
    OPERADOR_NO_RESPONDE = "operador_no_responde"
    EXCESO_VELOCIDAD = "exceso_velocidad"
    CONDUCCION_NOCTURNA_RESTRINGIDA = "conduccion_nocturna_restringida"
    BOTON_PANICO = "boton_panico"
    PERDIDA_SENAL = "perdida_senal"
    DESVIO_CORREDOR = "desvio_corredor"
    DETENCION_ZONA_RIESGO = "detencion_zona_riesgo"
    APERTURA_VALVULA_SELLO = "apertura_valvula_sello"
    DESENGANCHE = "desenganche"
    PALABRA_COACCION = "palabra_coaccion"


# Eventos cuya severidad SIEMPRE es "seguridad" -- nunca se degradan ni se
# conversan con el operador, ver rules_engine/security_rules.py.
EVENTOS_SEGURIDAD = {
    TipoEvento.BOTON_PANICO,
    TipoEvento.PERDIDA_SENAL,
    TipoEvento.DESVIO_CORREDOR,
    TipoEvento.DETENCION_ZONA_RIESGO,
    TipoEvento.APERTURA_VALVULA_SELLO,
    TipoEvento.DESENGANCHE,
    TipoEvento.PALABRA_COACCION,
}


class EstatusEvento(str, enum.Enum):
    ABIERTO = "abierto"
    EN_PROCESO = "en_proceso"
    CERRADO = "cerrado"


class EstatusIncidencia(str, enum.Enum):
    ABIERTA = "abierta"
    CERRADA = "cerrada"


class RolMonitorista(str, enum.Enum):
    OPERACIONES = "operaciones"
    SEGURIDAD = "seguridad"


class CanalConversacion(str, enum.Enum):
    WHATSAPP = "whatsapp"
    VOZ = "voz"


class TipoParticipante(str, enum.Enum):
    OPERADOR = "operador"
    CLIENTE = "cliente"
    MONITORISTA = "monitorista"


class DireccionMensaje(str, enum.Enum):
    ENTRANTE = "entrante"
    SALIENTE = "saliente"


class TipoContenidoMensaje(str, enum.Enum):
    TEXTO = "texto"
    AUDIO = "audio"
    PLANTILLA = "plantilla"


class CategoriaMotivoDetencion(str, enum.Enum):
    CARGA_COMBUSTIBLE = "carga_combustible"
    ALIMENTOS_DESCANSO = "alimentos_descanso"
    REVISION_AUTORIDAD = "revision_autoridad"
    FALLA_MECANICA = "falla_mecanica"
    ESPERA_CLIENTE = "espera_cliente"
    TRAFICO_BLOQUEO = "trafico_bloqueo"
    ACCIDENTE = "accidente"
    OTRO = "otro"


# Categorias que siempre se escalan a un monitorista humano sin importar
# cuanto tiempo lleve la detencion.
CATEGORIAS_ESCALAN_SIEMPRE = {
    CategoriaMotivoDetencion.ACCIDENTE,
    CategoriaMotivoDetencion.FALLA_MECANICA,
}
