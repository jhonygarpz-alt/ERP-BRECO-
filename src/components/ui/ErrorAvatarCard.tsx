/** Tarjeta de error "con personaje" (avatar sin fondo, retrato de cabeza y hombros) para rechazos del PAC (Facturama). */
export function ErrorAvatarCard({ titulo, motivo }: { titulo: string; motivo: string }) {
  return (
    <div className="flex items-start gap-3">
      <img src="/avatares/avatar-error-v2.png" alt="" className="h-[88px] w-auto flex-shrink-0 drop-shadow-lg" />
      <div className="min-w-0 flex-1 rounded-2xl border border-red-900/40 bg-red-950/20 p-3.5">
        <p className="text-sm font-semibold text-ink-100">{titulo}</p>
        <p className="mt-1 max-h-48 overflow-y-auto whitespace-pre-line text-sm text-ink-400">{motivo}</p>
      </div>
    </div>
  );
}

/** Tarjeta de exito "con personaje" (ej. timbrado completado) -- contraparte de ErrorAvatarCard. */
export function SuccessAvatarCard({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <div className="flex items-start gap-3">
      <img src="/avatares/avatar-exito-v2.png" alt="" className="h-[88px] w-auto flex-shrink-0 drop-shadow-lg" />
      <div className="min-w-0 flex-1 rounded-2xl border border-emerald-800/40 bg-emerald-950/20 p-3.5">
        <p className="text-sm font-semibold text-emerald-400">{titulo}</p>
        <p className="mt-1 text-sm text-ink-400">{detalle}</p>
      </div>
    </div>
  );
}
