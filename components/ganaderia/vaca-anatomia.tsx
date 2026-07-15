"use client";

// Diagrama anatómico 2D interactivo de la vaca. La FORMA es la ilustración
// "hand drawn cow outline" (line-art) del archivo de referencia; al pasar el
// mouse por una región se ilumina (recortada al cuerpo) y debajo se muestra qué
// es, con información veterinaria exacta y completa. Dos modos:
//   • lectura (Análisis Corporal): tinte de heatmap por casos reales + panel de
//     detalle de la zona.
//   • selectable (Diagnosticar Animal): elige la zona afectada (click).
// Todo SVG, self-contained, responsive y sin dependencias externas.

import React, { useId, useMemo, useState } from "react";
import { COW_PATH, COW_SILHOUETTE, COW_VIEWBOX } from "./vaca-anatomia-forma";

export type ZonaHeat3D = { zona: string; pct: number; casos: number; cond: string; label: string };

/* ── Contenido veterinario por zona (exacto y completo) ── */
type ZonaAnat = { label: string; que: string; funcion: string; signos: string[]; patologias: string[] };
export const ZONA_ANATOMIA: Record<string, ZonaAnat> = {
  cabeza: {
    label: "Cabeza",
    que: "Cráneo, encéfalo y senos frontales.",
    funcion: "Aloja el sistema nervioso central y los órganos de los sentidos.",
    signos: ["Fiebre", "Secreción nasal", "Decaimiento", "Andar en círculos"],
    patologias: ["Rinotraqueítis Infecciosa (IBR)", "Hipocalcemia (fiebre de leche)", "Meningoencefalitis"],
  },
  ojos: {
    label: "Ojos",
    que: "Globo ocular, córnea y anexos (párpados, glándula lagrimal).",
    funcion: "Visión; primera barrera frente a polvo, moscas y radiación UV.",
    signos: ["Lagrimeo", "Opacidad / nube corneal", "Enrojecimiento", "Fotofobia"],
    patologias: ["Queratoconjuntivitis infecciosa (IBK)", "Carcinoma de células escamosas", "Cuerpo extraño"],
  },
  boca: {
    label: "Boca / Hocico",
    que: "Labios, encías, lengua, dientes y hocico.",
    funcion: "Prensión, masticación y salivación del alimento.",
    signos: ["Salivación excesiva (ptialismo)", "Aftas o úlceras", "Dificultad para comer"],
    patologias: ["Fiebre Aftosa", "Actinomicosis (mandíbula dura)", "Estomatitis vesicular"],
  },
  cuello: {
    label: "Cuello / Papada",
    que: "Región cervical, papada y ganglios linfáticos superficiales.",
    funcion: "Sostén de la cabeza; tránsito de esófago, tráquea y grandes vasos.",
    signos: ["Ganglios inflamados", "Rigidez", "Absceso o herida"],
    patologias: ["Actinobacilosis (lengua de madera)", "Absceso cervical", "Linfadenitis"],
  },
  columna: {
    label: "Columna / Lomo",
    que: "Línea dorsal: cruz, dorso y lomo sobre la columna vertebral.",
    funcion: "Eje de sostén del cuerpo; protege la médula espinal.",
    signos: ["Postura arqueada", "Dolor al tacto", "Rigidez", "Decúbito (caída)"],
    patologias: ["Hipocalcemia", "Lesión medular", "Traumatismo vertebral"],
  },
  costillas: {
    label: "Costillas / Tórax",
    que: "Caja torácica y parrilla costal; contiene la cavidad pleural.",
    funcion: "Protege corazón y pulmones; sostiene la mecánica respiratoria.",
    signos: ["Dificultad respiratoria (disnea)", "Tos", "Respiración abdominal", "Pérdida de peso"],
    patologias: ["Neumonía / Complejo Respiratorio Bovino", "Pleuresía", "Tuberculosis"],
  },
  panza: {
    label: "Panza / Abdomen",
    que: "Abdomen ventral: rumen y retículo (pre-estómagos).",
    funcion: "Fermentación microbiana y digestión de la fibra.",
    signos: ["Distensión abdominal", "Diarrea", "Falta de rumia", "Anorexia"],
    patologias: ["Timpanismo (empaste)", "Acidosis ruminal", "Reticuloperitonitis traumática"],
  },
  piel: {
    label: "Piel / Pelaje",
    que: "Piel, pelaje y tejido subcutáneo del flanco.",
    funcion: "Barrera protectora, termorregulación y síntesis de vitamina D.",
    signos: ["Costras o lesiones", "Caída de pelo (alopecia)", "Picazón (prurito)"],
    patologias: ["Sarna", "Dermatofilosis", "Parasitosis externa (piojos, garrapatas)"],
  },
  cadera: {
    label: "Cadera / Anca",
    que: "Anca, cadera y articulación coxofemoral.",
    funcion: "Genera la propulsión del tren posterior.",
    signos: ["Cojera", "Dificultad para levantarse", "Hinchazón"],
    patologias: ["Paresia puerperal", "Luxación de cadera", "Miopatía por decúbito"],
  },
  genital: {
    label: "Genital / Perineal",
    que: "Región perineal: vulva, vagina y ano.",
    funcion: "Reproducción, parto y excreción.",
    signos: ["Secreción anormal", "Prolapso", "Retención de placenta"],
    patologias: ["Metritis / Endometritis", "Prolapso uterino o vaginal", "Retención placentaria"],
  },
  ubre: {
    label: "Ubre",
    que: "Glándula mamaria: cuatro cuartos y pezones.",
    funcion: "Síntesis, almacenamiento y eyección de la leche.",
    signos: ["Inflamación / calor", "Leche con grumos o sangre", "Dolor al tacto", "Edema"],
    patologias: ["Mastitis clínica", "Mastitis subclínica", "Edema de ubre"],
  },
  patas: {
    label: "Pezuñas / Patas",
    que: "Miembros, articulaciones, pezuñas y aplomos.",
    funcion: "Locomoción y soporte del peso corporal.",
    signos: ["Cojera", "Hinchazón", "Herida o mal olor"],
    patologias: ["Pietín (dermatitis interdigital)", "Laminitis", "Absceso podal"],
  },
  cola: {
    label: "Cola",
    que: "Cola, vértebras coccígeas y región perianal.",
    funcion: "Espanta insectos y ayuda al equilibrio.",
    signos: ["Suciedad / diarrea", "Herida", "Parásitos"],
    patologias: ["Diarrea infecciosa", "Parasitosis", "Dermatitis de la cola"],
  },
};

