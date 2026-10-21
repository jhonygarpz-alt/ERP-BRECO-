"""Empresa -- la raiz de todo el multiempresa: toda tabla operativa cuelga
de una empresa via TenantMixin.empresa_id (ver domain/models/_mixins.py)."""

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.domain.models._mixins import IdMixin, TimestampMixin


class Empresa(Base, IdMixin, TimestampMixin):
    __tablename__ = "empresas"

    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    rfc: Mapped[str] = mapped_column(String(13), nullable=False, default="")
    timezone: Mapped[str] = mapped_column(String(50), nullable=False, default="America/Mexico_City")
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
