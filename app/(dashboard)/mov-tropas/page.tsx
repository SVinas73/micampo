"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon, KPI, Badge, Modal, Field, useToast, PageHeader, Tabs } from "@/components/mc";

type Mov = {
  f: string;
  t: string;
  o: string;
  d: string;
  n: number;
  dte: string;
  est: string;
  tone: string;
  r: string;
};

const DEMO_MOVS: Mov[] = [
  { f: "15/04/2026", t: "Interno", o: "Don Ramón · Potrero 2", d: "La Esperanza · Potrero 3", n: 148, dte: "12045871", est: "Completado", tone: "green", r: "J. Rodríguez" },
  { f: "10/04/2026", t: "Venta", o: "Don Ramón · Corral encierre", d: "Frigorífico Rosario", n: 42, dte: "12042988", est: "Completado", tone: "green", r: "J. Rodríguez" },
  { f: "28/03/2026", t: "Compra", o: "Remate Liniers", d: "Don Ramón · Potrero 5", n: 24, dte: "12038114", est: "Completado", tone: "green", r: "C. Martínez" },
  { f: "12/03/2026", t: "Destete", o: "La Esperanza", d: "Don Ramón", n: 180, dte: "12030520", est: "Completado", tone: "green", r: "Equipo" },
  { f: "18/04/2026", t: "Venta", o: "Don Ramón", d: "Frigorífico Local", n: 28, dte: "—", est: "Pendiente DT-e", tone: "orange", r: "J. Rodríguez" },
];

export default function MovTropasPage() {
  return (
    <Suspense>
      <MovTropasInner />
    </Suspense>
  );
}

