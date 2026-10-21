"""Conversion de la geometria guardada en Geocerca/RutaAutorizada (GeoJSON
simplificado, ver domain/models/geocerca.py) a objetos Shapely, y las
pruebas geometricas que las reglas necesitan. Se usa Shapely (puro Python)
en vez de PostGIS para no agregar una extension de Postgres como
infraestructura -- default propuesto y aprobado por el usuario en la
validacion de la Fase 1."""

from shapely.geometry import LineString, Point, Polygon

from app.domain.schemas import GeocercaDTO, RutaAutorizadaDTO

METROS_POR_GRADO = 111_320.0  # aproximacion valida para los radios/tolerancias de esta app (decenas-cientos de m)


def _punto_shapely(lat: float, lon: float) -> Point:
    return Point(lon, lat)  # Shapely usa (x, y) = (lon, lat)


def geocerca_a_shapely(geocerca: GeocercaDTO):
    if geocerca.geometria.get("tipo") == "circulo":
        centro_lon, centro_lat = geocerca.geometria["centro"]
        radio_m = geocerca.radio_m or 0.0
        return _punto_shapely(centro_lat, centro_lon).buffer(radio_m / METROS_POR_GRADO)
    coordenadas = geocerca.geometria["coordenadas"]  # [[lon, lat], ...]
    return Polygon(coordenadas)


def punto_dentro_de_geocerca(lat: float, lon: float, geocerca: GeocercaDTO) -> bool:
    return geocerca_a_shapely(geocerca).contains(_punto_shapely(lat, lon))


def distancia_a_corredor_m(lat: float, lon: float, ruta: RutaAutorizadaDTO) -> float:
    coordenadas = ruta.geometria["coordenadas"]  # [[lon, lat], ...]
    linea = LineString(coordenadas)
    distancia_grados = linea.distance(_punto_shapely(lat, lon))
    return distancia_grados * METROS_POR_GRADO
