"use client";

import { useRef, useState } from "react";
import { Icon, PageHeader, useToast } from "@/components/mc";

type Resultado = {
  titulo: string;
  resultado: string;
  confianza: number;
  detalle: string;
  metricas: { label: string; valor: string }[];
  recomendaciones: string[];
  simulado?: boolean;
};

const MODOS = [
  { k: "maleza", label: "Maleza / Plaga", icon: "bug", desc: "Identificá una maleza, plaga o insecto y obtené el control recomendado." },
  { k: "maquinaria", label: "Maquinaria", icon: "wrench", desc: "Sacá una foto de una pieza o falla y obtené el diagnóstico y la acción." },
  { k: "condicion-corporal", label: "Condición corporal", icon: "cow", desc: "Estimá la condición corporal de un animal (escala 1–5)." },
  { k: "forraje", label: "Forraje / Potrero", icon: "leaf", desc: "Evaluá la disponibilidad y calidad del forraje de un potrero." },
  { k: "general", label: "General", icon: "camera", desc: "Análisis libre de cualquier imagen del campo." },
];

export default function VisionPage() {
  const toast = useToast();
  const [modo, setModo] = useState("maleza");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const elegir = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setResultado(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const analizar = async () => {
    if (!file) {
      toast.show("Subí o sacá una foto primero", "err");
      return;
    }
    setAnalizando(true);
    setResultado(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("modo", modo);
      const res = await fetch("/api/vision/analizar", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) setResultado(data);
      else toast.show(data.error || "No se pudo analizar la imagen", "err");
    } catch {
      toast.show("Error al analizar", "err");
    } finally {
      setAnalizando(false);
    }
  };

  const modoActual = MODOS.find((m) => m.k === modo);

  return (
    <div className="col gap-20">
      <PageHeader
        crumbs={["MiCampo", "Visión IA"]}
        title="Visión IA"
        subtitle="Sacá una foto del campo y la IA la identifica y te dice qué hacer."
      />

      {/* Selector de modo */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        {MODOS.map((m) => (
          <button
            key={m.k}
            onClick={() => { setModo(m.k); setResultado(null); }}
            className="mc-card"
            style={{
              cursor: "pointer", textAlign: "left", padding: 14,
              border: modo === m.k ? "2px solid #5e7733" : "1px solid var(--mc-line)",
              background: modo === m.k ? "#eef1e6" : "var(--mc-surface)",
            }}
          >
            <span style={{ width: 34, height: 34, borderRadius: 9, background: modo === m.k ? "#5e7733" : "var(--mc-surface-2)", color: modo === m.k ? "#fff" : "#5b5749", display: "grid", placeItems: "center", marginBottom: 8 }}>
              <Icon name={m.icon} size={17} />
            </span>
            <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 13.5 }}>{m.label}</div>
          </button>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 14 }}>
        {/* Captura */}
        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__title">{modoActual?.label}</div>
          </div>
          <div className="text-sm text-muted" style={{ marginBottom: 12 }}>{modoActual?.desc}</div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => elegir(e.target.files?.[0] || null)}
          />

          {preview ? (
            <div style={{ position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Captura" style={{ width: "100%", borderRadius: 12, maxHeight: 320, objectFit: "cover", border: "1px solid var(--mc-line)" }} />
              <button
                className="mc-btn mc-btn--secondary mc-btn--sm"
                style={{ position: "absolute", top: 8, right: 8 }}
                onClick={() => inputRef.current?.click()}
              >
                <Icon name="camera" size={13} />Cambiar
              </button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              style={{
                width: "100%", minHeight: 200, border: "2px dashed var(--mc-line)", borderRadius: 12,
                background: "var(--mc-surface-2)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--mc-text-2)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <Icon name="camera" size={28} />
                <div className="text-sm" style={{ marginTop: 8 }}>Tocá para sacar o subir una foto</div>
              </div>
            </button>
          )}

          <button className="mc-btn mc-btn--primary" style={{ width: "100%", marginTop: 12, justifyContent: "center" }} onClick={analizar} disabled={analizando || !file}>
            <Icon name="sparkles" size={15} />{analizando ? "Analizando imagen…" : "Analizar con IA"}
          </button>
        </div>

        {/* Resultado */}
        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 18, height: 18, borderRadius: 5, background: "#5e7733", color: "#fff", display: "grid", placeItems: "center" }}>
                <Icon name="sparkles" size={11} />
              </span>
              Resultado del análisis
            </div>
          </div>

          {!resultado ? (
            <div className="mc-empty" style={{ minHeight: 220 }}>
              <div className="mc-empty__icon"><Icon name="eye" size={22} /></div>
              <div className="mc-empty__text">El análisis de la imagen va a aparecer acá.</div>
            </div>
          ) : (
            <div className="col gap-12">
              <div className="row" style={{ gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span className="font-semi" style={{ fontSize: 18, color: "var(--mc-ink)" }}>{resultado.resultado}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: resultado.confianza >= 70 ? "#eef1e6" : "#fbf3e1", color: resultado.confianza >= 70 ? "#5e7733" : "#9a7218" }}>
                  Confianza {resultado.confianza}%
                </span>
              </div>
              {resultado.detalle && <div className="text-sm" style={{ color: "var(--mc-text-2)" }}>{resultado.detalle}</div>}

              {resultado.metricas.length > 0 && (
                <div className="grid g-cols-2 gap-8">
                  {resultado.metricas.map((m, i) => (
                    <div key={i} style={{ padding: "8px 10px", borderRadius: 9, background: "var(--mc-surface-2)" }}>
                      <div className="text-xs text-muted">{m.label}</div>
                      <div className="font-semi" style={{ color: "var(--mc-ink)" }}>{m.valor}</div>
                    </div>
                  ))}
                </div>
              )}

              {resultado.recomendaciones.length > 0 && (
                <div>
                  <div className="text-xs text-muted" style={{ marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Recomendaciones</div>
                  <div className="col gap-6">
                    {resultado.recomendaciones.map((r, i) => (
                      <div key={i} className="row" style={{ gap: 8, alignItems: "flex-start" }}>
                        <Icon name="arrowRight" size={14} style={{ color: "#d9a538", marginTop: 2 }} />
                        <span className="text-sm" style={{ color: "var(--mc-text-2)" }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {modo === "maleza" && (
                <a href="/calculadora-dosis" className="mc-btn mc-btn--secondary mc-btn--sm" style={{ alignSelf: "flex-start" }}>
                  <Icon name="beaker" size={13} />Calcular dosis
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
