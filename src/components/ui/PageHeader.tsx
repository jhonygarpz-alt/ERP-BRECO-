import type { ReactNode } from 'react';
import { Plus, Search } from 'lucide-react';
import { PrimaryButton, inputClass } from './form';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  addLabel?: string;
  onAdd?: () => void;
  extra?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  addLabel,
  onAdd,
  extra,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-ink-100">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onSearchChange && (
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-600" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className={`${inputClass} w-56 pl-9`}
            />
          </div>
        )}
        {extra}
        {onAdd && (
          <PrimaryButton onClick={onAdd}>
            <Plus size={16} />
            {addLabel ?? 'Nuevo'}
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}
