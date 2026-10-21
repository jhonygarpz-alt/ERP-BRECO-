"""Agente de prueba: clasifica y redacta respuestas con reglas fijas, sin
llamar a ningun modelo de lenguaje. Mismo contrato que ClaudeAgentEngine
(AgentEngine) para poder cambiar de uno a otro solo con AGENT_ENGINE en
.env, sin tocar el resto del sistema."""

from app.agent.base import AgentEngine
from app.agent.clasificador import clasificar
from app.domain.enums import CategoriaMotivoDetencion

_RESPUESTAS = {
    CategoriaMotivoDetencion.CARGA_COMBUSTIBLE: "Entendido, gracias por avisar que te detuviste a cargar combustible. Buen viaje.",
    CategoriaMotivoDetencion.ALIMENTOS_DESCANSO: "Perfecto, tomate tu tiempo para comer/descansar. Avisame cuando sigas en ruta.",
    CategoriaMotivoDetencion.REVISION_AUTORIDAD: "Gracias por avisar. Queda registrada la revision de autoridad en tu ruta.",
    CategoriaMotivoDetencion.ESPERA_CLIENTE: "Entendido, queda registrado que estas esperando en el cliente.",
    CategoriaMotivoDetencion.TRAFICO_BLOQUEO: "Gracias por avisar del trafico/bloqueo. Manejate con cuidado.",
    CategoriaMotivoDetencion.OTRO: "Gracias por la informacion, queda registrada.",
}

_RESPUESTAS_ESCALADAS = {
    CategoriaMotivoDetencion.FALLA_MECANICA: "Entendido, ya le avise a un monitorista sobre la falla mecanica. En un momento te contactan.",
    CategoriaMotivoDetencion.ACCIDENTE: "Recibido. Ya escale esto a un monitorista de inmediato -- mantente en un lugar seguro.",
}


class MockAgentEngine(AgentEngine):
    def clasificar(self, texto_operador: str) -> CategoriaMotivoDetencion:
        return clasificar(texto_operador)

    def redactar_respuesta(self, categoria: CategoriaMotivoDetencion, va_a_escalar: bool) -> str:
        if va_a_escalar:
            return _RESPUESTAS_ESCALADAS.get(categoria, "Recibido, ya escale esto a un monitorista.")
        return _RESPUESTAS.get(categoria, "Gracias por la informacion, queda registrada.")
