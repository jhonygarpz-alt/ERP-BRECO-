"""Cliente y sus contactos autorizados a consultar viajes por WhatsApp.

ContactoCliente.telefono es la llave de validacion: el agente solo deja
consultar los viajes del cliente al que ese telefono pertenece (nunca
viajes de otros clientes ni datos personales del operador)."""

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.domain.models._mixins import IdMixin, TenantMixin, TimestampMixin


class Cliente(Base, IdMixin, TenantMixin, TimestampMixin):
    __tablename__ = "clientes"

    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    razon_social: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class ContactoCliente(Base, IdMixin, TimestampMixin):
    __tablename__ = "contactos_cliente"

    cliente_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    telefono: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    puede_consultar_viajes: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
