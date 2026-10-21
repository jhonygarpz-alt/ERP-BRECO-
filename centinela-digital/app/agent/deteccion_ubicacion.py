"""Deteccion por palabras clave de si el cliente esta pidiendo la
ubicacion/posicion de su unidad -- determinista, no la decide el modelo de
lenguaje (mismo principio que clasificador.py: lo estructural lo decide
codigo normal, la IA solo redacta texto). La usa
agent/flujo_consulta_cliente.py para saber si, ademas del texto, hay que
mandar un mensaje de ubicacion nativo de WhatsApp."""

_PALABRAS_CLAVE = (
    "donde",
    "dónde",
    "ubicacion",
    "ubicación",
    "ubicada",
    "localizacion",
    "localización",
    "posicion",
    "posición",
    "mapa",
    "foto",
    "captura",
    "en que parte",
    "en qué parte",
    "por donde va",
    "por dónde va",
)


def cliente_pregunta_por_ubicacion(texto: str) -> bool:
    texto_normalizado = texto.lower()
    return any(palabra in texto_normalizado for palabra in _PALABRAS_CLAVE)
