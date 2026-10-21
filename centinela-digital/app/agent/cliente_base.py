"""Interfaz intercambiable del agente que responde consultas de clientes
(R3/R4) -- mismo patron que el agente del operador (agent/base.py).

A diferencia del agente del operador, este nunca clasifica ni decide nada
de seguridad: solo redacta una respuesta en lenguaje natural a partir de
los datos reales del viaje que se le dan, y nunca debe inventar datos que
no esten en esos hechos. La validacion de que el viaje SI es del cliente
que pregunta nunca pasa por aqui -- ver agent/flujo_consulta_cliente.py,
que llama a rules_engine/acceso_cliente.py ANTES de invocar al engine, para
que la IA nunca llegue a ver datos de un viaje que no es del cliente."""

from abc import ABC, abstractmethod

from app.domain.schemas import ViajeDTO


class ClientAgentEngine(ABC):
    @abstractmethod
    def responder(self, viaje: ViajeDTO, mensaje_cliente: str) -> str:
        raise NotImplementedError
