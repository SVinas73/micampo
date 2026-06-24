"use client";

import { useEffect, useState } from "react";
import { Icon, KPI, PageHeader, Modal, Field, useToast } from "@/components/mc";
import { useLoteScope } from "@/components/LoteScope";

type Est = { id: string; nombre: string; direccion?: string | null; ciudad?: string | null; provincia?: string | null; pais?: string | null; cuit?: string | null; hectareasTotales?: number | null; lotesCount?: number };
type Lote = { id: string; nombre: string; hectareas: number; cultivo?: string | null; establecimientoId?: string | null };

export default function EstablecimientosPage() {
  const toast = useToast();
  const { recargar } = useLoteScope();
  const [ests, setEsts] = useState<Est[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", direccion: "", ciudad: "", provincia: "", pais: "Uruguay", cuit: "", hectareasTotales: "" });
  const [guardando, setGuardando] = useState(false);
  const [aEliminar, setAEliminar] = useState<Est | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<{ display_name: string; lat: string; lon: string; address?: Record<string, string> }[]>([]);
  const [buscando, setBuscando] = useState(false);

  // Búsqueda de lugar (geocodificación) que autocompleta dirección/ciudad/provincia/país.
  useEffect(() => {
    if (busqueda.trim().length < 3) { setResultados([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setBuscando(true);
      fetch(`/api/geo/search?q=${encodeURIComponent(busqueda)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { resultados: [] }))
        .then((d) => setResultados(Array.isArray(d.resultados) ? d.resultados : []))
        .catch(() => {})
        .finally(() => setBuscando(false));
    }, 450);
    return () => { ctrl.abort(); clearTimeout(t); };
  }, [busqueda]);

  const elegirLugar = (r: { display_name: string; address?: Record<string, string> }) => {
    const a = r.address || {};
    setForm((f) => ({
      ...f,
      direccion: [a.road, a.house_number].filter(Boolean).join(" ") || f.direccion,
      ciudad: a.city || a.town || a.village || a.hamlet || a.county || f.ciudad,
      provincia: a.state || a.region || f.provincia,
      pais: a.country || f.pais,
    }));
    setBusqueda("");
    setResultados([]);
  };

  const cargar = () => {
    setCargando(true);
    Promise.all([
      fetch("/api/establecimientos").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/lotes").then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]).then(([e, l]) => {
      setEsts(Array.isArray(e) ? e : []);
      setLotes(Array.isArray(l) ? l : []);
    }).finally(() => setCargando(false));
  };
  useEffect(() => { cargar(); }, []);

  const crear = async () => {
    if (!form.nombre.trim()) { toast.show("Poné un nombre", "err"); return; }
    setGuardando(true);
    try {
      const res = await fetch("/api/establecimientos", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.show("Establecimiento creado");
      setModalOpen(false);
      setForm({ nombre: "", direccion: "", ciudad: "", provincia: "", pais: "Uruguay", cuit: "", hectareasTotales: "" });
      cargar(); recargar();
    } catch { toast.show("No se pudo crear", "err"); } finally { setGuardando(false); }
  };

  const asignar = async (loteId: string, establecimientoId: string) => {    setLotes((prev) => prev.map((l) => (l.id === loteId ? { ...l, establecimientoId: establecimientoId || null } : l)));
    try {
      const res = await fetch(`/api/lotes/${loteId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ establecimientoId: establecimientoId || null }),
      });
      if (!res.ok) throw new Error();
      toast.show("Lote reasignado");
      // refrescar conteos y scope
      fetch("/api/establecimientos").then((r) => (r.ok ? r.json() : [])).then((e) => setEsts(Array.isArray(e) ? e : []));
      recargar();
    } catch { toast.show("No se pudo reasignar", "err"); cargar(); }
  };

  const eliminar = async () => {
    if (!aEliminar) return;
    setBorrando(true);
    try {
      const res = await fetch(`/api/establecimientos/${aEliminar.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      const d = await res.json().catch(() => ({}));
      toast.show(d.lotesLiberados ? `Establecimiento eliminado · ${d.lotesLiberados} lote(s) quedaron sin asignar` : "Establecimiento eliminado");
      setAEliminar(null);
      cargar(); recargar();
    } catch { toast.show("No se pudo eliminar", "err"); } finally { setBorrando(false); }
  };

  const totalHa = lotes.reduce((s, l) => s + (l.hectareas || 0), 0);
  const sinAsignar = lotes.filter((l) => !l.establecimientoId).length;

  return (
    <div className="col gap-20">
      <PageHeader
        crumbs={["MiCampo", "Establecimientos"]}
        title="Establecimientos y lotes"
        subtitle="Organizá tus lotes por establecimiento. El selector global del menú filtra todo el sistema por lo que elijas acá."
        actions={<button className="mc-btn mc-btn--primary" onClick={() => setModalOpen(true)}><Icon name="plus" size={14} />Nuevo establecimiento</button>}
      />

      <div className="grid g-cols-3">
        <KPI label="Establecimientos" value={String(ests.length)} delta={`${lotes.length} lotes`} trend="up" icon="building" accent />
        <KPI label="Superficie total" value={`${Math.round(totalHa).toLocaleString("es-AR")} ha`} delta="Todos los lotes" trend="up" icon="map" />
        <KPI label="Lotes sin asignar" value={String(sinAsignar)} delta={sinAsignar > 0 ? "Asignalos abajo" : "Todo organizado"} trend={sinAsignar > 0 ? "warn" : "up"} icon="alert" warn={sinAsignar > 0} />
      </div>

      {cargando ? (
        <div className="mc-card"><div className="text-sm text-muted">Cargando…</div></div>
      ) : (
        <>
          {ests.length > 0 && (
            <div className="grid g-cols-3">
              {ests.map((e) => (
                <div key={e.id} className="mc-card">
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div className="row gap-8" style={{ alignItems: "center" }}>
                      <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--mc-green-100)", color: "var(--mc-green-700)", display: "grid", placeItems: "center" }}><Icon name="building" size={17} /></span>
                      <div>
                        <div className="font-semi" style={{ color: "var(--mc-ink)" }}>{e.nombre}</div>
                        <div className="text-xs text-muted">{[e.ciudad, e.provincia, e.pais].filter(Boolean).join(", ") || "Sin ubicación"}</div>
                        {e.cuit && <div className="text-xs text-muted">CUIT/RUT: {e.cuit}</div>}
                      </div>
                    </div>
                    <div className="row gap-6" style={{ alignItems: "center" }}>
                      <span className="mc-badge mc-badge--neutral"><span className="mc-badge__dot" />{e.lotesCount ?? 0} lotes</span>
                      <button className="mc-icon-btn" aria-label={`Eliminar ${e.nombre}`} title="Eliminar establecimiento" onClick={() => setAEliminar(e)} style={{ color: "var(--mc-red)" }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="mc-card__head" style={{ padding: "16px 20px 12px" }}>
              <div className="mc-card__title">Asignación de lotes</div>
            </div>
            {lotes.length === 0 ? (
              <div className="mc-empty" style={{ padding: 32 }}>
                <div className="mc-empty__icon"><Icon name="map" size={20} /></div>
                <div className="mc-empty__text">Todavía no tenés lotes. Crealos en Campo Digital.</div>
              </div>
            ) : (
              <table className="mc-table">
                <thead><tr><th>Lote</th><th>Cultivo</th><th className="mc-cell--num">Hectáreas</th><th>Establecimiento</th></tr></thead>
                <tbody>
                  {lotes.map((l) => (
                    <tr key={l.id}>
                      <td className="mc-cell--emph">{l.nombre}</td>
                      <td>{l.cultivo || "—"}</td>
                      <td className="mc-cell--num">{Math.round(l.hectareas || 0)}</td>
                      <td>
                        <select
                          className="mc-select"
                          style={{ padding: "5px 8px", fontSize: 12.5, minWidth: 180 }}
                          value={l.establecimientoId || ""}
                          onChange={(ev) => asignar(l.id, ev.target.value)}
                        >
                          <option value="">— Sin asignar —</option>
                          {ests.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuevo establecimiento"
        subtitle="Un establecimiento agrupa varios lotes."
        footer={<>
          <button className="mc-btn mc-btn--ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
          <button className="mc-btn mc-btn--primary" onClick={crear} disabled={guardando}><Icon name="check" size={14} />Crear</button>
        </>}
      >
        <Field label="Buscar ubicación (autocompleta los datos, como en Google Maps)">
          <div style={{ position: "relative" }}>
            <input className="mc-input" placeholder="Ej: Young, Río Negro · Pergamino, Buenos Aires..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            {(buscando || resultados.length > 0) && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 5, marginTop: 4, background: "var(--mc-surface)", border: "1px solid var(--mc-line)", borderRadius: 8, boxShadow: "var(--sh-lg)", maxHeight: 200, overflowY: "auto" }}>
                {buscando && <div className="text-xs text-muted" style={{ padding: "8px 10px" }}>Buscando…</div>}
                {!buscando && resultados.map((r, i) => (
                  <button key={i} className="mc-btn mc-btn--ghost mc-btn--sm" style={{ display: "flex", width: "100%", textAlign: "left", justifyContent: "flex-start", fontSize: 12, whiteSpace: "normal", gap: 6 }} onClick={() => elegirLugar(r)}>
                    <Icon name="map" size={13} style={{ color: "var(--mc-green-700)", flexShrink: 0 }} />{r.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Field>
        <Field label="Nombre *">
          <input className="mc-input" placeholder="Ej: Establecimiento Don Ramón" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </Field>
        <Field label="Dirección">
          <input className="mc-input" placeholder="Ej: Ruta 5, Km 40" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
        </Field>
        <div className="grid g-cols-2 gap-12">
          <Field label="Ciudad"><input className="mc-input" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} /></Field>
          <Field label="Provincia / Depto."><input className="mc-input" value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })} /></Field>
        </div>
        <div className="grid g-cols-2 gap-12">
          <Field label="País">
            <select className="mc-select" value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })}>
              {["Uruguay", "Argentina", "Brasil", "Paraguay", "Chile", "Bolivia"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="CUIT / RUT"><input className="mc-input" placeholder="Identificación fiscal" value={form.cuit} onChange={(e) => setForm({ ...form, cuit: e.target.value })} /></Field>
        </div>
        <Field label="Hectáreas totales">
          <input className="mc-input" type="number" value={form.hectareasTotales} onChange={(e) => setForm({ ...form, hectareasTotales: e.target.value })} />
        </Field>
      </Modal>

      <Modal
        open={!!aEliminar}
        onClose={() => setAEliminar(null)}
        title={`Eliminar ${aEliminar?.nombre || "establecimiento"}`}
        subtitle="Se elimina el establecimiento. Sus lotes NO se borran: quedan sin asignar y los podés reasignar."
        footer={<>
          <button className="mc-btn mc-btn--ghost" onClick={() => setAEliminar(null)}>Cancelar</button>
          <button className="mc-btn" style={{ background: "var(--mc-red)", color: "#fff", border: "none" }} onClick={eliminar} disabled={borrando}>
            <Icon name="trash" size={14} />{borrando ? "Eliminando…" : "Eliminar establecimiento"}
          </button>
        </>}
      >
        <div style={{ fontSize: 13.5, color: "var(--mc-text-2)", lineHeight: 1.55 }}>
          {aEliminar?.lotesCount ? (
            <>El establecimiento <strong>{aEliminar.nombre}</strong> tiene <strong>{aEliminar.lotesCount} lote(s)</strong>. No se eliminan: pasarán a “Sin asignar”.</>
          ) : (
            <>El establecimiento <strong>{aEliminar?.nombre}</strong> no tiene lotes asignados.</>
          )}
        </div>
      </Modal>
    </div>
  );
}