const heatColor = (pct: number) => (pct >= 10 ? "#dc2626" : pct >= 6 ? "#ea580c" : pct >= 3 ? "#f59e0b" : "#65a30d");

/* ── Regiones interactivas sobre la forma (viewBox 0 0 700 500, cabeza a la
   derecha). Cada zona = uno o más polígonos. Verificado por render contra la
   ilustración: los tintes (recortados al cuerpo) quedan sobre la parte correcta. */
const REG: Record<string, [number, number][][]> = {
  boca: [[[605, 300], [644, 318], [636, 350], [612, 366], [596, 340], [598, 312]]],
  cabeza: [[[558, 132], [598, 108], [626, 150], [634, 210], [600, 238], [572, 232], [556, 185]]],
  ojos: [[[588, 212], [624, 212], [626, 252], [590, 252]]],
  cuello: [[[502, 152], [556, 132], [572, 232], [532, 300], [500, 262], [494, 200]]],
  columna: [[[176, 144], [300, 140], [460, 150], [502, 152], [500, 202], [300, 196], [176, 198]]],
  costillas: [[[430, 202], [500, 202], [532, 300], [468, 326], [422, 296], [408, 240]]],
  piel: [[[252, 200], [430, 202], [422, 296], [300, 315], [252, 296]]],
  panza: [[[286, 300], [430, 300], [440, 350], [322, 356], [286, 338]]],
  cadera: [[[178, 198], [252, 200], [252, 296], [212, 315], [182, 296], [172, 240]]],
  genital: [[[150, 238], [178, 236], [188, 312], [164, 304], [146, 298]]],
  ubre: [[[256, 300], [320, 300], [326, 358], [288, 362], [258, 340]]],
  cola: [[[112, 152], [150, 150], [150, 300], [136, 345], [120, 350], [106, 330], [122, 240]]],
  patas: [
    [[492, 300], [528, 316], [520, 452], [500, 452], [494, 360]],
    [[430, 312], [470, 318], [466, 452], [446, 452], [444, 360]],
    [[240, 318], [270, 332], [266, 452], [244, 452], [240, 360]],
    [[196, 328], [226, 322], [222, 452], [200, 452], [196, 405]],
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
/* Punto para el tooltip: centroide del polígono principal, ajustado para que
   caiga sobre el cuerpo en las zonas alargadas. */
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
      <div style={{ position: "relative", width: "100%", borderRadius: 14, overflow: "hidden", background: "linear-gradient(180deg,#f7f9fb 0%,#eef2f6 100%)" }}>
        <svg
          viewBox={COW_VIEWBOX}
          style={{ width: "100%", height: "auto", maxHeight: height, display: "block" }}
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
      {!selectable && (
        <div style={{ marginTop: 10, minHeight: 96, borderRadius: 12, border: "1px solid var(--mc-line)", background: "var(--mc-surface)", padding: "11px 13px" }}>
          {info ? (
            <div className="col" style={{ gap: 7 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--mc-ink)" }}>{info.label}</span>
                {stat && stat.casos > 0 ? (
                  <span style={{ fontSize: 11, fontWeight: 700, color: heatColor(stat.pct), background: `${heatColor(stat.pct)}18`, padding: "2px 8px", borderRadius: 999 }}>
                    {stat.casos} {stat.casos === 1 ? "caso" : "casos"} · {stat.pct}% · {stat.cond}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a", background: "#16a34a14", padding: "2px 8px", borderRadius: 999 }}>Sin casos activos</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "var(--mc-text-2)", lineHeight: 1.45 }}>{info.que}</div>
              <div style={{ fontSize: 11.5, color: "var(--mc-text-3)", lineHeight: 1.4 }}><b style={{ color: "var(--mc-text-2)" }}>Función:</b> {info.funcion}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 1 }}>
                {info.signos.map((s) => (
                  <span key={s} style={{ fontSize: 10.5, fontWeight: 600, color: "var(--mc-text-2)", background: "var(--mc-surface-2)", border: "1px solid var(--mc-line-2)", padding: "2px 7px", borderRadius: 999 }}>{s}</span>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--mc-text-3)", marginTop: 1 }}>
                <b style={{ color: "var(--mc-text-2)" }}>Patologías frecuentes:</b> {info.patologias.join(" · ")}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--mc-text-3)", display: "flex", alignItems: "center", height: 72 }}>
              Pasá el mouse por una región del cuerpo para ver qué es, su función y las patologías más frecuentes.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
