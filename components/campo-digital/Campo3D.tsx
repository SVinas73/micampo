"use client";

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, Grid } from "@react-three/drei";
import * as THREE from "three";
import type { LoteUI } from "@/components/campo-digital/lotes-data";

type Metrica = "superficie" | "salud" | "margen" | "costo" | "plano";

export type EconLite = { margenPorHa: number; costoPorHa: number; margen: number; fuente: string };

const EXTENT = 72; // tamaño objetivo de la escena en unidades

// Color de calor para NDVI (0..1): rojo → oro → verde
function ndviColor(n: number): string {
  const v = Math.max(0, Math.min(1, n));
  if (v < 0.5) return "#c93434";
  if (v < 0.65) return "#d9a538";
  if (v < 0.78) return "#8aa353";
  return "#5e7733";
}

// Calor económico: 0 = peor (rojo), 1 = mejor (verde)
function ecoColor(t: number): string {
  const v = Math.max(0, Math.min(1, t));
  if (v < 0.25) return "#c93434";
  if (v < 0.5) return "#d98a38";
  if (v < 0.72) return "#d9a538";
  return "#5e7733";
}

type Plot = {
  lote: LoteUI;
  ring: [number, number][] | null; // proyectado a XZ
  cx: number;
  cz: number;
  side: number; // para fallback de grilla
};

function proyectar(lotes: LoteUI[]): Plot[] {
  const conGeo = lotes.filter((l) => l.geojson?.coordinates?.[0]?.length);
  // bbox global en grados
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  conGeo.forEach((l) => {
    l.geojson!.coordinates[0].forEach(([lng, lat]) => {
      minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
    });
  });
  const hayGeo = isFinite(minLng) && maxLng > minLng && maxLat > minLat;
  const cLng = (minLng + maxLng) / 2, cLat = (minLat + maxLat) / 2;
  const escala = hayGeo ? EXTENT / Math.max(maxLng - minLng, maxLat - minLat) : 1;

  const plots: Plot[] = [];
  // Lotes con geometría real
  conGeo.forEach((l) => {
    const ring = l.geojson!.coordinates[0].map(
      ([lng, lat]) => [(lng - cLng) * escala, -(lat - cLat) * escala] as [number, number]
    );
    const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length;
    const cz = ring.reduce((s, p) => s + p[1], 0) / ring.length;
    plots.push({ lote: l, ring, cx, cz, side: 0 });
  });

  // Lotes sin geometría → grilla a un costado
  const sinGeo = lotes.filter((l) => !l.geojson?.coordinates?.[0]?.length);
  if (sinGeo.length) {
    const cols = Math.ceil(Math.sqrt(sinGeo.length));
    const cell = 14;
    const startX = hayGeo ? EXTENT / 2 + 16 : -((cols - 1) * cell) / 2;
    const startZ = -((Math.ceil(sinGeo.length / cols) - 1) * cell) / 2;
    sinGeo.forEach((l, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const side = Math.max(4, Math.min(11, Math.sqrt(l.ha || 1) * 1.1));
      plots.push({ lote: l, ring: null, cx: startX + col * cell, cz: startZ + row * cell, side });
    });
  }
  return plots;
}

function alturaDe(l: LoteUI, metrica: Metrica, maxHa: number, econ: EconLite | undefined, maxMargen: number, maxCosto: number): number {
  if (metrica === "plano") return 0.5;
  if (metrica === "salud") return 0.6 + (l.ndvi || 0) * 8;
  if (metrica === "margen") return 0.6 + (econ ? (Math.max(0, econ.margenPorHa) / (maxMargen || 1)) * 8 : 0);
  if (metrica === "costo") return 0.6 + (econ ? (econ.costoPorHa / (maxCosto || 1)) * 8 : 0);
  return 0.6 + ((l.ha || 0) / (maxHa || 1)) * 8;
}

