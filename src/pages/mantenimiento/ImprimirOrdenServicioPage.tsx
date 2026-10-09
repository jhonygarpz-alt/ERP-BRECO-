import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../lib/DataContext';
import { tiempoRealHoras, totalManoObra } from '../../lib/mantenimiento';
import {
  BarraAcciones,
  pagina,
  Recuadro,
  BloqueEtiquetasApiladas,
  TituloSeccion,
  tablaStyle,
  thCfdi,
  tdCfdi,
  CajaTotales,
} from '../../components/print/PrintKit';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function ImprimirOrdenServicioPage() {
  const { id } = useParams<{ id: string }>();
  const { ordenesServicio, unidades, proveedores, mecanicos, reportesFalla, empresa } = useData();

  const orden = ordenesServicio.items.find((o) => o.id === id);
  const unidad = unidades.items.find((u) => u.id === orden?.unidadId);
  const proveedor = proveedores.items.find((p) => p.id === orden?.proveedorId);
  const quienRealiza = mecanicos.items.find((m) => m.id === orden?.quienRealizaId);

  const todoCargado = !ordenesServicio.loading && !unidades.loading && !proveedores.loading && !mecanicos.loading && !reportesFalla.loading;

  useEffect(() => {
    if (!orden || !todoCargado) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [orden, todoCargado]);

  if (!orden) {
    return <div style={pagina}>No se encontro la orden de servicio.</div>;
  }

  const mecanicosAsignados = orden.mecanicosIds
    .map((mid) => mecanicos.items.find((m) => m.id === mid)?.nombre)
    .filter(Boolean)
    .join(', ');

  const reportesRelacionados = orden.reporteFallaIds
    .map((rid) => reportesFalla.items.find((r) => r.id === rid)?.folio)
    .filter(Boolean)
    .join(', ');

  const paginaCompacta = { ...pagina, padding: 16, fontSize: 9.5 };

  return (
    <div style={paginaCompacta}>
      <BarraAcciones />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 230px', gap: 10, alignItems: 'stretch', marginBottom: 6 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {empresa.value.logoDataUrl && <img src={empresa.value.logoDataUrl} alt="" style={{ height: 46, width: 'auto', objectFit: 'contain' }} />}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ fontSize: 12.5, fontWeight: 700, margin: 0 }}>{empresa.value.razonSocial || empresa.value.nombre || 'Empresa'}</h1>
            <p style={{ margin: '2px 0 0', fontSize: 9 }}>RFC: {empresa.value.rfc || '—'}</p>
            <p style={{ margin: '2px 0 0', fontSize: 8.5, color: '#444' }}>{empresa.value.direccion || ''}</p>
          </div>
        </div>
        <BloqueEtiquetasApiladas
          columnas={2}
          titulo="Orden de Servicio"
          filas={[
            { etiqueta: 'Folio', valor: orden.folio },
            { etiqueta: 'Fecha', valor: orden.fecha },
            { etiqueta: 'Estatus', valor: orden.estatus },
          ]}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 6 }}>
        <Recuadro style={{ padding: '5px 8px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Unidad</p>
          <p style={{ margin: '2px 0 0' }}>{unidad ? `${unidad.economico} - ${unidad.placas}` : '—'}</p>
          <p style={{ margin: '1px 0 0', color: '#555' }}>Km: {orden.kilometrajeAlMomento.toLocaleString('es-MX')}</p>
        </Recuadro>
        <Recuadro style={{ padding: '5px 8px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Tipo</p>
          <p style={{ margin: '2px 0 0' }}>
            {orden.tipo} · {orden.tipoServicio}
          </p>
          {orden.tipo === 'Externo' && <p style={{ margin: '1px 0 0', color: '#555' }}>Proveedor: {proveedor?.nombre ?? '—'}</p>}
        </Recuadro>
        <Recuadro style={{ padding: '5px 8px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Lugar / Responsable</p>
          <p style={{ margin: '2px 0 0' }}>{orden.lugarReparacion || '—'}</p>
          <p style={{ margin: '1px 0 0', color: '#555' }}>{quienRealiza?.nombre ?? '—'}</p>
        </Recuadro>
      </div>

      <div style={{ marginBottom: 6, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <TituloSeccion>Servicios de la Orden</TituloSeccion>
        <table style={tablaStyle}>
          <thead>
            <tr>
              <th style={thCfdi}>Codigo</th>
              <th style={thCfdi}>Descripcion</th>
              <th style={{ ...thCfdi, textAlign: 'right' }}>Mano de Obra</th>
              <th style={thCfdi}>Inicio</th>
              <th style={thCfdi}>Final</th>
              <th style={thCfdi}>Tiempo Real</th>
            </tr>
          </thead>
          <tbody>
            {orden.lineas.length === 0 && (
              <tr>
                <td style={tdCfdi} colSpan={6}>
                  Sin servicios registrados.
                </td>
              </tr>
            )}
            {orden.lineas.map((l) => (
              <tr key={l.id}>
                <td style={tdCfdi}>{l.codigo || '-'}</td>
                <td style={tdCfdi}>{l.descripcion}</td>
                <td style={{ ...tdCfdi, textAlign: 'right' }}>{money(l.manoObra)}</td>
                <td style={tdCfdi}>
                  {l.fechaInicio} {l.horaInicio}
                </td>
                <td style={tdCfdi}>
                  {l.fechaFinal} {l.horaFinal}
                </td>
                <td style={tdCfdi}>{tiempoRealHoras(l)} hrs</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
        <CajaTotales filas={[{ etiqueta: 'Total mano de obra', valor: money(totalManoObra(orden.lineas)), destacado: true }]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
        <Recuadro style={{ padding: '5px 8px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Mecanicos / Ayudantes</p>
          <p style={{ margin: '2px 0 0' }}>{mecanicosAsignados || '—'}</p>
        </Recuadro>
        <Recuadro style={{ padding: '5px 8px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Reportes de Falla Relacionados</p>
          <p style={{ margin: '2px 0 0' }}>{reportesRelacionados || '—'}</p>
        </Recuadro>
      </div>

      {orden.notas && (
        <Recuadro style={{ padding: '4px 8px', marginBottom: 6, fontSize: 9 }}>
          <strong>Nota:</strong> {orden.notas}
        </Recuadro>
      )}

      {orden.observaciones && (
        <Recuadro style={{ padding: '4px 8px', marginBottom: 6, fontSize: 9 }}>
          <strong>Observaciones:</strong> {orden.observaciones}
        </Recuadro>
      )}

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
        <div style={{ borderTop: '1px solid #333', paddingTop: 3, textAlign: 'center', fontSize: 9 }}>Firma de Quien Realiza</div>
        <div style={{ borderTop: '1px solid #333', paddingTop: 3, textAlign: 'center', fontSize: 9 }}>Firma de Autorizacion</div>
      </div>
    </div>
  );
}
