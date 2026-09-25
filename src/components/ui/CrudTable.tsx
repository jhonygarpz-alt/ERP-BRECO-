import type { ReactNode } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { IconButton } from './form';

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface CrudTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyFn: (row: T) => string;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  emptyMessage?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  /** Si se da, cada fila es clickeable y la que coincida con esta clave se resalta. */
  selectedKey?: string | null;
  onRowClick?: (row: T) => void;
}

export function CrudTable<T>({
  columns,
  rows,
  keyFn,
  onEdit,
  onDelete,
  emptyMessage = 'Sin registros todavia.',
  canEdit = true,
  canDelete = true,
  selectedKey,
  onRowClick,
}: CrudTableProps<T>) {
  const showActions = canEdit || canDelete;

  return (
    <div className="overflow-hidden rounded-2xl border border-line-800 bg-bg-800">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-left text-table">
          <thead>
            <tr className="border-b border-line-800 bg-bg-700/50 text-xs font-medium tracking-wide text-ink-500 uppercase">
              {columns.map((col) => (
                <th key={col.header} className={`px-4 py-3 font-medium ${col.className ?? ''}`}>
                  {col.header}
                </th>
              ))}
              {showActions && <th className="px-4 py-3 font-medium text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + (showActions ? 1 : 0)} className="px-4 py-10 text-center text-ink-600">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr
                key={keyFn(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-line-800/70 last:border-0 hover:bg-bg-700/40 ${onRowClick ? 'cursor-pointer' : ''} ${
                  selectedKey && selectedKey === keyFn(row) ? 'bg-breco-500/10' : ''
                }`}
              >
                {columns.map((col) => (
                  <td key={col.header} className={`px-4 py-3 text-ink-300 ${col.className ?? ''}`}>
                    {col.render(row)}
                  </td>
                ))}
                {showActions && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      {canEdit && (
                        <IconButton onClick={() => onEdit(row)} title="Editar">
                          <Pencil size={15} />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton onClick={() => onDelete(row)} title="Eliminar" className="hover:text-breco-500">
                          <Trash2 size={15} />
                        </IconButton>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
