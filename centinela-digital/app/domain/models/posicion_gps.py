"""Posicion GPS cruda tal cual llega del proveedor (ver gps_adapters/).

No lleva empresa_id propio: una posicion siempre se consulta a traves de su
unidad (que si es TenantMixin), tal como quedo en el esquema validado con
el usuario."""

from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.domain.models._mixins import IdMixin


class PosicionGps(Base, IdMixin):
    __tablename__ = "posiciones_gps"

    unidad_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("unidades.id", ondelete="CASCADE"), nullable=False, index=True
    )
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lon: Mapped[float] = mapped_column(Float, nullable=False)
    velocidad: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    ignicion: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    calidad_senal: Mapped[str] = mapped_column(String(20), nullable=False, default="buena")
    entradas_digitales: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    proveedor: Mapped[str] = mapped_column(String(50), nullable=False, default="")
