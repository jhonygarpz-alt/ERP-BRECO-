import { useMemo, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { uid } from '../../lib/storage';
import { OBJETO_IMPUESTO_SAT } from '../../lib/catalogosSat';
import type { ConceptoFacturacion, ImpuestoConcepto } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { CrudTable, type Column } from '../../components/ui/CrudTable';
import { Modal } from '../../components/ui/Modal';
import { BuscarClaveProdServModal, BuscarClaveUnidadModal } from '../../components/catalogos/BuscarClaveSatModal';
import { Field, GhostButton, Input, PrimaryButton, Select } from '../../components/ui/form';
import { StatusBadge } from '../../components/ui/Badge';

const TRASLADOS_DISPONIBLES = ['IVA 0%', 'IVA 8%', 'IVA 11%', 'IVA 16%'];
const RETENCIONES_DISPONIBLES = ['RETENCION IVA 0%', 'RETENCION IVA 4%'];

function impuestosVacios(lista: string[]): ImpuestoConcepto[] {
  return lista.map((impuesto) => ({ impuesto, aplica: false, predeterminado: false }));
}

function normalizarImpuestos(actuales: ImpuestoConcepto[], disponibles: string[]): ImpuestoConcepto[] {
  return disponibles.map((impuesto) => actuales.find((i) => i.impuesto === impuesto) ?? { impuesto, aplica: false, predeterminado: false });
}

const emptyForm: Omit<ConceptoFacturacion, 'id'> = {
  codigo: '',
  concepto: '',
  activo: true,
  traslados: impuestosVacios(TRASLADOS_DISPONIBLES),
  retenciones: impuestosVacios(RETENCIONES_DISPONIBLES),
  incluirCalculoIngresosLiquidacion: false,
  incluirCalculoLiquidacionPorcentajeFlete: false,
  incluirReporteControlMovimientosInterterminal: false,
  incluirReporteControlMovimientosTransporteGasolina: false,
  claveProdServ: '',
  claveProdServDescripcion: '',
  claveUnidad: '',
  claveUnidadNombre: '',
  unidadMedida: '',
  noIdentificacion: '',
  objetoImpuesto: '',
};

export function ConceptosFacturacionPage() {
  const { conceptosFacturacion } = useData();
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('Catalogos', 'crear');
  const puedeEditar = hasPermission('Catalogos', 'editar');
  const puedeEliminar = hasPermission('Catalogos', 'eliminar');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ConceptoFacturacion | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [buscarProdServOpen, setBuscarProdServOpen] = useState(false);
  const [buscarUnidadOpen, setBuscarUnidadOpen] = useState(false);

  const filtered = useMemo(
    () =>
      conceptosFacturacion.items.filter(
        (c) => c.concepto.toLowerCase().includes(search.toLowerCase()) || c.codigo.toLowerCase().includes(search.toLowerCase()),
      ),
    [conceptosFacturacion.items, search],
  );

  function siguienteCodigo(): string {
    const numeros = conceptosFacturacion.items.map((c) => parseInt(c.codigo, 10)).filter((n) => !Number.isNaN(n));
    return String((numeros.length ? Math.max(...numeros) : 0) + 1);
  }

  function buscarDuplicado(): string | null {
    const codigo = form.codigo.trim();
    const concepto = form.concepto.trim();
    const otros = conceptosFacturacion.items.filter((c) => c.id !== editing?.id);
    if (codigo && otros.some((c) => c.codigo.trim() === codigo)) return `Ya existe un concepto con el codigo "${codigo}".`;
    if (concepto && otros.some((c) => c.concepto.toLowerCase() === concepto.toLowerCase())) {
      return `Ya existe un concepto llamado "${concepto}".`;
    }
    return null;
  }

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, codigo: siguienteCodigo() });
    setError('');
    setModalOpen(true);
  }

  function openEdit(c: ConceptoFacturacion) {
    setEditing(c);
    setForm({
      ...c,
      traslados: normalizarImpuestos(c.traslados, TRASLADOS_DISPONIBLES),
      retenciones: normalizarImpuestos(c.retenciones, RETENCIONES_DISPONIBLES),
    });
    setError('');
    setModalOpen(true);
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
      conceptosFacturacion.update(editing.id, form);
    } else {
      conceptosFacturacion.add({ id: uid('cf'), ...form });
    }
    setModalOpen(false);
  }

  function handleDelete(c: ConceptoFacturacion) {
    if (confirm(`Eliminar el concepto "${c.concepto}"?`)) conceptosFacturacion.remove(c.id);
  }

  function toggleImpuesto(grupo: 'traslados' | 'retenciones', impuesto: string, campo: 'aplica' | 'predeterminado') {
    setForm((f) => ({
      ...f,
      [grupo]: f[grupo].map((i) => {
        if (i.impuesto === impuesto) {
          const marcado = !i[campo];
          return campo === 'predeterminado' ? { ...i, predeterminado: marcado, aplica: marcado || i.aplica } : { ...i, aplica: marcado };
        }
        // Solo un impuesto predeterminado a la vez dentro del mismo grupo.
        return campo === 'predeterminado' ? { ...i, predeterminado: false } : i;
      }),
    }));
  }

  const columns: Column<ConceptoFacturacion>[] = [
    { header: 'Codigo', render: (c) => c.codigo },
    { header: 'Concepto Facturacion', render: (c) => c.concepto },
    {
      header: 'Traslada IVA',
      render: (c) => <StatusBadge status={c.traslados.some((i) => i.aplica) ? 'Si' : 'No'} tone={c.traslados.some((i) => i.aplica) ? 'green' : 'gray'} />,
    },
    {
      header: 'Retiene IVA',
      render: (c) => <StatusBadge status={c.retenciones.some((i) => i.aplica) ? 'Si' : 'No'} tone={c.retenciones.some((i) => i.aplica) ? 'green' : 'gray'} />,
    },
    { header: 'Activo', render: (c) => <StatusBadge status={c.activo ? 'Si' : 'No'} tone={c.activo ? 'green' : 'red'} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Conceptos de Facturacion"
        subtitle="Conceptos de cobro usados al facturar viajes (Flete, Maniobras, Repartos, etc.)."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar concepto..."
        addLabel="Agregar"
        onAdd={puedeCrear ? openNew : undefined}
      />

      <CrudTable
        columns={columns}
        rows={filtered}
        keyFn={(c) => c.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        canEdit={puedeEditar}
        canDelete={puedeEliminar}
        emptyMessage="No hay conceptos registrados."
      />

      {modalOpen && (
        <Modal title={editing ? 'Editando concepto facturacion' : 'Agregando concepto facturacion'} onClose={() => setModalOpen(false)} wide="xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[140px_1fr]">
              <Field label="Codigo">
                <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
              </Field>
              <Field label="Concepto">
                <Input required autoFocus value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} />
              </Field>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-breco-500">Impuestos sobre Concepto</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="overflow-hidden rounded-xl border border-line-800">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">Traslado</th>
                        <th className="px-3 py-2 text-center font-medium">Traslada</th>
                        <th className="px-3 py-2 text-center font-medium">Predet.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.traslados.map((i) => (
                        <tr key={i.impuesto} className="border-t border-line-800/70">
                          <td className="px-3 py-2 text-ink-200">{i.impuesto}</td>
                          <td className="px-3 py-2 text-center">
                            <input type="checkbox" checked={i.aplica} onChange={() => toggleImpuesto('traslados', i.impuesto, 'aplica')} />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={i.predeterminado}
                              onChange={() => toggleImpuesto('traslados', i.impuesto, 'predeterminado')}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="overflow-hidden rounded-xl border border-line-800">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">Retencion</th>
                        <th className="px-3 py-2 text-center font-medium">Retiene</th>
                        <th className="px-3 py-2 text-center font-medium">Predet.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.retenciones.map((i) => (
                        <tr key={i.impuesto} className="border-t border-line-800/70">
                          <td className="px-3 py-2 text-ink-200">{i.impuesto}</td>
                          <td className="px-3 py-2 text-center">
                            <input type="checkbox" checked={i.aplica} onChange={() => toggleImpuesto('retenciones', i.impuesto, 'aplica')} />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={i.predeterminado}
                              onChange={() => toggleImpuesto('retenciones', i.impuesto, 'predeterminado')}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-breco-500">Configuracion</h3>
              <div className="space-y-2 rounded-xl border border-line-800 bg-bg-900 p-4">
                <label className="flex items-center gap-2 text-sm text-ink-300">
                  <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
                  Activo
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-300">
                  <input
                    type="checkbox"
                    checked={form.incluirCalculoIngresosLiquidacion}
                    onChange={(e) => setForm({ ...form, incluirCalculoIngresosLiquidacion: e.target.checked })}
                  />
                  Incluir en el Calculo de los Ingresos en la Liquidacion
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-300">
                  <input
                    type="checkbox"
                    checked={form.incluirCalculoLiquidacionPorcentajeFlete}
                    onChange={(e) => setForm({ ...form, incluirCalculoLiquidacionPorcentajeFlete: e.target.checked })}
                  />
                  Incluir en el Calculo de la Liquidacion % Sobre Importe Flete
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-300">
                  <input
                    type="checkbox"
                    checked={form.incluirReporteControlMovimientosInterterminal}
                    onChange={(e) => setForm({ ...form, incluirReporteControlMovimientosInterterminal: e.target.checked })}
                  />
                  Incluir en reporte CONTROL DE MOVIMIENTOS, Subtotal Interterminal
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-300">
                  <input
                    type="checkbox"
                    checked={form.incluirReporteControlMovimientosTransporteGasolina}
                    onChange={(e) => setForm({ ...form, incluirReporteControlMovimientosTransporteGasolina: e.target.checked })}
                  />
                  Incluir en reporte CONTROL DE MOVIMIENTOS, Subtotal Transporte Gasolina
                </label>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-breco-500">Seccion Claves CFDI</h3>
              <div className="grid grid-cols-1 gap-4">
                <Field label="Clave Productos y Servicios">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex flex-shrink-0 gap-2">
                      <Input className="w-28" value={form.claveProdServ} readOnly placeholder="Clave" />
                      <GhostButton
                        type="button"
                        title="Buscar en el catalogo SAT"
                        onClick={() => setBuscarProdServOpen(true)}
                      >
                        <MoreHorizontal size={16} />
                      </GhostButton>
                    </div>
                    <Input className="flex-1" value={form.claveProdServDescripcion} readOnly placeholder="Descripcion" />
                  </div>
                </Field>
                <Field label="Clave Unidad">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex flex-shrink-0 gap-2">
                      <Input className="w-28" value={form.claveUnidad} readOnly placeholder="Clave" />
                      <GhostButton
                        type="button"
                        title="Buscar en el catalogo SAT"
                        onClick={() => setBuscarUnidadOpen(true)}
                      >
                        <MoreHorizontal size={16} />
                      </GhostButton>
                    </div>
                    <Input className="flex-1" value={form.claveUnidadNombre} readOnly placeholder="Nombre" />
                  </div>
                </Field>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Unidad Medida">
                  <Input value={form.unidadMedida} onChange={(e) => setForm({ ...form, unidadMedida: e.target.value })} />
                </Field>
                <Field label="No. de Identificacion">
                  <Input value={form.noIdentificacion} onChange={(e) => setForm({ ...form, noIdentificacion: e.target.value })} />
                </Field>
                <Field label="Objeto a impuestos">
                  <Select value={form.objetoImpuesto} onChange={(e) => setForm({ ...form, objetoImpuesto: e.target.value })}>
                    <option value="">Selecciona...</option>
                    {OBJETO_IMPUESTO_SAT.map((o) => (
                      <option key={o.clave} value={o.clave}>{o.descripcion}</option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-line-800 pt-4">
              {error && <p className="flex-1 text-sm text-breco-500">{error}</p>}
              <GhostButton type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="submit">Aceptar</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {buscarProdServOpen && (
        <BuscarClaveProdServModal
          onSelect={(clave, descripcion) => {
            setForm((f) => ({ ...f, claveProdServ: clave, claveProdServDescripcion: descripcion }));
            setBuscarProdServOpen(false);
          }}
          onClose={() => setBuscarProdServOpen(false)}
        />
      )}
      {buscarUnidadOpen && (
        <BuscarClaveUnidadModal
          onSelect={(clave, nombre) => {
            setForm((f) => ({ ...f, claveUnidad: clave, claveUnidadNombre: nombre }));
            setBuscarUnidadOpen(false);
          }}
          onClose={() => setBuscarUnidadOpen(false)}
        />
      )}
    </div>
  );
}
