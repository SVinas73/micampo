"use client";

// Diagrama anatómico 2D interactivo de la vaca. La FORMA es la ilustración
// "hand drawn cow outline" (line-art) del archivo de referencia; al pasar el
// mouse por una región se ilumina (recortada al cuerpo) y debajo se muestra qué
// es, con información veterinaria exacta y completa (panel compartido con la 3D).
// Dos modos:
//   • lectura (Análisis Corporal): tinte de heatmap por casos reales + panel.
//   • selectable (Diagnosticar Animal): elige la zona afectada (click).

import React, { useId, useMemo, useState } from "react";
import { COW_PATH, COW_SILHOUETTE, COW_VIEWBOX } from "./vaca-anatomia-forma";
import { ZONA_ANATOMIA, heatColor, ZonaInfoPanel } from "./vaca-zonas";

export type ZonaHeat3D = { zona: string; pct: number; casos: number; cond: string; label: string };

/* ── Regiones interactivas sobre la forma (viewBox 0 0 700 500, cabeza a la
   derecha). Cada zona = uno o más polígonos. Coordenadas ajustadas contra la
   ilustración (render headless) para que cada zona coincida con su parte. */
const REG: Record<string, [number, number][][]> = {
  cola: [[[92, 118], [118, 122], [114, 285], [110, 338], [72, 362], [56, 344], [70, 298], [88, 180]]],
  genital: [[[118, 206], [164, 198], [170, 270], [146, 290], [120, 280]]],
  cadera: [[[130, 146], [216, 140], [264, 196], [258, 284], [206, 302], [158, 288], [136, 214]]],
  columna: [[[110, 120], [300, 116], [456, 114], [454, 182], [300, 184], [150, 184], [112, 164]]],
  piel: [[[264, 182], [412, 188], [420, 286], [302, 300], [266, 286]]],
  costillas: [[[406, 186], [500, 192], [502, 290], [446, 298], [412, 262], [402, 220]]],
  cuello: [[[446, 112], [520, 124], [540, 192], [512, 206], [460, 198], [444, 150]]],
  cabeza: [[[512, 132], [560, 96], [606, 96], [628, 150], [622, 196], [585, 210], [540, 198], [514, 168]]],
  ojos: [[[576, 152], [618, 152], [620, 194], [578, 194]]],
  boca: [[[598, 176], [645, 182], [640, 210], [612, 222], [596, 202]]],
  panza: [[[266, 286], [440, 296], [440, 312], [280, 316], [266, 300]]],
  ubre: [[[178, 296], [258, 298], [256, 348], [220, 372], [184, 350]]],
  patas: [
    [[130, 292], [190, 290], [186, 455], [136, 455]],
    [[210, 296], [282, 290], [276, 455], [220, 455]],
    [[430, 296], [478, 296], [474, 455], [434, 455]],
    [[478, 296], [514, 300], [514, 455], [482, 455]],
  ],
};
/* Orden de detección: primero las grandes, al final las específicas (ganan el
   hover donde se solapan: ojos/boca sobre cabeza, etc.). */
const HIT_ORDER = ["columna", "piel", "panza", "costillas", "cadera", "patas", "cola", "genital", "ubre", "cuello", "cabeza", "boca", "ojos"];
const ZONAS = Object.keys(ZONA_ANATOMIA);

const polyPoints = (pts: [number, number][]) => pts.map((p) => p.join(",")).join(" ");
const centroide = (pts: [number, number][]): [number, number] => {
  const n = pts.length;
  return [pts.reduce((s, p) => s + p[0], 0) / n, pts.reduce((s, p) => s + p[1], 0) / n];
};
const zonaCentro: Record<string, [number, number]> = Object.fromEntries(
  ZONAS.map((z) => [z, centroide(REG[z][0])]),
);

const VB = COW_VIEWBOX.split(" ").map(Number); // [0,0,700,500]
const VBW = VB[2], VBH = VB[3];

