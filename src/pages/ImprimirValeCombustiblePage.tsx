import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../lib/DataContext';
import { importeALetras } from '../lib/numeroALetras';
import { BarraAcciones, pagina, Recuadro, CajaEtiqueta, TituloSeccion } from '../components/print/PrintKit';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function ImprimirValeCombustiblePage() {
  const { id } = useParams<{ id: string }>();
  const { valesCombustible, viajes, unidades, operadores, proveedores, empresa } = useData();

  const vale = valesCombustible.items.find((v) => v.id === id);
  const viaje = viajes.items.find((v) => v.id === vale?.viajeId);
  const unidad = unidades.items.find((u) => u.id === vale?.unidadId);
  const operador = operadores.items.find((o) => o.id === vale?.operadorId);
  const proveedor = proveedores.items.find((p) => p.id === vale?.proveedorId);

  useEffect(() => {
    if (!vale) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [vale]);

  if (!vale) {
    return <div style={pagina}>No se encontro el vale.</div>;
  }

  const importeLetra = importeALetras(vale.monto, vale.moneda === 'DOLARES' ? 'USD' : 'MXN');

  return (
    <div style={pagina}>
      <BarraAcciones />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 16, alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {empresa.value.logoDataUrl && <img src={empresa.value.logoDataUrl} alt="" style={{ height: 56, width: 'auto', objectFit: 'contain' }} />}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Vale de Combustible</h1>
            <p style={{ margin: '4px 0 0', fontWeight: 700 }}>{empresa.value.nombre || 'Empresa'}</p>
            {empresa.value.razonSocial && <p style={{ margin: '1px 0 0', fontSize: 10.5 }}>{empresa.value.razonSocial}</p>}
            <p style={{ margin: '1px 0 0', fontSize: 10.5 }}>RFC: {empresa.value.rfc || '—'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <CajaEtiqueta etiqueta="Folio" valor={vale.folio} />
          <CajaEtiqueta etiqueta="Fecha" valor={vale.fecha} tono="claro" />
        </div>
      </div>

      <div style={{ marginBottom: 14, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <TituloSeccion>Informacion General</TituloSeccion>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 10.5 }}>
          <div style={{ padding: '6px 12px', borderRight: '1px solid #ddd' }}>
            <p style={{ margin: 0 }}>
              <strong>Operador:</strong> {operador?.nombre ?? '—'}
            </p>
            <p style={{ margin: '3px 0 0' }}>
              <strong>Viaje:</strong> {viaje?.folio ?? '—'}
            </p>
            <p style={{ margin: '3px 0 0' }}>
              <strong>Ruta:</strong> {viaje?.rutaDescripcion || (viaje ? `${viaje.origen} / ${viaje.destino}` : '—')}
            </p>
          </div>
          <div style={{ padding: '6px 12px' }}>
            <p style={{ margin: 0 }}>
              <strong>Unidad:</strong> {unidad?.economico ?? '—'}
            </p>
            <p style={{ margin: '3px 0 0' }}>
              <strong>Placas:</strong> {unidad?.placas ?? '—'}
            </p>
            <p style={{ margin: '3px 0 0' }}>
              <strong>Estatus:</strong> {vale.estatus}
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 14, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <TituloSeccion>Autorizacion de Carga de Combustible</TituloSeccion>
        <div style={{ padding: '10px 12px', fontSize: 11 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 9.5, textTransform: 'uppercase', color: '#666', fontWeight: 700 }}>Monto Estimado</span>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{money(vale.monto)}</p>
            </div>
          </div>
          <p style={{ margin: '4px 0' }}>
            <strong>Importe con Letra:</strong> {importeLetra}
          </p>
          <p style={{ margin: '4px 0' }}>
            <strong>Combustible:</strong> {vale.combustibleTipo} &middot; {vale.litrosAutorizados} L
            {vale.precioLitroEstimado ? ` · ${money(vale.precioLitroEstimado)}/L (estimado)` : ''}
          </p>
          <p style={{ margin: '4px 0' }}>
            <strong>Estacion de servicio:</strong> {proveedor?.nombre ?? '—'}
          </p>
          {vale.numeroReferencia && (
            <p style={{ margin: '4px 0' }}>
              <strong>Numero / Referencia:</strong> {vale.numeroReferencia}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 40 }}>
            <div style={{ borderTop: '1px solid #333', textAlign: 'center', paddingTop: 4, fontSize: 10 }}>Autorizo</div>
            <div style={{ borderTop: '1px solid #333', textAlign: 'center', paddingTop: 4, fontSize: 10 }}>{operador?.nombre ?? ''}</div>
          </div>
        </div>
      </div>

      {vale.notas && (
        <Recuadro style={{ padding: '6px 10px', fontSize: 10 }}>
          <strong>Notas:</strong> {vale.notas}
        </Recuadro>
      )}
    </div>
  );
}
