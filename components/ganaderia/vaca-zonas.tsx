"use client";

// Datos veterinarios de las zonas anatómicas y el panel de detalle, compartidos
// por el diagrama 2D (vaca-anatomia) y el modelo 3D (cow3d). Es liviano (sin la
// geometría pesada del line-art), así el 3D puede reusar el panel sin arrastrar
// el path del dibujo.

import React from "react";

export type ZonaStat = { zona: string; pct: number; casos: number; cond: string; label: string };

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

export const heatColor = (pct: number) => (pct >= 10 ? "#dc2626" : pct >= 6 ? "#ea580c" : pct >= 3 ? "#f59e0b" : "#65a30d");

/* Panel de detalle de la zona activa (misma presentación en 2D y 3D). */
export function ZonaInfoPanel({ zona, stat }: { zona: string | null; stat?: ZonaStat }) {
  const info = zona ? ZONA_ANATOMIA[zona] : null;
  return (
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
  );
}
