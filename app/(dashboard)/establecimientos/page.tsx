"use client";

import { useEffect, useState } from "react";
import { Icon, KPI, PageHeader, Modal, Field, useToast } from "@/components/mc";
import { useLoteScope } from "@/components/LoteScope";

type Est = { id: string; nombre: string; ciudad?: string | null; provincia?: string | null; hectareasTotales?: number | null; lotesCount?: number };
type Lote = { id: string; nombre: string; hectareas: number; cultivo?: string | null; establecimientoId?: string | null };

export default function EstablecimientosPage() {
  const toast = useToast();
  const { recargar } = useLoteScope();
  const [ests, setEsts] = useState<Est[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", ciudad: "", provincia: "", hectareasTotales: "" });
  const [guardando, setGuardando] = useState(false);

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
      setForm({ nombre: "", ciudad: "", provincia: "", hectareasTotales: "" });
      cargar(); recargar();
    } catch { toast.show("No se pudo crear", "err"); } finally { setGuardando(false); }
  };

  const asignar = async (loteId: string, establecimientoId: string) => {
    setLotes((prev) => prev.map((l) => (l.id === loteId ? { ...l, establecimientoId: establecimientoId || null } : l)));
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
                        <div className="text-xs text-muted">{[e.ciudad, e.provincia].filter(Boolean).join(", ") || "Sin ubicación"}</div>
                      </div>
                    </div>
                    <span className="mc-badge mc-badge--neutral"><span className="mc-badge__dot" />{e.lotesCount ?? 0} lotes</span>
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
        <Field label="Nombre *">
          <input className="mc-input" placeholder="Ej: Establecimiento Don Ramón" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </Field>
        <div className="grid g-cols-2 gap-12">
          <Field label="Ciudad"><input className="mc-input" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} /></Field>
          <Field label="Provincia / Depto."><input className="mc-input" value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })} /></Field>
        </div>
        <Field label="Hectáreas totales">
          <input className="mc-input" type="number" value={form.hectareasTotales} onChange={(e) => setForm({ ...form, hectareasTotales: e.target.value })} />
        </Field>
      </Modal>
    </div>
  );
}
