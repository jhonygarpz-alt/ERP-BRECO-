import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../lib/DataContext';
import { importeALetras } from '../lib/numeroALetras';
import { BarraAcciones, pagina, Recuadro, BloqueEtiquetasApiladas, TituloSeccion } from '../components/print/PrintKit';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function ImprimirGastoViajePage() {
  const { id } = useParams<{ id: string }>();
  const { gastosViaje, viajes, unidades, operadores, proveedores, empresa } = useData();

  const gasto = gastosViaje.items.find((g) => g.id === id);
  const viaje = viajes.items.find((v) => v.id === gasto?.viajeId);
  const unidad = unidades.items.find((u) => u.id === (viaje?.trayectos[0]?.unidadId || viaje?.unidadId));
  const operador = operadores.items.find((o) => o.id === gasto?.operadorId);
  const proveedor = proveedores.items.find((p) => p.id === gasto?.proveedorId);

  const todoCargado = !gastosViaje.loading && !viajes.loading && !unidades.loading && !operadores.loading && !proveedores.loading;

  useEffect(() => {
    if (!gasto || !todoCargado) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [gasto, todoCargado]);

  if (!gasto) {
    return <div style={pagina}>No se encontro el gasto.</div>;
  }

  const importeLetra = importeALetras(gasto.monto, gasto.moneda === 'DOLARES' ? 'USD' : 'MXN');
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
          titulo="Comprobacion de Gastos de Viaje"
          filas={[
            { etiqueta: 'No. Comprobante', valor: gasto.numeroReferencia || gasto.id.slice(-6) },
            { etiqueta: 'Fecha', valor: gasto.fecha },
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
              <strong>Carta Porte:</strong> {viaje?.tipoDocumento === 'CartaPorte' ? viaje.folio : '—'}
            </p>
            <p style={{ margin: '2px 0 0' }}>
              <strong>Ruta:</strong> {viaje?.rutaDescripcion || `${viaje?.origen ?? ''} / ${viaje?.destino ?? ''}`}
            </p>
          </div>
          <div style={{ padding: '5px 8px' }}>
            <p style={{ margin: 0 }}>
              <strong>Unidad:</strong> {unidad?.economico ?? '—'}
            </p>
            <p style={{ margin: '2px 0 0' }}>
              <strong>Placas:</strong> {unidad?.placas ?? '—'}
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 6, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <TituloSeccion>Informacion de Comprobacion de Gastos</TituloSeccion>
        <div style={{ padding: '7px 8px', fontSize: 9.5 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 5 }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 8, textTransform: 'uppercase', color: '#666', fontWeight: 700 }}>Importe Comprobado</span>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{money(gasto.monto)}</p>
            </div>
          </div>
          <p style={{ margin: '3px 0' }}>
            <strong>Importe con Letra:</strong> {importeLetra}
          </p>
          <p style={{ margin: '3px 0' }}>
            <strong>Proveedor:</strong> {proveedor?.nombre ?? gasto.tipo}
          </p>
          <p style={{ margin: '3px 0' }}>
            <strong>Concepto:</strong> {gasto.concepto}
          </p>
          {gasto.tipo === 'Combustible' && (gasto.litros || gasto.precioLitro) && (
            <p style={{ margin: '3px 0' }}>
              <strong>Combustible:</strong> {gasto.combustibleTipo} &middot; {gasto.litros ?? 0} L &middot; {money(gasto.precioLitro ?? 0)}/L
            </p>
          )}
          {gasto.generaPasivo && (
            <p style={{ margin: '3px 0', color: '#b45309' }}>
              <strong>Genera pasivo en Cuentas por Pagar.</strong>
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginTop: 28 }}>
            <div style={{ borderTop: '1px solid #333', textAlign: 'center', paddingTop: 3, fontSize: 9 }}>Autorizo</div>
            <div style={{ borderTop: '1px solid #333', textAlign: 'center', paddingTop: 3, fontSize: 9 }}>{operador?.nombre ?? ''}</div>
          </div>
        </div>
      </div>

      {gasto.notas && (
        <Recuadro style={{ padding: '4px 8px', fontSize: 9 }}>
          <strong>Notas:</strong> {gasto.notas}
        </Recuadro>
      )}
    </div>
  );
}
