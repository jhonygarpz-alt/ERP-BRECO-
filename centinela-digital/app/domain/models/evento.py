"""Evento -- lo que genera el rules_engine (nunca el agente de IA, ver
rules_engine/engine.py); EVENTOS_SEGURIDAD (domain/enums.py) define cuales
nunca se degradan ni se conversan con el operador."""

from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.domain.enums import EstatusEvento, EstatusIncidencia, SeveridadEvento, TipoEvento
from app.domain.models._mixins import IdMixin, TenantMixin, TimestampMixin


class Evento(Base, IdMixin, TenantMixin, TimestampMixin):
    __tablename__ = "eventos"

    viaje_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("viajes.id"), nullable=True, index=True)
    unidad_id: Mapped[str] = mapped_column(String(36), ForeignKey("unidades.id"), nullable=False, index=True)
    tipo: Mapped[TipoEvento] = mapped_column(String(50), nullable=False)
    severidad: Mapped[SeveridadEvento] = mapped_column(String(20), nullable=False)
    estatus: Mapped[EstatusEvento] = mapped_column(String(20), nullable=False, default=EstatusEvento.ABIERTO)
    detalle: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    cerrado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cerrado_por: Mapped[str | None] = mapped_column(String(200), nullable=True)


class Incidencia(Base, IdMixin, TenantMixin, TimestampMixin):
    __tablename__ = "incidencias"

    evento_id: Mapped[str] = mapped_column(String(36), ForeignKey("eventos.id"), nullable=False, index=True)
    viaje_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("viajes.id"), nullable=True, index=True)
    unidad_id: Mapped[str] = mapped_column(String(36), ForeignKey("unidades.id"), nullable=False, index=True)
    estatus: Mapped[EstatusIncidencia] = mapped_column(
        String(20), nullable=False, default=EstatusIncidencia.ABIERTA
    )
    linea_tiempo: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    cerrada_por: Mapped[str | None] = mapped_column(String(200), nullable=True)
    cerrada_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resumen_cierre: Mapped[str | None] = mapped_column(String(2000), nullable=True)
