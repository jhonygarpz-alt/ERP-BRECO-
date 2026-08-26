import { useEffect, useState } from 'react';
import { AlertTriangle, FileSpreadsheet, Image as ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { reconocerImagen } from '../../lib/ocr';
import { parseFacturacionTexto } from '../../lib/parseFacturacionImagen';
import { leerFacturacionSistemaExcel, guardarFacturasSistema, type ResultadoImportFacturasSistema } from '../../lib/excelImport';
import { mensajeDeError } from '../../lib/errors';
import type { FacturaSistema } from '../../types';
import { Modal } from '../ui/Modal';
import { GhostButton, Input, PrimaryButton } from '../ui/form';

type Modo = 'excel' | 'imagen';

function pill(activo: boolean) {
  return `flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${
    activo
      ? 'border-breco-500/50 bg-breco-500/10 font-semibold text-white'
      : 'border-line-800 bg-bg-800 text-ink-400 hover:text-ink-100'
  }`;
}

export function ImportarFacturacionModal({
  onClose,
  onImportado,
}: {
  onClose: () => void;
  onImportado: () => void;
}) {
  const [modo, setModo] = useState<Modo>('excel');

  // ---- Modo Excel ----
  const [archivoExcel, setArchivoExcel] = useState<File | null>(null);
  const [resultadoExcel, setResultadoExcel] = useState<ResultadoImportFacturasSistema | null>(null);
  const [procesandoExcel, setProcesandoExcel] = useState(false);
  const [guardandoExcel, setGuardandoExcel] = useState(false);
  const [progresoExcel, setProgresoExcel] = useState(0);
  const [errorExcel, setErrorExcel] = useState('');
  const [soloHoy, setSoloHoy] = useState(true);

  // ---- Modo Imagen ----
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [procesandoImagen, setProcesandoImagen] = useState(false);
  const [progresoImagen, setProgresoImagen] = useState(0);
  const [filasImagen, setFilasImagen] = useState<FacturaSistema[] | null>(null);
  const [errorImagen, setErrorImagen] = useState('');
  const [guardandoImagen, setGuardandoImagen] = useState(false);

  useEffect(() => {
    if (!archivoImagen) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(archivoImagen);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [archivoImagen]);

  useEffect(() => {
    if (modo !== 'imagen' || filasImagen) return;
    function onPaste(e: ClipboardEvent) {
      const item = Array.from(e.clipboardData?.items ?? []).find((it) => it.type.startsWith('image/'));
      const blob = item?.getAsFile();
      if (!blob) return;
      e.preventDefault();
      setArchivoImagen(new File([blob], `captura-facturacion.${blob.type.split('/')[1] || 'png'}`, { type: blob.type }));
      setErrorImagen('');
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [modo, filasImagen]);

  async function procesarExcel() {
    if (!archivoExcel) return;
    setProcesandoExcel(true);
    setErrorExcel('');
    try {
      const resultado = await leerFacturacionSistemaExcel(archivoExcel, { soloHoy });
      if (resultado.filasValidas === 0) {
        setErrorExcel('No se encontraron filas con numero de referencia valido en la hoja BASE_DATOS.');
        return;
      }
      setResultadoExcel(resultado);
    } catch (err) {
      setErrorExcel(mensajeDeError(err));
    } finally {
      setProcesandoExcel(false);
    }
  }

  async function guardarExcel() {
    if (!resultadoExcel) return;
    setGuardandoExcel(true);
    setErrorExcel('');
    try {
      await guardarFacturasSistema(resultadoExcel.filas, (hecho, total) => setProgresoExcel(hecho / total));
      onImportado();
      onClose();
    } catch (err) {
      setErrorExcel(mensajeDeError(err));
      setGuardandoExcel(false);
    }
  }

  async function procesarImagen() {
    if (!archivoImagen) return;
    setProcesandoImagen(true);
    setErrorImagen('');
    try {
      const texto = await reconocerImagen(archivoImagen, setProgresoImagen);
      const detectadas = parseFacturacionTexto(texto);
      if (detectadas.length === 0) {
        setErrorImagen(
          'No se reconocio ninguna fila con numero de referencia en la imagen. Intenta con una foto mas nitida o recortada a la tabla.',
        );
        return;
      }
      const hoy = new Date().toISOString().slice(0, 10);
      const numOrVacio = (s: string) => {
        const n = Number(s.replace(',', '.'));
        return Number.isFinite(n) ? n : 0;
      };
      const editables: FacturaSistema[] = detectadas.map((d) => ({
        id: d.ref,
        cliente: d.cliente,
        economicoTracto: d.economicoTracto,
        economicoRemolque: d.economicoRemolque,
        origenPedido: d.origenPedido,
        locacionOrigen: '',
        transportista: '',
        fechaOrigen: hoy,
        destinoPedido: d.destinoPedido,
        locacionDestino: d.locacionDestino,
        fechaDestino: '',
        ordenTrabajo: '',
        tipoPedido: '',
        fechaFactura: '',
        totalFactura: 0,
        saldoPendiente: 0,
        estadoPedido: '',
        moneda: d.moneda,
        tipoCambio: numOrVacio(d.tipoCambio),
        tarifa: numOrVacio(d.tarifa),
        adicional: numOrVacio(d.adicional),
        totalTarifa: numOrVacio(d.totalTarifa),
        utilidad: 0,
      }));
      setFilasImagen(editables);
    } catch {
      setErrorImagen('No se pudo procesar la imagen. Intenta de nuevo.');
    } finally {
      setProcesandoImagen(false);
    }
  }

  function actualizarFilaImagen(id: string, patch: Partial<FacturaSistema>) {
    setFilasImagen((prev) => (prev ? prev.map((f) => (f.id === id ? { ...f, ...patch } : f)) : prev));
  }
  function eliminarFilaImagen(id: string) {
    setFilasImagen((prev) => (prev ? prev.filter((f) => f.id !== id) : prev));
  }

  async function guardarImagen() {
    if (!filasImagen) return;
    const validas = filasImagen.filter((f) => f.id.trim() !== '');
    if (validas.length === 0) {
      setErrorImagen('Ninguna fila tiene numero de referencia (REF). Completa ese campo antes de guardar.');
      return;
    }
    setGuardandoImagen(true);
    setErrorImagen('');
    try {
      await guardarFacturasSistema(validas);
      onImportado();
      onClose();
    } catch (err) {
      setErrorImagen(mensajeDeError(err));
      setGuardandoImagen(false);
    }
  }

  return (
    <Modal
      title="Importar Facturacion por Sistema"
      subtitle="Desde el Excel real (historico completo) o desde una captura del dia"
      onClose={onClose}
      wide
    >
      <div className="mb-4 flex gap-2">
        <button type="button" onClick={() => setModo('excel')} className={pill(modo === 'excel')}>
          <FileSpreadsheet size={15} /> Excel
        </button>
        <button type="button" onClick={() => setModo('imagen')} className={pill(modo === 'imagen')}>
          <ImageIcon size={15} /> Imagen (solo hoy)
        </button>
      </div>

      {modo === 'excel' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
            <FileSpreadsheet size={16} className="mt-0.5 flex-shrink-0 text-blue-400" />
            <p className="text-xs text-ink-300">
              Sube el archivo real "Facturacion Diaria por Sistema.xlsx" (descargado de OneDrive). Se lee la hoja
              BASE_DATOS tal cual, sin adivinar nada -- exacto, no como una foto. Si un REF ya existe se actualiza,
              si es nuevo se agrega.
            </p>
          </div>

          {!resultadoExcel && (
            <>
              <label className="flex items-center gap-2 rounded-xl border border-line-800 bg-bg-800 p-3 text-sm text-ink-300">
                <input
                  type="checkbox"
                  checked={soloHoy}
                  onChange={(e) => setSoloHoy(e.target.checked)}
                  className="h-4 w-4 rounded border-line-600 bg-bg-900 accent-breco-500"
                />
                Importar solo el dia mas reciente del archivo (recomendado para el uso diario)
              </label>
              {!soloHoy && (
                <p className="text-xs text-amber-400">
                  Vas a importar TODO el historico de la hoja BASE_DATOS. Solo hazlo una vez, al principio.
                </p>
              )}

              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-700 bg-bg-900 px-6 py-10 text-center hover:border-line-600">
                <Upload size={22} className="text-ink-500" />
                <span className="text-sm text-ink-300">
                  {archivoExcel ? archivoExcel.name : 'Selecciona el archivo .xlsx'}
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => setArchivoExcel(e.target.files?.[0] ?? null)}
                />
              </label>

              {errorExcel && <p className="text-sm text-breco-500">{errorExcel}</p>}

              <div className="flex justify-end gap-2">
                <GhostButton type="button" onClick={onClose}>
                  Cancelar
                </GhostButton>
                <PrimaryButton type="button" disabled={!archivoExcel || procesandoExcel} onClick={procesarExcel}>
                  {procesandoExcel ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Leyendo archivo...
                    </>
                  ) : (
                    'Leer archivo'
                  )}
                </PrimaryButton>
              </div>
            </>
          )}

          {resultadoExcel && (
            <>
              <div className="rounded-xl border border-line-800 bg-bg-800 p-4 text-sm text-ink-300">
                Hoja <span className="font-medium text-ink-100">{resultadoExcel.hoja}</span>: se encontraron{' '}
                <span className="font-semibold text-ink-100">{resultadoExcel.filasValidas}</span> filas validas para
                guardar (de {resultadoExcel.totalFilasHoja} filas totales
                {resultadoExcel.filasOmitidas > 0 && `, ${resultadoExcel.filasOmitidas} omitidas por no tener REF`}
                {resultadoExcel.filasFueraDeHoy > 0 && `, ${resultadoExcel.filasFueraDeHoy} de otros dias`}
                ).
              </div>

              {errorExcel && <p className="text-sm text-breco-500">{errorExcel}</p>}
              {guardandoExcel && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-bg-700">
                  <div
                    className="h-full bg-breco-500 transition-all"
                    style={{ width: `${Math.round(progresoExcel * 100)}%` }}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <GhostButton type="button" onClick={() => setResultadoExcel(null)} disabled={guardandoExcel}>
                  Elegir otro archivo
                </GhostButton>
                <PrimaryButton type="button" onClick={guardarExcel} disabled={guardandoExcel}>
                  {guardandoExcel ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Guardando...
                    </>
                  ) : (
                    `Guardar ${resultadoExcel.filasValidas} registros`
                  )}
                </PrimaryButton>
              </div>
            </>
          )}
        </div>
      )}

      {modo === 'imagen' && !filasImagen && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-400" />
            <p className="text-xs text-ink-300">
              Usa esto solo para una captura con los datos de <span className="font-medium">hoy</span> (por ejemplo
              la facturacion del dia). Es OCR gratuito del navegador, no exacto como el Excel -- vas a poder revisar
              y corregir cada campo antes de guardar.
            </p>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-700 bg-bg-900 px-6 py-10 text-center hover:border-line-600">
            <Upload size={22} className="text-ink-500" />
            <span className="text-sm text-ink-300">
              {archivoImagen ? archivoImagen.name : 'Selecciona una imagen, o copia una captura y presiona Ctrl+V aqui'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setArchivoImagen(e.target.files?.[0] ?? null)}
            />
          </label>

          {previewUrl && (
            <div className="flex justify-center">
              <img src={previewUrl} alt="Vista previa" className="max-h-48 rounded-lg border border-line-800 object-contain" />
            </div>
          )}

          {errorImagen && <p className="text-sm text-breco-500">{errorImagen}</p>}

          <div className="flex justify-end gap-2">
            <GhostButton type="button" onClick={onClose}>
              Cancelar
            </GhostButton>
            <PrimaryButton type="button" disabled={!archivoImagen || procesandoImagen} onClick={procesarImagen}>
              {procesandoImagen ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Leyendo imagen... {Math.round(progresoImagen * 100)}%
                </>
              ) : (
                'Leer imagen'
              )}
            </PrimaryButton>
          </div>
        </div>
      )}

      {modo === 'imagen' && filasImagen && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-400" />
            <p className="text-xs text-ink-300">
              Se detectaron {filasImagen.length} filas. Revisa cada campo -- sobre todo el REF -- antes de guardar.
            </p>
          </div>

          <div className="max-h-[50vh] overflow-auto rounded-xl border border-line-800">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="sticky top-0 bg-bg-700 text-[11px] uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-2 py-2">REF</th>
                  <th className="px-2 py-2">Cliente</th>
                  <th className="px-2 py-2">Eco Tracto</th>
                  <th className="px-2 py-2">Caja</th>
                  <th className="px-2 py-2">Origen</th>
                  <th className="px-2 py-2">Destino</th>
                  <th className="px-2 py-2">Moneda</th>
                  <th className="px-2 py-2">Total Tarifa</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filasImagen.map((f) => (
                  <tr key={f.id || Math.random()} className="border-t border-line-800">
                    <td className="px-2 py-1.5">
                      <Input className="w-20" value={f.id} onChange={(e) => actualizarFilaImagen(f.id, { id: e.target.value })} />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="w-36"
                        value={f.cliente}
                        onChange={(e) => actualizarFilaImagen(f.id, { cliente: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="w-20"
                        value={f.economicoTracto}
                        onChange={(e) => actualizarFilaImagen(f.id, { economicoTracto: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="w-20"
                        value={f.economicoRemolque}
                        onChange={(e) => actualizarFilaImagen(f.id, { economicoRemolque: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="w-28"
                        value={f.origenPedido}
                        onChange={(e) => actualizarFilaImagen(f.id, { origenPedido: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="w-28"
                        value={f.destinoPedido}
                        onChange={(e) => actualizarFilaImagen(f.id, { destinoPedido: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="w-16"
                        value={f.moneda}
                        onChange={(e) => actualizarFilaImagen(f.id, { moneda: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="w-24"
                        type="number"
                        value={f.totalTarifa}
                        onChange={(e) => actualizarFilaImagen(f.id, { totalTarifa: Number(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <button
                        onClick={() => eliminarFilaImagen(f.id)}
                        className="rounded p-1 text-ink-500 hover:bg-bg-700 hover:text-breco-500"
                        title="Quitar esta fila"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {errorImagen && <p className="text-sm text-breco-500">{errorImagen}</p>}

          <div className="flex justify-end gap-2">
            <GhostButton type="button" onClick={() => setFilasImagen(null)} disabled={guardandoImagen}>
              Volver a intentar
            </GhostButton>
            <PrimaryButton type="button" onClick={guardarImagen} disabled={guardandoImagen}>
              {guardandoImagen ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Guardando...
                </>
              ) : (
                `Guardar ${filasImagen.length} registros`
              )}
            </PrimaryButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
