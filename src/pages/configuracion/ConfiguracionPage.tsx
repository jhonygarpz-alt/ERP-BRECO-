import { useState } from 'react';
import { Bell, Building2, Hash, Palette, Printer, ShieldCheck, Users } from 'lucide-react';
import { EmpresaSection } from './EmpresaSection';
import { UsuariosSection } from './UsuariosSection';
import { RolesSection } from './RolesSection';
import { FormatosSection } from './FormatosSection';
import { FoliosSection } from './FoliosSection';
import { TemasSection } from './TemasSection';
import { AlertasVencimientosSection } from './AlertasVencimientosSection';

type Tab = 'empresa' | 'usuarios' | 'roles' | 'formatos' | 'folios' | 'temas' | 'alertas';

const tabs: { key: Tab; label: string; icon: typeof Building2 }[] = [
  { key: 'empresa', label: 'Informacion de la empresa', icon: Building2 },
  { key: 'usuarios', label: 'Usuarios', icon: Users },
  { key: 'roles', label: 'Roles y permisos', icon: ShieldCheck },
  { key: 'formatos', label: 'Formatos de Impresion', icon: Printer },
  { key: 'folios', label: 'Catalogo de Folios', icon: Hash },
  { key: 'alertas', label: 'Alertas de Vencimientos', icon: Bell },
  { key: 'temas', label: 'Temas', icon: Palette },
];

export function ConfiguracionPage() {
  const [tab, setTab] = useState<Tab>('empresa');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Configuracion</h1>
        <p className="mt-1 text-sm text-ink-500">Datos de la empresa, usuarios del sistema y sus permisos.</p>
      </div>

      <div className="mb-6 flex gap-1 border-b border-line-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t.key
                ? 'border-breco-500 text-ink-100'
                : 'border-transparent text-ink-500 hover:text-ink-100'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'empresa' && <EmpresaSection />}
      {tab === 'usuarios' && <UsuariosSection />}
      {tab === 'roles' && <RolesSection />}
      {tab === 'formatos' && <FormatosSection />}
      {tab === 'folios' && <FoliosSection />}
      {tab === 'alertas' && <AlertasVencimientosSection />}
      {tab === 'temas' && <TemasSection />}
    </div>
  );
}
