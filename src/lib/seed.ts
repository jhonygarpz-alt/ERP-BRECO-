import type { Caja, Cliente, Empresa, EstatusViaje, Factura, Operador, Rol, Unidad, Usuario, Viaje } from '../types';
import { uid } from './storage';

function cliente(id: string, nombre: string): Cliente {
  return {
    id,
    nombre,
    rfc: 'Pendiente',
    contacto: 'Pendiente',
    telefono: 'Pendiente',
    email: 'Pendiente',
    direccion: 'Pendiente',
    estatus: 'activo',
  };
}

// Clientes reales de BRECO Transportes (historial de viajes proporcionado).
export const seedClientes: Cliente[] = [
  cliente('cli-werner', 'Werner Enterprises'),
  cliente('cli-totalone', 'Total One Logistics'),
  cliente('cli-silverto', 'Silveroute'),
  cliente('cli-redwood', 'Redwood Multimodal'),
  cliente('cli-mj', 'M&J Carriers'),
  cliente('cli-preferred-popcorn', 'Preferred Popcorn de Mexico'),
  cliente('cli-breco-logistics', 'Breco Logistics LLC'),
  cliente('cli-europartners', 'Europartners Mexico'),
  cliente('cli-deacero', 'Deacero'),
  cliente('cli-carolina-logistics', 'Carolina Logistics LLC'),
  cliente('cli-hr-motor', 'HR Motor Express LLC'),
  cliente('cli-kimberly-clark', 'Kimberly-Clark de Mexico'),
  cliente('cli-govama', 'Govama'),
  cliente('cli-fdi-mexico', 'FDI Mexico'),
  cliente('cli-expedited', 'Expedited LLC'),
  cliente('cli-mexicom', 'Servicios de Transportacion Mexicom'),
  cliente('cli-bison', 'Bison Transport Inc'),
  cliente('cli-pam-transport', 'PAM Transport Inc'),
  cliente('cli-tigr', 'Transporte Internacional General Regional'),
  cliente('cli-chinova', 'Chinova Trade'),
  cliente('cli-set-freight', 'Set Freight International LLC'),
  cliente('cli-midland', 'Midland International Logistics LLC'),
  cliente('cli-nuvocargo', 'Nuvocargo'),
  cliente('cli-nowports', 'Nowports Mexico'),
  cliente('cli-delmar', 'Delmar Logistica'),
];

export const seedOperadores: Operador[] = [
  { id: 'op-orlando-dorbecker', nombre: 'Orlando Dorbecker', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'En viaje' },
  { id: 'op-rodrigo-espana', nombre: 'Rodrigo España', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'En viaje' },
  { id: 'op-gari-lineker', nombre: 'Gari Lineker Davila', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'En viaje' },
  { id: 'op-edgar-gomez', nombre: 'Edgar Gomez', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'En viaje' },
  { id: 'op-marcos-tinoco', nombre: 'Marcos O Tinoco', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'En viaje' },
  { id: 'op-krytian-robles', nombre: 'Krytian Robles', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'En viaje' },
  { id: 'op-edgar-cruz', nombre: 'Edgar Cruz', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'En viaje' },
  { id: 'op-ruben-velazquez', nombre: 'Ruben Velazquez', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'En viaje' },
  { id: 'op-geovany-romero', nombre: 'Geovany Romero', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'En viaje' },
  { id: 'op-francisco-gonzalez', nombre: 'Francisco Gonzalez', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'En viaje' },
  { id: 'op-francisco-maya', nombre: 'Francisco Maya', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'En viaje' },
  { id: 'op-juan-carlos-garcia', nombre: 'Juan Carlos Garcia', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'En viaje' },
  { id: 'op-humberto-colin', nombre: 'Humberto Colin', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'En viaje' },
  { id: 'op-fernando-garcia', nombre: 'Fernando Garcia', licencia: 'Pendiente', tipoLicencia: 'Pendiente', telefono: 'Pendiente', vigenciaLicencia: '', estatus: 'En viaje' },
];

function unidad(
  economico: string,
  operadorAsignadoId: string | undefined,
  clienteAsignadoId: string | undefined,
  datos: { placas?: string; marca?: string; modelo?: string; anio?: number } = {},
): Unidad {
  return {
    id: `uni-${economico.toLowerCase()}`,
    economico,
    placas: datos.placas ?? '',
    tipo: 'Tractocamion',
    marca: datos.marca ?? '',
    modelo: datos.modelo ?? '',
    anio: datos.anio ?? 0,
    estatus: clienteAsignadoId ? 'En viaje' : 'Disponible',
    operadorAsignadoId,
    clienteAsignadoId,
  };
}

