"""Simula 10 unidades viajando 24 horas (aceleradas) usando MockGPSProvider
y corre el rules_engine sobre cada una en cada vuelta -- exactamente la
misma logica que app/worker/poller.py pero toda en memoria, sin necesitar
Postgres/Redis corriendo, para poder demostrar la Fase 1 con un solo
comando.

Uso:
    python -m scripts.simular_dia
"""

import sys
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.alerts.console_channel import ConsoleAlertChannel  # noqa: E402
from app.domain.enums import EstatusViaje, TipoEvento, TipoGeocerca  # noqa: E402
from app.domain.schemas import ContextoReglas, GeocercaDTO, PosicionGpsDTO, ViajeDTO  # noqa: E402
from app.eta.haversine_calculator import HaversineEtaCalculator  # noqa: E402
from app.gps_adapters.mock_provider import (  # noqa: E402
    RUTA_SALAMANCA_GUADALAJARA,
    RUTA_TULA_QUERETARO,
    MockGPSProvider,
)
from app.logging_config import ahora_mx, configurar_logging  # noqa: E402
from app.rules_engine.config_schema import cargar_configuracion_default  # noqa: E402
from app.rules_engine.engine import evaluar_viaje  # noqa: E402

NUM_UNIDADES = 10
HORAS_SIMULADAS = 24
PASO_SEGUNDOS = 5 * 60  # cada vuelta simulada avanza 5 min de operacion real
MINUTOS_HISTORIAL = 60
VUELTAS_HISTORIAL = int(MINUTOS_HISTORIAL * 60 / PASO_SEGUNDOS)

_RUTAS = [RUTA_SALAMANCA_GUADALAJARA, RUTA_TULA_QUERETARO, RUTA_SALAMANCA_GUADALAJARA]
_HORAS_CITA_ENTREGA = [5, 4, 5]  # deliberadamente ajustado para que alguna unidad dispare R3


def _geocerca_circulo(
    id_: str, empresa_id: str, nombre: str, tipo: TipoGeocerca, centro_lat: float, centro_lon: float, radio_m: float
) -> GeocercaDTO:
    return GeocercaDTO(
        id=id_,
        empresa_id=empresa_id,
        nombre=nombre,
        tipo=tipo,
        geometria={"tipo": "circulo", "centro": [centro_lon, centro_lat]},
        radio_m=radio_m,
    )


def _construir_viajes_y_geocercas(ahora):
    provider = MockGPSProvider()
    viajes: list[ViajeDTO] = []
    geocercas_por_unidad: dict[str, list[GeocercaDTO]] = {}
    empresa_id = "demo"

    for i in range(NUM_UNIDADES):
        unidad_id = f"unidad-{i + 1}"
        provider.registrar_unidad_con_ruta_default(unidad_id, i)
        ruta = _RUTAS[i % len(_RUTAS)]
        horas_entrega = _HORAS_CITA_ENTREGA[i % len(_HORAS_CITA_ENTREGA)]

        origen_lat, origen_lon = ruta[0]
        destino_lat, destino_lon = ruta[-1]
        origen = _geocerca_circulo(
            f"{unidad_id}-origen", empresa_id, "Origen", TipoGeocerca.ORIGEN, origen_lat, origen_lon, 500
        )
        destino = _geocerca_circulo(
            f"{unidad_id}-destino", empresa_id, "Destino", TipoGeocerca.DESTINO, destino_lat, destino_lon, 500
        )
        geocercas_por_unidad[unidad_id] = [origen, destino]

        viajes.append(
            ViajeDTO(
                id=f"viaje-{i + 1}",
                empresa_id=empresa_id,
                unidad_id=unidad_id,
                operador_id=f"operador-{i + 1}",
                cliente_id="cliente-demo",
                folio=f"F-{i + 1:03d}",
                origen_geocerca_id=origen.id,
                destino_geocerca_id=destino.id,
                ruta_autorizada_id=None,
                cita_carga=ahora - timedelta(minutes=5),
                cita_entrega=ahora + timedelta(hours=horas_entrega),
                estatus=EstatusViaje.EN_RUTA,
                eta_actual=None,
                eta_ultima_notificada=None,
                hora_inicio_real=ahora - timedelta(minutes=5),
                hora_llegada_real=None,
            )
        )

    return provider, viajes, geocercas_por_unidad


