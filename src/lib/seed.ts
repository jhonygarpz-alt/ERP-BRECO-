import type { Caja, Cliente, Factura, Operador, Unidad, Viaje } from '../types';

export const seedClientes: Cliente[] = [
  {
    id: 'cli-1',
    nombre: 'Grupo Industrial Monterrey',
    rfc: 'GIM950214AB1',
    contacto: 'Ricardo Peña',
    telefono: '81 2345 6789',
    email: 'compras@gim.com.mx',
    direccion: 'Av. Fundidora 501, Monterrey, N.L.',
    estatus: 'activo',
  },
  {
    id: 'cli-2',
    nombre: 'Alimentos del Norte S.A.',
    rfc: 'ADN870601C22',
    contacto: 'Laura Salinas',
    telefono: '81 8899 2211',
    email: 'logistica@alimentosnorte.mx',
    direccion: 'Blvd. Díaz Ordaz 1200, San Nicolás, N.L.',
    estatus: 'activo',
  },
  {
    id: 'cli-3',
    nombre: 'Aceros y Perfiles SLP',
    rfc: 'APS020317K90',
    contacto: 'Miguel Torres',
    telefono: '444 123 4567',
    email: 'miguel.torres@aceroslp.com',
    direccion: 'Carr. 57 Km 12, San Luis Potosí, S.L.P.',
    estatus: 'activo',
  },
];

export const seedUnidades: Unidad[] = [
  { id: 'uni-1', economico: 'TR-045', placas: 'NL-45-AB', tipo: 'Tractocamion', marca: 'Kenworth', modelo: 'T680', anio: 2022, estatus: 'Disponible' },
  { id: 'uni-2', economico: 'TR-112', placas: 'NL-12-CD', tipo: 'Tractocamion', marca: 'Freightliner', modelo: 'Cascadia', anio: 2021, estatus: 'En viaje' },
  { id: 'uni-3', economico: 'TR-089', placas: 'NL-89-EF', tipo: 'Tractocamion', marca: 'International', modelo: 'LT625', anio: 2020, estatus: 'Taller' },
  { id: 'uni-4', economico: 'TR-201', placas: 'NL-01-GH', tipo: 'Rabon', marca: 'Hino', modelo: '500', anio: 2023, estatus: 'Disponible' },
];

export const seedCajas: Caja[] = [
  { id: 'caj-1', economico: 'CJ-301', placas: 'NL-301-A', tipo: 'Seca', capacidad: '53 pies', estatus: 'Disponible' },
  { id: 'caj-2', economico: 'CJ-302', placas: 'NL-302-B', tipo: 'Refrigerada', capacidad: '48 pies', estatus: 'En uso' },
  { id: 'caj-3', economico: 'CJ-303', placas: 'NL-303-C', tipo: 'Plataforma', capacidad: '40 pies', estatus: 'Disponible' },
];

export const seedOperadores: Operador[] = [
  { id: 'op-1', nombre: 'Juan Rodríguez', licencia: 'LIC-88231', tipoLicencia: 'Federal Tipo E', telefono: '81 1122 3344', vigenciaLicencia: '2027-05-10', estatus: 'Disponible' },
  { id: 'op-2', nombre: 'María López', licencia: 'LIC-55120', tipoLicencia: 'Federal Tipo E', telefono: '81 5566 7788', vigenciaLicencia: '2026-11-02', estatus: 'En viaje' },
  { id: 'op-3', nombre: 'Carlos Herrera', licencia: 'LIC-77003', tipoLicencia: 'Federal Tipo E', telefono: '444 998 1122', vigenciaLicencia: '2025-09-20', estatus: 'Descanso' },
];

const today = new Date().toISOString().slice(0, 10);

export const seedViajes: Viaje[] = [
  {
    id: 'via-1',
    folio: 'V-0001',
    fecha: today,
    clienteId: 'cli-1',
    unidadId: 'uni-2',
    cajaId: 'caj-2',
    operadorId: 'op-2',
    origen: 'Monterrey, N.L.',
    destino: 'Saltillo, Coah.',
    horaSalida: '07:30',
    horaLlegadaEstimada: '10:00',
    estatus: 'En transito',
    observaciones: 'Carga refrigerada, mantener cadena de frío.',
  },
  {
    id: 'via-2',
    folio: 'V-0002',
    fecha: today,
    clienteId: 'cli-2',
    unidadId: 'uni-1',
    cajaId: 'caj-1',
    operadorId: 'op-1',
    origen: 'San Nicolás, N.L.',
    destino: 'Tampico, Tamps.',
    horaSalida: '09:00',
    horaLlegadaEstimada: '17:00',
    estatus: 'Programado',
    observaciones: '',
  },
];

export const seedFacturas: Factura[] = [
  {
    id: 'fac-1',
    folio: 'F-1001',
    fecha: today,
    viajeId: 'via-1',
    clienteId: 'cli-1',
    importe: 18500,
    moneda: 'MXN',
    estatus: 'Pendiente',
    observaciones: '',
  },
];
