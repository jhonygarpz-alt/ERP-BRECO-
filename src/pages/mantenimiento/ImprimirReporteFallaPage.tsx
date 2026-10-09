import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../lib/DataContext';
import { BarraAcciones, pagina, Recuadro, BloqueEtiquetasApiladas } from '../../components/print/PrintKit';

export function ImprimirReporteFallaPage() {
  const { id } = useParams<{ id: string }>();
  const { reportesFalla, unidades, operadores, clasificacionesServicio, empresa } = useData();

  const reporte = reportesFalla.items.find((r) => r.id === id);
  const unidad = unidades.items.find((u) => u.id === reporte?.unidadId);
  const operador = operadores.items.find((o) => o.id === reporte?.operadorId);
  const clasificacion = clasificacionesServicio.items.find((c) => c.id === reporte?.clasificacionServicioId);

  const todoCargado = !reportesFalla.loading && !unidades.loading && !operadores.loading && !clasificacionesServicio.loading;

  useEffect(() => {
    if (!reporte || !todoCargado) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [reporte, todoCargado]);

  if (!reporte) {
    return <div style={pagina}>No se encontro el reporte de falla.</div>;
  }

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
          titulo="Reporte de Falla"
          filas={[
            { etiqueta: 'Folio', valor: reporte.folio },
            { etiqueta: 'Fecha', valor: reporte.fecha },
            { etiqueta: 'Estatus', valor: reporte.estatus },
            ...(reporte.codigoFalla ? [{ etiqueta: 'Codigo', valor: reporte.codigoFalla }] : []),
          ]}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
        <Recuadro style={{ padding: '5px 8px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Unidad</p>
          <p style={{ margin: '2px 0 0' }}>{unidad ? `${unidad.economico} - ${unidad.placas}` : '—'}</p>
          <p style={{ margin: '1px 0 0', color: '#555' }}>Sucursal: {reporte.sucursal || '—'}</p>
        </Recuadro>
        <Recuadro style={{ padding: '5px 8px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Operador</p>
          <p style={{ margin: '2px 0 0' }}>{operador?.nombre ?? '—'}</p>
          <p style={{ margin: '1px 0 0', color: '#555' }}>Clasificacion: {clasificacion?.clasificacion ?? '—'}</p>
        </Recuadro>
      </div>

      <Recuadro style={{ padding: '5px 8px', marginBottom: 6 }}>
        <p style={{ margin: 0, fontWeight: 700 }}>Descripcion de la Falla</p>
        <p style={{ margin: '2px 0 0', whiteSpace: 'pre-wrap' }}>{reporte.descripcion}</p>
      </Recuadro>

      {reporte.documentos.length > 0 && (
        <Recuadro style={{ padding: '5px 8px' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Documentos Digitalizados</p>
          <ul style={{ margin: '2px 0 0', paddingLeft: 16 }}>
            {reporte.documentos.map((d) => (
              <li key={d.id}>{d.descripcion}</li>
            ))}
          </ul>
        </Recuadro>
      )}
    </div>
  );
}
