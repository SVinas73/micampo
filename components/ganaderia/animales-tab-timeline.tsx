"use client";

// Tab Timeline: Historia de Vida de un animal (feed de eventos reales),
// Identidad & Linaje Genético y Estado Detallado & Diagnóstico.
// El animal se elige con el buscador; los eventos salen de /api/animales/[id].

import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/mc";
import { AnimalRow, fmtFecha } from "./tipos";

type EventoVidaAPI = {
  id: string;
  fecha: string;
  tipoEvento: string;
  titulo: string;
  descripcion?: string | null;
  valorNumerico?: number | null;
  unidad?: string | null;
  ubicacion?: string | null;
  importante?: boolean;
};

type DetalleTimeline = {
  registrosPeso?: { fecha: string; peso: number }[];
  registrosLecheros?: { fecha: string; litros: number }[];
  historialReproductivo?: {
    estadoActual: string;
    ultimoServicio?: string | null;
    fechaEsperadaParto?: string | null;
    totalPartos: number;
  } | null;
  tratamientos?: { estado: string; diagnostico: string; proximaDosis?: string | null }[];
  eventosVida?: EventoVidaAPI[];
  eventosSanitarios?: { tipo: string; fecha: string; descripcion: string }[];
  registroGenetico?: {
    padre?: { caravana: string; raza?: string | null } | null;
    madre?: { caravana: string; raza?: string | null } | null;
    valorGeneticoEstimado?: number | null;
    gananciaEsperada?: number | null;
    produccionLecheEsperada?: number | null;
    facilidadParto?: string | null;
  } | null;
};

const CAT: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  Salud: { color: "#5e7733", bg: "#f1f4ea", icon: "heart", label: "Salud" },
  Producción: { color: "#2563eb", bg: "#eff6ff", icon: "droplets", label: "Producción" },
  Reproducción: { color: "#db2777", bg: "#fdf2f8", icon: "egg", label: "Reproducción" },
  Movimiento: { color: "#d97706", bg: "#fffbeb", icon: "route", label: "Movimiento" },
  Nacimiento: { color: "#4a5e29", bg: "#e0e7cd", icon: "sprout", label: "Nacimiento" },
  Peso: { color: "#7c3aed", bg: "#faf5ff", icon: "scale", label: "Peso" },
};

function catDeEvento(tipoEvento: string): keyof typeof CAT {
  switch (tipoEvento) {
    case "Nacimiento":
      return "Nacimiento";
    case "Peso":
      return "Peso";
    case "Movimiento":
    case "Traslado":
      return "Movimiento";
    case "Reproduccion":
    case "Reproductivo":
      return "Reproducción";
    case "Produccion":
    case "Producción":
      return "Producción";
    default:
      return "Salud";
  }
}

