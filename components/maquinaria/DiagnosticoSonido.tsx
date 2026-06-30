"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/mc/Icon";

/**
 * Diagnóstico de fallas de maquinaria por SONIDO de motor.
 * Graba (o sube) el audio del motor y lo manda a /api/maquinaria/diagnostico-audio,
 * que lo rutea al modelo propio de MiCampo (tarea "audio.maquinaria"). El seam ya
 * queda listo: cuando el modelo entrenado esté conectado, devuelve el diagnóstico real.
 */

type Resultado = {
  diagnostico: string;
  severidad: "ok" | "leve" | "media" | "alta";
  confianza: number;
  causaProbable: string;
  accion: string;
  componentes: string[];
  pendienteModelo?: boolean;
  modeloConectado?: boolean;
  mensajeGrabacion?: string;
  fuente?: string;
};

const SEV: Record<string, { label: string; color: string; bg: string }> = {
  ok: { label: "Sin anomalías", color: "#5e7733", bg: "#eef1e6" },
  leve: { label: "Leve", color: "#9a7218", bg: "#fbf3e1" },
  media: { label: "Media", color: "#c0532a", bg: "#fbede3" },
  alta: { label: "Alta", color: "#c93434", bg: "#fbe3e3" },
};

export default function DiagnosticoSonido() {
  const [grabando, setGrabando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [codigoError, setCodigoError] = useState("");
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const soporta = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

  const setAudio = (b: Blob) => {
    setBlob(b);
    setAudioUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(b); });
    setResultado(null);
    setError(null);
  };

  const grabar = async () => {
    if (grabando) {
      recRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setGrabando(false);
        setAudio(new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" }));
      };
      recRef.current = rec;
      rec.start();
      setSegundos(0);
      setGrabando(true);
      timerRef.current = setInterval(() => setSegundos((s) => s + 1), 1000);
    } catch {
      setError("No pude acceder al micrófono. Permití el acceso o subí un archivo de audio.");
    }
  };

  const elegirArchivo = (f: File | null) => { if (f) setAudio(f); };

  const analizar = async () => {
    if (!blob) { setError("Grabá o subí el audio del motor primero."); return; }
    setAnalizando(true);
    setResultado(null);
    setError(null);
    try {
      const fd = new FormData();
      const ext = (blob.type.split("/")[1] || "webm").split(";")[0];
      fd.append("file", blob, `motor.${ext}`);
      fd.append("marca", marca);
      fd.append("modelo", modelo);
      fd.append("codigoError", codigoError);
      const res = await fetch("/api/maquinaria/diagnostico-audio", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) setResultado(data);
      else setError(data.error || "No se pudo analizar el audio");
    } catch {
      setError("Error al analizar el audio");
    } finally {
      setAnalizando(false);
    }
  };

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const sev = resultado ? (SEV[resultado.severidad] || SEV.ok) : null;

  const inputS: React.CSSProperties = { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--mc-line-2)", fontSize: 13, background: "var(--mc-surface)", color: "var(--mc-ink)" };

  return (
    <div className="grid" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 14, alignItems: "start" }}>
      {/* Captura */}
      <div className="mc-card">
        <div className="mc-card__head">
          <div className="mc-card__eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 18, height: 18, borderRadius: 5, background: "#5e7733", color: "#fff", display: "grid", placeItems: "center" }}><Icon name="mic" size={11} /></span>
            Diagnóstico por sonido de motor
          </div>
        </div>
        <div className="text-sm text-muted" style={{ marginBottom: 12 }}>
          Grabá el motor en marcha (ralentí y aceleración, 10–15 s, cerca del bloque) y la IA detecta la falla por su sonido.
        </div>

        <div className="row gap-10" style={{ alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
          <button
            onClick={grabar}
            disabled={!soporta}
            className="mc-btn"
            style={{ background: grabando ? "#c93434" : "#5e7733", color: "#fff", minWidth: 150, justifyContent: "center" }}
            title={soporta ? "" : "Tu navegador no permite grabar; subí un archivo"}
          >
            <Icon name={grabando ? "pause" : "mic"} size={15} />{grabando ? `Detener (${mmss(segundos)})` : "Grabar motor"}
          </button>
          <input ref={fileRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={(e) => elegirArchivo(e.target.files?.[0] || null)} />
          <button className="mc-btn mc-btn--secondary" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={14} />Subir audio
          </button>
        </div>

        {audioUrl && (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio src={audioUrl} controls style={{ width: "100%", marginBottom: 12 }} />
        )}

        <div className="grid g-cols-3 gap-8" style={{ marginBottom: 12 }}>
          <input style={inputS} placeholder="Marca" value={marca} onChange={(e) => setMarca(e.target.value)} />
          <input style={inputS} placeholder="Modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} />
          <input style={inputS} placeholder="Cód. error" value={codigoError} onChange={(e) => setCodigoError(e.target.value)} />
        </div>

        <button className="mc-btn mc-btn--primary" style={{ width: "100%", justifyContent: "center" }} onClick={analizar} disabled={analizando || !blob}>
          <Icon name="sparkles" size={15} />{analizando ? "Analizando sonido…" : "Analizar con IA"}
        </button>
        {error && <div className="text-sm" style={{ color: "var(--mc-red)", marginTop: 10 }}>{error}</div>}
      </div>

      {/* Resultado */}
      <div className="mc-card">
        <div className="mc-card__head">
          <div className="mc-card__eyebrow">Resultado</div>
        </div>
        {!resultado ? (
          <div className="mc-empty" style={{ minHeight: 200 }}>
            <div className="mc-empty__icon"><Icon name="activity" size={22} /></div>
            <div className="mc-empty__text">El diagnóstico del motor va a aparecer acá.</div>
          </div>
        ) : (
          <div className="col gap-12">
            <div className="row" style={{ gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span className="font-semi" style={{ fontSize: 16, color: "var(--mc-ink)" }}>{resultado.diagnostico}</span>
              {sev && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999, background: sev.bg, color: sev.color }}>{sev.label}</span>}
              {resultado.confianza > 0 && <span className="text-xs text-muted">Confianza {resultado.confianza}%</span>}
            </div>

            {resultado.pendienteModelo && (
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "#fbf3e1", border: "1px solid #ecd9a8", color: "#7a5b12", fontSize: 12.5, display: "flex", gap: 8 }}>
                <Icon name="bolt" size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                <span>Seteado para tu modelo propio. {resultado.modeloConectado ? "El modelo está conectado pero aún no cubre esta tarea." : "Conectá tu IA entrenada y este flujo devolverá la falla detectada."}</span>
              </div>
            )}

            {resultado.causaProbable && (
              <div>
                <div className="text-xs text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Causa probable</div>
                <div className="text-sm" style={{ color: "var(--mc-text-2)" }}>{resultado.causaProbable}</div>
              </div>
            )}
            {resultado.accion && (
              <div>
                <div className="text-xs text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Acción recomendada</div>
                <div className="text-sm" style={{ color: "var(--mc-text-2)" }}>{resultado.accion}</div>
              </div>
            )}
            {resultado.componentes?.length > 0 && (
              <div className="row gap-6" style={{ flexWrap: "wrap" }}>
                {resultado.componentes.map((c, i) => <span key={i} className="mc-badge mc-badge--neutral" style={{ fontSize: 11 }}>{c}</span>)}
              </div>
            )}
            {resultado.mensajeGrabacion && <div className="text-xs text-muted">{resultado.mensajeGrabacion}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
