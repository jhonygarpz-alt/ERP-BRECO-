import { useState } from 'react';
import { CheckCircle2, Download, FileText, Upload } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { mensajeDeError } from '../../lib/errors';
import { extraerTextoPdf } from '../../lib/pdfText';
import { formatearDomicilio, parseConstanciaFiscal, type DatosConstanciaFiscal } from '../../lib/parseConstanciaFiscal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Field, GhostButton, Input, PrimaryButton } from '../../components/ui/form';

const BUCKET = 'empresa-documentos';

export function ConstanciaFiscalPage() {
  const { empresa } = useData();
  const { hasPermission } = useAuth();
  const puedeEditar = hasPermission('Configuracion', 'editar');

  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [datos, setDatos] = useState<DatosConstanciaFiscal | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  async function handleArchivo(file: File) {
    setArchivo(file);
    setError('');
    setDatos(null);
    setGuardado(false);
    setProcesando(true);
    try {
      const texto = await extraerTextoPdf(file);
      const extraido = parseConstanciaFiscal(texto);
      if (!extraido.rfc) {
        setError('No se pudo leer el RFC en este PDF. Verifica que sea la Constancia de Situacion Fiscal original del SAT (no una foto o escaneo).');
      }
      setDatos(extraido);
    } catch (err) {
      setError(mensajeDeError(err) || 'No se pudo leer el PDF.');
    } finally {
      setProcesando(false);
    }
  }

  async function handleAplicar() {
    if (!datos || !archivo) return;
    setGuardando(true);
    setError('');
    try {
      const path = `${empresa.value.id}/csf_${Date.now()}.pdf`;
      const { error: errUp } = await supabase.storage.from(BUCKET).upload(path, archivo, { upsert: true });
      if (errUp) throw errUp;

      await empresa.update({
        razonSocial: datos.razonSocial || empresa.value.razonSocial,
        rfc: datos.rfc || empresa.value.rfc,
        direccion: formatearDomicilio(datos) || empresa.value.direccion,
        csfStoragePath: path,
        csfImportadaEn: new Date().toISOString(),
      });
      setGuardado(true);
    } catch (err) {
      setError(mensajeDeError(err) || 'No se pudo guardar.');
    } finally {
      setGuardando(false);
    }
  }

  async function handleVerActual() {
    if (!empresa.value.csfStoragePath) return;
    const { data, error: errUrl } = await supabase.storage.from(BUCKET).createSignedUrl(empresa.value.csfStoragePath, 60);
    if (errUrl || !data) {
      alert(mensajeDeError(errUrl) || 'No se pudo abrir el documento.');
      return;
    }
    window.open(data.signedUrl, '_blank');
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Constancia de Situación Fiscal"
        subtitle="Importa el PDF oficial del SAT para actualizar el RFC, razón social y domicilio fiscal de tu empresa."
      />

      {empresa.value.csfStoragePath && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-line-800 bg-bg-800 p-4">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-ink-500" />
            <div>
              <div className="text-sm font-medium text-ink-100">Constancia actual</div>
              <div className="text-xs text-ink-500">
                {empresa.value.csfImportadaEn
                  ? `Importada el ${new Date(empresa.value.csfImportadaEn).toLocaleDateString('es-MX')}`
                  : 'Ya hay una constancia cargada'}
              </div>
            </div>
          </div>
          <GhostButton type="button" onClick={handleVerActual}>
            <Download size={15} />
            Ver PDF
          </GhostButton>
        </div>
      )}

      {puedeEditar ? (
        <div className="rounded-2xl border border-line-800 bg-bg-800 p-6">
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-line-700 bg-bg-900 px-6 py-10 text-center hover:border-breco-500/50">
            <Upload size={28} className="text-ink-500" />
            <div>
              <div className="text-sm font-medium text-ink-100">
                {procesando ? 'Leyendo PDF...' : 'Selecciona la Constancia de Situación Fiscal (PDF)'}
              </div>
              <div className="mt-1 text-xs text-ink-600">Debe ser el PDF original descargado del SAT, no una foto o escaneo.</div>
            </div>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              disabled={procesando}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleArchivo(file);
                e.target.value = '';
              }}
            />
          </label>

          {error && <p className="mt-4 text-sm text-breco-500">{error}</p>}

          {datos && (
            <div className="mt-6 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-breco-500">Datos encontrados en el PDF</h3>
              <p className="text-xs text-ink-500">
                Revisa que coincidan antes de aplicarlos -- puedes corregirlos aqui mismo si algo no se leyo bien.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="RFC">
                  <Input value={datos.rfc} onChange={(e) => setDatos({ ...datos, rfc: e.target.value.toUpperCase() })} />
                </Field>
                <Field label="Nombre / Razon Social">
                  <Input value={datos.razonSocial} onChange={(e) => setDatos({ ...datos, razonSocial: e.target.value })} />
                </Field>
                <Field label="Estatus en el padron">
                  <Input value={datos.estatusPadron} disabled />
                </Field>
                <Field label="Fecha inicio de operaciones">
                  <Input value={datos.fechaInicioOperaciones} disabled />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Domicilio fiscal (armado del PDF)">
                    <Input value={formatearDomicilio(datos)} disabled />
                  </Field>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-line-800 pt-4">
                {guardado ? (
                  <span className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                    <CheckCircle2 size={16} />
                    Aplicado a tu empresa
                  </span>
                ) : (
                  <PrimaryButton type="button" onClick={handleAplicar} disabled={guardando || !datos.rfc}>
                    {guardando ? 'Guardando...' : 'Aplicar a mi empresa'}
                  </PrimaryButton>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-ink-500">No tienes permiso para actualizar los datos fiscales de la empresa.</p>
      )}
    </div>
  );
}
