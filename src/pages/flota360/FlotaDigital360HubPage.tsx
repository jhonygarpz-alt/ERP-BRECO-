import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { CONFIG_AUTOTRANSPORTE_SAT } from '../../lib/catalogosSat';
import { familiaUnidad, LABEL_FAMILIA, useSignedUrl, type FamiliaUnidad } from '../../lib/unidad360';
import type { Unidad } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/Badge';

const FAMILIAS: FamiliaUnidad[] = ['tractocamion', 'camion', 'grua', 'ligero', 'otro'];

function descripcionTipo(tipo: string) {
  return CONFIG_AUTOTRANSPORTE_SAT.find((c) => c.clave === tipo)?.descripcion ?? tipo;
}

function TarjetaUnidad({ unidad }: { unidad: Unidad }) {
  const { unidadFotos } = useData();
  const foto = unidadFotos.items.find((f) => f.unidadId === unidad.id && f.categoria === 'frontal' && !f.inspeccionId);
  const url = useSignedUrl(foto?.storagePath);

  return (
    <Link
      to={`/flota-360/${unidad.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line-800 bg-bg-800 transition hover:border-breco-500/50"
    >
      <div className="flex aspect-video items-center justify-center overflow-hidden bg-bg-900">
        {url ? (
          <img src={url} alt={unidad.economico} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <Truck size={36} className="text-ink-700" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[15px] font-semibold text-ink-100">{unidad.economico}</span>
          <StatusBadge status={unidad.estatus} />
        </div>
        <span className="truncate text-xs text-ink-500">
          {unidad.marca} {unidad.modelo} {unidad.anio || ''}
        </span>
        <span className="truncate text-[11px] text-ink-600">{descripcionTipo(unidad.tipo)}</span>
      </div>
    </Link>
  );
}

export function FlotaDigital360HubPage() {
  const { unidades } = useData();
  const [search, setSearch] = useState('');
  const [familia, setFamilia] = useState<FamiliaUnidad | null>(null);

  const conteos = useMemo(() => {
    const acc: Record<FamiliaUnidad, number> = { tractocamion: 0, camion: 0, grua: 0, ligero: 0, otro: 0 };
    for (const u of unidades.items) acc[familiaUnidad(u.tipo)]++;
    return acc;
  }, [unidades.items]);

  const filtradas = useMemo(
    () =>
      unidades.items.filter((u) => {
        if (familia && familiaUnidad(u.tipo) !== familia) return false;
        const texto = `${u.economico} ${u.marca} ${u.modelo} ${u.placas}`.toLowerCase();
        return texto.includes(search.toLowerCase());
      }),
    [unidades.items, search, familia],
  );

  return (
    <div>
      <PageHeader
        title="Flota Digital 360"
        subtitle="El gemelo digital de cada unidad: fotos reales, puntos de informacion, danos e inspecciones."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por economico, marca, modelo o placas..."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => setFamilia(null)}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
            familia === null ? 'border-breco-500 bg-breco-500/10 text-breco-500' : 'border-line-700 text-ink-400 hover:text-ink-100'
          }`}
        >
          Todas ({unidades.items.length})
        </button>
        {FAMILIAS.filter((f) => conteos[f] > 0).map((f) => (
          <button
            key={f}
            onClick={() => setFamilia(f)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              familia === f ? 'border-breco-500 bg-breco-500/10 text-breco-500' : 'border-line-700 text-ink-400 hover:text-ink-100'
            }`}
          >
            {LABEL_FAMILIA[f]} ({conteos[f]})
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <div className="rounded-2xl border border-line-800 bg-bg-800 px-4 py-16 text-center text-sm text-ink-600">
          No hay unidades que coincidan.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtradas.map((u) => (
            <TarjetaUnidad key={u.id} unidad={u} />
          ))}
        </div>
      )}
    </div>
  );
}
