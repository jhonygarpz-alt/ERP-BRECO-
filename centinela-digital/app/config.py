"""Configuracion centralizada, leida de variables de entorno (.env). Nunca
poner credenciales en el codigo: todo lo sensible viene de aqui."""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Base de datos / colas
    database_url: str = "postgresql+psycopg://centinela:centinela@localhost:5432/centinela"
    redis_url: str = "redis://localhost:6379/0"

    # Zona horaria de toda la operacion
    timezone: str = "America/Mexico_City"

    # Proveedores intercambiables
    gps_provider: str = "mock"
    wialon_token: str = ""
    wialon_base_url: str = ""
    traccar_url: str = ""
    traccar_user: str = ""
    traccar_password: str = ""

    messaging_channel: str = "console"
    whatsapp_cloud_token: str = ""
    whatsapp_cloud_phone_number_id: str = ""
    whatsapp_cloud_verify_token: str = ""
    whatsapp_cloud_app_secret: str = ""
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_whatsapp_from: str = ""
    twilio_voice_from: str = ""

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-opus-5"

    stt_provider: str = "none"
    openai_api_key: str = ""

    eta_provider: str = "haversine"
    osrm_base_url: str = "http://localhost:5000"
    google_routes_api_key: str = ""

    palabra_coaccion_default: str = "manzana"

    dashboard_secret_key: str = "cambia-esto"

    log_level: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()
