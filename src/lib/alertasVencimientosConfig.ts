import type { AlertasVencimientosConfig } from '../types';

export const DEFAULT_ALERTAS_VENCIMIENTOS: AlertasVencimientosConfig = {
  unidad: {
    placas: true,
    permisos: true,
    seguroPlacaMexicana: true,
    seguroPlacaAmericana: true,
    documentosAdicionales: true,
    diasNotificar: 30,
  },
  operador: {
    licencia: true,
    aptoMedico: true,
    documentosAdicionales: true,
    diasNotificar: 30,
  },
};
