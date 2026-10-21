import { FacturaListaPage } from '../../components/facturacion/FacturaListaPage';

export function FacturacionPorConceptoPage() {
  return (
    <FacturaListaPage
      tipo="Concepto"
      titulo="Facturacion por Concepto"
      subtitulo="Genera una factura agregando conceptos libremente, sin ligarla a un viaje especifico."
    />
  );
}
