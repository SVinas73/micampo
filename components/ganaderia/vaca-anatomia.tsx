"use client";

// Diagrama anatómico 2D interactivo de la vaca (vista lateral low-poly gris con
// líneas blancas de despiece, estilo "carta anatómica"). Reemplaza al modelo 3D
// con puntos: al pasar el mouse por una región se ilumina y muestra qué es, con
// información veterinaria exacta y completa. Dos modos:
//   • lectura (Análisis Corporal): tinte de heatmap por casos reales + panel de
//     detalle de la zona.
//   • selectable (Diagnosticar Animal): elige la zona afectada (click).
// Todo SVG, self-contained, responsive y sin dependencias externas.

import React, { useId, useMemo, useState } from "react";

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

const ZONAS_ORDEN = Object.keys(ZONA_ANATOMIA);

const heatColor = (pct: number) => (pct >= 10 ? "#dc2626" : pct >= 6 ? "#ea580c" : pct >= 3 ? "#f59e0b" : "#65a30d");

/* ── Geometría (viewBox 0 0 1000 575, cabeza a la izquierda) ── */
const SIL: [number, number][] = [
  [70, 214], [102, 174], [148, 148], [196, 148], [214, 166],
  [268, 150], [330, 122], [470, 118], [620, 120], [742, 124], [802, 130],
  [856, 142], [894, 164], [900, 214], [886, 266], [862, 314],
  [858, 374], [862, 502], [872, 548], [832, 548], [832, 394],
  [792, 432], [772, 444], [742, 506], [702, 506], [676, 450],
  [560, 460], [462, 460], [372, 460], [360, 502], [352, 548], [314, 548], [322, 472],
  [278, 450], [252, 406], [236, 348], [196, 324], [150, 308], [104, 294], [74, 258], [66, 232],
];
const SIL_PATH = "M" + SIL.map((p) => p.join(",")).join(" L") + " Z";
const TAIL_PATH = "M894,164 L906,168 L916,300 L928,404 L922,430 L906,430 L902,404 L900,300 L888,214 Z";

/* Regiones interactivas: zona → uno o más polígonos */
const REG: Record<string, [number, number][][]> = {
  boca: [[[66, 232], [76, 260], [106, 296], [152, 272], [124, 238]]],
  cabeza: [[[74, 214], [102, 174], [148, 148], [196, 148], [212, 168], [228, 258], [196, 292], [150, 272], [118, 238]]],
  ojos: [[[126, 190], [176, 190], [178, 230], [128, 230]]],
  cuello: [[[212, 168], [330, 124], [310, 262], [300, 300], [238, 286]]],
  columna: [[[330, 124], [470, 120], [620, 122], [744, 126], [744, 200], [330, 200]]],
  costillas: [[[236, 348], [252, 406], [288, 418], [300, 300], [330, 200], [470, 200], [470, 460], [372, 460], [322, 472], [278, 450]]],
  piel: [[[470, 200], [744, 200], [742, 300], [730, 362], [470, 362]]],
  panza: [[[470, 362], [676, 362], [676, 450], [560, 460], [470, 460]]],
  cadera: [[[744, 126], [856, 142], [858, 374], [832, 394], [792, 432], [742, 362], [742, 200]]],
  genital: [[[856, 142], [894, 164], [900, 214], [886, 266], [862, 314], [846, 320]]],
  ubre: [[[676, 362], [742, 362], [792, 432], [772, 444], [742, 506], [702, 506], [676, 450]]],
  cola: [[[894, 164], [916, 170], [934, 404], [920, 432], [904, 430], [888, 214]]],
  patas: [
    [[322, 472], [372, 460], [360, 502], [352, 548], [314, 548]],
    [[832, 394], [858, 374], [862, 502], [872, 548], [832, 548]],
  ],
};
const SEAMS = [
  "M212,168 L238,286 L262,402", "M330,124 L300,300 L288,418", "M468,120 L470,300 L468,460",
  "M330,200 L744,200", "M620,122 L620,300", "M744,126 L742,300 L708,450",
  "M856,144 L846,320 L836,442", "M468,362 L676,362", "M676,362 L676,450", "M676,450 L792,432",
];

const polyPoints = (pts: [number, number][]) => pts.map((p) => p.join(",")).join(" ");
const centroid = (pts: [number, number][]): [number, number] => {
  const n = pts.length;
  return [pts.reduce((s, p) => s + p[0], 0) / n, pts.reduce((s, p) => s + p[1], 0) / n];
};
const zonaCentro: Record<string, [number, number]> = Object.fromEntries(
  ZONAS_ORDEN.map((z) => [z, centroid(REG[z][0])]),
);

