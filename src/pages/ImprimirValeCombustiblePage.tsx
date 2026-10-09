import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../lib/DataContext';
import { importeALetras } from '../lib/numeroALetras';
import { BarraAcciones, pagina, Recuadro, BloqueEtiquetasApiladas, TituloSeccion } from '../components/print/PrintKit';

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

  const todoCargado = !valesCombustible.loading && !viajes.loading && !unidades.loading && !operadores.loading && !proveedores.loading;

  useEffect(() => {
    if (!vale || !todoCargado) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [vale, todoCargado]);

  if (!vale) {
    return <div style={pagina}>No se encontro el vale.</div>;
  }

  const importeLetra = importeALetras(vale.monto, vale.moneda === 'DOLARES' ? 'USD' : 'MXN');
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
          titulo="Vale de Combustible"
          filas={[
            { etiqueta: 'Folio', valor: vale.folio },
            { etiqueta: 'Fecha', valor: vale.fecha },
          ]}
        />
      </div>

      <div style={{ marginBottom: 6, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <TituloSeccion>Informacion General</TituloSeccion>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 9 }}>
          <div style={{ padding: '5px 8px', borderRight: '1px solid #ddd' }}>
            <p style={{ margin: 0 }}>
              <strong>Operador:</strong> {operador?.nombre ?? '—'}
            </p>
            <p style={{ margin: '2px 0 0' }}>
              <strong>Viaje:</strong> {viaje?.folio ?? '—'}
            </p>
            <p style={{ margin: '2px 0 0' }}>
              <strong>Ruta:</strong> {viaje?.rutaDescripcion || (viaje ? `${viaje.origen} / ${viaje.destino}` : '—')}
            </p>
          </div>
          <div style={{ padding: '5px 8px' }}>
            <p style={{ margin: 0 }}>
              <strong>Unidad:</strong> {unidad?.economico ?? '—'}
            </p>
            <p style={{ margin: '2px 0 0' }}>
              <strong>Placas:</strong> {unidad?.placas ?? '—'}
            </p>
            <p style={{ margin: '2px 0 0' }}>
              <strong>Estatus:</strong> {vale.estatus}
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 6, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <TituloSeccion>Autorizacion de Carga de Combustible</TituloSeccion>
        <div style={{ padding: '7px 8px', fontSize: 9.5 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 5 }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 8, textTransform: 'uppercase', color: '#666', fontWeight: 700 }}>Monto Estimado</span>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{money(vale.monto)}</p>
            </div>
          </div>
          <p style={{ margin: '3px 0' }}>
            <strong>Importe con Letra:</strong> {importeLetra}
          </p>
          <p style={{ margin: '3px 0' }}>
            <strong>Combustible:</strong> {vale.combustibleTipo} &middot; {vale.litrosAutorizados} L
            {vale.precioLitroEstimado ? ` · ${money(vale.precioLitroEstimado)}/L (estimado)` : ''}
          </p>
          <p style={{ margin: '3px 0' }}>
            <strong>Estacion de servicio:</strong> {proveedor?.nombre ?? '—'}
          </p>
          {vale.numeroReferencia && (
            <p style={{ margin: '3px 0' }}>
              <strong>Numero / Referencia:</strong> {vale.numeroReferencia}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginTop: 28 }}>
            <div style={{ borderTop: '1px solid #333', textAlign: 'center', paddingTop: 3, fontSize: 9 }}>Autorizo</div>
            <div style={{ borderTop: '1px solid #333', textAlign: 'center', paddingTop: 3, fontSize: 9 }}>{operador?.nombre ?? ''}</div>
          </div>
        </div>
      </div>

      {vale.notas && (
        <Recuadro style={{ padding: '4px 8px', fontSize: 9 }}>
          <strong>Notas:</strong> {vale.notas}
        </Recuadro>
      )}
    </div>
  );
}
