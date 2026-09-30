/**
 * Catalogo de "features" personalizadas que se pueden activar para UNA
 * empresa en particular (a diferencia de modulosContratados, que prende o
 * apaga un modulo completo para todas sus pantallas). Sirve para cambios
 * que un cliente especifico pidio -- un campo, una seccion, un
 * comportamiento -- que no deben aparecer en las demas empresas.
 *
 * Como agregar una feature nueva:
 *   1. Registra aqui una entrada con una key unica (snake_case) y un label.
 *   2. En el componente donde va el cambio, llama `tieneFeature('la_key')`
 *      (desde useAuth()) y muestra/oculta lo que corresponda.
 *   3. Actívala para la empresa que la pidio desde Super Admin > Empresas >
 *      Editar > "Features personalizadas".
 */
export interface FeatureFlagDef {
  key: string;
  label: string;
  descripcion?: string;
}

export const FEATURE_FLAGS: FeatureFlagDef[] = [
  {
    key: 'unidades_camaras_modem',
    label: 'Camaras y modem de Unidades',
    descripcion: 'Agrega a Unidades los campos de Numero de camaras, Modem de internet, Compania del modem y Numero para recarga del modem.',
  },
];
