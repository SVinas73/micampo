"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, KPI, PageHeader, Modal, Field, useToast } from "@/components/mc";
import { useLoteScope } from "@/components/LoteScope";
import { DIVISIONES_POR_PAIS } from "@/lib/divisiones-administrativas";

type Est = { id: string; nombre: string; direccion?: string | null; ciudad?: string | null; provincia?: string | null; pais?: string | null; cuit?: string | null; hectareasTotales?: number | null; lotesCount?: number; coordenadas?: unknown; centroLatitud?: number | null };
type Lote = { id: string; nombre: string; hectareas: number; cultivo?: string | null; establecimientoId?: string | null };

const FORM_VACIO = { nombre: "", direccion: "", ciudad: "", provincia: "", pais: "Uruguay", cuit: "" };

export default function EstablecimientosPage() {
  const toast = useToast();
  const router = useRouter();
  const { recargar, setEstablecimientoId } = useLoteScope();
  const [ests, setEsts] = useState<Est[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [aEliminar, setAEliminar] = useState<Est | null>(null);
  const [borrando, setBorrando] = useState(false);

  const abrirNuevo = () => { setEditId(null); setForm(FORM_VACIO); setModalOpen(true); };
  const abrirEditar = (e: Est) => {
    setEditId(e.id);
    setForm({ nombre: e.nombre || "", direccion: e.direccion || "", ciudad: e.ciudad || "", provincia: e.provincia || "", pais: e.pais || "Uruguay", cuit: e.cuit || "" });
    setModalOpen(true);
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

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.show("Poné un nombre", "err"); return; }
    setGuardando(true);
    try {
      const res = await fetch(editId ? `/api/establecimientos/${editId}` : "/api/establecimientos", {
        method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || `HTTP ${res.status}`);
      }
      toast.show(editId ? "Establecimiento actualizado" : "Establecimiento creado");
      setModalOpen(false);
      setEditId(null);
      setForm(FORM_VACIO);
      cargar(); recargar();
    } catch (err) {
      toast.show(`No se pudo guardar${err instanceof Error && err.message ? `: ${err.message}` : ""}`, "err");
    } finally { setGuardando(false); }
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
      toast.show(d.lotesEliminados ? `Establecimiento y ${d.lotesEliminados} lote(s) eliminados` : "Establecimiento eliminado");
      setAEliminar(null);
      cargar(); recargar();
    } catch { toast.show("No se pudo eliminar", "err"); } finally { setBorrando(false); }
  };

  const eliminarLote = async (l: Lote) => {
    if (!confirm(`¿Eliminar el lote "${l.nombre}" y todos sus datos? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/lotes/${l.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.show(`Lote "${l.nombre}" eliminado`);
      cargar(); recargar();
    } catch {
      toast.show("No se pudo eliminar el lote", "err");
    }
  };

  const totalHa = lotes.reduce((s, l) => s + (l.hectareas || 0), 0);
  const sinAsignar = lotes.filter((l) => !l.establecimientoId).length;

  return (
    <div className="col gap-20">
      <PageHeader
        crumbs={["MiCampo", "Establecimientos"]}
        title="Establecimientos y lotes"
        subtitle="Organizá tus lotes por establecimiento. El selector global del menú filtra todo el sistema por lo que elijas acá."
        actions={<button className="mc-btn mc-btn--primary" onClick={abrirNuevo}><Icon name="plus" size={14} />Nuevo establecimiento</button>}
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
              {ests.map((e) => {
                const delimitado = !!e.coordenadas;
                return (
                <div key={e.id} className="mc-card col gap-12">
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
                      <button className="mc-icon-btn" aria-label={`Editar ${e.nombre}`} title="Editar establecimiento" onClick={() => abrirEditar(e)}>
                        <Icon name="edit" size={14} />
                      </button>
                      <button className="mc-icon-btn" aria-label={`Eliminar ${e.nombre}`} title="Eliminar establecimiento" onClick={() => setAEliminar(e)} style={{ color: "var(--mc-red)" }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="col gap-8">
                    <span className={`mc-badge ${delimitado ? "mc-badge--green" : "mc-badge--neutral"}`} style={{ fontSize: 11, alignSelf: "flex-start" }}>
                      <Icon name={delimitado ? "check" : "map"} size={11} />
                      {delimitado ? `Delimitado · ${e.hectareasTotales ? Math.round(e.hectareasTotales) + " ha" : "en el mapa"}` : "Sin delimitar"}
                    </span>
                    <div className="row gap-8">
                      <button className="mc-btn mc-btn--primary mc-btn--sm flex-1" style={{ justifyContent: "center" }} onClick={() => { setEstablecimientoId(e.id); router.push("/campo-digital?tab=Lotes"); }}>
                        <Icon name="map" size={12} />Ver en el mapa
                      </button>
                      <button className="mc-btn mc-btn--secondary mc-btn--sm flex-1" style={{ justifyContent: "center" }} onClick={() => router.push(`/campo-digital?tab=Lotes&delimitar=${e.id}`)}>
                        <Icon name="pen" size={12} />{delimitado ? "Re-delimitar" : "Delimitar"}
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
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
                <thead><tr><th>Lote</th><th>Cultivo</th><th className="mc-cell--num">Hectáreas</th><th>Establecimiento</th><th></th></tr></thead>
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
                      <td>
                        <button className="mc-icon-btn" title="Eliminar lote" style={{ color: "var(--mc-red)" }} onClick={() => eliminarLote(l)}>
                          <Icon name="trash" size={14} />
                        </button>
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
        title={editId ? "Editar establecimiento" : "Nuevo establecimiento"}
        subtitle={editId ? "Corregí los datos del establecimiento. El límite en el mapa se ajusta con “Delimitar”." : "Cargá los datos. El límite en el mapa lo dibujás después con “Delimitar”."}
        footer={<>
          <button className="mc-btn mc-btn--ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
          <button className="mc-btn mc-btn--primary" onClick={guardar} disabled={guardando}><Icon name="check" size={14} />{editId ? "Guardar cambios" : "Crear"}</button>
        </>}
      >
        <Field label="Nombre *">
          <input className="mc-input" placeholder="Ej: Establecimiento Don Ramón" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </Field>
        <Field label="Dirección">
          <input className="mc-input" placeholder="Ej: Ruta 5, Km 40" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
        </Field>
        <div className="grid g-cols-2 gap-12">
          <Field label="País">
            <select className="mc-select" value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value, provincia: "" })}>
              {Object.keys(DIVISIONES_POR_PAIS).map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Provincia / Depto.">
            {DIVISIONES_POR_PAIS[form.pais] ? (
              <select className="mc-select" value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })}>
                <option value="">Elegí…</option>
                {DIVISIONES_POR_PAIS[form.pais].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            ) : (
              <input className="mc-input" value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })} />
            )}
          </Field>
        </div>
        <div className="grid g-cols-2 gap-12">
          <Field label="Ciudad / Localidad"><input className="mc-input" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} /></Field>
          <Field label="CUIT / RUT"><input className="mc-input" placeholder="Identificación fiscal" value={form.cuit} onChange={(e) => setForm({ ...form, cuit: e.target.value })} /></Field>
        </div>
        <div style={{ padding: "10px 12px", background: "var(--mc-surface-2)", borderRadius: 8, fontSize: 12.5, color: "var(--mc-text-2)", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="map" size={14} style={{ color: "var(--mc-green-700)", flexShrink: 0 }} />
          La superficie (hectáreas) se calcula sola cuando delimitás el establecimiento en el mapa.
        </div>
      </Modal>

      <Modal
        open={!!aEliminar}
        onClose={() => setAEliminar(null)}
        title={`Eliminar ${aEliminar?.nombre || "establecimiento"}`}
        subtitle="Se elimina el establecimiento y TODOS sus lotes (con sus datos asociados). Esta acción no se puede deshacer."
        footer={<>
          <button className="mc-btn mc-btn--ghost" onClick={() => setAEliminar(null)}>Cancelar</button>
          <button className="mc-btn" style={{ background: "var(--mc-red)", color: "#fff", border: "none" }} onClick={eliminar} disabled={borrando}>
            <Icon name="trash" size={14} />{borrando ? "Eliminando…" : "Eliminar establecimiento"}
          </button>
        </>}
      >
        <div style={{ fontSize: 13.5, color: "var(--mc-text-2)", lineHeight: 1.55 }}>
          {aEliminar?.lotesCount ? (
            <>El establecimiento <strong>{aEliminar.nombre}</strong> y sus <strong>{aEliminar.lotesCount} lote(s)</strong> se eliminarán por completo, junto con sus datos (siembras, cosechas, labores, etc.).</>
          ) : (
            <>El establecimiento <strong>{aEliminar?.nombre}</strong> no tiene lotes asignados.</>
          )}
        </div>
      </Modal>
    </div>
  );
}
