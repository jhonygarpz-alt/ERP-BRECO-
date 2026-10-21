import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../lib/DataContext';
import { construirFilasParque, filtrarFilasParque, type FiltrosParque } from '../lib/parqueVehicular';
import type { Tone } from '../components/ui/Badge';

export function ImprimirParqueVehicularPage() {
  const [searchParams] = useSearchParams();
  const { unidades, cajas, viajes, clientes, estatusUnidades, ordenesServicio, empresa } = useData();

  const filtros: FiltrosParque = {
    tipo: (searchParams.get('tipo') as FiltrosParque['tipo']) || 'todas',
    propiedad: (searchParams.get('propiedad') as FiltrosParque['propiedad']) || 'todas',
    clienteId: searchParams.get('clienteId') || '',
    propietario: searchParams.get('propietario') || '',
    buscarPor: (searchParams.get('buscarPor') as FiltrosParque['buscarPor']) || 'codigo',
    busqueda: searchParams.get('q') || '',
  };

  const colorEstatusUnidad = (nombre: string): Tone | null =>
    (estatusUnidades.items.find((e) => e.nombre === nombre)?.color as Tone | undefined) ?? null;

  const filas = filtrarFilasParque(
    construirFilasParque(unidades.items, cajas.items, viajes.items, ordenesServicio.items, colorEstatusUnidad),
    filtros,
  );

  function nombreCliente(id?: string) {
    if (!id) return '-';
    return clientes.items.find((c) => c.id === id)?.nombre ?? 'N/D';
  }

  useEffect(() => {
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: 32, fontFamily: 'sans-serif', fontSize: 12 }}>
      <div className="mb-4 flex justify-end gap-2 print:hidden">
        <button onClick={() => window.print()} style={{ border: '1px solid #999', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
          Imprimir
        </button>
        <button onClick={() => window.close()} style={{ border: '1px solid #999', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
          Cerrar
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '2px solid #111', paddingBottom: 12, marginBottom: 16 }}>
        {empresa.value.logoDataUrl && <img src={empresa.value.logoDataUrl} alt="" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />}
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{empresa.value.nombre || 'Sistema de Trafico'}</h1>
          <p style={{ margin: 0, color: '#555' }}>Parque Vehicular -- {filas.length} registro(s)</p>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Codigo', 'Descripcion', 'Tipo', 'Estatus', 'Cliente', 'Propietario', 'Ubicacion', 'Cargado/Vacio'].map((h) => (
              <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid #999', padding: '4px 6px', fontSize: 10, textTransform: 'uppercase', color: '#555' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.key}>
              <td style={{ borderBottom: '1px solid #ddd', padding: '4px 6px', fontWeight: 700 }}>{f.codigo}</td>
              <td style={{ borderBottom: '1px solid #ddd', padding: '4px 6px' }}>{f.descripcion || '-'}</td>
              <td style={{ borderBottom: '1px solid #ddd', padding: '4px 6px' }}>{f.entidadTipo === 'unidad' ? 'Unidad' : 'Remolque'}</td>
              <td style={{ borderBottom: '1px solid #ddd', padding: '4px 6px' }}>
                {f.enMantenimiento ? `En Mantenimiento (${f.ordenServicioFolio})` : f.estatus}
              </td>
              <td style={{ borderBottom: '1px solid #ddd', padding: '4px 6px' }}>{nombreCliente(f.clienteId)}</td>
              <td style={{ borderBottom: '1px solid #ddd', padding: '4px 6px' }}>{f.propietario || '-'}</td>
              <td style={{ borderBottom: '1px solid #ddd', padding: '4px 6px' }}>{f.ubicacion || '-'}</td>
              <td style={{ borderBottom: '1px solid #ddd', padding: '4px 6px' }}>{f.estadoCarga}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
