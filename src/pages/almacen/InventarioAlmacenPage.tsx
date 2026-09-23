import { useMemo, useState } from 'react';
import { useData } from '../../lib/DataContext';
import { calcularExistencias } from '../../lib/almacen';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Select } from '../../components/ui/form';
import type { ExistenciaArticulo } from '../../lib/almacen';

export function InventarioAlmacenPage() {
  const { movimientosAlmacen, tiposMovimientoAlmacen, almacenes } = useData();
  const [almacenId, setAlmacenId] = useState('');
  const [search, setSearch] = useState('');

  const existencias = useMemo(
    () => calcularExistencias(movimientosAlmacen.items, tiposMovimientoAlmacen.items),
    [movimientosAlmacen.items, tiposMovimientoAlmacen.items],
  );

  function almacenTexto(id: string) {
    const a = almacenes.items.find((aa) => aa.id === id);
    return a ? `${a.codigo} - ${a.nombre}` : id;
  }

  const filtered = useMemo(() => {
    const termino = search.trim().toLowerCase();
    return existencias
      .filter((e) => !almacenId || e.almacenId === almacenId)
      .filter((e) => !termino || e.codigo.toLowerCase().includes(termino) || e.descripcion.toLowerCase().includes(termino));
  }, [existencias, almacenId, search]);

  const columns: Column<ExistenciaArticulo>[] = [
    { header: 'Almacen', render: (e) => almacenTexto(e.almacenId) },
    { header: 'Codigo', render: (e) => <span className="font-mono text-xs font-semibold text-ink-100">{e.codigo}</span> },
    { header: 'Articulo', render: (e) => e.descripcion },
    { header: 'Unidad Medida', render: (e) => e.unidadMedida },
    {
      header: 'Existencia',
      render: (e) => (
        <span className={`font-semibold ${e.existencia < 0 ? 'text-red-400' : 'text-ink-100'}`}>{e.existencia}</span>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Inventario de Almacen"
        subtitle="Existencia calculada en vivo a partir de los Movimientos de Almacen aplicados."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar articulo..."
        extra={
          <Select value={almacenId} onChange={(e) => setAlmacenId(e.target.value)} className="w-56">
            <option value="">Todos los almacenes</option>
            {almacenes.items.map((a) => (
              <option key={a.id} value={a.id}>
                {a.codigo} - {a.nombre}
              </option>
            ))}
          </Select>
        }
      />

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(e) => `${e.almacenId}::${e.codigo}`}
        onEdit={() => {}}
        onDelete={() => {}}
        canEdit={false}
        canDelete={false}
        emptyMessage="Sin existencias registradas todavia."
      />
    </div>
  );
}
