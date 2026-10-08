/** Tarjeta de error "con personaje" para rechazos del PAC (Facturama): mas amigable que un bloque de texto rojo con el JSON crudo. */
export function ErrorAvatarCard({ titulo, motivo }: { titulo: string; motivo: string }) {
  return (
    <div className="flex items-end gap-0 overflow-hidden rounded-2xl border border-red-900/40 bg-red-950/20">
      <img src="/avatares/avatar-error-full.webp" alt="" className="h-28 w-auto flex-shrink-0 object-contain object-bottom sm:h-32" />
      <div className="flex-1 self-center px-3.5 py-3">
        <p className="text-sm font-semibold text-ink-100">{titulo}</p>
        <p className="mt-1 text-sm text-ink-400">{motivo}</p>
      </div>
    </div>
  );
}

/** Tarjeta de exito "con personaje" (ej. timbrado completado) -- contraparte de ErrorAvatarCard. */
export function SuccessAvatarCard({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <div className="flex items-end gap-0 overflow-hidden rounded-2xl border border-emerald-800/40 bg-emerald-950/20">
      <img src="/avatares/avatar-exito-full.webp" alt="" className="h-28 w-auto flex-shrink-0 object-contain object-bottom sm:h-32" />
      <div className="flex-1 self-center px-3.5 py-3">
        <p className="text-sm font-semibold text-emerald-400">{titulo}</p>
        <p className="mt-1 text-sm text-ink-400">{detalle}</p>
      </div>
    </div>
  );
}
