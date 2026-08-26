import type { Empresa } from '../types';

// Valor de respaldo que se muestra brevemente mientras carga la fila real
// de "empresa" desde Supabase. Los demas catalogos (clientes, unidades,
// cajas, operadores, viajes, facturas, reportes, roles, usuarios) ya viven
// en la base de datos real -- supabase/schema.sql los siembra la primera
// vez que se corre.
export const seedEmpresa: Empresa = {
  nombre: 'BRECO Transportes',
  razonSocial: 'Pendiente',
  rfc: 'Pendiente',
  direccion: 'Pendiente',
  telefono: 'Pendiente',
  email: 'Pendiente',
  sitioWeb: '',
  logoDataUrl: '',
};
