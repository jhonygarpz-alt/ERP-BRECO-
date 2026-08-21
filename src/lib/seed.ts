import type { Caja, Cliente, Empresa, Factura, Operador, Rol, Unidad, Usuario, Viaje } from '../types';

export const seedClientes: Cliente[] = [
  { id: 'cli-werner', nombre: 'WERNER', rfc: 'Pendiente', contacto: 'Pendiente', telefono: 'Pendiente', email: 'Pendiente', direccion: 'Pendiente', estatus: 'activo' },
  { id: 'cli-totalone', nombre: 'TOTAL ONE', rfc: 'Pendiente', contacto: 'Pendiente', telefono: 'Pendiente', email: 'Pendiente', direccion: 'Pendiente', estatus: 'activo' },
  { id: 'cli-silverto', nombre: 'SILVERTO', rfc: 'Pendiente', contacto: 'Pendiente', telefono: 'Pendiente', email: 'Pendiente', direccion: 'Pendiente', estatus: 'activo' },
  { id: 'cli-redwood', nombre: 'REDWOOD', rfc: 'Pendiente', contacto: 'Pendiente', telefono: 'Pendiente', email: 'Pendiente', direccion: 'Pendiente', estatus: 'activo' },
  { id: 'cli-mj', nombre: 'MJ', rfc: 'Pendiente', contacto: 'Pendiente', telefono: 'Pendiente', email: 'Pendiente', direccion: 'Pendiente', estatus: 'activo' },
];

export const seedOperadores: Operador[] = [
  { id: 'op-orlando-dorbecker', nombre: 'Orlando Dorbecker', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'Disponible' },
  { id: 'op-rodrigo-espana', nombre: 'Rodrigo España', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'Disponible' },
  { id: 'op-gari-lineker', nombre: 'Gari Lineker Davila', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'Disponible' },
  { id: 'op-edgar-gomez', nombre: 'Edgar Gomez', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'Disponible' },
  { id: 'op-marcos-tinoco', nombre: 'Marcos O Tinoco', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'Disponible' },
  { id: 'op-krytian-robles', nombre: 'Krytian Robles', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'Disponible' },
  { id: 'op-edgar-cruz', nombre: 'Edgar Cruz', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'Disponible' },
  { id: 'op-ruben-velazquez', nombre: 'Ruben Velazquez', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'Disponible' },
  { id: 'op-geovany-romero', nombre: 'Geovany Romero', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'Disponible' },
  { id: 'op-francisco-gonzalez', nombre: 'Francisco Gonzalez', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'Disponible' },
  { id: 'op-francisco-maya', nombre: 'Francisco Maya', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'Disponible' },
  { id: 'op-juan-carlos-garcia', nombre: 'Juan Carlos Garcia', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'Disponible' },
  { id: 'op-humberto-colin', nombre: 'Humberto Colin', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'Disponible' },
  { id: 'op-fernando-garcia', nombre: 'Fernando Garcia', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'Disponible' },
];

function unidad(
  economico: string,
  operadorAsignadoId: string | undefined,
  clienteAsignadoId: string | undefined,
): Unidad {
  return {
    id: `uni-${economico.toLowerCase()}`,
    economico,
    placas: '',
    tipo: 'Tractocamion',
    marca: '',
    modelo: '',
    anio: 0,
    estatus: clienteAsignadoId ? 'En viaje' : 'Disponible',
    operadorAsignadoId,
    clienteAsignadoId,
  };
}

export const seedUnidades: Unidad[] = [
  unidad('T01', 'op-orlando-dorbecker', 'cli-werner'),
  unidad('T02', 'op-rodrigo-espana', 'cli-totalone'),
  unidad('T03', 'op-gari-lineker', 'cli-werner'),
  unidad('T04', 'op-edgar-gomez', 'cli-werner'),
  unidad('T05', 'op-marcos-tinoco', 'cli-silverto'),
  unidad('T06', 'op-krytian-robles', 'cli-redwood'),
  unidad('T07', 'op-edgar-cruz', 'cli-redwood'),
  unidad('T08', 'op-ruben-velazquez', 'cli-totalone'),
  unidad('T09', undefined, undefined),
  unidad('T10', 'op-geovany-romero', 'cli-redwood'),
  unidad('T11', 'op-francisco-gonzalez', 'cli-mj'),
  unidad('T12', 'op-francisco-maya', 'cli-totalone'),
  unidad('T13', 'op-juan-carlos-garcia', 'cli-werner'),
  unidad('FLEED-1', 'op-humberto-colin', 'cli-totalone'),
  unidad('FLEED-2', 'op-fernando-garcia', undefined),
];

export const seedCajas: Caja[] = [
  { id: 'caj-1', economico: 'CJ-301', placas: '', tipo: 'Seca', capacidad: '53 pies', estatus: 'Disponible' },
  { id: 'caj-2', economico: 'CJ-302', placas: '', tipo: 'Refrigerada', capacidad: '48 pies', estatus: 'Disponible' },
  { id: 'caj-3', economico: 'CJ-303', placas: '', tipo: 'Plataforma', capacidad: '40 pies', estatus: 'Disponible' },
];

export const seedViajes: Viaje[] = [];

export const seedFacturas: Factura[] = [];

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

const permisosCompletos = {
  Catalogos: { ver: true, crear: true, editar: true, eliminar: true },
  Viajes: { ver: true, crear: true, editar: true, eliminar: true },
  Facturacion: { ver: true, crear: true, editar: true, eliminar: true },
  Programa: { ver: true, crear: true, editar: true, eliminar: true },
  Configuracion: { ver: true, crear: true, editar: true, eliminar: true },
};

export const seedRoles: Rol[] = [
  {
    id: 'rol-admin',
    nombre: 'Administrador',
    descripcion: 'Acceso total al sistema, incluyendo configuracion.',
    permisos: permisosCompletos,
  },
  {
    id: 'rol-trafico',
    nombre: 'Jefe de Trafico',
    descripcion: 'Gestiona catalogos, viajes y programa diario.',
    permisos: {
      Catalogos: { ver: true, crear: true, editar: true, eliminar: false },
      Viajes: { ver: true, crear: true, editar: true, eliminar: true },
      Facturacion: { ver: true, crear: false, editar: false, eliminar: false },
      Programa: { ver: true, crear: true, editar: true, eliminar: false },
      Configuracion: { ver: false, crear: false, editar: false, eliminar: false },
    },
  },
  {
    id: 'rol-facturacion',
    nombre: 'Facturacion',
    descripcion: 'Gestiona la facturacion diaria; consulta el resto.',
    permisos: {
      Catalogos: { ver: true, crear: false, editar: false, eliminar: false },
      Viajes: { ver: true, crear: false, editar: false, eliminar: false },
      Facturacion: { ver: true, crear: true, editar: true, eliminar: true },
      Programa: { ver: true, crear: false, editar: false, eliminar: false },
      Configuracion: { ver: false, crear: false, editar: false, eliminar: false },
    },
  },
];

// Usuario y contrasena inicial: admin@brecotransportes.com / breco2026
// Cambiar la contrasena desde Configuracion > Usuarios en cuanto se pueda entrar.
export const seedUsuarios: Usuario[] = [
  {
    id: 'usr-1',
    nombre: 'Administrador General',
    email: 'admin@brecotransportes.com',
    telefono: 'Pendiente',
    password: 'breco2026',
    rolId: 'rol-admin',
    estatus: 'activo',
  },
];
