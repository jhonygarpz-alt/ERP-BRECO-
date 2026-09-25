import { useState } from 'react';
import { Ban, Building2, KeyRound, Power, UserPlus, Users } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { crearUsuarioAuth } from '../../lib/crearUsuario';
import { resetearPasswordUsuario } from '../../lib/resetearPassword';
import { uid } from '../../lib/storage';
import { DEFAULT_ALERTAS_VENCIMIENTOS } from '../../lib/alertasVencimientosConfig';
import type { Empresa, Modulo, PermisoModulo, Rol, Usuario } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, IconButton, Input, PrimaryButton } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const modulos: Modulo[] = [
  'Catalogos',
  'Flota',
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

// "Configuracion" siempre esta disponible para que el administrador de la
// empresa pueda gestionar su cuenta -- no se ofrece como modulo contratable.
const modulosContratables = modulos.filter((m) => m !== 'Configuracion');
const MODULO_LABELS: Partial<Record<Modulo, string>> = {
  Flota: 'Flota Digital 360',
  Monitoreo: 'Monitoreo',
  Cobranza: 'Cobranza',
  Banco: 'Banco',
  Mantenimiento: 'Mantenimiento',
  Almacen: 'Almacen',
};
const etiquetaModulo = (m: Modulo) => MODULO_LABELS[m] ?? m;

function permisos(...habilitados: Modulo[]): Record<Modulo, PermisoModulo> {
  return modulos.reduce(
    (acc, m) => ({ ...acc, [m]: { ver: habilitados.includes(m), crear: habilitados.includes(m), editar: habilitados.includes(m), eliminar: habilitados.includes(m) } }),
    {} as Record<Modulo, PermisoModulo>,
  );
}

// Mismos 3 roles de fabrica que trae cualquier empresa nueva (calcados de
// supabase/schema.sql), sembrados con el empresa_id de la empresa recien
// creada.
function rolesDeFabrica(empresaId: string): Rol[] {
  return [
    {
      id: `${empresaId}-rol-admin`,
      nombre: 'Administrador',
      descripcion: 'Acceso total al sistema, incluyendo configuracion.',
      permisos: permisos(...modulos),
      empresaId,
    },
    {
      id: `${empresaId}-rol-trafico`,
      nombre: 'Jefe de Trafico',
      descripcion: 'Gestiona catalogos, viajes y programa diario.',
      permisos: permisos('Catalogos', 'Viajes', 'Programa', 'Monitoreo'),
      empresaId,
    },
    {
      id: `${empresaId}-rol-facturacion`,
      nombre: 'Facturacion',
      descripcion: 'Gestiona la facturacion diaria; consulta el resto.',
      permisos: permisos('Facturacion'),
      empresaId,
    },
  ];
}

interface FormEmpresa {
  nombre: string;
  rfc: string;
  telefono: string;
  email: string;
  licenciasContratadas: string;
  costoPorLicencia: string;
  modulosContratados: Modulo[];
}

const emptyFormEmpresa: FormEmpresa = {
  nombre: '',
  rfc: '',
  telefono: '',
  email: '',
  licenciasContratadas: '1',
  costoPorLicencia: '0',
  modulosContratados: [...modulosContratables],
};

function ModulosCheckboxes({
  seleccionados,
  onToggle,
}: {
  seleccionados: Modulo[];
  onToggle: (m: Modulo) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-line-800 p-3 sm:grid-cols-3">
      {modulosContratables.map((m) => (
        <label key={m} className="flex items-center gap-2 text-sm text-ink-300">
          <input
            type="checkbox"
            checked={seleccionados.includes(m)}
            onChange={() => onToggle(m)}
            className="h-4 w-4 rounded border-line-600 bg-bg-900 accent-breco-500"
          />
          {etiquetaModulo(m)}
        </label>
      ))}
    </div>
  );
}

export function EmpresasSection() {
  const { empresas, roles, usuarios } = useData();

  const [modalNuevaOpen, setModalNuevaOpen] = useState(false);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');
  const emptyNueva = { ...emptyFormEmpresa, adminNombre: '', adminEmail: '', adminPassword: '' };
  const [formNueva, setFormNueva] = useState(emptyNueva);

  const [empresaEditando, setEmpresaEditando] = useState<Empresa | null>(null);
  const [formEditar, setFormEditar] = useState<FormEmpresa>(emptyFormEmpresa);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const [empresaUsuarios, setEmpresaUsuarios] = useState<Empresa | null>(null);
  const [usuarioReset, setUsuarioReset] = useState<Usuario | null>(null);
  const [passwordNueva, setPasswordNueva] = useState('');
  const [reseteando, setReseteando] = useState(false);
  const [mensajeReset, setMensajeReset] = useState('');

  function openNew() {
    setFormNueva(emptyNueva);
    setError('');
    setModalNuevaOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCreando(true);
    try {
      const empresaId = uid('emp');

      const resultado = await crearUsuarioAuth(formNueva.adminEmail.trim(), formNueva.adminPassword);
      if ('error' in resultado) {
        setError(resultado.error);
        return;
      }
      const nuevoUid = resultado.id;

      const nuevaEmpresa: Empresa = {
        id: empresaId,
        nombre: formNueva.nombre,
        razonSocial: '',
        rfc: formNueva.rfc,
        regimenFiscal: '',
        direccion: '',
        telefono: formNueva.telefono,
        email: formNueva.email,
        sitioWeb: '',
        logoDataUrl: '',
        estatus: 'activa',
        csfStoragePath: '',
        alertasVencimientos: DEFAULT_ALERTAS_VENCIMIENTOS,
        licenciasContratadas: Number(formNueva.licenciasContratadas) || 1,
        costoPorLicencia: Number(formNueva.costoPorLicencia) || 0,
        modulosContratados: formNueva.modulosContratados,
      };
      await empresas.add(nuevaEmpresa);

      for (const rol of rolesDeFabrica(empresaId)) {
        await roles.add(rol);
      }

      await usuarios.add({
        id: nuevoUid,
        nombre: formNueva.adminNombre,
        email: formNueva.adminEmail.trim(),
        telefono: '',
        rolId: `${empresaId}-rol-admin`,
        estatus: 'activo',
        empresaId,
      });

      setModalNuevaOpen(false);
      alert(`Empresa creada. Su administrador ya puede iniciar sesion con ${formNueva.adminEmail.trim()} y la contrasena capturada.`);
    } finally {
      setCreando(false);
    }
  }

  function openEditar(e: Empresa) {
    setEmpresaEditando(e);
    setFormEditar({
      nombre: e.nombre,
      rfc: e.rfc,
      telefono: e.telefono,
      email: e.email,
      licenciasContratadas: String(e.licenciasContratadas),
      costoPorLicencia: String(e.costoPorLicencia),
      modulosContratados: e.modulosContratados.length > 0 ? e.modulosContratados : [...modulosContratables],
    });
  }

  async function handleGuardarEdicion(e: React.FormEvent) {
    e.preventDefault();
    if (!empresaEditando) return;
    setGuardandoEdicion(true);
    try {
      await empresas.update(empresaEditando.id, {
        nombre: formEditar.nombre,
        rfc: formEditar.rfc,
        telefono: formEditar.telefono,
        email: formEditar.email,
        licenciasContratadas: Number(formEditar.licenciasContratadas) || 1,
        costoPorLicencia: Number(formEditar.costoPorLicencia) || 0,
        modulosContratados: formEditar.modulosContratados,
      });
      setEmpresaEditando(null);
    } finally {
      setGuardandoEdicion(false);
    }
  }

  async function toggleSuspendida(e: Empresa) {
    const suspender = e.estatus !== 'suspendida';
    const mensaje = suspender
      ? `Suspender el servicio de "${e.nombre}"? Sus usuarios no podran usar el sistema hasta que se reactive.`
      : `Reactivar el servicio de "${e.nombre}"?`;
    if (!confirm(mensaje)) return;
    await empresas.update(e.id, { estatus: suspender ? 'suspendida' : 'activa' });
  }

  function toggleModuloNueva(m: Modulo) {
    setFormNueva((f) => ({
      ...f,
      modulosContratados: f.modulosContratados.includes(m) ? f.modulosContratados.filter((x) => x !== m) : [...f.modulosContratados, m],
    }));
  }

  function toggleModuloEditar(m: Modulo) {
    setFormEditar((f) => ({
      ...f,
      modulosContratados: f.modulosContratados.includes(m) ? f.modulosContratados.filter((x) => x !== m) : [...f.modulosContratados, m],
    }));
  }

  function openResetPassword(u: Usuario) {
    setUsuarioReset(u);
    setPasswordNueva('');
    setMensajeReset('');
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!usuarioReset) return;
    setReseteando(true);
    setMensajeReset('');
    try {
      const resultado = await resetearPasswordUsuario(usuarioReset.id, passwordNueva);
      if ('error' in resultado) {
        setMensajeReset(resultado.error);
        return;
      }
      setMensajeReset(`Listo. Comparte la nueva contrasena con ${usuarioReset.nombre} (${usuarioReset.email}).`);
    } finally {
      setReseteando(false);
    }
  }

  const columns: Column<Empresa>[] = [
    { header: 'Empresa', render: (e) => <span className="font-medium text-ink-100">{e.nombre}</span> },
    { header: 'RFC', render: (e) => e.rfc || 'N/D' },
    {
      header: 'Usuarios',
      render: (e) => {
        const total = usuarios.items.filter((u) => u.empresaId === e.id).length;
        return (
          <span>
            {total} / {e.licenciasContratadas} licencias
          </span>
        );
      },
    },
    {
      header: 'Modulos',
      render: (e) => (
        <div className="flex max-w-xs flex-wrap gap-1">
          {e.modulosContratados.length === 0 ? (
            <span className="rounded-full border border-line-700 bg-bg-900 px-2 py-0.5 text-[11px] text-ink-400">Todos</span>
          ) : (
            e.modulosContratados.map((m) => (
              <span key={m} className="rounded-full border border-line-700 bg-bg-900 px-2 py-0.5 text-[11px] text-ink-400">
                {etiquetaModulo(m)}
              </span>
            ))
          )}
        </div>
      ),
    },
    {
      header: 'Costo mensual',
      render: (e) => `$${(e.costoPorLicencia * e.licenciasContratadas).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
    },
    {
      header: 'Estatus',
      render: (e) => (
        <StatusBadge status={e.estatus} tone={e.estatus === 'activa' ? 'green' : e.estatus === 'suspendida' ? 'red' : 'gray'} />
      ),
    },
    {
      header: '',
      render: (e) => (
        <div className="flex justify-end gap-1">
          <IconButton onClick={() => setEmpresaUsuarios(e)} title="Ver usuarios">
            <Users size={15} />
          </IconButton>
          <IconButton
            onClick={() => toggleSuspendida(e)}
            title={e.estatus === 'suspendida' ? 'Reactivar servicio' : 'Suspender servicio'}
            className={e.estatus === 'suspendida' ? 'hover:text-emerald-400' : 'hover:text-breco-500'}
          >
            {e.estatus === 'suspendida' ? <Power size={15} /> : <Ban size={15} />}
          </IconButton>
        </div>
      ),
      className: 'text-right',
    },
  ];

  const usuariosDeEmpresa = empresaUsuarios ? usuarios.items.filter((u) => u.empresaId === empresaUsuarios.id) : [];

  return (
    <div>
      <PageHeader
        title="Empresas"
        subtitle="Torre de control: licencias, modulos contratados, costos y estatus de cada cliente de la plataforma."
        addLabel="Nueva empresa"
        onAdd={openNew}
      />

      <CrudTable
        columns={columns}
        rows={empresas.items}
        keyFn={(e) => e.id}
        onEdit={openEditar}
        onDelete={() => {}}
        canEdit
        canDelete={false}
        emptyMessage="Todavia no hay empresas registradas en la plataforma."
      />

      {modalNuevaOpen && (
        <Modal
          title="Nueva empresa"
          subtitle="Se crea la empresa y su primer usuario administrador en un solo paso"
          onClose={() => setModalNuevaOpen(false)}
          wide
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-card-header font-medium text-ink-100 sm:col-span-2">
              <Building2 size={16} />
              Datos de la empresa
            </div>
            <div className="sm:col-span-2">
              <Field label="Nombre comercial">
                <Input required value={formNueva.nombre} onChange={(e) => setFormNueva({ ...formNueva, nombre: e.target.value })} />
              </Field>
            </div>
            <Field label="RFC">
              <Input value={formNueva.rfc} onChange={(e) => setFormNueva({ ...formNueva, rfc: e.target.value })} />
            </Field>
            <Field label="Telefono">
              <Input value={formNueva.telefono} onChange={(e) => setFormNueva({ ...formNueva, telefono: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Email de la empresa">
                <Input type="email" value={formNueva.email} onChange={(e) => setFormNueva({ ...formNueva, email: e.target.value })} />
              </Field>
            </div>

            <div className="mt-2 flex items-center gap-2 text-card-header font-medium text-ink-100 sm:col-span-2">
              Licenciamiento
            </div>
            <Field label="Licencias contratadas">
              <Input
                type="number"
                min={1}
                required
                value={formNueva.licenciasContratadas}
                onChange={(e) => setFormNueva({ ...formNueva, licenciasContratadas: e.target.value })}
              />
            </Field>
            <Field label="Costo por licencia (MXN/mes)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={formNueva.costoPorLicencia}
                onChange={(e) => setFormNueva({ ...formNueva, costoPorLicencia: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Modulos contratados">
                <ModulosCheckboxes seleccionados={formNueva.modulosContratados} onToggle={toggleModuloNueva} />
              </Field>
            </div>

            <div className="mt-2 flex items-center gap-2 text-card-header font-medium text-ink-100 sm:col-span-2">
              <UserPlus size={16} />
              Primer usuario administrador
            </div>
            <div className="sm:col-span-2">
              <Field label="Nombre completo">
                <Input
                  required
                  value={formNueva.adminNombre}
                  onChange={(e) => setFormNueva({ ...formNueva, adminNombre: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Email">
              <Input
                type="email"
                required
                value={formNueva.adminEmail}
                onChange={(e) => setFormNueva({ ...formNueva, adminEmail: e.target.value })}
              />
            </Field>
            <Field label="Contrasena temporal">
              <Input
                type="text"
                required
                minLength={6}
                placeholder="Minimo 6 caracteres"
                value={formNueva.adminPassword}
                onChange={(e) => setFormNueva({ ...formNueva, adminPassword: e.target.value })}
              />
            </Field>

            {error && <p className="text-sm text-breco-500 sm:col-span-2">{error}</p>}

            <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
              <GhostButton type="button" onClick={() => setModalNuevaOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit" disabled={creando}>
                {creando ? 'Creando...' : 'Crear empresa'}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {empresaEditando && (
        <Modal
          title={`Editar empresa: ${empresaEditando.nombre}`}
          subtitle="Datos de contacto, licenciamiento y modulos contratados"
          onClose={() => setEmpresaEditando(null)}
          wide
        >
          <form onSubmit={handleGuardarEdicion} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Nombre comercial">
                <Input required value={formEditar.nombre} onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })} />
              </Field>
            </div>
            <Field label="RFC">
              <Input value={formEditar.rfc} onChange={(e) => setFormEditar({ ...formEditar, rfc: e.target.value })} />
            </Field>
            <Field label="Telefono">
              <Input value={formEditar.telefono} onChange={(e) => setFormEditar({ ...formEditar, telefono: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Email de la empresa">
                <Input type="email" value={formEditar.email} onChange={(e) => setFormEditar({ ...formEditar, email: e.target.value })} />
              </Field>
            </div>

            <Field label="Licencias contratadas">
              <Input
                type="number"
                min={1}
                required
                value={formEditar.licenciasContratadas}
                onChange={(e) => setFormEditar({ ...formEditar, licenciasContratadas: e.target.value })}
              />
            </Field>
            <Field label="Costo por licencia (MXN/mes)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={formEditar.costoPorLicencia}
                onChange={(e) => setFormEditar({ ...formEditar, costoPorLicencia: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Modulos contratados">
                <ModulosCheckboxes seleccionados={formEditar.modulosContratados} onToggle={toggleModuloEditar} />
              </Field>
            </div>

            <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
              <GhostButton type="button" onClick={() => setEmpresaEditando(null)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit" disabled={guardandoEdicion}>
                {guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {empresaUsuarios && (
        <Modal
          title={`Usuarios de ${empresaUsuarios.nombre}`}
          subtitle={`${usuariosDeEmpresa.length} de ${empresaUsuarios.licenciasContratadas} licencias contratadas`}
          onClose={() => setEmpresaUsuarios(null)}
          wide
        >
          <div className="overflow-hidden rounded-xl border border-line-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line-800 bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                  <th className="px-3 py-2 font-medium">Nombre</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Estatus</th>
                  <th className="px-3 py-2 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosDeEmpresa.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-ink-600">
                      Esta empresa todavia no tiene usuarios.
                    </td>
                  </tr>
                )}
                {usuariosDeEmpresa.map((u) => (
                  <tr key={u.id} className="border-b border-line-800/70 last:border-0">
                    <td className="px-3 py-2 text-ink-300">{u.nombre}</td>
                    <td className="px-3 py-2 text-ink-300">{u.email}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={u.estatus} tone={u.estatus === 'activo' ? 'green' : 'gray'} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <IconButton onClick={() => openResetPassword(u)} title="Restablecer contrasena">
                        <KeyRound size={15} />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {usuarioReset && (
        <Modal
          title={`Restablecer contrasena: ${usuarioReset.nombre}`}
          subtitle={usuarioReset.email}
          onClose={() => setUsuarioReset(null)}
        >
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Field label="Contrasena nueva">
              <Input
                type="text"
                required
                minLength={6}
                placeholder="Minimo 6 caracteres"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
              />
            </Field>
            {mensajeReset && <p className="text-sm text-ink-300">{mensajeReset}</p>}
            <div className="flex justify-end gap-2">
              <GhostButton type="button" onClick={() => setUsuarioReset(null)}>
                Cerrar
              </GhostButton>
              <PrimaryButton type="submit" disabled={reseteando}>
                {reseteando ? 'Guardando...' : 'Restablecer'}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
