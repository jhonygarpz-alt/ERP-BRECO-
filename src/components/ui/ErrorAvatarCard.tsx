/** Avatar ilustrado (SVG propio, sin depender de ninguna imagen externa) con cara de "algo salio mal", para los rechazos del PAC (Facturama). */
function AvatarPreocupado() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14 flex-shrink-0 drop-shadow-lg">
      <circle cx="32" cy="32" r="31" fill="#1e293b" stroke="#334155" strokeWidth="1" />
      {/* Cuello y hombros (sudadera) */}
      <path d="M14 60c0-10 8-14 18-14s18 4 18 14z" fill="#0f172a" />
      <path d="M22 46c3 3 7 4 10 4s7-1 10-4l-2 6c-2 2-5 3-8 3s-6-1-8-3z" fill="#f4a876" />
      {/* Cara */}
      <circle cx="32" cy="30" r="15" fill="#f4a876" />
      {/* Cabello */}
      <path d="M17 27c0-9 7-15 15-15s15 6 15 15c-2-3-5-5-8-6-1 2-3 3-5 3-3 0-6-2-7-4-3 1-6 4-7 7-1 1-2 1-3 0z" fill="#3b2a20" />
      {/* Cejas preocupadas */}
      <path d="M24 26c2-2 5-2 7-1" stroke="#3b2a20" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M33 25c2-1 5-1 7 1" stroke="#3b2a20" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Ojos */}
      <circle cx="27" cy="30" r="2" fill="#1f2937" />
      <circle cx="38" cy="30" r="2" fill="#1f2937" />
      {/* Boca de "ups" */}
      <ellipse cx="32.5" cy="38" rx="3.2" ry="4" fill="#7c2d12" />
      {/* Diadema/headset, como si fuera soporte */}
      <path d="M18 24c0-9 6-16 14-16s14 7 14 16" stroke="#0ea5e9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="15" y="24" width="5" height="8" rx="2.5" fill="#0ea5e9" />
      <rect x="44" y="24" width="5" height="8" rx="2.5" fill="#0ea5e9" />
      <path d="M46 31c2 1 3 3 2 6" stroke="#0ea5e9" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Tarjeta de error "con cara" para rechazos del PAC (Facturama): mas amigable que un bloque de texto rojo con el JSON crudo. */
export function ErrorAvatarCard({ titulo, motivo }: { titulo: string; motivo: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-red-900/40 bg-red-950/20 p-4">
      <AvatarPreocupado />
      <div className="relative flex-1 self-center rounded-xl rounded-tl-none border border-line-800 bg-bg-900 px-3.5 py-2.5">
        <p className="text-sm font-semibold text-ink-100">{titulo}</p>
        <p className="mt-1 text-sm text-ink-400">{motivo}</p>
      </div>
    </div>
  );
}

/** Mismo personaje que AvatarPreocupado pero contento, con una insignia de palomita -- para confirmar exito (ej. timbrado). */
function AvatarContento() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14 flex-shrink-0 drop-shadow-lg">
      <circle cx="32" cy="32" r="31" fill="#1e293b" stroke="#334155" strokeWidth="1" />
      <path d="M14 60c0-10 8-14 18-14s18 4 18 14z" fill="#0f172a" />
      <path d="M22 46c3 3 7 4 10 4s7-1 10-4l-2 6c-2 2-5 3-8 3s-6-1-8-3z" fill="#f4a876" />
      <circle cx="32" cy="30" r="15" fill="#f4a876" />
      <path d="M17 27c0-9 7-15 15-15s15 6 15 15c-2-3-5-5-8-6-1 2-3 3-5 3-3 0-6-2-7-4-3 1-6 4-7 7-1 1-2 1-3 0z" fill="#3b2a20" />
      {/* Cejas relajadas */}
      <path d="M24 25.5c2-1 5-1 7 0" stroke="#3b2a20" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M33 25.5c2-1 5-1 7 0" stroke="#3b2a20" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Ojos contentos (arco hacia arriba) */}
      <path d="M25 29.5c1-1.5 3-1.5 4 0" stroke="#1f2937" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M36 29.5c1-1.5 3-1.5 4 0" stroke="#1f2937" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Sonrisa */}
      <path d="M25 35c2 4 5 6 8 6s6-2 8-6c-2 1.5-5 2.5-8 2.5s-6-1-8-2.5z" fill="#fff" stroke="#7c2d12" strokeWidth="1" />
      <path d="M18 24c0-9 6-16 14-16s14 7 14 16" stroke="#0ea5e9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="15" y="24" width="5" height="8" rx="2.5" fill="#0ea5e9" />
      <rect x="44" y="24" width="5" height="8" rx="2.5" fill="#0ea5e9" />
      <path d="M46 31c2 1 3 3 2 6" stroke="#0ea5e9" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Insignia de palomita */}
      <circle cx="48" cy="46" r="10" fill="#10b981" stroke="#0b1220" strokeWidth="2" />
      <path d="M43.5 46l3 3 6-6.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/** Tarjeta de exito "con cara" (ej. timbrado completado) -- contraparte de ErrorAvatarCard. */
export function SuccessAvatarCard({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-emerald-800/40 bg-emerald-950/20 p-4">
      <AvatarContento />
      <div className="relative flex-1 self-center rounded-xl rounded-tl-none border border-line-800 bg-bg-900 px-3.5 py-2.5">
        <p className="text-sm font-semibold text-emerald-400">{titulo}</p>
        <p className="mt-1 text-sm text-ink-400">{detalle}</p>
      </div>
    </div>
  );
}
