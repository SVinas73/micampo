"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, PageHeader, useToast } from "@/components/mc";
import { useLoteScope } from "@/components/LoteScope";

type Resultado = {
  id?: string | null;
  modo?: string;
  titulo: string;
  resultado: string;
  confianza: number;
  detalle: string;
  metricas: { label: string; valor: string }[];
  recomendaciones: string[];
  fuente?: string | null;
  simulado?: boolean;
};

type HistItem = {
  id: string;
  modo: string;
  titulo: string;
  resultado: string;
  confianza: number;
  detalle: string;
  metricas: { label: string; valor: string }[];
  recomendaciones: string[];
  fuente?: string | null;
  imagenesCount: number;
  thumb: string | null;
  loteId: string | null;
  loteNombre: string | null;
  establecimientoNombre: string | null;
  alertaPlagaId: string | null;
  createdAt: string;
};

const MAX_IMAGENES = 4;

const MODOS = [
  { k: "maleza", label: "Maleza / Plaga", icon: "bug", desc: "Identificá una maleza, plaga o insecto y obtené el control recomendado." },
  { k: "maquinaria", label: "Maquinaria", icon: "wrench", desc: "Sacá una foto de una pieza o falla y obtené el diagnóstico y la acción." },
  { k: "condicion-corporal", label: "Condición corporal", icon: "cow", desc: "Estimá la condición corporal de un animal (escala 1–5)." },
  { k: "forraje", label: "Forraje / Potrero", icon: "leaf", desc: "Evaluá la disponibilidad y calidad del forraje de un potrero." },
  { k: "general", label: "General", icon: "camera", desc: "Análisis libre de cualquier imagen del campo." },
];

const TIPOS_PLAGA = ["Maleza", "Insecto", "Hongo", "Bacteria", "Virus"];
const SEVERIDADES = ["Baja", "Media", "Alta", "Crítica"];

/**
 * Redimensiona una imagen grande (foto de celular) a un máximo de lado y la
 * re-codifica a JPEG. Reduce el peso 5-10× → subida más rápida y confiable,
 * evita timeouts/413 y normaliza el formato. Si algo falla, usa el archivo original.
 */