function colorDe(l: LoteUI, metrica: Metrica, econ: EconLite | undefined, maxMargen: number, maxCosto: number): string {
  if (metrica === "salud") return l.ndvi > 0 ? ndviColor(l.ndvi) : "#9b968a";
  if (metrica === "margen") {
    if (!econ || econ.fuente === "sin-datos") return "#b8b2a3";
    if (econ.margenPorHa < 0) return "#a12727";
    return ecoColor(maxMargen > 0 ? econ.margenPorHa / maxMargen : 0);
  }
  if (metrica === "costo") {
    if (!econ || econ.fuente === "sin-datos") return "#b8b2a3";
    return ecoColor(maxCosto > 0 ? 1 - econ.costoPorHa / maxCosto : 0); // menos costo = mejor (verde)
  }
  if (l.vacio || !l.cultivo) return "#b8b2a3";
  return l.cultivoColor || "#5e7733";
}

function LotePlot({ plot, metrica, maxHa, econ, maxMargen, maxCosto, activo, onClick }: {
  plot: Plot; metrica: Metrica; maxHa: number; econ: EconLite | undefined; maxMargen: number; maxCosto: number; activo: boolean; onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const altura = alturaDe(plot.lote, metrica, maxHa, econ, maxMargen, maxCosto);
  const color = colorDe(plot.lote, metrica, econ, maxMargen, maxCosto);

  const geometry = useMemo(() => {
    if (plot.ring && plot.ring.length >= 3) {
      const shape = new THREE.Shape();
      plot.ring.forEach(([x, z], i) => (i === 0 ? shape.moveTo(x, z) : shape.lineTo(x, z)));
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: altura, bevelEnabled: false });
      geo.rotateX(-Math.PI / 2);
      return geo;
    }
    return new THREE.BoxGeometry(plot.side, altura, plot.side);
  }, [plot.ring, plot.side, altura]);

  const posY = plot.ring ? 0 : altura / 2;

  return (
    <group position={[plot.ring ? 0 : plot.cx, 0, plot.ring ? 0 : plot.cz]}>
      <mesh
        geometry={geometry}
        position={[0, posY, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
        onPointerOut={() => setHover(false)}
        castShadow
      >
        <meshStandardMaterial
          color={color}
          emissive={activo || hover ? color : "#000000"}
          emissiveIntensity={activo ? 0.4 : hover ? 0.22 : 0}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
      {(hover || activo) && (
        <Html position={[plot.cx, altura + 2.5, plot.cz]} center distanceFactor={90} style={{ pointerEvents: "none" }}>
          <div style={{
            background: "rgba(40,50,30,0.92)", color: "#fff", padding: "5px 9px", borderRadius: 8,
            fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}>
            {plot.lote.name}
            <span style={{ opacity: 0.7, fontWeight: 400 }}> · {plot.lote.ha} ha{plot.lote.cultivo ? ` · ${plot.lote.cultivo}` : " · sin cultivo"}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function Campo3D({ lotes, economia }: { lotes: LoteUI[]; economia?: Record<string, EconLite> }) {
  const [metrica, setMetrica] = useState<Metrica>("superficie");
  const [sel, setSel] = useState<string | null>(null);
  const plots = useMemo(() => proyectar(lotes), [lotes]);
  const maxHa = useMemo(() => Math.max(1, ...lotes.map((l) => l.ha || 0)), [lotes]);
  const econOf = (l: LoteUI): EconLite | undefined => (economia && l.dbId ? economia[l.dbId] : undefined);
  const maxMargen = useMemo(() => Math.max(1, ...Object.values(economia || {}).map((e) => Math.max(0, e.margenPorHa))), [economia]);
  const maxCosto = useMemo(() => Math.max(1, ...Object.values(economia || {}).map((e) => e.costoPorHa)), [economia]);
  const hayEconomia = economia && Object.keys(economia).length > 0;
  const loteSel = lotes.find((l) => l.id === sel);
  const econSel = loteSel ? econOf(loteSel) : undefined;

  const METRICAS: { k: Metrica; label: string }[] = [
    { k: "superficie", label: "Superficie" },
    { k: "salud", label: "Salud (NDVI)" },
    ...(hayEconomia ? ([{ k: "margen", label: "Margen/ha" }, { k: "costo", label: "Costo/ha" }] as { k: Metrica; label: string }[]) : []),
    { k: "plano", label: "Plano" },
  ];

  return (
    <div style={{ position: "relative", width: "100%", height: 560, borderRadius: 14, overflow: "hidden", border: "1px solid var(--mc-line)", background: "linear-gradient(180deg, #dce6ef 0%, #eef2e7 100%)" }}>
      {/* Controles de métrica */}
      <div style={{ position: "absolute", top: 14, left: 14, zIndex: 5, display: "flex", gap: 6, background: "rgba(255,255,255,0.92)", padding: 5, borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
        {METRICAS.map((m) => (
          <button
            key={m.k}
            onClick={() => setMetrica(m.k)}
            style={{
              padding: "6px 11px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: metrica === m.k ? "#5e7733" : "transparent", color: metrica === m.k ? "#fff" : "#5b5749",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Leyenda / detalle */}
      <div style={{ position: "absolute", top: 14, right: 14, zIndex: 5, background: "rgba(255,255,255,0.92)", padding: "10px 12px", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12, maxWidth: 200 }}>
        {loteSel ? (
          <>
            <div style={{ fontWeight: 700, color: "#2a281f" }}>{loteSel.name}</div>
            <div style={{ color: "#6b6760", marginTop: 3 }}>{loteSel.ha} ha · {loteSel.cultivo || "sin cultivo"}</div>
            {loteSel.ndvi > 0 && <div style={{ color: "#6b6760" }}>NDVI {loteSel.ndvi.toFixed(2)}</div>}
            {econSel && econSel.fuente !== "sin-datos" && (
              <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid #ece9e1" }}>
                <div style={{ color: econSel.margenPorHa >= 0 ? "#5e7733" : "#c93434", fontWeight: 700 }}>
                  Margen {econSel.margenPorHa >= 0 ? "+" : ""}${Math.round(econSel.margenPorHa).toLocaleString("es-AR")}/ha
                </div>
                <div style={{ color: "#6b6760" }}>Costo ${Math.round(econSel.costoPorHa).toLocaleString("es-AR")}/ha</div>
              </div>
            )}
            {loteSel.estadio && loteSel.estadio !== "—" && <div style={{ color: "#6b6760" }}>{loteSel.estadio}</div>}
          </>
        ) : (
          <div style={{ color: "#6b6760" }}>
            {metrica === "salud" ? "Altura y color = NDVI por lote." : metrica === "superficie" ? "La altura representa la superficie del lote." : metrica === "margen" ? "Altura y color = margen por hectárea (verde mejor, rojo peor)." : metrica === "costo" ? "Color = costo por hectárea (verde más barato, rojo más caro)." : "Vista plana del parcelario."}
            <div style={{ marginTop: 6, color: "#9b968a", fontSize: 11 }}>Click en un lote para ver su detalle · arrastrá para rotar</div>
          </div>
        )}
      </div>

      <Canvas shadows camera={{ position: [0, 55, 75], fov: 42 }} onPointerMissed={() => setSel(null)} dpr={[1, 2]}>
        <ambientLight intensity={0.75} />
        <directionalLight position={[40, 70, 30]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-30, 40, -20]} intensity={0.3} />
        <Grid args={[260, 260]} cellSize={6} cellThickness={0.5} cellColor="#c3cdb2" sectionSize={30} sectionThickness={1} sectionColor="#9aa882" infiniteGrid fadeDistance={230} position={[0, -0.01, 0]} />
        {plots.map((p) => (
          <LotePlot
            key={p.lote.id}
            plot={p}
            metrica={metrica}
            maxHa={maxHa}
            econ={econOf(p.lote)}
            maxMargen={maxMargen}
            maxCosto={maxCosto}
            activo={sel === p.lote.id}
            onClick={() => setSel(p.lote.id)}
          />
        ))}
        <OrbitControls enablePan maxPolarAngle={Math.PI / 2.1} minDistance={20} maxDistance={180} target={[0, 0, 0]} />
      </Canvas>
    </div>
  );
}
