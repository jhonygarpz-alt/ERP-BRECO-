import { useState } from 'react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import { hoyISO } from '../../lib/fechas';
import type { Proveedor } from '../../types';
import { Modal } from '../ui/Modal';
import { Field, GhostButton, Input, PrimaryButton, Select } from '../ui/form';

/**
 * Alta rapida de Proveedor desde cualquier documento de Almacen/Banco (sin
 * salir a llenar el catalogo completo) -- solo pide lo minimo (nombre, RFC,
 * tipo) y llena el resto con valores por defecto; el resto de los datos
 * (domicilio, credito, cuenta bancaria) se completan despues desde el
 * catalogo de Proveedores. Mismo patron ya usado en
 * RegistrarPagoProveedorModal, extraido aqui para reutilizarse en los
 * formularios de Requisicion/Cotizacion/Orden de Compra/Compra/Movimiento.
 */
export function NuevoProveedorModal({ onClose, onCreado }: { onClose: () => void; onCreado: (proveedor: Proveedor) => void }) {
  const { proveedores } = useData();
  const [nombre, setNombre] = useState('');
  const [rfc, setRfc] = useState('');
  const [tipo, setTipo] = useState<Proveedor['tipo']>('Nacional');
  const [error, setError] = useState('');

  function guardar() {
    const nombreLimpio = nombre.trim();
    const rfcLimpio = rfc.trim().toUpperCase();
    if (!nombreLimpio) {
      setError('Falta el Nombre.');
      return;
    }
    if (rfcLimpio && proveedores.items.some((p) => p.rfc.trim().toUpperCase() === rfcLimpio)) {
      setError(`Ya existe un proveedor con el RFC ${rfcLimpio}.`);
      return;
    }
    const nuevo: Proveedor = {
      id: uid('prv'),
      numero: '',
      fecha: hoyISO(),
      estatus: 'activo',
      tipo,
      rfc: rfcLimpio,
      nombre: nombreLimpio,
      nombreCorto: '',
      esProveedorCombustible: false,
      proveedorBienes: false,
      proveedorServicios: false,
      grupo: '',
      tipoOperacion: '',
      tipoTercero: '',
      shortNameSap: '',
      pais: 'Mexico',
      estado: '',
      cp: '',
      municipio: '',
      colonia: '',
      localidad: '',
      calle: '',
      numeroExterior: '',
      numeroInterior: '',
      correo: '',
      telefonos: '',
      celular: '',
      nextel: '',
      formaPago: 'Efectivo',
      diasCredito: 0,
      limiteCreditoMxn: 0,
      limiteCreditoUsd: 0,
      banco: '',
      cuentaClabe: '',
      noCuenta: '',
      documentos: [],
    };
    proveedores.add(nuevo);
    onCreado(nuevo);
  }

  return (
    <Modal title="Agregando Proveedor" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Nombre">
          <Input required autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </Field>
        <Field label="RFC">
          <Input value={rfc} onChange={(e) => setRfc(e.target.value.toUpperCase())} />
        </Field>
        <Field label="Tipo Proveedor">
          <Select value={tipo} onChange={(e) => setTipo(e.target.value as Proveedor['tipo'])}>
            <option value="Nacional">Nacional</option>
            <option value="Extranjero">Extranjero</option>
          </Select>
        </Field>
        <p className="text-xs text-ink-500">
          El resto de los datos del proveedor (domicilio, credito, cuenta bancaria, etc.) se pueden completar despues desde el
          catalogo de Proveedores.
        </p>
        <div className="flex items-center justify-end gap-3 border-t border-line-800 pt-4">
          {error && <p className="flex-1 text-sm text-breco-500">{error}</p>}
          <GhostButton type="button" onClick={onClose}>
            Cancelar
          </GhostButton>
          <PrimaryButton type="button" onClick={guardar}>
            Aceptar
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
