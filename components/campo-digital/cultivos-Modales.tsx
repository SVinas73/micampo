"use client";

import React, { useState } from "react";
import { Icon, IABadge } from "@/components/mc";

/* ============ MODAL: NUEVA SIEMBRA (Figma) ============ */
export interface SiembraData {
  loteId?: string;
  loteNombre: string;
  fecha: string;
  cultivo: string;
  variedad: string;
  densidad: string;
  inversion: string;
  responsable: string;
  destinos: string[];
  usarIA: boolean;
}

/** Catálogo agronómico ampliado (cereales, oleaginosas, forrajeras, hortícolas,
 *  frutales e industriales) para elegir cualquier cultivo desde "…". */
export const CATALOGO_CULTIVOS: { grupo: string; items: string[] }[] = [
  { grupo: "Cereales", items: ["Maíz", "Trigo", "Cebada", "Avena", "Arroz", "Sorgo", "Centeno", "Triticale", "Mijo", "Quinoa", "Amaranto"] },
  { grupo: "Oleaginosas", items: ["Soja", "Girasol", "Canola", "Lino", "Maní", "Cártamo", "Sésamo", "Chía"] },
  { grupo: "Legumbres", items: ["Arveja", "Lenteja", "Garbanzo", "Poroto negro", "Poroto alubia", "Haba", "Lupino", "Vicia"] },
  { grupo: "Forrajeras", items: ["Alfalfa", "Trébol blanco", "Trébol rojo", "Lotus", "Raigrás anual", "Raigrás perenne", "Festuca", "Dactylis", "Cebadilla", "Agropiro", "Moha", "Sudangrass", "Sorgo forrajero", "Avena forrajera", "Maíz para silo", "Achicoria forrajera", "Pasto ovillo"] },
  { grupo: "Hortícolas", items: ["Papa", "Batata", "Cebolla", "Ajo", "Zanahoria", "Tomate", "Morrón", "Zapallo", "Calabaza", "Sandía", "Melón", "Lechuga", "Espinaca", "Acelga", "Brócoli", "Coliflor", "Repollo", "Remolacha", "Pepino", "Berenjena", "Zucchini", "Chaucha", "Choclo dulce", "Frutilla", "Espárrago", "Apio", "Puerro", "Rúcula", "Kale"] },
  { grupo: "Frutales", items: ["Vid", "Olivo", "Naranja", "Mandarina", "Limón", "Pomelo", "Manzana", "Pera", "Durazno", "Ciruela", "Cereza", "Damasco", "Nectarina", "Kiwi", "Palta", "Banana", "Mango", "Ananá", "Arándano", "Frambuesa", "Mora", "Higo", "Granada", "Membrillo", "Nuez pecán", "Nogal", "Almendro", "Avellano", "Pistacho"] },
  { grupo: "Industriales", items: ["Caña de azúcar", "Algodón", "Tabaco", "Yerba mate", "Té", "Café", "Stevia", "Remolacha azucarera", "Lúpulo", "Cáñamo industrial"] },
];

const CULTIVOS = [
  { nombre: "Maíz", emoji: "wheat" },
  { nombre: "Soja", emoji: "sprout" },
  { nombre: "Trigo", emoji: "wheat" },
  { nombre: "Sorgo", emoji: "leaf" },
  { nombre: "Girasol", emoji: "sun" },
];

