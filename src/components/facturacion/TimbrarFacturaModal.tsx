import { useState } from 'react';
import { timbrarFactura } from '../../lib/facturamaCfdi';
import { timbrarSimulado } from '../../lib/timbrado';
import { Modal } from '../ui/Modal';
import { ErrorAvatarCard, SuccessAvatarCard } from '../ui/ErrorAvatarCard';
import { GhostButton, PrimaryButton } from '../ui/form';
import type { DatosTimbradoCfdi, Factura } from '../../types';

/** Timbra ante el PAC una factura que ya quedo guardada como "Pendiente" (sin pasar de nuevo por el formulario completo). */
export function TimbrarFacturaModal({
  factura,
  ambienteSandbox,
  onClose,
  onTimbrado,
}: {
  factura: Factura;
  ambienteSandbox: boolean;
  onClose: () => void;
  onTimbrado: (timbrado: DatosTimbradoCfdi) => void;
}) {
  const [paso, setPaso] = useState<'confirmar' | 'exito'>('confirmar');
  const [timbrando, setTimbrando] = useState(false);
  const [errorTimbrado, setErrorTimbrado] = useState('');
  const [datosTimbrados, setDatosTimbrados] = useState<DatosTimbradoCfdi | null>(null);

  async function confirmarTimbrar() {
    setTimbrando(true);
    setErrorTimbrado('');
    const resultado = await timbrarFactura(factura);
    setTimbrando(false);
    if ('error' in resultado) {
      setErrorTimbrado(resultado.error);
      return;
    }
    onTimbrado(resultado.timbrado);
    setDatosTimbrados(resultado.timbrado);
    setPaso('exito');
  }

  function guardarComoSimulado() {
    onTimbrado(timbrarSimulado());
    onClose();
  }

  if (paso === 'exito' && datosTimbrados) {
    return (
      <Modal title="Timbrado completado" onClose={onClose}>
        <div className="space-y-4">
          <SuccessAvatarCard
            titulo="¡Listo! Factura timbrada con exito"
            detalle={`Folio fiscal (UUID): ${datosTimbrados.folioFiscal}`}
          />
          <div className="flex justify-end border-t border-line-800 pt-4">
            <PrimaryButton type="button" onClick={onClose}>
              Continuar
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`Timbrar factura ${factura.folio}`} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-ink-300">¿Deseas timbrar la factura {factura.folio} ante el SAT ahora?</p>
        {ambienteSandbox ? (
          <div className="rounded-lg border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-sm font-medium text-amber-400">
            Timbrado de Pruebas ACTIVADO: este timbrado NO sera valido ante el SAT.
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/30 px-3 py-2 text-sm font-medium text-emerald-400">
            Timbrado real: este CFDI sera valido ante el SAT.
          </div>
        )}
        {errorTimbrado && <ErrorAvatarCard titulo="El timbrado fue rechazado" motivo={errorTimbrado} />}
        <div className="flex justify-end gap-2 border-t border-line-800 pt-4">
          <GhostButton type="button" onClick={onClose} disabled={timbrando}>
            Cancelar
          </GhostButton>
          {errorTimbrado && (
            <GhostButton type="button" onClick={guardarComoSimulado} disabled={timbrando}>
              Guardar como simulado
            </GhostButton>
          )}
          <PrimaryButton type="button" onClick={confirmarTimbrar} disabled={timbrando}>
            {timbrando ? 'Timbrando...' : errorTimbrado ? 'Reintentar' : 'Si, timbrar'}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
