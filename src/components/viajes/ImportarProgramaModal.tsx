import { useEffect, useState } from 'react';
import { AlertTriangle, FileSpreadsheet, Image as ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { uid } from '../../lib/storage';
import { reconocerImagen } from '../../lib/ocr';
import { parseProgramaTexto } from '../../lib/parsePrograma';
import { leerReporteDiarioExcel, guardarViajesImportados, type ResultadoImportViajes } from '../../lib/excelImportViajes';
import { mensajeDeError } from '../../lib/errors';
import type { EstatusViaje } from '../../types';
import { Modal } from '../ui/Modal';
import { GhostButton, Input, PrimaryButton, Select } from '../ui/form';

type Modo = 'excel' | 'imagen';

function pill(activo: boolean) {
  return `flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${
    activo
      ? 'border-breco-500/50 bg-breco-500/10 font-semibold text-white'
      : 'border-line-800 bg-bg-800 text-ink-400 hover:text-ink-100'
  }`;
}

interface FilaEditable {
  id: string;
  unidadId: string;
  clienteId: string;
  operadorId: string;
  materiales: string;
  origen: string;
  destino: string;
  cajaNombre: string;
  cajaEconomico: string;
  importacion: boolean;
  exportacion: boolean;
  cita: string;
  observaciones: string;
  estatus: EstatusViaje;
}

function normalizar(texto: string): string {
  return texto
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

export function ImportarProgramaModal({ onClose }: { onClose: () => void }) {
  const { unidades, clientes, operadores, viajes } = useData();
  const [modo, setModo] = useState<Modo>('excel');

  // ---- Modo Imagen ----
  const [archivo, setArchivo] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [filas, setFilas] = useState<FilaEditable[] | null>(null);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  // ---- Modo Excel ----
  const [archivoExcel, setArchivoExcel] = useState<File | null>(null);
  const [resultadoExcel, setResultadoExcel] = useState<ResultadoImportViajes | null>(null);
  const [procesandoExcel, setProcesandoExcel] = useState(false);
  const [guardandoExcel, setGuardandoExcel] = useState(false);
  const [progresoExcel, setProgresoExcel] = useState(0);
  const [errorExcel, setErrorExcel] = useState('');
  const [soloHojaMasReciente, setSoloHojaMasReciente] = useState(true);

  useEffect(() => {
    if (!archivo) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(archivo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  useEffect(() => {
    if (modo !== 'imagen' || filas) return;
    function onPaste(e: ClipboardEvent) {
      const item = Array.from(e.clipboardData?.items ?? []).find((it) => it.type.startsWith('image/'));
      const blob = item?.getAsFile();
      if (!blob) return;
      e.preventDefault();
      setArchivo(new File([blob], `captura-pegada.${blob.type.split('/')[1] || 'png'}`, { type: blob.type }));
      setError('');
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [modo, filas]);

  async function procesarExcel() {
    if (!archivoExcel) return;
    setProcesandoExcel(true);
    setErrorExcel('');
    try {
      const resultado = await leerReporteDiarioExcel(
        archivoExcel,
        unidades.items.map((u) => ({ id: u.id, economico: u.economico })),
        clientes.items.map((c) => ({ id: c.id, nombre: c.nombre })),
        operadores.items.map((o) => ({ id: o.id, nombre: o.nombre })),
        { soloHojaMasReciente: soloHojaMasReciente },
      );
      if (resultado.filasValidas === 0) {
        setErrorExcel('No se encontro ninguna fila valida en el archivo. Verifica que sea el "Reporte Diario" real.');
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
      await guardarViajesImportados(resultadoExcel.filas, viajes.items, () => uid('via'), (hecho, total) =>
        setProgresoExcel(hecho / total),
      );
      await viajes.reload();
      onClose();
    } catch (err) {
      setErrorExcel(mensajeDeError(err));
      setGuardandoExcel(false);
    }
  }

  async function procesarImagen() {
    if (!archivo) return;
    setProcesando(true);
    setError('');
    try {
      const texto = await reconocerImagen(archivo, setProgreso);
      const economicos = unidades.items.map((u) => u.economico);
      const detectadas = parseProgramaTexto(texto, economicos);
      if (detectadas.length === 0) {
        setError('No se reconocio ninguna unidad en la imagen. Intenta con una foto mas nitida o recortada a la tabla.');
        setProcesando(false);
        return;
      }
      const editables: FilaEditable[] = detectadas.map((d) => {
        const unidad = unidades.items.find((u) => u.economico === d.unidadEconomico);
        const clienteGuess = clientes.items.find((c) => normalizar(c.nombre).includes(normalizar(d.cliente)) && d.cliente.length > 2);
        const operadorGuess = operadores.items.find((o) => normalizar(o.nombre).includes(normalizar(d.operador)) && d.operador.length > 2);
        return {
          id: uid('fila'),
          unidadId: unidad?.id ?? '',
          clienteId: clienteGuess?.id ?? unidad?.clienteAsignadoId ?? '',
          operadorId: operadorGuess?.id ?? unidad?.operadorAsignadoId ?? '',
          materiales: d.materiales,
          origen: d.origen,
          destino: d.destino,
          cajaNombre: d.cajaNombre,
          cajaEconomico: d.cajaEconomico,
          importacion: d.importacion,
          exportacion: d.exportacion,
          cita: d.cita,
          observaciones: d.observaciones,
          estatus: 'Programado',
        };
      });
      setFilas(editables);
    } catch {
      setError('No se pudo procesar la imagen. Intenta de nuevo.');
    } finally {
      setProcesando(false);
    }
  }

  function actualizarFila(id: string, patch: Partial<FilaEditable>) {
    setFilas((prev) => (prev ? prev.map((f) => (f.id === id ? { ...f, ...patch } : f)) : prev));
  }

  function eliminarFila(id: string) {
    setFilas((prev) => (prev ? prev.filter((f) => f.id !== id) : prev));
  }

  function guardarTodo() {
    if (!filas) return;
    const hoy = new Date().toISOString().slice(0, 10);
    let contadorFolio = viajes.items.reduce((acc, v) => {
      const n = Number(v.folio.split('-')[1] ?? 0);
      return Number.isFinite(n) ? Math.max(acc, n) : acc;
    }, 0);

    for (const f of filas) {
      if (!f.unidadId) continue;
      const viajeExistente = viajes.items.find((v) => v.unidadId === f.unidadId && v.fecha === hoy);
      const payload = {
        clienteId: f.clienteId,
        unidadId: f.unidadId,
        operadorId: f.operadorId,
        materiales: f.materiales,
        cajaNombre: f.cajaNombre,
        cajaEconomico: f.cajaEconomico,
        origen: f.origen,
        destino: f.destino,
        horaSalida: '',
        horaLlegadaEstimada: '',
        cita: f.cita,
        importacion: f.importacion,
        exportacion: f.exportacion,
        estatus: f.estatus,
        observaciones: f.observaciones,
      };
      if (viajeExistente) {
        viajes.update(viajeExistente.id, payload);
      } else {
        contadorFolio += 1;
        const folio = `V-${String(contadorFolio).padStart(4, '0')}`;
        viajes.add({ id: uid('via'), folio, fecha: hoy, ...payload });
      }
    }
    onClose();
  }

  return (
    <Modal
      title="Importar programa"
      subtitle="Desde el Excel real (Reporte Diario) o desde una captura"
      onClose={onClose}
      wide
    >
      <div className="mb-4 flex gap-2">
        <button type="button" onClick={() => setModo('excel')} className={pill(modo === 'excel')}>
          <FileSpreadsheet size={15} /> Excel
        </button>
        <button type="button" onClick={() => setModo('imagen')} className={pill(modo === 'imagen')}>
          <ImageIcon size={15} /> Imagen
        </button>
      </div>

      {modo === 'excel' && !resultadoExcel && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
            <FileSpreadsheet size={16} className="mt-0.5 flex-shrink-0 text-blue-400" />
            <p className="text-xs text-ink-300">
              Sube el archivo real "Reporte Diario.xlsx" (una hoja por dia). El formato de columnas ha cambiado
              varias veces a lo largo del tiempo y esto lo detecta solo; las unidades se identifican por su numero
              de posicion (1=T01, 2=T02, ...). Cliente/operador quedan sin asignar cuando el nombre no coincide con
              tu catalogo actual -- puedes corregirlos despues desde Asignacion de Viajes.
            </p>
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-line-800 bg-bg-800 p-3 text-sm text-ink-300">
            <input
              type="checkbox"
              checked={soloHojaMasReciente}
              onChange={(e) => setSoloHojaMasReciente(e.target.checked)}
              className="h-4 w-4 rounded border-line-600 bg-bg-900 accent-breco-500"
            />
            Importar solo el dia mas reciente del archivo (recomendado para el uso diario)
          </label>
          {!soloHojaMasReciente && (
            <p className="text-xs text-amber-400">
              Vas a importar TODO el historial del archivo (puede ser cientos de dias). Solo hazlo una vez, al
              principio.
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
        </div>
      )}

      {modo === 'excel' && resultadoExcel && (
        <div className="space-y-4">
          <div className="rounded-xl border border-line-800 bg-bg-800 p-4 text-sm text-ink-300">
            Se leyeron <span className="font-semibold text-ink-100">{resultadoExcel.hojasProcesadas}</span> dia(s)
            de {resultadoExcel.hojasTotales} hojas totales:{' '}
            <span className="font-semibold text-ink-100">{resultadoExcel.filasValidas}</span> viajes validos
            {resultadoExcel.filasSinUnidad > 0 &&
              `, ${resultadoExcel.filasSinUnidad} filas omitidas por no reconocer la unidad`}
            .
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
                `Guardar ${resultadoExcel.filasValidas} viajes`
              )}
            </PrimaryButton>
          </div>
        </div>
      )}

      {modo === 'imagen' && !filas && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-400" />
            <p className="text-xs text-ink-300">
              Esta lectura usa OCR gratuito del navegador, no esta entrenado para tablas con colores o celdas
              combinadas. Es normal que falte o confunda datos — vas a poder revisar y corregir cada campo antes
              de que se guarde nada.
            </p>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-700 bg-bg-900 px-6 py-10 text-center hover:border-line-600">
            <Upload size={22} className="text-ink-500" />
            <span className="text-sm text-ink-300">
              {archivo ? archivo.name : 'Selecciona una imagen, o copia una captura y presiona Ctrl+V aqui'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            />
          </label>

          {previewUrl && (
            <div className="flex justify-center">
              <img
                src={previewUrl}
                alt="Vista previa"
                className="max-h-48 rounded-lg border border-line-800 object-contain"
              />
            </div>
          )}

          {error && <p className="text-sm text-breco-500">{error}</p>}

          <div className="flex justify-end gap-2">
            <GhostButton type="button" onClick={onClose}>
              Cancelar
            </GhostButton>
            <PrimaryButton type="button" disabled={!archivo || procesando} onClick={procesarImagen}>
              {procesando ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Leyendo imagen... {Math.round(progreso * 100)}%
                </>
              ) : (
                'Leer imagen'
              )}
            </PrimaryButton>
          </div>
        </div>
      )}

      {modo === 'imagen' && filas && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-400" />
            <p className="text-xs text-ink-300">
              Se detectaron {filas.length} unidades. Revisa cada campo — sobre todo cliente y operador — antes de
              guardar. Las unidades sin coincidencia quedan con el selector vacio.
            </p>
          </div>

          <div className="max-h-[50vh] overflow-auto rounded-xl border border-line-800">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="sticky top-0 bg-bg-700 text-[11px] uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-2 py-2">Unidad</th>
                  <th className="px-2 py-2">Cliente</th>
                  <th className="px-2 py-2">Operador</th>
                  <th className="px-2 py-2">Materiales</th>
                  <th className="px-2 py-2">Origen</th>
                  <th className="px-2 py-2">Destino</th>
                  <th className="px-2 py-2">Caja</th>
                  <th className="px-2 py-2">Eco. caja</th>
                  <th className="px-2 py-2">Imp</th>
                  <th className="px-2 py-2">Exp</th>
                  <th className="px-2 py-2">Cita</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id} className="border-t border-line-800">
                    <td className="px-2 py-1.5">
                      <Select
                        className="w-24"
                        value={f.unidadId}
                        onChange={(e) => actualizarFila(f.id, { unidadId: e.target.value })}
                      >
                        <option value="">—</option>
                        {unidades.items.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.economico}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-2 py-1.5">
                      <Select
                        className="w-36"
                        value={f.clienteId}
                        onChange={(e) => actualizarFila(f.id, { clienteId: e.target.value })}
                      >
                        <option value="">—</option>
                        {clientes.items.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-2 py-1.5">
                      <Select
                        className="w-36"
                        value={f.operadorId}
                        onChange={(e) => actualizarFila(f.id, { operadorId: e.target.value })}
                      >
                        <option value="">—</option>
                        {operadores.items.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.nombre}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="w-28"
                        value={f.materiales}
                        onChange={(e) => actualizarFila(f.id, { materiales: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="w-28"
                        value={f.origen}
                        onChange={(e) => actualizarFila(f.id, { origen: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="w-28"
                        value={f.destino}
                        onChange={(e) => actualizarFila(f.id, { destino: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="w-20"
                        value={f.cajaNombre}
                        onChange={(e) => actualizarFila(f.id, { cajaNombre: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="w-20"
                        value={f.cajaEconomico}
                        onChange={(e) => actualizarFila(f.id, { cajaEconomico: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={f.importacion}
                        onChange={(e) => actualizarFila(f.id, { importacion: e.target.checked })}
                        className="h-4 w-4 rounded border-line-600 bg-bg-900 accent-breco-500"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={f.exportacion}
                        onChange={(e) => actualizarFila(f.id, { exportacion: e.target.checked })}
                        className="h-4 w-4 rounded border-line-600 bg-bg-900 accent-breco-500"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="w-16"
                        value={f.cita}
                        onChange={(e) => actualizarFila(f.id, { cita: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <button
                        onClick={() => eliminarFila(f.id)}
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

          <div className="flex justify-end gap-2">
            <GhostButton type="button" onClick={() => setFilas(null)}>
              Volver a intentar
            </GhostButton>
            <PrimaryButton type="button" onClick={guardarTodo}>
              Guardar {filas.length} viajes
            </PrimaryButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
