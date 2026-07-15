"use client";

// Vaca 3D (react-three-fiber) para Sanidad › Análisis Corporal y para el
// selector de zona del modal "Diagnosticar Animal".
// Usa la malla real (public/models/vaca.glb) con formato clínico: material gris
// monocromo facetado (flatShading), fondo estudio, sombra de contacto y
// controles orbitales. Se muestra la pose de reposo (sin animación).
// SIN PUNTOS: al pasar el mouse por el cuerpo se ilumina la zona bajo el cursor
// y una etiqueta dice qué parte es (nombre + estado). En modo seleccionable un
// click elige la zona afectada. La zona se detecta por cercanía a las 13 anclas
// anatómicas proyectadas sobre la piel por raycasting.

import React, { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html, ContactShadows, Billboard, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ZONA_ANATOMIA, ZonaInfoPanel } from "./vaca-zonas";

export type ZonaHeat3D = { zona: string; pct: number; casos: number; cond: string; label: string };

const MODEL_URL = "/models/vaca.glb";
useGLTF.preload(MODEL_URL);

/* Anclas de zona como fracción del bounding-box del modelo (invariante a
   escala/posición) + dirección de salida. La malla mira a +Z (cabeza), +Y
   arriba, ±X a los flancos. Verificado por raycasting contra la malla real:
   las 13 anclas caen sobre la piel en su ubicación anatómica. */
const ZONA_ANCLA: Record<string, { frac: [number, number, number]; dir: [number, number, number] }> = {
  cabeza: { frac: [0.5, 0.874, 0.853], dir: [0, 0.7, 0.5] },
  ojos: { frac: [0.651, 0.819, 0.877], dir: [0.5, 0, 0.7] },
  boca: { frac: [0.5, 0.678, 0.939], dir: [0, -0.25, 0.9] },
  cuello: { frac: [0.565, 0.741, 0.667], dir: [0.35, 0.5, 0.35] },
  columna: { frac: [0.5, 0.667, 0.357], dir: [0, 1, 0] },
  costillas: { frac: [0.672, 0.601, 0.518], dir: [1, 0, 0.15] },
  panza: { frac: [0.5, 0.449, 0.394], dir: [0, -1, 0] },
  piel: { frac: [0.716, 0.558, 0.332], dir: [1, 0.1, -0.1] },
  cadera: { frac: [0.651, 0.754, 0.159], dir: [0.55, 0.5, -0.35] },
  genital: { frac: [0.5, 0.558, 0.084], dir: [0, -0.25, -1] },
  ubre: { frac: [0.5, 0.34, 0.202], dir: [0, -1, 0.05] },
  cola: { frac: [0.5, 0.863, 0.078], dir: [0, 0.35, -1] },
  patas: { frac: [0.759, 0.296, 0.605], dir: [0.7, -0.25, 0.15] },
};

const heatColor = (pct: number) => (pct >= 10 ? "#dc2626" : pct >= 6 ? "#ea580c" : pct >= 3 ? "#f59e0b" : "#65a30d");

/* Paleta clínica monocroma */
const C_BODY = "#e3e8ee";
const TARGET_LEN = 3.2; // largo objetivo del modelo (unidades de escena)
const GROUND_Y = -0.9; // altura del plano de apoyo (patas / sombra)

/* ── Malla real de la vaca (glb) con material clínico gris ──
   La malla es skinned/animada, pero sólo necesitamos la pose de reposo.
   Extraemos la geometría en world-space (bakeando la matriz del nodo) y la
   mostramos como malla ESTÁTICA: así renderiza siempre (una malla skinned
   puede quedar culleada por su bounding-sphere de bind-pose). Sin esqueleto =
   sin los 25 clips de animación. */
function VacaMesh() {
  const { scene } = useGLTF(MODEL_URL);
  const { partes, scale, position } = useMemo(() => {
    scene.updateWorldMatrix(true, true);
    const geos: THREE.BufferGeometry[] = [];
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || !m.geometry) return;
      const src = m.geometry;
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", (src.getAttribute("position") as THREE.BufferAttribute).clone());
      if (src.index) g.setIndex(src.index.clone());
      g.applyMatrix4(m.matrixWorld); // bakea la pose de reposo a world-space
      g.computeVertexNormals();
      geos.push(g);
    });
    const box = new THREE.Box3();
    for (const g of geos) {
      g.computeBoundingBox();
      if (g.boundingBox) box.union(g.boundingBox);
    }
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = TARGET_LEN / (size.z || 1);
    return {
      partes: geos,
      scale: s,
      position: [-center.x * s, GROUND_Y - box.min.y * s, -center.z * s] as [number, number, number],
    };
  }, [scene]);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: C_BODY, roughness: 0.62, metalness: 0.06, flatShading: true }),
    [],
  );
  return (
    <group scale={scale} position={position}>
      {partes.map((g, i) => (
        <mesh key={i} geometry={g} material={mat} castShadow />
      ))}
    </group>
  );
}

