/** Tarjeta de error "con personaje flotante" (sin fondo) para rechazos del PAC (Facturama): mas amigable que un bloque de texto rojo con el JSON crudo. */
export function ErrorAvatarCard({ titulo, motivo }: { titulo: string; motivo: string }) {
  return (
    <div className="relative pl-16 sm:pl-[72px]">
      <img
        src="/avatares/avatar-error.png"
        alt=""
        className="absolute -left-3.5 -top-6 z-10 h-[108px] w-auto drop-shadow-xl sm:h-[120px]"
      />
      <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-3.5">
        <p className="text-sm font-semibold text-ink-100">{titulo}</p>
        <p className="mt-1 max-h-48 overflow-y-auto text-sm text-ink-400">{motivo}</p>
      </div>
    </div>
  );
}

/** Tarjeta de exito "con personaje flotante" (ej. timbrado completado) -- contraparte de ErrorAvatarCard. */
export function SuccessAvatarCard({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <div className="relative pl-16 sm:pl-[72px]">
      <img
        src="/avatares/avatar-exito.png"
        alt=""
        className="absolute -left-3.5 -top-6 z-10 h-[108px] w-auto drop-shadow-xl sm:h-[120px]"
      />
      <div className="rounded-2xl border border-emerald-800/40 bg-emerald-950/20 p-3.5">
        <p className="text-sm font-semibold text-emerald-400">{titulo}</p>
        <p className="mt-1 text-sm text-ink-400">{detalle}</p>
      </div>
    </div>
  );
}