// Flota real de BRECO Transportes: 13 tractocamiones propios (T01-T13) segun
// tarjeton vehicular, mas 2 unidades de refuerzo operadas por FLEDD.
export const seedUnidades: Unidad[] = [
  unidad('T01', 'op-orlando-dorbecker', 'cli-werner', { placas: '70BF4M', marca: 'Freightliner', modelo: 'Cascadia', anio: 2025 }),
  unidad('T02', 'op-rodrigo-espana', 'cli-totalone', { placas: '71BF4M', marca: 'Freightliner', modelo: 'Cascadia', anio: 2025 }),
  unidad('T03', 'op-gari-lineker', 'cli-werner', { placas: '69BK5M', marca: 'Freightliner', modelo: 'Cascadia', anio: 2025 }),
  unidad('T04', 'op-edgar-gomez', 'cli-werner', { placas: '65BK5M', marca: 'Freightliner', modelo: 'Cascadia', anio: 2025 }),
  unidad('T05', 'op-marcos-tinoco', 'cli-silverto', { placas: '72BF4M', marca: 'Freightliner', modelo: 'Cascadia', anio: 2025 }),
  unidad('T06', 'op-krytian-robles', 'cli-redwood', { placas: '21BM1W', marca: 'Freightliner', modelo: 'Cascadia', anio: 2026 }),
  unidad('T07', 'op-edgar-cruz', 'cli-redwood', { placas: '66BK5M', marca: 'Freightliner', modelo: 'Cascadia', anio: 2026 }),
  unidad('T08', 'op-ruben-velazquez', 'cli-totalone', { placas: '68BK5M', marca: 'Freightliner', modelo: 'Cascadia', anio: 2025 }),
  {
    ...unidad('T09', undefined, undefined, { placas: '62BK5M', marca: 'Freightliner', modelo: 'Cascadia', anio: 2026 }),
    estatus: 'Fuera de servicio',
  },
  unidad('T10', 'op-geovany-romero', 'cli-redwood', { placas: '61BK5M', marca: 'Freightliner', modelo: 'Cascadia', anio: 2025 }),
  unidad('T11', 'op-francisco-gonzalez', 'cli-mj', { placas: '64BK5M', marca: 'Freightliner', modelo: 'Cascadia', anio: 2025 }),
  unidad('T12', 'op-francisco-maya', 'cli-totalone', { placas: '63BK5M', marca: 'Freightliner', modelo: 'Cascadia', anio: 2026 }),
  unidad('T13', 'op-juan-carlos-garcia', 'cli-werner', { placas: '67BK5M', marca: 'Freightliner', modelo: 'Cascadia', anio: 2026 }),
  unidad('FLEDD-1', 'op-humberto-colin', 'cli-totalone'),
  unidad('FLEDD-2', 'op-fernando-garcia', undefined),
];

function caja(economico: string, placas: string, marca: string, modelo: string, anio: number, estatus: Caja['estatus'] = 'Disponible'): Caja {
  return {
    id: `caj-${economico.toLowerCase()}`,
    economico,
    placas,
    tipo: 'Seca',
    capacidad: '',
    estatus,
    marca,
    modelo,
    anio,
  };
}

