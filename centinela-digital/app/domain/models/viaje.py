"""Viaje -- el eje de todo: el rules_engine evalua cada viaje en_ruta contra
sus geocercas/ruta_autorizada/citas en cada vuelta del poller (ver
worker/poller.py)."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.domain.enums import EstatusViaje
from app.domain.models._mixins import IdMixin, TenantMixin, TimestampMixin


class Viaje(Base, IdMixin, TenantMixin, TimestampMixin):
    __tablename__ = "viajes"

    unidad_id: Mapped[str] = mapped_column(String(36), ForeignKey("unidades.id"), nullable=False, index=True)
    operador_id: Mapped[str] = mapped_column(String(36), ForeignKey("operadores.id"), nullable=False, index=True)
    cliente_id: Mapped[str] = mapped_column(String(36), ForeignKey("clientes.id"), nullable=False, index=True)
    folio: Mapped[str] = mapped_column(String(50), nullable=False)

    origen_geocerca_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("geocercas.id"), nullable=True)
    destino_geocerca_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("geocercas.id"), nullable=True)
    ruta_autorizada_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("rutas_autorizadas.id"), nullable=True
    )

    cita_carga: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    cita_entrega: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    estatus: Mapped[EstatusViaje] = mapped_column(String(30), nullable=False, default=EstatusViaje.PROGRAMADO)

    eta_actual: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    eta_ultima_notificada: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    hora_inicio_real: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    hora_llegada_real: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
