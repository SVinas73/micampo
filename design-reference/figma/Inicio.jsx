// Inicio.jsx - Dashboard / home page

const ALL_KPIS = {
  hectareas: { label: "Hectáreas productivas", value: "558 Ha", delta: "+3.2% vs campaña ant.", trend: "up", icon: "map", accent: true },
  cabezas: { label: "Cabezas de ganado", value: "1,284", delta: "+24 últ. 30d", trend: "up", icon: "cow" },
  ingresosMes: { label: "Ingresos del mes", value: "$8.6M", delta: "+12% vs marzo", trend: "up", icon: "dollar" },
  labores: { label: "Labores pendientes", value: "17", delta: "3 atrasadas", trend: "warn", icon: "wrench", warn: true },
  litros: { label: "Litros prom. diario", value: "4,820 L", delta: "+180L vs ayer", trend: "up", icon: "droplet" },
  margen: { label: "Margen bruto est.", value: "$2.8M", delta: "+0.4M ajuste", trend: "up", icon: "activity" },
  preñez: { label: "Preñez rodeo", value: "78%", delta: "Tacto parcial", trend: "up", icon: "heart" },
  agua: { label: "Reserva agua útil", value: "62%", delta: "-4 pts vs ayer", trend: "down", icon: "droplet" },
  ingresosProy: { label: "Ingresos proy. campaña", value: "$48.2M", delta: "+18% est.", trend: "up", icon: "dollar" },
  hectareasSemb: { label: "Hectáreas sembradas", value: "426 Ha", delta: "76% del campo", trend: "up", icon: "sprout" },
  alertas: { label: "Alertas activas", value: "5", delta: "2 críticas", trend: "warn", icon: "alert" },
  rinde: { label: "Rinde promedio est.", value: "6.6 t/Ha", delta: "+0.4 vs ant.", trend: "up", icon: "activity" },
};

const DEFAULT_KPI_ORDER = ["hectareas","cabezas","ingresosMes","labores","litros"];

