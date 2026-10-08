/** Tarjeta de error "con cara" para rechazos del PAC (Facturama): mas amigable que un bloque de texto rojo con el JSON crudo. */
export function ErrorAvatarCard({ titulo, motivo }: { titulo: string; motivo: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-red-900/40 bg-red-950/20 p-4">
      <img
        src="/avatares/avatar-error.webp"
        alt=""
        className="h-14 w-14 flex-shrink-0 rounded-full object-cover shadow-lg"
      />
      <div className="relative flex-1 self-center rounded-xl rounded-tl-none border border-line-800 bg-bg-900 px-3.5 py-2.5">
        <p className="text-sm font-semibold text-ink-100">{titulo}</p>
        <p className="mt-1 text-sm text-ink-400">{motivo}</p>
      </div>
    </div>
  );
}

/** Tarjeta de exito "con cara" (ej. timbrado completado) -- contraparte de ErrorAvatarCard. */
export function SuccessAvatarCard({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-emerald-800/40 bg-emerald-950/20 p-4">
      <img
        src="/avatares/avatar-exito.webp"
        alt=""
        className="h-14 w-14 flex-shrink-0 rounded-full object-cover shadow-lg"
      />
      <div className="relative flex-1 self-center rounded-xl rounded-tl-none border border-line-800 bg-bg-900 px-3.5 py-2.5">
        <p className="text-sm font-semibold text-emerald-400">{titulo}</p>
        <p className="mt-1 text-sm text-ink-400">{detalle}</p>
      </div>
    </div>
  );
}
