"""Geocercas (circulo o poligono) y corredores autorizados.

La geometria se guarda como GeoJSON-like dict (circulo: {"tipo": "circulo",
"centro": [lon, lat]} + radio_m aparte; poligono: {"tipo": "poligono",
"coordenadas": [[lon, lat], ...]}) y se evalua con Shapely en rules_engine/
-- se elige no usar PostGIS para no agregar una extension de Postgres como
infraestructura (default propuesto y aprobado por el usuario en la
validacion de la Fase 1)."""

from sqlalchemy import JSON, Boolean, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.domain.enums import TipoGeocerca
from app.domain.models._mixins import IdMixin, TenantMixin, TimestampMixin


class Geocerca(Base, IdMixin, TenantMixin, TimestampMixin):
    __tablename__ = "geocercas"

    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    tipo: Mapped[TipoGeocerca] = mapped_column(String(20), nullable=False)
    geometria: Mapped[dict] = mapped_column(JSON, nullable=False)
    radio_m: Mapped[float | None] = mapped_column(Float, nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class RutaAutorizada(Base, IdMixin, TenantMixin, TimestampMixin):
    __tablename__ = "rutas_autorizadas"

    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    geometria: Mapped[dict] = mapped_column(JSON, nullable=False)
    tolerancia_m: Mapped[float] = mapped_column(Float, nullable=False, default=500.0)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
