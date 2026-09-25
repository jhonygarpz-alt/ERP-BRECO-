import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Box, Camera, ClipboardList, Plus, TriangleAlert } from 'lucide-react';
import { useData } from '../../lib/DataContext';
import { useAuth } from '../../lib/AuthContext';
import { CONFIG_AUTOTRANSPORTE_SAT } from '../../lib/catalogosSat';
import { ESTATUS_DANO, colorEstatusDano, useSignedUrl } from '../../lib/unidad360';
import type { UnidadDano, UnidadHotspot } from '../../types';
import type { PosicionHotspot3D } from '../../lib/unidad360Diagrama';
import { StatusBadge } from '../../components/ui/Badge';
import { GhostButton, PrimaryButton, Select } from '../../components/ui/form';
import { Unidad3DViewer } from '../../components/flota360/Unidad3DViewer';
import { UnidadFotoViewer } from '../../components/flota360/UnidadFotoViewer';
import { FotosUnidadGrid } from '../../components/flota360/FotosUnidadGrid';
import { HotspotFormModal } from '../../components/flota360/HotspotFormModal';
import { RegistrarDanoModal } from '../../components/flota360/RegistrarDanoModal';
import { InspeccionModal } from '../../components/flota360/InspeccionModal';

type Tab = 'vista' | 'fotos' | 'danos' | 'inspecciones';
type ModoVista = 'foto' | '3d';

function descripcionTipo(tipo: string) {
  return CONFIG_AUTOTRANSPORTE_SAT.find((c) => c.clave === tipo)?.descripcion ?? tipo;
}

