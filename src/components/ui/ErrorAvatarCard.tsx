/** Tarjeta de error "con personaje" para rechazos del PAC (Facturama): mas amigable que un bloque de texto rojo con el JSON crudo. */
export function ErrorAvatarCard({ titulo, motivo }: { titulo: string; motivo: string }) {
  return (
    <div className="flex gap-3 overflow-hidden rounded-2xl border border-red-900/40 bg-red-950/20 p-3">
      <img
        src="/avatares/avatar-error-full.webp"
        alt=""
        className="h-20 w-16 flex-shrink-0 rounded-xl object-cover object-top"
      />
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-semibold text-ink-100">{titulo}</p>
        <p className="mt-1 max-h-48 overflow-y-auto text-sm text-ink-400">{motivo}</p>
      </div>
    </div>
  );
}

/** Tarjeta de exito "con personaje" (ej. timbrado completado) -- contraparte de ErrorAvatarCard. */
export function SuccessAvatarCard({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <div className="flex gap-3 overflow-hidden rounded-2xl border border-emerald-800/40 bg-emerald-950/20 p-3">
      <img
        src="/avatares/avatar-exito-full.webp"
        alt=""
        className="h-20 w-16 flex-shrink-0 rounded-xl object-cover object-top"
      />
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-semibold text-emerald-400">{titulo}</p>
        <p className="mt-1 text-sm text-ink-400">{detalle}</p>
      </div>
    </div>
  );
}