export default function CowAnatomy({
  zonas,
  height = 300,
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
  const [hover, setHover] = useState<string | null>(null);
  const statMap = useMemo(() => new Map(zonas.map((z) => [z.zona, z])), [zonas]);
  const clipId = useId();

  const activa = hover || (selectable ? selected : null);
  const info = activa ? ZONA_ANATOMIA[activa] : null;
  const stat = activa ? statMap.get(activa) : undefined;

  const fillZona = (z: string): string | null => {
    if (selectable) return selected === z ? "#16a34a" : hover === z ? "#22c55e" : null;
    const s = statMap.get(z);
    if (hover === z) return heatColor(s?.pct ?? 0);
    if (s && s.casos > 0) return heatColor(s.pct);
    return null;
  };
  const opacZona = (z: string): number => {
    if (selectable) return selected === z ? 0.42 : hover === z ? 0.3 : 0;
    const s = statMap.get(z);
    if (hover === z) return 0.4;
    if (s && s.casos > 0) return 0.26;
    return 0;
  };

  const tipPos = activa ? zonaCentro[activa] : null;

  return (
    <div style={{ width: "100%" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: height * (VBW / VBH), margin: "0 auto", borderRadius: 14, overflow: "hidden", background: "linear-gradient(180deg,#f7f9fb 0%,#eef2f6 100%)" }}>
        <svg
          viewBox={COW_VIEWBOX}
          style={{ width: "100%", height: "auto", display: "block" }}
          role="img"
          aria-label="Diagrama anatómico de la vaca"
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <clipPath id={clipId}><path d={COW_SILHOUETTE} /></clipPath>
          </defs>

          {/* Tinte de zonas (heatmap / selección / hover), recortado al cuerpo */}
          <g clipPath={`url(#${clipId})`}>
            {ZONAS.map((z) => {
              const f = fillZona(z);
              const o = opacZona(z);
              if (!f || o === 0) return null;
              return REG[z].map((pts, i) => (
                <polygon key={`${z}-${i}`} points={polyPoints(pts)} fill={f} fillOpacity={o} style={{ transition: "fill-opacity .12s" }} />
              ));
            })}
          </g>

          {/* Ilustración (line-art del archivo de referencia) */}
          <path d={COW_PATH} fill="#1f2a36" />

          {/* Zonas interactivas (transparentes, recortadas al cuerpo, arriba de todo) */}
          <g clipPath={`url(#${clipId})`}>
            {HIT_ORDER.flatMap((z) =>
              REG[z].map((pts, i) => (
                <polygon
                  key={`hit-${z}-${i}`}
                  points={polyPoints(pts)}
                  fill="rgba(0,0,0,0)"
                  style={{ cursor: selectable ? "pointer" : "help" }}
                  onMouseEnter={() => setHover(z)}
                  onClick={selectable && onSelect ? () => onSelect(z) : undefined}
                >
                  <title>{ZONA_ANATOMIA[z].label}</title>
                </polygon>
              )),
            )}
          </g>
        </svg>

        {/* Tooltip flotante */}
        {activa && info && tipPos && (
          <div
            style={{
              position: "absolute",
              left: `${(tipPos[0] / VBW) * 100}%`,
              top: `${(tipPos[1] / VBH) * 100}%`,
              transform: "translate(-50%,-135%)",
              background: "#1e293b",
              color: "#fff",
              padding: "4px 10px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              boxShadow: "0 6px 18px rgba(0,0,0,.28)",
              zIndex: 2,
            }}
          >
            {info.label}
            {!selectable && stat && stat.casos > 0 && (
              <span style={{ fontWeight: 600, opacity: 0.85 }}> · {stat.pct}%</span>
            )}
          </div>
        )}

        {selectable && (
          <div style={{ position: "absolute", left: "50%", bottom: 8, transform: "translateX(-50%)", fontSize: 10.5, fontWeight: 600, color: "#64748b", background: "rgba(255,255,255,.82)", padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap", pointerEvents: "none" }}>
            Pasá el mouse por una zona y tocá para elegirla
          </div>
        )}
      </div>

      {/* Panel de detalle (modo lectura): info exacta y completa de la zona */}
      {!selectable && <ZonaInfoPanel zona={activa} stat={stat} />}
    </div>
  );
}
