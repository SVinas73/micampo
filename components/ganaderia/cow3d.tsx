"use client";

// Vaca 3D (react-three-fiber) para Sanidad › Análisis Corporal y para el
// selector de zona del modal "Diagnosticar Animal".
// Estilo clínico low-poly: malla facetada monocroma (flatShading + wireframe
// sutil) con líneas de despiece blancas entre zonas, rotable con OrbitControls.
// Marcadores de zona clickeables: en modo lectura se colorean por intensidad de
// casos reales (heatmap 3D); en modo seleccionable eligen la zona afectada.

import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, ContactShadows, Billboard } from "@react-three/drei";
import * as THREE from "three";

export type ZonaHeat3D = { zona: string; pct: number; casos: number; cond: string; label: string };

/* Posición 3D de cada zona sobre el cuerpo (cabeza en -X, cola en +X).
   Cobertura clínica completa: cabeza/ojos/boca, cuello, tórax, panza, lomo,
   piel (flanco), cadera, genital-perineal, ubre, cola y patas. */
const ZONA_3D: Record<string, [number, number, number]> = {
  cabeza: [-1.7, 0.62, 0.1],
  ojos: [-1.9, 0.42, 0.22],
  boca: [-2.1, 0.14, 0.1],
  cuello: [-1.1, 0.66, 0.18],
  columna: [0.0, 0.82, 0],
  costillas: [-0.42, 0.2, 0.62],
  panza: [0.05, -0.52, 0.36],
  piel: [0.32, 0.34, 0.58],
  cadera: [0.82, 0.66, 0.16],
  genital: [1.18, -0.1, 0.16],
  ubre: [0.5, -0.9, 0.1],
  cola: [1.48, 0.28, 0],
  patas: [-0.74, -0.92, 0.36],
};

const heatColor = (pct: number) => (pct >= 10 ? "#dc2626" : pct >= 6 ? "#ea580c" : pct >= 3 ? "#f59e0b" : "#65a30d");

/* Paleta clínica monocroma (como la referencia) */
const C_BODY = "#e3e8ee";
const C_HEAD = "#e9edf2";
const C_LEG = "#d7dde4";
const C_DARK = "#c6cdd6";
const C_HOOF = "#9aa4af";
const C_WIRE = "#aab4bf";
const C_SEAM = "#ffffff";

/* ── Pieza facetada: sólido flatShading + wireframe sutil (malla triangulada visible) ── */
function Pieza({
  geo,
  color = C_BODY,
  position,
  rotation,
  scale,
  wire = true,
}: {
  geo: THREE.BufferGeometry;
  color?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
  wire?: boolean;
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color={color} flatShading roughness={0.55} metalness={0.08} />
      </mesh>
      {wire && (
        <mesh geometry={geo}>
          <meshBasicMaterial color={C_WIRE} wireframe transparent opacity={0.28} />
        </mesh>
      )}
    </group>
  );
}

/* Anillo blanco de "despiece" alrededor del cuerpo en la posición x dada. */
function Seam({ x }: { x: number }) {
  // Cuerpo: esfera escalada [1.3, 0.74, 0.64] → sección en x: f = sqrt(1-(x/1.3)^2)
  const f = Math.sqrt(Math.max(0.05, 1 - (x / 1.3) ** 2));
  const ry = 0.74 * f * 1.035;
  const rz = 0.64 * f * 1.035;
  return (
    <mesh position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={[rz, ry, 1]}>
      <torusGeometry args={[1, 0.02, 8, 64]} />
      <meshStandardMaterial color={C_SEAM} roughness={0.4} metalness={0} />
    </mesh>
  );
}

