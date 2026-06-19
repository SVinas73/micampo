"use client";

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, Grid } from "@react-three/drei";

export type Punto3D = { label: string; value: number; color?: string };

function Barra({ x, alto, ancho, color, label, value, unidad, activo, onHover }: {
  x: number; alto: number; ancho: number; color: string; label: string; value: number; unidad: string;
  activo: boolean; onHover: (v: boolean) => void;
}) {
  const h = Math.max(0.15, Math.abs(alto));
  const yBase = alto >= 0 ? h / 2 : -h / 2;
  return (
    <group position={[x, 0, 0]}>
      <mesh
        position={[0, yBase, 0]}
        onPointerOver={(e) => { e.stopPropagation(); onHover(true); }}
        onPointerOut={() => onHover(false)}
        castShadow
      >
        <boxGeometry args={[ancho, h, ancho]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={activo ? 0.4 : 0.05} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* etiqueta del eje */}
      <Html position={[0, alto >= 0 ? -0.6 : 0.6, ancho / 2 + 0.2]} center distanceFactor={26} style={{ pointerEvents: "none" }}>
        <div style={{ fontSize: 11, color: "#5b5749", fontWeight: 600, whiteSpace: "nowrap", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
      </Html>
      {activo && (
        <Html position={[0, (alto >= 0 ? h : -h) + (alto >= 0 ? 0.8 : -0.8), 0]} center distanceFactor={24} style={{ pointerEvents: "none" }}>
          <div style={{ background: "rgba(40,50,30,0.94)", color: "#fff", padding: "5px 9px", borderRadius: 8, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
            {label}: {value.toLocaleString("es-AR")} {unidad}
          </div>
        </Html>
      )}
    </group>
  );
}

export default function Grafica3D({ datos, unidad }: { datos: Punto3D[]; unidad: string }) {
  const [hover, setHover] = useState<number | null>(null);

  const { barras, ancho, escala } = useMemo(() => {
    const n = datos.length || 1;
    const maxAbs = Math.max(1, ...datos.map((d) => Math.abs(d.value)));
    const span = 36; // ancho total de la escena
    const paso = span / n;
    const ancho = Math.min(paso * 0.6, 3.4);
    const escala = 14 / maxAbs; // altura máxima ~14 unidades
    const barras = datos.map((d, i) => ({
      ...d,
      x: -span / 2 + paso * (i + 0.5),
      alto: d.value * escala,
      color: d.color || "#5e7733",
    }));
    return { barras, ancho, escala };
  }, [datos]);

  return (
    <div style={{ position: "relative", width: "100%", height: 440, borderRadius: 14, overflow: "hidden", border: "1px solid var(--mc-line)", background: "linear-gradient(180deg, #eef2e7 0%, #e3ebf2 100%)" }}>
      <Canvas shadows camera={{ position: [0, 16, 34], fov: 42 }} dpr={[1, 2]}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[20, 30, 20]} intensity={1.1} castShadow />
        <directionalLight position={[-20, 20, -10]} intensity={0.3} />
        <Grid args={[120, 120]} cellSize={4} cellThickness={0.5} cellColor="#c3cdb2" sectionSize={20} sectionThickness={1} sectionColor="#9aa882" infiniteGrid fadeDistance={120} position={[0, 0, 0]} />
        {barras.map((b, i) => (
          <Barra
            key={i}
            x={b.x}
            alto={b.alto}
            ancho={ancho}
            color={b.color}
            label={b.label}
            value={b.value}
            unidad={unidad}
            activo={hover === i}
            onHover={(v) => setHover(v ? i : null)}
          />
        ))}
        <OrbitControls enablePan maxPolarAngle={Math.PI / 2.05} minDistance={14} maxDistance={80} target={[0, 4, 0]} />
      </Canvas>
      <div style={{ position: "absolute", bottom: 10, left: 12, fontSize: 11, color: "#6b6760", background: "rgba(255,255,255,0.8)", padding: "3px 8px", borderRadius: 6 }}>
        Arrastrá para rotar · scroll para zoom · pasá el cursor por una barra
      </div>
    </div>
  );
}