/* Foco de zona: aro iluminado + halo aditivo (billboard) sobre la piel, más
   una etiqueta con el nombre de la parte. Es un único indicador de hover /
   selección, NO una nube de puntos. */
function ZonaFoco({ pos, color, label, pulse }: { pos: [number, number, number]; color: string; label: string; pulse: boolean }) {
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    const k = pulse ? 1 + Math.sin(state.clock.elapsedTime * 5) * 0.12 : 1;
    if (ringRef.current) ringRef.current.scale.setScalar(k);
    if (glowRef.current) {
      const m = glowRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = pulse ? 0.5 + Math.sin(state.clock.elapsedTime * 5) * 0.18 : 0.5;
    }
  });
  return (
    <group position={pos}>
      <Billboard>
        <mesh ref={glowRef} renderOrder={2}>
          <circleGeometry args={[0.17, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <group ref={ringRef}>
          <mesh renderOrder={3}>
            <ringGeometry args={[0.075, 0.1, 40]} />
            <meshBasicMaterial color={color} transparent opacity={0.95} depthWrite={false} depthTest={false} />
          </mesh>
          <mesh renderOrder={2}>
            <circleGeometry args={[0.075, 40]} />
            <meshBasicMaterial color={color} transparent opacity={0.22} depthWrite={false} depthTest={false} />
          </mesh>
        </group>
      </Billboard>
      <Html center distanceFactor={8} style={{ pointerEvents: "none" }} zIndexRange={[100, 0]}>
        <div style={{ background: "#1e293b", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 7, whiteSpace: "nowrap", transform: "translateY(-24px)", boxShadow: "0 4px 12px rgba(0,0,0,.3)" }}>{label}</div>
      </Html>
    </group>
  );
}

/* Proyecta cada zona sobre la superficie de la vaca por raycasting: calcula el
   ancla anatómica desde el bounding-box del modelo y dispara un rayo desde
   fuera hacia el ancla, tomando el punto de piel más externo. */
function ZoneProjector({
  surfaceRef,
  parentRef,
  onReady,
}: {
  surfaceRef: React.RefObject<THREE.Group | null>;
  parentRef: React.RefObject<THREE.Group | null>;
  onReady: (pos: Record<string, [number, number, number]>) => void;
}) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    const surf = surfaceRef.current;
    const parent = parentRef.current;
    if (!surf || !parent) return;
    surf.updateWorldMatrix(true, true);
    const meshes: THREE.Mesh[] = [];
    surf.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) meshes.push(m); });
    if (meshes.length === 0) return;
    const box = new THREE.Box3().setFromObject(surf);
    if (box.isEmpty()) return;
    const min = box.min;
    const size = new THREE.Vector3();
    box.getSize(size);
    const R = Math.max(size.x, size.y, size.z) * 3;
    const rc = new THREE.Raycaster();
    rc.far = R * 4;
    const out: Record<string, [number, number, number]> = {};
    for (const [zona, { frac, dir }] of Object.entries(ZONA_ANCLA)) {
      const anchor = new THREE.Vector3(
        min.x + frac[0] * size.x,
        min.y + frac[1] * size.y,
        min.z + frac[2] * size.z,
      );
      const d = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
      const origin = anchor.clone().add(d.clone().multiplyScalar(R));
      rc.set(origin, d.clone().negate());
      const hits = rc.intersectObjects(meshes, false);
      if (hits.length > 0) {
        const p = hits[0].point.clone();
        let n = d.clone();
        if (hits[0].face) n = hits[0].face.normal.clone().transformDirection(hits[0].object.matrixWorld).normalize();
        p.add(n.multiplyScalar(0.02));
        const local = parent.worldToLocal(p);
        out[zona] = [local.x, local.y, local.z];
      } else {
        const local = parent.worldToLocal(anchor.clone());
        out[zona] = [local.x, local.y, local.z];
      }
    }
    onReady(out);
    done.current = true;
  });
  return null;
}

