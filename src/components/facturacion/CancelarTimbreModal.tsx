import { useState } from 'react';
import { MOTIVOS_CANCELACION_SAT } from '../../lib/timbrado';
import { Modal } from '../ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select } from '../ui/form';

export function CancelarTimbreModal({
  folio,
  onClose,
  onCancelar,
}: {
  folio: string;
  onClose: () => void;
  onCancelar: (motivo: string, folioSustituto: string) => void;
}) {
  const [motivo, setMotivo] = useState(MOTIVOS_CANCELACION_SAT[0].clave);
  const [folioSustituto, setFolioSustituto] = useState('');
  const [error, setError] = useState('');

  function confirmar() {
    if (motivo === '01' && !folioSustituto.trim()) {
      setError('El motivo 01 requiere el folio fiscal (UUID) del CFDI que sustituye a este.');
      return;
    }
    onCancelar(motivo, motivo === '01' ? folioSustituto.trim() : '');
  }

  return (
    <Modal title={`Cancelar timbre de ${folio}`} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-xs text-ink-500">
          Por ahora el ERP no esta conectado a un PAC, asi que esta cancelacion es simulada (no se envia al SAT); en
          cuanto se conecte uno, este mismo boton hara la cancelacion real.
        </p>
        {error && <p className="rounded-lg bg-breco-500/10 px-3 py-2 text-sm text-breco-500">{error}</p>}
        <Field label="Motivo de cancelacion (SAT)">
          <Select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            {MOTIVOS_CANCELACION_SAT.map((m) => (
              <option key={m.clave} value={m.clave}>
                {m.clave} - {m.descripcion}
              </option>
            ))}
          </Select>
        </Field>
        {motivo === '01' && (
          <Field label="Folio fiscal (UUID) del CFDI que sustituye a este">
            <Input value={folioSustituto} onChange={(e) => setFolioSustituto(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" />
          </Field>
        )}
        <div className="flex justify-end gap-2 border-t border-line-800 pt-4">
          <GhostButton type="button" onClick={onClose}>
            Cancelar
          </GhostButton>
          <PrimaryButton type="button" onClick={confirmar}>
            Cancelar CFDI
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
