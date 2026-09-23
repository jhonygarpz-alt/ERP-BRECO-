/**
 * Ilustraciones de referencia dibujadas a mano (SVG propio, no fotografias -- este
 * sistema no tiene banco de fotos reales de partes de camion) para cada punto del
 * Checklist Fisicomecanico Rapido. Una por concepto, en vez de repetir el icono de
 * la seccion en todas las tarjetas.
 */
import type { ReactElement } from 'react';

const frameProps = {
  viewBox: '0 0 48 48',
  className: 'h-full w-full',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function Llanta() {
  return (
    <svg {...frameProps}>
      <circle cx="20" cy="24" r="14" />
      <circle cx="20" cy="24" r="5" />
      <circle cx="20" cy="15" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="27.5" cy="19.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="27.5" cy="28.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="20" cy="33" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="28.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="19.5" r="1.6" fill="currentColor" stroke="none" />
      <path d="M33 30a6 6 0 1 0 0 8.2" strokeWidth="1.4" />
      <path d="M33 34h6M37 31.5v5" strokeWidth="1.4" />
    </svg>
  );
}

function Birlos() {
  return (
    <svg {...frameProps}>
      <circle cx="24" cy="24" r="15" />
      <circle cx="24" cy="24" r="5.5" />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const cx = 24 + Math.cos(rad) * 10;
        const cy = 24 + Math.sin(rad) * 10;
        return <polygon key={deg} points="-2,-2.3 2,-2.3 2.3,0 2,2.3 -2,2.3 -2.3,0" transform={`translate(${cx} ${cy})`} fill="currentColor" stroke="none" />;
      })}
    </svg>
  );
}

function LlantaRefaccion() {
  return (
    <svg {...frameProps}>
      <path d="M10 12h28" />
      <path d="M20 12v4M28 12v4" />
      <circle cx="24" cy="30" r="11" />
      <circle cx="24" cy="30" r="4" />
    </svg>
  );
}

function FrenosServicio() {
  return (
    <svg {...frameProps}>
      <circle cx="22" cy="24" r="13" />
      <circle cx="22" cy="24" r="3" />
      <path d="M17 15l10 18M31 17l-18 10" strokeWidth="1.2" opacity="0.5" />
      <path d="M32 14c4 2 6 6 6 10s-2 8-6 10" strokeWidth="2.2" />
      <path d="M31 13.3l2 1.6-1 2.3M31 34.7l2-1.6-1-2.3" strokeWidth="1.4" />
    </svg>
  );
}

function FrenoEstacionamiento() {
  return (
    <svg {...frameProps}>
      <path d="M12 38h14" />
      <path d="M15 38V21l14-10" strokeWidth="2.2" />
      <circle cx="30" cy="10.5" r="2.6" fill="currentColor" stroke="none" />
      <path d="M12 30h6M12 34h8" strokeWidth="1.3" opacity="0.6" />
    </svg>
  );
}

function LucesDelanteras() {
  return (
    <svg {...frameProps}>
      <path d="M10 16a8 8 0 0 1 8 8v8h-8z" />
      <circle cx="15" cy="24" r="2.2" fill="currentColor" stroke="none" />
      <path d="M23 18h13M23 24h16M23 30h13" strokeWidth="1.6" />
      <circle cx="34" cy="12" r="2.6" fill="currentColor" stroke="none" opacity="0.85" />
    </svg>
  );
}

function LucesTraseras() {
  return (
    <svg {...frameProps}>
      <rect x="12" y="14" width="24" height="20" rx="3" />
      <path d="M20 14v20M28 14v20" />
      <circle cx="16" cy="24" r="2" fill="currentColor" stroke="none" opacity="0.85" />
      <circle cx="24" cy="24" r="2" fill="currentColor" stroke="none" />
      <circle cx="32" cy="24" r="2" fill="currentColor" stroke="none" opacity="0.55" />
    </svg>
  );
}

function Torreta() {
  return (
    <svg {...frameProps}>
      <rect x="16" y="32" width="16" height="5" rx="1.5" />
      <path d="M18 32c0-7 3-11 6-11s6 4 6 11z" />
      <path d="M24 14v3M15 20l2 2M33 20l-2 2M12 27h3M33 27h3" strokeWidth="1.5" opacity="0.7" />
    </svg>
  );
}

function EspejoLateral() {
  return (
    <svg {...frameProps}>
      <path d="M10 34l10-20" strokeWidth="2" />
      <rect x="20" y="10" width="13" height="18" rx="4" transform="rotate(12 26.5 19)" />
      <path d="M23 15l7 8" strokeWidth="1.3" opacity="0.6" transform="rotate(12 26.5 19)" />
    </svg>
  );
}

function Parabrisas() {
  return (
    <svg {...frameProps}>
      <path d="M9 34l4-20h22l4 20z" />
      <path d="M14 30a12 12 0 0 0 12 3" strokeWidth="1.6" />
      <path d="M24 30a12 12 0 0 0 11-6" strokeWidth="1.6" opacity="0.6" />
      <path d="M14 36l1.5-6M35 33l-2-4" strokeWidth="1.6" />
    </svg>
  );
}

