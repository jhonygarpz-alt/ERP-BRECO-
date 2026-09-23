const ILUSTRACIONES: Record<string, string> = {
  'Estado y presion de llantas': 'estado-y-presion-de-llantas.jpg',
  'Birlos y tuercas completos': 'birlos-y-tuercas-completos.jpg',
  'Llanta de refaccion': 'llanta-de-refaccion.jpg',
  'Sistema de frenos de servicio': 'sistema-de-frenos-de-servicio.jpg',
  'Freno de estacionamiento': 'freno-de-estacionamiento.jpg',
  'Luces delanteras y direccionales': 'luces-delanteras-y-direccionales.jpg',
  'Luces traseras y de freno': 'luces-traseras-y-de-freno.jpg',
  'Torreta y luces de emergencia': 'torreta-y-luces-de-emergencia.jpg',
  'Espejos laterales': 'espejos-laterales.jpg',
  'Parabrisas y limpiadores': 'parabrisas-y-limpiadores.jpg',
  'Nivel de aceite de motor': 'nivel-de-aceite-de-motor.jpg',
  'Nivel de refrigerante': 'nivel-de-refrigerante.jpg',
  'Nivel de liquido de frenos': 'nivel-de-liquido-de-frenos.jpg',
  'Amortiguadores y muelles': 'amortiguadores-y-muelles.jpg',
  'Estado general de la carroceria': 'estado-general-de-la-carroceria.jpg',
  'Quinta rueda / acoplamiento': 'quinta-rueda-acoplamiento.jpg',
  'Extintor vigente': 'extintor-vigente.jpg',
  'Botiquin de primeros auxilios': 'botiquin-de-primeros-auxilios.jpg',
  'Triangulos / senales de emergencia': 'triangulos-senales-de-emergencia.jpg',
  'Documentos de la unidad a bordo': 'documentos-de-la-unidad-a-bordo.jpg',
};

export function ChecklistIlustracion({ concepto, className }: { concepto: string; className?: string }) {
  const archivo = ILUSTRACIONES[concepto];
  if (!archivo) return null;
  return (
    <img
      src={`/mantenimiento/checklist/${archivo}`}
      alt={concepto}
      className={`${className ?? ''} object-cover`}
    />
  );
}

export function tieneIlustracion(concepto: string): boolean {
  return concepto in ILUSTRACIONES;
}
