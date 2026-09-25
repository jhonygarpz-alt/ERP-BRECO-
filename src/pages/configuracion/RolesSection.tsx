import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import { pantallasDeModulo } from '../../lib/pantallas';
import type { Modulo, PermisoModulo, Rol } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton } from '../../components/ui/form';

const modulos: Modulo[] = [
  'Catalogos',
  'Viajes',
  'Facturacion',
  'Cobranza',
  'Banco',
  'Mantenimiento',
  'Almacen',
  'Programa',
  'Monitoreo',
  'Reportes',
  'Configuracion',
];
const MODULO_LABELS: Partial<Record<Modulo, string>> = {
  Monitoreo: 'Monitoreo',
  Cobranza: 'Cobranza',
  Banco: 'Banco',
  Mantenimiento: 'Mantenimiento',
  Almacen: 'Almacen',
};
const etiquetaModulo = (m: Modulo) => MODULO_LABELS[m] ?? m;
const acciones: { key: keyof PermisoModulo; label: string }[] = [
  { key: 'ver', label: 'Ver' },
  { key: 'crear', label: 'Crear' },
  { key: 'editar', label: 'Editar' },
  { key: 'eliminar', label: 'Eliminar' },
];

function permisosVacios(): Record<Modulo, PermisoModulo> {
  return modulos.reduce(
    (acc, m) => ({ ...acc, [m]: { ver: false, crear: false, editar: false, eliminar: false } }),
    {} as Record<Modulo, PermisoModulo>,
  );
}

