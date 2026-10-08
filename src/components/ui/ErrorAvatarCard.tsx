import { Frown } from 'lucide-react';

/** Tarjeta de error "con cara" para rechazos del PAC (Facturama): mas amigable que un bloque de texto rojo con el JSON crudo. */
export function ErrorAvatarCard({ titulo, motivo }: { titulo: string; motivo: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-red-900/40 bg-red-950/20 p-4">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-900/40">
        <Frown size={22} className="text-white" />
      </div>
      <div className="relative flex-1 rounded-xl rounded-tl-none border border-line-800 bg-bg-900 px-3.5 py-2.5">
        <p className="text-sm font-semibold text-ink-100">{titulo}</p>
        <p className="mt-1 text-sm text-ink-400">{motivo}</p>
      </div>
    </div>
  );
}
