import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useCampoResaltado, estaLleno } from '../../lib/CampoResaltadoContext';

/*
 * Los campos editables llevan un tinte azul en fondo/borde para que se vea
 * a simple vista cuales hay que llenar; los de solo lectura (datos ya
 * resueltos, como el nombre que trae un picker, o totales calculados)
 * vuelven al gris neutro via las variantes read-only:/disabled: -- no hace
 * falta logica en cada pantalla, el propio elemento HTML ya distingue eso.
 *
 * Dentro de un CampoResaltadoProvider (Viaje/Carta Porte), un campo con
 * contenido cambia el tinte de azul a verde, para ver de un vistazo que
 * falta por llenar en un formulario largo.
 */
const baseInputClass =
  'w-full rounded-lg border px-3 py-2 text-table text-ink-100 placeholder:text-ink-600 outline-none transition focus:border-breco-500 focus:ring-2 focus:ring-breco-glow read-only:border-line-700 read-only:bg-bg-900 read-only:text-ink-500 disabled:cursor-not-allowed disabled:border-line-800 disabled:bg-bg-800 disabled:text-ink-600';
const vacioClass = 'border-blue-400/30 bg-blue-400/5';
const llenoClass = 'border-emerald-500/40 bg-emerald-500/10';

export const inputClass = `${baseInputClass} ${vacioClass}`;

export function campoClass(lleno: boolean) {
  return `${baseInputClass} ${lleno ? llenoClass : vacioClass}`;
}

export function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium tracking-wide text-ink-500 uppercase">
        {label}
        {required && <span className="ml-0.5 text-breco-500">*</span>}
      </span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const resaltar = useCampoResaltado();
  const lleno = resaltar && !props.readOnly && !props.disabled && estaLleno(props.value);
  return <input {...props} className={`${campoClass(lleno)} ${props.className ?? ''}`} />;
}

const HORAS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTOS_60 = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

/**
 * Selector de hora en formato 24 horas, siempre -- el <input type="time">
 * nativo muestra 12h con a.m./p.m. quien sabe por que configuracion regional
 * del navegador/SO tenga el usuario, sin forma confiable de forzar 24h desde
 * el HTML. Dos <select> (HH y MM) garantizan el mismo formato para todos.
 */
export function InputHora24({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [hh, mm] = value.includes(':') ? value.split(':') : ['', ''];
  const resaltar = useCampoResaltado();
  const lleno = resaltar && estaLleno(value);
  const claseSelect = `${campoClass(lleno)} w-20 px-2`;

  return (
    <div className={`flex items-center gap-1 ${className ?? ''}`}>
      <select className={claseSelect} value={hh} onChange={(e) => onChange(e.target.value ? `${e.target.value}:${mm || '00'}` : '')}>
        <option value="">--</option>
        {HORAS_24.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="text-ink-500">:</span>
      <select
        className={claseSelect}
        value={mm}
        onChange={(e) => onChange(hh ? `${hh}:${e.target.value || '00'}` : e.target.value ? `00:${e.target.value}` : '')}
      >
        <option value="">--</option>
        {MINUTOS_60.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const resaltar = useCampoResaltado();
  const lleno = resaltar && !props.disabled && estaLleno(props.value);
  return <select {...props} className={`${campoClass(lleno)} ${props.className ?? ''}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const resaltar = useCampoResaltado();
  const lleno = resaltar && !props.readOnly && !props.disabled && estaLleno(props.value);
  return <textarea {...props} className={`${campoClass(lleno)} ${props.className ?? ''}`} />;
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-breco-500 px-4 py-2 text-button font-medium text-white shadow-lg shadow-breco-glow transition hover:bg-breco-600 disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ''}`}
    />
  );
}

export function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-line-700 bg-bg-800 px-4 py-2 text-button font-medium text-ink-300 transition hover:border-line-600 hover:text-ink-100 ${props.className ?? ''}`}
    />
  );
}

type ToolbarButtonVariant = 'default' | 'accent';

// Todos los botones de barra de acciones usan el mismo azul solido que el
// boton primario (Agregar/Asignar viaje) -- "accent" se conserva como
// variante por si una accion necesita distinguirse a futuro, pero hoy
// renderiza el mismo azul.
const toolbarButtonVariants: Record<ToolbarButtonVariant, string> = {
  default: 'bg-breco-500 text-white hover:brightness-110 active:brightness-95 disabled:hover:brightness-100',
  accent: 'bg-breco-500 text-white hover:brightness-110 active:brightness-95 disabled:hover:brightness-100',
};

// Contorno neon al seleccionar (focus, no solo foco por teclado): el mismo
// resplandor azul brillante multicapa que ya se usa en los inputs.
const neonFocusRing =
  'focus:outline-none focus:shadow-[0_0_0_2px_var(--color-breco-500),0_0_16px_4px_color-mix(in_srgb,var(--color-breco-500)_60%,transparent),0_0_30px_9px_color-mix(in_srgb,var(--color-breco-500)_28%,transparent)]';

export function ToolbarButton({
  variant = 'default',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ToolbarButtonVariant }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-button font-medium shadow-sm shadow-black/20 transition disabled:cursor-not-allowed disabled:opacity-50 ${toolbarButtonVariants[variant]} ${neonFocusRing} ${className ?? ''}`}
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
