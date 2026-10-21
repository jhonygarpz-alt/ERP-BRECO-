"""Proveedor de GPS simulado para la Fase 1 -- sin el, no hay forma de
probar el rules_engine ni demostrar el sistema sin un GPS real conectado.

Simula unidades viajando sobre corredores reales de Mexico (Salamanca ->
Guadalajara, Tula -> Queretaro) e inyecta, en puntos programados de la
ruta, los eventos que el rules_engine debe saber distinguir: una parada
(programada o no), un desvio del corredor autorizado, perdida de señal, o
el boton de panico.

El tiempo lo controla quien use el provider llamando a `avanzar(segundos)`
-- así `scripts/simular_dia.py` puede correr 24 horas de operacion en
segundos reales, y las pruebas pueden avanzar el reloj exactamente lo que
necesiten."""

from dataclasses import dataclass, field

from app.common.geo import haversine_m
from app.domain.schemas import PosicionGpsDTO
from app.gps_adapters.base import GPSProvider
from app.logging_config import ahora_mx

Punto = tuple[float, float]  # (lat, lon)


@dataclass
class EventoProgramado:
    """Un evento a inyectar cuando la unidad alcance cierta fraccion de su
    ruta. tipo: "parada" | "desvio" | "perdida_senal" | "panico"."""

    fraccion_inicio: float
    tipo: str
    duracion_s: float = 0.0
    desvio_grados: Punto = (0.0, 0.0)
    consumido: bool = field(default=False, repr=False)


@dataclass
class _EstadoUnidad:
    ruta: list[Punto]
    distancia_total_m: float
    velocidad_kmh: float
    eventos: list[EventoProgramado]
    progreso_m: float = 0.0
    evento_activo: EventoProgramado | None = None
    tiempo_restante_evento_s: float = 0.0


def _distancia_ruta_m(ruta: list[Punto]) -> float:
    return sum(haversine_m(a[0], a[1], b[0], b[1]) for a, b in zip(ruta, ruta[1:]))


def _interpolar(ruta: list[Punto], progreso_m: float) -> Punto:
    restante = progreso_m
    for (lat1, lon1), (lat2, lon2) in zip(ruta, ruta[1:]):
        d = haversine_m(lat1, lon1, lat2, lon2)
        if restante <= d:
            t = restante / d if d > 0 else 0.0
            return lat1 + (lat2 - lat1) * t, lon1 + (lon2 - lon1) * t
        restante -= d
    return ruta[-1]


# Coordenadas aproximadas (suficientes para una simulacion, no para
# navegacion real) de dos corredores de carga comunes en el centro de
# Mexico.
RUTA_SALAMANCA_GUADALAJARA: list[Punto] = [
    (20.5750, -101.1949),  # Salamanca, Gto.
    (20.5250, -101.3800),  # La Piedad, Mich.
    (20.3400, -102.0000),  # Zamora, Mich.
    (20.5200, -103.0100),  # Zapotlanejo, Jal.
    (20.6597, -103.3496),  # Guadalajara, Jal.
]

RUTA_TULA_QUERETARO: list[Punto] = [
    (20.0500, -99.3400),  # Tula de Allende, Hgo.
    (20.0000, -99.5500),  # San Juan del Rio aprox.
    (20.0800, -99.8500),
    (20.5888, -100.3899),  # Queretaro, Qro.
]

# Tres variantes por defecto para repartir ciclicamente entre las unidades
# simuladas, cada una ejercitando un camino distinto del rules_engine.
_RUTAS_DEFAULT: list[tuple[list[Punto], list[EventoProgramado]]] = [
    (
        RUTA_SALAMANCA_GUADALAJARA,
        [
            EventoProgramado(0.3, "parada", duracion_s=20 * 60),
            EventoProgramado(0.7, "desvio", duracion_s=15 * 60, desvio_grados=(0.05, 0.05)),
        ],
    ),
    (
        RUTA_TULA_QUERETARO,
        [
            EventoProgramado(0.4, "perdida_senal", duracion_s=10 * 60),
            EventoProgramado(0.8, "parada", duracion_s=45 * 60),
        ],
    ),
    (
        RUTA_SALAMANCA_GUADALAJARA,
        [
            EventoProgramado(0.5, "panico", duracion_s=5 * 60),
        ],
    ),
]


