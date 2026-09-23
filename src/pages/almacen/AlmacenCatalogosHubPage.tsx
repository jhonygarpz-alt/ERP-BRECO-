import { Link } from 'react-router-dom';
import { Warehouse, Package, ArrowLeftRight, type LucideIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';

interface CatalogoTile {
  to: string;
  label: string;
  icon: LucideIcon;
  gradient: [string, string];
}

const catalogos: CatalogoTile[] = [
  { to: '/almacen/catalogos/almacenes', label: 'Catalogo de Almacenes', icon: Warehouse, gradient: ['#60a5fa', '#1d4ed8'] },
  { to: '/almacen/catalogos/articulos', label: 'Catalogo de Articulos', icon: Package, gradient: ['#fb923c', '#c2410c'] },
  { to: '/almacen/catalogos/tipos-movimiento', label: 'Tipos de Mov. de Almacen', icon: ArrowLeftRight, gradient: ['#a3e635', '#4d7c0f'] },
];

export function AlmacenCatalogosHubPage() {
  return (
    <div>
      <PageHeader title="Catalogos de Almacen" subtitle="Catalogos de apoyo para Cotizaciones, Requisiciones, Ordenes de Compra, Compras y Movimientos." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {catalogos.map((tile) => (
          <Link
            key={tile.to}
            to={tile.to}
            className="flex items-center gap-4 rounded-2xl border border-line-800 bg-bg-900 p-4 transition hover:border-breco-500/40 hover:bg-bg-800"
          >
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
              style={{ background: `linear-gradient(150deg, ${tile.gradient[0]}, ${tile.gradient[1]})` }}
            >
              <tile.icon size={22} strokeWidth={2.1} className="text-white drop-shadow-sm" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold text-ink-100">{tile.label}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
