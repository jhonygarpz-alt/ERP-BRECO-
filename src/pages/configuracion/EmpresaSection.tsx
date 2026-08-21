import { useState, type ChangeEvent } from 'react';
import { Building2, Upload } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { Field, Input, PrimaryButton } from '../../components/ui/form';

export function EmpresaSection() {
  const { empresa } = useData();
  const { hasPermission } = useAuth();
  const puedeEditar = hasPermission('Configuracion', 'editar');
  const [form, setForm] = useState(empresa.value);
  const [saved, setSaved] = useState(false);

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
        <h2 className="mb-4 text-sm font-semibold text-ink-100">Logotipo</h2>
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
        <h2 className="mb-4 text-sm font-semibold text-ink-100">Datos de la empresa</h2>
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