function Inicio() {
  const { useState } = React;
  const [editKpis, setEditKpis] = useState(false);
  const [kpiOrder, setKpiOrder] = useState(DEFAULT_KPI_ORDER);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const onDragStart = (idx) => setDraggedIdx(idx);
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (idx) => {
    if (draggedIdx === null || draggedIdx === idx) return;
    const next = [...kpiOrder];
    const [m] = next.splice(draggedIdx, 1);
    next.splice(idx, 0, m);
    setKpiOrder(next);
    setDraggedIdx(null);
  };

  const swapKpi = (oldKey, newKey) => {
    setKpiOrder(kpiOrder.map(k => k === oldKey ? newKey : k));
    setPickerOpen(false);
  };

  return (
    <div className="col gap-20">
      <PageHeader
        crumbs={["MiCampo","Inicio"]}
        title="Buen día, Juan."
        subtitle="Hoy es viernes 18 de abril. Tenés 3 labores programadas, 1 atrasada y lluvia prevista mañana."
      />

      {/* KPIs editables */}
      <div>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <div className="row gap-8">
            <span className="mc-card__eyebrow">Indicadores principales</span>
            {editKpis && <span className="mc-badge mc-badge--blue">Modo edición · arrastrá para reordenar · click en ✎ para cambiar</span>}
          </div>
          <button
            className={`mc-btn mc-btn--sm ${editKpis ? "mc-btn--primary" : "mc-btn--ghost"}`}
            onClick={() => setEditKpis(!editKpis)}>
            <Icon name={editKpis ? "check" : "edit"} size={13}/>
            {editKpis ? "Listo" : "Editar KPIs"}
          </button>
        </div>
        <div className="grid g-cols-5">
          {kpiOrder.map((k, idx) => {
            const cfg = ALL_KPIS[k];
            return (
              <div
                key={k}
                draggable={editKpis}
                onDragStart={() => onDragStart(idx)}
                onDragOver={onDragOver}
                onDrop={() => onDrop(idx)}
                style={{ cursor: editKpis ? "grab" : "default", opacity: draggedIdx === idx ? 0.5 : 1, position: "relative" }}
              >
                <KPI {...cfg}>
                  {editKpis && (
                    <button
                      className="mc-kpi__edit"
                      style={{ opacity: 1, cursor: "pointer", border: "none", background: "var(--mc-green-600)", color: "white" }}
                      onClick={(e) => { e.stopPropagation(); setPickerOpen(k); }}
                    >
                      <Icon name="edit" size={11}/>
                    </button>
                  )}
                </KPI>
                {pickerOpen === k && (
                  <KpiPicker current={k} used={kpiOrder} onPick={(nk) => swapKpi(k, nk)} onClose={() => setPickerOpen(false)}/>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Acciones principales */}
      <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
        <button className="mc-icon-btn"><Icon name="bell" size={16}/></button>
        <button className="mc-btn mc-btn--secondary"><Icon name="download" size={15}/>Reporte semanal</button>
        <button className="mc-btn mc-btn--primary"><Icon name="plus" size={15}/>Nueva labor</button>
      </div>

      {/* Clima 7d + Gantt | Balance mensual */}
      <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)", gap: 14 }}>
        <ClimaConGantt/>
        <BalanceMensual/>
      </div>

      {/* Actividad / Alertas */}
      <div className="grid" style={{ gridTemplateColumns: "1.1fr 1fr", gap: 14 }}>
        <UltimasActividades/>

        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__title">Alertas activas</div>
            <span className="mc-badge mc-badge--red"><span className="mc-badge__dot"></span>5 críticas</span>
          </div>
          <div className="col gap-8">
            <Alerta nivel="red" title="Plaga detectada" body="Chinches verdes en Lote Norte 1 · superó umbral" />
            <Alerta nivel="orange" title="Ventana de pulverización cerrada" body="Viento >20km/h las próximas 12hs" />
            <Alerta nivel="amber" title="Stock bajo" body="Urea · quedan 4 días de consumo" />
            <Alerta nivel="blue" title="Cosecha lista" body="Maíz Lote Este 1 · humedad 14.5%" />
            <Alerta nivel="amber" title="Animales sin pesar" body="Tropa C · 38 días sin registro" />
          </div>
        </div>
      </div>

      {/* Atajos */}
      <div className="mc-card">
        <div className="mc-card__head">
          <div className="mc-card__title">Acciones rápidas</div>
          <button className="mc-btn mc-btn--ghost mc-btn--sm">Personalizar</button>
        </div>
        <div className="grid g-cols-6 gap-8" style={{ rowGap: 10 }}>
          <QuickAct icon="droplet" label="Cargar lluvia" />
          <QuickAct icon="scale" label="Pesada" />
          <QuickAct icon="flask" label="Calcular dosis" />
          <QuickAct icon="syringe" label="Sanidad" />
          <QuickAct icon="sprout" label="Nueva siembra" />
          <QuickAct icon="truck" label="Mov. tropa" />
          <QuickAct icon="wrench" label="Nueva labor" />
          <QuickAct icon="map" label="Nuevo lote" />
          <QuickAct icon="cow" label="Nuevo animal" />
          <QuickAct icon="leaf" label="Nueva ración" />
          <QuickAct icon="dollar" label="Registrar gasto" />
          <QuickAct icon="upload" label="Reportar plaga" />
          <QuickAct icon="alert" label="Registrar alerta" />
          <QuickAct icon="book" label="Análisis de suelo" />
          <QuickAct icon="building" label="Ingreso insumos" />
          <QuickAct icon="bell" label="Notificación" />
          <QuickAct icon="check" label="Cerrar labor" />
          <QuickAct icon="calendar" label="Ver agenda" />
        </div>
      </div>
    </div>
  );
}

function KpiPicker({ current, used, onPick, onClose }) {
  const all = Object.keys(ALL_KPIS).filter(k => k === current || !used.includes(k));
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50 }}/>
      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 6, background: "var(--mc-surface)", border: "1px solid var(--mc-line)", borderRadius: 12, boxShadow: "var(--sh-md)", padding: 6, zIndex: 51, maxHeight: 280, overflowY: "auto" }}>
        <div className="text-xs text-muted" style={{ padding: "6px 10px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Reemplazar por</div>
        {all.map(k => (
          <button
            key={k}
            onClick={() => onPick(k)}
            style={{ width: "100%", padding: "8px 10px", display: "flex", alignItems: "center", gap: 10, border: "none", background: k === current ? "var(--mc-green-50)" : "transparent", color: "var(--mc-ink)", borderRadius: 6, cursor: "pointer", textAlign: "left" }}
            onMouseEnter={e => e.currentTarget.style.background = k === current ? "var(--mc-green-50)" : "var(--mc-surface-2)"}
            onMouseLeave={e => e.currentTarget.style.background = k === current ? "var(--mc-green-50)" : "transparent"}
          >
            <span style={{ width: 24, height: 24, borderRadius: 6, background: "var(--mc-green-50)", color: "var(--mc-green-700)", display: "grid", placeItems: "center" }}>
              <Icon name={ALL_KPIS[k].icon} size={12}/>
            </span>
            <span style={{ flex: 1, fontSize: 13 }}>{ALL_KPIS[k].label}</span>
            {k === current && <Icon name="check" size={13} style={{ color: "var(--mc-green-700)" }}/>}
          </button>
        ))}
      </div>
    </>
  );
}

function KPI({ label, value, delta, trend, icon, accent, warn, children }) {
  const cls = accent ? "mc-kpi mc-kpi--accent" : warn ? "mc-kpi mc-kpi--warn" : "mc-kpi";
  const tcls = trend === "up" ? "mc-kpi__delta--up" : trend === "down" ? "mc-kpi__delta--down" : "mc-kpi__delta--warn";
  return (
    <div className={cls}>
      {children}
      {icon && <span className="mc-kpi__glyph"><Icon name={icon} size={14}/></span>}
      <div className="mc-kpi__label">{label}</div>
      <div className="mc-kpi__value">{value}</div>
      <div className={`mc-kpi__delta ${tcls}`}>
        <Icon name={trend === "down" ? "arrowDown" : trend === "warn" ? "alert" : "arrowUp"} size={12}/>
        {delta}
      </div>
    </div>
  );
}

/* ============= CLIMA + GANTT 7 DÍAS (bloque combinado) ============= */
function ClimaConGantt() {
  const today = new Date(2026, 3, 18);
  const dayNames = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const weatherData = [
    { ic: "⛅", max: 22, min: 14, mm: 0,  wind: "12 km/h ↘ SE" },
    { ic: "☀️", max: 24, min: 15, mm: 0,  wind: "15 km/h → E"  },
    { ic: "🌧️", max: 20, min: 12, mm: 25, wind: "18 km/h ↙ SO" },
    { ic: "🌦️", max: 21, min: 13, mm: 15, wind: "10 km/h ↓ S"  },
    { ic: "⛅", max: 23, min: 14, mm: 0,  wind: "8 km/h ↗ NE"  },
    { ic: "☀️", max: 26, min: 16, mm: 0,  wind: "12 km/h ↑ N"  },
    { ic: "🌦️", max: 22, min: 13, mm: 8,  wind: "20 km/h ↙ SO" },
  ];
  const days = weatherData.map((w, i) => {
    const d = new Date(today); d.setDate(d.getDate() + i);
    return { name: dayNames[d.getDay()], num: d.getDate(), isToday: i === 0, ...w };
  });

  const events = [
    { titulo: "Siembra Lote 3",      inicio: 0, dur: 2, color: "#4f9d52", icon: "sprout"  },
    { titulo: "Pulverización N1",     inicio: 0, dur: 1, color: "#e7892b", icon: "flask"   },
    { titulo: "Retira Conaprole",     inicio: 1, dur: 1, color: "#2c7ad9", icon: "truck"   },
    { titulo: "Riego Sector A",       inicio: 2, dur: 4, color: "#3aa6d9", icon: "droplet" },
    { titulo: "Vacunación Aftosa",    inicio: 3, dur: 1, color: "#c14a3a", icon: "syringe" },
    { titulo: "Cosecha Maíz E1",      inicio: 5, dur: 2, color: "#d9a538", icon: "wrench"  },
  ];

  const rows = [];
  events.forEach(e => {
    let placed = false;
    for (const r of rows) {
      if (!r.some(x => !(e.inicio + e.dur <= x.inicio || x.inicio + x.dur <= e.inicio))) {
        r.push(e); placed = true; break;
      }
    }
    if (!placed) rows.push([e]);
  });

  // For temp curve overlay
  const tempLow = 10, tempHigh = 30;
  const tY = (t) => 60 * (1 - (t - tempLow) / (tempHigh - tempLow)) + 6;

  return (
    <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Hoy — cabecera con gradiente */}
      <div style={{ background: "linear-gradient(135deg, #2d5f4a 0%, #4a7c64 100%)", color: "white", padding: "18px 22px 20px" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 10, opacity: 0.78, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>Don Ramón · vie 18 abr · 14:32</div>
          <div style={{ fontSize: 11, opacity: 0.85, padding: "3px 10px", borderRadius: 999, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.22)" }}>Parcialmente nublado</div>
        </div>
        <div className="row" style={{ alignItems: "stretch", gap: 14 }}>
          {/* Big "now" temp on the left */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingRight: 18, borderRight: "1px solid rgba(255,255,255,0.22)" }}>
            <span style={{ fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif", fontSize: 38, lineHeight: 1 }}>⛅</span>
            <div className="col">
              <span style={{ fontFamily: "var(--ff-display)", fontSize: 56, lineHeight: 0.92, fontWeight: 600 }}>22°</span>
              <span style={{ fontSize: 11, opacity: 0.78, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600, marginTop: 2 }}>Ahora</span>
            </div>
          </div>
          {/* Cohesive 4-cell info bar */}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 12, overflow: "hidden" }}>
            <InfoCell icon="thermometer" big={<span><span style={{ color: "#ffd28a" }}>24°</span><span style={{ opacity: 0.62, margin: "0 6px", fontSize: 13, fontFamily: "var(--ff-mono)", fontWeight: 500 }}>°C</span><span style={{ color: "#9ad8ff" }}>14°</span></span>} sub="Sens. 21°"/>
            <InfoCell icon="droplet" big="68%" sub="Rocío 16°"/>
            <InfoCell icon="wind" big="12 km/h" sub="↘ SE · Ráf. 18"/>
            <InfoCell icon="activity" big="ΔT 5.2" sub="✓ Apto pulver." highlight/>
          </div>
        </div>
      </div>

      {/* Pronóstico 7 días — grid + integrated temp curve overlay */}
      <div style={{ position: "relative", borderBottom: "1px solid var(--mc-line)", background: "var(--mc-surface)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {days.map((d, i) => (
            <div key={i} style={{
              padding: "10px 4px 10px",
              textAlign: "center",
              borderRight: i < 6 ? "1px solid var(--mc-line)" : "none",
              background: d.isToday ? "var(--mc-green-50)" : "transparent",
              position: "relative",
              minHeight: 168,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: d.isToday ? "var(--mc-green-700)" : "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{d.name}</div>
              <div style={{ fontSize: 10, color: d.isToday ? "var(--mc-green-700)" : "var(--mc-text-2)", fontWeight: 600, marginTop: 1 }}>{d.num}</div>
              <div style={{ fontSize: 30, lineHeight: 1, marginTop: 6, fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif" }}>{d.ic}</div>
              {/* spacer for the SVG curve overlay */}
              <div style={{ height: 80 }}/>
              {d.mm > 0
                ? <div style={{ fontSize: 11, color: "var(--mc-blue)", fontWeight: 700, fontFamily: "var(--ff-mono)" }}>💧 {d.mm}mm</div>
                : <div style={{ height: 17 }}/>}
              <div style={{ fontSize: 9, color: "var(--mc-text-3)", marginTop: 2, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", padding: "0 2px" }}>{d.wind}</div>
            </div>
          ))}
        </div>
        {/* SVG overlay: continuous temp curve flowing across all 7 days */}
        <svg style={{ position: "absolute", top: 70, left: 0, width: "100%", height: 80, pointerEvents: "none" }} viewBox="0 0 700 80" preserveAspectRatio="none">
          <defs>
            <linearGradient id="ic-max-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e7892b" stopOpacity="0.16"/>
              <stop offset="100%" stopColor="#e7892b" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="ic-min-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3aa6d9" stopOpacity="0.12"/>
              <stop offset="100%" stopColor="#3aa6d9" stopOpacity="0"/>
            </linearGradient>
            <filter id="ic-dot-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.35"/>
            </filter>
          </defs>
          {/* Area fills */}
          <polygon points={`50,80 ${days.map((d, i) => `${i * 100 + 50},${tY(d.max)}`).join(' ')} 650,80`} fill="url(#ic-max-area)"/>
          <polygon points={`50,80 ${days.map((d, i) => `${i * 100 + 50},${tY(d.min)}`).join(' ')} 650,80`} fill="url(#ic-min-area)"/>
          {/* Max line */}
          <polyline fill="none" stroke="#e7892b" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" points={days.map((d, i) => `${i * 100 + 50},${tY(d.max)}`).join(' ')}/>
          {/* Min line */}
          <polyline fill="none" stroke="#3aa6d9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" points={days.map((d, i) => `${i * 100 + 50},${tY(d.min)}`).join(' ')}/>
          {/* Dots + labels (preserveAspectRatio=none stretches text in X — keep text small) */}
          {days.map((d, i) => {
            const x = i * 100 + 50;
            return (
              <g key={i}>
                <circle cx={x} cy={tY(d.max)} r="5" fill="#e7892b" stroke="white" strokeWidth="1.8" filter="url(#ic-dot-shadow)"/>
                <circle cx={x} cy={tY(d.min)} r="4.5" fill="#3aa6d9" stroke="white" strokeWidth="1.6" filter="url(#ic-dot-shadow)"/>
              </g>
            );
          })}
        </svg>
        {/* Numeric temp labels rendered in HTML so they don't get stretched */}
        <div style={{ position: "absolute", top: 70, left: 0, width: "100%", height: 80, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", pointerEvents: "none" }}>
          {days.map((d, i) => (
            <div key={i} style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: `${tY(d.max) - 18}px`, fontFamily: "var(--ff-mono)", fontSize: 12, fontWeight: 800, color: "var(--mc-ink)", whiteSpace: "nowrap" }}>{d.max}°</span>
              <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: `${tY(d.min) + 8}px`, fontFamily: "var(--ff-mono)", fontSize: 11, fontWeight: 700, color: "var(--mc-text-2)", whiteSpace: "nowrap" }}>{d.min}°</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gantt de la semana */}
      <div style={{ padding: "10px 14px 14px" }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Agenda de la semana</div>
          <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ padding: "2px 8px", fontSize: 11 }}>Ver calendario <Icon name="chevRight" size={11}/></button>
        </div>
        <div style={{ position: "relative" }}>
          {/* Guías de columna */}
          <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", pointerEvents: "none", zIndex: 0 }}>
            {days.map((d, i) => (
              <div key={i} style={{ borderRight: i < 6 ? "1px dashed rgba(0,0,0,0.06)" : "none", background: d.isToday ? "rgba(79,157,82,0.06)" : "transparent" }}/>
            ))}
          </div>
          {/* Filas de eventos */}
          <div style={{ position: "relative", zIndex: 1 }}>
            {rows.map((row, ri) => (
              <div key={ri} style={{ position: "relative", height: 26, marginBottom: ri < rows.length - 1 ? 5 : 0 }}>
                {row.map((e, ei) => {
                  // Multi-day events: center between days (left at 0.5/7, width = (dur-1)/7)
                  // Single-day events: fill the day column with margins
                  const isMulti = e.dur > 1;
                  const leftPct = isMulti ? ((e.inicio + 0.5) / 7) * 100 : (e.inicio / 7) * 100;
                  const widthPct = isMulti ? ((e.dur - 1) / 7) * 100 : (1 / 7) * 100;
                  const left = `calc(${leftPct}% + ${isMulti ? 0 : 4}px)`;
                  const width = `calc(${widthPct}% - ${isMulti ? 0 : 8}px)`;
                  return (
                    <div key={ei} style={{
                      position: "absolute",
                      left, width,
                      top: 0, bottom: 0,
                      background: e.color,
                      borderRadius: 999,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "0 11px",
                      fontSize: 11,
                      color: "white",
                      fontWeight: 600,
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      boxShadow: `0 1px 4px ${e.color}55, inset 0 1px 0 rgba(255,255,255,0.18)`,
                    }}>
                      <Icon name={e.icon} size={10}/>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{e.titulo}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCell({ icon, big, sub, highlight }) {
  return (
    <div style={{
      padding: "12px 14px",
      borderRight: "1px solid rgba(255,255,255,0.12)",
      background: highlight ? "rgba(255,255,255,0.10)" : "transparent",
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.20)", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name={icon} size={15}/>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "var(--ff-display)", fontSize: 18, fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{big}</div>
        <div style={{ fontSize: 10.5, opacity: 0.78, marginTop: 3, whiteSpace: "nowrap" }}>{sub}</div>
      </div>
    </div>
  );
}

/* ============= BALANCE MENSUAL — área curva ============= */
function BalanceMensual() {
  const months = ["Nov","Dic","Ene","Feb","Mar","Abr"];
  const ingresos = [4.2, 5.8, 6.4, 7.1, 7.6, 8.6];
  const gastos   = [3.1, 3.4, 4.0, 4.2, 5.1, 5.8];
  const max = 10;
  const W = 360, H = 170;
  const padL = 36, padR = 12, padT = 12, padB = 24;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = months.length;

  const pts = (arr) => arr.map((v, i) => ({
    x: padL + (i / (n - 1)) * innerW,
    y: padT + innerH * (1 - v / max),
  }));

  const curvePath = (points) => {
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[Math.max(0, i - 2)];
      const p1 = points[i - 1];
      const p2 = points[i];
      const p3 = points[Math.min(points.length - 1, i + 1)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const areaPath = (points, color) => {
    const line = curvePath(points);
    const bottom = `L ${points[points.length - 1].x} ${padT + innerH} L ${points[0].x} ${padT + innerH} Z`;
    return line + " " + bottom;
  };

  const ingPts = pts(ingresos);
  const gasPts = pts(gastos);

  return (
    <div className="mc-card" style={{ display: "flex", flexDirection: "column" }}>
      <div className="mc-card__head" style={{ alignItems: "flex-start" }}>
        <div>
          <div className="mc-card__eyebrow">Últimos 6 meses</div>
          <div className="mc-card__title mt-4">Balance mensual</div>
        </div>
        <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ padding: "4px 8px" }}><Icon name="more" size={13}/></button>
      </div>

      <div className="row gap-10" style={{ marginBottom: 10 }}>
        <div style={{ flex: 1, padding: "8px 10px", borderRadius: 9, background: "var(--mc-green-50)", border: "1px solid var(--mc-green-200)" }}>
          <div className="row gap-4" style={{ fontSize: 10, color: "var(--mc-green-700)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--mc-green-500)", flexShrink: 0 }}></span>Ingresos
          </div>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 20, color: "var(--mc-green-700)", marginTop: 2 }}>$8.6M</div>
          <div className="text-xs" style={{ color: "var(--mc-green-700)", opacity: 0.75 }}>+12% vs marzo</div>
        </div>
        <div style={{ flex: 1, padding: "8px 10px", borderRadius: 9, background: "#f1f5f9", border: "1px solid #cbd5e1" }}>
          <div className="row gap-4" style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#475569", flexShrink: 0 }}></span>Gastos
          </div>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 20, color: "#334155", marginTop: 2 }}>$5.8M</div>
          <div className="text-xs" style={{ color: "#475569", opacity: 0.75 }}>+14% vs marzo</div>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
          <defs>
            <linearGradient id="bal-ing" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f9d52" stopOpacity="0.28"/>
              <stop offset="100%" stopColor="#4f9d52" stopOpacity="0.02"/>
            </linearGradient>
            <linearGradient id="bal-gas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e7892b" stopOpacity="0.22"/>
              <stop offset="100%" stopColor="#e7892b" stopOpacity="0.02"/>
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
            const y = padT + innerH * (1 - p);
            return (
              <g key={i}>
                <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--mc-line)" strokeDasharray={i === 0 ? "0" : "2,3"}/>
                <text x={padL - 4} y={y + 3} fontSize="9" fontFamily="var(--ff-mono)" fill="var(--mc-text-3)" textAnchor="end">${max * p}M</text>
              </g>
            );
          })}

          {/* Area fills */}
          <path d={areaPath(ingPts)} fill="url(#bal-ing)"/>
          <path d={areaPath(gasPts)} fill="url(#bal-gas)"/>

          {/* Curve lines */}
          <path d={curvePath(ingPts)} fill="none" stroke="#4f9d52" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d={curvePath(gasPts)} fill="none" stroke="#e7892b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

          {/* Dots — bigger for last */}
          {ingPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={i === n - 1 ? 5 : 3} fill="#4f9d52"/>)}
          {gasPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={i === n - 1 ? 5 : 3} fill="#e7892b"/>)}

          {/* X labels */}
          {ingPts.map((p, i) => (
            <text key={i} x={p.x} y={H - 7} fontSize="10" fontFamily="var(--ff-ui)" fill={i === n - 1 ? "var(--mc-ink)" : "var(--mc-text-2)"} fontWeight={i === n - 1 ? 700 : 500} textAnchor="middle">{months[i]}</text>
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ============= ÚLTIMAS ACTIVIDADES (estilo timeline con avatar) ============= */
function UltimasActividades() {
  const activs = [
    { tipo: "user", inicial: "S", color: "#5E8F78", quien: "Santiago", verb: "registró", obj: "20mm de lluvia", lote: "Lote 2", emoji: "🌧️", time: "Hace 2 horas" },
    { tipo: "user", inicial: "J", color: "#d9a538", quien: "Joaquin", verb: "finalizó", obj: "Siembra", lote: "Lote 1", emoji: "🚜", time: "Hace 5 horas" },
    { tipo: "system", color: "#3f4443", quien: "Sistema", verb: "detectó", obj: "Alerta de Isoca", lote: "Lote 3", emoji: "🐛", time: "Ayer" },
    { tipo: "user", inicial: "S", color: "#5E8F78", quien: "Santiago", verb: "cargó", obj: "Foto de Cultivo", lote: "Lote 4", emoji: "📷", time: "Ayer" },
    { tipo: "user", inicial: "M", color: "#e7892b", quien: "Manuel", verb: "aplicó", obj: "Pulverización", lote: "Lote N1", emoji: "💧", time: "Hace 2 días" },
    { tipo: "system", color: "#3f4443", quien: "Sistema", verb: "completó", obj: "Análisis IA de NDVI", lote: "Todos", emoji: "📊", time: "Hace 2 días" },
  ];
  return (
    <div className="mc-card">
      <div className="mc-card__head">
        <div className="mc-card__title">Últimas Actividades</div>
        <button className="mc-btn mc-btn--ghost mc-btn--sm">Ver todo <Icon name="chevRight" size={13}/></button>
      </div>
      <div className="mc-actividades">
        {activs.map((a, i) => (
          <div key={i} className="mc-act-row">
            <div className="mc-act-row__avatar" style={{ background: a.color }}>
              {a.tipo === "system" ? <Icon name="bolt" size={14}/> : a.inicial}
            </div>
            <div className="mc-act-row__content">
              <div className="mc-act-row__text">
                <span style={{ color: "var(--mc-ink)", fontWeight: 500 }}>{a.quien}</span>
                {" "}{a.verb}{" "}
                <span style={{ color: "var(--mc-ink)", fontWeight: 600 }}>{a.obj}</span>
                {" "}en{" "}
                <span style={{ color: "var(--mc-ink)", fontWeight: 600 }}>{a.lote}</span>
                <span style={{ marginLeft: 6 }}>{a.emoji}</span>
              </div>
            </div>
            <div className="mc-act-row__time">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Alerta({ nivel, title, body }) {
  const map = { red: "mc-badge--red", orange: "mc-badge--orange", amber: "mc-badge--amber", blue: "mc-badge--blue" };
  const labelMap = { red: "Crítica", orange: "Alta", amber: "Media", blue: "Info" };
  return (
    <div style={{ padding: "10px 12px", border: "1px solid var(--mc-line)", borderRadius: "var(--r-sm)", background: "var(--mc-surface-2)" }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="font-semi" style={{ fontSize: 13, color: "var(--mc-ink)" }}>{title}</div>
        <span className={`mc-badge ${map[nivel]}`}><span className="mc-badge__dot"></span>{labelMap[nivel]}</span>
      </div>
      <div className="text-xs text-muted mt-4">{body}</div>
    </div>
  );
}

function QuickAct({ icon, label }) {
  return (
    <button className="mc-card mc-quick" style={{ padding: "12px 10px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, cursor: "pointer", transition: "0.15s" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--mc-green-50)", color: "var(--mc-green-700)", display: "grid", placeItems: "center" }}>
        <Icon name={icon} size={15}/>
      </div>
      <div className="text-sm font-semi" style={{ color: "var(--mc-ink)", fontSize: 12.5 }}>{label}</div>
    </button>
  );
}

window.Inicio = Inicio;
window.KPI = KPI;
