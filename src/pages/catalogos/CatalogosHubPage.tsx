import { Link } from 'react-router-dom';
import {
  Users,
  Truck,
  PackageSearch,
  IdCard,
  Building2,
  Landmark,
  FileCheck2,
  Route,
  Wrench,
  Tags,
  Boxes,
  Layers,
  Network,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';

interface CatalogoTile {
  to?: string;
  label: string;
  icon: LucideIcon;
  gradient: [string, string];
}

const catalogos: CatalogoTile[] = [
  { to: '/catalogos/clientes', label: 'Clientes', icon: Users, gradient: ['#2dd4bf', '#0d9488'] },
  { to: '/catalogos/destinatarios', label: 'Destinatarios', icon: Building2, gradient: ['#60a5fa', '#1d4ed8'] },
  { to: '/catalogos/operadores', label: 'Operadores', icon: IdCard, gradient: ['#c084fc', '#7e22ce'] },
  { to: '/catalogos/unidades', label: 'Unidades', icon: Truck, gradient: ['#fb7185', '#dc2626'] },
  { to: '/catalogos/remolques', label: 'Remolques', icon: PackageSearch, gradient: ['#fbbf24', '#d97706'] },
  { to: '/catalogos/proveedores', label: 'Proveedores', icon: Wrench, gradient: ['#fb923c', '#c2410c'] },
  { to: '/catalogos/constancia-fiscal', label: 'Constancia de Situacion Fiscal', icon: FileCheck2, gradient: ['#94a3b8', '#334155'] },
  { to: '/catalogos/cuentas-bancarias', label: 'Cuentas Bancarias', icon: Landmark, gradient: ['#4ade80', '#15803d'] },
  { label: 'Estatus de Viaje', icon: Route, gradient: ['#22d3ee', '#0e7490'] },
  { label: 'Estatus de Unidades', icon: Tags, gradient: ['#f472b6', '#be185d'] },
  { label: 'Clasificaciones de Viaje', icon: Layers, gradient: ['#a3e635', '#4d7c0f'] },
  { label: 'Grupos de Unidades', icon: Boxes, gradient: ['#818cf8', '#4338ca'] },
  { label: 'Tipos de Unidades', icon: Truck, gradient: ['#38bdf8', '#0369a1'] },
  { label: 'Clasificaciones de Operador', icon: Network, gradient: ['#f59e0b', '#92400e'] },
];

function Tile({ tile }: { tile: CatalogoTile }) {
  const contenido = (
    <>
      <div
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
        style={{ background: `linear-gradient(150deg, ${tile.gradient[0]}, ${tile.gradient[1]})` }}
      >
        <tile.icon size={22} strokeWidth={2.1} className="text-white drop-shadow-sm" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[15px] font-semibold text-ink-100">{tile.label}</div>
        {!tile.to && <div className="text-xs text-ink-600">Proximamente</div>}
      </div>
    </>
  );

  if (!tile.to) {
    return (
      <div className="flex cursor-not-allowed items-center gap-4 rounded-2xl border border-line-800 bg-bg-900 p-4 opacity-50">
        {contenido}
      </div>
    );
  }

  return (
    <Link
      to={tile.to}
      className="flex items-center gap-4 rounded-2xl border border-line-800 bg-bg-900 p-4 transition hover:border-breco-500/40 hover:bg-bg-800"
    >
      {contenido}
    </Link>
  );
}

export function CatalogosHubPage() {
  return (
    <div>
      <PageHeader title="Catalogos" subtitle="Catalogos maestros usados en toda la operacion de trafico." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {catalogos.map((tile) => (
          <Tile key={tile.label} tile={tile} />
        ))}
      </div>
    </div>
  );
}