export function AnimTimeline({
  animales,
  animalSel,
  onSeleccionar,
  onVerDetalle,
  onRegistrarEvento,
}: {
  animales: AnimalRow[];
  animalSel: AnimalRow | null;
  onSeleccionar: (a: AnimalRow | null) => void;
  onVerDetalle?: (a: AnimalRow) => void;
  onRegistrarEvento?: () => void;
}) {
  const [filter, setFilter] = useState("Todo");
  const [search, setSearch] = useState("");
  const [buscarAnimal, setBuscarAnimal] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [hoveredEvt, setHoveredEvt] = useState<number | null>(null);
  // Detalle cacheado por animal: evitamos resetear a null de forma síncrona en el
  // efecto (deriva del animal seleccionado + el último fetch resuelto).
  const [detalleRaw, setDetalleRaw] = useState<{ dbId: string; data: DetalleTimeline | null } | null>(null);

  useEffect(() => {
    if (!animalSel) return;
    let ok = true;
    const dbId = animalSel.dbId;
    fetch(`/api/animales/${dbId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => ok && setDetalleRaw({ dbId, data: d }))
      .catch(() => {});
    return () => {
      ok = false;
    };
  }, [animalSel]);

  const detalle = animalSel && detalleRaw && detalleRaw.dbId === animalSel.dbId ? detalleRaw.data : null;

  const eventos = useMemo(() => {
    if (!detalle) return [] as { cat: keyof typeof CAT; fecha: string; anio: number; hora: string; titulo: string; badge?: string; detalle: string; sub?: string }[];
    return (detalle.eventosVida || []).map((e) => {
      const d = new Date(e.fecha);
      return {
        cat: catDeEvento(e.tipoEvento),
        fecha: fmtFecha(e.fecha),
        anio: d.getFullYear(),
        hora: d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
        titulo: e.titulo,
        badge: e.importante ? "Hito" : undefined,
        detalle: e.descripcion || (e.valorNumerico ? `${e.valorNumerico} ${e.unidad || ""}` : e.ubicacion || "—"),
        sub: e.ubicacion || undefined,
      };
    });
  }, [detalle]);

  const filters = ["Todo", ...Object.keys(CAT)];
  const filtered = eventos.filter(
    (e) =>
      (filter === "Todo" || e.cat === filter) &&
      (search === "" || e.titulo.toLowerCase().includes(search.toLowerCase()) || e.detalle.toLowerCase().includes(search.toLowerCase()))
  );
  const visible = showMore ? filtered : filtered.slice(0, 5);

  // Buscador de animal
  const qA = buscarAnimal.trim().toLowerCase();
  const sugerencias = qA === "" ? [] : animales.filter((a) => a.id.toLowerCase().includes(qA) || (a.nombre || "").toLowerCase().includes(qA)).slice(0, 6);

  // Estado detallado real
  const h = detalle?.historialReproductivo || null;
  const faseLabels = ["Vacía", "Inseminada", "Preñada", "Confirmada"];
  const faseRepro = h?.estadoActual === "Preñada" ? 2 : h?.estadoActual === "En Servicio" ? 1 : 0;
  const tratActivos = (detalle?.tratamientos || []).filter((t) => ["En curso", "En retiro"].includes(t.estado));
  const saludPct = tratActivos.length === 0 ? 97 : Math.max(40, 97 - tratActivos.length * 20);
  const proximaVacuna = (detalle?.tratamientos || []).find((t) => t.proximaDosis)?.proximaDosis;
  const gen = detalle?.registroGenetico || null;
  const meritoGenetico = gen?.valorGeneticoEstimado ? Math.min(5, Math.max(0, gen.valorGeneticoEstimado)) : null;
  const diasLactancia = useMemo(() => {
    const regs = detalle?.registrosLecheros || [];
    if (regs.length === 0 || !h?.totalPartos) return null;
    // aproximación: desde el último parto
    return null;
  }, [detalle, h]);
  void diasLactancia;

  if (!animalSel) {
    return (
      <div className="mc-card" style={{ padding: 28 }}>
        <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <div className="mc-empty__icon" style={{ margin: "0 auto 12px" }}><Icon name="search" size={20} /></div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--mc-ink)" }}>Elegí un animal para ver su historia de vida</div>
          <div className="text-xs text-muted mt-4" style={{ marginBottom: 14 }}>Buscá por caravana o nombre.</div>
          <div className="row" style={{ background: "var(--mc-surface-2)", border: "1px solid var(--mc-line-2)", borderRadius: 10, padding: "8px 12px" }}>
            <Icon name="search" size={14} style={{ color: "var(--mc-text-3)" }} />
            <input value={buscarAnimal} onChange={(e) => setBuscarAnimal(e.target.value)} placeholder="Ej: #4092 o Rosa…" style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: 13, fontFamily: "inherit" }} autoFocus />
          </div>
          <div className="col gap-6" style={{ marginTop: 8, textAlign: "left" }}>
            {sugerencias.map((a) => (
              <div key={a.dbId} onClick={() => onSeleccionar(a)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, cursor: "pointer", border: "1px solid var(--mc-line)", background: "var(--mc-surface)" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e8f5e9", display: "grid", placeItems: "center", color: "#0a5a24", flexShrink: 0 }}><Icon name="cow" size={16} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mc-ink)" }}>{a.nombre || a.id}</div>
                  <div style={{ fontSize: 11.5, color: "var(--mc-text-3)" }}>{a.id} · {a.categoria} · {a.lote}</div>
                </div>
                <Icon name="chevRight" size={14} style={{ color: "var(--mc-text-3)" }} />
              </div>
            ))}
            {qA && sugerencias.length === 0 && <div style={{ fontSize: 12, color: "var(--mc-text-3)", textAlign: "center" }}>Sin resultados.</div>}
          </div>
        </div>
      </div>
    );
  }

  const a = animalSel;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(260px, 1fr)", gap: 16, alignItems: "start" }}>
      {/* IZQUIERDA: Historia de Vida */}
      <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 0", background: "linear-gradient(to bottom,var(--mc-surface-2),var(--mc-surface))" }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Historia de Vida</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: "var(--mc-ink)", letterSpacing: "-0.02em" }}>
                {a.id} &nbsp;<span style={{ color: "var(--mc-green-700)" }}>{a.nombre || ""}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginLeft: 8 }}>{a.raza !== "—" ? a.raza : a.categoria}</span>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar evento…" style={{ padding: "7px 12px 7px 30px", border: "1.5px solid var(--mc-line-2)", borderRadius: 20, fontSize: 12, background: "var(--mc-surface-2)", outline: "none", width: 170 }} />
              <Icon name="search" size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingBottom: 14, borderBottom: "1px solid var(--mc-line)" }}>
            {filters.map((f) => {
              const cat = CAT[f];
              const active = filter === f;
              return (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", border: active ? `1.5px solid ${cat?.color || "#16a34a"}` : "1.5px solid var(--mc-line)", background: active ? cat?.color || "#16a34a" : "var(--mc-surface-2)", color: active ? "white" : "#64748b", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon name={cat?.icon || "list"} size={12} />{f}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "4px 0 20px", maxHeight: 520, overflowY: "auto" }}>
          {visible.map((e, i) => {
            const cat = CAT[e.cat];
            const isHov = hoveredEvt === i;
            const showDiv = i === 0 || visible[i - 1].anio !== e.anio;
            return (
              <React.Fragment key={i}>
                {showDiv && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 24px 6px" }}>
                    <div style={{ height: 1, flex: 1, background: "var(--mc-line)" }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em" }}>{e.anio}</span>
                    <div style={{ height: 1, flex: 1, background: "var(--mc-line)" }} />
                  </div>
                )}
                <div
                  onMouseEnter={() => setHoveredEvt(i)}
                  onMouseLeave={() => setHoveredEvt(null)}
                  style={{ display: "flex", gap: 0, position: "relative", padding: "6px 24px 6px 20px", cursor: "default", transition: "background 0.15s", background: isHov ? `${cat.color}08` : "transparent" }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40, flexShrink: 0, position: "relative" }}>
                    {i < visible.length - 1 && (
                      <div style={{ position: "absolute", top: 38, bottom: -12, left: "50%", transform: "translateX(-50%)", width: 2, background: `linear-gradient(to bottom, ${cat.color}40, ${CAT[visible[i + 1]?.cat]?.color || "#e2e8f0"}20)` }} />
                    )}
                    <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${cat.color}22, ${cat.color}11)`, border: `2px solid ${cat.color}50`, display: "flex", alignItems: "center", justifyContent: "center", color: cat.color, marginTop: 2, boxShadow: isHov ? `0 0 0 4px ${cat.color}18, 0 2px 8px ${cat.color}28` : `0 0 0 3px ${cat.color}12`, transition: "box-shadow 0.2s, transform 0.15s", transform: isHov ? "scale(1.12)" : "scale(1)" }}><Icon name={cat.icon} size={16} /></div>
                  </div>

                  <div style={{ flex: 1, marginLeft: 12, padding: "10px 14px", borderRadius: 12, background: isHov ? `${cat.color}0d` : cat.bg, border: `1px solid ${cat.color}${isHov ? "45" : "25"}`, boxShadow: isHov ? `0 2px 12px ${cat.color}18` : "0 1px 3px rgba(0,0,0,0.03)", transform: isHov ? "translateX(3px)" : "translateX(0)", transition: "all 0.18s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)" }}>{e.titulo}</span>
                        {e.badge && (
                          <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 20, background: cat.color, color: "white", letterSpacing: "0.04em" }}>{e.badge}</span>
                        )}
                        <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 20, background: `${cat.color}20`, color: cat.color, fontWeight: 700, border: `1px solid ${cat.color}30` }}>{cat.label}</span>
                      </div>
                      <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap", marginLeft: 8, fontVariantNumeric: "tabular-nums" }}>{e.hora} · {e.fecha}</span>
                    </div>
                    <div style={{ fontSize: 12, color: cat.color, fontWeight: 600, letterSpacing: "-0.01em" }}>{e.detalle}</div>
                    {e.sub && <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, paddingTop: 4, borderTop: `1px dashed ${cat.color}20` }}>{e.sub}</div>}
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {filtered.length > 5 && (
            <div style={{ padding: "14px 24px 0", display: "flex", justifyContent: "center" }}>
              <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={() => setShowMore(!showMore)}>
                {showMore ? "↑ Ver menos" : `Ver ${filtered.length - 5} eventos más`}
              </button>
            </div>
          )}
          {filtered.length === 0 && (
            <div style={{ padding: "36px 24px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
              {eventos.length === 0 ? "Este animal todavía no tiene eventos registrados." : "Sin eventos con ese filtro."}
            </div>
          )}
        </div>
      </div>

      {/* DERECHA: Identidad + Estado */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Identidad & Linaje */}
        <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid var(--mc-line)", background: "linear-gradient(135deg,var(--mc-green-50),var(--mc-surface))" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-green-700)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Identidad &amp; Linaje Genético</div>
              <button
                title="Ver ficha completa del animal"
                onClick={() => onVerDetalle && onVerDetalle(a)}
                className="mc-icon-btn"
                style={{ width: 30, height: 30 }}
              >
                <Icon name="eye" size={14} />
              </button>
            </div>
          </div>
          <div style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18, paddingBottom: 16, borderBottom: "1px solid var(--mc-line)" }}>
              <div
                onClick={() => onVerDetalle && onVerDetalle(a)}
                title={a.api.foto ? "Ver ficha del animal" : "Agregá una foto desde la ficha del animal"}
                style={{ width: 72, height: 72, borderRadius: "50%", flexShrink: 0, background: "var(--mc-green-50)", border: "3px solid var(--mc-green-200)", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mc-green-600)", cursor: onVerDetalle ? "pointer" : "default" }}
              >
                {a.api.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.api.foto} alt={a.id} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <Icon name="camera" size={24} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "var(--mc-ink)", letterSpacing: "-0.02em" }}>
                  {a.id} <span style={{ color: "var(--mc-green-700)" }}>{a.nombre || ""}</span>
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{a.raza !== "—" ? a.raza : a.categoria} {a.rfid ? <>&nbsp;·&nbsp; {a.rfid}</> : null}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  {a.rfid && <span style={{ fontSize: 10, fontWeight: 700, background: "var(--mc-green-50)", border: "1px solid var(--mc-green-200)", color: "var(--mc-green-700)", padding: "2px 8px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 3 }}><Icon name="tag" size={10} /> RFID Activo</span>}
                  {a.prodNum !== null && <span style={{ fontSize: 10, fontWeight: 700, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", padding: "2px 8px", borderRadius: 20 }}>En Producción</span>}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Árbol Genealógico</div>
            <div style={{ position: "relative" }}>
              <div style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid #bfdbfe", background: "#eff6ff", display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#93c5fd,#bfdbfe)", display: "flex", alignItems: "center", justifyContent: "center", color: "#1e40af", flexShrink: 0 }}><Icon name="beef" size={18} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 1 }}>Padre</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1e40af" }}>{gen?.padre?.caravana ? `Toro ${gen.padre.caravana}` : a.padre ? `Toro ${a.padre}` : "Sin registro"}</div>
                  {gen?.padre?.raza && <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{gen.padre.raza}</div>}
                </div>
              </div>
              <svg width="100%" height="30" style={{ display: "block", margin: "4px 0" }}>
                <line x1="50%" y1="0" x2="50%" y2="30" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="3,3" />
                <circle cx="50%" cy="15" r="6" fill="var(--mc-green-50)" stroke="var(--mc-green-400)" strokeWidth="1.5" />
                <text x="50%" y="19" textAnchor="middle" fontSize="6" fontWeight="800" fill="var(--mc-green-700)">TÚ</text>
              </svg>
              <div style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--mc-green-200)", background: "var(--mc-green-50)", display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--mc-green-100)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mc-green-700)", flexShrink: 0 }}><Icon name="cow" size={18} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 1 }}>Madre</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--mc-green-700)" }}>{gen?.madre?.caravana ? `Vaca ${gen.madre.caravana}` : a.madre ? `Vaca ${a.madre}` : "Sin registro"}</div>
                  {gen?.madre?.raza && <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{gen.madre.raza}</div>}
                </div>
              </div>
            </div>
            {/* Crías */}
            {(() => {
              const crias = animales.filter((x) => x.madre && x.madre.replace(/^#/, "") === a.id.replace(/^#/, ""));
              if (crias.length === 0) return null;
              return (
                <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--mc-line-2)", background: "var(--mc-surface-2)", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex" }}>
                    {crias.slice(0, 3).map((c, i) => (
                      <div key={c.dbId} style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#fde68a,#fef3c7)", border: "2px solid #fde047", display: "flex", alignItems: "center", justifyContent: "center", color: "#a16207", marginLeft: i > 0 ? -8 : 0, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}><Icon name="cow" size={15} /></div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)" }}>{crias.length} Cría{crias.length > 1 ? "s" : ""} Registrada{crias.length > 1 ? "s" : ""}</div>
                    <div style={{ fontSize: 10, color: "var(--mc-text-3)" }}>{crias.map((c) => c.id).join(" · ")}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Estado Detallado & Diagnóstico */}
        <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "13px 20px 11px", borderBottom: "1px solid var(--mc-line)", background: "linear-gradient(135deg,var(--mc-surface-2),var(--mc-surface))" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>Estado Detallado &amp; Diagnóstico</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            {/* Peso / Producción */}
            <div style={{ padding: 16, borderRight: "1px solid var(--mc-line)", borderBottom: "1px solid var(--mc-line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "#f0fdf4", border: "1.5px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}><Icon name="scale" size={12} /></div>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.07em" }}>Peso & Prod.</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "var(--mc-ink)", marginBottom: 2 }}>
                {a.peso !== "N/A" ? `${a.peso} kg` : "Sin pesadas"}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>Producción: <strong style={{ color: "var(--mc-ink)" }}>{a.prod}</strong></div>
              {(detalle?.registrosPeso || []).slice(-3).map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#64748b", padding: "3px 0", borderBottom: "1px dashed var(--mc-line)" }}>
                  <span>{fmtFecha(r.fecha)}</span>
                  <strong style={{ color: "var(--mc-ink)" }}>{Math.round(r.peso)} kg</strong>
                </div>
              ))}
            </div>

            {/* Reproductivo */}
            <div style={{ padding: 16, borderBottom: "1px solid var(--mc-line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "#fdf2f8", border: "1.5px solid #fbcfe8", display: "flex", alignItems: "center", justifyContent: "center", color: "#db2777" }}><Icon name="egg" size={12} /></div>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#db2777", textTransform: "uppercase", letterSpacing: "0.07em" }}>Reproductivo</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#db2777", marginBottom: 6 }}>
                {h?.estadoActual || "Sin datos"}
              </div>
              <div style={{ position: "relative", margin: "10px 0" }}>
                <div style={{ height: 3, borderRadius: 3, background: "var(--mc-surface-3)" }}>
                  <div style={{ height: "100%", width: `${(faseRepro / 3) * 100}%`, background: "linear-gradient(90deg,#f9a8d4,#db2777)", borderRadius: 3 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                  {faseLabels.map((f, i) => (
                    <div key={f} style={{ textAlign: "center" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", margin: "0 auto 3px", background: i <= faseRepro ? "#db2777" : "#e2e8f0", boxShadow: i === faseRepro ? "0 0 0 3px #fdf2f8, 0 0 0 5px #db277760" : "none" }} />
                      <span style={{ fontSize: 8, color: i <= faseRepro ? "#db2777" : "#94a3b8", fontWeight: i === faseRepro ? 800 : 400 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              {h?.fechaEsperadaParto && (
                <div style={{ marginTop: 10, padding: "8px 10px", background: "#fdf2f8", borderRadius: 8, border: "1px solid #fbcfe8", fontSize: 11 }}>
                  Parto probable: <strong style={{ color: "#db2777" }}>{fmtFecha(h.fechaEsperadaParto)}</strong>
                </div>
              )}
            </div>

            {/* Sanidad */}
            <div style={{ padding: 16, borderRight: "1px solid var(--mc-line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "#f0fdf4", border: "1.5px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}><Icon name="heart" size={12} /></div>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.07em" }}>Sanidad</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <svg width="52" height="52" viewBox="0 0 52 52">
                  <circle cx="26" cy="26" r="20" fill="none" stroke="var(--mc-surface-3)" strokeWidth="5" />
                  <circle cx="26" cy="26" r="20" fill="none" stroke={saludPct > 80 ? "#16a34a" : "#dc2626"} strokeWidth="5" strokeDasharray={`${(saludPct / 100) * 125.7} ${125.7}`} strokeLinecap="round" transform="rotate(-90 26 26)" />
                  <text x="26" y="30" textAnchor="middle" fontSize="11" fontWeight="800" fill={saludPct > 80 ? "#16a34a" : "#dc2626"}>{saludPct}%</text>
                </svg>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: saludPct > 80 ? "#16a34a" : "#dc2626" }}>{tratActivos.length === 0 ? "Sanidad OK" : "En tratamiento"}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>{tratActivos.length === 0 ? "Sin alertas activas" : tratActivos.map((t) => t.diagnostico).join(", ")}</div>
                </div>
              </div>
              {proximaVacuna && (
                <div style={{ padding: "8px 10px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0", fontSize: 11 }}>
                  <div style={{ fontWeight: 700, color: "#16a34a", display: "flex", alignItems: "center", gap: 4 }}><Icon name="syringe" size={11} /> Próx. dosis:</div>
                  <div style={{ color: "#64748b", marginTop: 1 }}>{fmtFecha(proximaVacuna)}</div>
                </div>
              )}
            </div>

            {/* Genética */}
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "#faf5ff", border: "1.5px solid #e9d5ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed" }}><Icon name="microscope" size={12} /></div>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.07em" }}>Genética</span>
              </div>
              {meritoGenetico !== null ? (
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 8 }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 16 16">
                      <defs>
                        <linearGradient id={`sg${i}`} x1="0" x2="1" y1="0" y2="0">
                          <stop offset={`${Math.min(1, Math.max(0, meritoGenetico - i)) * 100}%`} stopColor="#f59e0b" />
                          <stop offset={`${Math.min(1, Math.max(0, meritoGenetico - i)) * 100}%`} stopColor="#d1d5db" />
                        </linearGradient>
                      </defs>
                      <polygon points="8,1 10,6 15,6 11,9.5 12.5,15 8,12 3.5,15 5,9.5 1,6 6,6" fill={`url(#sg${i})`} />
                    </svg>
                  ))}
                  <span style={{ fontSize: 11, color: "#64748b", marginLeft: 4, fontWeight: 700 }}>{meritoGenetico}/5</span>
                </div>
              ) : (
                <div style={{ fontSize: 11, color: "var(--mc-text-3)", marginBottom: 8 }}>Sin registro genético cargado.</div>
              )}
              {([
                gen?.gananciaEsperada ? { label: "Ganancia esp.", val: `+${gen.gananciaEsperada} kg/d`, bar: Math.min(100, gen.gananciaEsperada * 60), color: "#2563eb" } : null,
                gen?.produccionLecheEsperada ? { label: "Prod. leche esp.", val: `${gen.produccionLecheEsperada} L/d`, bar: Math.min(100, gen.produccionLecheEsperada * 3), color: "#d97706" } : null,
                gen?.facilidadParto ? { label: "Facilidad Parto", val: gen.facilidadParto, bar: gen.facilidadParto === "Fácil" ? 92 : gen.facilidadParto === "Normal" ? 70 : 40, color: "#16a34a" } : null,
              ].filter(Boolean) as { label: string; val: string; bar: number; color: string }[]).map((g) => (
                <div key={g.label} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: "#64748b" }}>{g.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: g.color }}>{g.val}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 4, background: "#e2e8f0", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${g.bar}%`, background: `linear-gradient(90deg,${g.color}88,${g.color})`, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
              <a href="/genetica" style={{ marginTop: 8, fontSize: 10, color: "#7c3aed", fontWeight: 700, textDecoration: "none", display: "inline-block" }}>
                Ver informe genético completo →
              </a>
            </div>
          </div>
        </div>

        {/* Cambiar animal / registrar evento */}
        <div className="row gap-8">
          <button className="mc-btn mc-btn--secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => onSeleccionar(null)}><Icon name="search" size={14} />Buscar Otro</button>
          <button className="mc-btn mc-btn--primary" style={{ flex: 1, justifyContent: "center" }} onClick={onRegistrarEvento}><Icon name="plus" size={14} />Registrar Evento</button>
        </div>
      </div>
    </div>
  );
}