export function NuevaSiembraModal({
  lotes,
  onClose,
  onConfirm,
}: {
  lotes: { id?: string; nombre: string; ha: number }[];
  onClose: () => void;
  onConfirm: (data: SiembraData) => Promise<void> | void;
}) {
  const [loteIdx, setLoteIdx] = useState(0);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [cultivo, setCultivo] = useState("Maíz");
  const [variedad, setVariedad] = useState("");
  const [densidad, setDensidad] = useState("");
  const [inversion, setInversion] = useState("");
  const [responsable, setResponsable] = useState("");
  const [destinos, setDestinos] = useState<string[]>([]);
  const [usarIA, setUsarIA] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [masCultivos, setMasCultivos] = useState(false);
  const [saving, setSaving] = useState(false);
  // El cultivo elegido vino del catálogo "…" (no es uno de los íconos rápidos)
  const esCultivoDelCatalogo = !!cultivo && !CULTIVOS.some((c) => c.nombre === cultivo);

  const toggleDestino = (d: string) =>
    setDestinos((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const guardar = async () => {
    if (saving) return;
    setSaving(true);
    const l = lotes[loteIdx];
    await onConfirm({
      loteId: l?.id, loteNombre: l?.nombre || "—", fecha, cultivo, variedad, densidad, inversion, responsable, destinos, usarIA,
    });
    setSaving(false);
  };

  const inputS: React.CSSProperties = { width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid var(--mc-line-2)", fontSize: 13.5, background: "var(--mc-surface)", color: "var(--mc-ink)" };
  const blockLbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: "0.08em" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,22,36,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "var(--mc-surface)", borderRadius: 16, width: 740, maxWidth: "96vw", maxHeight: "94vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--mc-line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, color: "var(--mc-ink)" }}>Nueva Siembra</div>
          <button className="mc-icon-btn" onClick={onClose}><Icon name="x" size={15} /></button>
        </div>

        <div style={{ padding: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* BLOCK A — Ubicación y Fecha */}
          <div className="col gap-10">
            <div style={blockLbl}>Paso 1 · Ubicación y Fecha</div>
            <div className="mc-field">
              <label className="mc-label">Seleccionar Lote</label>
              <select style={inputS} value={loteIdx} onChange={(e) => setLoteIdx(Number(e.target.value))}>
                {lotes.map((l, i) => (
                  <option key={i} value={i}>{l.nombre} ({l.ha} Ha)</option>
                ))}
              </select>
            </div>
            <div className="mc-field">
              <label className="mc-label">Fecha de Siembra</label>
              <input type="date" style={inputS} value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>

            <div style={{ ...blockLbl, marginTop: 12 }}>Paso 3 · Finanzas y Recursos</div>
            <div className="mc-field">
              <label className="mc-label">Inversión Estimada ($)</label>
              <input style={inputS} placeholder="Ej. 15000" value={inversion} onChange={(e) => setInversion(e.target.value)} />
            </div>
            <div className="mc-field">
              <label className="mc-label">Responsable / equipo</label>
              <input style={inputS} placeholder="Ej. Juan Pérez · Equipo de siembra" value={responsable} onChange={(e) => setResponsable(e.target.value)} />
            </div>
          </div>

          {/* PASO 2 — Selección de Cultivo */}
          <div className="col gap-10">
            <div style={blockLbl}>Paso 2 · Selección de Cultivo</div>
            <div className="row gap-8" style={{ alignItems: "center" }}>
              {CULTIVOS.map((c) => (
                <button
                  key={c.nombre}
                  onClick={() => { setCultivo(c.nombre); setMasCultivos(false); }}
                  title={c.nombre}
                  style={{
                    width: 46, height: 46, borderRadius: "50%", fontSize: 20, cursor: "pointer", display: "grid", placeItems: "center",
                    background: cultivo === c.nombre ? "var(--mc-green-600)" : "var(--mc-green-50)",
                    border: cultivo === c.nombre ? "2px solid var(--mc-green-700)" : "1px solid var(--mc-green-200)",
                  }}
                >
                  <Icon name={c.emoji} size={20} />
                </button>
              ))}
              {/* "…" abre el catálogo completo de cultivos */}
              <button
                onClick={() => setMasCultivos((v) => !v)}
                title="Más cultivos"
                style={{
                  width: 46, height: 46, borderRadius: "50%", cursor: "pointer", display: "grid", placeItems: "center",
                  fontSize: 20, fontWeight: 800, letterSpacing: 1, color: "var(--mc-green-700)", lineHeight: 1,
                  background: masCultivos || esCultivoDelCatalogo ? "var(--mc-green-600)" : "var(--mc-green-50)",
                  border: masCultivos || esCultivoDelCatalogo ? "2px solid var(--mc-green-700)" : "1px solid var(--mc-green-200)",
                }}
              >
                <span style={{ color: masCultivos || esCultivoDelCatalogo ? "#fff" : "var(--mc-green-700)", marginTop: -6 }}>…</span>
              </button>
              {esCultivoDelCatalogo && (
                <span className="mc-badge mc-badge--green" style={{ fontSize: 11 }}>{cultivo}</span>
              )}
            </div>
            {masCultivos && (
              <div style={{ border: "1px solid var(--mc-line)", borderRadius: 12, background: "var(--mc-surface)", padding: 12, maxHeight: 260, overflowY: "auto" }} className="mc-noscrollbar col gap-10">
                <div style={{ position: "relative" }}>
                  <Icon name="search" size={13} style={{ position: "absolute", left: 10, top: 11, color: "var(--mc-text-3)" }} />
                  <input style={{ ...inputS, paddingLeft: 30 }} placeholder="Buscar en el catálogo…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} autoFocus />
                </div>
                {CATALOGO_CULTIVOS.map((g) => {
                  const items = g.items.filter((n) => !busqueda.trim() || n.toLowerCase().includes(busqueda.toLowerCase()));
                  if (items.length === 0) return null;
                  return (
                    <div key={g.grupo}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{g.grupo}</div>
                      <div className="row gap-6" style={{ flexWrap: "wrap" }}>
                        {items.map((n) => (
                          <button
                            key={n}
                            onClick={() => { setCultivo(n); setMasCultivos(false); setBusqueda(""); }}
                            className="mc-btn mc-btn--sm"
                            style={{
                              border: cultivo === n ? "1.5px solid var(--mc-green-600)" : "1px solid var(--mc-line-2)",
                              background: cultivo === n ? "var(--mc-green-50)" : "var(--mc-surface)",
                              color: cultivo === n ? "var(--mc-green-700)" : "var(--mc-text)",
                            }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ padding: 14, border: "1px solid var(--mc-line)", borderRadius: 12, background: "var(--mc-surface-2)" }} className="col gap-10">
              <div className="mc-field">
                <label className="mc-label">Variedad</label>
                <input style={inputS} placeholder="Ej. DK7210" value={variedad} onChange={(e) => setVariedad(e.target.value)} />
              </div>
              <div className="mc-field">
                <label className="mc-label">Densidad</label>
                <div className="row gap-4">
                  <input style={inputS} placeholder="Ej. 75000" value={densidad} onChange={(e) => setDensidad(e.target.value)} />
                  <span className="text-xs text-muted" style={{ whiteSpace: "nowrap" }}>Sem/Ha</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PASO 4 — Planificación */}
        <div style={{ padding: "0 22px 18px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Paso 4 · Planificación</div>
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div className="row gap-8">
              <span className="text-sm text-muted">Destino Planificado:</span>
              {["Silo", "Puerto", "Acopio"].map((d) => (
                <button
                  key={d}
                  onClick={() => toggleDestino(d)}
                  className="mc-btn mc-btn--sm"
                  style={{
                    border: destinos.includes(d) ? "1.5px solid var(--mc-green-600)" : "1px solid var(--mc-green-200)",
                    background: destinos.includes(d) ? "var(--mc-green-50)" : "transparent",
                    color: "var(--mc-green-700)",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
            <label className="row gap-8" style={{ cursor: "pointer" }}>
              <button
                onClick={() => setUsarIA(!usarIA)}
                style={{ width: 40, height: 22, borderRadius: 999, border: "none", cursor: "pointer", position: "relative", background: usarIA ? "var(--mc-green-600)" : "var(--mc-line-2)", transition: "0.15s" }}
              >
                <span style={{ position: "absolute", top: 2, left: usarIA ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "white", transition: "0.15s" }}></span>
              </button>
              <span className="text-sm" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                Usar Recomendación <IABadge /> para Insumos?
              </span>
            </label>
          </div>
        </div>

        <div style={{ padding: "14px 22px", borderTop: "1px solid var(--mc-line)", display: "flex", gap: 10, background: "var(--mc-surface-2)" }}>
          <button className="mc-btn mc-btn--secondary flex-1" onClick={onClose}>Cancelar</button>
          <button className="mc-btn mc-btn--primary flex-1" disabled={saving} onClick={guardar}>
            {saving ? "Guardando..." : "Guardar Borrador"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ MODAL: NUEVA COSECHA (Figma) ============ */
export interface CosechaData {
  loteId?: string;
  loteNombre: string;
  cultivo: string;
  rendimiento: string;
  humedad: string;
  impurezas: string;
  costoTipo: "Maquinaria Propia" | "Contratista";
  costoLabor: string;
  destinos: string[];
  remito: string;
  cerrarLote: boolean;
}

export function NuevaCosechaModal({
  cultivosListos,
  onClose,
  onConfirm,
}: {
  cultivosListos: { loteId?: string; lote: string; cultivo: string; estado: string; madurez: number; humedad: number }[];
  onClose: () => void;
  onConfirm: (data: CosechaData) => Promise<void> | void;
}) {
  const [sel, setSel] = useState(0);
  const [rendimiento, setRendimiento] = useState("");
  const [humedad, setHumedad] = useState("14");
  const [impurezas, setImpurezas] = useState("2");
  const [costoTipo, setCostoTipo] = useState<"Maquinaria Propia" | "Contratista">("Contratista");
  const [costoLabor, setCostoLabor] = useState("");
  const [destinos, setDestinos] = useState<string[]>([]);
  const [remito, setRemito] = useState("");
  const [cerrarLote, setCerrarLote] = useState(true);
  const [saving, setSaving] = useState(false);

  const pesoNeto = (() => {
    const r = parseFloat(rendimiento) || 0;
    const h = Math.max(0, (parseFloat(humedad) || 0) - 13.5) / 100;
    const i = (parseFloat(impurezas) || 0) / 100;
    return (r * (1 - h) * (1 - i)).toFixed(1);
  })();

  const guardar = async () => {
    if (saving) return;
    setSaving(true);
    const c = cultivosListos[sel];
    await onConfirm({
      loteId: c?.loteId, loteNombre: c?.lote || "—", cultivo: c?.cultivo || "—",
      rendimiento, humedad, impurezas, costoTipo, costoLabor, destinos, remito, cerrarLote,
    });
    setSaving(false);
  };

  const inputS: React.CSSProperties = { width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid var(--mc-line-2)", fontSize: 13.5, background: "var(--mc-surface)", color: "var(--mc-ink)" };
  const blockLbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,22,36,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "var(--mc-surface)", borderRadius: 16, width: 640, maxWidth: "96vw", maxHeight: "94vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--mc-line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, color: "var(--mc-ink)" }}>Nueva Cosecha</div>
          <button className="mc-icon-btn" onClick={onClose}><Icon name="x" size={15} /></button>
        </div>

        <div style={{ padding: 22 }} className="col gap-16">
          {/* BLOCK A */}
          <div>
            <div style={blockLbl}>Paso 1 · Seleccionar Cultivo</div>
            <div className="grid g-cols-2 gap-10">
              {cultivosListos.map((c, i) => {
                const isSel = sel === i;
                return (
                  <button
                    key={i}
                    onClick={() => setSel(i)}
                    style={{
                      padding: 14, borderRadius: 12, textAlign: "left", cursor: "pointer", position: "relative",
                      border: isSel ? "2px solid var(--mc-green-600)" : "1px solid var(--mc-line-2)",
                      background: isSel ? "var(--mc-green-50)" : "var(--mc-surface)",
                    }}
                  >
                    {isSel && (
                      <span style={{ position: "absolute", top: 10, right: 10, width: 20, height: 20, borderRadius: "50%", background: "var(--mc-green-600)", color: "white", display: "grid", placeItems: "center" }}>
                        <Icon name="check" size={11} />
                      </span>
                    )}
                    <div className="font-semi" style={{ color: "var(--mc-ink)" }}>{c.lote} - {c.cultivo}</div>
                    <div className="text-xs text-muted mt-4">Estado: {c.estado}</div>
                    <div className="text-xs text-muted">Madurez: {c.madurez}%</div>
                    <div className="text-xs text-muted">Humedad: {c.humedad}%</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BLOCK B */}
          <div>
            <div style={blockLbl}>Paso 2 · Rendimiento y Calidad</div>
            <div className="grid g-cols-3 gap-10">
              <div className="mc-field">
                <label className="mc-label">Rendimiento (Tn)</label>
                <input style={inputS} placeholder="Ej. 450" value={rendimiento} onChange={(e) => setRendimiento(e.target.value)} />
              </div>
              <div className="mc-field">
                <label className="mc-label">Humedad %</label>
                <input style={inputS} placeholder="Ej. 14" value={humedad} onChange={(e) => setHumedad(e.target.value)} />
              </div>
              <div className="mc-field">
                <label className="mc-label">Impurezas/Merma %</label>
                <input style={inputS} placeholder="Ej. 2" value={impurezas} onChange={(e) => setImpurezas(e.target.value)} />
              </div>
            </div>
            <div className="text-xs mt-8" style={{ color: "var(--mc-green-700)", fontWeight: 600 }}>Peso Neto Est: {pesoNeto} Tn</div>
          </div>

          {/* BLOCK C */}
          <div>
            <div style={blockLbl}>Paso 3 · Costos de Labor</div>
            <div className="row gap-10" style={{ alignItems: "flex-end" }}>
              <div className="mc-seg">
                {(["Maquinaria Propia", "Contratista"] as const).map((t) => (
                  <button key={t} className={costoTipo === t ? "is-on" : ""} style={costoTipo === t ? { background: "var(--mc-green-600)" } : undefined} onClick={() => setCostoTipo(t)}>
                    [ {t} ]
                  </button>
                ))}
              </div>
              <div className="mc-field" style={{ flex: 1 }}>
                <label className="mc-label">Costo Labor (USD/Ha)</label>
                <input style={inputS} placeholder="$ Ej. 65" value={costoLabor} onChange={(e) => setCostoLabor(e.target.value)} />
              </div>
            </div>
          </div>

          {/* BLOCK D */}
          <div>
            <div style={blockLbl}>Paso 4 · Destino & Transporte</div>
            <div className="row gap-10" style={{ flexWrap: "wrap", alignItems: "flex-end" }}>
              <div className="row gap-6">
                {["Silo", "Puerto"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDestinos((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))}
                    className="mc-btn mc-btn--sm"
                    style={{
                      border: destinos.includes(d) ? "1.5px solid var(--mc-green-600)" : "1px solid var(--mc-green-200)",
                      background: destinos.includes(d) ? "var(--mc-green-50)" : "transparent",
                      color: "var(--mc-green-700)",
                    }}
                  >
                    {d}
                  </button>
                ))}
                <button className="mc-btn mc-btn--sm" style={{ border: "1px dashed var(--mc-green-300, var(--mc-green-200))", color: "var(--mc-green-700)" }} onClick={() => setDestinos((prev) => [...prev, "Acopio"])}>
                  <Icon name="plus" size={11} /> Añadir Destino
                </button>
              </div>
              <div className="mc-field" style={{ flex: 1, minWidth: 200 }}>
                <label className="mc-label">Nro. Remito / Chofer</label>
                <input style={inputS} placeholder="Ej. 12345 / Juan Pérez" value={remito} onChange={(e) => setRemito(e.target.value)} />
              </div>
            </div>
            <label className="row gap-8 mt-12" style={{ cursor: "pointer", fontSize: 13.5 }}>
              <input type="checkbox" checked={cerrarLote} onChange={(e) => setCerrarLote(e.target.checked)} />
              <span className="font-semi" style={{ color: "var(--mc-ink)" }}>Cerrar Lote (Finalizar Ciclo)</span>
            </label>
          </div>
        </div>

        <div style={{ padding: "14px 22px", borderTop: "1px solid var(--mc-line)", display: "flex", gap: 10, background: "var(--mc-surface-2)" }}>
          <button className="mc-btn mc-btn--secondary flex-1" onClick={onClose}>Cancelar</button>
          <button className="mc-btn mc-btn--primary flex-1" disabled={saving || !rendimiento} onClick={guardar}>
            {saving ? "Registrando..." : "Registrar Cosecha"}
          </button>
        </div>
      </div>
    </div>
  );
}