class MockGPSProvider(GPSProvider):
    def __init__(self) -> None:
        self._estado: dict[str, _EstadoUnidad] = {}

    def registrar_unidad(
        self,
        unidad_id: str,
        ruta: list[Punto],
        eventos: list[EventoProgramado],
        velocidad_kmh: float = 80.0,
    ) -> None:
        self._estado[unidad_id] = _EstadoUnidad(
            ruta=ruta,
            distancia_total_m=_distancia_ruta_m(ruta),
            velocidad_kmh=velocidad_kmh,
            eventos=sorted(eventos, key=lambda e: e.fraccion_inicio),
        )

    def registrar_unidad_con_ruta_default(self, unidad_id: str, indice: int) -> None:
        """Atajo para demos/pruebas: asigna una de las rutas de
        `_RUTAS_DEFAULT` repartidas ciclicamente por indice."""
        ruta, eventos_base = _RUTAS_DEFAULT[indice % len(_RUTAS_DEFAULT)]
        eventos = [
            EventoProgramado(e.fraccion_inicio, e.tipo, e.duracion_s, e.desvio_grados) for e in eventos_base
        ]
        self.registrar_unidad(unidad_id, ruta=list(ruta), eventos=eventos)

    def avanzar(self, segundos: float) -> None:
        """Simula el paso del tiempo: mueve cada unidad segun su velocidad,
        salvo que este dentro de un evento que la detenga (parada, perdida
        de señal, panico)."""
        for estado in self._estado.values():
            self._avanzar_unidad(estado, segundos)

    def _avanzar_unidad(self, estado: _EstadoUnidad, segundos: float) -> None:
        if estado.progreso_m >= estado.distancia_total_m:
            return

        if estado.evento_activo is None:
            fraccion = estado.progreso_m / estado.distancia_total_m
            for evento in estado.eventos:
                if not evento.consumido and fraccion >= evento.fraccion_inicio:
                    evento.consumido = True
                    estado.evento_activo = evento
                    estado.tiempo_restante_evento_s = evento.duracion_s
                    break

        evento = estado.evento_activo
        if evento is not None and evento.tipo in ("parada", "perdida_senal", "panico"):
            estado.tiempo_restante_evento_s -= segundos
            if estado.tiempo_restante_evento_s <= 0:
                estado.evento_activo = None
            return

        metros = (estado.velocidad_kmh * 1000 / 3600) * segundos
        estado.progreso_m = min(estado.distancia_total_m, estado.progreso_m + metros)

        if evento is not None and evento.tipo == "desvio":
            estado.tiempo_restante_evento_s -= segundos
            if estado.tiempo_restante_evento_s <= 0:
                estado.evento_activo = None

    def obtener_posiciones_actuales(self, unidad_ids: list[str]) -> list[PosicionGpsDTO]:
        resultados: list[PosicionGpsDTO] = []
        for unidad_id in unidad_ids:
            estado = self._estado.get(unidad_id)
            if estado is None:
                continue

            evento = estado.evento_activo
            if evento is not None and evento.tipo == "perdida_senal":
                continue  # sin señal: un proveedor real tampoco reportaria nada

            lat, lon = _interpolar(estado.ruta, estado.progreso_m)
            if evento is not None and evento.tipo == "desvio":
                lat += evento.desvio_grados[0]
                lon += evento.desvio_grados[1]

            detenida = evento is not None and evento.tipo in ("parada", "panico")
            velocidad = 0.0 if detenida else estado.velocidad_kmh

            resultados.append(
                PosicionGpsDTO(
                    unidad_id=unidad_id,
                    lat=lat,
                    lon=lon,
                    velocidad=velocidad,
                    ignicion=not detenida,
                    timestamp=ahora_mx(),
                    calidad_senal="buena",
                    entradas_digitales={"boton_panico": evento is not None and evento.tipo == "panico"},
                    proveedor="mock",
                )
            )
        return resultados