function CowBody() {
  // Geometrías low-poly compartidas (pocos segmentos → facetas visibles)
  const gBody = useMemo(() => new THREE.SphereGeometry(1, 18, 12), []);
  const gPart = useMemo(() => new THREE.SphereGeometry(1, 12, 9), []);
  const gSmall = useMemo(() => new THREE.SphereGeometry(1, 8, 6), []);
  const gLeg = useMemo(() => new THREE.CylinderGeometry(0.85, 1, 1, 8), []);
  const gHoof = useMemo(() => new THREE.CylinderGeometry(1, 1.05, 1, 8), []);
  const gHorn = useMemo(() => new THREE.ConeGeometry(1, 1.4, 6), []);
  const gTail = useMemo(() => new THREE.CylinderGeometry(0.6, 1, 1, 6), []);

  const legPos: [number, number][] = [
    [-0.72, 0.34], [-0.72, -0.34], [0.86, 0.34], [0.86, -0.34],
  ];

  return (
    <group>
      {/* Cuerpo (barril) */}
      <Pieza geo={gBody} position={[0, 0, 0]} scale={[1.3, 0.74, 0.64]} />
      {/* Líneas de despiece blancas (como el diagrama de zonas de la referencia) */}
      <Seam x={-0.58} />
      <Seam x={0.14} />
      <Seam x={0.72} />
      {/* Cuello */}
      <Pieza geo={gPart} position={[-1.12, 0.34, 0]} rotation={[0, 0, 0.55]} scale={[0.52, 0.46, 0.46]} />
      {/* Cabeza */}
      <Pieza geo={gPart} color={C_HEAD} position={[-1.64, 0.34, 0]} scale={[0.48, 0.38, 0.36]} />
      {/* Hocico */}
      <Pieza geo={gSmall} color={C_DARK} position={[-2.06, 0.16, 0]} scale={[0.26, 0.22, 0.26]} />
      {/* Orejas */}
      {[-0.32, 0.32].map((z, i) => (
        <Pieza key={i} geo={gSmall} color={C_LEG} position={[-1.56, 0.56, z]} rotation={[z > 0 ? 0.7 : -0.7, 0, 0.25]} scale={[0.08, 0.2, 0.13]} />
      ))}
      {/* Cuernos */}
      {[-0.18, 0.18].map((z, i) => (
        <group key={i} position={[-1.66, 0.68, z]} rotation={[z > 0 ? -0.25 : 0.25, 0, 0.45]}>
          <mesh geometry={gHorn} scale={[0.05, 0.2, 0.05]} castShadow>
            <meshStandardMaterial color={C_DARK} flatShading roughness={0.45} />
          </mesh>
        </group>
      ))}
      {/* Ojos */}
      {[-0.24, 0.24].map((z, i) => (
        <mesh key={i} geometry={gSmall} position={[-1.9, 0.4, z]} scale={0.05}>
          <meshStandardMaterial color="#3a4149" roughness={0.3} />
        </mesh>
      ))}
      {/* Patas + pezuñas */}
      {legPos.map(([x, z], i) => (
        <group key={i}>
          <Pieza geo={gLeg} color={i % 2 ? C_DARK : C_LEG} position={[x, -0.72, z]} scale={[0.14, 0.62, 0.14]} />
          <mesh geometry={gHoof} position={[x, -1.2, z]} scale={[0.165, 0.13, 0.175]} castShadow>
            <meshStandardMaterial color={C_HOOF} flatShading roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* Ubre (monocroma, como la referencia) */}
      <Pieza geo={gPart} color={C_HEAD} position={[0.52, -0.56, 0]} scale={[0.32, 0.26, 0.38]} />
      {[[0.4, 0.14], [0.62, 0.14], [0.4, -0.14], [0.62, -0.14]].map(([x, z], i) => (
        <mesh key={i} geometry={gSmall} position={[x, -0.8, z]} scale={[0.035, 0.09, 0.035]}>
          <meshStandardMaterial color={C_LEG} flatShading roughness={0.6} />
        </mesh>
      ))}
      {/* Cola */}
      <Pieza geo={gTail} color={C_LEG} position={[1.4, 0.06, 0]} rotation={[0, 0, -0.5]} scale={[0.05, 0.58, 0.05]} wire={false} />
      <mesh geometry={gSmall} position={[1.62, -0.42, 0]} scale={0.1}>
        <meshStandardMaterial color={C_DARK} flatShading roughness={0.8} />
      </mesh>
    </group>
  );
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

/* Proyecta cada zona sobre la superficie de la vaca por raycasting: dispara un
   rayo desde fuera hacia el centro en la dirección de la zona y toma el punto de
   piel más externo. Así los puntos quedan SIEMPRE sobre el cuerpo. */
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
    const rc = new THREE.Raycaster();
    surf.updateWorldMatrix(true, true);
    const meshes: THREE.Mesh[] = [];
    surf.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) meshes.push(m); });
    if (meshes.length === 0) return;
    const center = new THREE.Vector3();
    surf.getWorldPosition(center);
    const out: Record<string, [number, number, number]> = {};
    for (const [zona, target] of Object.entries(ZONA_3D)) {
      const dir = new THREE.Vector3(target[0], target[1], target[2]).normalize();
      const origin = center.clone().add(dir.clone().multiplyScalar(8));
      rc.set(origin, dir.clone().negate());
      rc.far = 20;
      const hits = rc.intersectObjects(meshes, false);
      if (hits.length > 0) {
        const p = hits[0].point.clone();
        let n = dir.clone();
        if (hits[0].face) n = hits[0].face.normal.clone().transformDirection(hits[0].object.matrixWorld).normalize();
        p.add(n.multiplyScalar(0.025)); // apenas por encima de la piel
        const local = parent.worldToLocal(p);
        out[zona] = [local.x, local.y, local.z];
      } else {
        out[zona] = target;
      }
    }
    onReady(out);
    done.current = true;
  });
  return null;
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
  const [hov, setHov] = useState<string | null>(null);
  const [zonePos, setZonePos] = useState<Record<string, [number, number, number]>>({});
  const statMap = useMemo(() => new Map(zonas.map((z) => [z.zona, z])), [zonas]);
  const parentRef = useRef<THREE.Group>(null);
  const surfaceRef = useRef<THREE.Group>(null);

  return (
    <div style={{ width: "100%", height, borderRadius: 14, overflow: "hidden", background: "linear-gradient(165deg,#f3f6f9 0%,#e4eaf0 60%,#d9e1e9 100%)", position: "relative" }}>
      <Canvas shadows camera={{ position: [2.5, 1.4, 4.4], fov: 40 }} dpr={[1, 2]} onPointerMissed={() => setHov(null)}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[4, 6, 4]} intensity={1.05} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-5, 3, -3]} intensity={0.4} />
        <directionalLight position={[0, 2, -5]} intensity={0.25} />
        <group position={[0, 0.42, 0]} ref={parentRef}>
          <group ref={surfaceRef}>
            <CowBody />
          </group>
          <ZoneProjector surfaceRef={surfaceRef} parentRef={parentRef} onReady={setZonePos} />
          {Object.entries(ZONA_3D).map(([zona, base]) => {
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
                pos={zonePos[zona] || base}
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
        <ContactShadows position={[0, -0.92, 0]} opacity={0.32} scale={7} blur={2.6} far={3} />
        <OrbitControls enablePan={false} autoRotate={!selectable} autoRotateSpeed={0.7} minDistance={3} maxDistance={8} minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 1.9} target={[0, 0.2, 0]} />
      </Canvas>
      {selectable && (
        <div style={{ position: "absolute", left: "50%", bottom: 8, transform: "translateX(-50%)", fontSize: 10.5, fontWeight: 600, color: "#64748b", background: "rgba(255,255,255,.8)", padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap", pointerEvents: "none" }}>
          Girá el modelo y tocá un punto para elegir la zona
        </div>
      )}
    </div>
  );
}
