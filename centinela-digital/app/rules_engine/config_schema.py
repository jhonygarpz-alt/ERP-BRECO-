"""Esquema de configuracion de las reglas -- cada empresa puede ajustar los
parametros (minutos de tolerancia, velocidades, etc.) sin tocar codigo.
Se valida con Pydantic al cargarla desde YAML (Fase 1) o desde la base de
datos (fases posteriores, una fila por empresa con este mismo shape)."""

from pathlib import Path

import yaml
from pydantic import BaseModel


class ConfigR1InicioViaje(BaseModel):
    minutos_antes_cita_para_vigilar: int = 60
    minutos_sin_respuesta_para_llamar: int = 10
    minutos_sin_respuesta_para_escalar: int = 20


class ConfigR2DetencionNoProgramada(BaseModel):
    minutos_detenido_para_alertar: int = 30


class ConfigR3RiesgoRetraso(BaseModel):
    minutos_cambio_eta_para_notificar: int = 20


class ConfigR5OperadorNoResponde(BaseModel):
    minutos_sin_respuesta_para_escalar: int = 30


class ConfigR6ExcesoVelocidad(BaseModel):
    velocidad_maxima_kmh: float = 100.0
    hora_inicio_restriccion_nocturna: int = 22
    hora_fin_restriccion_nocturna: int = 5


class ConfiguracionReglas(BaseModel):
    """Configuracion completa de reglas de una empresa."""

    palabra_coaccion: str = "manzana"
    r1_inicio_viaje: ConfigR1InicioViaje = ConfigR1InicioViaje()
    r2_detencion_no_programada: ConfigR2DetencionNoProgramada = ConfigR2DetencionNoProgramada()
    r3_riesgo_retraso: ConfigR3RiesgoRetraso = ConfigR3RiesgoRetraso()
    r5_operador_no_responde: ConfigR5OperadorNoResponde = ConfigR5OperadorNoResponde()
    r6_exceso_velocidad: ConfigR6ExcesoVelocidad = ConfigR6ExcesoVelocidad()


_RUTA_DEFAULT = Path(__file__).parent / "default_rules.yaml"


def cargar_configuracion_default() -> ConfiguracionReglas:
    with open(_RUTA_DEFAULT, encoding="utf-8") as f:
        datos = yaml.safe_load(f)
    return ConfiguracionReglas.model_validate(datos)