function NivelAceite() {
  return (
    <svg {...frameProps}>
      <path d="M24 10v13" strokeWidth="2" />
      <path d="M24 22c7 6 10 11 10 15a10 10 0 0 1-20 0c0-4 3-9 10-15z" />
      <path d="M16 34h16" strokeWidth="1.8" opacity="0.7" />
    </svg>
  );
}

function NivelRefrigerante() {
  return (
    <svg {...frameProps}>
      <rect x="14" y="16" width="20" height="20" rx="3" />
      <path d="M20 16v-4h8v4" />
      <path d="M14 27c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0 4 1.5 6 0" strokeWidth="1.5" />
      <path d="M24 8v4M20.5 10.5h7" strokeWidth="1.3" opacity="0.7" />
    </svg>
  );
}

function NivelFrenos() {
  return (
    <svg {...frameProps}>
      <path d="M18 14h12l2 6v14a3 3 0 0 1-3 3H19a3 3 0 0 1-3-3V20z" />
      <path d="M17 26h14" strokeWidth="1.8" opacity="0.7" />
      <circle cx="24" cy="11" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Suspension() {
  return (
    <svg {...frameProps}>
      <path d="M14 10v6l6 3-6 3 6 3-6 3 6 3v7" strokeWidth="2" />
      <rect x="28" y="10" width="8" height="28" rx="2" />
      <path d="M28 18h8M28 26h8" strokeWidth="1.4" opacity="0.7" />
    </svg>
  );
}

function Carroceria() {
  return (
    <svg {...frameProps}>
      <path d="M6 30V18h14l6 6h13v6z" />
      <path d="M20 18v6h6" strokeWidth="1.4" opacity="0.6" />
      <circle cx="15" cy="33" r="3.4" />
      <circle cx="33" cy="33" r="3.4" />
      <path d="M6 30h3M36 30h3" />
    </svg>
  );
}

function QuintaRueda() {
  return (
    <svg {...frameProps}>
      <path d="M8 28a16 12 0 0 1 32 0" />
      <path d="M8 28h32" />
      <circle cx="24" cy="24" r="3.2" fill="currentColor" stroke="none" />
      <path d="M14 34h20" strokeWidth="1.4" opacity="0.6" />
    </svg>
  );
}

function Extintor() {
  return (
    <svg {...frameProps}>
      <rect x="16" y="14" width="12" height="22" rx="5" />
      <path d="M20 14v-3h4v3" />
      <path d="M28 18h5c2 0 3 2 1.5 3.5L30 26" strokeWidth="1.6" />
      <circle cx="22" cy="21" r="1.8" fill="currentColor" stroke="none" />
      <path d="M18 30h8" strokeWidth="1.4" opacity="0.6" />
    </svg>
  );
}

function Botiquin() {
  return (
    <svg {...frameProps}>
      <rect x="9" y="16" width="30" height="20" rx="3" />
      <path d="M17 16v-3a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3" />
      <path d="M24 21v10M19 26h10" strokeWidth="2.4" />
    </svg>
  );
}

function Triangulo() {
  return (
    <svg {...frameProps}>
      <path d="M24 9l16 27H8z" strokeLinejoin="round" />
      <path d="M24 20v9" strokeWidth="2.2" />
      <circle cx="24" cy="33" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Documento() {
  return (
    <svg {...frameProps}>
      <path d="M14 8h14l6 6v26H14z" />
      <path d="M28 8v6h6" />
      <path d="M18 24h12M18 29h12M18 34h8" strokeWidth="1.5" opacity="0.7" />
    </svg>
  );
}

const ILUSTRACIONES: Record<string, () => ReactElement> = {
  'Estado y presion de llantas': Llanta,
  'Birlos y tuercas completos': Birlos,
  'Llanta de refaccion': LlantaRefaccion,
  'Sistema de frenos de servicio': FrenosServicio,
  'Freno de estacionamiento': FrenoEstacionamiento,
  'Luces delanteras y direccionales': LucesDelanteras,
  'Luces traseras y de freno': LucesTraseras,
  'Torreta y luces de emergencia': Torreta,
  'Espejos laterales': EspejoLateral,
  'Parabrisas y limpiadores': Parabrisas,
  'Nivel de aceite de motor': NivelAceite,
  'Nivel de refrigerante': NivelRefrigerante,
  'Nivel de liquido de frenos': NivelFrenos,
  'Amortiguadores y muelles': Suspension,
  'Estado general de la carroceria': Carroceria,
  'Quinta rueda / acoplamiento': QuintaRueda,
  'Extintor vigente': Extintor,
  'Botiquin de primeros auxilios': Botiquin,
  'Triangulos / senales de emergencia': Triangulo,
  'Documentos de la unidad a bordo': Documento,
};

export function ChecklistIlustracion({ concepto, className }: { concepto: string; className?: string }) {
  const Ilustracion = ILUSTRACIONES[concepto];
  if (!Ilustracion) return null;
  return (
    <div className={className}>
      <Ilustracion />
    </div>
  );
}

export function tieneIlustracion(concepto: string): boolean {
  return concepto in ILUSTRACIONES;
}
