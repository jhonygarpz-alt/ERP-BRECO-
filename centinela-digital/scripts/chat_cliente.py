"""Chat interactivo para probar el flujo de consulta de un cliente (R3/R4):
el cliente pregunta por el estatus de un viaje y el agente responde SOLO si
ese viaje es suyo -- la validacion nunca pasa por la IA (ver
agent/flujo_consulta_cliente.py). Escribe como si fueras el cliente;
prueba preguntar por "F-220" (tuyo, con retraso) y por "F-999" (de otro
cliente, para ver que se niega el acceso). "salir" para terminar.

Uso:
    python -m scripts.chat_cliente
"""

import re
import sys
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.agent import construir_client_agent_engine  # noqa: E402
from app.agent.flujo_consulta_cliente import procesar_consulta_cliente  # noqa: E402
from app.config import get_settings  # noqa: E402
from app.domain.enums import EstatusViaje  # noqa: E402
from app.domain.schemas import ViajeDTO  # noqa: E402
from app.logging_config import ahora_mx  # noqa: E402
from app.messaging import construir_messaging_channel  # noqa: E402

CLIENTE_ID = "cliente-demo"
TELEFONO_CLIENTE = "+52-33-1111-2222"

_ahora = ahora_mx()

VIAJES = {
    "F-220": ViajeDTO(
        id="viaje-220",
        empresa_id="empresa-1",
        unidad_id="unidad-7",
        operador_id="operador-7",
        cliente_id=CLIENTE_ID,
        folio="F-220",
        origen_geocerca_id=None,
        destino_geocerca_id=None,
        ruta_autorizada_id=None,
        cita_carga=_ahora - timedelta(hours=3),
        cita_entrega=_ahora + timedelta(minutes=30),
        estatus=EstatusViaje.EN_RUTA,
        eta_actual=_ahora + timedelta(minutes=75),
        eta_ultima_notificada=None,
        hora_inicio_real=_ahora - timedelta(hours=3),
        hora_llegada_real=None,
    ),
    "F-999": ViajeDTO(
        id="viaje-999",
        empresa_id="empresa-1",
        unidad_id="unidad-3",
        operador_id="operador-3",
        cliente_id="cliente-otro",
        folio="F-999",
        origen_geocerca_id=None,
        destino_geocerca_id=None,
        ruta_autorizada_id=None,
        cita_carga=_ahora - timedelta(hours=1),
        cita_entrega=_ahora + timedelta(hours=2),
        estatus=EstatusViaje.EN_RUTA,
        eta_actual=_ahora + timedelta(hours=2, minutes=10),
        eta_ultima_notificada=None,
        hora_inicio_real=_ahora - timedelta(hours=1),
        hora_llegada_real=None,
    ),
}

_PATRON_FOLIO = re.compile(r"\bF-\d+\b", re.IGNORECASE)


def _buscar_viaje(texto: str) -> ViajeDTO | None:
    m = _PATRON_FOLIO.search(texto)
    folio = m.group(0).upper() if m else "F-220"  # si no menciona folio, asumimos que pregunta por el suyo
    return VIAJES.get(folio)


def main() -> None:
    settings = get_settings()
    engine = construir_client_agent_engine()
    canal = construir_messaging_channel()

    print(f"(agente: {settings.agent_engine} | canal de mensajeria: {settings.messaging_channel})")
    print("Escribe como si fueras el cliente. Prueba preguntar por 'F-220' (tuyo) o 'F-999' (de otro cliente).")
    print("'salir' para terminar.\n")

    while True:
        try:
            texto = input("Tu (cliente) > ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nFin del chat.")
            break
        if not texto:
            continue
        if texto.lower() in ("salir", "exit", "quit"):
            print("Fin del chat.")
            break

        viaje = _buscar_viaje(texto)
        resultado = procesar_consulta_cliente(engine, CLIENTE_ID, viaje, texto)
        canal.enviar(TELEFONO_CLIENTE, resultado.mensaje_para_cliente)
        print(f"   [acceso permitido: {resultado.acceso_permitido}]\n")


if __name__ == "__main__":
    main()
