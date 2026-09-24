import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Truck, PackageCheck } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { calcularDisponibilidadEquipo } from '../../lib/reportesTrafico';
import { exportarExcel } from '../../lib/exportarExcel';
import { ReporteTabla } from '../../components/reportes-trafico/ReporteTabla';
import { StatCard } from '../../components/ui/StatCard';
import { GhostButton, PrimaryButton } from '../../components/ui/form';

export function DisponibilidadEquipoReportPage() {
  const { unidades, cajas, estatusUnidades } = useData();

  const filas = useMemo(
    () => calcularDisponibilidadEquipo(unidades.items, cajas.items, estatusUnidades.items),
    [unidades.items, cajas.items, estatusUnidades.items],
  );
  const disponibles = filas.filter((f) => f.disponible).length;
  const ocupados = filas.length - disponibles;

  function handleExportarExcel() {
    exportarExcel(
      'disponibilidad-de-equipo',
      ['Tipo', 'Economico', 'Estatus', 'Disponible'],
      filas.map((f) => [f.tipo, f.economico, f.estatus, f.disponible ? 'Si' : 'No']),
    );
  }

  return (
    <div>
      <Link to="/trafico/reportes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Reportes de Trafico
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink-100">22. Disponibilidad de Equipo</h1>
        <p className="mt-1 text-sm text-ink-500">
          Estatus actual (a este momento) de todas las unidades y remolques activos del catalogo.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <GhostButton type="button" onClick={handleExportarExcel}>
          <Download size={16} /> Exportar Excel
        </GhostButton>
        <PrimaryButton type="button" onClick={() => window.print()}>
          <Printer size={16} /> Imprimir
        </PrimaryButton>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard label="Equipo Disponible" value={String(disponibles)} icon={PackageCheck} accent="green" />
        <StatCard label="Equipo Ocupado / No Disponible" value={String(ocupados)} icon={Truck} accent="amber" />
      </div>

      <ReporteTabla
        headers={['Tipo', 'Economico', 'Estatus', 'Disponible']}
        rows={filas.map((f) => [f.tipo, f.economico, f.estatus, f.disponible ? 'Si' : 'No'])}
      />
    </div>
  );
}
