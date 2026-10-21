"""Conversacion y sus mensajes -- el historial completo que el agente y los
monitoristas usan de contexto; control_humano=True significa que un
monitorista tomo el control y el bot deja de responder (ver dashboard/)."""

from sqlalchemy import JSON, Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.domain.enums import CanalConversacion, DireccionMensaje, TipoContenidoMensaje, TipoParticipante
from app.domain.models._mixins import IdMixin, TenantMixin, TimestampMixin


class Conversacion(Base, IdMixin, TenantMixin, TimestampMixin):
    __tablename__ = "conversaciones"

    viaje_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("viajes.id"), nullable=True, index=True)
    canal: Mapped[CanalConversacion] = mapped_column(String(20), nullable=False)
    participante_tipo: Mapped[TipoParticipante] = mapped_column(String(20), nullable=False)
    participante_telefono: Mapped[str] = mapped_column(String(20), nullable=False)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="abierta")
    control_humano: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class Mensaje(Base, IdMixin, TimestampMixin):
    __tablename__ = "mensajes"

    conversacion_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("conversaciones.id", ondelete="CASCADE"), nullable=False, index=True
    )
    direccion: Mapped[DireccionMensaje] = mapped_column(String(10), nullable=False)
    contenido: Mapped[str] = mapped_column(Text, nullable=False, default="")
    tipo_contenido: Mapped[TipoContenidoMensaje] = mapped_column(
        String(20), nullable=False, default=TipoContenidoMensaje.TEXTO
    )
    plantilla_nombre: Mapped[str | None] = mapped_column(String(100), nullable=True)
    transcripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False, default=dict)
