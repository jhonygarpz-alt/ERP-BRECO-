import { FacturaListaPage } from '../../components/facturacion/FacturaListaPage';

export function FacturacionPorViajePage() {
  return (
    <FacturaListaPage
      tipo="Viaje"
      titulo="Facturacion por Viaje"
      subtitulo="Selecciona un cliente y factura uno o varios de sus viajes pendientes."
    />
  );
}
