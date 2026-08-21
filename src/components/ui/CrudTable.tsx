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
}

export function CrudTable<T>({
  columns,
  rows,
  keyFn,
  onEdit,
  onDelete,
  emptyMessage = 'Sin registros todavia.',
}: CrudTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line-800 bg-bg-800">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-left text-sm">
          <thead>
            <tr className="border-b border-line-800 bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
              {columns.map((col) => (
                <th key={col.header} className={`px-4 py-3 font-medium ${col.className ?? ''}`}>
                  {col.header}
                </th>
              ))}
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-ink-600">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr
                key={keyFn(row)}
                className="border-b border-line-800/70 last:border-0 hover:bg-bg-700/40"
              >
                {columns.map((col) => (
                  <td key={col.header} className={`px-4 py-3 text-ink-300 ${col.className ?? ''}`}>
                    {col.render(row)}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <IconButton onClick={() => onEdit(row)} title="Editar">
                      <Pencil size={15} />
                    </IconButton>
                    <IconButton onClick={() => onDelete(row)} title="Eliminar" className="hover:text-breco-500">
                      <Trash2 size={15} />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
