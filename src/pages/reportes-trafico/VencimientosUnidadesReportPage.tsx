import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { calcularVencimientosUnidades, rangoVencimientos, type FiltroFechas } from '../../lib/reportesTrafico';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteFiltros } from '../../components/reportes-trafico/ReporteFiltros';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';
import { StatCard } from '../../components/ui/StatCard';

export function VencimientosUnidadesReportPage() {
  const { unidades } = useData();
  const [filtro, setFiltro] = useState<FiltroFechas>(rangoVencimientos());

  const filas = useMemo(() => calcularVencimientosUnidades(unidades.items, filtro), [unidades.items, filtro]);
  const vencidos = filas.filter((f) => f.estatus === 'Vencido').length;
  const porVencer = filas.filter((f) => f.estatus === 'Por vencer').length;
  const vigentes = filas.filter((f) => f.estatus === 'Vigente').length;

  function handleExportarExcel() {
    exportarExcel(
      'vencimientos-de-unidades',
      ['Unidad', 'Documento', 'Fecha de Vencimiento', 'Dias', 'Estatus'],
      filas.map((f) => [f.unidad, f.documento, f.fechaVencimiento, f.dias, f.estatus]),
    );
  }

  function handleImprimir() {
    window.open(`#/trafico/reportes/imprimir/vencimientos-unidades?desde=${filtro.desde}&hasta=${filtro.hasta}`, '_blank');
  }

  return (
    <div>
      <Link to="/trafico/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Trafico
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">17. Vencimientos de Unidades</h1>
        <p className="mt-1 text-sm text-ink-500">
          Documentos, seguro y permiso SCT de cada unidad cuya fecha de vencimiento cae en el rango seleccionado.
        </p>
      </div>

      <ReporteFiltros filtro={filtro} onFiltroChange={setFiltro} onExportarExcel={handleExportarExcel} onImprimir={handleImprimir} />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Vencidos" value={String(vencidos)} icon={AlertTriangle} accent="red" />
        <StatCard label="Por vencer (30 dias)" value={String(porVencer)} icon={Clock} accent="amber" />
        <StatCard label="Vigentes" value={String(vigentes)} icon={CheckCircle2} accent="green" />
      </div>

      <ReporteTabla
        headers={['Unidad', 'Documento', 'Fecha de Vencimiento', 'Dias', 'Estatus']}
        rows={filas.map((f) => [
          f.unidad,
          f.documento,
          f.fechaVencimiento,
          f.dias < 0 ? `Vencio hace ${Math.abs(f.dias)} dias` : `Vence en ${f.dias} dias`,
          f.estatus,
        ])}
      />
    </div>
  );
}
