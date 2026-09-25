import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Unidad, UnidadHotspot } from '../../types';
import { colorHexUnidad, colorEstatusDano } from '../../lib/unidad360';
import { generarLayoutDiagrama3D, type PosicionHotspot3D } from '../../lib/unidad360Diagrama';

interface MarcadorPantalla {
  key: string;
  x: number;
  y: number;
  visible: boolean;
  posicion: PosicionHotspot3D;
  hotspot?: UnidadHotspot;
  danoActivo?: boolean;
}

/** Diagrama 3D generico de la unidad (no fotorrealista): gira libremente con el mouse y muestra hotspots fijos segun la familia del vehiculo (tractocamion, camion, etc.) y su color real. */
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
  const layout = generarLayoutDiagrama3D(unidad);
  const marcadoresRef = useRef<{ pos: THREE.Vector3; posicion: PosicionHotspot3D }[]>([]);
  const onSelectRef = useRef(onSelectPosicion);
  onSelectRef.current = onSelectPosicion;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a');

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(6, 4.5, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0.6, 1.0, 0);
    controls.enableDamping = true;
    controls.minDistance = 3;
    controls.maxDistance = 20;
    controls.update();

    scene.add(new THREE.AmbientLight('#ffffff', 0.7));
    const dir = new THREE.DirectionalLight('#ffffff', 1.1);
    dir.position.set(5, 8, 4);
    scene.add(dir);
    const dir2 = new THREE.DirectionalLight('#8fb3ff', 0.4);
    dir2.position.set(-5, 3, -4);
    scene.add(dir2);

    const piso = new THREE.Mesh(
      new THREE.CircleGeometry(8, 48),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 1 }),
    );
    piso.rotation.x = -Math.PI / 2;
    piso.position.y = -0.02;
    scene.add(piso);

    const colorUnidad = colorHexUnidad(unidad.color);
    const matColor = new THREE.MeshStandardMaterial({ color: colorUnidad, roughness: 0.5, metalness: 0.15 });
    const matChasis = new THREE.MeshStandardMaterial({ color: '#374151', roughness: 0.8 });
    const matLlanta = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.9 });
    const matVidrio = new THREE.MeshStandardMaterial({ color: '#0ea5e9', roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.55 });

    for (const parte of layout.partes) {
      const geo = new THREE.BoxGeometry(...parte.tamano);
      const mesh = new THREE.Mesh(geo, parte.colorUnidad ? matColor : matChasis);
      mesh.position.set(...parte.centro);
      scene.add(mesh);
      if (parte.id === 'cabina') {
        const vidrio = new THREE.Mesh(
          new THREE.BoxGeometry(parte.tamano[0] * 0.55, parte.tamano[1] * 0.4, parte.tamano[2] * 1.01),
          matVidrio,
        );
        vidrio.position.set(parte.centro[0] + parte.tamano[0] * 0.18, parte.centro[1] + parte.tamano[1] * 0.28, parte.centro[2]);
        scene.add(vidrio);
      }
    }

    for (const eje of layout.ejes) {
      for (const signo of [-1, 1]) {
        const llanta = new THREE.Mesh(
          new THREE.CylinderGeometry(layout.radioLlanta, layout.radioLlanta, 0.35, 20),
          matLlanta,
        );
        llanta.rotation.z = Math.PI / 2;
        llanta.position.set(eje.x, layout.radioLlanta, signo * (eje.ancho / 2 + 0.02));
        scene.add(llanta);
      }
    }

    marcadoresRef.current = layout.hotspots.map((h) => ({ pos: new THREE.Vector3(...h.pos), posicion: h }));

    function resize() {
      if (!container) return;
      const w = container.clientWidth || 1;
      const hgt = container.clientHeight || 1;
      camera.aspect = w / hgt;
      camera.updateProjectionMatrix();
      renderer.setSize(w, hgt);
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let raf = 0;
    function animar() {
      controls.update();
      renderer.render(scene, camera);
      const overlay = overlayRef.current;
      if (overlay) {
        const w = container!.clientWidth;
        const hgt = container!.clientHeight;
        const proyectados: { key: string; x: number; y: number; visible: boolean }[] = marcadoresRef.current.map((m) => {
          const v = m.pos.clone().project(camera);
          return { key: m.posicion.key, x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * hgt, visible: v.z < 1 };
        });
        overlay.dataset.puntos = JSON.stringify(proyectados);
        overlay.dispatchEvent(new CustomEvent('puntos-actualizados'));
      }
      raf = requestAnimationFrame(animar);
    }
    animar();

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidad.id, unidad.tipo, unidad.color, unidad.numeroEjes]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MarcadoresOverlay
        overlayRef={overlayRef}
        layout={layout}
        hotspots={hotspots}
        posicionesConDano={posicionesConDano}
        onSelectPosicion={(posicion, hotspot) => onSelectRef.current(posicion, hotspot)}
      />
    </div>
  );
}

function MarcadoresOverlay({
  overlayRef,
  layout,
  hotspots,
  posicionesConDano,
  onSelectPosicion,
}: {
  overlayRef: React.RefObject<HTMLDivElement | null>;
  layout: ReturnType<typeof generarLayoutDiagrama3D>;
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
          const posicion = layout.hotspots.find((h) => h.key === r.key)!;
          const hotspot = hotspots.find((h) => h.posicion3d === r.key);
          return { ...r, posicion, hotspot, danoActivo: posicionesConDano.has(r.key) };
        }),
      );
    }
    overlay.addEventListener('puntos-actualizados', onActualizar);
    return () => overlay.removeEventListener('puntos-actualizados', onActualizar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, hotspots, posicionesConDano]);

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
              left: p.x - 10,
              top: p.y - 10,
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: '2px solid white',
              background: p.danoActivo ? colorEstatusDano('Activo') : p.hotspot ? '#FF6A39' : 'rgba(255,255,255,0.35)',
              boxShadow: '0 0 0 3px rgba(0,0,0,0.25)',
              pointerEvents: 'auto',
              cursor: 'pointer',
            }}
          />
        ))}
    </div>
  );
}