/* Malla low-poly determinística (sin Math.random → apto react-compiler) */
const hash = (x: number, y: number) => Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
type Tri = { pts: string; fill: string };
function buildFacets(): Tri[] {
  const out: Tri[] = [];
  const x0 = 58, x1 = 934, y0 = 110, y1 = 556, step = 40;
  for (let gx = x0; gx < x1; gx += step) {
    for (let gy = y0; gy < y1; gy += step) {
      const jx = (a: number, b: number) => a + (hash(a, b) - 0.5) * step * 0.5;
      const jy = (a: number, b: number) => b + (hash(b, a) - 0.5) * step * 0.5;
      const A: [number, number] = [jx(gx, gy), jy(gx, gy)];
      const B: [number, number] = [jx(gx + step, gy), jy(gx + step, gy)];
      const C: [number, number] = [jx(gx, gy + step), jy(gx, gy + step)];
      const D: [number, number] = [jx(gx + step, gy + step), jy(gx + step, gy + step)];
      for (const t of [[A, B, C], [B, D, C]] as [number, number][][]) {
        const sh = hash(Math.round(t[0][0]), Math.round(t[0][1]));
        const g = Math.round(216 + sh * 22);
        out.push({ pts: polyPoints(t as [number, number][]), fill: `rgb(${g},${g + 3},${g + 7})` });
      }
    }
  }
  return out;
}

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
  const facets = useMemo(() => buildFacets(), []);
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
          viewBox="0 0 1000 575"
          style={{ width: "100%", height: "auto", maxHeight: height, display: "block" }}
          role="img"
          aria-label="Diagrama anatómico de la vaca"
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <clipPath id={clipId}><path d={SIL_PATH} /></clipPath>
          </defs>

          {/* Sombra de piso */}
          <ellipse cx="500" cy="560" rx="330" ry="18" fill="#000" opacity="0.06" />

          {/* Patas del lado lejano (profundidad) */}
          <polygon points="368,414 398,414 391,548 358,548" fill="#d3dae1" />
          <polygon points="356,546 393,546 393,558 356,558" fill="#bcc5cf" />
          <polygon points="820,414 850,414 846,548 814,548" fill="#d3dae1" />
          <polygon points="812,546 848,546 848,558 812,558" fill="#bcc5cf" />

          {/* Cola */}
          <path d={TAIL_PATH} fill="#d2d9e0" stroke="#9aa4af" strokeWidth={1.5} />
          <path d="M905,412 L936,452 L918,460 L900,436 Z" fill="#c6cdd6" stroke="#fff" strokeWidth={1.5} />

          {/* Cuerpo + malla low-poly */}
          <path d={SIL_PATH} fill="#e8edf1" />
          <g clipPath={`url(#${clipId})`}>
            {facets.map((t, i) => (
              <polygon key={i} points={t.pts} fill={t.fill} stroke="#ffffff" strokeWidth={0.5} strokeOpacity={0.55} />
            ))}
          </g>

          {/* Tinte de zonas (heatmap / selección / hover), recortado al cuerpo */}
          <g clipPath={`url(#${clipId})`}>
            {ZONAS_ORDEN.map((z) => {
              const f = fillZona(z);
              const o = opacZona(z);
              if (!f || o === 0) return null;
              return REG[z].map((pts, i) => (
                <polygon key={`${z}-${i}`} points={polyPoints(pts)} fill={f} fillOpacity={o} style={{ transition: "fill-opacity .12s" }} />
              ));
            })}
          </g>

          {/* Líneas de despiece blancas */}
          <g clipPath={`url(#${clipId})`}>
            {SEAMS.map((d, i) => (
              <path key={i} d={d} stroke="#ffffff" strokeWidth={4} fill="none" strokeLinecap="round" />
            ))}
          </g>

          {/* Contorno + detalles */}
          <path d={SIL_PATH} fill="none" stroke="#9aa4af" strokeWidth={2.5} />
          <path d="M150,150 Q140,120 128,106 Q146,116 162,142 Z" fill="#c6cdd6" stroke="#9aa4af" strokeWidth={1.2} />
          <path d="M192,150 Q196,120 190,104 Q206,118 204,146 Z" fill="#cfd6dd" stroke="#9aa4af" strokeWidth={1.2} />
          <path d="M208,166 Q250,142 252,158 Q250,182 214,188 Z" fill="#d2d9e0" stroke="#9aa4af" strokeWidth={1.5} />
          <circle cx="150" cy="210" r="8.5" fill="#3f4650" />
          <circle cx="147" cy="207" r="2.6" fill="#fff" opacity="0.9" />
          <ellipse cx="86" cy="240" rx="6.5" ry="8.5" fill="#b6bfc9" />

          {/* Zonas interactivas (transparentes, arriba de todo) */}
          <g clipPath={`url(#${clipId})`}>
            {ZONAS_ORDEN.map((z) =>
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
              left: `${(tipPos[0] / 1000) * 100}%`,
              top: `${(tipPos[1] / 575) * 100}%`,
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
