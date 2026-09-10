# ERP-BRECO-
ERP BRECO

## Estatus TLAAV

`index.html` es la app de "Actualización de Estatus" de la flota TLAAV (Transportes Vázquez): una página única en React (cargado por CDN, sin backend ni build) donde se captura la ubicación, status y cliente de cada unidad y se genera una imagen (PNG) lista para compartir.

Se publica automáticamente en GitHub Pages en cada push a `main` mediante `.github/workflows/deploy-pages.yml`.

### Activar GitHub Pages (una sola vez)

1. Ve a **Settings → Pages** en este repositorio.
2. En **Build and deployment → Source**, selecciona **GitHub Actions**.
3. Tras el primer push/merge a `main`, el sitio quedará disponible en `https://<usuario>.github.io/<repo>/`.

### Desarrollo local

No requiere instalación ni build: abre `index.html` directamente en el navegador, o sirve la carpeta con cualquier servidor estático, por ejemplo `python3 -m http.server`.