function MovTropasInner() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [tab, setTab] = useState("Resumen");
  const [movs, setMovs] = useState<Mov[]>(DEMO_MOVS);
  const [modal, setModal] = useState(searchParams.get("modal") === "nuevo");
  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    tipo: "Interno",
    origen: "",
    destino: "",
    cabezas: "",
    responsable: "",
  });

  useEffect(() => {
    fetch("/api/movimientos-animales")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!Array.isArray(d) || d.length === 0) return;
        setMovs(
          d.map((m: { fecha: string; tipoMovimiento?: string; origenNombre?: string; destinoNombre?: string }) => ({
            f: new Date(m.fecha).toLocaleDateString("es-AR"),
            t: m.tipoMovimiento === "Venta" ? "Venta" : m.tipoMovimiento === "Ingreso" ? "Compra" : "Interno",
            o: m.origenNombre || "—",
            d: m.destinoNombre || "—",
            n: 1,
            dte: "—",
            est: "Completado",
            tone: "green",
            r: "—",
          }))
        );
      })
      .catch(() => {});
  }, []);

  const crearMovimiento = () => {
    if (!form.origen || !form.destino || !form.cabezas) {
      toast.show("Completá origen, destino y cabezas", "err");
      return;
    }
    const nuevo: Mov = {
      f: new Date(form.fecha).toLocaleDateString("es-AR"),
      t: form.tipo,
      o: form.origen,
      d: form.destino,
      n: parseInt(form.cabezas) || 0,
      dte: "—",
      est: "Pendiente DT-e",
      tone: "orange",
      r: form.responsable || "—",
    };
    // Persistencia mejor-esfuerzo: el modelo MovimientoAnimal es por animal;
    // los movimientos de tropa se registran en bloque y se documentan vía DT-e.
    fetch("/api/movimientos-animales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipoMovimiento: form.tipo === "Compra" ? "Ingreso" : form.tipo === "Venta" ? "Venta" : "Traslado",
        fecha: form.fecha,
        origenNombre: form.origen,
        destinoNombre: form.destino,
        observaciones: `Movimiento de tropa · ${form.cabezas} cabezas · Resp: ${form.responsable}`,
      }),
    }).catch(() => {});
    setMovs((prev) => [nuevo, ...prev]);
    toast.show(`Movimiento de ${form.cabezas} cabezas registrado`);
    setModal(false);
    setTab("Gestión");
  };

  const descargarDTe = async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Documento de Tránsito Electrónico (DT-e)", 14, 20);
    doc.setFontSize(10);
    doc.text(`Emitido: ${new Date().toLocaleString("es-AR")} · Establecimiento Don Ramón`, 14, 28);
    let y = 42;
    doc.setFontSize(11);
    doc.text("Movimientos del período:", 14, y);
    y += 8;
    doc.setFontSize(9);
    movs.slice(0, 15).forEach((m) => {
      doc.text(`${m.f} | ${m.t} | ${m.o} -> ${m.d} | ${m.n} cab. | DT-e ${m.dte} | ${m.r}`, 14, y);
      y += 6;
    });
    doc.save("micampo-dte.pdf");
    toast.show("DT-e descargado");
  };

  return (
    <div className="col gap-20">
      {toast.node}
      <PageHeader
        crumbs={["Ganadería", "Mov. de Tropas"]}
        title="Movimiento de Tropas"
        subtitle="Trazabilidad de traslados entre establecimientos y potreros, documentación SENASA."
        actions={
          <>
            <button className="mc-btn mc-btn--secondary" onClick={descargarDTe}>
              <Icon name="download" size={14} />DT-e
            </button>
            <button className="mc-btn mc-btn--primary" onClick={() => setModal(true)}>
              <Icon name="plus" size={14} />Nuevo movimiento
            </button>
          </>
        }
      />
      <Tabs tabs={["Resumen", "Gestión"]} active={tab} onChange={setTab} />
      {tab === "Resumen" && <MovResumen movs={movs} />}
      {tab === "Gestión" && <MovGestion movs={movs} onNuevo={() => setModal(true)} />}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Nuevo movimiento de tropa"
        subtitle="Registrá un traslado, venta, compra o destete con su documentación."
        footer={
          <>
            <button className="mc-btn mc-btn--ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="mc-btn mc-btn--primary" onClick={crearMovimiento}>
              <Icon name="check" size={14} />Registrar movimiento
            </button>
          </>
        }
      >
        <div className="grid g-cols-2 gap-12">
          <Field label="Fecha">
            <input type="date" className="mc-input" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          </Field>
          <Field label="Tipo">
            <select className="mc-select" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              {["Interno", "Venta", "Compra", "Destete"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid g-cols-2 gap-12">
          <Field label="Origen *">
            <input className="mc-input" placeholder="Ej: Don Ramón · Potrero 2" value={form.origen} onChange={(e) => setForm({ ...form, origen: e.target.value })} />
          </Field>
          <Field label="Destino *">
            <input className="mc-input" placeholder="Ej: La Esperanza · Potrero 3" value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} />
          </Field>
        </div>
        <div className="grid g-cols-2 gap-12">
          <Field label="Cabezas *">
            <input className="mc-input" placeholder="0" value={form.cabezas} onChange={(e) => setForm({ ...form, cabezas: e.target.value })} />
          </Field>
          <Field label="Responsable">
            <input className="mc-input" placeholder="Ej: J. Rodríguez" value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

/* ============ RESUMEN (Figma) ============ */
function MovResumen({ movs }: { movs: Mov[] }) {
  const [periodo, setPeriodo] = useState("Último mes");
  const totalCab = movs.reduce((s, m) => s + m.n, 0);
  const pendientes = movs.filter((m) => m.est !== "Completado").length;
  return (
    <>
      <div className="grid g-cols-4">
        <KPI label="Movs. este mes" value={String(movs.length)} delta="+3 vs mes pasado" trend="up" icon="route" accent />
        <KPI label="Cabezas movidas" value={totalCab.toLocaleString("es-AR")} delta="5 destinos" trend="up" icon="truck" />
        <KPI label="DT-e emitidos" value={String(movs.length - pendientes)} delta={`${pendientes} pendiente firma`} trend="warn" icon="edit" />
        <KPI label="Km recorridos" value="1,240" delta="Transporte propio" trend="up" icon="map" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__title">Mapa de movimientos</div>
            <div className="mc-seg">
              {["Último mes", "Trimestre", "Año"].map((p) => (
                <button key={p} className={periodo === p ? "is-on" : ""} onClick={() => setPeriodo(p)}>{p}</button>
              ))}
            </div>
          </div>
          <div className="mc-map" style={{ minHeight: 360 }}>
            <div className="mc-map__grid"></div>
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 600 360" preserveAspectRatio="none">
              <g>
                <circle cx="140" cy="120" r="22" fill="var(--mc-green-600)" stroke="white" strokeWidth="3" />
                <text x="140" y="125" textAnchor="middle" fontSize="11" fill="white" fontWeight="600">D.R.</text>
                <text x="140" y="155" textAnchor="middle" fontSize="10" fill="#0a3d1a">Don Ramón</text>

                <circle cx="430" cy="90" r="22" fill="var(--mc-orange-600)" stroke="white" strokeWidth="3" />
                <text x="430" y="95" textAnchor="middle" fontSize="11" fill="white" fontWeight="600">L.E.</text>
                <text x="430" y="125" textAnchor="middle" fontSize="10" fill="#0a3d1a">La Esperanza</text>

                <circle cx="320" cy="250" r="18" fill="var(--mc-amber)" stroke="white" strokeWidth="3" />
                <text x="320" y="254" textAnchor="middle" fontSize="10" fill="white" fontWeight="600">LF</text>
                <text x="320" y="280" textAnchor="middle" fontSize="10" fill="#0a3d1a">Liniers</text>

                <circle cx="510" cy="280" r="16" fill="var(--mc-blue)" stroke="white" strokeWidth="3" />
                <text x="510" y="284" textAnchor="middle" fontSize="10" fill="white" fontWeight="600">FR</text>
                <text x="510" y="308" textAnchor="middle" fontSize="10" fill="#0a3d1a">Frigorífico</text>
              </g>
              <defs>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L9,3 z" fill="var(--mc-orange-600)" />
                </marker>
              </defs>
              <path d="M160,120 Q280,60 410,90" stroke="var(--mc-orange-600)" strokeWidth="2.5" fill="none" strokeDasharray="5,4" markerEnd="url(#arrow)" />
              <path d="M145,140 Q200,220 305,245" stroke="var(--mc-orange-600)" strokeWidth="2.5" fill="none" strokeDasharray="5,4" markerEnd="url(#arrow)" />
              <path d="M430,110 Q490,200 508,265" stroke="var(--mc-orange-600)" strokeWidth="2.5" fill="none" strokeDasharray="5,4" markerEnd="url(#arrow)" />
            </svg>
            <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.92)", padding: "8px 10px", borderRadius: 8, fontSize: 11 }}>
              <div className="row gap-4 mb-4"><div style={{ width: 10, height: 10, background: "var(--mc-green-600)", borderRadius: "50%" }}></div>Origen</div>
              <div className="row gap-4 mb-4"><div style={{ width: 10, height: 10, background: "var(--mc-orange-600)", borderRadius: "50%" }}></div>Destino</div>
              <div className="row gap-4"><div style={{ width: 10, height: 10, background: "var(--mc-blue)", borderRadius: "50%" }}></div>Venta</div>
            </div>
          </div>
        </div>

        <div className="mc-card">
          <div className="mc-card__head"><div className="mc-card__title">Últimos movimientos</div></div>
          <div className="col gap-8">
            {movs.slice(0, 4).map((m, i) => (
              <div key={i} style={{ padding: 12, border: "1px solid var(--mc-line)", borderRadius: 10 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>
                    {m.n} animales · {m.o.split("·")[0].trim()} → {m.d.split("·")[0].trim()}
                  </div>
                  <Badge tone={m.t === "Venta" ? "blue" : m.t === "Compra" ? "orange" : m.t === "Destete" ? "amber" : "green"}>{m.t}</Badge>
                </div>
                <div className="text-xs text-muted mt-4"><Icon name="clock" size={10} /> {m.f}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ============ GESTIÓN (Figma) ============ */
function MovGestion({ movs, onNuevo }: { movs: Mov[]; onNuevo: () => void }) {
  const [filtro, setFiltro] = useState("Todos");
  const [filtroOpen, setFiltroOpen] = useState(false);
  const visibles = filtro === "Todos" ? movs : movs.filter((m) => m.t === filtro);
  return (
    <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", position: "relative" }}>
        <div className="mc-card__title">Gestión de movimientos</div>
        <div className="row gap-8">
          <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={() => setFiltroOpen(!filtroOpen)}>
            <Icon name="filter" size={13} />Filtros
          </button>
          {filtroOpen && (
            <>
              <div onClick={() => setFiltroOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
              <div style={{ position: "absolute", top: "100%", right: 20, zIndex: 51, background: "var(--mc-surface)", border: "1px solid var(--mc-line)", borderRadius: 10, boxShadow: "var(--sh-lg)", padding: 10, width: 180 }}>
                {["Todos", "Interno", "Venta", "Compra", "Destete"].map((t) => (
                  <button
                    key={t}
                    className="mc-btn mc-btn--ghost mc-btn--sm mc-btn--block"
                    style={{ justifyContent: "flex-start", background: filtro === t ? "var(--mc-green-50)" : undefined }}
                    onClick={() => { setFiltro(t); setFiltroOpen(false); }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </>
          )}
          <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={onNuevo}>
            <Icon name="plus" size={13} />Nuevo movimiento
          </button>
        </div>
      </div>
      <table className="mc-table">
        <thead>
          <tr><th>Fecha</th><th>Tipo</th><th>Origen</th><th>Destino</th><th className="mc-cell--num">Cab.</th><th>DT-e</th><th>Estado</th><th>Responsable</th></tr>
        </thead>
        <tbody>
          {visibles.map((r, i) => (
            <tr key={i}>
              <td className="mc-cell--mono">{r.f}</td>
              <td><Badge tone={r.t === "Venta" ? "blue" : r.t === "Compra" ? "orange" : "neutral"}>{r.t}</Badge></td>
              <td>{r.o}</td>
              <td>{r.d}</td>
              <td className="mc-cell--num">{r.n}</td>
              <td className="mc-cell--mono">{r.dte}</td>
              <td>
                <span className={`mc-badge mc-badge--${r.tone}`}><span className="mc-badge__dot"></span>{r.est}</span>
              </td>
              <td>{r.r}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