function Escena({
  zonas,
  selectable,
  selected,
  onSelect,
  onHoverZona,
}: {
  zonas: ZonaHeat3D[];
  selectable: boolean;
  selected: string | null;
  onSelect?: (zona: string) => void;
  onHoverZona?: (zona: string | null) => void;
}) {
  const [hoverZona, setHoverZona] = useState<string | null>(null);
  const [hoverPoint, setHoverPoint] = useState<[number, number, number] | null>(null);
  const [zonePos, setZonePos] = useState<Record<string, [number, number, number]>>({});
  const statMap = useMemo(() => new Map(zonas.map((z) => [z.zona, z])), [zonas]);
  const parentRef = useRef<THREE.Group>(null);
  const surfaceRef = useRef<THREE.Group>(null);
  const listo = Object.keys(zonePos).length > 0;

  const zonaMasCercana = (worldPoint: THREE.Vector3): string | null => {
    const parent = parentRef.current;
    if (!parent) return null;
    const local = parent.worldToLocal(worldPoint.clone());
    let best: string | null = null;
    let bestD = Infinity;
    for (const [z, p] of Object.entries(zonePos)) {
      const dx = local.x - p[0], dy = local.y - p[1], dz = local.z - p[2];
      const dd = dx * dx + dy * dy + dz * dz;
      if (dd < bestD) { bestD = dd; best = z; }
    }
    return best;
  };

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!listo) return;
    e.stopPropagation();
    const z = zonaMasCercana(e.point);
    const parent = parentRef.current;
    if (!z || !parent) return;
    const local = parent.worldToLocal(e.point.clone());
    setHoverZona(z);
    setHoverPoint([local.x, local.y, local.z]);
    onHoverZona?.(z);
    document.body.style.cursor = selectable ? "pointer" : "help";
  };
  const onOut = () => {
    setHoverZona(null);
    setHoverPoint(null);
    onHoverZona?.(null);
    document.body.style.cursor = "default";
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!selectable || !onSelect) return;
    e.stopPropagation();
    const z = zonaMasCercana(e.point);
    if (z) onSelect(z);
  };

  const labelDe = (z: string): string => {
    const s = statMap.get(z);
    const base = s?.label || ZONA_ANATOMIA[z]?.label || z;
    if (!selectable && s && s.casos > 0) return `${base} · ${s.pct}% · ${s.cond}`;
    return base;
  };
  const colorDe = (z: string): string => {
    if (selectable) return "#16a34a";
    const s = statMap.get(z);
    return s && s.casos > 0 ? heatColor(s.pct) : "#0ea5e9";
  };

  return (
    <group ref={parentRef}>
      <group ref={surfaceRef} onPointerMove={onMove} onPointerOut={onOut} onClick={onClick}>
        <VacaMesh />
      </group>
      <ZoneProjector surfaceRef={surfaceRef} parentRef={parentRef} onReady={setZonePos} />

      {/* Selección persistente (modo seleccionable), cuando no se está sobre el cuerpo */}
      {selectable && selected && zonePos[selected] && !hoverPoint && (
        <ZonaFoco pos={zonePos[selected]} color="#16a34a" label={labelDe(selected)} pulse={false} />
      )}

      {/* Foco de hover: sigue el cursor sobre la piel e informa la parte */}
      {hoverPoint && hoverZona && (
        <ZonaFoco pos={hoverPoint} color={colorDe(hoverZona)} label={labelDe(hoverZona)} pulse />
      )}
    </group>
  );
}

export default function Cow3D({
  zonas,
  height = 320,
  selectable = false,
  selected = null,
  onSelect,
}: {
  zonas: ZonaHeat3D[];
  height?: number;
  selectable?: boolean;
  selected?: string | null;
  onSelect?: (zona: string) => void;
}) {
  const [hoverZona, setHoverZona] = useState<string | null>(null);
  const statMap = useMemo(() => new Map(zonas.map((z) => [z.zona, z])), [zonas]);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ width: "100%", height, borderRadius: 14, overflow: "hidden", background: "linear-gradient(165deg,#f3f6f9 0%,#e4eaf0 60%,#d9e1e9 100%)", position: "relative" }}>
        <Canvas shadows camera={{ position: [2.5, 1.4, 4.4], fov: 40 }} dpr={[1, 2]}>
          <ambientLight intensity={0.85} />
          <directionalLight position={[4, 6, 4]} intensity={1.05} castShadow shadow-mapSize={[1024, 1024]} />
          <directionalLight position={[-5, 3, -3]} intensity={0.4} />
          <directionalLight position={[0, 2, -5]} intensity={0.25} />
          <Suspense fallback={null}>
            <Escena zonas={zonas} selectable={selectable} selected={selected} onSelect={onSelect} onHoverZona={setHoverZona} />
          </Suspense>
          <ContactShadows position={[0, GROUND_Y, 0]} opacity={0.32} scale={7} blur={2.6} far={3} />
          <OrbitControls enablePan={false} autoRotate={!selectable && !hoverZona} autoRotateSpeed={0.7} minDistance={3} maxDistance={8} minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 1.9} target={[0, 0.15, 0]} />
        </Canvas>
        <div style={{ position: "absolute", left: "50%", bottom: 8, transform: "translateX(-50%)", fontSize: 10.5, fontWeight: 600, color: "#64748b", background: "rgba(255,255,255,.82)", padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap", pointerEvents: "none" }}>
          {selectable ? "Pasá el mouse por el cuerpo y tocá para elegir la zona" : "Pasá el mouse por el cuerpo para ver cada parte"}
        </div>
      </div>

      {/* Panel de detalle de la zona bajo el cursor (mismo que la vista 2D) */}
      {!selectable && <ZonaInfoPanel zona={hoverZona} stat={hoverZona ? statMap.get(hoverZona) : undefined} />}
    </div>
  );
}
