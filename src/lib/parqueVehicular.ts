import type { Caja, EstadoCarga, Unidad, Viaje } from '../types';
import type { Tone } from '../components/ui/Badge';

export interface FilaParque {
  key: string;
  entidadTipo: 'unidad' | 'remolque';
  id: string;
  codigo: string;
  descripcion: string;
  estatus: string;
  tono: Tone | null;
  activa: boolean;
  rentada: boolean;
  propietario: string;
  clienteId?: string;
  ubicacion: string;
  estadoCarga: EstadoCarga;
  fechaHoraEst: string;
}

function normalizarEstatusViaje(s: string) {
  return s.trim().toLowerCase();
}

function viajeActivo(v: Viaje) {
  const est = normalizarEstatusViaje(v.estatus);
  return est !== 'entregado' && est !== 'cancelado';
}

function viajeActivoDeUnidad(viajes: Viaje[], unidadId: string) {
  return viajes.find((v) => v.unidadId === unidadId && viajeActivo(v));
}

// Los remolques no tienen un "cliente asignado" propio como las unidades --
// se toma del viaje activo que los este usando en ese momento (mismo dato
// que ya muestra Asignacion de Viajes en Remolque1/Dolly/Remolque2).
function viajeActivoDeRemolque(viajes: Viaje[], cajaId: string) {
  return viajes.find(
    (v) => (v.remolque1Id === cajaId || v.dollyId === cajaId || v.remolque2Id === cajaId) && viajeActivo(v),
  );
}

export function construirFilasParque(
  unidades: Unidad[],
  cajas: Caja[],
  viajes: Viaje[],
  colorEstatusUnidad: (nombre: string) => Tone | null,
): FilaParque[] {
  const filasUnidad: FilaParque[] = unidades.map((u) => {
    const viaje = viajeActivoDeUnidad(viajes, u.id);
    return {
      key: `unidad:${u.id}`,
      entidadTipo: 'unidad',
      id: u.id,
      codigo: u.economico,
      descripcion: [u.marca, u.modelo].filter(Boolean).join(' ') || u.descripcion || u.tipo,
      estatus: u.estatus,
      tono: colorEstatusUnidad(u.estatus),
      activa: u.activa,
      rentada: u.rentada,
      propietario: u.propietario,
      clienteId: u.clienteAsignadoId,
      ubicacion: u.ubicacion,
      estadoCarga: u.estadoCarga,
      fechaHoraEst: viaje ? `${viaje.fecha} ${viaje.horaLlegadaEstimada || ''}`.trim() : '',
    };
  });
  const filasRemolque: FilaParque[] = cajas.map((c) => {
    const viaje = viajeActivoDeRemolque(viajes, c.id);
    return {
      key: `remolque:${c.id}`,
      entidadTipo: 'remolque',
      id: c.id,
      codigo: c.economico,
      descripcion: [c.marca, c.modelo].filter(Boolean).join(' ') || c.descripcion || c.tipo,
      estatus: c.estatus,
      tono: null,
      activa: c.activa,
      rentada: c.rentada,
      propietario: c.propietario,
      clienteId: viaje?.clienteId,
      ubicacion: c.ubicacion,
      estadoCarga: c.estadoCarga,
      fechaHoraEst: viaje ? `${viaje.fecha} ${viaje.horaLlegadaEstimada || ''}`.trim() : '',
    };
  });
  return [...filasUnidad, ...filasRemolque].sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));
}

export interface FiltrosParque {
  tipo: 'todas' | 'unidad' | 'remolque';
  propiedad: 'todas' | 'propias' | 'rentadas';
  clienteId: string;
  propietario: string;
  buscarPor: 'codigo' | 'descripcion';
  busqueda: string;
}

export const filtrosVaciosParque: FiltrosParque = {
  tipo: 'todas',
  propiedad: 'todas',
  clienteId: '',
  propietario: '',
  buscarPor: 'codigo',
  busqueda: '',
};

export function filtrarFilasParque(filas: FilaParque[], f: FiltrosParque): FilaParque[] {
  const termino = f.busqueda.trim().toLowerCase();
  return filas.filter((fila) => {
    if (f.tipo !== 'todas' && fila.entidadTipo !== f.tipo) return false;
    if (f.propiedad === 'propias' && fila.rentada) return false;
    if (f.propiedad === 'rentadas' && !fila.rentada) return false;
    if (f.clienteId && fila.clienteId !== f.clienteId) return false;
    if (f.propietario && fila.propietario !== f.propietario) return false;
    if (termino) {
      const campo = f.buscarPor === 'codigo' ? fila.codigo : fila.descripcion;
      if (!campo.toLowerCase().includes(termino)) return false;
    }
    return true;
  });
}
