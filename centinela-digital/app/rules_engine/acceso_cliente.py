"""Validacion de que un contacto de cliente solo puede consultar los viajes
de SU cliente -- nunca viajes de otros clientes ni datos personales del
operador. Deterministico y previo a cualquier llamada al agente de IA (ver
agent/, Fase 2+); es la unica compuerta que decide si una consulta de
estatus se contesta o se rechaza."""

from app.domain.schemas import ViajeDTO


def contacto_puede_consultar_viaje(cliente_id_contacto: str, viaje: ViajeDTO) -> bool:
    return viaje.cliente_id == cliente_id_contacto
