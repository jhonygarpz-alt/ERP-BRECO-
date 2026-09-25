import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Unidad, UnidadHotspot } from '../../types';
import { colorHexUnidad, colorEstatusDano } from '../../lib/unidad360';
import { HOTSPOTS_CASCADIA, type PosicionHotspot3D } from '../../lib/unidad360Diagrama';

const MODEL_URL = '/models/cascadia-2020.glb';
const NOMBRE_NODO_CABINA = 'cab truck 001';
const NOMBRE_MATERIAL_PINTURA = 'AZUL';

type VistaRapida = 'frontal' | 'trasera' | 'izquierda' | 'derecha' | '3-4';

const VISTAS: { id: VistaRapida; label: string }[] = [
  { id: 'frontal', label: 'Frontal' },
  { id: 'trasera', label: 'Trasera' },
  { id: 'izquierda', label: 'Lateral izquierdo' },
  { id: 'derecha', label: 'Lateral derecho' },
  { id: '3-4', label: '3/4' },
];

interface EjesModelo {
  center: THREE.Vector3;
  size: THREE.Vector3;
  forward: THREE.Vector3;
  right: THREE.Vector3;
  forwardAxis: 'x' | 'z';
  radius: number;
}

interface MarcadorPantalla {
  key: string;
  x: number;
  y: number;
  visible: boolean;
  posicion: PosicionHotspot3D;
  hotspot?: UnidadHotspot;
  danoActivo?: boolean;
}

/**
 * Fondo tipo estudio fotografico automotriz: degradado vertical azul marino
 * (mas oscuro arriba, un tono mas claro en el "horizonte"). Un fondo claro
 * hacia una unidad blanca o de colores claros practicamente desaparece --
 * el contraste oscuro es lo que hace que la carroceria "resalte" como en
 * un configurador profesional.
 */
function crearFondoEstudio(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const gradiente = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradiente.addColorStop(0, '#060a1a');
  gradiente.addColorStop(0.65, '#0f1c3d');
  gradiente.addColorStop(1, '#2a3f6e');
  ctx.fillStyle = gradiente;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  return textura;
}

// El GLB pesa ~15MB -- se carga una sola vez por sesion de navegador y se
// clona (barato) para cada unidad que se abra despues, en vez de
// redescargarlo cada vez que se entra a Vista 360.
let cargaModelo: Promise<GLTF> | null = null;
function cargarModeloCascadia(): Promise<GLTF> {
  if (!cargaModelo) {
    const loader = new GLTFLoader();
    cargaModelo = loader.loadAsync(MODEL_URL);
  }
  return cargaModelo;
}

function calcularEjes(modelo: THREE.Object3D): EjesModelo {
  const box = new THREE.Box3().setFromObject(modelo);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const forwardAxis: 'x' | 'z' = size.x >= size.z ? 'x' : 'z';

  let forwardSign = 1;
  const cabina = modelo.getObjectByName(NOMBRE_NODO_CABINA);
  if (cabina) {
    const cabBox = new THREE.Box3().setFromObject(cabina);
    const cabCenter = cabBox.getCenter(new THREE.Vector3());
    forwardSign = cabCenter[forwardAxis] >= center[forwardAxis] ? 1 : -1;
  }

  const forward = new THREE.Vector3();
  forward[forwardAxis] = forwardSign;
  const up = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(up, forward).normalize();
  const radius = size.length() / 2;

  return { center, size, forward, right, forwardAxis, radius };
}

function puntoDesdeFraccion(ejes: EjesModelo, boxMinY: number, fraccion: [number, number, number]): THREE.Vector3 {
  const [fFwd, fUp, fSide] = fraccion;
  const p = ejes.center.clone();
  p.add(ejes.forward.clone().multiplyScalar((fFwd * ejes.size[ejes.forwardAxis]) / 2));
  const sideAxis = ejes.forwardAxis === 'x' ? 'z' : 'x';
  p.add(ejes.right.clone().multiplyScalar((fSide * ejes.size[sideAxis]) / 2));
  p.y = boxMinY + fUp * ejes.size.y;
  return p;
}

function posicionCamara(ejes: EjesModelo, vista: VistaRapida): { pos: THREE.Vector3; target: THREE.Vector3 } {
  const d = ejes.radius * 2.4;
  const target = ejes.center.clone();
  const alturaOjo = ejes.center.clone().add(new THREE.Vector3(0, ejes.size.y * 0.15, 0));
  switch (vista) {
    case 'frontal':
      return { pos: alturaOjo.clone().add(ejes.forward.clone().multiplyScalar(d)), target };
    case 'trasera':
      return { pos: alturaOjo.clone().add(ejes.forward.clone().multiplyScalar(-d)), target };
    case 'izquierda':
      return { pos: alturaOjo.clone().add(ejes.right.clone().multiplyScalar(-d)), target };
    case 'derecha':
      return { pos: alturaOjo.clone().add(ejes.right.clone().multiplyScalar(d)), target };
    case '3-4':
    default:
      return {
        pos: ejes.center
          .clone()
          .add(ejes.forward.clone().multiplyScalar(d * 0.62))
          .add(ejes.right.clone().multiplyScalar(d * 0.62))
          .add(new THREE.Vector3(0, ejes.size.y * 0.55, 0)),
        target,
      };
  }
}

