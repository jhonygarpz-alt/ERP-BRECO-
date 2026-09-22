import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

/*
 * Los campos editables llevan un tinte azul en fondo/borde para que se vea
 * a simple vista cuales hay que llenar; los de solo lectura (datos ya
 * resueltos, como el nombre que trae un picker, o totales calculados)
 * vuelven al gris neutro via las variantes read-only:/disabled: -- no hace
 * falta logica en cada pantalla, el propio elemento HTML ya distingue eso.
 */
export const inputClass =
  'w-full rounded-lg border border-blue-400/30 bg-blue-400/5 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-600 outline-none transition focus:border-breco-500 focus:ring-2 focus:ring-breco-glow read-only:border-line-700 read-only:bg-bg-900 read-only:text-ink-500 disabled:cursor-not-allowed disabled:border-line-800 disabled:bg-bg-800 disabled:text-ink-600';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ''}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} ${props.className ?? ''}`} />;
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-breco-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-breco-glow transition hover:bg-breco-600 disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ''}`}
    />
  );
}

export function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-line-700 bg-bg-800 px-4 py-2 text-sm font-medium text-ink-300 transition hover:border-line-600 hover:text-ink-100 ${props.className ?? ''}`}
    />
  );
}

export function ToolbarButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-blue-400/50 bg-blue-400/5 px-4 py-2 text-sm font-medium text-blue-400 transition hover:border-blue-400 hover:bg-blue-400/10 disabled:cursor-not-allowed disabled:border-line-700 disabled:bg-transparent disabled:text-ink-600 ${props.className ?? ''}`}
    />
  );
}

export function IconButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-lg p-2 text-ink-500 transition hover:bg-bg-700 hover:text-ink-100 ${props.className ?? ''}`}
    />
  );
}