// Remolques propios de BRECO Transportes (excluye cajas de clientes/otros
// transportistas, que se registran solo como texto libre en cada viaje).
export const seedCajas: Caja[] = [
  caja('45461', 'AZ4522', 'Utility', 'Caja seca', 2015),
  caja('45480', 'AZ4523', 'Utility', 'Caja seca', 2015),
  caja('45530', 'AZ4524', 'Utility', 'Caja seca', 2015, 'En uso'),
  caja('45538', 'AZ4525', 'Utility', 'Caja seca', 2015),
  caja('45548', 'AZ4526', 'Utility', 'Caja seca', 2015, 'En uso'),
  caja('46141', 'AZ4527', 'Utility', 'Caja seca', 2015),
  caja('50061', 'AZ4528', 'Utility', 'Caja seca', 2015),
  caja('50063', 'AZ4529', 'Utility', 'Caja seca', 2015),
  caja('50064', 'AZ4530', 'Utility', 'Caja seca', 2015),
  caja('50065', 'AZ4531', 'Utility', 'Caja seca', 2015),
  caja('50066', 'AZ4532', 'Utility', 'Caja seca', 2015),
  caja('50067', 'AZ4533', 'Utility', 'Caja seca', 2015),
  caja('50068', 'AZ4534', 'Utility', 'Caja seca', 2015),
  caja('50069', 'AZ4536', 'Utility', 'Caja seca', 2015, 'En uso'),
  caja('50070', 'AZ4538', 'Utility', 'Caja seca', 2015),
  caja('50071', 'AZ4540', 'Utility', 'Caja seca', 2015),
  caja('50072', 'AZ4539', 'Utility', 'Caja seca', 2015),
  caja('50073', 'AZ4537', 'Utility', 'Caja seca', 2015),
  caja('50094', 'AZ4535', 'Utility', 'Caja seca', 2015),
  caja('50095', '251183D', 'Wabash', 'Caja seca', 2013),
  caja('50096', '76UR5A', 'Utility', 'Caja seca', 2015),
  caja('53701', 'BQ5663', 'Wabash', 'Caja seca', 2005),
  caja('54932', 'K5351K', 'Wabash', 'Charger', 2012),
  caja('3903', '2254246', 'Wabash', 'MVT', 2006),
  caja('P5150180', '8342LG', 'Grandane', 'Caja seca', 2014),
  caja('KZF53918', 'A11261A', 'Wabash', 'Caja seca', 1999),
];

const hoy = new Date().toISOString().slice(0, 10);

function viaje(v: {
  folio: string;
  unidadId: string;
  operadorId: string;
  clienteId: string;
  materiales: string;
  origen: string;
  destino: string;
  cajaNombre: string;
  cajaEconomico: string;
  importacion?: boolean;
  exportacion?: boolean;
  cita?: string;
  estatus: EstatusViaje;
  observaciones: string;
}): Viaje {
  return {
    id: uid('via'),
    fecha: hoy,
    horaSalida: '',
    horaLlegadaEstimada: '',
    importacion: false,
    exportacion: false,
    cita: '',
    ...v,
  };
}

