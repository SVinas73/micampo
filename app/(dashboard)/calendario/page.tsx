"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Icon, KPI, Modal, Field, useToast, PageHeader, Seg } from "@/components/mc";

/* ============ Tipos ============ */
type Categoria = "labor" | "sanidad" | "riego" | "clima";

type Evento = {
  id: string;
  cat: Categoria;
  titulo: string;
  fechaISO: string; // YYYY-MM-DD
};

type Lote = { id: string; nombre: string };

const CATS: { key: Categoria; label: string; color: string }[] = [
  { key: "labor", label: "Labores", color: "var(--mc-green-600)" },
  { key: "sanidad", label: "Sanidad", color: "var(--mc-red)" },
  { key: "riego", label: "Riego", color: "var(--mc-blue)" },
  { key: "clima", label: "Clima", color: "var(--mc-amber)" },
];

const COLOR: Record<Categoria, string> = {
  labor: "var(--mc-green-600)",
  sanidad: "var(--mc-red)",
  riego: "var(--mc-blue)",
  clima: "var(--mc-amber)",
};

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const isoOf = (raw: string) => (raw ? raw.slice(0, 10) : "");

export default function CalendarioPage() {
  const toast = useToast();
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [vista, setVista] = useState("Mes");
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [filtros, setFiltros] = useState<Record<Categoria, boolean>>({ labor: true, sanidad: true, riego: true, clima: true });
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [diaSel, setDiaSel] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  /* ---- Carga en paralelo de todas las fuentes reales ---- */
  const cargarEventos = React.useCallback(() => {
    const getJson = (url: string) =>
      fetch(url)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []);

    setCargando(true);
    Promise.all([
      getJson("/api/labores"),
      getJson("/api/eventos-sanitarios"),
      getJson("/api/eventos-riego"),
      getJson("/api/alertas-climaticas"),
    ]).then(([labores, sanidad, riego, clima]) => {
      const evs: Evento[] = [];
      if (Array.isArray(labores)) {
        labores.forEach((l: any, i: number) => {
          if (!l.fecha) return;
          evs.push({
            id: `lab-${l.id || i}`,
            cat: "labor",
            titulo: `${l.tipo || "Labor"}${l.lote?.nombre ? ` · ${l.lote.nombre}` : ""}`,
            fechaISO: isoOf(l.fecha),
          });
        });
      }
      if (Array.isArray(sanidad)) {
        sanidad.forEach((s: any, i: number) => {
          if (!s.fecha) return;
          evs.push({ id: `san-${s.id || i}`, cat: "sanidad", titulo: s.tipo || s.descripcion || "Sanidad", fechaISO: isoOf(s.fecha) });
        });
      }
      if (Array.isArray(riego)) {
        riego.forEach((r: any, i: number) => {
          const f = r.fechaProgramada || r.fechaReal;
          if (!f) return;
          evs.push({ id: `rie-${r.id || i}`, cat: "riego", titulo: "Riego programado", fechaISO: isoOf(f) });
        });
      }
      if (Array.isArray(clima)) {
        clima.forEach((c: any, i: number) => {
          if (!c.fechaInicio) return;
          evs.push({ id: `cli-${c.id || i}`, cat: "clima", titulo: c.titulo || c.tipo || "Alerta climática", fechaISO: isoOf(c.fechaInicio) });
        });
      }
      setEventos(evs);
      setCargando(false);
    });

    getJson("/api/lotes").then((d) => {
      if (Array.isArray(d) && d.length > 0) {
        setLotes(d.map((l: any) => ({ id: l.id, nombre: l.nombre })));
      } else {
        setLotes([]);
      }
    });
  }, []);

  useEffect(() => {
    cargarEventos();
  }, [cargarEventos]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const eventosFiltrados = useMemo(() => eventos.filter((e) => filtros[e.cat]), [eventos, filtros]);

  const eventosDelMes = useMemo(
    () =>
      eventosFiltrados.filter((e) => {
        const d = new Date(e.fechaISO + "T12:00:00");
        return d.getFullYear() === year && d.getMonth() === month;
      }),
    [eventosFiltrados, year, month]
  );

  const porDia = useMemo(() => {
    const map: Record<string, Evento[]> = {};
    eventosDelMes.forEach((e) => {
      (map[e.fechaISO] = map[e.fechaISO] || []).push(e);
    });
    return map;
  }, [eventosDelMes]);

  /* ---- KPIs ---- */
  const kpiLabores = eventosDelMes.filter((e) => e.cat === "labor").length;
  const kpiSanidad = eventosDelMes.filter((e) => e.cat === "sanidad").length;
  const kpiRiegos = eventosDelMes.filter((e) => e.cat === "riego").length;

  /* ---- Grilla del mes (lunes a domingo) ---- */
  const primerDia = new Date(year, month, 1);
  const offset = (primerDia.getDay() + 6) % 7; // 0 = lunes
  const diasMes = new Date(year, month + 1, 0).getDate();
  const hoy = new Date();
  const celdas: ({ day: number; iso: string } | null)[] = [];
  for (let i = 0; i < offset; i++) celdas.push(null);
  for (let d = 1; d <= diasMes; d++) celdas.push({ day: d, iso: toISO(new Date(year, month, d)) });

  const irMes = (delta: number) => setCursor(new Date(year, month + delta, 1));
  const hoyMes = () => setCursor(new Date(hoy.getFullYear(), hoy.getMonth(), 1));

  /* ---- Nueva labor desde un día ---- */
  const [laborForm, setLaborForm] = useState({ tipo: "Siembra", loteIdx: 0 });

  const crearLabor = async () => {
    if (!diaSel) return;
    const lote = lotes[laborForm.loteIdx];
    if (!lote) {
      toast.show("Necesitás un lote para agendar la labor. Creá uno en Campo Digital.", "err");
      return;
    }
    try {
      const res = await fetch("/api/labores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: laborForm.tipo, fecha: diaSel, loteId: lote.id }),
      });
      if (!res.ok) throw new Error();
      toast.show(`Labor "${laborForm.tipo}" agendada`);
      setDiaSel(null);
      cargarEventos();
    } catch {
      toast.show("No se pudo crear la labor", "err");
    }
  };

  const toggleCat = (c: Categoria) => setFiltros((prev) => ({ ...prev, [c]: !prev[c] }));

  const eventosDiaSel = diaSel ? eventos.filter((e) => e.fechaISO === diaSel) : [];

  /* ---- Próximos eventos (desde hoy, ordenados) ---- */
  const proximos = useMemo(() => {
    const hoyISO = toISO(hoy);
    return eventosFiltrados
      .filter((e) => e.fechaISO >= hoyISO)
      .sort((a, b) => a.fechaISO.localeCompare(b.fechaISO))
      .slice(0, 6);
  }, [eventosFiltrados, hoy]);

  return (
    <div className="col gap-20">
      {toast.node}
      <PageHeader
        crumbs={["MiCampo", "Calendario"]}
        title="Calendario"
        subtitle="Agenda unificada de labores, sanidad, riego y clima."
        actions={
          <button className="mc-btn mc-btn--secondary" onClick={hoyMes}>
            <Icon name="calendar" size={14} />Hoy
          </button>
        }
      />

      <div className="grid g-cols-4">
        <KPI label="Eventos del mes" value={String(eventosDelMes.length)} delta={`${MESES[month]} ${year}`} trend="up" icon="calendar" accent />
        <KPI label="Labores" value={String(kpiLabores)} delta="Agronómicas" trend="up" icon="leaf" />
        <KPI label="Sanidad" value={String(kpiSanidad)} delta="Eventos sanitarios" trend="up" icon="syringe" />
        <KPI label="Riegos" value={String(kpiRiegos)} delta="Programados" trend="up" icon="activity" />
      </div>

      {/* Leyenda + filtros */}
      <div className="row gap-8" style={{ flexWrap: "wrap", justifyContent: "space-between" }}>
        <div className="row gap-8" style={{ flexWrap: "wrap" }}>
          {CATS.map((c) => (
            <button
              key={c.key}
              onClick={() => toggleCat(c.key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, cursor: "pointer",
                border: "1px solid var(--mc-line)", fontSize: 12, fontWeight: 600,
                background: filtros[c.key] ? c.color + "18" : "var(--mc-surface-2)",
                color: filtros[c.key] ? c.color : "var(--mc-text-3)",
                opacity: filtros[c.key] ? 1 : 0.6,
              }}
            >
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: c.color }}></span>
              {c.label}
            </button>
          ))}
        </div>
        <Seg options={["Mes", "Semana"]} value={vista} onChange={setVista} />
      </div>

      {/* Calendario */}
      <div className="mc-card">
        <div className="mc-card__head">
          <div className="mc-card__title">{MESES[month]} {year}</div>
          <div className="mc-seg">
            <button onClick={() => irMes(-1)} title="Mes anterior">&lt;</button>
            <button className="is-on" onClick={hoyMes}>Hoy</button>
            <button onClick={() => irMes(1)} title="Mes siguiente">&gt;</button>
          </div>
        </div>

        {vista === "Semana" ? (
          <VistaSemana cursor={cursor} hoy={hoy} eventos={eventosFiltrados} onDia={(iso) => setDiaSel(iso)} />
        ) : (
          <>
            <div className="mc-cal-grid" style={{ marginBottom: 4 }}>
              {["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"].map((d) => (
                <div key={d} className="text-xs text-muted" style={{ textAlign: "center", padding: "6px 0", fontWeight: 600, letterSpacing: "0.06em" }}>{d}</div>
              ))}
            </div>
            <div className="mc-cal-grid">
              {celdas.map((c, i) => {
                if (!c) return <div key={i} className="mc-cal-day mc-cal-day--other" style={{ cursor: "default" }} />;
                const evs = porDia[c.iso] || [];
                const esHoy = c.iso === toISO(hoy);
                return (
                  <div
                    key={i}
                    className={`mc-cal-day${esHoy ? " mc-cal-day--today" : ""}`}
                    onClick={() => setDiaSel(c.iso)}
                  >
                    <div className="mc-cal-day__num font-mono">{c.day}</div>
                    <div className="col" style={{ gap: 3, marginTop: 4, overflow: "hidden" }}>
                      {evs.slice(0, 3).map((e) => (
                        <div
                          key={e.id}
                          title={e.titulo}
                          style={{
                            fontSize: 10, padding: "2px 5px", borderRadius: 4, color: "white", fontWeight: 500,
                            background: COLOR[e.cat], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}
                        >
                          {e.titulo}
                        </div>
                      ))}
                      {evs.length > 3 && <div className="text-xs text-muted" style={{ fontSize: 10 }}>+{evs.length - 3} más</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Próximos eventos */}
      <div className="mc-card">
        <div className="mc-card__head">
          <div className="mc-card__title">Próximos eventos</div>
          <span className="mc-badge mc-badge--neutral">
            <span className="mc-badge__dot"></span>{proximos.length} agendado(s)
          </span>
        </div>
        {cargando ? (
          <div className="text-sm text-muted" style={{ padding: "12px 0" }}>Cargando agenda…</div>
        ) : proximos.length === 0 ? (
          <div className="mc-empty">
            <div className="mc-empty__icon"><Icon name="calendar" size={22} /></div>
            <div className="mc-empty__title">Sin eventos próximos</div>
            <div className="mc-empty__text">
              Las labores, eventos sanitarios, riegos y alertas climáticas que cargues en sus
              módulos aparecerán acá automáticamente.
            </div>
          </div>
        ) : (
          <div className="col gap-8">
            {proximos.map((e) => {
              const cat = CATS.find((c) => c.key === e.cat);
              const d = new Date(e.fechaISO + "T12:00:00");
              const esHoy = e.fechaISO === toISO(hoy);
              return (
                <button
                  key={e.id}
                  onClick={() => setDiaSel(e.fechaISO)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                    border: "1px solid var(--mc-line)", borderRadius: 10, background: "var(--mc-surface)",
                    cursor: "pointer", textAlign: "left", width: "100%",
                  }}
                >
                  <div
                    style={{
                      width: 44, flexShrink: 0, textAlign: "center", lineHeight: 1.1,
                      color: COLOR[e.cat],
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 700 }} className="font-mono">{d.getDate()}</div>
                    <div className="text-xs" style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {MESES[d.getMonth()].slice(0, 3)}
                    </div>
                  </div>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLOR[e.cat], flexShrink: 0 }}></span>
                  <div style={{ flex: 1 }}>
                    <div className="font-semi" style={{ color: "var(--mc-ink)" }}>{e.titulo}</div>
                    <div className="text-xs text-muted">{cat?.label}</div>
                  </div>
                  {esHoy && <span className="mc-badge mc-badge--green"><span className="mc-badge__dot"></span>Hoy</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal del día */}
      <Modal
        open={!!diaSel}
        onClose={() => setDiaSel(null)}
        title={diaSel ? new Date(diaSel + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}
        subtitle={`${eventosDiaSel.length} evento(s) agendado(s)`}
        footer={
          <>
            <button className="mc-btn mc-btn--ghost" onClick={() => setDiaSel(null)}>Cerrar</button>
            <button className="mc-btn mc-btn--primary" onClick={crearLabor} disabled={lotes.length === 0}>
              <Icon name="plus" size={14} />Nueva labor
            </button>
          </>
        }
      >
        <div className="col gap-8">
          {eventosDiaSel.length === 0 ? (
            <div className="text-sm text-muted">No hay eventos para este día. Agregá una labor con el formulario de abajo.</div>
          ) : (
            eventosDiaSel.map((e) => {
              const cat = CATS.find((c) => c.key === e.cat);
              return (
                <div key={e.id} style={{ padding: 12, border: "1px solid var(--mc-line)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLOR[e.cat], flexShrink: 0 }}></span>
                  <div style={{ flex: 1 }}>
                    <div className="font-semi" style={{ color: "var(--mc-ink)" }}>{e.titulo}</div>
                    <div className="text-xs text-muted">{cat?.label}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--mc-line)", marginTop: 14, paddingTop: 14 }}>
          <div className="font-semi mb-8" style={{ color: "var(--mc-ink)", fontSize: 13 }}>Agendar nueva labor</div>
          {lotes.length === 0 ? (
            <div className="text-sm text-muted">
              No tenés lotes cargados. Creá uno en Campo Digital para poder agendar labores.
            </div>
          ) : (
            <div className="grid g-cols-2 gap-12">
              <Field label="Tipo">
                <select className="mc-select" value={laborForm.tipo} onChange={(e) => setLaborForm({ ...laborForm, tipo: e.target.value })}>
                  {["Siembra", "Pulverización", "Fertilización", "Riego", "Cosecha", "Monitoreo"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Lote">
                <select className="mc-select" value={laborForm.loteIdx} onChange={(e) => setLaborForm({ ...laborForm, loteIdx: parseInt(e.target.value) })}>
                  {lotes.map((l, i) => <option key={l.id} value={i}>{l.nombre}</option>)}
                </select>
              </Field>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

/* ============ VISTA SEMANA ============ */
function VistaSemana({
  cursor, hoy, eventos, onDia,
}: {
  cursor: Date;
  hoy: Date;
  eventos: Evento[];
  onDia: (iso: string) => void;
}) {
  // Semana que contiene el día 1 del mes en cursor (o la semana de hoy si coincide el mes)
  const ref = cursor.getMonth() === hoy.getMonth() && cursor.getFullYear() === hoy.getFullYear() ? new Date(hoy) : new Date(cursor);
  const lunes = new Date(ref);
  lunes.setDate(ref.getDate() - ((ref.getDay() + 6) % 7));
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });
  const dow = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

  return (
    <div className="mc-cal-grid">
      {dias.map((d, i) => {
        const iso = toISO(d);
        const evs = eventos.filter((e) => e.fechaISO === iso);
        const esHoy = iso === toISO(hoy);
        return (
          <div key={i} className={`mc-cal-day${esHoy ? " mc-cal-day--today" : ""}`} style={{ minHeight: 200 }} onClick={() => onDia(iso)}>
            <div className="text-xs text-muted" style={{ fontWeight: 600 }}>{dow[i]}</div>
            <div className="mc-cal-day__num font-mono">{d.getDate()}</div>
            <div className="col" style={{ gap: 3, marginTop: 6, overflow: "hidden" }}>
              {evs.map((e) => (
                <div
                  key={e.id}
                  title={e.titulo}
                  style={{ fontSize: 10, padding: "3px 6px", borderRadius: 4, color: "white", fontWeight: 500, background: COLOR[e.cat], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {e.titulo}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
