import L from 'leaflet';

// Pin tipo "gota" dibujado con HTML/CSS (sin imagenes externas, para no
// depender de los assets de icono por defecto de Leaflet, que no cargan bien
// con Vite). Verde con "A" para Origen, rojo con "B" para Destino.
export function pinIcon(color: string, letra: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html:
      `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:${color};` +
      'transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;' +
      'border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.45);">' +
      `<span style="transform:rotate(45deg);color:white;font-weight:700;font-size:12px;line-height:1;">${letra}</span>` +
      '</div>',
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  });
}
