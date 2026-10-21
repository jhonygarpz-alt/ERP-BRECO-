"""FastAPI app factory. En Fase 1 solo expone un healthcheck -- el webhook
de WhatsApp, la API del agente y el panel de monitoristas se agregan en
fases posteriores (ver README.md)."""

from fastapi import FastAPI

from app.logging_config import configurar_logging


def crear_app() -> FastAPI:
    configurar_logging()
    app = FastAPI(title="Centinela Digital", version="0.1.0")

    @app.get("/salud")
    def salud() -> dict:
        return {"estatus": "ok"}

    return app


app = crear_app()
