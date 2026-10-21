"""Clasificador por palabras clave del motivo de detencion que da el
operador -- lo usa unicamente MockAgentEngine. No es una regla de
seguridad (esas viven en rules_engine/ y nunca dependen de texto libre sin
pasar por aqui con intencion de IA); esto es solo para que el agente de
prueba se comporte de forma realista sin necesitar un modelo de lenguaje."""

from app.domain.enums import CategoriaMotivoDetencion

_PALABRAS_CLAVE: list[tuple[CategoriaMotivoDetencion, tuple[str, ...]]] = [
    (
        CategoriaMotivoDetencion.ACCIDENTE,
        ("accidente", "choque", "choqué", "choque", "volcadura", "volqué", "me estrelle", "me estrellé"),
    ),
    (
        CategoriaMotivoDetencion.FALLA_MECANICA,
        ("falla", "descompuso", "descompuesto", "ponchadura", "ponchada", "no prende", "averiado", "motor"),
    ),
    (
        CategoriaMotivoDetencion.CARGA_COMBUSTIBLE,
        ("gasolina", "diesel", "diésel", "combustible", "pemex"),
    ),
    (
        CategoriaMotivoDetencion.REVISION_AUTORIDAD,
        ("revision", "revisión", "reten", "retén", "policia", "policía", "militar", "guardia nacional", "sct"),
    ),
    (
        CategoriaMotivoDetencion.ALIMENTOS_DESCANSO,
        ("comiendo", "comer", "descanso", "descansando", "bano", "baño", "dormir"),
    ),
    (
        CategoriaMotivoDetencion.ESPERA_CLIENTE,
        ("esperando", "cliente", "anden", "andén", "no me reciben", "cita"),
    ),
    (
        CategoriaMotivoDetencion.TRAFICO_BLOQUEO,
        ("trafico", "tráfico", "bloqueo", "manifestacion", "manifestación", "marcha"),
    ),
]


def clasificar(texto: str) -> CategoriaMotivoDetencion:
    texto_normalizado = texto.lower()
    for categoria, palabras in _PALABRAS_CLAVE:
        if any(palabra in texto_normalizado for palabra in palabras):
            return categoria
    return CategoriaMotivoDetencion.OTRO
