"""Mixins compartidos por los modelos de dominio."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column


def nuevo_id() -> str:
    return str(uuid.uuid4())


class IdMixin:
    """Llave primaria uuid como texto -- igual que el resto del ERP, para
    poder generar el id en el cliente/worker sin ida y vuelta a la base."""

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=nuevo_id)


class TenantMixin:
    """Toda tabla operativa es multiempresa desde el dia uno: una fila
    siempre pertenece a una sola empresa, y cada consulta debe filtrar por
    este campo (ver domain/models/empresa.py)."""

    empresa_id: Mapped[str] = mapped_column(String(36), ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)


class TimestampMixin:
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
