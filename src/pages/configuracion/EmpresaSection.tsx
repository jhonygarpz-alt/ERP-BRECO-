import { useState, type ChangeEvent } from 'react';
import { Building2, Upload, FileCheck2, Loader2, Trash2 } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { Field, Input, PrimaryButton } from '../../components/ui/form';
import { registrarCsdFacturama, eliminarCsdFacturama } from '../../lib/facturamaCsd';

export function EmpresaSection() {
  const { empresa } = useData();
  const { hasPermission } = useAuth();
  const puedeEditar = hasPermission('Configuracion', 'editar');
  const [form, setForm] = useState(empresa.value);
  const [saved, setSaved] = useState(false);
  const [certificado, setCertificado] = useState<File | null>(null);
  const [llave, setLlave] = useState<File | null>(null);
  const [passwordCsd, setPasswordCsd] = useState('');
  const [cargandoCsd, setCargandoCsd] = useState(false);
  const [errorCsd, setErrorCsd] = useState('');

  async function handleRegistrarCsd() {
    if (!certificado || !llave || !passwordCsd) {
      setErrorCsd('Sube el .cer, el .key y la contrasena del CSD.');
      return;
    }
    setCargandoCsd(true);
    setErrorCsd('');
    const accion = empresa.value.facturamaCsdRegistrado ? 'actualizar' : 'registrar';
    const { error } = await registrarCsdFacturama(certificado, llave, passwordCsd, accion);
    setCargandoCsd(false);
    if (error) {
      setErrorCsd(error);
      return;
    }
    await empresa.update({ facturamaCsdRegistrado: true });
    setCertificado(null);
    setLlave(null);
    setPasswordCsd('');
  }

  async function handleEliminarCsd() {
    setCargandoCsd(true);
    setErrorCsd('');
    const { error } = await eliminarCsdFacturama();
    setCargandoCsd(false);
    if (error) {
      setErrorCsd(error);
      return;
    }
    await empresa.update({ facturamaCsdRegistrado: false, facturamaCsdVigenciaHasta: undefined });
  }

  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, logoDataUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    empresa.update(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <fieldset disabled={!puedeEditar} className="space-y-6">
      <div className="rounded-2xl border border-line-800 bg-bg-800 p-5">
        <h2 className="mb-4 text-card-header font-medium text-ink-100">Logotipo</h2>
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line-700 bg-bg-900">
            {form.logoDataUrl ? (
              <img src={form.logoDataUrl} alt="Logo de la empresa" className="h-full w-full object-contain" />
            ) : (
              <Building2 size={28} className="text-ink-600" />
            )}
          </div>
          <div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line-700 bg-bg-900 px-4 py-2 text-sm font-medium text-ink-300 transition hover:border-line-600 hover:text-ink-100">
              <Upload size={15} />
              Subir logo
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
            <p className="mt-2 text-xs text-ink-600">PNG o SVG con fondo transparente, se vera en el menu lateral.</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line-800 bg-bg-800 p-5">
        <h2 className="mb-4 text-card-header font-medium text-ink-100">Datos de la empresa</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre comercial">
            <Input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </Field>
          <Field label="Razon social">
            <Input value={form.razonSocial} onChange={(e) => setForm({ ...form, razonSocial: e.target.value })} />
          </Field>
          <Field label="RFC">
            <Input value={form.rfc} onChange={(e) => setForm({ ...form, rfc: e.target.value })} />
          </Field>
          <Field label="Regimen Fiscal (SAT)">
            <Input
              value={form.regimenFiscal}
              onChange={(e) => setForm({ ...form, regimenFiscal: e.target.value })}
              placeholder="Ej. 612 - Personas Fisicas con Actividades Empresariales y Profesionales"
            />
          </Field>
          <Field label="Telefono">
            <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Sitio web">
            <Input value={form.sitioWeb} onChange={(e) => setForm({ ...form, sitioWeb: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Direccion">
              <Input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
            </Field>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line-800 bg-bg-800 p-5">
        <h2 className="mb-1 text-card-header font-medium text-ink-100">Facturacion electronica (CSD)</h2>
        <p className="mb-4 text-sm text-ink-600">
          Sube el certificado de sello digital (.cer) y la llave privada (.key) de tu RFC, con su contrasena, para
          poder timbrar facturas reales ante el SAT. El ERP no guarda el certificado ni la llave: se envian directo
          al PAC (Facturama) y solo se guarda si quedo registrado.
        </p>

        {empresa.value.facturamaCsdRegistrado ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-800/40 bg-emerald-950/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <FileCheck2 size={16} />
              CSD registrado para el RFC {form.rfc || '(sin RFC)'}
              {empresa.value.facturamaCsdVigenciaHasta && ` - vigente hasta ${empresa.value.facturamaCsdVigenciaHasta}`}
              {empresa.value.facturamaAmbiente === 'sandbox' && ' (ambiente de pruebas, no valido ante el SAT)'}
            </div>
            <button
              type="button"
              onClick={handleEliminarCsd}
              disabled={cargandoCsd}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/50 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-950/30 disabled:opacity-50"
            >
              {cargandoCsd ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Eliminar CSD
            </button>
          </div>
        ) : (
          <p className="mb-3 text-sm text-amber-500">Esta empresa todavia no tiene un CSD registrado con el PAC.</p>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Certificado (.cer)">
            <input
              type="file"
              accept=".cer"
              onChange={(e) => setCertificado(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-ink-300"
            />
          </Field>
          <Field label="Llave privada (.key)">
            <input
              type="file"
              accept=".key"
              onChange={(e) => setLlave(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-ink-300"
            />
          </Field>
          <Field label="Contrasena de la llave">
            <Input type="password" value={passwordCsd} onChange={(e) => setPasswordCsd(e.target.value)} />
          </Field>
        </div>

        {errorCsd && <p className="mt-3 text-sm text-red-400">{errorCsd}</p>}

        <div className="mt-4">
          <button
            type="button"
            onClick={handleRegistrarCsd}
            disabled={cargandoCsd}
            className="inline-flex items-center gap-2 rounded-lg border border-line-700 bg-bg-900 px-4 py-2 text-sm font-medium text-ink-100 transition hover:border-line-600 disabled:opacity-50"
          >
            {cargandoCsd && <Loader2 size={14} className="animate-spin" />}
            {empresa.value.facturamaCsdRegistrado ? 'Actualizar CSD' : 'Registrar CSD con el PAC'}
          </button>
        </div>
      </div>
      </fieldset>

      {puedeEditar ? (
        <div className="flex items-center gap-3">
          <PrimaryButton type="submit">Guardar cambios</PrimaryButton>
          {saved && <span className="text-sm text-emerald-400">Cambios guardados.</span>}
        </div>
      ) : (
        <p className="text-sm text-ink-600">Tu rol no tiene permiso para editar esta informacion.</p>
      )}
    </form>
  );
}
