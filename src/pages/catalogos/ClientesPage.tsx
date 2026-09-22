import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { useColoniasPorCP } from '../../lib/useColoniasPorCP';
import { uid } from '../../lib/storage';
import {
  descargarPlantillaClientes,
  guardarClientesImportados,
  leerClientesExcel,
  marcarDuplicadosClientes,
} from '../../lib/excelImportClientes';
import type { Cliente, ClienteContacto } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { ImportarCatalogoModal } from '../../components/catalogos/ImportarCatalogoModal';
import { Field, GhostButton, IconButton, Input, PrimaryButton, Select } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

// Mismos nombres oficiales que usa el Catalogo Nacional de Codigos Postales
// (Correos de Mexico), para que el autocompletado por C.P. siempre calce con
// una opcion de este selector.
const ESTADOS_MEXICO = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
  'Ciudad de México', 'Coahuila de Zaragoza', 'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo',
  'Jalisco', 'México', 'Michoacán de Ocampo', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla',
  'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala',
  'Veracruz de Ignacio de la Llave', 'Yucatán', 'Zacatecas',
];

const emptyContacto: ClienteContacto = { nombre: '', puesto: '', telefono: '', celular: '', correo: '', principal: false };

const emptyForm: Omit<Cliente, 'id'> = {
  numeroCliente: '',
  nombre: '',
  nombreCorto: '',
  fechaAlta: new Date().toISOString().slice(0, 10),
  rfc: '',
  tipo: 'Nacional',
  moneda: 'MXN',
  iva: 'IVA 16%',
  grupo: '',
  sucursal: 'Matriz',
  estatus: 'activo',
  operadorLogistico: false,
  aplicarDetalleViajeXml: false,
  pais: 'Mexico',
  cp: '',
  estado: '',
  municipio: '',
  colonia: '',
  localidad: '',
  calle: '',
  numeroExterior: '',
  numeroInterior: '',
  telefonos: '',
  celular: '',
  correo: '',
  contactos: [],
  formaPago: 'Efectivo',
  diasCredito: 0,
  limiteCreditoMxn: 0,
  limiteCreditoUsd: 0,
  limitarViajes: false,
  limiteFacturasVencidas: null,
  bancoOrdenante: '',
  bancoOrdenanteExtranjero: false,
  bancoRfc: '',
  bancoNoCuenta: '',
};

function money(n: number, moneda: 'MXN' | 'USD') {
  return n.toLocaleString('es-MX', { style: 'currency', currency: moneda });
}

