# ERP BRECO Transportes — Area de Trafico

Aplicacion web (React + TypeScript + Tailwind CSS) para el area de trafico de
BRECO Transportes. Todos los datos se guardan en el `localStorage` del
navegador; no requiere backend para esta primera version.

## Acceso

Usuario administrador inicial (cambiar la contrasena en cuanto se pueda
entrar, desde Configuracion > Usuarios):

- Email: `admin@brecotransportes.com`
- Contrasena: `breco2026`

**Importante**: como todavia no hay servidor, el login valida contra los
usuarios guardados en el navegador (no hay cifrado real de contrasenas).
Sirve para separar accesos de uso interno de confianza, no como seguridad a
prueba de ataques. La migracion a base de datos + servidor esta planeada para
una siguiente etapa.

## Modulos

- **Resumen**: KPIs del dia (viajes, unidades disponibles, facturacion,
  alertas de licencias/unidades en taller).
- **Catalogos**: Clientes, Unidades, Cajas, Operadores (alta, edicion y baja).
- **Asignacion de Viajes**: asigna cliente, unidad, caja y operador a cada
  viaje con su ruta y horarios.
- **Facturacion Diaria**: facturas generadas a partir de los viajes, filtradas
  por fecha, con totales de facturado/pendiente/pagado.
- **Programa Diario de Viajes**: agenda del dia con todos los viajes
  programados en formato de linea de tiempo.
- **Configuracion**: datos de la empresa (incluye logo), usuarios del sistema
  y roles con permisos por modulo (ver/crear/editar/eliminar).

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de produccion
npm run lint     # oxlint
```
