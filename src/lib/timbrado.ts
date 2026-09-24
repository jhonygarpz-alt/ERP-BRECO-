import type { DatosTimbradoCfdi } from '../types';

export const TIMBRADO_VACIO: DatosTimbradoCfdi = {
  simulado: false,
  folioFiscal: '',
  noSerieCertificadoEmisor: '',
  noSerieCertificadoSat: '',
  fechaHoraExpedicion: '',
  fechaHoraCertificacion: '',
  selloDigitalCfdi: '',
  selloDigitalSat: '',
  cadenaOriginal: '',
  cancelado: false,
  motivoCancelacion: '',
  folioSustitutoCancelacion: '',
  fechaCancelacion: '',
};

export const MOTIVOS_CANCELACION_SAT: { clave: string; descripcion: string }[] = [
  { clave: '01', descripcion: 'Comprobante emitido con errores con relacion' },
  { clave: '02', descripcion: 'Comprobante emitido con errores sin relacion' },
  { clave: '03', descripcion: 'No se llevo a cabo la operacion' },
  { clave: '04', descripcion: 'Operacion nominativa relacionada en una factura global' },
];

function selloFalso(): string {
  return Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join('');
}

/**
 * Genera un timbrado SIMULADO (folio fiscal, sellos, fechas) con la misma
 * forma que devolveria un PAC real, para poder probar y usar todo el flujo
 * de facturacion mientras no hay uno conectado. Se marca `simulado: true`
 * para que la UI y los formatos de impresion siempre dejen claro que no es
 * un timbrado valido ante el SAT.
 */
export function timbrarSimulado(): DatosTimbradoCfdi {
  const ahora = new Date().toISOString().slice(0, 19);
  return {
    ...TIMBRADO_VACIO,
    simulado: true,
    folioFiscal: crypto.randomUUID().toUpperCase(),
    noSerieCertificadoEmisor: 'SIMULADO',
    noSerieCertificadoSat: 'SIMULADO',
    fechaHoraExpedicion: ahora,
    fechaHoraCertificacion: ahora,
    selloDigitalCfdi: selloFalso(),
    selloDigitalSat: selloFalso(),
    cadenaOriginal: '||1.1|SIMULADO|| -- timbrado simulado, no valido ante el SAT',
  };
}

/**
 * Cancela (de forma simulada mientras no hay PAC conectado) el timbrado ya
 * existente, dejando el motivo y, si aplica, el folio del CFDI sustituto.
 */
export function cancelarTimbradoSimulado(
  timbrado: DatosTimbradoCfdi,
  motivoCancelacion: string,
  folioSustitutoCancelacion: string,
): DatosTimbradoCfdi {
  return {
    ...timbrado,
    cancelado: true,
    motivoCancelacion,
    folioSustitutoCancelacion,
    fechaCancelacion: new Date().toISOString().slice(0, 19),
  };
}