// Programa de trafico del dia: viaje activo de cada unidad en operacion.
export const seedViajes: Viaje[] = [
  viaje({
    folio: 'V-0001',
    unidadId: 'uni-t01',
    operadorId: 'op-orlando-dorbecker',
    clienteId: 'cli-werner',
    materiales: 'Autopartes',
    origen: 'PSJR',
    destino: 'NLD',
    cajaNombre: 'WERNER',
    cajaEconomico: '7272',
    importacion: true,
    estatus: 'En transito',
    observaciones: 'Unidad en transito a NLD, patio EGOBA.',
  }),
  viaje({
    folio: 'V-0002',
    unidadId: 'uni-t02',
    operadorId: 'op-rodrigo-espana',
    clienteId: 'cli-totalone',
    materiales: 'Vacio',
    origen: 'PSJR',
    destino: 'Morelia',
    cajaNombre: 'BRECO',
    cajaEconomico: '45530',
    importacion: true,
    estatus: 'En transito',
    observaciones: 'Unidad en transito a cargar en La Fama.',
  }),
  viaje({
    folio: 'V-0003',
    unidadId: 'uni-t03',
    operadorId: 'op-gari-lineker',
    clienteId: 'cli-werner',
    materiales: 'Autopartes',
    origen: 'PSJR',
    destino: 'NLD',
    cajaNombre: 'WERNER',
    cajaEconomico: '372127',
    estatus: 'En transito',
    observaciones: 'Unidad en transito a patio NLD, EGOBA.',
  }),
  viaje({
    folio: 'V-0004',
    unidadId: 'uni-t04',
    operadorId: 'op-edgar-gomez',
    clienteId: 'cli-werner',
    materiales: 'Autopartes',
    origen: 'PSJR',
    destino: 'NLD',
    cajaNombre: 'WERNER',
    cajaEconomico: '4452',
    estatus: 'En transito',
    observaciones: 'Unidad en transito a NLD, EGOBA.',
  }),
  viaje({
    folio: 'V-0005',
    unidadId: 'uni-t05',
    operadorId: 'op-marcos-tinoco',
    clienteId: 'cli-silverto',
    materiales: 'Paqueteria',
    origen: 'SJR',
    destino: 'Cuautitlan',
    cajaNombre: 'BRECO',
    cajaEconomico: '45548',
    importacion: true,
    estatus: 'Programado',
    observaciones: 'Unidad en Cuautitlan con cliente, en espera de descarga.',
  }),
  viaje({
    folio: 'V-0006',
    unidadId: 'uni-t06',
    operadorId: 'op-krytian-robles',
    clienteId: 'cli-redwood',
    materiales: 'PVC',
    origen: 'Galeana, NL',
    destino: 'NLD',
    cajaNombre: 'PAM',
    cajaEconomico: '240392',
    exportacion: true,
    estatus: 'En transito',
    observaciones: 'Unidad en transito a Atlacomulco // expo manana en MAN Humener.',
  }),
  viaje({
    folio: 'V-0007',
    unidadId: 'uni-t07',
    operadorId: 'op-edgar-cruz',
    clienteId: 'cli-redwood',
    materiales: 'Vacio',
    origen: 'Toluca',
    destino: 'Toluca',
    cajaNombre: 'PAM',
    cajaEconomico: '251087',
    exportacion: true,
    estatus: 'Programado',
    observaciones: 'Unidad en carga manana en BAN GLAS, Lerma.',
  }),
  viaje({
    folio: 'V-0008',
    unidadId: 'uni-t08',
    operadorId: 'op-ruben-velazquez',
    clienteId: 'cli-totalone',
    materiales: 'Vacio',
    origen: 'PSJR',
    destino: 'Morelia',
    cajaNombre: 'BRECO',
    cajaEconomico: '214036',
    estatus: 'En transito',
    observaciones: 'Unidad en transito a cargar en La Fama.',
  }),
  viaje({
    folio: 'V-0009',
    unidadId: 'uni-t10',
    operadorId: 'op-geovany-romero',
    clienteId: 'cli-redwood',
    materiales: 'PVC',
    origen: 'Atlacomulco',
    destino: 'Atlacomulco',
    cajaNombre: 'MJ',
    cajaEconomico: '210829',
    importacion: true,
    cita: '11:00',
    estatus: 'Programado',
    observaciones: 'Unidad en espera de descarga en Baxter Atlacomulco // carga manana.',
  }),
  viaje({
    folio: 'V-0010',
    unidadId: 'uni-t11',
    operadorId: 'op-francisco-gonzalez',
    clienteId: 'cli-mj',
    materiales: 'Vacio',
    origen: 'PSJR',
    destino: 'Queretaro',
    cajaNombre: 'MJ',
    cajaEconomico: '211330',
    exportacion: true,
    estatus: 'Programado',
    observaciones: 'Unidad con cliente, en espera de carga.',
  }),
  viaje({
    folio: 'V-0011',
    unidadId: 'uni-t12',
    operadorId: 'op-francisco-maya',
    clienteId: 'cli-totalone',
    materiales: 'Vacio',
    origen: 'San Juan de los Lagos, Jal.',
    destino: 'NLD',
    cajaNombre: 'BRECO',
    cajaEconomico: '50069',
    exportacion: true,
    estatus: 'En transito',
    observaciones: 'Unidad en transito a NLD.',
  }),
  viaje({
    folio: 'V-0012',
    unidadId: 'uni-t13',
    operadorId: 'op-juan-carlos-garcia',
    clienteId: 'cli-werner',
    materiales: 'Autopartes',
    origen: 'Monterrey, NL',
    destino: 'NLD',
    cajaNombre: 'WERNER',
    cajaEconomico: '387882',
    importacion: true,
    estatus: 'Programado',
    observaciones: 'Unidad en Irapuato, a cargar.',
  }),
  viaje({
    folio: 'V-0013',
    unidadId: 'uni-fledd-1',
    operadorId: 'op-humberto-colin',
    clienteId: 'cli-totalone',
    materiales: 'Grasa vegetal',
    origen: 'San Roberto',
    destino: 'NLD',
    cajaNombre: 'FLEDD',
    cajaEconomico: 'CF-01',
    estatus: 'Programado',
    observaciones: 'Unidad en NLD.',
  }),
  viaje({
    folio: 'V-0014',
    unidadId: 'uni-fledd-2',
    operadorId: 'op-fernando-garcia',
    clienteId: 'cli-werner',
    materiales: 'Vacio',
    origen: 'Monterrey, NL',
    destino: 'Queretaro',
    cajaNombre: 'FLEDD',
    cajaEconomico: '373913',
    estatus: 'En transito',
    observaciones: 'Unidad en transito a cargar en Brosen, QRO.',
  }),
];

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
