"""Orquesta la consulta de estatus de un cliente (R3/R4): valida acceso
ANTES de llamar al agente -- si el viaje no es del cliente que pregunta, ni
siquiera se le pasa al motor de IA, para que nunca pueda "decidir" revelar
datos de otro cliente (ver rules_engine/acceso_cliente.py; mismo principio
que flujo_detencion.py aplica a la decision de escalar: lo sensible nunca
lo decide el modelo)."""

from dataclasses import dataclass

from app.agent.cliente_base import ClientAgentEngine
from app.domain.schemas import ViajeDTO
from app.rules_engine.acceso_cliente import contacto_puede_consultar_viaje

_MENSAJE_SIN_ACCESO = "No encuentro ningún viaje tuyo con esos datos. ¿Me confirmas el folio?"


@dataclass
class ResultadoConsultaCliente:
    acceso_permitido: bool
    mensaje_para_cliente: str


def procesar_consulta_cliente(
    engine: ClientAgentEngine,
    cliente_id_contacto: str,
    viaje: ViajeDTO | None,
    mensaje_cliente: str,
) -> ResultadoConsultaCliente:
    if viaje is None or not contacto_puede_consultar_viaje(cliente_id_contacto, viaje):
        return ResultadoConsultaCliente(acceso_permitido=False, mensaje_para_cliente=_MENSAJE_SIN_ACCESO)
    mensaje = engine.responder(viaje, mensaje_cliente)
    return ResultadoConsultaCliente(acceso_permitido=True, mensaje_para_cliente=mensaje)
