import { useState } from 'react';
import { AlertTriangle, Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { mensajeDeError } from '../../lib/errors';
import type { FilaImport } from '../../lib/excelImportShared';
import { Modal } from '../ui/Modal';
import { GhostButton, PrimaryButton } from '../ui/form';

export interface ImportarCatalogoModalProps<T> {
  titulo: string;
  nombrePlural: string;
  descargarPlantilla: () => void;
  leerArchivo: (file: File) => Promise<{ totalFilasHoja: number; filas: FilaImport<T>[] }>;
  marcarDuplicados: (filas: FilaImport<T>[], existentes: T[]) => FilaImport<T>[];
  existentes: T[];
  guardar: (items: T[], onProgreso?: (hecho: number, total: number) => void) => Promise<void>;
  columnasPreview: { header: string; render: (item: T) => React.ReactNode }[];
  onClose: () => void;
  onImportado: () => void;
}

export function ImportarCatalogoModal<T>({
  titulo,
  nombrePlural,
  descargarPlantilla,
  leerArchivo,
  marcarDuplicados,
  existentes,
  guardar,
  columnasPreview,
  onClose,
  onImportado,
}: ImportarCatalogoModalProps<T>) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<{ totalFilasHoja: number; filas: FilaImport<T>[] } | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState('');

  async function procesar() {
    if (!archivo) return;
    setProcesando(true);
    setError('');
    try {
      const leido = await leerArchivo(archivo);
      if (leido.filas.length === 0) {
        setError('No se encontraron filas con datos en el archivo.');
        return;
      }
      const conDuplicados = marcarDuplicados(leido.filas, existentes);
      setResultado({ ...leido, filas: conDuplicados });
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setProcesando(false);
    }
  }

  async function guardarTodo() {
    if (!resultado) return;
    const validas = resultado.filas.filter((f) => f.errores.length === 0);
    if (validas.length === 0) return;
    setGuardando(true);
    setError('');
    try {
      await guardar(
        validas.map((f) => f.item),
        (hecho, total) => setProgreso(hecho / total),
      );
      onImportado();
      onClose();
    } catch (err) {
      setError(mensajeDeError(err));
      setGuardando(false);
    }
  }

  const validas = resultado?.filas.filter((f) => f.errores.length === 0) ?? [];
  const conError = resultado?.filas.filter((f) => f.errores.length > 0) ?? [];

  return (
    <Modal title={titulo} onClose={onClose} wide="xl">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
          <FileSpreadsheet size={16} className="mt-0.5 flex-shrink-0 text-blue-400" />
          <p className="text-xs text-ink-300">
            Descarga la plantilla, llenala con los datos de tus {nombrePlural} (hoja 1) siguiendo las instrucciones
            (hoja 2), y sube el archivo aqui para importarlos de manera masiva.
          </p>
        </div>

        <GhostButton type="button" onClick={descargarPlantilla}>
          <Download size={14} />
          Descargar plantilla
        </GhostButton>

        {!resultado && (
          <>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-700 bg-bg-900 px-6 py-10 text-center hover:border-line-600">
              <Upload size={22} className="text-ink-500" />
              <span className="text-sm text-ink-300">{archivo ? archivo.name : 'Selecciona el archivo .xlsx ya llenado'}</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              />
            </label>

            {error && <p className="text-sm text-breco-500">{error}</p>}

            <div className="flex justify-end gap-2">
              <GhostButton type="button" onClick={onClose}>
                Cancelar
              </GhostButton>
              <PrimaryButton type="button" disabled={!archivo || procesando} onClick={procesar}>
                {procesando ? (
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

        {resultado && (
          <>
            <div className="rounded-xl border border-line-800 bg-bg-800 p-4 text-sm text-ink-300">
              Se encontraron <span className="font-semibold text-ink-100">{validas.length}</span> filas listas para
              importar
              {conError.length > 0 && (
                <>
                  {' '}
                  y <span className="font-semibold text-amber-400">{conError.length}</span> con errores (no se
                  importaran).
                </>
              )}
              .
            </div>

            {conError.length > 0 && (
              <div className="max-h-40 overflow-auto rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-amber-400">
                  <AlertTriangle size={14} /> Filas con errores
                </div>
                <ul className="space-y-1 text-xs text-ink-300">
                  {conError.map((f) => (
                    <li key={f.fila}>
                      Fila {f.fila}: {f.errores.join(' ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validas.length > 0 && (
              <div className="max-h-[40vh] overflow-auto rounded-xl border border-line-800">
                <table className="w-full min-w-[600px] text-left text-xs">
                  <thead className="sticky top-0 bg-bg-700 text-[11px] uppercase tracking-wide text-ink-500">
                    <tr>
                      {columnasPreview.map((c) => (
                        <th key={c.header} className="px-3 py-2">
                          {c.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validas.map((f, i) => (
                      <tr key={i} className="border-t border-line-800">
                        {columnasPreview.map((c) => (
                          <td key={c.header} className="px-3 py-1.5 text-ink-300">
                            {c.render(f.item)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {error && <p className="text-sm text-breco-500">{error}</p>}
            {guardando && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-bg-700">
                <div className="h-full bg-breco-500 transition-all" style={{ width: `${Math.round(progreso * 100)}%` }} />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <GhostButton type="button" onClick={() => setResultado(null)} disabled={guardando}>
                Elegir otro archivo
              </GhostButton>
              <PrimaryButton type="button" onClick={guardarTodo} disabled={guardando || validas.length === 0}>
                {guardando ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Guardando...
                  </>
                ) : (
                  `Importar ${validas.length} registros`
                )}
              </PrimaryButton>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