export function ClientesPage() {
  const { clientes, facturas, viajes } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Catalogos', 'crear');
  const puedeEditar = hasPermission('Catalogos', 'editar');
  const puedeEliminar = hasPermission('Catalogos', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [contactoForm, setContactoForm] = useState<ClienteContacto | null>(null);
  const [contactoEditIndex, setContactoEditIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [importarOpen, setImportarOpen] = useState(false);
  const coloniasSugeridas = useColoniasPorCP(form.cp);

  /** Numero de cliente y RFC (los datos obligatorios que identifican al cliente) no se pueden repetir dentro de la misma empresa. */
  function buscarDuplicado(): string | null {
    const numero = form.numeroCliente.trim();
    const rfc = form.rfc.trim().toUpperCase();
    const otros = clientes.items.filter((c) => c.id !== editing?.id);
    if (numero && otros.some((c) => c.numeroCliente === numero)) return `Ya existe un cliente con el numero ${numero}.`;
    if (rfc && otros.some((c) => c.rfc.trim().toUpperCase() === rfc)) return `Ya existe un cliente con el RFC ${rfc}.`;
    return null;
  }

  useEffect(() => {
    if (coloniasSugeridas.length > 0) {
      setForm((f) => ({ ...f, estado: coloniasSugeridas[0].estado, municipio: coloniasSugeridas[0].municipio }));
    }
  }, [coloniasSugeridas]);

  const filtered = useMemo(
    () =>
      clientes.items.filter((c) =>
        `${c.nombre} ${c.rfc} ${c.numeroCliente}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [clientes.items, search],
  );

  const saldos = useMemo(() => {
    if (!editing) return null;
    const facturasCliente = facturas.items.filter((f) => f.clienteId === editing.id);
    const porCobrar = { MXN: 0, USD: 0 };
    for (const f of facturasCliente) {
      if (f.estatus !== 'Pagado' && f.estatus !== 'Cancelado') porCobrar[f.moneda] += f.importe;
    }
    const viajesFacturados = new Set(facturasCliente.map((f) => f.viajeId));
    const viajesPendientes = viajes.items.filter(
      (v) => v.clienteId === editing.id && v.estatus !== 'Cancelado' && !viajesFacturados.has(v.id),
    ).length;
    return { porCobrar, viajesPendientes };
  }, [editing, facturas.items, viajes.items]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(c: Cliente) {
    setEditing(c);
    setForm(c);
    setError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setContactoForm(null);
    setContactoEditIndex(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const duplicado = buscarDuplicado();
    if (duplicado) {
      setError(duplicado);
      return;
    }
    setError('');
    if (editing) {
      clientes.update(editing.id, form);
    } else {
      clientes.add({ id: uid('cli'), ...form });
    }
    closeModal();
  }

  function handleDelete(c: Cliente) {
    if (confirm(`Eliminar al cliente "${c.nombre}"?`)) clientes.remove(c.id);
  }

  function guardarContacto() {
    if (!contactoForm) return;
    const lista = [...form.contactos];
    if (contactoEditIndex !== null) lista[contactoEditIndex] = contactoForm;
    else lista.push(contactoForm);
    setForm({ ...form, contactos: lista });
    setContactoForm(null);
    setContactoEditIndex(null);
  }

  function eliminarContacto(index: number) {
    setForm({ ...form, contactos: form.contactos.filter((_, i) => i !== index) });
  }

  const columns: Column<Cliente>[] = [
    { header: 'Nro Cliente', render: (c) => <span className="font-mono text-xs text-ink-500">{c.numeroCliente}</span> },
    { header: 'Tipo Cliente', render: (c) => c.tipo },
    { header: 'RFC', render: (c) => c.rfc },
    { header: 'Nombre', render: (c) => <span className="font-medium text-ink-100">{c.nombre}</span> },
    {
      header: 'Activo',
      render: (c) => <StatusBadge status={c.estatus === 'activo' ? 'Si' : 'No'} tone={c.estatus === 'activo' ? 'green' : 'red'} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Catalogo de clientes que solicitan servicios de transporte."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por numero, nombre o RFC..."
        addLabel="Agregar"
        onAdd={puedeCrear ? openNew : undefined}
        extra={
          puedeCrear && (
            <GhostButton type="button" onClick={() => setImportarOpen(true)}>
              <Upload size={14} />
              Importar
            </GhostButton>
          )
        }
      />

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(c) => c.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
      />

      {modalOpen && (
        <Modal
          title={editing ? 'Editando cliente' : 'Agregando cliente'}
          onClose={closeModal}
          wide="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-breco-500">Datos Generales</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Numero Cliente">
                  <Input
                    value={form.numeroCliente}
                    placeholder="Dejar en blanco para autoasignar"
                    onChange={(e) => setForm({ ...form, numeroCliente: e.target.value })}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Nombre Fiscal">
                    <Input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                  </Field>
                </div>
                <Field label="Nombre Corto">
                  <Input value={form.nombreCorto} onChange={(e) => setForm({ ...form, nombreCorto: e.target.value })} />
                </Field>
                <Field label="Fecha de alta">
                  <Input type="date" required value={form.fechaAlta} onChange={(e) => setForm({ ...form, fechaAlta: e.target.value })} />
                </Field>
                <Field label="RFC">
                  <Input required value={form.rfc} onChange={(e) => setForm({ ...form, rfc: e.target.value.toUpperCase() })} />
                </Field>
                <Field label="Tipo Cliente">
                  <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as Cliente['tipo'] })}>
                    <option value="Nacional">Nacional</option>
                    <option value="Extranjero">Extranjero</option>
                  </Select>
                </Field>
                <Field label="Moneda">
                  <Select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value as Cliente['moneda'] })}>
                    <option value="MXN">Pesos</option>
                    <option value="USD">Dolares</option>
                  </Select>
                </Field>
                <Field label="IVA">
                  <Select value={form.iva} onChange={(e) => setForm({ ...form, iva: e.target.value as Cliente['iva'] })}>
                    <option value="IVA 16%">IVA 16%</option>
                    <option value="IVA 0%">IVA 0%</option>
                    <option value="Exento">Exento</option>
                  </Select>
                </Field>
                <Field label="Grupo">
                  <Input value={form.grupo} onChange={(e) => setForm({ ...form, grupo: e.target.value })} />
                </Field>
                <Field label="Sucursal">
                  <Input required value={form.sucursal} onChange={(e) => setForm({ ...form, sucursal: e.target.value })} />
                </Field>
                <div className="flex flex-wrap items-center gap-5 sm:col-span-3">
                  <label className="flex items-center gap-2 text-sm text-ink-300">
                    <input
                      type="checkbox"
                      checked={form.estatus === 'activo'}
                      onChange={(e) => setForm({ ...form, estatus: e.target.checked ? 'activo' : 'inactivo' })}
                    />
                    Activo
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink-300">
                    <input
                      type="checkbox"
                      checked={form.operadorLogistico}
                      onChange={(e) => setForm({ ...form, operadorLogistico: e.target.checked })}
                    />
                    Operador Logistico
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink-300">
                    <input
                      type="checkbox"
                      checked={form.aplicarDetalleViajeXml}
                      onChange={(e) => setForm({ ...form, aplicarDetalleViajeXml: e.target.checked })}
                    />
                    Aplicar en el XML de la factura, el detalle por viaje
                  </label>
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-breco-500">Domicilio</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Pais">
                  <Input required value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })} />
                </Field>
                <Field label="C.P.">
                  <Input
                    value={form.cp}
                    maxLength={5}
                    onChange={(e) => setForm({ ...form, cp: e.target.value.replace(/\D/g, '') })}
                  />
                </Field>
                <Field label="Estado">
                  <Select required value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                    <option value="">Selecciona...</option>
                    {ESTADOS_MEXICO.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Municipio">
                  <Input required value={form.municipio} onChange={(e) => setForm({ ...form, municipio: e.target.value })} />
                </Field>
                <Field label="Colonia">
                  {coloniasSugeridas.length > 0 ? (
                    <Select value={form.colonia} onChange={(e) => setForm({ ...form, colonia: e.target.value })}>
                      <option value="">Selecciona...</option>
                      {coloniasSugeridas.map((c) => (
                        <option key={c.colonia} value={c.colonia}>{c.colonia}</option>
                      ))}
                    </Select>
                  ) : (
                    <Input value={form.colonia} onChange={(e) => setForm({ ...form, colonia: e.target.value })} />
                  )}
                </Field>
                <Field label="Localidad">
                  <Input value={form.localidad} onChange={(e) => setForm({ ...form, localidad: e.target.value })} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Calle">
                    <Input required value={form.calle} onChange={(e) => setForm({ ...form, calle: e.target.value })} />
                  </Field>
                </div>
                <Field label="No. Exterior">
                  <Input value={form.numeroExterior} onChange={(e) => setForm({ ...form, numeroExterior: e.target.value })} />
                </Field>
                <Field label="No. Interior">
                  <Input value={form.numeroInterior} onChange={(e) => setForm({ ...form, numeroInterior: e.target.value })} />
                </Field>
                <Field label="Telefonos">
                  <Input value={form.telefonos} onChange={(e) => setForm({ ...form, telefonos: e.target.value })} />
                </Field>
                <Field label="Celular">
                  <Input value={form.celular} onChange={(e) => setForm({ ...form, celular: e.target.value })} />
                </Field>
                <Field label="Correo">
                  <Input type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
                </Field>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-breco-500">Contactos</h3>
                <GhostButton
                  type="button"
                  onClick={() => {
                    setContactoEditIndex(null);
                    setContactoForm(emptyContacto);
                  }}
                >
                  <Plus size={14} />
                  Agregar
                </GhostButton>
              </div>
              <div className="overflow-hidden rounded-xl border border-line-800">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line-800 bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                      <th className="px-3 py-2 font-medium">Nombre</th>
                      <th className="px-3 py-2 font-medium">Puesto</th>
                      <th className="px-3 py-2 font-medium">Telefono</th>
                      <th className="px-3 py-2 font-medium">Celular</th>
                      <th className="px-3 py-2 font-medium">Correo</th>
                      <th className="px-3 py-2 font-medium">Principal</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {form.contactos.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-ink-600">No hay contactos registrados.</td>
                      </tr>
                    )}
                    {form.contactos.map((ct, i) => (
                      <tr key={i} className="border-b border-line-800/70 last:border-0">
                        <td className="px-3 py-2 text-ink-200">{ct.nombre}</td>
                        <td className="px-3 py-2 text-ink-400">{ct.puesto}</td>
                        <td className="px-3 py-2 text-ink-400">{ct.telefono}</td>
                        <td className="px-3 py-2 text-ink-400">{ct.celular}</td>
                        <td className="px-3 py-2 text-ink-400">{ct.correo}</td>
                        <td className="px-3 py-2 text-ink-400">{ct.principal ? 'Si' : ''}</td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1">
                            <IconButton
                              type="button"
                              onClick={() => {
                                setContactoEditIndex(i);
                                setContactoForm(ct);
                              }}
                            >
                              <Pencil size={14} />
                            </IconButton>
                            <IconButton type="button" onClick={() => eliminarContacto(i)} className="hover:text-breco-500">
                              <Trash2 size={14} />
                            </IconButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {contactoForm && (
                <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-line-700 bg-bg-900 p-4 sm:grid-cols-3">
                  <Field label="Nombre">
                    <Input
                      required
                      value={contactoForm.nombre}
                      onChange={(e) => setContactoForm({ ...contactoForm, nombre: e.target.value })}
                    />
                  </Field>
                  <Field label="Puesto">
                    <Input value={contactoForm.puesto} onChange={(e) => setContactoForm({ ...contactoForm, puesto: e.target.value })} />
                  </Field>
                  <Field label="Telefono">
                    <Input value={contactoForm.telefono} onChange={(e) => setContactoForm({ ...contactoForm, telefono: e.target.value })} />
                  </Field>
                  <Field label="Celular">
                    <Input value={contactoForm.celular} onChange={(e) => setContactoForm({ ...contactoForm, celular: e.target.value })} />
                  </Field>
                  <Field label="Correo">
                    <Input
                      type="email"
                      required
                      value={contactoForm.correo}
                      onChange={(e) => setContactoForm({ ...contactoForm, correo: e.target.value })}
                    />
                  </Field>
                  <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-300">
                    <input
                      type="checkbox"
                      checked={contactoForm.principal}
                      onChange={(e) => setContactoForm({ ...contactoForm, principal: e.target.checked })}
                    />
                    Principal
                  </label>
                  <div className="flex justify-end gap-2 sm:col-span-3">
                    <GhostButton type="button" onClick={() => { setContactoForm(null); setContactoEditIndex(null); }}>
                      Cancelar
                    </GhostButton>
                    <PrimaryButton type="button" onClick={guardarContacto}>
                      Guardar contacto
                    </PrimaryButton>
                  </div>
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-breco-500">Pagos / Creditos</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Forma de Pago">
                  <Select value={form.formaPago} onChange={(e) => setForm({ ...form, formaPago: e.target.value })}>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Cheque">Cheque</option>
                  </Select>
                </Field>
                <Field label="Dias Credito">
                  <Input
                    type="number"
                    min={0}
                    value={form.diasCredito}
                    onChange={(e) => setForm({ ...form, diasCredito: Number(e.target.value) })}
                  />
                </Field>
                <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-300">
                  <input
                    type="checkbox"
                    checked={form.limitarViajes}
                    onChange={(e) => setForm({ ...form, limitarViajes: e.target.checked })}
                  />
                  Limitar viajes
                </label>
                <Field label="Limite Credito (Pesos)">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.limiteCreditoMxn}
                    onChange={(e) => setForm({ ...form, limiteCreditoMxn: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Limite Credito (Dolares)">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.limiteCreditoUsd}
                    onChange={(e) => setForm({ ...form, limiteCreditoUsd: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Limite de facturas vencidas">
                  <Input
                    type="number"
                    min={0}
                    disabled={!form.limitarViajes}
                    value={form.limiteFacturasVencidas ?? ''}
                    onChange={(e) => setForm({ ...form, limiteFacturasVencidas: e.target.value ? Number(e.target.value) : null })}
                  />
                </Field>
                {editing && saldos && (
                  <>
                    <Field label="Saldo Facturado X Cobrar">
                      <Input disabled value={`${money(saldos.porCobrar.MXN, 'MXN')} / ${money(saldos.porCobrar.USD, 'USD')}`} />
                    </Field>
                    <Field label="Viajes Pend. Facturar">
                      <Input disabled value={`${saldos.viajesPendientes} viajes`} />
                    </Field>
                  </>
                )}
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-breco-500">Informacion Adicional del Pago</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Field label="Banco Ordenante">
                    <Input value={form.bancoOrdenante} onChange={(e) => setForm({ ...form, bancoOrdenante: e.target.value })} />
                  </Field>
                </div>
                <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-300">
                  <input
                    type="checkbox"
                    checked={form.bancoOrdenanteExtranjero}
                    onChange={(e) => setForm({ ...form, bancoOrdenanteExtranjero: e.target.checked })}
                  />
                  Banco Ordenante Extranjero
                </label>
                <Field label="RFC (cuenta bancaria)">
                  <Input value={form.bancoRfc} onChange={(e) => setForm({ ...form, bancoRfc: e.target.value.toUpperCase() })} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="No. Cuenta">
                    <Input value={form.bancoNoCuenta} onChange={(e) => setForm({ ...form, bancoNoCuenta: e.target.value })} />
                  </Field>
                </div>
              </div>
            </section>

            <div className="flex items-center justify-end gap-3 border-t border-line-800 pt-4">
              {error && <p className="flex-1 text-sm text-breco-500">{error}</p>}
              <GhostButton type="button" onClick={closeModal}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit">{editing ? 'Guardar cambios' : 'Aceptar'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {importarOpen && (
        <ImportarCatalogoModal<Cliente>
          titulo="Importar Clientes"
          nombrePlural="clientes"
          descargarPlantilla={descargarPlantillaClientes}
          leerArchivo={leerClientesExcel}
          marcarDuplicados={marcarDuplicadosClientes}
          existentes={clientes.items}
          guardar={guardarClientesImportados}
          columnasPreview={[
            { header: 'Numero', render: (c) => c.numeroCliente || '(auto)' },
            { header: 'Nombre Fiscal', render: (c) => c.nombre },
            { header: 'RFC', render: (c) => c.rfc },
            { header: 'Tipo', render: (c) => c.tipo },
          ]}
          onClose={() => setImportarOpen(false)}
          onImportado={() => clientes.reload()}
        />
      )}
    </div>
  );
}
