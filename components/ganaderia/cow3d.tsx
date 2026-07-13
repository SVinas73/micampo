"use client";

// Vaca 3D (react-three-fiber) para Sanidad › Análisis Corporal.
// Modelo Holstein construido con primitivas + textura de manchas generada en
// canvas, rotable con OrbitControls, con marcadores de zona clickeables
// coloreados por intensidad de casos (heatmap anatómico en 3D).

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

export type ZonaHeat3D = { zona: string; pct: number; casos: number; cond: string; label: string };

/* Posición 3D aproximada de cada zona sobre el cuerpo (cabeza en -X, cola en +X). */
const ZONA_3D: Record<string, [number, number, number]> = {
  cabeza: [-1.72, 0.34, 0],
  cuello: [-1.12, 0.5, 0],
  columna: [-0.05, 0.8, 0],
  costillas: [-0.35, 0.16, 0.66],
  cadera: [0.85, 0.62, 0],
  cola: [1.32, 0.42, 0],
  patas: [-0.72, -0.95, 0.34],
  ubre: [0.5, -0.62, 0],
};

const heatColor = (pct: number) => (pct >= 10 ? "#dc2626" : pct >= 6 ? "#ea580c" : pct >= 3 ? "#f59e0b" : "#65a30d");

const HIDE = "#eef1ee";
const HIDE_DK = "#dbe1db";
const SPOT = "#2b2f2b";

/** Textura Holstein: base clara + manchas oscuras irregulares. */
function useHolsteinTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#f0f3f0";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = SPOT;
    const blobs = [
      [70, 60, 34], [180, 90, 40], [120, 170, 46], [40, 200, 26], [210, 200, 30], [150, 40, 22],
    ];
    // Bordes irregulares deterministas (sin Math.random, para no ser impuro en render).
    blobs.forEach(([x, y, r], bi) => {
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 2; a += 0.35) {
        const wob = 0.72 + 0.4 * Math.abs(Math.sin(a * 2.7 + bi * 1.3)) + 0.12 * Math.cos(a * 5 + bi);
        const rr = r * wob;
        const px = x + Math.cos(a) * rr;
        const py = y + Math.sin(a) * rr * 0.8;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    });
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);
}

