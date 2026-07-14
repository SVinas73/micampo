"use client";

// Vaca 3D (react-three-fiber) para Sanidad › Análisis Corporal y para el
// selector de zona del modal "Diagnosticar Animal".
// Usa la malla real (public/models/vaca.glb) con el MISMO formato clínico:
// material gris monocromo facetado (flatShading), fondo estudio, sombra de
// contacto y controles orbitales. Los 25 clips de animación no se reproducen:
// se muestra la pose de reposo.
// Marcadores de zona clickeables, proyectados por raycasting sobre la piel:
// en modo lectura se colorean por intensidad de casos reales (heatmap 3D); en
// modo seleccionable eligen la zona afectada. Se iluminan al pasar el mouse.

import React, { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, ContactShadows, Billboard, useGLTF } from "@react-three/drei";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";

export type ZonaHeat3D = { zona: string; pct: number; casos: number; cond: string; label: string };

const MODEL_URL = "/models/vaca.glb";
useGLTF.preload(MODEL_URL);

/* Anclas de zona como fracción del bounding-box del modelo (invariante a
   escala/posición) + dirección de salida. La malla mira a +Z (cabeza), +Y
   arriba, ±X a los flancos. Verificado por raycasting contra la malla real:
   los 13 puntos caen sobre la piel en su ubicación anatómica. */
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

/* Paleta clínica monocroma (mismo formato que la versión anterior) */
const C_BODY = "#e3e8ee";
const TARGET_LEN = 3.2; // largo objetivo del modelo (unidades de escena)
const GROUND_Y = -0.9; // altura del plano de apoyo (patas / sombra)

/* ── Malla real de la vaca (glb) con material clínico gris ── */
function VacaMesh() {
  const { scene } = useGLTF(MODEL_URL);
  const model = useMemo(() => {
    const root = cloneSkinned(scene) as THREE.Object3D;
    const mat = new THREE.MeshStandardMaterial({ color: C_BODY, roughness: 0.62, metalness: 0.06, flatShading: true });
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.material = mat;
        m.castShadow = true;
        m.receiveShadow = false;
        m.frustumCulled = false;
      }
    });
    // Normalizar: escala uniforme al largo objetivo, centrado en X/Z y apoyado en el piso.
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const s = TARGET_LEN / (size.z || 1);
    root.scale.setScalar(s);
    root.position.set(-center.x * s, GROUND_Y - box.min.y * s, -center.z * s);
    return root;
  }, [scene]);
  return <primitive object={model} />;
}

/* Punto de zona: disco plano chico (billboard, siempre mira a cámara), no una
   esfera. Aro blanco fino + relleno de color; discreto salvo hover/selección. */