export function UnidadDigital360Page() {
  const { unidadId } = useParams<{ unidadId: string }>();
  const { unidades, unidadFotos, unidadHotspots, unidadDanos, unidadInspecciones } = useData();
  const { hasPermission } = useAuth();
  const puedeEditar = hasPermission('Flota', 'editar');
  const puedeCrear = hasPermission('Flota', 'crear');

  const unidad = unidades.items.find((u) => u.id === unidadId);

  const [tab, setTab] = useState<Tab>('vista');
  const [modoVista, setModoVista] = useState<ModoVista>('foto');
  const [hotspotEditando, setHotspotEditando] = useState<UnidadHotspot | null>(null);
  const [borradorHotspot, setBorradorHotspot] = useState<{
    modo: 'foto' | '3d';
    fotoId?: string;
    xPct?: number;
    yPct?: number;
    posicion3d?: string;
    tipoSugerido?: UnidadHotspot['tipo'];
    etiquetaSugerida?: string;
  } | null>(null);
  const [borradorDano, setBorradorDano] = useState<{ fotoId?: string; xPct?: number; yPct?: number; hotspotId?: string; zonaSugerida?: string } | null>(null);
  const [modalInspeccion, setModalInspeccion] = useState(false);
  const [inspeccionAbierta, setInspeccionAbierta] = useState<string | null>(null);
  const [compararA, setCompararA] = useState<string>('actual');
  const [compararB, setCompararB] = useState<string>('');

  const fotosUnidad = useMemo(
    () => unidadFotos.items.filter((f) => f.unidadId === unidadId),
    [unidadFotos.items, unidadId],
  );
  const fotosActuales = useMemo(() => fotosUnidad.filter((f) => !f.inspeccionId), [fotosUnidad]);
  const hotspotsUnidad = useMemo(
    () => unidadHotspots.items.filter((h) => h.unidadId === unidadId),
    [unidadHotspots.items, unidadId],
  );
  const danosUnidad = useMemo(
    () => unidadDanos.items.filter((d) => d.unidadId === unidadId).sort((a, b) => (a.fecha < b.fecha ? 1 : -1)),
    [unidadDanos.items, unidadId],
  );
  const inspeccionesUnidad = useMemo(
    () => unidadInspecciones.items.filter((i) => i.unidadId === unidadId).sort((a, b) => (a.fecha < b.fecha ? 1 : -1)),
    [unidadInspecciones.items, unidadId],
  );

  const posicionesConDano = useMemo(() => {
    const set = new Set<string>();
    for (const d of danosUnidad) {
      if (d.estatus === 'Resuelto') continue;
      const hs = hotspotsUnidad.find((h) => h.id === d.hotspotId);
      if (hs?.posicion3d) set.add(hs.posicion3d);
    }
    return set;
  }, [danosUnidad, hotspotsUnidad]);

  if (!unidad) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm text-ink-500">No se encontro esa unidad.</p>
        <Link to="/flota-360" className="text-sm font-medium text-breco-500 hover:underline">
          Volver a Flota Digital 360
        </Link>
      </div>
    );
  }

  function handleSelectPosicion3D(posicion: PosicionHotspot3D, hotspot?: UnidadHotspot) {
    if (hotspot) {
      setHotspotEditando(hotspot);
    } else if (puedeCrear) {
      setBorradorHotspot({ modo: '3d', posicion3d: posicion.key, tipoSugerido: posicion.tipoSugerido, etiquetaSugerida: posicion.label });
    }
  }

  const conteoEstatus = ESTATUS_DANO.map((e) => ({ ...e, total: danosUnidad.filter((d) => d.estatus === e.id).length }));

  return (
    <div>
      <Link to="/flota-360" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-100">
        <ArrowLeft size={15} /> Flota Digital 360
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-ink-100">{unidad.economico}</h1>
            <StatusBadge status={unidad.estatus} />
          </div>
          <p className="mt-1 text-sm text-ink-500">
            {descripcionTipo(unidad.tipo)} · {unidad.marca} {unidad.modelo} {unidad.anio || ''}
          </p>
          <p className="text-xs text-ink-600">
            Placas: {unidad.placas || 'N/D'} · VIN: {unidad.numeroSerie || 'N/D'}
          </p>
        </div>
        <div className="flex gap-2 rounded-xl border border-line-800 bg-bg-800 p-1">
          {conteoEstatus.map((e) => (
            <div key={e.id} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-300">
              <span className="h-2 w-2 rounded-full" style={{ background: colorEstatusDano(e.id) }} />
              {e.total} {e.label}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5 flex gap-1 border-b border-line-800">
        {[
          { id: 'vista' as Tab, label: 'Vista 360', icon: Box },
          { id: 'fotos' as Tab, label: 'Fotografias', icon: Camera },
          { id: 'danos' as Tab, label: 'Danos', icon: TriangleAlert },
          { id: 'inspecciones' as Tab, label: 'Inspecciones', icon: ClipboardList },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t.id ? 'border-breco-500 text-ink-100' : 'border-transparent text-ink-500 hover:text-ink-100'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'vista' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setModoVista('foto')}
              className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium transition ${
                modoVista === 'foto' ? 'border-breco-500 bg-breco-500/10 text-breco-500' : 'border-line-700 text-ink-400'
              }`}
            >
              Fotos reales
            </button>
            <button
              onClick={() => setModoVista('3d')}
              className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium transition ${
                modoVista === '3d' ? 'border-breco-500 bg-breco-500/10 text-breco-500' : 'border-line-700 text-ink-400'
              }`}
            >
              Modelo 3D
            </button>
            {modoVista === '3d' && puedeCrear && (
              <GhostButton onClick={() => setBorradorDano({ zonaSugerida: '' })} className="ml-auto text-xs">
                + Registrar dano
              </GhostButton>
            )}
          </div>
          <div className="h-[560px] overflow-hidden rounded-2xl border border-line-800 bg-bg-900">
            {modoVista === 'foto' ? (
              <UnidadFotoViewer
                fotos={fotosActuales}
                hotspots={hotspotsUnidad}
                danos={danosUnidad}
                modoEdicion={puedeCrear}
                onAgregarHotspot={(fotoId, xPct, yPct) => setBorradorHotspot({ modo: 'foto', fotoId, xPct, yPct, tipoSugerido: 'componente' })}
                onSelectHotspot={(h) => setHotspotEditando(h)}
                onAgregarDano={(fotoId, xPct, yPct) => setBorradorDano({ fotoId, xPct, yPct })}
              />
            ) : (
              <Unidad3DViewer unidad={unidad} hotspots={hotspotsUnidad} posicionesConDano={posicionesConDano} onSelectPosicion={handleSelectPosicion3D} />
            )}
          </div>
          <p className="text-xs text-ink-600">
            {modoVista === 'foto'
              ? 'Gira entre las fotos reales de la unidad con las flechas. Los puntos naranjas son informacion capturada; los de color son danos.'
              : 'Modelo 3D real del tractocamion, pintado con el color de la unidad. Arrastra para girar, usa la rueda para zoom y las camaras rapidas para cambiar de vista. Los puntos son componentes con informacion capturada; los de color senalan danos activos.'}
          </p>
        </div>
      )}

      {tab === 'fotos' && (
        <div>
          <p className="mb-4 text-sm text-ink-500">
            Estas son las fotos "actuales" de la unidad -- las que se usan en Vista 360 por defecto. Para comparar el estado de la
            unidad a traves del tiempo, usa la pestana Inspecciones.
          </p>
          <FotosUnidadGrid unidad={unidad} fotos={fotosActuales} readOnly={!puedeCrear} />
        </div>
      )}

      {tab === 'danos' && (
        <div className="space-y-3">
          {puedeCrear && (
            <div className="flex justify-end">
              <PrimaryButton onClick={() => setBorradorDano({ zonaSugerida: '' })}>
                <Plus size={16} /> Registrar dano
              </PrimaryButton>
            </div>
          )}
          {danosUnidad.length === 0 ? (
            <div className="rounded-2xl border border-line-800 bg-bg-800 px-4 py-14 text-center text-sm text-ink-600">
              Sin danos registrados.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-line-800 bg-bg-800">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line-800 bg-bg-700/50 text-xs uppercase tracking-wide text-ink-500">
                    <th className="px-4 py-3 font-medium">Zona</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Severidad</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Km</th>
                    <th className="px-4 py-3 font-medium">Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  {danosUnidad.map((d) => (
                    <FilaDano key={d.id} dano={d} puedeEditar={puedeEditar} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'inspecciones' && (
        <div className="space-y-6">
          {puedeCrear && (
            <div className="flex justify-end">
              <PrimaryButton onClick={() => setModalInspeccion(true)}>
                <Plus size={16} /> Nueva inspeccion
              </PrimaryButton>
            </div>
          )}

          <div className="rounded-2xl border border-line-800 bg-bg-800 p-4">
            <p className="mb-3 text-sm font-semibold text-ink-200">Comparar inspecciones</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select value={compararA} onChange={(e) => setCompararA(e.target.value)}>
                <option value="actual">Fotos actuales</option>
                {inspeccionesUnidad.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.tipoEvento} -- {i.fecha}
                  </option>
                ))}
              </Select>
              <Select value={compararB} onChange={(e) => setCompararB(e.target.value)}>
                <option value="">Selecciona para comparar...</option>
                <option value="actual">Fotos actuales</option>
                {inspeccionesUnidad.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.tipoEvento} -- {i.fecha}
                  </option>
                ))}
              </Select>
            </div>
            {compararB && (
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-500">
                    {compararA === 'actual' ? 'Fotos actuales' : `${inspeccionesUnidad.find((i) => i.id === compararA)?.tipoEvento} -- ${inspeccionesUnidad.find((i) => i.id === compararA)?.fecha}`}
                  </p>
                  <FotosUnidadGrid
                    unidad={unidad}
                    fotos={fotosUnidad.filter((f) => (compararA === 'actual' ? !f.inspeccionId : f.inspeccionId === compararA))}
                    inspeccionId={compararA === 'actual' ? undefined : compararA}
                    readOnly
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-500">
                    {compararB === 'actual' ? 'Fotos actuales' : `${inspeccionesUnidad.find((i) => i.id === compararB)?.tipoEvento} -- ${inspeccionesUnidad.find((i) => i.id === compararB)?.fecha}`}
                  </p>
                  <FotosUnidadGrid
                    unidad={unidad}
                    fotos={fotosUnidad.filter((f) => (compararB === 'actual' ? !f.inspeccionId : f.inspeccionId === compararB))}
                    inspeccionId={compararB === 'actual' ? undefined : compararB}
                    readOnly
                  />
                </div>
              </div>
            )}
          </div>

          {inspeccionesUnidad.length === 0 ? (
            <div className="rounded-2xl border border-line-800 bg-bg-800 px-4 py-14 text-center text-sm text-ink-600">
              Sin inspecciones registradas.
            </div>
          ) : (
            <div className="space-y-2">
              {inspeccionesUnidad.map((i) => (
                <div key={i.id} className="rounded-2xl border border-line-800 bg-bg-800">
                  <button
                    onClick={() => setInspeccionAbierta(inspeccionAbierta === i.id ? null : i.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <div>
                      <span className="text-sm font-semibold text-ink-100">{i.tipoEvento}</span>
                      <span className="ml-2 text-xs text-ink-500">{i.fecha}</span>
                      {i.responsable && <span className="ml-2 text-xs text-ink-600">· {i.responsable}</span>}
                    </div>
                    <span className="text-xs text-ink-600">{i.kilometraje ? `${i.kilometraje} km` : ''}</span>
                  </button>
                  {inspeccionAbierta === i.id && (
                    <div className="border-t border-line-800 p-4">
                      {i.notas && <p className="mb-3 text-sm text-ink-400">{i.notas}</p>}
                      <FotosUnidadGrid unidad={unidad} fotos={fotosUnidad.filter((f) => f.inspeccionId === i.id)} inspeccionId={i.id} readOnly={!puedeCrear} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(hotspotEditando || borradorHotspot) && (
        <HotspotFormModal
          unidad={unidad}
          hotspot={hotspotEditando}
          borrador={borradorHotspot}
          onClose={() => {
            setHotspotEditando(null);
            setBorradorHotspot(null);
          }}
        />
      )}
      {borradorDano && <RegistrarDanoModal unidad={unidad} borrador={borradorDano} onClose={() => setBorradorDano(null)} />}
      {modalInspeccion && (
        <InspeccionModal
          unidad={unidad}
          onClose={() => setModalInspeccion(false)}
          onCreada={(id) => {
            setModalInspeccion(false);
            setInspeccionAbierta(id);
            setTab('inspecciones');
          }}
        />
      )}
    </div>
  );
}

function FilaDano({ dano, puedeEditar }: { dano: UnidadDano; puedeEditar: boolean }) {
  const { unidadDanos } = useData();
  const url = useSignedUrl(dano.storagePath);

  return (
    <tr className="border-b border-line-800/70 last:border-0">
      <td className="px-4 py-3 text-ink-200">
        {dano.zona}
        {url && (
          <a href={url} target="_blank" rel="noreferrer" className="ml-2 text-xs text-breco-500 hover:underline">
            ver foto
          </a>
        )}
        {dano.observacion && <p className="mt-0.5 text-xs text-ink-600">{dano.observacion}</p>}
      </td>
      <td className="px-4 py-3 text-ink-400">{dano.tipo}</td>
      <td className="px-4 py-3 text-ink-400">{dano.severidad}</td>
      <td className="px-4 py-3 text-ink-400">{dano.fecha}</td>
      <td className="px-4 py-3 text-ink-400">{dano.kilometraje ?? 'N/D'}</td>
      <td className="px-4 py-3">
        {puedeEditar ? (
          <select
            value={dano.estatus}
            onChange={(e) => unidadDanos.update(dano.id, { estatus: e.target.value as UnidadDano['estatus'] })}
            className="rounded-lg border border-line-700 bg-bg-900 px-2 py-1 text-xs text-ink-200"
          >
            {ESTATUS_DANO.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-300">
            <span className="h-2 w-2 rounded-full" style={{ background: colorEstatusDano(dano.estatus) }} />
            {ESTATUS_DANO.find((e) => e.id === dano.estatus)?.label}
          </span>
        )}
      </td>
    </tr>
  );
}
