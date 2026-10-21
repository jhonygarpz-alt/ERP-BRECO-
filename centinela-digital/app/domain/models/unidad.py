"""Unidad (tractocamion) -- la entidad que trae el GPS; ver gps_adapters/."""

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.domain.models._mixins import IdMixin, TenantMixin, TimestampMixin


class Unidad(Base, IdMixin, TenantMixin, TimestampMixin):
    __tablename__ = "unidades"

    economico: Mapped[str] = mapped_column(String(20), nullable=False)
    placas: Mapped[str] = mapped_column(String(20), nullable=False, default="")
    tipo: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
