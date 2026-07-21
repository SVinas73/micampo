"use client";

// Modales de Genética: nuevo reproductor (toro del rodeo o externo, con DEPs)
// y detalle de reproductor con genealogía y crías vinculadas. APIs reales.

import React, { useMemo, useState } from "react";
import { Icon } from "@/components/mc";
import { SecNum } from "./animales-modales";
import { AnimalRow } from "./tipos";
import { ReproductorAPI, depLeche, depPeso, fmtDep } from "./genetica-tipos";

const RAZAS = ["Angus", "Angus Negro", "Angus Rojo", "Hereford", "Brangus", "Braford", "Cruza Zebu"];

const nfMoney = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

export function ModalNuevoReproductor({ torosSinRegistro, onClose, onGuardado }: { torosSinRegistro: AnimalRow[]; onClose: () => void; onGuardado?: () => void }) {
  const [origen, setOrigen] = useState<"rodeo" | "externa">("rodeo");
  const [busqueda, setBusqueda] = useState("");
  const [rodeoSel, setRodeoSel] = useState<AnimalRow | null>(null);
  const [nombre, setNombre] = useState("");
  const [raza, setRaza] = useState("");
  const [depLecheIn, setDepLecheIn] = useState("");
  const [depPesoIn, setDepPesoIn] = useState("");
  const [registro, setRegistro] = useState("");
  const [guardando, setGuardando] = useState(false);

  const q = busqueda.trim().toLowerCase();
  const resultados = useMemo(() => (q === "" ? torosSinRegistro : torosSinRegistro.filter((t) => t.id.toLowerCase().includes(q) || (t.nombre || "").toLowerCase().includes(q))), [torosSinRegistro, q]);

  const num = (s: string) => parseFloat(String(s).replace(/[^\d.-]/g, ""));
  const valido = (origen === "rodeo" ? !!rodeoSel : nombre.trim() && raza.trim()) && depLecheIn.trim() && depPesoIn.trim();

  const guardar = async () => {
    if (!valido) return;
    setGuardando(true);
    try {
      let animalId = rodeoSel?.dbId;
      // Externa: crear el animal toro primero
      if (origen === "externa") {
        const ra = await fetch("/api/animales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: nombre.trim(), categoria: "Toro", sexo: "Macho", raza: raza.trim(), origen: "Compra" }),
        });
        if (!ra.ok) throw new Error();
        const nuevo = await ra.json();
        animalId = nuevo.id;
      }
      if (!animalId) throw new Error();
      const dl = num(depLecheIn);
      const dp = num(depPesoIn);
      const rg = await fetch("/api/registro-genetico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalId,
          produccionLecheEsperada: isNaN(dl) ? null : dl,
          gananciaEsperada: isNaN(dp) ? null : dp / 205,
          registroGenealogia: registro || null,
        }),
      });
      if (!rg.ok) throw new Error();
      onGuardado?.();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(580px,95vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="mc-modal__title" style={{ fontSize: 20 }}>Nuevo Reproductor</div>
              <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 2 }}>Sumá un toro al catálogo genético</div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <SecNum n={1} title="¿De dónde viene?" />
            <div className="row gap-10">
              {([{ id: "rodeo", label: "Toro de mi rodeo", icon: "cow" }, { id: "externa", label: "Semen / dosis externa", icon: "flask" }] as const).map((o) => {
                const sel = origen === o.id;
                return (
                  <div key={o.id} onClick={() => { setOrigen(o.id); setRodeoSel(null); setNombre(""); setRaza(""); }} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 12px", borderRadius: 12, cursor: "pointer", border: sel ? "2px solid var(--mc-green-500)" : "1px solid var(--mc-line)", background: sel ? "var(--mc-green-50)" : "var(--mc-surface)" }}>
                    <Icon name={o.icon} size={20} style={{ color: sel ? "var(--mc-green-700)" : "var(--mc-text-2)" }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--mc-ink)", textAlign: "center" }}>{o.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {origen === "rodeo" ? (
            <div>
              <SecNum n={2} title="Buscar en el rodeo" />
              <div className="row" style={{ background: "var(--mc-surface-2)", border: "1px solid var(--mc-line-2)", borderRadius: 10, padding: "8px 12px", marginBottom: 8 }}>
                <Icon name="search" size={14} style={{ color: "var(--mc-text-3)" }} />
                <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar toro por caravana o nombre…" style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: 13, fontFamily: "inherit" }} />
              </div>
              <div className="col gap-6" style={{ maxHeight: 160, overflowY: "auto" }}>
                {resultados.length === 0 && <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>No hay toros sin registro genético. Podés cargar uno externo.</div>}
                {resultados.map((t) => {
                  const sel = rodeoSel?.dbId === t.dbId;
                  return (
                    <div key={t.dbId} onClick={() => { setRodeoSel(t); setNombre(t.nombre || ""); setRaza(t.raza || ""); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, cursor: "pointer", border: sel ? "2px solid var(--mc-green-500)" : "1px solid var(--mc-line)", background: sel ? "var(--mc-green-50)" : "var(--mc-surface)" }}>
                      <div style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: "var(--mc-ink)" }}>{t.nombre || t.id} <span style={{ color: "var(--mc-text-3)", fontWeight: 500 }}>· {t.id} · {t.raza}</span></div>
                      {sel && <Icon name="check" size={14} style={{ color: "var(--mc-green-600)" }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <SecNum n={2} title="Datos del toro externo" />
              <div className="col gap-10">
                <div className="mc-field"><label className="mc-label">Nombre*</label><input className="mc-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Genex 445" /></div>
                <div className="mc-field"><label className="mc-label">Raza*</label>
                  <select className="mc-select" value={raza} onChange={(e) => setRaza(e.target.value)}><option value="">Seleccionar…</option>{RAZAS.map((r) => <option key={r}>{r}</option>)}</select>
                </div>
              </div>
            </div>
          )}

          <div>
            <SecNum n={3} title="Datos genéticos" />
            <div className="col gap-10">
              <div className="grid g-cols-2">
                <div className="mc-field">
                  <label className="mc-label row gap-6" style={{ alignItems: "center" }}>DEP Leche* <span title="Diferencia Esperada de la Progenie — dato del proveedor/asociación de raza." style={{ cursor: "help", display: "inline-flex" }}><Icon name="info" size={12} style={{ color: "var(--mc-text-3)" }} /></span></label>
                  <input className="mc-input" value={depLecheIn} onChange={(e) => setDepLecheIn(e.target.value)} placeholder="+15.0" />
                </div>
                <div className="mc-field">
                  <label className="mc-label row gap-6" style={{ alignItems: "center" }}>DEP Peso Destete* <span title="Diferencia Esperada de la Progenie (kg)." style={{ cursor: "help", display: "inline-flex" }}><Icon name="info" size={12} style={{ color: "var(--mc-text-3)" }} /></span></label>
                  <input className="mc-input" value={depPesoIn} onChange={(e) => setDepPesoIn(e.target.value)} placeholder="+22" />
                </div>
              </div>
              <div className="mc-field"><label className="mc-label">Registro genealógico (opcional)</label><input className="mc-input" value={registro} onChange={(e) => setRegistro(e.target.value)} placeholder="N° de registro oficial" /></div>
            </div>
          </div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} className="mc-btn mc-btn--ghost" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
          <button onClick={guardar} className="mc-btn mc-btn--primary" style={{ flex: 2, justifyContent: "center" }} disabled={!valido || guardando}><Icon name="check" size={14} /> Guardar Reproductor</button>
        </div>
      </div>
    </div>
  );
}

export function ModalDetalleReproductor({ toro, crias, onClose }: { toro: ReproductorAPI; crias: AnimalRow[]; onClose: () => void }) {
  const destacadas = [...crias].filter((c) => c.pesoNum != null).sort((a, b) => (b.pesoNum || 0) - (a.pesoNum || 0)).slice(0, 3);
  const dl = depLeche(toro), dp = depPeso(toro);
  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(740px,96vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--mc-green-600)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>{toro.id} · {toro.raza || "—"}</div>
              <div className="mc-modal__title" style={{ fontSize: 21 }}>{toro.nombre || toro.id}</div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
        </div>
        <div className="mc-modal__body" style={{ overflowY: "auto", overflowX: "hidden", display: "grid", gridTemplateColumns: "minmax(0,40%) minmax(0,60%)", gap: 18, alignItems: "start" }}>
          <div className="col gap-14">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "DEP Leche", value: fmtDep(dl), color: "var(--mc-green-700)" },
                { label: "DEP Peso", value: dp != null ? `${fmtDep(dp)} kg` : "—", color: "var(--mc-green-700)" },
                { label: "Crías vinculadas", value: String(toro.crias), color: "var(--mc-ink)" },
                { label: "% de uso", value: `${toro.uso}%`, color: "var(--mc-ink)" },
              ].map((s) => (
                <div key={s.label} style={{ padding: "8px 10px", background: "var(--mc-surface-2)", borderRadius: 8, border: "1px solid var(--mc-line)" }}>
                  <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600, marginBottom: 2, textTransform: "uppercase", letterSpacing: ".04em" }}>{s.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="mc-card__head" style={{ padding: "14px 16px 10px", marginBottom: 0 }}>
                <div><div className="mc-card__title">Descendencia destacada</div><div className="text-xs text-muted mt-2">Crías con mayor peso registrado</div></div>
              </div>
              <div style={{ padding: "16px 14px 18px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#0a5a24,#16a34a)", display: "grid", placeItems: "center", fontSize: 22, boxShadow: "0 2px 8px rgba(22,163,74,0.3)", border: "3px solid var(--mc-surface)" }}><Icon name="beef" size={16} /></div>
                  <div style={{ marginTop: 5, textAlign: "center" }}><div style={{ fontSize: 12, fontWeight: 800, color: "var(--mc-ink)" }}>{toro.id}</div><div style={{ fontSize: 10, color: "#64748b" }}>{toro.raza || "—"}</div></div>
                </div>
                {destacadas.length > 0 ? (
                  <>
                    <div style={{ width: 2, height: 14, background: "#cbd5e1", margin: "6px 0" }} />
                    <div style={{ display: "flex", gap: 10, width: "100%", justifyContent: "center" }}>
                      {destacadas.map((c) => (
                        <div key={c.dbId} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, maxWidth: 90 }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--mc-green-50)", display: "grid", placeItems: "center", fontSize: 16, border: "2.5px solid #86efac" }}><Icon name="cow" size={16} /></div>
                          <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, fontWeight: 700, color: "var(--mc-ink)" }}>{c.id}</div><div style={{ fontSize: 9, color: "#64748b" }}>{c.peso !== "N/A" ? `${c.peso} kg` : "—"}</div></div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 10 }}>Sin crías con peso registrado.</div>
                )}
              </div>
            </div>
          </div>
          <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="mc-card__head" style={{ padding: "14px 16px 10px", marginBottom: 0 }}>
              <div><div className="mc-card__title">Crías vinculadas</div><div className="text-xs text-muted mt-2">{crias.length} cría(s) registradas con este padre</div></div>
            </div>
            {crias.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: "var(--mc-text-3)" }}>Sin crías vinculadas. Registrá el padre en las fichas de los terneros.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="mc-table">
                  <thead><tr><th>Cría</th><th>Categoría</th><th>Nacimiento</th><th className="mc-cell--num">Peso Actual</th></tr></thead>
                  <tbody>
                    {crias.slice(0, 30).map((c) => (
                      <tr key={c.dbId}>
                        <td className="mc-cell--mono">{c.id}</td>
                        <td>{c.categoria}</td>
                        <td className="mc-cell--mono">{c.fechaNacimiento ? new Date(c.fechaNacimiento).toLocaleDateString("es-AR") : "—"}</td>
                        <td className="mc-cell--num">{c.peso !== "N/A" ? `${c.peso} kg` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="mc-modal__foot">
          <button onClick={onClose} className="mc-btn mc-btn--ghost">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

/* ============ NUEVO ANÁLISIS DE ROI ============ */

export function ModalNuevoROI({ toros, onClose, onGuardado }: { toros: ReproductorAPI[]; onClose: () => void; onGuardado?: () => void }) {
  const anioAct = new Date().getFullYear();
  const [reproductorId, setReproductorId] = useState("");
  const [periodo, setPeriodo] = useState(`Temporada ${anioAct}`);
  const [fechaInicio, setFechaInicio] = useState(`${anioAct}-01-01`);
  const [fechaFin, setFechaFin] = useState(`${anioAct}-12-31`);
  const [costoAdquisicion, setCostoAdquisicion] = useState("");
  const [costoMantenimiento, setCostoMantenimiento] = useState("");
  const [costoServicios, setCostoServicios] = useState("");
  const [numeroDescendientes, setNumeroDescendientes] = useState("");
  const [numeroVendidos, setNumeroVendidos] = useState("");
  const [ingresoVentas, setIngresoVentas] = useState("");
  const [valorAgregado, setValorAgregado] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);

  const n = (s: string) => { const v = parseFloat(String(s).replace(/[^\d.-]/g, "")); return isNaN(v) ? 0 : v; };
  const inversionTotal = n(costoAdquisicion) + n(costoMantenimiento) + n(costoServicios);
  const ingresoTotal = n(ingresoVentas) + n(valorAgregado);
  const retorno = ingresoTotal - inversionTotal;
  const valido = !!reproductorId && !!periodo.trim() && !!fechaInicio && !!fechaFin;

  const guardar = async () => {
    if (!valido) return;
    setGuardando(true);
    try {
      const r = await fetch("/api/analisis-roi-genetico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reproductorId,
          periodo: periodo.trim(),
          fechaInicio,
          fechaFin,
          costoAdquisicion: costoAdquisicion.trim() ? n(costoAdquisicion) : null,
          costoMantenimiento: n(costoMantenimiento),
          costoServicios: n(costoServicios),
          numeroDescendientes: parseInt(numeroDescendientes || "0") || 0,
          numeroVendidos: parseInt(numeroVendidos || "0") || 0,
          ingresoVentas: n(ingresoVentas),
          valorAgregadoGenética: valorAgregado.trim() ? n(valorAgregado) : null,
          observaciones: observaciones.trim() || null,
        }),
      });
      if (!r.ok) throw new Error();
      onGuardado?.();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(600px,96vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "92vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--mc-green-600)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Genética · ROI</div>
              <div className="mc-modal__title" style={{ fontSize: 20 }}>Nuevo Análisis de ROI</div>
              <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 2 }}>Registrá inversiones e ingresos de un reproductor para calcular su retorno.</div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <SecNum n={1} title="Reproductor y período" />
            <div className="col gap-10">
              <div className="mc-field">
                <label className="mc-label">Reproductor*</label>
                <select className="mc-select" value={reproductorId} onChange={(e) => { const id = e.target.value; setReproductorId(id); const t = toros.find((x) => x.id === id); if (t && !numeroDescendientes) setNumeroDescendientes(String(t.crias)); }}>
                  <option value="">Seleccionar toro…</option>
                  {toros.map((t) => <option key={t.id} value={t.id}>{t.nombre || t.id} · {t.raza || "—"} ({t.crias} crías)</option>)}
                </select>
                {toros.length === 0 && <div style={{ fontSize: 11, color: "var(--mc-text-3)", marginTop: 4 }}>No hay reproductores en el catálogo. Agregá uno desde el Resumen.</div>}
              </div>
              <div className="mc-field"><label className="mc-label">Período*</label><input className="mc-input" value={periodo} onChange={(e) => setPeriodo(e.target.value)} placeholder="Ej: Temporada 2024" /></div>
              <div className="grid g-cols-2">
                <div className="mc-field"><label className="mc-label">Desde*</label><input type="date" className="mc-input" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} /></div>
                <div className="mc-field"><label className="mc-label">Hasta*</label><input type="date" className="mc-input" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} /></div>
              </div>
            </div>
          </div>

          <div>
            <SecNum n={2} title="Inversión (USD)" />
            <div className="grid g-cols-3" style={{ gap: 10 }}>
              <div className="mc-field"><label className="mc-label">Adquisición</label><input type="number" className="mc-input" value={costoAdquisicion} onChange={(e) => setCostoAdquisicion(e.target.value)} placeholder="0" /></div>
              <div className="mc-field"><label className="mc-label">Mantenimiento</label><input type="number" className="mc-input" value={costoMantenimiento} onChange={(e) => setCostoMantenimiento(e.target.value)} placeholder="0" /></div>
              <div className="mc-field"><label className="mc-label">Servicios/IA</label><input type="number" className="mc-input" value={costoServicios} onChange={(e) => setCostoServicios(e.target.value)} placeholder="0" /></div>
            </div>
          </div>

          <div>
            <SecNum n={3} title="Descendencia e ingresos" />
            <div className="grid g-cols-2" style={{ gap: 10 }}>
              <div className="mc-field"><label className="mc-label">N° descendientes</label><input type="number" className="mc-input" value={numeroDescendientes} onChange={(e) => setNumeroDescendientes(e.target.value)} placeholder="0" /></div>
              <div className="mc-field"><label className="mc-label">N° vendidos</label><input type="number" className="mc-input" value={numeroVendidos} onChange={(e) => setNumeroVendidos(e.target.value)} placeholder="0" /></div>
              <div className="mc-field"><label className="mc-label">Ingreso por ventas (USD)</label><input type="number" className="mc-input" value={ingresoVentas} onChange={(e) => setIngresoVentas(e.target.value)} placeholder="0" /></div>
              <div className="mc-field"><label className="mc-label">Valor agregado genético (USD)</label><input type="number" className="mc-input" value={valorAgregado} onChange={(e) => setValorAgregado(e.target.value)} placeholder="0" /></div>
            </div>
            <div className="mc-field" style={{ marginTop: 10 }}><label className="mc-label">Observaciones (opcional)</label><input className="mc-input" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Notas del análisis…" /></div>
          </div>

          {/* Preview */}
          <div style={{ background: "var(--mc-surface-2)", border: "1px solid var(--mc-line)", borderRadius: 12, padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { lbl: "Inversión", val: `$${nfMoney.format(Math.round(inversionTotal))}`, clr: "var(--mc-ink)" },
              { lbl: "Ingreso", val: `$${nfMoney.format(Math.round(ingresoTotal))}`, clr: "var(--mc-ink)" },
              { lbl: "Retorno", val: `${retorno >= 0 ? "+" : "-"}$${nfMoney.format(Math.abs(Math.round(retorno)))}`, clr: retorno >= 0 ? "var(--mc-green-700)" : "var(--mc-red)" },
            ].map((s) => (
              <div key={s.lbl} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9.5, color: "var(--mc-text-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>{s.lbl}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: s.clr }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} className="mc-btn mc-btn--ghost" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
          <button onClick={guardar} className="mc-btn mc-btn--primary" style={{ flex: 2, justifyContent: "center" }} disabled={!valido || guardando}><Icon name="check" size={14} /> {guardando ? "Guardando…" : "Guardar Análisis"}</button>
        </div>
      </div>
    </div>
  );
}