def main() -> None:
    configurar_logging()
    config = cargar_configuracion_default()
    eta_calculator = HaversineEtaCalculator()
    alertas = ConsoleAlertChannel()

    ahora = ahora_mx()
    provider, viajes, geocercas_por_unidad = _construir_viajes_y_geocercas(ahora)
    historial: dict[str, list[PosicionGpsDTO]] = {v.unidad_id: [] for v in viajes}
    # Mismo debounce que app/worker/poller.py (ahi contra la tabla eventos;
    # aqui en memoria): mientras una condicion siga igual de abierta no se
    # vuelve a notificar en cada vuelta. RIESGO_RETRASO se excluye porque ya
    # se autoregula en la propia regla via eta_ultima_notificada.
    eventos_abiertos: dict[str, set[TipoEvento]] = {v.unidad_id: set() for v in viajes}

    total_vueltas = int(HORAS_SIMULADAS * 3600 / PASO_SEGUNDOS)
    total_eventos = 0

    print(f"Simulando {NUM_UNIDADES} unidades durante {HORAS_SIMULADAS}h (aceleradas, paso={PASO_SEGUNDOS}s)...\n")

    for _ in range(total_vueltas):
        provider.avanzar(PASO_SEGUNDOS)
        ahora = ahora + timedelta(seconds=PASO_SEGUNDOS)
        posiciones = {
            p.unidad_id: p for p in provider.obtener_posiciones_actuales([v.unidad_id for v in viajes])
        }

        for viaje in viajes:
            geocercas = geocercas_por_unidad[viaje.unidad_id]
            posicion = posiciones.get(viaje.unidad_id)

            if posicion is not None:
                historial[viaje.unidad_id].append(posicion)
                historial[viaje.unidad_id] = historial[viaje.unidad_id][-VUELTAS_HISTORIAL:]

                destino = next(g for g in geocercas if g.tipo == TipoGeocerca.DESTINO)
                destino_lon, destino_lat = destino.geometria["centro"]
                viaje.eta_actual = eta_calculator.calcular_eta(
                    (posicion.lat, posicion.lon), (destino_lat, destino_lon), posicion.velocidad, ahora
                )

            contexto = ContextoReglas(
                ahora=ahora,
                viaje=viaje,
                posicion_actual=posicion,
                posiciones_recientes=historial[viaje.unidad_id],
                geocercas=geocercas,
                ruta_autorizada=None,
                palabra_coaccion=config.palabra_coaccion,
            )

            abiertos = eventos_abiertos[viaje.unidad_id]
            for evento in evaluar_viaje(contexto, config):
                if evento.tipo != TipoEvento.RIESGO_RETRASO:
                    if evento.tipo in abiertos:
                        continue  # la condicion sigue igual de abierta; ya se avisó
                    abiertos.add(evento.tipo)

                alertas.notificar(evento)
                total_eventos += 1
                # El rules_engine es puro/sin efectos: es responsabilidad de
                # quien lo llama reflejar en el viaje lo que el evento
                # implica (ver la misma logica en app/worker/poller.py).
                if evento.tipo == TipoEvento.LLEGADA_DESTINO:
                    viaje.hora_llegada_real = ahora

            if viaje.eta_actual is not None:
                viaje.eta_ultima_notificada = viaje.eta_actual

    print(f"\nSimulacion terminada: {total_eventos} eventos generados en {HORAS_SIMULADAS}h simuladas.")


if __name__ == "__main__":
    main()