async function prepararImagen(file: File, maxLado = 1600, calidad = 0.85): Promise<File> {
  try {
    if (typeof createImageBitmap !== "function") return file;
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
    if (escala >= 1 && file.size < 1_200_000) { bitmap.close?.(); return file; }
    const w = Math.round(bitmap.width * escala);
    const h = Math.round(bitmap.height * escala);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", calidad));
    if (!blob || blob.size === 0) return file;
    return new File([blob], (file.name.replace(/\.[^.]+$/, "") || "foto") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** Miniatura chica (para la galería del historial), como data URL JPEG. */
async function generarThumb(file: File, lado = 320, calidad = 0.7): Promise<string | null> {
  try {
    if (typeof createImageBitmap !== "function") return null;
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, lado / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * escala);
    const h = Math.round(bitmap.height * escala);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    return canvas.toDataURL("image/jpeg", calidad);
  } catch {
    return null;
  }
}

function fechaCorta(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

export default function VisionPage() {
  const toast = useToast();
  const { lotes, establecimientos, loteActivo } = useLoteScope();

  const [modo, setModo] = useState("maleza");
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [thumb, setThumb] = useState<string | null>(null);
  const [preparando, setPreparando] = useState(false);
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [loteSel, setLoteSel] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Historial
  const [historial, setHistorial] = useState<HistItem[]>([]);
  const [histCargado, setHistCargado] = useState(false);

  // Reporte de alerta (modo maleza)
  const [reportando, setReportando] = useState(false);
  const [tipoPlaga, setTipoPlaga] = useState("Maleza");
  const [severidad, setSeveridad] = useState("Media");
  const [creandoAlerta, setCreandoAlerta] = useState(false);
  const [alertaCreada, setAlertaCreada] = useState(false);

  useEffect(() => { setLoteSel(loteActivo?.id ?? ""); }, [loteActivo?.id]);

  const cargarHistorial = () => {
    fetch("/api/vision/historial")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setHistorial(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setHistCargado(true));
  };
  useEffect(() => { cargarHistorial(); }, []);

  const limpiarResultado = () => { setResultado(null); setReportando(false); setAlertaCreada(false); };

  const elegir = async (lista: FileList | null) => {
    if (!lista || lista.length === 0) return;
    limpiarResultado();
    setPreparando(true);
    const seleccion = Array.from(lista).slice(0, MAX_IMAGENES);
    const optimizadas = await Promise.all(seleccion.map((f) => prepararImagen(f)));
    setFiles(optimizadas);
    const dataUrls = await Promise.all(
      optimizadas.map((f) => new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = () => res(""); r.readAsDataURL(f); }))
    );
    setPreviews(dataUrls.filter(Boolean));
    setThumb(await generarThumb(optimizadas[0]));
    setPreparando(false);
  };

  const loteContexto = () => {
    const lote = lotes.find((l) => l.id === loteSel);
    if (!lote) return { loteId: "", loteNombre: "", establecimientoId: "", establecimientoNombre: "" };
    const est = establecimientos.find((e) => e.id === lote.establecimientoId);
    return { loteId: lote.id, loteNombre: lote.nombre, establecimientoId: est?.id ?? "", establecimientoNombre: est?.nombre ?? "" };
  };

  const analizar = async () => {
    if (files.length === 0) { toast.show("Subí o sacá una foto primero", "err"); return; }
    setAnalizando(true);
    limpiarResultado();
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("file", f));
      fd.append("modo", modo);
      const ctx = loteContexto();
      if (ctx.loteId) {
        fd.append("loteId", ctx.loteId);
        fd.append("loteNombre", ctx.loteNombre);
        if (ctx.establecimientoId) fd.append("establecimientoId", ctx.establecimientoId);
        if (ctx.establecimientoNombre) fd.append("establecimientoNombre", ctx.establecimientoNombre);
      }
      if (thumb) fd.append("thumb", thumb);
      const res = await fetch("/api/vision/analizar", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) { setResultado({ ...data, modo }); cargarHistorial(); }
      else toast.show(data.error || "No se pudo analizar la imagen", "err");
    } catch {
      toast.show("Error al analizar", "err");
    } finally {
      setAnalizando(false);
    }
  };

  const crearAlerta = async () => {
    const ctx = loteContexto();
    if (!ctx.loteId) { toast.show("Elegí un lote para reportar la alerta", "err"); return; }
    if (!resultado) return;
    setCreandoAlerta(true);
    try {
      const res = await fetch("/api/alertas-plagas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loteId: ctx.loteId,
          plaga: resultado.resultado,
          tipo: tipoPlaga,
          severidad,
          metodoDeteccion: "IA-Imagen",
          sintomas: resultado.recomendaciones,
        }),
      });
      if (res.ok) {
        const alerta = await res.json().catch(() => null);
        setAlertaCreada(true); setReportando(false);
        toast.show(`Alerta creada en ${ctx.loteNombre}`, "ok");
        // Vincular la alerta al análisis guardado para que el historial lo refleje.
        if (resultado.id && alerta?.id) {
          fetch(`/api/vision/historial/${resultado.id}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ alertaPlagaId: alerta.id }),
          }).then(() => cargarHistorial()).catch(() => {});
        }
      } else { const d = await res.json().catch(() => ({})); toast.show(d.error || "No se pudo crear la alerta", "err"); }
    } catch {
      toast.show("Error al crear la alerta", "err");
    } finally {
      setCreandoAlerta(false);
    }
  };

  const verHistorial = (h: HistItem) => {
    setModo(h.modo);
    setPreviews(h.thumb ? [h.thumb] : []);
    setThumb(h.thumb);
    setFiles([]);
    setResultado({
      id: h.id, modo: h.modo, titulo: h.titulo, resultado: h.resultado, confianza: h.confianza,
      detalle: h.detalle, metricas: h.metricas, recomendaciones: h.recomendaciones, fuente: h.fuente, simulado: false,
    });
    setReportando(false);
    setAlertaCreada(!!h.alertaPlagaId);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminarHistorial = async (id: string) => {
    setHistorial((prev) => prev.filter((h) => h.id !== id));
    await fetch(`/api/vision/historial/${id}`, { method: "DELETE" }).catch(() => {});
  };

  const modoActual = MODOS.find((m) => m.k === modo);

  return (
    <div className="col gap-20">
      <PageHeader
        crumbs={["MiCampo", "Visión IA"]}
        title="Visión IA"
        subtitle="Sacá una o varias fotos del campo y la IA las identifica, te dice qué hacer y lo guarda en tu historial."
      />

      {/* Selector de modo */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        {MODOS.map((m) => (
          <button
            key={m.k}
            onClick={() => { setModo(m.k); limpiarResultado(); }}
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
            multiple
            style={{ display: "none" }}
            onChange={(e) => elegir(e.target.files)}
          />

          {previews.length > 0 ? (
            <div>
              <div className="grid" style={{ gridTemplateColumns: previews.length > 1 ? "repeat(2, 1fr)" : "1fr", gap: 8 }}>
                {previews.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt={`Captura ${i + 1}`} style={{ width: "100%", borderRadius: 12, aspectRatio: previews.length > 1 ? "1 / 1" : "16 / 10", objectFit: "cover", border: "1px solid var(--mc-line)" }} />
                ))}
              </div>
              <button className="mc-btn mc-btn--secondary mc-btn--sm" style={{ marginTop: 8 }} onClick={() => inputRef.current?.click()}>
                <Icon name="camera" size={13} />Cambiar fotos
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
                <div className="text-sm" style={{ marginTop: 8 }}>Tocá para sacar o subir fotos</div>
                <div className="text-xs text-muted" style={{ marginTop: 2 }}>Hasta {MAX_IMAGENES} imágenes del mismo caso</div>
              </div>
            </button>
          )}

          {/* Contexto: lote asociado (opcional) */}
          {lotes.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div className="mc-label" style={{ marginBottom: 4 }}>Asociar a un lote (opcional)</div>
              <select className="mc-select" value={loteSel} onChange={(e) => setLoteSel(e.target.value)}>
                <option value="">Sin lote</option>
                {lotes.map((l) => <option key={l.id} value={l.id}>{l.nombre}{l.cultivo ? ` · ${l.cultivo}` : ""}</option>)}
              </select>
            </div>
          )}

          <button className="mc-btn mc-btn--primary" style={{ width: "100%", marginTop: 12, justifyContent: "center" }} onClick={analizar} disabled={analizando || preparando || files.length === 0}>
            <Icon name="sparkles" size={15} />{preparando ? "Optimizando fotos…" : analizando ? "Analizando…" : `Analizar con IA${files.length > 1 ? ` (${files.length} fotos)` : ""}`}
          </button>
        </div>

        {/* Resultado */}
        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 18, height: 18, borderRadius: 5, background: "#5e7733", color: "#fff", display: "grid", placeItems: "center" }}>
                <Icon name="sparkles" size={11} />
              </span>
              Resultado del análisis{resultado?.fuente === "modelo-propio" ? " · modelo propio" : ""}
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

              {/* Acciones sobre el resultado */}
              <div className="row gap-8" style={{ flexWrap: "wrap", borderTop: "1px solid var(--mc-line)", paddingTop: 12 }}>
                {modo === "maleza" && (
                  <a href="/calculadora-dosis" className="mc-btn mc-btn--secondary mc-btn--sm">
                    <Icon name="beaker" size={13} />Calcular dosis
                  </a>
                )}
                {modo === "maleza" && !alertaCreada && (
                  <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => setReportando((v) => !v)}>
                    <Icon name="alert" size={13} />Reportar como alerta
                  </button>
                )}
                {alertaCreada && (
                  <span className="mc-badge mc-badge--green" style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Icon name="check" size={11} />Alerta registrada
                  </span>
                )}
              </div>

              {/* Formulario de reporte de alerta */}
              {reportando && (
                <div className="col gap-8" style={{ padding: 12, borderRadius: 10, background: "var(--mc-surface-2)", border: "1px solid var(--mc-line)" }}>
                  <div className="text-xs text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>Nueva alerta de plaga</div>
                  {!loteSel && <div className="text-xs" style={{ color: "var(--mc-amber)" }}>Elegí un lote arriba para poder reportar la alerta.</div>}
                  <div className="row gap-8" style={{ flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 130 }}>
                      <div className="mc-label" style={{ marginBottom: 4 }}>Tipo</div>
                      <select className="mc-select" value={tipoPlaga} onChange={(e) => setTipoPlaga(e.target.value)}>
                        {TIPOS_PLAGA.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1, minWidth: 130 }}>
                      <div className="mc-label" style={{ marginBottom: 4 }}>Severidad</div>
                      <select className="mc-select" value={severidad} onChange={(e) => setSeveridad(e.target.value)}>
                        {SEVERIDADES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <button className="mc-btn mc-btn--primary mc-btn--sm" style={{ alignSelf: "flex-start" }} onClick={crearAlerta} disabled={creandoAlerta || !loteSel}>
                    <Icon name="check" size={13} />{creandoAlerta ? "Creando…" : "Crear alerta"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Historial de análisis */}
      <div className="mc-card">
        <div className="mc-card__head">
          <div>
            <div className="mc-card__eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="clock" size={13} /> Historial
            </div>
            <div className="mc-card__title mt-4">Tus análisis recientes</div>
          </div>
        </div>
        {!histCargado ? (
          <div className="text-sm text-muted">Cargando historial…</div>
        ) : historial.length === 0 ? (
          <div className="mc-empty" style={{ minHeight: 120 }}>
            <div className="mc-empty__icon"><Icon name="camera" size={20} /></div>
            <div className="mc-empty__text">Todavía no analizaste ninguna imagen. Cada análisis va a quedar guardado acá.</div>
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {historial.map((h) => {
              const mo = MODOS.find((m) => m.k === h.modo);
              return (
                <div key={h.id} className="mc-card" style={{ padding: 0, overflow: "hidden", cursor: "pointer", position: "relative" }} onClick={() => verHistorial(h)}>
                  <div style={{ position: "relative", aspectRatio: "16 / 10", background: "var(--mc-surface-2)" }}>
                    {h.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={h.thumb} alt={h.resultado} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--mc-text-3)" }}><Icon name={mo?.icon || "camera"} size={22} /></div>
                    )}
                    <span style={{ position: "absolute", top: 6, left: 6, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: "rgba(20,28,16,0.72)", color: "#fff", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Icon name={mo?.icon || "camera"} size={10} />{mo?.label || h.modo}
                    </span>
                    {h.imagenesCount > 1 && (
                      <span style={{ position: "absolute", top: 6, right: 6, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: "rgba(20,28,16,0.72)", color: "#fff" }}>×{h.imagenesCount}</span>
                    )}
                    <button
                      aria-label="Eliminar del historial"
                      className="mc-icon-btn"
                      style={{ position: "absolute", bottom: 6, right: 6, width: 26, height: 26, background: "rgba(255,255,255,0.9)", border: "none" }}
                      onClick={(e) => { e.stopPropagation(); eliminarHistorial(h.id); }}
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                  <div style={{ padding: "10px 12px" }}>
                    <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                      <span className="font-semi text-sm" style={{ color: "var(--mc-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.resultado}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 999, background: h.confianza >= 70 ? "#eef1e6" : "#fbf3e1", color: h.confianza >= 70 ? "#5e7733" : "#9a7218", flexShrink: 0 }}>{Math.round(h.confianza)}%</span>
                    </div>
                    <div className="text-xs text-muted" style={{ marginTop: 3, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                      <span>{fechaCorta(h.createdAt)}</span>
                      {h.loteNombre && <span style={{ color: "var(--mc-green-700)", display: "inline-flex", alignItems: "center", gap: 3 }}><Icon name="map" size={10} />{h.loteNombre}</span>}
                      {h.alertaPlagaId && <span style={{ color: "var(--mc-amber)", display: "inline-flex", alignItems: "center", gap: 3 }}><Icon name="alert" size={10} />alerta</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
