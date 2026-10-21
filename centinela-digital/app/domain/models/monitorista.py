"""Monitorista -- personal humano de monitoreo/seguridad; rol=SEGURIDAD es a
quien se escalan los eventos de EVENTOS_SEGURIDAD (ver
rules_engine/security_rules.py)."""

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.domain.enums import RolMonitorista
from app.domain.models._mixins import IdMixin, TenantMixin, TimestampMixin


class Monitorista(Base, IdMixin, TenantMixin, TimestampMixin):
    __tablename__ = "monitoristas"

    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    telefono: Mapped[str] = mapped_column(String(20), nullable=False)
    rol: Mapped[RolMonitorista] = mapped_column(String(20), nullable=False, default=RolMonitorista.OPERACIONES)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