/** Visor 3D del tractocamion real (modelo GLB, Freightliner Cascadia 2020): rotacion libre, zoom, vistas rapidas y hotspots interactivos sobre el modelo, con iluminacion de estudio (PBR + ambiente). */
export function Unidad3DViewer({
  unidad,
  hotspots,
  posicionesConDano,
  onSelectPosicion,
}: {
  unidad: Unidad;
  hotspots: UnidadHotspot[];
  posicionesConDano: Set<string>;
  onSelectPosicion: (posicion: PosicionHotspot3D, hotspot?: UnidadHotspot) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const marcadoresRef = useRef<{ pos: THREE.Vector3; posicion: PosicionHotspot3D }[]>([]);
  const onSelectRef = useRef(onSelectPosicion);
  onSelectRef.current = onSelectPosicion;
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const vistaFnRef = useRef<((vista: VistaRapida) => void) | null>(null);
  const [vistaActiva, setVistaActiva] = useState<VistaRapida>('3-4');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelado = false;
    let raf = 0;
    let resizeObserver: ResizeObserver | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let controls: OrbitControls | null = null;
    let tweenId = 0;

    const scene = new THREE.Scene();
    scene.background = crearFondoEstudio();
    scene.fog = new THREE.Fog('#0f1c3d', 35, 100);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500);

    setCargando(true);
    setErrorCarga('');

    cargarModeloCascadia()
      .then((gltf) => {
        if (cancelado) return;

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.appendChild(renderer.domElement);

        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

        const modelo = gltf.scene.clone(true);
        modelo.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
            if (Array.isArray(obj.material)) {
              obj.material = obj.material.map((m) => m.clone());
            } else if (obj.material) {
              obj.material = obj.material.clone();
            }
          }
        });
        // Repinta la carroceria (material "AZUL" del GLB) con el color real de la unidad.
        const colorUnidad = colorHexUnidad(unidad.color);
        modelo.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            for (const mat of mats) {
              if (mat?.name === NOMBRE_MATERIAL_PINTURA && 'color' in mat) {
                (mat as THREE.MeshStandardMaterial).color.set(colorUnidad);
              }
            }
          }
        });
        scene.add(modelo);

        const ejes = calcularEjes(modelo);

        const pisoBase = new THREE.Mesh(
          new THREE.CircleGeometry(ejes.radius * 6, 64),
          new THREE.MeshStandardMaterial({ color: '#16213f', roughness: 0.45, metalness: 0.15 }),
        );
        pisoBase.rotation.x = -Math.PI / 2;
        pisoBase.position.y = ejes.center.y - ejes.size.y / 2 - 0.01;
        pisoBase.receiveShadow = true;
        scene.add(pisoBase);
        const piso = new THREE.Mesh(
          new THREE.CircleGeometry(ejes.radius * 6, 64),
          new THREE.ShadowMaterial({ opacity: 0.55 }),
        );
        piso.rotation.x = -Math.PI / 2;
        piso.position.y = ejes.center.y - ejes.size.y / 2;
        piso.receiveShadow = true;
        scene.add(piso);

        const keyLight = new THREE.DirectionalLight('#ffffff', 2.4);
        keyLight.position.copy(ejes.center.clone().add(ejes.forward.clone().multiplyScalar(ejes.radius)).add(new THREE.Vector3(ejes.radius * 0.8, ejes.radius * 2.2, 0)));
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(2048, 2048);
        keyLight.shadow.camera.near = 0.1;
        keyLight.shadow.camera.far = ejes.radius * 8;
        keyLight.shadow.camera.left = -ejes.radius * 2;
        keyLight.shadow.camera.right = ejes.radius * 2;
        keyLight.shadow.camera.top = ejes.radius * 2;
        keyLight.shadow.camera.bottom = -ejes.radius * 2;
        keyLight.shadow.bias = -0.0005;
        keyLight.target.position.copy(ejes.center);
        scene.add(keyLight, keyLight.target);

        const fillLight = new THREE.DirectionalLight('#cfe0ff', 0.6);
        fillLight.position.copy(ejes.center.clone().sub(ejes.forward.clone().multiplyScalar(ejes.radius)).add(new THREE.Vector3(0, ejes.radius, 0)));
        scene.add(fillLight);

        renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
        camera.aspect = (container.clientWidth || 1) / (container.clientHeight || 1);
        camera.updateProjectionMatrix();

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.minDistance = ejes.radius * 0.6;
        controls.maxDistance = ejes.radius * 6;
        controls.maxPolarAngle = Math.PI * 0.49;

        function irAVista(vista: VistaRapida, animar = true) {
          const { pos, target } = posicionCamara(ejes, vista);
          if (!animar) {
            camera.position.copy(pos);
            controls!.target.copy(target);
            controls!.update();
            return;
          }
          const desdePos = camera.position.clone();
          const desdeTarget = controls!.target.clone();
          const inicio = performance.now();
          const dur = 650;
          controls!.enabled = false;
          cancelAnimationFrame(tweenId);
          function paso(ahora: number) {
            const t = Math.min(1, (ahora - inicio) / dur);
            const ease = 1 - Math.pow(1 - t, 3);
            camera.position.lerpVectors(desdePos, pos, ease);
            controls!.target.lerpVectors(desdeTarget, target, ease);
            controls!.update();
            if (t < 1) {
              tweenId = requestAnimationFrame(paso);
            } else {
              controls!.enabled = true;
            }
          }
          tweenId = requestAnimationFrame(paso);
        }
        vistaFnRef.current = irAVista;
        irAVista('3-4', false);

        marcadoresRef.current = HOTSPOTS_CASCADIA.map((h) => ({
          pos: puntoDesdeFraccion(ejes, ejes.center.y - ejes.size.y / 2, h.fraccion),
          posicion: h,
        }));

        function resize() {
          if (!container || !renderer) return;
          const w = container.clientWidth || 1;
          const hgt = container.clientHeight || 1;
          camera.aspect = w / hgt;
          camera.updateProjectionMatrix();
          renderer.setSize(w, hgt);
        }
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);

        function animar() {
          controls?.update();
          renderer?.render(scene, camera);
          const overlay = overlayRef.current;
          if (overlay && container) {
            const w = container.clientWidth;
            const hgt = container.clientHeight;
            const proyectados = marcadoresRef.current.map((m) => {
              const v = m.pos.clone().project(camera);
              return { key: m.posicion.key, x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * hgt, visible: v.z < 1 };
            });
            overlay.dataset.puntos = JSON.stringify(proyectados);
            overlay.dispatchEvent(new CustomEvent('puntos-actualizados'));
          }
          raf = requestAnimationFrame(animar);
        }
        animar();
        setCargando(false);
      })
      .catch((err) => {
        if (!cancelado) {
          console.error('No se pudo cargar el modelo 3D:', err);
          setErrorCarga('No se pudo cargar el modelo 3D de la unidad.');
          setCargando(false);
        }
      });

    return () => {
      cancelado = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(tweenId);
      resizeObserver?.disconnect();
      controls?.dispose();
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement.parentElement === container) {
          container.removeChild(renderer.domElement);
        }
      }
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidad.id, unidad.color]);

  return (
    <div className="flex h-full flex-col gap-2">
      <div ref={containerRef} className="relative flex-1 overflow-hidden rounded-t-2xl">
        {cargando && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f1c3d] text-sm text-ink-400">
            Cargando modelo 3D...
          </div>
        )}
        {errorCarga && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f1c3d] text-sm text-red-400">{errorCarga}</div>
        )}
        <MarcadoresOverlay
          overlayRef={overlayRef}
          hotspots={hotspots}
          posicionesConDano={posicionesConDano}
          onSelectPosicion={(posicion, hotspot) => onSelectRef.current(posicion, hotspot)}
        />
      </div>
      <div className="flex flex-wrap gap-1.5 bg-bg-900 px-2 py-2">
        {VISTAS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => {
              setVistaActiva(v.id);
              vistaFnRef.current?.(v.id);
            }}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              vistaActiva === v.id ? 'border-breco-500 bg-breco-500/10 text-breco-500' : 'border-line-700 text-ink-400 hover:text-ink-100'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MarcadoresOverlay({
  overlayRef,
  hotspots,
  posicionesConDano,
  onSelectPosicion,
}: {
  overlayRef: React.RefObject<HTMLDivElement | null>;
  hotspots: UnidadHotspot[];
  posicionesConDano: Set<string>;
  onSelectPosicion: (posicion: PosicionHotspot3D, hotspot?: UnidadHotspot) => void;
}) {
  const [puntos, setPuntos] = useState<MarcadorPantalla[]>([]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    function onActualizar() {
      const raw = JSON.parse(overlay!.dataset.puntos || '[]') as { key: string; x: number; y: number; visible: boolean }[];
      setPuntos(
        raw.map((r) => {
          const posicion = HOTSPOTS_CASCADIA.find((h) => h.key === r.key)!;
          const hotspot = hotspots.find((h) => h.posicion3d === r.key);
          return { ...r, posicion, hotspot, danoActivo: posicionesConDano.has(r.key) };
        }),
      );
    }
    overlay.addEventListener('puntos-actualizados', onActualizar);
    return () => overlay.removeEventListener('puntos-actualizados', onActualizar);
  }, [overlayRef, hotspots, posicionesConDano]);

  return (
    <div ref={overlayRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {puntos
        .filter((p) => p.visible)
        .map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onSelectPosicion(p.posicion, p.hotspot)}
            title={p.posicion.label}
            style={{
              position: 'absolute',
              left: p.x - 11,
              top: p.y - 11,
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: '2px solid white',
              background: p.danoActivo ? colorEstatusDano('Activo') : p.hotspot ? '#FF6A39' : 'rgba(20,33,61,0.55)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
              pointerEvents: 'auto',
              cursor: 'pointer',
            }}
          />
        ))}
    </div>
  );
}
