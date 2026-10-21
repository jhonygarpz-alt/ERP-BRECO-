"""Chat interactivo para probar el flujo de R2 (detencion no programada):
simula que el bot ya detecto que un viaje lleva mas de 30 minutos
detenido fuera de cualquier geocerca autorizada y le pregunta al operador
por que se detuvo. Escribe como si fueras el operador; "salir" o Ctrl+C
para terminar.

El motor que clasifica y redacta (Mock o Claude) depende de AGENT_ENGINE
en .env -- con AGENT_ENGINE=mock (el default) no se llama a ningun modelo
de lenguaje, pero el flujo y las decisiones de escalamiento son
exactamente los mismos que con AGENT_ENGINE=claude.

Uso:
    python -m scripts.chat_operador
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.agent import construir_agent_engine  # noqa: E402
from app.agent.flujo_detencion import procesar_respuesta_operador  # noqa: E402
from app.config import get_settings  # noqa: E402
from app.messaging import construir_messaging_channel  # noqa: E402

TELEFONO_OPERADOR = "+52-477-000-0000"


def main() -> None:
    settings = get_settings()
    engine = construir_agent_engine()
    canal = construir_messaging_channel()

    print(f"(agente: {settings.agent_engine} | canal de mensajeria: {settings.messaging_channel})")
    print("Escribe como si fueras el operador. 'salir' para terminar.\n")

    canal.enviar(
        TELEFONO_OPERADOR,
        "Hola, soy Centinela. Veo que tu unidad lleva mas de 30 minutos detenida "
        "fuera de una parada autorizada. ¿Cual es el motivo?",
    )

    while True:
        try:
            texto = input("\nTu (operador) > ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nFin del chat.")
            break
        if not texto:
            continue
        if texto.lower() in ("salir", "exit", "quit"):
            print("Fin del chat.")
            break

        resultado = procesar_respuesta_operador(engine, texto)
        canal.enviar(TELEFONO_OPERADOR, resultado.mensaje_para_operador)
        etiqueta = f"   [clasificado como: {resultado.categoria.value}"
        etiqueta += " -- ESCALADO A MONITORISTA]" if resultado.va_a_escalar else "]"
        print(etiqueta)


if __name__ == "__main__":
    main()
