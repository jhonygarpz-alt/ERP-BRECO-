"""Operador -- el chofer; telefono_whatsapp es el canal principal del agente
conversacional (ver messaging/ y agent/, fases 2+)."""

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.domain.models._mixins import IdMixin, TenantMixin, TimestampMixin


class Operador(Base, IdMixin, TenantMixin, TimestampMixin):
    __tablename__ = "operadores"

    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    telefono_whatsapp: Mapped[str] = mapped_column(String(20), nullable=False)
    licencia: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