function CowBody() {
  const tex = useHolsteinTexture();
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.82, metalness: 0.02 }), [tex]);
  const hideMat = useMemo(() => new THREE.MeshStandardMaterial({ color: HIDE, roughness: 0.85 }), []);
  const darkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: HIDE_DK, roughness: 0.85 }), []);

  const legPos: [number, number][] = [
    [-0.72, 0.34], [-0.72, -0.34], [0.86, 0.34], [0.86, -0.34],
  ];

  return (
    <group>
      {/* Cuerpo (barril) */}
      <mesh position={[0, 0, 0]} scale={[1.3, 0.74, 0.64]} material={bodyMat} castShadow>
        <sphereGeometry args={[1, 64, 40]} />
      </mesh>
      {/* Cuello */}
      <mesh position={[-1.12, 0.3, 0]} rotation={[0, 0, 0.55]} scale={[0.5, 0.44, 0.44]} material={hideMat} castShadow>
        <sphereGeometry args={[1, 32, 24]} />
      </mesh>
      {/* Cabeza */}
      <mesh position={[-1.62, 0.3, 0]} scale={[0.46, 0.36, 0.36]} material={hideMat} castShadow>
        <sphereGeometry args={[1, 32, 24]} />
      </mesh>
      {/* Hocico */}
      <mesh position={[-2.02, 0.12, 0]} scale={[0.24, 0.22, 0.26]}>
        <sphereGeometry args={[1, 24, 18]} />
        <meshStandardMaterial color="#e6cfc4" roughness={0.8} />
      </mesh>
      {/* Orejas */}
      {[-0.3, 0.3].map((z, i) => (
        <mesh key={i} position={[-1.55, 0.52, z]} rotation={[z > 0 ? 0.6 : -0.6, 0, 0.2]} scale={[0.07, 0.17, 0.11]} material={darkMat}>
          <sphereGeometry args={[1, 14, 12]} />
        </mesh>
      ))}
      {/* Cuernos */}
      {[-0.17, 0.17].map((z, i) => (
        <mesh key={i} position={[-1.7, 0.64, z]} rotation={[0, 0, 0.3]} scale={[0.045, 0.16, 0.045]}>
          <coneGeometry args={[1, 1.4, 12]} />
          <meshStandardMaterial color="#d8c48a" roughness={0.55} />
        </mesh>
      ))}
      {/* Ojos */}
      {[-0.21, 0.21].map((z, i) => (
        <mesh key={i} position={[-1.86, 0.34, z]} scale={0.055}>
          <sphereGeometry args={[1, 14, 14]} />
          <meshStandardMaterial color="#161616" roughness={0.3} />
        </mesh>
      ))}
      {/* Patas + pezuñas */}
      {legPos.map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x, -0.72, z]} scale={[0.135, 0.62, 0.135]} material={i % 2 ? darkMat : hideMat} castShadow>
            <cylinderGeometry args={[0.85, 1, 1, 18]} />
          </mesh>
          <mesh position={[x, -1.2, z]} scale={[0.16, 0.13, 0.17]}>
            <cylinderGeometry args={[1, 1, 1, 14]} />
            <meshStandardMaterial color="#39392f" roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* Ubre */}
      <mesh position={[0.5, -0.56, 0]} scale={[0.3, 0.24, 0.36]}>
        <sphereGeometry args={[1, 22, 18]} />
        <meshStandardMaterial color="#e9b6c4" roughness={0.85} />
      </mesh>
      {/* Cola */}
      <mesh position={[1.36, 0.1, 0]} rotation={[0, 0, -0.45]} scale={[0.05, 0.55, 0.05]} material={hideMat}>
        <cylinderGeometry args={[0.7, 1, 1, 10]} />
      </mesh>
      <mesh position={[1.55, -0.42, 0]} scale={0.1}>
        <sphereGeometry args={[1, 14, 12]} />
        <meshStandardMaterial color={SPOT} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Marcador({ pos, color, label, activo, onHover, onLeave }: { pos: [number, number, number]; color: string; label: string; activo: boolean; onHover: () => void; onLeave: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current && activo) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.12;
      ref.current.scale.setScalar(0.09 * s);
    } else if (ref.current) {
      ref.current.scale.setScalar(0.08);
    }
  });
  return (
    <group position={pos}>
      <mesh ref={ref} onPointerOver={(e) => { e.stopPropagation(); onHover(); }} onPointerOut={onLeave}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={activo ? 0.6 : 0.25} roughness={0.4} />
      </mesh>
      {activo && (
        <Html center distanceFactor={8} style={{ pointerEvents: "none" }}>
          <div style={{ background: "#1e293b", color: "#fff", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap", transform: "translateY(-22px)", boxShadow: "0 4px 12px rgba(0,0,0,.3)" }}>{label}</div>
        </Html>
      )}
    </group>
  );
}

export default function Cow3D({ zonas, height = 320 }: { zonas: ZonaHeat3D[]; height?: number }) {
  const [hov, setHov] = useState<string | null>(null);
  const statMap = useMemo(() => new Map(zonas.map((z) => [z.zona, z])), [zonas]);

  return (
    <div style={{ width: "100%", height, borderRadius: 14, overflow: "hidden", background: "linear-gradient(160deg,#eef4f8,#e3eaef)" }}>
      <Canvas shadows camera={{ position: [2.4, 1.5, 4.2], fov: 42 }} dpr={[1, 2]} onPointerMissed={() => setHov(null)}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 6, 4]} intensity={1.15} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-4, 3, -3]} intensity={0.35} />
        <group position={[0, 0.4, 0]}>
          <CowBody />
          {Object.entries(ZONA_3D).map(([zona, pos]) => {
            const s = statMap.get(zona);
            const pct = s?.pct ?? 0;
            const color = s ? heatColor(pct) : "#94a3b8";
            const label = s && s.casos > 0 ? `${s.label}: ${pct}% · ${s.cond}` : `${s?.label || zona}: sin casos`;
            return <Marcador key={zona} pos={pos} color={color} label={label} activo={hov === zona} onHover={() => setHov(zona)} onLeave={() => setHov(null)} />;
          })}
        </group>
        <ContactShadows position={[0, -0.95, 0]} opacity={0.35} scale={7} blur={2.4} far={3} />
        <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.7} minDistance={3} maxDistance={8} minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 1.9} target={[0, 0.2, 0]} />
      </Canvas>
    </div>
  );
}