function Marcador({
  pos,
  color,
  label,
  activo,
  seleccionado,
  clickable,
  onHover,
  onLeave,
  onClick,
}: {
  pos: [number, number, number];
  color: string;
  label: string;
  activo: boolean;
  seleccionado: boolean;
  clickable: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick?: () => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const on = activo || seleccionado;
  useFrame((state) => {
    if (ref.current) {
      const base = on ? 1.4 : 1;
      const pulso = seleccionado ? 1 + Math.sin(state.clock.elapsedTime * 4) * 0.08 : 1;
      ref.current.scale.setScalar(base * pulso);
    }
    // Halo "encendido" al hover: crece y late con opacidad
    if (glowRef.current) {
      const m = glowRef.current.material as THREE.MeshBasicMaterial;
      if (on) {
        const t = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.18;
        glowRef.current.scale.setScalar(t);
        m.opacity = 0.55 + Math.sin(state.clock.elapsedTime * 5) * 0.2;
      } else {
        m.opacity = 0;
      }
    }
  });
  return (
    <group position={pos}>
      <Billboard>
        {/* Glow aditivo (se "ilumina" al pasar el mouse / seleccionar) */}
        <mesh ref={glowRef} renderOrder={2}>
          <circleGeometry args={[0.12, 28]} />
          <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <group ref={ref} renderOrder={3}>
          {/* Zona de toque invisible más generosa que el punto visible */}
          <mesh
            onPointerOver={(e) => { e.stopPropagation(); onHover(); if (clickable) document.body.style.cursor = "pointer"; }}
            onPointerOut={() => { onLeave(); document.body.style.cursor = "default"; }}
            onClick={(e) => { if (onClick) { e.stopPropagation(); onClick(); } }}
            visible={false}
          >
            <circleGeometry args={[0.12, 16]} />
          </mesh>
          {/* Aro blanco */}
          <mesh renderOrder={3}>
            <ringGeometry args={[0.036, 0.05, 28]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={on ? 1 : 0.92} depthWrite={false} depthTest={false} />
          </mesh>
          {/* Punto de color */}
          <mesh renderOrder={4}>
            <circleGeometry args={[0.034, 28]} />
            <meshBasicMaterial color={color} transparent opacity={on ? 1 : 0.9} depthWrite={false} depthTest={false} />
          </mesh>
        </group>
      </Billboard>
      {on && (
        <Html center distanceFactor={8} style={{ pointerEvents: "none" }}>
          <div style={{ background: "#1e293b", color: "#fff", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap", transform: "translateY(-20px)", boxShadow: "0 4px 12px rgba(0,0,0,.3)" }}>{label}</div>
        </Html>
      )}
    </group>
  );
}

/* Proyecta cada zona sobre la superficie de la vaca por raycasting: calcula el
   ancla anatómica desde el bounding-box del modelo y dispara un rayo desde
   fuera hacia el ancla en la dirección de salida, tomando el punto de piel más
   externo. Así los puntos quedan SIEMPRE sobre el cuerpo. */
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
        p.add(n.multiplyScalar(0.02)); // apenas por encima de la piel
        const local = parent.worldToLocal(p);
        out[zona] = [local.x, local.y, local.z];
      } else {
        // fallback: ancla proyectada al parent
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
}: {
  zonas: ZonaHeat3D[];
  selectable: boolean;
  selected: string | null;
  onSelect?: (zona: string) => void;
}) {
  const [hov, setHov] = useState<string | null>(null);
  const [zonePos, setZonePos] = useState<Record<string, [number, number, number]>>({});
  const statMap = useMemo(() => new Map(zonas.map((z) => [z.zona, z])), [zonas]);
  const parentRef = useRef<THREE.Group>(null);
  const surfaceRef = useRef<THREE.Group>(null);
  const listo = Object.keys(zonePos).length > 0;

  return (
    <group ref={parentRef}>
      <group ref={surfaceRef}>
        <VacaMesh />
      </group>
      <ZoneProjector surfaceRef={surfaceRef} parentRef={parentRef} onReady={setZonePos} />
      {listo && Object.entries(ZONA_ANCLA).map(([zona]) => {
        const pos = zonePos[zona];
        if (!pos) return null;
        const s = statMap.get(zona);
        const pct = s?.pct ?? 0;
        const sel = selectable && selected === zona;
        const color = selectable
          ? (sel ? "#16a34a" : "#64748b")
          : s && s.casos > 0 ? heatColor(pct) : "#94a3b8";
        const label = selectable
          ? (s?.label || zona)
          : s && s.casos > 0 ? `${s.label}: ${pct}% · ${s.cond}` : `${s?.label || zona}: sin casos`;
        return (
          <Marcador
            key={zona}
            pos={pos}
            color={color}
            label={label}
            activo={hov === zona}
            seleccionado={sel}
            clickable={selectable}
            onHover={() => setHov(zona)}
            onLeave={() => setHov(null)}
            onClick={selectable && onSelect ? () => onSelect(zona) : undefined}
          />
        );
      })}
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
  return (
    <div style={{ width: "100%", height, borderRadius: 14, overflow: "hidden", background: "linear-gradient(165deg,#f3f6f9 0%,#e4eaf0 60%,#d9e1e9 100%)", position: "relative" }}>
      <Canvas shadows camera={{ position: [2.5, 1.4, 4.4], fov: 40 }} dpr={[1, 2]}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[4, 6, 4]} intensity={1.05} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-5, 3, -3]} intensity={0.4} />
        <directionalLight position={[0, 2, -5]} intensity={0.25} />
        <Suspense fallback={null}>
          <Escena zonas={zonas} selectable={selectable} selected={selected} onSelect={onSelect} />
        </Suspense>
        <ContactShadows position={[0, GROUND_Y, 0]} opacity={0.32} scale={7} blur={2.6} far={3} />
        <OrbitControls enablePan={false} autoRotate={!selectable} autoRotateSpeed={0.7} minDistance={3} maxDistance={8} minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 1.9} target={[0, 0.15, 0]} />
      </Canvas>
      {selectable && (
        <div style={{ position: "absolute", left: "50%", bottom: 8, transform: "translateX(-50%)", fontSize: 10.5, fontWeight: 600, color: "#64748b", background: "rgba(255,255,255,.8)", padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap", pointerEvents: "none" }}>
          Girá el modelo y tocá un punto para elegir la zona
        </div>
      )}
    </div>
  );
}