export function RolesSection() {
  const { roles } = useData();
  const { hasPermission, empresaActual } = useAuth();
  const puedeCrear = hasPermission('Configuracion', 'crear');
  const puedeEditar = hasPermission('Configuracion', 'editar');
  const puedeEliminar = hasPermission('Configuracion', 'eliminar');
  // Solo se ofrecen para asignar los modulos que la empresa realmente
  // contrato (Configuracion siempre esta disponible) -- un arreglo vacio en
  // modulosContratados significa "sin restriccion" (todos).
  const modulosVisibles = modulos.filter(
    (m) => m === 'Configuracion' || !empresaActual?.modulosContratados?.length || empresaActual.modulosContratados.includes(m),
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Rol | null>(null);

  const emptyForm: Omit<Rol, 'id'> = { nombre: '', descripcion: '', permisos: permisosVacios() };
  const [form, setForm] = useState(emptyForm);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(r: Rol) {
    setEditing(r);
    setForm(r);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      roles.update(editing.id, form);
    } else {
      roles.add({ id: uid('rol'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(r: Rol) {
    if (confirm(`Eliminar el rol "${r.nombre}"? Los usuarios con este rol quedaran sin rol asignado.`)) {
      roles.remove(r.id);
    }
  }

  function toggle(modulo: Modulo, accion: keyof PermisoModulo) {
    setForm((f) => {
      // Un rol guardado antes de que existiera este modulo (ej. "Monitoreo"
      // reemplazando a "EntregaTurno") no trae esa llave en su JSON de
      // permisos -- sin este respaldo, f.permisos[modulo] es undefined y
      // leer [accion] de ahi tronaba toda la pantalla.
      const actual = f.permisos[modulo] ?? { ver: false, crear: false, editar: false, eliminar: false };
      return {
        ...f,
        permisos: {
          ...f.permisos,
          [modulo]: { ...actual, [accion]: !actual[accion] },
        },
      };
    });
  }

  /** Valor efectivo de una pantalla para una accion: su override si tiene uno, si no el del modulo. */
  function valorPantalla(pantallaId: string, modulo: Modulo, accion: keyof PermisoModulo): boolean {
    const override = form.permisosPantalla?.[pantallaId];
    if (override) return override[accion];
    return form.permisos[modulo]?.[accion] ?? false;
  }

  function togglePantalla(pantallaId: string, modulo: Modulo, accion: keyof PermisoModulo) {
    setForm((f) => {
      const delModulo = f.permisos[modulo] ?? { ver: false, crear: false, editar: false, eliminar: false };
      const actual = f.permisosPantalla?.[pantallaId] ?? delModulo;
      const nuevo = { ...actual, [accion]: !actual[accion] };
      const permisosPantalla = { ...(f.permisosPantalla ?? {}) };
      // Si el override quedo identico al permiso del modulo, se quita -- asi
      // el rol no acumula overrides "fantasma" que en realidad no cambian nada.
      const igualQueModulo =
        nuevo.ver === delModulo.ver && nuevo.crear === delModulo.crear && nuevo.editar === delModulo.editar && nuevo.eliminar === delModulo.eliminar;
      if (igualQueModulo) {
        delete permisosPantalla[pantallaId];
      } else {
        permisosPantalla[pantallaId] = nuevo;
      }
      return { ...f, permisosPantalla };
    });
  }

  const columns: Column<Rol>[] = [
    { header: 'Rol', render: (r) => <span className="font-medium text-ink-100">{r.nombre}</span> },
    { header: 'Descripcion', render: (r) => <span className="text-xs">{r.descripcion}</span> },
    {
      header: 'Modulos con acceso',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {modulosVisibles
            .filter((m) => r.permisos[m]?.ver)
            .map((m) => (
              <span key={m} className="rounded-full border border-line-700 bg-bg-900 px-2 py-0.5 text-[11px] text-ink-400">
                {etiquetaModulo(m)}
              </span>
            ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Roles y permisos"
        subtitle="Que puede ver, crear, editar o eliminar cada rol en cada modulo."
        addLabel="Nuevo rol"
        onAdd={puedeCrear ? openNew : undefined}
      />

      <CrudTable
        columns={columns}
        rows={roles.items}
        keyFn={(r) => r.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
      />

      {modalOpen && (
        <Modal
          title={editing ? `Editar rol: ${editing.nombre}` : 'Nuevo rol'}
          subtitle="Define el nombre y los permisos por modulo"
          onClose={() => setModalOpen(false)}
          wide
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nombre del rol">
                <Input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </Field>
              <Field label="Descripcion">
                <Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </Field>
            </div>

            <div className="overflow-hidden rounded-xl border border-line-800">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line-800 bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                    <th className="px-3 py-2 font-medium">Modulo</th>
                    {acciones.map((a) => (
                      <th key={a.key} className="px-3 py-2 text-center font-medium">
                        {a.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modulosVisibles.map((m) => (
                    <tr key={m} className="border-b border-line-800/70 last:border-0">
                      <td className="px-3 py-2 text-ink-300">{etiquetaModulo(m)}</td>
                      {acciones.map((a) => (
                        <td key={a.key} className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={form.permisos[m]?.[a.key] ?? false}
                            onChange={() => toggle(m, a.key)}
                            className="h-4 w-4 rounded border-line-600 bg-bg-900 accent-breco-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-ink-200">Permisos finos por pantalla (opcional)</p>
              <p className="mb-3 text-xs text-ink-500">
                Por defecto cada pantalla usa el permiso de su modulo (de arriba). Abre un modulo para ocultarle o
                permitirle una pantalla especifica a este rol -- por ejemplo, dar "Catalogos" completo pero ocultar
                "Proveedores". Esto solo controla la interfaz; la seguridad real en la base de datos sigue siendo por
                modulo completo.
              </p>
              <div className="space-y-2">
                {modulosVisibles.map((m) => {
                  const pantallas = pantallasDeModulo(m);
                  if (pantallas.length === 0) return null;
                  return (
                    <details key={m} className="overflow-hidden rounded-xl border border-line-800">
                      <summary className="flex cursor-pointer list-none items-center justify-between bg-bg-700/50 px-3 py-2 text-sm text-ink-200">
                        <span>
                          {etiquetaModulo(m)}{' '}
                          <span className="text-xs text-ink-600">
                            ({pantallas.length} pantalla{pantallas.length === 1 ? '' : 's'}
                            {Object.keys(form.permisosPantalla ?? {}).some((id) => pantallas.some((p) => p.id === id))
                              ? ' · con overrides'
                              : ''}
                            )
                          </span>
                        </span>
                        <ChevronDown size={15} className="text-ink-500" />
                      </summary>
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-t border-line-800 bg-bg-900 text-xs uppercase tracking-wide text-ink-500">
                            <th className="px-3 py-2 font-medium">Pantalla</th>
                            {acciones.map((a) => (
                              <th key={a.key} className="px-3 py-2 text-center font-medium">
                                {a.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pantallas.map((p) => (
                            <tr key={p.id} className="border-b border-line-800/70 last:border-0">
                              <td className="px-3 py-2 text-ink-300">
                                {p.label}
                                {form.permisosPantalla?.[p.id] && <span className="ml-1.5 text-[10px] text-breco-500">(personalizado)</span>}
                              </td>
                              {acciones.map((a) => (
                                <td key={a.key} className="px-3 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={valorPantalla(p.id, m, a.key)}
                                    onChange={() => togglePantalla(p.id, m, a.key)}
                                    className="h-4 w-4 rounded border-line-600 bg-bg-900 accent-breco-500"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </details>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <GhostButton type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit">{editing ? 'Guardar cambios' : 'Crear rol'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
