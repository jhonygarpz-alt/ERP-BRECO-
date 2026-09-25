import { useMemo, useState } from 'react';
import { Bell, Building2, Hash, Palette, Printer, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
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
  const { hasPermission } = useAuth();
  const tabsVisibles = useMemo(
    () => tabs.filter((t) => hasPermission('Configuracion', 'ver', `configuracion:${t.key}`)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasPermission],
  );
  const [tab, setTab] = useState<Tab>(() => tabsVisibles[0]?.key ?? 'empresa');
  const tabActivo = tabsVisibles.some((t) => t.key === tab) ? tab : tabsVisibles[0]?.key;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-100">Configuracion</h1>
        <p className="mt-1 text-sm text-ink-500">Datos de la empresa, usuarios del sistema y sus permisos.</p>
      </div>

      {tabsVisibles.length === 0 ? (
        <p className="text-sm text-ink-500">No tienes acceso a ninguna seccion de configuracion.</p>
      ) : (
        <>
      <div className="mb-6 flex gap-1 border-b border-line-800">
        {tabsVisibles.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tabActivo === t.key
                ? 'border-breco-500 text-ink-100'
                : 'border-transparent text-ink-500 hover:text-ink-100'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {tabActivo === 'empresa' && <EmpresaSection />}
      {tabActivo === 'usuarios' && <UsuariosSection />}
      {tabActivo === 'roles' && <RolesSection />}
      {tabActivo === 'formatos' && <FormatosSection />}
      {tabActivo === 'folios' && <FoliosSection />}
      {tabActivo === 'alertas' && <AlertasVencimientosSection />}
      {tabActivo === 'temas' && <TemasSection />}
      </>
      )}
    </div>
  );
}
