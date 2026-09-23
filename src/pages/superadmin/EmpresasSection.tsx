import { useState } from 'react';
import { Building2, UserPlus } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { supabaseAuthAlta } from '../../lib/supabaseClient';
import { mensajeDeError } from '../../lib/errors';
import { uid } from '../../lib/storage';
import type { Empresa, Modulo, PermisoModulo, Rol } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { Field, GhostButton, Input, PrimaryButton } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const modulos: Modulo[] = ['Catalogos', 'Viajes', 'Facturacion', 'Programa', 'Monitoreo', 'Reportes', 'Configuracion'];

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

export function EmpresasSection() {
  const { empresas, roles, usuarios } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');

  const emptyForm = {
    nombre: '',
    rfc: '',
    telefono: '',
    email: '',
    adminNombre: '',
    adminEmail: '',
    adminPassword: '',
  };
  const [form, setForm] = useState(emptyForm);

  function openNew() {
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCreando(true);
    try {
      const empresaId = uid('emp');

      const { data, error: errAuth } = await supabaseAuthAlta.auth.signUp({
        email: form.adminEmail.trim(),
        password: form.adminPassword,
      });
      if (errAuth) {
        setError(mensajeDeError(errAuth));
        return;
      }
      const nuevoUid = data.user?.id;
      if (!nuevoUid) {
        setError('Supabase no devolvio el usuario creado. Intenta de nuevo.');
        return;
      }

      const nuevaEmpresa: Empresa = {
        id: empresaId,
        nombre: form.nombre,
        razonSocial: '',
        rfc: form.rfc,
        direccion: '',
        telefono: form.telefono,
        email: form.email,
        sitioWeb: '',
        logoDataUrl: '',
        estatus: 'activa',
        csfStoragePath: '',
      };
      await empresas.add(nuevaEmpresa);

      for (const rol of rolesDeFabrica(empresaId)) {
        await roles.add(rol);
      }

      await usuarios.add({
        id: nuevoUid,
        nombre: form.adminNombre,
        email: form.adminEmail.trim(),
        telefono: '',
        rolId: `${empresaId}-rol-admin`,
        estatus: 'activo',
        empresaId,
      });

      setModalOpen(false);
      alert(
        data.session
          ? `Empresa creada. Su administrador ya puede iniciar sesion con ${form.adminEmail.trim()} y la contrasena capturada.`
          : `Empresa creada. Supabase le va a pedir a ${form.adminEmail.trim()} confirmar su correo antes de poder iniciar sesion.`,
      );
    } finally {
      setCreando(false);
    }
  }

  const columns: Column<Empresa>[] = [
    { header: 'Empresa', render: (e) => <span className="font-medium text-ink-100">{e.nombre}</span> },
    { header: 'RFC', render: (e) => e.rfc || 'N/D' },
    { header: 'Email', render: (e) => e.email || 'N/D' },
    { header: 'Estatus', render: (e) => <StatusBadge status={e.estatus} tone={e.estatus === 'activa' ? 'green' : 'red'} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Empresas"
        subtitle="Cada empresa ve y administra solo sus propios datos y usuarios."
        addLabel="Nueva empresa"
        onAdd={openNew}
      />

      <CrudTable
        columns={columns}
        rows={empresas.items}
        keyFn={(e) => e.id}
        onEdit={() => {}}
        onDelete={() => {}}
        canEdit={false}
        canDelete={false}
        emptyMessage="Todavia no hay empresas registradas en la plataforma."
      />

      {modalOpen && (
        <Modal
          title="Nueva empresa"
          subtitle="Se crea la empresa y su primer usuario administrador en un solo paso"
          onClose={() => setModalOpen(false)}
          wide
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink-100 sm:col-span-2">
              <Building2 size={16} />
              Datos de la empresa
            </div>
            <div className="sm:col-span-2">
              <Field label="Nombre comercial">
                <Input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </Field>
            </div>
            <Field label="RFC">
              <Input value={form.rfc} onChange={(e) => setForm({ ...form, rfc: e.target.value })} />
            </Field>
            <Field label="Telefono">
              <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Email de la empresa">
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
            </div>

            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink-100 sm:col-span-2">
              <UserPlus size={16} />
              Primer usuario administrador
            </div>
            <div className="sm:col-span-2">
              <Field label="Nombre completo">
                <Input
                  required
                  value={form.adminNombre}
                  onChange={(e) => setForm({ ...form, adminNombre: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Email">
              <Input
                type="email"
                required
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
              />
            </Field>
            <Field label="Contrasena temporal">
              <Input
                type="text"
                required
                minLength={6}
                placeholder="Minimo 6 caracteres"
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
              />
            </Field>

            {error && <p className="text-sm text-breco-500 sm:col-span-2">{error}</p>}

            <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
              <GhostButton type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit" disabled={creando}>
                {creando ? 'Creando...' : 'Crear empresa'}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
