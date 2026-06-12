// CampoDigital.jsx — Campo Digital y todas sus pestañas

const CD_TABS = ["Resumen","Lotes","Labores","Cultivos","Detección de Enfermedades (IA)","Timeline"];

function CampoDigital() {
  const { useState } = React;
  const [tab, setTab] = useState("Resumen");
  const [selectedLote, setSelectedLote] = useState(null);

  return (
    <div className="col gap-20">
      <PageHeader
        crumbs={["Agronomía","Campo Digital"]}
        title="Campo Digital"
        subtitle="Mapa operativo, lotes, cultivos, labores y sanidad de tus 558 hectáreas productivas."
      />
      <Tabs tabs={CD_TABS} active={tab} onChange={setTab} warnTabs={["Labores","Detección de Enfermedades (IA)"]}/>
      {tab === "Resumen" && <CDResumen onVerTodo={() => setTab("Timeline")}/>}
      {tab === "Lotes" && <CDLotes selected={selectedLote} onSelect={setSelectedLote}/>}
      {tab === "Labores" && <CDLabores/>}
      {tab === "Cultivos" && <CDCultivos/>}
      {tab === "Detección de Enfermedades (IA)" && <CDEnfermedades/>}
      {tab === "Timeline" && <CDTimeline/>}
    </div>
  );
}

/* ========== RESUMEN ========== */
function CDResumen({ onVerTodo }) {
  return (
    <>
      <div className="grid g-cols-5">
        <KPI label="Hectáreas totales" value="558 Ha" delta="+3.2% vs campaña ant." trend="up" icon="map" accent/>
        <KPI label="Hectáreas sembradas" value="426 / 558" delta="76% de ocupación" trend="up" icon="sprout"/>
        <KPI label="Siembras programadas" value="3" delta="Próx. 22 abr · Trigo" trend="up" icon="calendar"/>
        <KPI label="Labores próximas" value="17" delta="3 atrasadas" trend="warn" icon="wrench"/>
        <KPI label="Alertas sanitarias" value="2" delta="Chinche + mancha" trend="warn" icon="alert" warn/>
      </div>

      {/* Tipos de plantaciones - barchart full width */}
      <PlantacionesCard/>

      {/* Últimas actividades + Focos de atención */}
      <div className="grid" style={{ gridTemplateColumns: "1.1fr 1fr", gap: 14 }}>
        <UltimasActividadesCard onVerTodo={onVerTodo}/>
        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__title">Focos de atención</div>
            <span className="mc-badge mc-badge--orange">5</span>
          </div>
          <div className="col gap-8">
            <FocoRow nivel="red" titulo="Plaga: chinche verde" lote="Lote Norte 1 · Soja" detail="Sup. umbral · acción inmediata" icon="alert"/>
            <FocoRow nivel="orange" titulo="Stress hídrico" lote="Lote Este 1 · Maíz" detail="NDVI -8% en 7d · agua útil 42%" icon="droplet"/>
            <FocoRow nivel="amber" titulo="Enfermedad detectada" lote="Lote Sur 1 · Trigo" detail="Mancha foliar · IA 81% conf." icon="leaf"/>
            <FocoRow nivel="amber" titulo="Labor atrasada" lote="Lote Sur 2" detail="Fertilización · 2d de atraso" icon="wrench"/>
            <FocoRow nivel="blue" titulo="Cosecha lista" lote="Lote Este 1 · Maíz" detail="Humedad 14.5% · ventana óptima" icon="check"/>
          </div>
        </div>
      </div>
    </>
  );
}

function PlantacionesCard() {
  const { useState } = React;
  const [mode, setMode] = useState("ha");
  return (
    <div className="mc-card">
      <div className="mc-card__head">
        <div>
          <div className="mc-card__eyebrow">Distribución del campo · campaña 25/26</div>
          <div className="mc-card__title mt-4">Tipos de plantaciones</div>
        </div>
        <div className="row gap-12">
          <div className="text-right">
            <div className="text-xs text-muted">Total productivo</div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, color: "var(--mc-ink)" }}>558 Ha</div>
          </div>
          <div className="mc-seg">
            <button className={mode === "ha" ? "is-on" : ""} onClick={() => setMode("ha")}>Hectáreas</button>
            <button className={mode === "lotes" ? "is-on" : ""} onClick={() => setMode("lotes")}>Lotes</button>
            <button className={mode === "pct" ? "is-on" : ""} onClick={() => setMode("pct")}>%</button>
          </div>
        </div>
      </div>
      <BarChartPlantaciones mode={mode}/>
    </div>
  );
}

function BarChartPlantaciones({ mode }) {
  const data = [
    { nombre: "Maíz", ha: 205, lotes: 8, color: "#d9a538" },
    { nombre: "Soja", ha: 157, lotes: 6, color: "#4f9d52" },
    { nombre: "Trigo", ha: 64, lotes: 3, color: "#a88032" },
    { nombre: "Alfalfa", ha: 42, lotes: 2, color: "#9ecf8c" },
    { nombre: "Girasol", ha: 0, lotes: 0, color: "#e8b94a" },
    { nombre: "Trébol", ha: 0, lotes: 0, color: "#7bc77e" },
    { nombre: "En descanso", ha: 60, lotes: 2, color: "#d5d9d2" },
    { nombre: "Vacío", ha: 30, lotes: 1, color: "#e8e6e0" },
  ];
  const totalHa = 558;
  const getValue = (d) => mode === "ha" ? d.ha : mode === "lotes" ? d.lotes : Math.round(d.ha / totalHa * 100);
  const getLabel = (d) => mode === "ha" ? d.ha : mode === "lotes" ? d.lotes : `${Math.round(d.ha / totalHa * 100)}%`;
  const ytConfig = {
    ha:    { ticks: [0, 60, 120, 180, 240], max: 240, label: "Hectáreas" },
    lotes: { ticks: [0, 2, 4, 6, 8, 10],     max: 10,  label: "Lotes" },
    pct:   { ticks: [0, 10, 20, 30, 40],     max: 40,  label: "% del campo" },
  };
  const { ticks: yticks, max, label: axisLabel } = ytConfig[mode];
  const W = 1400, H = 260;
  const padL = 50, padR = 16, padT = 16, padB = 50;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const groupW = innerW / data.length;
  const barW = groupW * 0.55;

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        <defs>
          {data.map((d, i) => (
            <linearGradient key={i} id={`bg${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={d.color} stopOpacity="1"/>
              <stop offset="100%" stopColor={d.color} stopOpacity="0.7"/>
            </linearGradient>
          ))}
        </defs>
        {/* Grid lines */}
        {yticks.map((v, i) => {
          const y = padT + innerH * (1 - v / max);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--mc-line)" strokeDasharray={i === 0 ? "0" : "3,4"}/>
              <text x={padL - 10} y={y + 4} fontSize="11" fontFamily="var(--ff-mono)" fill="var(--mc-text-3)" textAnchor="end">{v}</text>
            </g>
          );
        })}
        <text x={padL - 36} y={padT + innerH / 2} fontSize="11" fontFamily="var(--ff-ui)" fill="var(--mc-text-3)" textAnchor="middle" transform={`rotate(-90, ${padL - 36}, ${padT + innerH / 2})`}>{axisLabel}</text>

        {data.map((d, i) => {
          const v = getValue(d);
          const gx = padL + i * groupW;
          const bx = gx + (groupW - barW) / 2;
          const bh = v > 0 ? (v / max) * innerH : 0;
          const by = padT + innerH - bh;
          return (
            <g key={d.nombre}>
              {v > 0 && (
                <>
                  <rect x={bx} y={by} width={barW} height={bh} fill={`url(#bg${i})`} rx="6" ry="6"/>
                  <rect x={bx} y={by} width={barW} height={4} fill={d.color} rx="6" ry="6" opacity="0.8"/>
                  <text x={bx + barW / 2} y={by - 8} fontSize="13" fontFamily="var(--ff-display)" fontWeight="700" fill="var(--mc-ink)" textAnchor="middle">{getLabel(d)}</text>
                </>
              )}
              {v === 0 && (
                <text x={bx + barW / 2} y={padT + innerH - 8} fontSize="11" fontFamily="var(--ff-mono)" fill="var(--mc-text-3)" textAnchor="middle">—</text>
              )}
              <text x={gx + groupW / 2} y={H - 24} fontSize="13" fontFamily="var(--ff-ui)" fontWeight="600" fill="var(--mc-text)" textAnchor="middle">{d.nombre}</text>
              <text x={gx + groupW / 2} y={H - 8} fontSize="11" fontFamily="var(--ff-mono)" fill="var(--mc-text-3)" textAnchor="middle">{d.ha > 0 ? `${Math.round(d.ha / 558 * 100)}%` : "0%"}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function UltimasActividadesCard({ onVerTodo }) {
  const activs = [
    { inicial: "S", color: "#5E8F78", quien: "Santiago", verb: "registró", obj: "20mm de lluvia", lote: "Lote 2", emoji: "🌧", time: "Hace 2 horas" },
    { inicial: "J", color: "#d9a538", quien: "Joaquin", verb: "finalizó", obj: "Siembra", lote: "Lote 1", emoji: "🌾", time: "Hace 5 horas" },
    { sistema: true, color: "#3f4443", quien: "Sistema", verb: "detectó", obj: "Alerta de Isoca", lote: "Lote 3", emoji: "🐛", time: "Ayer" },
    { inicial: "S", color: "#5E8F78", quien: "Santiago", verb: "cargó", obj: "Foto de Cultivo", lote: "Lote 4", emoji: "📷", time: "Ayer" },
    { inicial: "M", color: "#e7892b", quien: "Manuel", verb: "aplicó", obj: "Pulverización", lote: "Lote N1", emoji: "💧", time: "Hace 2 días" },
  ];
  return (
    <div className="mc-card">
      <div className="mc-card__head">
        <div className="mc-card__title">Ultimas Actividades</div>
        <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={onVerTodo} title="Ir al Timeline">Ver todo <Icon name="chevRight" size={13}/></button>
      </div>
      <div className="mc-actividades">
        {activs.map((a, i) => (
          <div key={i} className="mc-act-row">
            <div className="mc-act-row__avatar" style={{ background: a.color }}>
              {a.sistema ? <Icon name="bolt" size={14}/> : a.inicial}
            </div>
            <div className="mc-act-row__content">
              <div className="mc-act-row__text">
                <span style={{ color: "var(--mc-ink)", fontWeight: 500 }}>{a.quien}</span>
                {" "}{a.verb}{" "}
                <span style={{ color: "var(--mc-ink)", fontWeight: 600 }}>{a.obj}</span>
                {" "}en{" "}
                <span style={{ color: "var(--mc-ink)", fontWeight: 600 }}>{a.lote}</span>
                <span style={{ marginLeft: 6, fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif", fontSize: 14, lineHeight: 1, verticalAlign: "middle" }}>{a.emoji}</span>
              </div>
            </div>
            <div className="mc-act-row__time">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FocoRow({ nivel, titulo, lote, detail, icon }) {
  const { useState } = React;
  const [hover, setHover] = useState(false);
  const colors = {
    red: { bg: "var(--mc-red-bg)", fg: "var(--mc-red)" },
    orange: { bg: "var(--mc-orange-100)", fg: "var(--mc-orange-700)" },
    amber: { bg: "var(--mc-amber-bg)", fg: "var(--mc-amber)" },
    blue: { bg: "var(--mc-blue-bg)", fg: "var(--mc-blue)" },
  };
  const c = colors[nivel];
  return (
    <div
      className="row gap-10"
      role="button"
      tabIndex={0}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "10px 12px",
        border: `1px solid ${hover ? c.fg : "var(--mc-line)"}`,
        borderRadius: 10,
        background: hover ? c.bg : "transparent",
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
      }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: c.bg, color: c.fg, display: "grid", placeItems: "center", flex: "0 0 auto" }}>
        <Icon name={icon} size={15}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 13 }}>{titulo}</div>
        <div className="text-xs text-muted">{lote}</div>
        <div className="text-xs" style={{ color: c.fg, marginTop: 2 }}>{detail}</div>
      </div>
      <Icon name="chevRight" size={16}/>
    </div>
  );
}

/* ========== LOTES ========== */
function CDLotes({ selected, onSelect }) {
  const { useState } = React;
  const [view, setView] = useState("mapa");
  const [layer, setLayer] = useState("NDVI");
  const [showAgregar, setShowAgregar] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);

  return (
    <>
      {showAgregar && <AgregarCampoModal onClose={() => setShowAgregar(false)}/>}
      {showEliminar && <EliminarCampoModal onClose={() => setShowEliminar(false)}/>}

      <div className="grid g-cols-5">
        <KPI label="Total de campos" value="2" delta="Don Ramón + La Esperanza" trend="up" icon="map" accent/>
        <KPI label="Total de lotes" value="22" delta="+2 esta campaña" trend="up" icon="sprout"/>
        <KPI label="Total de hectáreas" value="558 Ha" delta="426 sembradas" trend="up" icon="activity"/>
        <KPI label="Lotes sin asignar" value="3" delta="Loma 1 + Oeste 3" trend="warn" icon="alert"/>
        <KPI label="Marcadores" value="14" delta="Pozos, silos, casas" trend="up" icon="target"/>
      </div>

      <div className="row gap-8" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <div className="row gap-8">
          <div className="mc-seg">
            <button className={view === "mapa" ? "is-on" : ""} onClick={() => { onSelect(null); setView("mapa"); }}><Icon name="map" size={13}/> Vista Mapa</button>
            <button className={view === "lista" ? "is-on" : ""} onClick={() => { onSelect(null); setView("lista"); }}><Icon name="list" size={13}/> Vista Lista</button>
          </div>
          <div className="mc-seg">
            <button className="is-on">Todos</button>
            <button>Don Ramón</button>
            <button>La Esperanza</button>
          </div>
        </div>
        <div className="row gap-8">
          <button className="mc-btn mc-btn--secondary mc-btn--sm"><Icon name="filter" size={13}/>Filtros</button>
          <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ color: "var(--mc-red)" }} onClick={() => setShowEliminar(true)}><Icon name="trash" size={13}/>Eliminar campo</button>
          <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={() => setShowAgregar(true)}><Icon name="plus" size={13}/>Agregar campo</button>
          <button className="mc-btn mc-btn--secondary mc-btn--sm"><Icon name="pen" size={13}/>Agregar Comentario</button>
          <button className="mc-btn mc-btn--primary mc-btn--sm"><Icon name="plus" size={13}/>Nuevo lote</button>
        </div>
      </div>

      {view === "mapa" && <LotesMapa selected={selected} onSelect={onSelect} layer={layer} onLayerChange={setLayer}/>}
      {view === "lista" && <LotesListaDetallada onSelect={onSelect}/>}
    </>
  );
}

function AgregarCampoModal({ onClose }) {
  const { useState } = React;
  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [tenencia, setTenencia] = useState("propio");
  const [valor, setValor] = useState("");
  const [moneda, setMoneda] = useState("USD/Ha");
  const [frecuencia, setFrecuencia] = useState("Anual");

  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #c0c5ce", background: "#fff", color: "var(--mc-ink)", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  const lbl = { fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".04em", display: "block" };

  const Section = ({ icon, title, children }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }}/>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,22,36,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: 620, maxWidth: "100%", maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "22px 28px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--mc-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Agricultura · Campo Digital · Lotes</div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--mc-ink)" }}>Crear Nuevo Establecimiento</h3>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 34, height: 34, cursor: "pointer", color: "#64748b", fontSize: 17, display: "grid", placeItems: "center", flexShrink: 0 }}>?</button>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 28px", overflowY: "auto", flex: 1 }}>

          <Section icon="📝" title="Datos del Establecimiento">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={lbl}>Nombre</label>
                  <input style={inp} placeholder="Ej: Campo La Arboleda" value={nombre} onChange={e => setNombre(e.target.value)}/>
                </div>
                <div>
                  <label style={lbl}>Ubicación</label>
                  <input style={inp} placeholder="Ej: Ruta 5, Km 40" value={ubicacion} onChange={e => setUbicacion(e.target.value)}/>
                </div>
              </div>
              <div>
                <label style={lbl}>Vista previa</label>
                <div style={{ height: 86, borderRadius: 8, border: "1.5px solid #c0c5ce", background: "linear-gradient(135deg, #d4e8d4 0%, #b8d9b8 40%, #9ecfa0 100%)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ position: "absolute", inset: 0, opacity: 0.3 }}>
                    {[0,1,2,3].map(i => <div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${i*33}%`, height: 1, background: "#4f9d52" }}/>)}
                    {[0,1,2,3].map(i => <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: `${i*33}%`, width: 1, background: "#4f9d52" }}/>)}
                  </div>
                  <div style={{ width: 20, height: 20, background: "#475569", borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", border: "3px solid white", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}/>
                </div>
              </div>
            </div>
          </Section>

          <Section icon="🤝" title="Régimen de Tenencia">
            <div style={{ display: "flex", gap: 8 }}>
              {[["propio","Propio"],["arrendado","Arrendado"]].map(([val, label]) => {
                const sel = tenencia === val;
                return (
                  <button key={val} onClick={() => setTenencia(val)}
                    style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: sel ? "2px solid var(--mc-green-600)" : "1.5px solid #c0c5ce",
                      background: sel ? "rgba(34,162,97,0.08)" : "#fff",
                      color: sel ? "var(--mc-green-600)" : "var(--mc-ink)",
                      fontWeight: sel ? 700 : 500, fontSize: 13, cursor: "pointer", transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    {sel && <span style={{ fontSize: 11, fontWeight: 900 }}>?</span>} {label}
                  </button>
                );
              })}
            </div>
          </Section>

          {tenencia === "arrendado" && (
            <Section icon="📄" title="Condiciones del Contrato (opcional)">
              <div style={{ display: "flex", gap: 8 }}>
                <input style={{ ...inp, width: 100, flexShrink: 0 }} type="number" placeholder="180" value={valor} onChange={e => setValor(e.target.value)}/>
                <select style={{ ...inp, flex: 1 }} value={moneda} onChange={e => setMoneda(e.target.value)}>
                  {["USD/Ha","UYU/Ha","ARS/Ha","USD total","UYU total","ARS total"].map(o => <option key={o}>{o}</option>)}
                </select>
                <select style={{ ...inp, flex: 1 }} value={frecuencia} onChange={e => setFrecuencia(e.target.value)}>
                  {["Anual","Semestral","Mensual"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button className="mc-btn mc-btn--secondary" onClick={onClose}>Cancelar</button>
          <button className="mc-btn mc-btn--primary" style={{ gap: 6 }}>
            <Icon name="map" size={14}/>Guardar y Dibujar
          </button>
        </div>
      </div>
    </div>
  );
}

function EliminarCampoModal({ onClose }) {
  const { useState } = React;
  const [campo, setCampo] = useState("Don Ramón");
  const [confirmado, setConfirmado] = useState(false);

  const campos = [
    { nombre: "Don Ramón", lotes: 12 },
    { nombre: "La Esperanza", lotes: 10 },
  ];
  const seleccionado = campos.find(c => c.nombre === campo) || campos[0];

  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #c0c5ce", background: "#fff", color: "var(--mc-ink)", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  const lbl = { fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".04em", display: "block" };

  const Section = ({ icon, title, children }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }}/>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,22,36,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: 500, maxWidth: "100%", maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }} onClick={e => e.stopPropagation()}>

        {/* Header gradient — danger */}
        <div style={{ background: "linear-gradient(135deg,#dc2626 0%,#7f1d1d 100%)", padding: "22px 28px 20px", color: "#fff", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 6, letterSpacing: ".06em", textTransform: "uppercase" }}>Acción irreversible</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 26 }}>⚠️</span> Eliminar Establecimiento
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Esta acción borrará todos los datos asociados</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, width: 34, height: 34, cursor: "pointer", color: "#fff", fontSize: 17, display: "grid", placeItems: "center", flexShrink: 0 }}>?</button>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 28px", overflowY: "auto", flex: 1 }}>

          <Section icon="🏞️" title="Establecimiento">
            <label style={lbl}>Seleccione el campo a eliminar</label>
            <select value={campo} onChange={e => { setCampo(e.target.value); setConfirmado(false); }} style={inp}>
              {campos.map(c => <option key={c.nombre}>{c.nombre}</option>)}
            </select>
          </Section>

          {/* Warning box */}
          <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "14px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#b91c1c", marginBottom: 4 }}>¡Acción irreversible!</div>
              <div style={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.5 }}>
                Al eliminar <strong>{campo}</strong>, se borrarán también sus{" "}
                <strong>{seleccionado.lotes} Lotes</strong>, el historial de lluvias y los registros de cosecha.
              </div>
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "var(--mc-ink)", padding: "10px 12px", background: "#f8fafc", borderRadius: 8, border: "1.5px solid #e2e8f0" }}>
            <input type="checkbox" checked={confirmado} onChange={e => setConfirmado(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#dc2626", cursor: "pointer" }}/>
            Soy consciente de que perderé los datos
          </label>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button className="mc-btn mc-btn--secondary" onClick={onClose}>Cancelar</button>
          <button disabled={!confirmado} className="mc-btn mc-btn--red">
            <Icon name="trash" size={14}/>Eliminar Definitivamente
          </button>
        </div>
      </div>
    </div>
  );
}

function LotesMapa({ selected, onSelect, layer, onLayerChange }) {
  const ndviScale = (v) => v >= 0.75 ? "#1f6e2a" : v >= 0.65 ? "#4f9d52" : v >= 0.55 ? "#a8d09c" : v >= 0.45 ? "#e1c069" : "#cf7a3a";
  const humScale  = (v) => v >= 80 ? "#1d4ed8" : v >= 65 ? "#3b82f6" : v >= 50 ? "#7ab4f0" : v >= 35 ? "#bcd9f4" : "#e8e6e0";
  const topoScale = (v) => v >= 220 ? "#5b3b1a" : v >= 180 ? "#8a5a2a" : v >= 140 ? "#b88c50" : v >= 110 ? "#d8b380" : "#ecd9b8";
  const lotesGeo = [
    { id: "L-01", points: "100,60 280,70 305,200 90,190",    cultivo: "#4f9d52", ndvi: 0.78, hum: 72, topo: 145, vacio: false },
    { id: "L-02", points: "305,200 90,190 80,310 295,320",   cultivo: "#5fae62", ndvi: 0.71, hum: 64, topo: 130, vacio: false },
    { id: "L-03", points: "305,75 540,90 555,230 305,200",   cultivo: "#d9a538", ndvi: 0.62, hum: 48, topo: 165, vacio: false },
    { id: "L-04", points: "555,230 305,200 295,320 545,340", cultivo: "#a88032", ndvi: 0.55, hum: 42, topo: 195, vacio: false },
    { id: "L-05", points: "545,340 295,320 290,440 540,460", cultivo: "#9ecf8c", ndvi: 0.68, hum: 58, topo: 210, vacio: false },
    { id: "L-06", points: "540,90 700,100 685,250 555,230",  cultivo: null,      ndvi: 0.42, hum: 30, topo: 240, vacio: true  },
    { id: "L-07", points: "685,250 540,230 540,360 690,380", cultivo: "#d9a538", ndvi: 0.74, hum: 68, topo: 175, vacio: false },
    { id: "L-08", points: "690,380 540,360 540,480 695,490", cultivo: "#5fae62", ndvi: 0.66, hum: 55, topo: 120, vacio: false },
  ];
  const fillFor = (l) => {
    if (layer === "Cultivos")    return l.vacio ? "url(#hatchVacio)" : l.cultivo;
    if (layer === "NDVI")        return ndviScale(l.ndvi);
    if (layer === "Humedad")     return humScale(l.hum);
    if (layer === "Topografía")  return topoScale(l.topo);
    return l.cultivo || "url(#hatchVacio)";
  };
  const legendByLayer = {
    Cultivos: [
      { color: "#4f9d52", label: "Soja" },
      { color: "#d9a538", label: "Maíz" },
      { color: "#a88032", label: "Trigo" },
      { color: "#9ecf8c", label: "Alfalfa" },
      { color: "rgba(10,61,26,0.18)", label: "En descanso" },
    ],
    NDVI: [
      { color: "#1f6e2a", label: "Muy alto (=0.75)" },
      { color: "#4f9d52", label: "Alto" },
      { color: "#a8d09c", label: "Medio" },
      { color: "#e1c069", label: "Bajo" },
      { color: "#cf7a3a", label: "Crítico (<0.45)" },
    ],
    Humedad: [
      { color: "#1d4ed8", label: "Saturado (=80%)" },
      { color: "#3b82f6", label: "Alto" },
      { color: "#7ab4f0", label: "Óptimo" },
      { color: "#bcd9f4", label: "Bajo" },
      { color: "#e8e6e0", label: "Seco (<35%)" },
    ],
    Topografía: [
      { color: "#5b3b1a", label: "=220 m" },
      { color: "#8a5a2a", label: "180–220" },
      { color: "#b88c50", label: "140–180" },
      { color: "#d8b380", label: "110–140" },
      { color: "#ecd9b8", label: "<110 m" },
    ],
  };
  const legend = legendByLayer[layer] || legendByLayer.Cultivos;
  return (
    <div className="grid" style={{ gridTemplateColumns: selected ? "360px 1fr" : "1fr", gap: 14, alignItems: "stretch" }}>
      {selected && <LoteFichaTecnica lote={selected} onClose={() => onSelect(null)}/>}

      <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--mc-line)" }}>
          <div className="row gap-8">
            <div className="mc-seg">
              {["NDVI","Cultivos","Humedad","Topografía"].map(l => (
                <button key={l} className={layer === l ? "is-on" : ""} onClick={() => onLayerChange && onLayerChange(l)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="row gap-4">
            <button className="mc-icon-btn"><Icon name="search" size={14}/></button>
            <button className="mc-icon-btn"><Icon name="download" size={14}/></button>
          </div>
        </div>
        <div className="mc-map" style={{ borderRadius: 0, border: "none", height: 600, position: "relative" }}>
          <div className="mc-map__grid"></div>
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="hatchVacio" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" stroke="#0a3d1a" strokeWidth="1" opacity="0.18"/>
              </pattern>
            </defs>
            {lotesGeo.map(p => {
              const isSel = selected?.id === p.id;
              return (
                <g key={p.id} style={{ cursor: "pointer" }} onClick={() => onSelect(DATA.lotes.find(l => l.id === p.id))}>
                  <polygon points={p.points} fill={fillFor(p)} stroke={isSel ? "#475569" : (p.vacio ? "#0a3d1a" : "#0a5a24")} strokeWidth={isSel ? 4 : 1.5} opacity={isSel ? 1 : 0.92}/>
                </g>
              );
            })}
            <text x="190" y="130" fontSize="13" fill="#0a3d1a" fontWeight="700" fontFamily="var(--ff-ui)">Norte 1</text>
            <text x="190" y="250" fontSize="13" fill="white" fontWeight="700" fontFamily="var(--ff-ui)">Norte 2</text>
            <text x="420" y="155" fontSize="13" fill="#0a3d1a" fontWeight="700" fontFamily="var(--ff-ui)">Este 1</text>
            <text x="420" y="270" fontSize="13" fill="#0a3d1a" fontWeight="700" fontFamily="var(--ff-ui)">Sur 1</text>
            <text x="420" y="395" fontSize="13" fill="#0a3d1a" fontWeight="700" fontFamily="var(--ff-ui)">Sur 2</text>
            <text x="610" y="170" fontSize="13" fill="#0a3d1a" fontWeight="700" fontFamily="var(--ff-ui)">Loma 1</text>
            <text x="610" y="320" fontSize="13" fill="#0a3d1a" fontWeight="700" fontFamily="var(--ff-ui)">Oeste 1</text>
            <text x="610" y="430" fontSize="13" fill="white" fontWeight="700" fontFamily="var(--ff-ui)">Oeste 2</text>
            <circle cx="200" cy="180" r="8" fill="#475569" stroke="white" strokeWidth="2.5"/>
            <text x="215" y="184" fontSize="10" fill="#0a3d1a" fontWeight="600">Pozo 1</text>
            <circle cx="500" cy="280" r="8" fill="#2c6bb8" stroke="white" strokeWidth="2.5"/>
            <text x="515" y="284" fontSize="10" fill="#0a3d1a" fontWeight="600">Silo</text>
            <rect x="680" y="60" width="14" height="14" fill="#1a1f1c" stroke="white" strokeWidth="2"/>
            <text x="700" y="72" fontSize="10" fill="#0a3d1a" fontWeight="600">Casa</text>
          </svg>

          <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(255,255,255,0.95)", padding: "10px 14px", borderRadius: 10, fontSize: 12, display: "flex", gap: 14, flexWrap: "wrap", boxShadow: "var(--sh-md)" }}>
            <div className="row gap-4"><span style={{ width: 12, height: 12, background: "#4f9d52", borderRadius: 3 }}></span>Soja</div>
            <div className="row gap-4"><span style={{ width: 12, height: 12, background: "#d9a538", borderRadius: 3 }}></span>Maíz</div>
            <div className="row gap-4"><span style={{ width: 12, height: 12, background: "#a88032", borderRadius: 3 }}></span>Trigo</div>
            <div className="row gap-4"><span style={{ width: 12, height: 12, background: "#9ecf8c", borderRadius: 3 }}></span>Alfalfa</div>
            <div className="row gap-4"><span style={{ width: 12, height: 12, background: "rgba(10,61,26,0.18)", borderRadius: 3 }}></span>En descanso</div>
          </div>

          <div style={{ position: "absolute", top: 12, right: 12, display: "flex", flexDirection: "column", gap: 4 }}>
            <button className="mc-icon-btn" style={{ background: "white", boxShadow: "var(--sh-sm)" }}><Icon name="plus" size={16}/></button>
            <button className="mc-icon-btn" style={{ background: "white", boxShadow: "var(--sh-sm)" }} title="Alejar"><Icon name="minus" size={16}/></button>
            <button className="mc-icon-btn" style={{ background: "white", boxShadow: "var(--sh-sm)" }} title="Centrar"><Icon name="target" size={16}/></button>
          </div>

          {!selected && (
            <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(26,31,28,0.85)", color: "white", padding: "8px 14px", borderRadius: 8, fontSize: 12 }}>
              Click en un lote para ver su ficha técnica
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Ficha técnica al estilo del Figma reference */
function LoteFichaTecnica({ lote, onClose }) {
  const { useState } = React;
  const [innerTab, setInnerTab] = useState("Resumen");
  const lluviasDays = [12, 25, 38, 28, 18, 14, 22];
  const maxLl = Math.max(...lluviasDays);

  return (
    <div className="mc-card" style={{ padding: 16, overflow: "hidden", display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
      <button onClick={onClose} className="mc-icon-btn" style={{ position: "absolute", top: 10, right: 10, border: "none" }}><Icon name="x" size={14}/></button>
      <div>
        <div className="mc-card__eyebrow" style={{ fontSize: 12 }}>Ficha Técnica del Lote</div>
        <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, color: "var(--mc-ink)", marginTop: 8 }}>{lote.id} · {lote.name.toUpperCase()}</div>
        <div className="row gap-8 mt-6 text-xs text-muted" style={{ alignItems: "center" }}>
          <span>{lote.ha} Has</span>
          <span>·</span>
          <span>🌱 {lote.cultivo} {lote.variety && lote.variety !== "—" ? lote.variety : "Tardío"}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexShrink: 0 }}>
            <span className={`mc-badge mc-badge--${lote.sano ? "green" : "orange"}`}>
              {lote.sano ? <Icon name="check" size={11}/> : <Icon name="alert" size={11}/>} {lote.sano ? "Saludable" : "Atención"}
            </span>
            <span className="mc-badge mc-badge--neutral"><Icon name="map" size={10}/>Propio</span>
          </div>
        </div>
      </div>

      <div className="row gap-2" style={{ borderBottom: "1px solid var(--mc-line)", padding: 0 }}>
        {["Resumen","Historial","Suelo","Labores"].map(t => (
          <button key={t}
            onClick={() => setInnerTab(t)}
            style={{ padding: "8px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: innerTab === t ? "var(--mc-green-700)" : "var(--mc-text-3)", borderBottom: innerTab === t ? "2px solid var(--mc-green-600)" : "2px solid transparent", marginBottom: -1 }}>
            {t}
          </button>
        ))}
      </div>

      {innerTab === "Resumen" && (
        <>
          <div className="grid g-cols-3 gap-8">
            <FichaChip icon="leaf" label="NDVI" value={lote.ndvi.toFixed(2)} arrow="up"/>
            <FichaChip icon="droplet" label="Agua Útil" value={`${lote.aguaUtil}%`} arrow="droplet"/>
            <FichaChip icon="sprout" label="Estadio" value="V6 (Veg)" small/>
          </div>

          <div style={{ padding: 12, border: "1px solid var(--mc-line)", borderRadius: 10 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>Clima Local (7 días)</div>
                <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, color: "var(--mc-ink)", marginTop: 2 }}>45mm</div>
                <div className="text-xs text-muted">Acumulados</div>
              </div>
              <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 56 }}>
                {lluviasDays.map((v, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <div style={{ width: 10, height: (v / maxLl) * 50, background: "var(--mc-blue)", borderRadius: 2 }}></div>
                    <div style={{ fontSize: 9, color: "var(--mc-text-3)" }}>{["L","M","M","J","V","S","D"][i]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: "10px 12px", background: "var(--mc-blue-bg)", border: "1px solid var(--mc-blue)", borderRadius: 10 }}>
            <div className="row gap-8">
              <Icon name="map" size={14} style={{ color: "var(--mc-blue)" }}/>
              <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>Comentario Georreferenciado</div>
            </div>
            <div className="text-xs text-muted mt-4">Sector bajo con encharcamiento tras la lluvia. Revisar drenaje. — Juan, 10/Oct</div>
          </div>

          <div style={{ padding: "10px 12px", background: "var(--mc-red-bg)", border: "1px solid var(--mc-red)", borderRadius: 10 }}>
            <div className="row gap-8">
              <Icon name="alert" size={14} style={{ color: "var(--mc-red)" }}/>
              <div className="font-semi text-sm" style={{ color: "var(--mc-red)" }}>Oruga Bolillera detectada</div>
              <span className="text-xs text-muted" style={{ marginLeft: "auto" }}>(Hace 2 días)</span>
            </div>
          </div>
        </>
      )}

      {innerTab === "Historial" && (
        <div className="col gap-8">
          <HistRow fecha="14/Abr" tipo="Pulverización" detail="Glifosato 3 L/Ha"/>
          <HistRow fecha="08/Abr" tipo="Fertilización" detail="Urea 120 kg/Ha"/>
          <HistRow fecha="22/Mar" tipo="Siembra" detail={`${lote.variety || "Var. estándar"} · 80 kpa`}/>
          <HistRow fecha="15/Mar" tipo="Análisis suelo" detail="pH 6.2 · MO 2.8%"/>
        </div>
      )}

      {innerTab === "Suelo" && (
        <div className="col gap-8">
          <SoilBar label="Nitrógeno (N)" value={60} color="var(--mc-amber)"/>
          <SoilBar label="Fósforo (P)" value={45} color="var(--mc-red)"/>
          <SoilBar label="Potasio (K)" value={80} color="var(--mc-green-500)"/>
          <div className="row gap-8 mt-8" style={{ fontSize: 13 }}>
            <div style={{ flex: 1, padding: 8, background: "var(--mc-surface-2)", borderRadius: 8 }}><div className="text-xs text-muted">pH</div><div className="font-semi">6.2</div></div>
            <div style={{ flex: 1, padding: 8, background: "var(--mc-surface-2)", borderRadius: 8 }}><div className="text-xs text-muted">MO</div><div className="font-semi">2.8%</div></div>
          </div>
        </div>
      )}

      {innerTab === "Labores" && (
        <div className="col gap-8">
          <HistRow fecha="22/Abr" tipo="Pulverización" detail="Programada · Cipermetrina"/>
          <HistRow fecha="28/Abr" tipo="Monitoreo" detail="Programado · Drone"/>
          <HistRow fecha="05/May" tipo="Cosecha est." detail="Lote E1 · Maíz"/>
        </div>
      )}

      <div className="row gap-8" style={{ marginTop: "auto" }}>
        <button className="mc-btn mc-btn--secondary mc-btn--sm flex-1"><Icon name="pen" size={13}/>Nota</button>
        <button className="mc-btn mc-btn--secondary mc-btn--sm flex-1"><Icon name="edit" size={13}/>Editar</button>
        <button className="mc-btn mc-btn--primary mc-btn--sm flex-1"><Icon name="plus" size={13}/>Nueva Tarea</button>
      </div>
    </div>
  );
}

function FichaChip({ icon, label, value, arrow, small }) {
  return (
    <div style={{ padding: 10, background: "var(--mc-surface-2)", borderRadius: 10, border: "1px solid var(--mc-line)" }}>
      <div className="row gap-4 text-xs text-muted" style={{ alignItems: "center" }}>
        <Icon name={icon} size={11}/>{label}:
      </div>
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        <span className="font-semi" style={{ color: "var(--mc-ink)", fontSize: small ? 13 : 16 }}>{value}</span>
        {arrow === "up" && <Icon name="arrowUp" size={12} style={{ color: "var(--mc-green-700)" }}/>}
        {arrow === "droplet" && <Icon name="droplet" size={12} style={{ color: "var(--mc-blue)" }}/>}
        {small && <span style={{ display: "flex", gap: 2 }}>
          <span style={{ width: 14, height: 4, background: "var(--mc-green-500)", borderRadius: 2 }}></span>
          <span style={{ width: 14, height: 4, background: "var(--mc-green-500)", borderRadius: 2 }}></span>
          <span style={{ width: 14, height: 4, background: "var(--mc-line)", borderRadius: 2 }}></span>
        </span>}
      </div>
    </div>
  );
}

function HistRow({ fecha, tipo, detail }) {
  return (
    <div className="row gap-12" style={{ padding: "8px 10px", border: "1px solid var(--mc-line)", borderRadius: 8 }}>
      <div className="font-mono text-xs text-muted" style={{ width: 50 }}>{fecha}</div>
      <div style={{ flex: 1 }}>
        <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{tipo}</div>
        <div className="text-xs text-muted">{detail}</div>
      </div>
    </div>
  );
}

function SoilBar({ label, value, color }) {
  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", fontSize: 12 }}>
        <span className="text-muted">{label}</span>
        <span className="font-mono font-semi">{value}%</span>
      </div>
      <div className="mc-prog mt-4"><div className="mc-prog__bar" style={{ width: `${value}%`, background: color }}></div></div>
    </div>
  );
}

/* Vista Lista detallada (estilo Figma de referencia con muchas columnas) */
function LotesListaDetallada({ onSelect }) {
  const { useState } = React;
  const [histLote, setHistLote] = React.useState(null);
  const rows = [
    { id: "L-04", campo: "Estancia La Soñada", lote: "Lote 4 - El Bajo", ha: 125, cultivo: "Maíz Tardío", estadio: "V6 - Vegetativo", genetica: "DK-7210", finPct: 65, finUSD: "$260 / $400 USD", finDisp: "$140/Ha", ndvi: "Alto", ndviTrend: "up", agua: 60, plaga: "Isoca Medidora", riesgo: "Alta", riesgoColor: "red", riesgoVal: "15/m²", visita: "Hace 2 días", monitor: "Pendiente", proy: "9.5 Tn/Ha", proyDelta: "+5% vs Prom", proyFecha: "15/Mar" },
    { id: "L-07", campo: "Estancia El Refugio", lote: "Lote 7 - La Loma", ha: 90, cultivo: "Soja de Primera", estadio: "R3 - Form. Vainas", genetica: "DM-40R", finPct: 85, finUSD: "$200 / $235 USD", finDisp: "$35/Ha", ndvi: "Medio", ndviTrend: "flat", agua: 45, plaga: "Chinche Verde", riesgo: "Media", riesgoColor: "amber", riesgoVal: "2/m²", visita: "Hace 5 días", monitor: "Vigilancia", proy: "3.2 Tn/Ha", proyDelta: "-2% vs Prom", proyFecha: "20/Abr", neg: true },
    { id: "L-02", campo: "Estancia Los Molinos", lote: "Lote 2 - El Canal", ha: 180, cultivo: "Trigo Ciclo Largo", estadio: "Z31 - Primer Nudo", genetica: "BIO-INTA 300", finPct: 40, finUSD: "$150 / $380 USD", finDisp: "$230/Ha", ndvi: "Muy Alto", ndviTrend: "up", agua: 75, plaga: "Sin Plagas/Enf.", riesgo: "Nula", riesgoColor: "green", riesgoVal: "0/m²", visita: "Ayer", monitor: "OK - Saludable", proy: "5.1 Tn/Ha", proyDelta: "+8% vs Prom", proyFecha: "10/Dic" },
    { id: "L-08", campo: "Estancia El Refugio", lote: "Lote 8 - El Norte", ha: 75, cultivo: "Soja de Primera", estadio: "R2 - Floración", genetica: "NA-5009", finPct: 80, finUSD: "$190 / $235 USD", finDisp: "$45/Ha", ndvi: "Medio", ndviTrend: "down", agua: 38, plaga: "Pulgón Verde", riesgo: "Alta", riesgoColor: "red", riesgoVal: "20/m²", visita: "Hoy", monitor: "Acción inmediata", proy: "3.0 Tn/Ha", proyDelta: "-5% vs Prom", proyFecha: "20/Abr", neg: true },
    { id: "L-05", campo: "Estancia La Soñada", lote: "Lote 5 - Sur", ha: 110, cultivo: "Girasol", estadio: "R5 - Llenado Grano", genetica: "P245", finPct: 70, finUSD: "$220 / $315 USD", finDisp: "$95/Ha", ndvi: "Alto", ndviTrend: "up", agua: 58, plaga: "Sin Plagas/Enf.", riesgo: "Nula", riesgoColor: "green", riesgoVal: "0/m²", visita: "Hace 3 días", monitor: "OK - Saludable", proy: "2.8 Tn/Ha", proyDelta: "+4% vs Prom", proyFecha: "05/May" },
  ];

  return (
    <>
    {histLote && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "grid", placeItems: "center" }} onClick={() => setHistLote(null)}>
        <div style={{ background: "var(--mc-surface)", borderRadius: 14, padding: 24, width: 420, maxWidth: "90vw", boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div className="mc-card__eyebrow">Timeline del Lote</div>
              <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 16, marginTop: 2 }}>{histLote.lote}</div>
            </div>
            <button className="mc-icon-btn" onClick={() => setHistLote(null)}><Icon name="x" size={14}/></button>
          </div>
          <div style={{ position: "relative", paddingLeft: 22 }}>
            <div style={{ position: "absolute", left: 9, top: 4, bottom: 4, width: 2, background: "var(--mc-line)" }}></div>
            {[
              { fecha: "18/Abr", tipo: "Pulverización", detail: "Glifosato 3 L/Ha · J. Pérez", color: "var(--mc-orange-500)", icon: "flask" },
              { fecha: "10/Abr", tipo: "Fertilización", detail: "Urea 120 kg/Ha", color: "var(--mc-amber)", icon: "leaf" },
              { fecha: "22/Mar", tipo: "Siembra", detail: `${histLote.genetica} · 80 kpa`, color: "var(--mc-green-500)", icon: "sprout" },
              { fecha: "15/Mar", tipo: "Análisis suelo", detail: "pH 6.2 · MO 2.8%", color: "var(--mc-blue)", icon: "activity" },
              { fecha: "02/Mar", tipo: "Labranza", detail: "Cincel vibratorio · 25 cm", color: "var(--mc-text-2)", icon: "wrench" },
            ].map((ev, i) => (
              <div key={i} style={{ position: "relative", paddingBottom: i < 4 ? 14 : 0, paddingLeft: 8 }}>
                <div style={{ position: "absolute", left: -13, top: 2, width: 20, height: 20, borderRadius: "50%", background: ev.color, color: "white", display: "grid", placeItems: "center", border: "2px solid var(--mc-surface)" }}>
                  <Icon name={ev.icon} size={10}/>
                </div>
                <div className="font-mono text-xs" style={{ color: "var(--mc-text-3)" }}>{ev.fecha}</div>
                <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{ev.tipo}</div>
                <div className="text-xs text-muted">{ev.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="mc-lotes-list">
        <div className="mc-lotes-list__head">
          <div>Identidad</div>
          <div>Cultivo</div>
          <div>Finanzas</div>
          <div>Salud</div>
          <div>Monitoreo</div>
          <div>Proyección</div>
          <div>Acciones</div>
        </div>
        {rows.map((r, i) => {
          const cropEmoji = r.cultivo.includes("Maíz") ? "🌽" : r.cultivo.includes("Soja") ? "🌱" : r.cultivo.includes("Trigo") ? "🌾" : r.cultivo.includes("Girasol") ? "🌻" : "🌿";
          return (
            <div key={i} className="mc-lotes-list__row" onClick={() => onSelect({ id: r.id, name: r.lote.replace(/^Lote \d+ - /, ""), ha: r.ha, cultivo: r.cultivo.split(" ")[0], variety: r.genetica, ndvi: r.ndvi === "Muy Alto" ? 0.85 : r.ndvi === "Alto" ? 0.75 : r.ndvi === "Medio" ? 0.55 : 0.4, aguaUtil: r.agua, sano: r.riesgo === "Nula", estado: r.estadio, agua: `${r.agua}%`, progress: r.finPct, campo: r.campo })}>
              <div>
                <div className="text-xs text-muted" style={{ textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>{r.campo}</div>
                <div className="row gap-4 mt-4" style={{ alignItems: "center" }}>
                  <span style={{ color: "var(--mc-red)", fontSize: 14 }}>❗</span>
                  <span className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 14 }}>{r.lote}</span>
                </div>
                <div className="text-xs text-muted mt-4">{r.ha} Hectáreas</div>
              </div>
              <div>
                <div className="row gap-4" style={{ alignItems: "center" }}>
                  <span style={{ fontSize: 16 }}>{cropEmoji}</span>
                  <span className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{r.cultivo}</span>
                </div>
                <span className="mc-badge mc-badge--neutral mt-4" style={{ fontSize: 10 }}>[ {r.estadio} ]</span>
                <div className="text-xs text-muted mt-4">🧬 Genética: {r.genetica}</div>
              </div>
              <div>
                <div className="row" style={{ justifyContent: "flex-end", fontSize: 11, color: "var(--mc-text-3)" }}>{r.finPct}%</div>
                <div className="mc-prog mt-2"><div className="mc-prog__bar" style={{ width: `${r.finPct}%`, background: "var(--mc-blue)" }}></div></div>
                <div className="text-xs mt-4" style={{ color: "var(--mc-ink)", fontWeight: 500 }}>{r.finUSD}</div>
                <div className="text-xs mt-2" style={{ color: "var(--mc-green-700)", fontWeight: 600 }}>Disp: {r.finDisp}</div>
              </div>
              <div>
                <div className="row gap-4" style={{ alignItems: "center", fontSize: 12 }}>
                  <Icon name="check" size={11} style={{ color: "var(--mc-green-700)" }}/>
                  <span className="font-semi" style={{ color: "var(--mc-ink)" }}>NDVI {r.ndvi}</span>
                  {r.ndviTrend === "up" && <Icon name="arrowUp" size={10} style={{ color: "var(--mc-green-700)" }}/>}
                  {r.ndviTrend === "down" && <Icon name="arrowDown" size={10} style={{ color: "var(--mc-red)" }}/>}
                </div>
                <div className="row gap-4 mt-4" style={{ alignItems: "center", fontSize: 12 }}>
                  <Icon name="droplet" size={11} style={{ color: "var(--mc-blue)" }}/>
                  <span className="text-muted">Agua: {r.agua}%</span>
                </div>
                <div className="text-xs text-muted mt-4">📅 Visita: {r.visita}</div>
              </div>
              <div>
                <div className="row gap-4" style={{ alignItems: "center", fontSize: 12 }}>
                  <span style={{ fontSize: 12 }}>🌾</span>
                  <span className="font-semi text-xs" style={{ color: "var(--mc-ink)" }}>{r.plaga}</span>
                </div>
                <div className="row gap-4 mt-4" style={{ alignItems: "center", fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.riesgoColor === "red" ? "var(--mc-red)" : r.riesgoColor === "amber" ? "var(--mc-amber)" : "var(--mc-green-500)" }}></span>
                  <span className="font-semi text-xs" style={{ color: r.riesgoColor === "red" ? "var(--mc-red)" : r.riesgoColor === "amber" ? "var(--mc-amber)" : "var(--mc-green-700)" }}>{r.riesgo} ({r.riesgoVal})</span>
                </div>
                <span className={`mc-badge mt-4 ${r.monitor.includes("OK") ? "mc-badge--green" : r.monitor.includes("Vigilancia") ? "mc-badge--amber" : r.monitor.includes("Pendiente") ? "mc-badge--amber" : "mc-badge--red"}`} style={{ fontSize: 10 }}>
                  {r.monitor.includes("OK") ? "?" : "?"} {r.monitor}
                </span>
              </div>
              <div>
                <div style={{ fontFamily: "var(--ff-display)", fontSize: 18, color: "var(--mc-ink)" }}>{r.proy}</div>
                <div className="text-xs mt-2" style={{ color: r.neg ? "var(--mc-red)" : "var(--mc-green-700)", fontWeight: 600 }}>
                  {r.neg ? <Icon name="arrowDown" size={10}/> : <Icon name="arrowUp" size={10}/>} {r.proyDelta}
                </div>
                <div className="text-xs text-muted mt-4">📅 Est: {r.proyFecha}</div>
              </div>
              <div className="col gap-4" onClick={(e) => e.stopPropagation()}>
                <button className="mc-btn mc-btn--primary mc-btn--sm" style={{ padding: "4px 10px", fontSize: 11 }}><Icon name="plus" size={11}/>Tarea</button>
                <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ padding: "4px 10px", fontSize: 11, justifyContent: "flex-start" }} onClick={() => setHistLote(r)}><Icon name="activity" size={11}/>Historial</button>
                <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ padding: "4px 10px", fontSize: 11, justifyContent: "flex-start", color: "var(--mc-green-700)" }}>? Ver</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
}

/* ========== NUEVA LABOR MODAL ========== */
function NuevaLaborModal({ onClose }) {
  const { useState } = React;
  const [step, setStep] = useState(1);
  const [priority, setPriority] = useState("normal");
  const [actividadSel, setActividadSel] = useState("Enrollado");
  const [actSearch, setActSearch] = useState("");
  const [lotesCheck, setLotesCheck] = useState({ "Lote 4 - La Loma": true, "Lote 5 - El Bajo": true, "Lote 6 - Norte": false });
  const [operario, setOperario] = useState("Marco González");
  const [tractor, setTractor] = useState("John Deere 7230R");
  const [implemento, setImplemento] = useState("Sembradora Pla 5TC");
  const [presHid, setPresHid] = useState("210");
  const [diamRollo, setDiamRollo] = useState("1.50");
  const [nucleo, setNucleo] = useState("Blando");
  const [atado, setAtado] = useState("Red");
  const [vueltasRed, setVueltasRed] = useState("2.5");
  const [numRed, setNumRed] = useState("20");
  const [picadoOn, setPicadoOn] = useState(true);
  const [cuchillas, setCuchillas] = useState("12");
  // Pulverización
  const [presPulv, setPresPulv] = useState("3.5");
  const [caudal, setCaudal] = useState("120");
  const [velocidad, setVelocidad] = useState("18");
  const [anchoBanda, setAnchoBanda] = useState("21");
  const [boquilla, setBoquilla] = useState("Abanico Plano");
  // Siembra
  const [densSiembra, setDensSiembra] = useState("80000");
  const [profSiembra, setProfSiembra] = useState("3.5");
  const [distLineas, setDistLineas] = useState("52.5");
  // Fertilización / Riego
  const [dosisFert, setDosisFert] = useState("180");
  const [tipoFert, setTipoFert] = useState("Sólida");
  const [laminaRiego, setLaminaRiego] = useState("12");
  const [insumoSearch, setInsumoSearch] = useState("");
  const [insumosAgregados, setInsumosAgregados] = useState([
    { nombre: "Maíz Híbrido DK 7272", tipo: "semilla", stock: "En Galpón: 320 Bolsas", dosis: "80.000", unidad: "Sam/Ha", icono: "sprout", color: "#4f9d52" },
    { nombre: "Starter Fosforado", tipo: "fertilizante", stock: "Stock Crítico", dosis: "100", unidad: "L/Ha", icono: "flask", color: "#e89a23" },
  ]);
  const [insumoSearchResults] = useState([
    { nombre: "Urea Granulada", stock: "25.000 kg · Disp.", tipo: "fertilizante" },
    { nombre: "Urea Líquida (UAN)", stock: "0 kg · Sin Stock", tipo: "fertilizante" },
  ]);

  const STEPS = [
    { n: 1, label: "Selección de Actividad" },
    { n: 2, label: "Lote y Superficie" },
    { n: 3, label: "Maquinaria y RRHH" },
    { n: 4, label: "Configuración Técnica" },
    { n: 5, label: "Insumos" },
    { n: 6, label: "Resumen y Costos" },
  ];

  const ACTIVIDADES = {
    "Siembra & Plantación": ["Directa Fina","Directa Gruesa","Video/Cobertura","Re-siembra"],
    "Labranza": ["Arado","Rastrillado","Subsuelo","Nivelación"],
    "Forrajes y Reservas": ["Corte/Segado","Enfardado Prim.","Enrollado","Picado/Silaje"],
    "Protección & Nutrición": ["Pulverización","Fertilización","Riego","Bioestimulante"],
  };
  const ACT_ICONS = {
    "Directa Fina":"sprout","Directa Gruesa":"sprout","Video/Cobertura":"leaf","Re-siembra":"sprout",
    "Arado":"tool","Rastrillado":"tool","Subsuelo":"tool","Nivelación":"tool",
    "Corte/Segado":"scissors","Enfardado Prim.":"package","Enrollado":"refresh-cw","Picado/Silaje":"zap",
    "Pulverización":"flask","Fertilización":"droplet","Riego":"droplet","Bioestimulante":"leaf",
  };

  const toggleLote = (k) => setLotesCheck(p => ({ ...p, [k]: !p[k] }));
  const addInsumo = (ins) => {
    if (!insumosAgregados.find(i => i.nombre === ins.nombre)) {
      setInsumosAgregados(p => [...p, { nombre: ins.nombre, tipo: ins.tipo, stock: ins.stock, dosis: "100", unidad: "kg/Ha", icono: "flask", color: "#2c7ad9" }]);
    }
    setInsumoSearch("");
  };
  const removeInsumo = (nombre) => setInsumosAgregados(p => p.filter(i => i.nombre !== nombre));

  const haNeta = Object.entries(lotesCheck).filter(([,v])=>v).reduce((a,[k])=>{
    const has = k.includes("La Loma") ? 75 : k.includes("El Bajo") ? 50 : 110;
    return a + has;
  }, 0);

  const costoTotal = insumosAgregados.reduce((a,i) => a + parseFloat(i.dosis||0) * haNeta * 0.04, 0) + haNeta * 12;

  const gBorder = "1.5px solid #c0c5ce";
  const sStyle = { position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center" };
  const mStyle = { background:"var(--mc-surface)",borderRadius:14,width:900,maxHeight:"88vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,.35)" };

  return (
    <div style={sStyle} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={mStyle}>
        {/* Header */}
        <div style={{ padding:"16px 24px",borderBottom:"1px solid var(--mc-border)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
          <div>
            <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:2 }}>Agricultura / Campo Digital › Labores</div>
            <div style={{ fontSize:18,fontWeight:700,color:"var(--mc-ink)" }}>Nueva Orden de Labor #4031</div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <span style={{ fontSize:12,color:"var(--mc-text-3)" }}>Prioridad</span>
            <div style={{ display:"flex",borderRadius:6,overflow:"hidden",border:"1px solid var(--mc-border)" }}>
              <button onClick={()=>setPriority("normal")} style={{ padding:"4px 12px",fontSize:12,fontWeight:600,border:"none",cursor:"pointer",background:priority==="normal"?"var(--mc-green-600)":"var(--mc-surface)",color:priority==="normal"?"#fff":"var(--mc-text-3)" }}>Normal</button>
              <button onClick={()=>setPriority("urgente")} style={{ padding:"4px 12px",fontSize:12,fontWeight:700,border:"none",cursor:"pointer",background:priority==="urgente"?"#dc2626":"var(--mc-surface)",color:priority==="urgente"?"#fff":"var(--mc-text-3)" }}>⚡ Urgente</button>
            </div>
            <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",fontSize:18,color:"var(--mc-text-3)",padding:"0 4px" }}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display:"flex",flex:1,overflow:"hidden" }}>
          {/* Left sidebar steps */}
          <div style={{ width:210,borderRight:"1px solid var(--mc-border)",padding:"20px 0",flexShrink:0,background:"var(--mc-surface-2)" }}>
            {STEPS.map(s => {
              const done = s.n < step;
              const active = s.n === step;
              return (
                <div key={s.n} onClick={()=>done&&setStep(s.n)} style={{ padding:"10px 20px",cursor:done?"pointer":"default",display:"flex",alignItems:"flex-start",gap:10,background:active?"var(--mc-surface)":"transparent",borderRight:active?"3px solid var(--mc-green-600)":"3px solid transparent" }}>
                  <div style={{ width:22,height:22,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,
                    background:done?"var(--mc-green-600)":active?"var(--mc-green-600)":"var(--mc-border)",
                    color:done||active?"#fff":"var(--mc-text-3)" }}>
                    {done ? "?" : s.n}
                  </div>
                  <div>
                    <div style={{ fontSize:12,fontWeight:active||done?600:400,color:active?"var(--mc-ink)":done?"var(--mc-green-700)":"var(--mc-text-3)" }}>{s.label}</div>
                    {done && <div style={{ fontSize:10,color:"var(--mc-green-600)",marginTop:1 }}>Completado</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step content */}
          <div style={{ flex:1,overflow:"auto",padding:24 }}>

            {/* STEP 1 — Selección de Actividad */}
            {step === 1 && (
              <div className="col gap-16">
                <div className="row" style={{ justifyContent:"space-between",alignItems:"center" }}>
                  <div style={{ fontSize:16,fontWeight:700,color:"var(--mc-ink)" }}>Seleccione la Actividad a Realizar</div>
                  <input value={actSearch} onChange={e=>setActSearch(e.target.value)} placeholder="Buscar tarea..." style={{ padding:"6px 12px",borderRadius:7,border:"1px solid var(--mc-border)",fontSize:12,width:180,background:"var(--mc-surface)" }}/>
                </div>
                {Object.entries(ACTIVIDADES).map(([cat, acts]) => (
                  <div key={cat}>
                    <div style={{ fontSize:11,fontWeight:700,color:"var(--mc-text-3)",textTransform:"uppercase",letterSpacing:.8,marginBottom:8 }}>{cat}</div>
                    <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
                      {acts.filter(a=>!actSearch||a.toLowerCase().includes(actSearch.toLowerCase())).map(act => (
                        <button key={act} onClick={()=>setActividadSel(act)} style={{
                          padding:"10px 14px",borderRadius:8,border:`2px solid ${actividadSel===act?"var(--mc-green-600)":"#c0c5ce"}`,
                          background:actividadSel===act?"rgba(79,157,82,.1)":"var(--mc-surface)",
                          cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6,minWidth:90,
                          color:actividadSel===act?"var(--mc-green-700)":"var(--mc-ink)" }}>
                          <Icon name={ACT_ICONS[act]||"activity"} size={20} color={actividadSel===act?"var(--mc-green-600)":"var(--mc-text-3)"}/>
                          <span style={{ fontSize:11,fontWeight:600,textAlign:"center",lineHeight:1.2 }}>{act}</span>
                          {actividadSel===act && <span style={{ fontSize:9,background:"var(--mc-green-600)",color:"#fff",borderRadius:4,padding:"1px 6px" }}>?</span>}
                        </button>
                      ))}
                      <button style={{ padding:"10px 14px",borderRadius:8,border:"2px dashed var(--mc-border)",background:"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6,minWidth:90,color:"var(--mc-text-3)" }}>
                        <Icon name="plus" size={20}/>
                        <span style={{ fontSize:11,textAlign:"center",lineHeight:1.2 }}>Crear Nuevo Tipo de Labor</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STEP 2 — Lote y Superficie */}
            {step === 2 && (
              <div className="col gap-16">
                <div>
                  <div style={{ fontSize:16,fontWeight:700,color:"var(--mc-ink)" }}>Selección de Lotes Objetivo</div>
                  <div style={{ fontSize:12,color:"var(--mc-text-3)" }}>Superficie Total Seleccionada: <strong>{haNeta} Has</strong></div>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1.4fr",gap:16 }}>
                  {/* Left: lote list */}
                  <div className="col gap-8">
                    <select style={{ padding:"6px 10px",borderRadius:7,border:"1px solid var(--mc-border)",fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)",marginBottom:4 }}>
                      <option>Filtrar por Campo</option>
                      <option>Don Ramón</option>
                      <option>La Esperanza</option>
                    </select>
                    {Object.entries(lotesCheck).map(([k,v])=>{
                      const has = k.includes("La Loma")?75:k.includes("El Bajo")?50:110;
                      const cultivo = k.includes("La Loma")?"Rastrojo de Maíz":k.includes("El Bajo")?"Barbecho Químico":"Cultivo en Pie";
                      const cultivoColor = k.includes("La Loma")?"#4f9d52":k.includes("El Bajo")?"#e89a23":"#2c7ad9";
                      return (
                        <div key={k} onClick={()=>toggleLote(k)} style={{ padding:"10px 12px",borderRadius:8,border:`2px solid ${v?"var(--mc-green-600)":"#c0c5ce"}`,background:v?"rgba(79,157,82,.05)":"var(--mc-surface)",cursor:"pointer" }}>
                          <div className="row" style={{ gap:8,alignItems:"center" }}>
                            <div style={{ width:16,height:16,borderRadius:4,border:`2px solid ${v?"var(--mc-green-600)":"#c0c5ce"}`,background:v?"var(--mc-green-600)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                              {v && <span style={{ color:"#fff",fontSize:10,fontWeight:700 }}>?</span>}
                            </div>
                            <div>
                              <div style={{ fontSize:12,fontWeight:600,color:"var(--mc-ink)" }}>{k} ({has} Ha)</div>
                              <span style={{ fontSize:10,padding:"1px 8px",borderRadius:20,background:`${cultivoColor}22`,color:cultivoColor,fontWeight:600 }}>{cultivo}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Right: pseudo-map + summary */}
                  <div>
                    <div style={{ height:200,borderRadius:10,background:"linear-gradient(135deg,#2d5a27 0%,#3d7a35 30%,#4a8f40 50%,#2d5a27 70%,#8b7355 100%)",position:"relative",overflow:"hidden",marginBottom:12 }}>
                      <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
                        <svg width="100%" height="100%" viewBox="0 0 300 200" style={{ opacity:.7 }}>
                          <polygon points="60,40 200,30 220,120 80,130" fill="rgba(79,157,82,.6)" stroke="#4f9d52" strokeWidth={2}/>
                          <text x="120" y="85" fill="#fff" fontSize="10" fontWeight="bold">Lote 4 - La Loma</text>
                          <polygon points="130,140 250,130 260,180 120,185" fill="rgba(232,154,35,.6)" stroke="#e89a23" strokeWidth={2}/>
                          <text x="170" y="165" fill="#fff" fontSize="10" fontWeight="bold">Lote 5 - El Bajo</text>
                          <ellipse cx="80" cy="170" rx="30" ry="15" fill="rgba(44,130,201,.3)" stroke="#2c82c9" strokeWidth={1.5} strokeDasharray="4,3"/>
                          <text x="42" y="175" fill="#7dd3fc" fontSize="9">Zona Exclusión</text>
                        </svg>
                      </div>
                    </div>
                    <div style={{ background:"var(--mc-surface)",borderRadius:8,border:"1px solid var(--mc-border)",padding:"12px 14px" }}>
                      <div className="row" style={{ justifyContent:"space-between",marginBottom:6 }}>
                        <span style={{ fontSize:12,color:"var(--mc-text-3)" }}>Área Bruta:</span>
                        <span style={{ fontSize:12,fontWeight:600,color:"var(--mc-ink)" }}>{haNeta + 5} Ha</span>
                      </div>
                      <div className="row" style={{ justifyContent:"space-between",marginBottom:8 }}>
                        <span style={{ fontSize:12,color:"var(--mc-text-3)" }}>Exclusiones:</span>
                        <span style={{ fontSize:12,fontWeight:600,color:"var(--mc-red)" }}>-5 Ha</span>
                      </div>
                      <div style={{ borderTop:"2px solid var(--mc-border)",paddingTop:8 }}>
                        <div className="row" style={{ justifyContent:"space-between" }}>
                          <span style={{ fontSize:13,fontWeight:700,color:"var(--mc-ink)" }}>Área Neta Laborable:</span>
                          <span style={{ fontSize:15,fontWeight:800,color:"var(--mc-green-700)" }}>{haNeta} Ha</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 — Maquinaria y RRHH */}
            {step === 3 && (
              <div className="col gap-16">
                <div style={{ fontSize:16,fontWeight:700,color:"var(--mc-ink)" }}>Asignación de Recursos y Personal</div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14 }}>
                  {/* Operario */}
                  <div style={{ background:"var(--mc-surface)",borderRadius:10,border:gBorder,padding:14 }}>
                    <div style={{ fontSize:11,fontWeight:700,color:"var(--mc-text-3)",textTransform:"uppercase",marginBottom:10 }}>1. Operario</div>
                    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:8 }}>
                      <div style={{ width:52,height:52,borderRadius:"50%",background:"var(--mc-green-600)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:"#fff" }}>MG</div>
                      <select value={operario} onChange={e=>setOperario(e.target.value)} style={{ width:"100%",padding:"6px 8px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}>
                        <option>Marco González</option>
                        <option>Juan Pérez</option>
                        <option>C. López</option>
                      </select>
                      <div style={{ width:"100%",padding:"8px 10px",borderRadius:8,background:"rgba(232,154,35,.12)",border:"1px solid rgba(232,154,35,.3)" }}>
                        <div style={{ fontSize:11,fontWeight:700,color:"#e89a23" }}>? Turno difícil acumulado</div>
                        <div style={{ fontSize:10,color:"var(--mc-text-3)",marginTop:2 }}>Lleva 6.5h en turno actual</div>
                      </div>
                    </div>
                  </div>
                  {/* Tractor */}
                  <div style={{ background:"var(--mc-surface)",borderRadius:10,border:gBorder,padding:14 }}>
                    <div style={{ fontSize:11,fontWeight:700,color:"var(--mc-text-3)",textTransform:"uppercase",marginBottom:10 }}>2. Equipo de Tracción</div>
                    <select value={tractor} onChange={e=>setTractor(e.target.value)} style={{ width:"100%",padding:"6px 8px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)",marginBottom:10 }}>
                      <option>John Deere 7230R</option>
                      <option>John Deere 6J 155</option>
                      <option>New Holland T6</option>
                    </select>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                      <div style={{ background:"var(--mc-surface-2)",borderRadius:8,padding:"8px 10px" }}>
                        <div style={{ fontSize:10,color:"var(--mc-text-3)",marginBottom:4 }}>Combustible</div>
                        <div style={{ height:6,borderRadius:3,background:"var(--mc-border)",overflow:"hidden" }}>
                          <div style={{ height:"100%",width:"80%",background:"var(--mc-green-600)",borderRadius:3 }}></div>
                        </div>
                        <div style={{ fontSize:12,fontWeight:700,color:"var(--mc-ink)",marginTop:3 }}>80%</div>
                      </div>
                      <div style={{ background:"var(--mc-surface-2)",borderRadius:8,padding:"8px 10px" }}>
                        <div style={{ fontSize:10,color:"var(--mc-text-3)" }}>Horas Motor</div>
                        <div style={{ fontSize:14,fontWeight:700,color:"var(--mc-ink)",marginTop:4 }}>4200h</div>
                      </div>
                    </div>
                    <div style={{ marginTop:8,padding:"6px 10px",borderRadius:7,background:"rgba(79,157,82,.08)",border:"1px solid rgba(79,157,82,.2)" }}>
                      <span style={{ fontSize:11,color:"var(--mc-green-700)",fontWeight:600 }}>? Disponible</span>
                    </div>
                  </div>
                  {/* Implemento */}
                  <div style={{ background:"var(--mc-surface)",borderRadius:10,border:gBorder,padding:14 }}>
                    <div style={{ fontSize:11,fontWeight:700,color:"var(--mc-text-3)",textTransform:"uppercase",marginBottom:10 }}>3. Implemento</div>
                    <select value={implemento} onChange={e=>setImplemento(e.target.value)} style={{ width:"100%",padding:"6px 8px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)",marginBottom:10 }}>
                      <option>Sembradora Pla 5TC</option>
                      <option>Enfardadora Krone</option>
                      <option>Pulverizador Metalfor</option>
                    </select>
                    <div style={{ background:"var(--mc-surface-2)",borderRadius:8,padding:"8px 10px",marginBottom:8 }}>
                      <div style={{ fontSize:11,fontWeight:600,color:"var(--mc-ink)" }}>Config: 16 líneas a 52cm</div>
                      <div style={{ fontSize:10,color:"var(--mc-text-3)" }}>Ancho efectivo: 8.32m</div>
                    </div>
                    <div style={{ padding:"6px 10px",borderRadius:7,background:"rgba(79,157,82,.08)",border:"1px solid rgba(79,157,82,.2)" }}>
                      <span style={{ fontSize:11,color:"var(--mc-green-700)",fontWeight:600 }}>? Compatible con Tractor</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4 — Configuración Técnica */}
            {step === 4 && (
              <div className="col gap-14">
                <div className="row" style={{ justifyContent:"space-between",alignItems:"center" }}>
                  <div style={{ fontSize:16,fontWeight:700,color:"var(--mc-ink)" }}>Configuración Técnica: {actividadSel}</div>
                  <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                    <div style={{ width:52,height:52,borderRadius:8,background:"var(--mc-surface-2)",border:"1px solid var(--mc-border)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <Icon name="tool" size={24} color="var(--mc-text-3)"/>
                    </div>
                    <div style={{ fontSize:11,color:"var(--mc-text-3)" }}>Tractor JD 7R<br/>+ Rotoenfardadora Mainero</div>
                  </div>
                </div>
                <button style={{ alignSelf:"flex-start",padding:"7px 14px",borderRadius:7,border:"1px solid var(--mc-green-600)",background:"rgba(79,157,82,.08)",color:"var(--mc-green-700)",fontSize:12,fontWeight:600,cursor:"pointer" }}>
                  <Icon name="download" size={13}/> Cargar Configuración Predefinida
                </button>

                {/* PULVERIZACIÓN / FERTILIZACIÓN LÍQUIDA */}
                {(actividadSel === "Pulverización" || actividadSel === "Bioestimulante") && (
                  <>
                    <div style={{ fontWeight:700,fontSize:12,color:"var(--mc-text-3)",textTransform:"uppercase",letterSpacing:.8 }}>Parámetros de aplicación</div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
                      <div>
                        <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Presión de trabajo</div>
                        <div className="row gap-6">
                          <input type="number" value={presPulv} onChange={e=>setPresPulv(e.target.value)} style={{ flex:1,padding:"6px 10px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}/>
                          <span style={{ fontSize:12,color:"var(--mc-text-3)",padding:"6px 0" }}>Bar</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Caudal</div>
                        <div className="row gap-6">
                          <input type="number" value={caudal} onChange={e=>setCaudal(e.target.value)} style={{ flex:1,padding:"6px 10px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}/>
                          <span style={{ fontSize:12,color:"var(--mc-text-3)",padding:"6px 0" }}>L/Ha</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Velocidad de avance</div>
                        <div className="row gap-6">
                          <input type="number" value={velocidad} onChange={e=>setVelocidad(e.target.value)} style={{ flex:1,padding:"6px 10px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}/>
                          <span style={{ fontSize:12,color:"var(--mc-text-3)",padding:"6px 0" }}>km/h</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight:700,fontSize:12,color:"var(--mc-text-3)",textTransform:"uppercase",letterSpacing:.8 }}>Boquillas y banda</div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                      <div>
                        <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Tipo de boquilla</div>
                        <select value={boquilla} onChange={e=>setBoquilla(e.target.value)} style={{ width:"100%",padding:"6px 10px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}>
                          <option>Abanico Plano</option><option>Cono Hueco</option><option>Anti-deriva</option><option>Inyección de Aire</option>
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Ancho de banda</div>
                        <div className="row gap-6">
                          <input type="number" value={anchoBanda} onChange={e=>setAnchoBanda(e.target.value)} style={{ flex:1,padding:"6px 10px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}/>
                          <span style={{ fontSize:12,color:"var(--mc-text-3)",padding:"6px 0" }}>m</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* SIEMBRA */}
                {(actividadSel.includes("Directa") || actividadSel.includes("siembra") || actividadSel === "Re-siembra" || actividadSel === "Video/Cobertura") && (
                  <>
                    <div style={{ fontWeight:700,fontSize:12,color:"var(--mc-text-3)",textTransform:"uppercase",letterSpacing:.8 }}>Parámetros de siembra</div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
                      <div>
                        <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Densidad</div>
                        <div className="row gap-6">
                          <input type="number" value={densSiembra} onChange={e=>setDensSiembra(e.target.value)} style={{ flex:1,padding:"6px 10px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}/>
                          <span style={{ fontSize:12,color:"var(--mc-text-3)",padding:"6px 0" }}>sem/Ha</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Profundidad</div>
                        <div className="row gap-6">
                          <input type="number" value={profSiembra} onChange={e=>setProfSiembra(e.target.value)} style={{ flex:1,padding:"6px 10px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}/>
                          <span style={{ fontSize:12,color:"var(--mc-text-3)",padding:"6px 0" }}>cm</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Distancia entre líneas</div>
                        <div className="row gap-6">
                          <input type="number" value={distLineas} onChange={e=>setDistLineas(e.target.value)} style={{ flex:1,padding:"6px 10px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}/>
                          <span style={{ fontSize:12,color:"var(--mc-text-3)",padding:"6px 0" }}>cm</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* FERTILIZACIÓN / RIEGO */}
                {(actividadSel === "Fertilización" || actividadSel === "Riego") && (
                  <>
                    <div style={{ fontWeight:700,fontSize:12,color:"var(--mc-text-3)",textTransform:"uppercase",letterSpacing:.8 }}>{actividadSel === "Riego" ? "Parámetros de riego" : "Parámetros de fertilización"}</div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                      {actividadSel === "Fertilización" ? (
                        <>
                          <div>
                            <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Dosis</div>
                            <div className="row gap-6">
                              <input type="number" value={dosisFert} onChange={e=>setDosisFert(e.target.value)} style={{ flex:1,padding:"6px 10px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}/>
                              <span style={{ fontSize:12,color:"var(--mc-text-3)",padding:"6px 0" }}>kg/Ha</span>
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Forma</div>
                            <select value={tipoFert} onChange={e=>setTipoFert(e.target.value)} style={{ width:"100%",padding:"6px 10px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}>
                              <option>Sólida</option><option>Líquida (UAN)</option><option>Foliar</option>
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Lámina objetivo</div>
                            <div className="row gap-6">
                              <input type="number" value={laminaRiego} onChange={e=>setLaminaRiego(e.target.value)} style={{ flex:1,padding:"6px 10px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}/>
                              <span style={{ fontSize:12,color:"var(--mc-text-3)",padding:"6px 0" }}>mm</span>
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Caudal sistema</div>
                            <div className="row gap-6">
                              <input type="number" value={caudal} onChange={e=>setCaudal(e.target.value)} style={{ flex:1,padding:"6px 10px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}/>
                              <span style={{ fontSize:12,color:"var(--mc-text-3)",padding:"6px 0" }}>m³/h</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}

                {/* ENROLLADO / ENFARDADO / FORRAJE */}
                {(actividadSel === "Enrollado" || actividadSel === "Enfardado Prim." || actividadSel === "Picado/Silaje" || actividadSel === "Corte/Segado") && (
                  <>
                    <div style={{ fontWeight:700,fontSize:12,color:"var(--mc-text-3)",textTransform:"uppercase",letterSpacing:.8 }}>Parámetros de Compactación</div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
                      <div>
                        <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Presión Hidráulica</div>
                        <div className="row gap-6">
                          <input type="number" value={presHid} onChange={e=>setPresHid(e.target.value)} style={{ flex:1,padding:"6px 10px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}/>
                          <span style={{ fontSize:12,color:"var(--mc-text-3)",padding:"6px 0" }}>Bar</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Diámetro Rollo</div>
                        <div className="row gap-6">
                          <input type="number" value={diamRollo} onChange={e=>setDiamRollo(e.target.value)} style={{ flex:1,padding:"6px 10px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}/>
                          <span style={{ fontSize:12,color:"var(--mc-text-3)",padding:"6px 0" }}>m</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Núcleo</div>
                        <select value={nucleo} onChange={e=>setNucleo(e.target.value)} style={{ width:"100%",padding:"6px 10px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}>
                          <option>Blando</option><option>Duro</option><option>Mixto</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ fontWeight:700,fontSize:12,color:"var(--mc-text-3)",textTransform:"uppercase",letterSpacing:.8 }}>Sistema de Atado</div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
                      <div>
                        <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Tipo</div>
                        <div style={{ display:"flex",borderRadius:7,overflow:"hidden",border:gBorder }}>
                          {["Red","Yiute"].map(t=>(
                            <button key={t} onClick={()=>setAtado(t)} style={{ flex:1,padding:"6px 0",fontSize:12,fontWeight:600,border:"none",cursor:"pointer",background:atado===t?"var(--mc-green-600)":"var(--mc-surface)",color:atado===t?"#fff":"var(--mc-text-3)" }}>{t}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Vueltas de Red</div>
                        <input type="number" value={vueltasRed} onChange={e=>setVueltasRed(e.target.value)} style={{ width:"100%",padding:"6px 10px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}/>
                      </div>
                      <div>
                        <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Número de Red</div>
                        <input type="number" value={numRed} onChange={e=>setNumRed(e.target.value)} style={{ width:"100%",padding:"6px 10px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}/>
                      </div>
                    </div>
                    <div style={{ fontWeight:700,fontSize:12,color:"var(--mc-text-3)",textTransform:"uppercase",letterSpacing:.8 }}>Procesamiento</div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                      <div className="row gap-10" style={{ alignItems:"center" }}>
                        <div style={{ fontSize:12,color:"var(--mc-ink)" }}>Sistema de Picado (Cutter)</div>
                        <button onClick={()=>setPicadoOn(!picadoOn)} style={{ position:"relative",width:40,height:22,borderRadius:11,border:"none",cursor:"pointer",background:picadoOn?"var(--mc-green-600)":"var(--mc-border)",transition:"background .2s" }}>
                          <span style={{ position:"absolute",top:3,left:picadoOn?21:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s",display:"block" }}></span>
                        </button>
                      </div>
                      {picadoOn && <div>
                        <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Cuchillas Activas</div>
                        <input type="number" value={cuchillas} onChange={e=>setCuchillas(e.target.value)} style={{ width:"100%",padding:"6px 10px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}/>
                      </div>}
                    </div>
                  </>
                )}

                {/* LABRANZA */}
                {(actividadSel === "Arado" || actividadSel === "Rastrillado" || actividadSel === "Subsuelo" || actividadSel === "Nivelación") && (
                  <>
                    <div style={{ fontWeight:700,fontSize:12,color:"var(--mc-text-3)",textTransform:"uppercase",letterSpacing:.8 }}>Parámetros de labranza</div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
                      <div>
                        <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Profundidad de trabajo</div>
                        <div className="row gap-6">
                          <input type="number" value={profSiembra} onChange={e=>setProfSiembra(e.target.value)} style={{ flex:1,padding:"6px 10px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}/>
                          <span style={{ fontSize:12,color:"var(--mc-text-3)",padding:"6px 0" }}>cm</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Velocidad</div>
                        <div className="row gap-6">
                          <input type="number" value={velocidad} onChange={e=>setVelocidad(e.target.value)} style={{ flex:1,padding:"6px 10px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}/>
                          <span style={{ fontSize:12,color:"var(--mc-text-3)",padding:"6px 0" }}>km/h</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:4 }}>Ancho de labor</div>
                        <div className="row gap-6">
                          <input type="number" value={anchoBanda} onChange={e=>setAnchoBanda(e.target.value)} style={{ flex:1,padding:"6px 10px",borderRadius:7,border:gBorder,fontSize:12,background:"var(--mc-surface)",color:"var(--mc-ink)" }}/>
                          <span style={{ fontSize:12,color:"var(--mc-text-3)",padding:"6px 0" }}>m</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <button style={{ alignSelf:"flex-start",padding:"7px 14px",borderRadius:7,border:"1px solid var(--mc-border)",background:"var(--mc-surface-2)",color:"var(--mc-ink)",fontSize:12,cursor:"pointer" }}>
                  <Icon name="map" size={13}/> Crear mapa de telemetría
                </button>
              </div>
            )}

            {/* STEP 5 — Insumos */}
            {step === 5 && (
              <div className="col gap-14">
                <div style={{ fontSize:16,fontWeight:700,color:"var(--mc-ink)" }}>Planificación de Insumos y Materiales</div>
                <div style={{ position:"relative" }}>
                  <input value={insumoSearch} onChange={e=>setInsumoSearch(e.target.value)} placeholder="Agregar Insumo a la Mezcla..." style={{ width:"100%",padding:"9px 14px 9px 36px",borderRadius:8,border:gBorder,fontSize:13,background:"var(--mc-surface)",color:"var(--mc-ink)",boxSizing:"border-box" }}/>
                  <div style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)" }}><Icon name="search" size={15} color="var(--mc-text-3)"/></div>
                  {insumoSearch && (
                    <div style={{ position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"var(--mc-surface)",border:"1px solid var(--mc-border)",borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,0,.12)",zIndex:10 }}>
                      {insumoSearchResults.filter(r=>r.nombre.toLowerCase().includes(insumoSearch.toLowerCase())).map(r=>(
                        <div key={r.nombre} onClick={()=>addInsumo(r)} style={{ padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid var(--mc-border)",display:"flex",justifyContent:"space-between",alignItems:"center" }} onMouseEnter={e=>e.currentTarget.style.background="var(--mc-surface-2)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <div>
                            <div style={{ fontSize:13,fontWeight:600,color:"var(--mc-ink)" }}>{r.nombre}</div>
                            <div style={{ fontSize:11,color:r.stock.includes("Sin Stock")?"var(--mc-red)":"var(--mc-text-3)" }}>Stock: {r.stock}</div>
                          </div>
                          <button className="mc-btn mc-btn--primary mc-btn--sm">+ Agregar</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize:12,fontWeight:700,color:"var(--mc-text-3)",textTransform:"uppercase",letterSpacing:.8,marginBottom:10 }}>Insumos Agregados ({insumosAgregados.length})</div>
                  <div className="col gap-8">
                    {insumosAgregados.map(ins=>(
                      <div key={ins.nombre} style={{ background:"var(--mc-surface)",borderRadius:9,border:gBorder,padding:"10px 14px",display:"grid",gridTemplateColumns:"36px 1fr auto auto auto",gap:10,alignItems:"center" }}>
                        <div style={{ width:36,height:36,borderRadius:8,background:`${ins.color}22`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                          <Icon name={ins.icono} size={18} color={ins.color}/>
                        </div>
                        <div>
                          <div style={{ fontSize:13,fontWeight:600,color:"var(--mc-ink)" }}>{ins.nombre}</div>
                          <div style={{ fontSize:11,color:ins.stock?.includes("Crítico")?"var(--mc-red)":"var(--mc-text-3)" }}>{ins.stock}</div>
                        </div>
                        <div style={{ textAlign:"center" }}>
                          <div style={{ fontSize:10,color:"var(--mc-text-3)",marginBottom:2 }}>Dosis</div>
                          <input type="number" value={ins.dosis} onChange={e=>setInsumosAgregados(p=>p.map(i=>i.nombre===ins.nombre?{...i,dosis:e.target.value}:i))} style={{ width:70,padding:"4px 8px",borderRadius:6,border:gBorder,fontSize:12,textAlign:"center",background:"var(--mc-surface)",color:"var(--mc-ink)" }}/>
                        </div>
                        <div>
                          <div style={{ fontSize:10,color:"var(--mc-text-3)",marginBottom:2 }}>Unidad</div>
                          <select value={ins.unidad} onChange={e=>setInsumosAgregados(p=>p.map(i=>i.nombre===ins.nombre?{...i,unidad:e.target.value}:i))} style={{ padding:"4px 8px",borderRadius:6,border:gBorder,fontSize:11,background:"var(--mc-surface)",color:"var(--mc-ink)" }}>
                            <option>Sam/Ha</option><option>kg/Ha</option><option>L/Ha</option><option>g/Ha</option>
                          </select>
                        </div>
                        <button onClick={()=>removeInsumo(ins.nombre)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--mc-red)",padding:4 }}><Icon name="trash-2" size={15}/></button>
                      </div>
                    ))}
                    {insumosAgregados.length === 0 && <div style={{ textAlign:"center",padding:"24px",color:"var(--mc-text-3)",fontSize:13 }}>Sin insumos agregados</div>}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6 — Resumen y Costos */}
            {step === 6 && (()=>{
              const SCard = ({icon,label,accentColor,children})=>(
                <div style={{ borderRadius:10,border:`1px solid ${accentColor||"var(--mc-border)"}`,overflow:"hidden",background:"var(--mc-surface)" }}>
                  <div style={{ padding:"9px 14px",borderBottom:`1px solid ${accentColor||"var(--mc-border)"}`,background:accentColor?`${accentColor}12`:"var(--mc-surface-2)",display:"flex",alignItems:"center",gap:7 }}>
                    <span style={{ fontSize:13 }}>{icon}</span>
                    <span style={{ fontSize:11,fontWeight:700,color:accentColor||"var(--mc-text-3)",textTransform:"uppercase",letterSpacing:.7 }}>{label}</span>
                  </div>
                  <div style={{ padding:14 }}>{children}</div>
                </div>
              );
              return (
                <div style={{ display:"grid",gridTemplateColumns:"1.3fr 1fr",gap:16 }}>
                  {/* Left: full review */}
                  <div className="col gap-12">
                    <div style={{ fontSize:16,fontWeight:700,color:"var(--mc-ink)" }}>Revisión de Orden de Trabajo</div>
                    <SCard icon="📍" label="Ubicación y Operación">
                      <div style={{ fontSize:13,color:"var(--mc-ink)",fontWeight:600 }}>
                        {Object.entries(lotesCheck).filter(([,v])=>v).map(([k])=>k).join(" y ")} ({haNeta} Ha)
                      </div>
                      <div style={{ fontSize:11,color:"var(--mc-text-3)",marginTop:3 }}>Cultivo: Pastura Consociada · Actividad: {actividadSel}</div>
                    </SCard>
                    <SCard icon="🚜" label="Equipo Asignado">
                      <div style={{ fontSize:13,color:"var(--mc-ink)",fontWeight:600,marginBottom:2 }}>{operario}</div>
                      <div style={{ fontSize:12,color:"var(--mc-text-3)" }}>{tractor} · {implemento}</div>
                    </SCard>
                    <SCard icon="?" label="Parámetros Técnicos">
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 16px",fontSize:12 }}>
                        <div><span style={{ color:"var(--mc-text-3)" }}>Diámetro: </span><b>{diamRollo}m</b></div>
                        <div><span style={{ color:"var(--mc-text-3)" }}>Presión: </span><b>{presHid} bar</b></div>
                        <div><span style={{ color:"var(--mc-text-3)" }}>Atado: </span><b>{atado}</b></div>
                        <div><span style={{ color:"var(--mc-text-3)" }}>Picado: </span><b>{picadoOn?"Activo · "+cuchillas+" cuch.":"Inactivo"}</b></div>
                      </div>
                    </SCard>
                    <SCard icon="📦" label={`Insumos a Utilizar (${insumosAgregados.length})`}>
                      {insumosAgregados.length === 0
                        ? <div style={{ fontSize:12,color:"var(--mc-text-3)" }}>Sin insumos agregados</div>
                        : insumosAgregados.map(ins=>(
                          <div key={ins.nombre} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid var(--mc-border)",fontSize:12 }}>
                            <span style={{ color:"var(--mc-ink)",fontWeight:500 }}>{ins.nombre}</span>
                            <span style={{ color:"var(--mc-text-3)",fontWeight:600 }}>{ins.dosis} {ins.unidad}</span>
                          </div>
                        ))
                      }
                    </SCard>
                  </div>
                  {/* Right: cost + alerts */}
                  <div className="col gap-12">
                    <SCard icon="💰" label="Presupuesto Estimado" accentColor="var(--mc-green-600)">
                      <div style={{ fontSize:11,color:"var(--mc-text-3)",marginBottom:6 }}>Costo Total del Evento</div>
                      <div style={{ fontSize:34,fontWeight:800,color:"var(--mc-green-600)",lineHeight:1 }}>
                        ${costoTotal.toLocaleString("es-UY",{maximumFractionDigits:0})}
                        <span style={{ fontSize:14,fontWeight:500,color:"var(--mc-text-3)",marginLeft:6 }}>USD</span>
                      </div>
                      <div style={{ fontSize:12,color:"var(--mc-text-3)",marginTop:6 }}>{(costoTotal/haNeta).toFixed(2)} USD/Ha</div>
                    </SCard>
                    <SCard icon="🔔" label="Validaciones">
                      <div className="col gap-9">
                        {[
                          { ok:true, text:"Viento < 15km/h — Clima OK" },
                          { ok:false, text:"Stock Crítico — Confirmar antes de enviar", warn:true },
                          { ok:true, text:"Equipo disponible y compatible" },
                          { ok:false, text:"Turno operario > 6h — Supervisar", warn:true },
                        ].map((v,i)=>(
                          <div key={i} className="row gap-8" style={{ alignItems:"flex-start",padding:"6px 8px",borderRadius:7,background:v.ok?"var(--mc-green-600)10":v.warn?"#e89a2312":"transparent",border:`1px solid ${v.ok?"var(--mc-green-600)30":v.warn?"#e89a2330":"transparent"}` }}>
                            <span style={{ color:v.ok?"var(--mc-green-600)":"#e89a23",fontSize:13,flexShrink:0,fontWeight:700 }}>{v.ok?"?":"?"}</span>
                            <div style={{ fontSize:12,color:"var(--mc-ink)",lineHeight:1.4 }}>{v.text}</div>
                          </div>
                        ))}
                      </div>
                    </SCard>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Footer nav */}
        <div style={{ padding:"14px 24px",borderTop:"1px solid var(--mc-border)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,background:"var(--mc-surface-2)" }}>
          <div className="row gap-8">
            {step === 6 && (
              <button style={{ padding:"8px 16px",borderRadius:8,border:"1px solid var(--mc-border)",background:"var(--mc-surface)",color:"var(--mc-ink)",fontSize:13,fontWeight:600,cursor:"pointer" }}>
                <Icon name="save" size={13}/> Guardar Borrador
              </button>
            )}
          </div>
          <div className="row gap-8">
            {step > 1 && (
              <button onClick={()=>setStep(s=>s-1)} className="mc-btn mc-btn--secondary">
                ? Anterior
              </button>
            )}
            {step < 6 ? (
              <button onClick={()=>setStep(s=>s+1)} className="mc-btn mc-btn--primary">
                Siguiente: {STEPS[step].label} ?
              </button>
            ) : (
              <button onClick={onClose} className="mc-btn mc-btn--primary">
                <Icon name="send" size={13}/> Enviar y Notificar Orden
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========== LABORES ========== */
function CDLabores() {
  const { useState } = React;
  const [view, setView] = useState("kanban");
  const [nuevaLaborOpen, setNuevaLaborOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(3); // 0-indexed: 3 = Abril

  const colsKanban = [
    { key: "Programada", title: "Programadas", color: "var(--mc-text-3)" },
    { key: "Hoy", title: "Hoy / En curso", color: "var(--mc-green-600)" },
    { key: "Atrasada", title: "Atrasadas", color: "var(--mc-red)" },
    { key: "Completada", title: "Completadas", color: "var(--mc-green-700)" },
  ];

  return (
    <>
      <div className="grid g-cols-5">
        <KPI label="Programadas" value={DATA.labores.length} delta="próx. 30 días" trend="up" icon="calendar" accent/>
        <KPI label="Pendientes" value="8" delta="Sin asignar: 2" trend="up" icon="wrench"/>
        <KPI label="Atrasadas" value="3" delta="Lote Sur 1 + 2" trend="warn" icon="alert" warn/>
        <KPI label="% Completadas" value="84%" delta="vs 76% mes ant." trend="up" icon="check"/>
        <KPI label="Completados este mes" value="12" delta="98% a tiempo" trend="up" icon="activity"/>
      </div>

      <div className="row gap-8" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <div className="mc-seg">
          <button className={view === "kanban" ? "is-on" : ""} onClick={() => setView("kanban")}><Icon name="grid" size={13}/>Kanban</button>
          <button className={view === "tabla" ? "is-on" : ""} onClick={() => setView("tabla")}><Icon name="list" size={13}/>Tabla</button>
          <button className={view === "calendario" ? "is-on" : ""} onClick={() => setView("calendario")}><Icon name="calendar" size={13}/>Calendario</button>
        </div>
        <div className="row gap-8">
          <button className="mc-btn mc-btn--secondary mc-btn--sm"><Icon name="filter" size={13}/>Filtros</button>
          <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={()=>setNuevaLaborOpen(true)}><Icon name="plus" size={13}/>Nueva labor</button>
        </div>
      </div>
      {nuevaLaborOpen && <NuevaLaborModal onClose={()=>setNuevaLaborOpen(false)}/>}

      {/* Tareas para hoy + Labores bloqueados */}
      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__title">Tareas para Hoy</div>
            <span className="mc-badge mc-badge--green">3 activas</span>
          </div>
          <div className="col gap-10">
            <TareaHoy icon="flask" iconColor="#2c7ad9" titulo="Pulverización" lote="Lote 2 - Norte" responsable="Juan Pérez" maquina="Mosquito Metalfor" inicial="JP" cronometro="01:45:30" estado="en_curso"/>
            <TareaHoy icon="sprout" iconColor="#4f9d52" titulo="Siembra Maíz" lote="Lote 4 - El Bajo" responsable="M. Gómez" maquina="John Deere 6J" inicial="MG" estado="pendiente"/>
            <TareaHoy icon="droplet" iconColor="#3aa6d9" titulo="Riego Sector A" lote="Pivote 1" responsable="C. López" maquina="Pivote Valley" inicial="CL" estado="pendiente"/>
          </div>
        </div>

        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__title">Labores Bloqueados / Alertas</div>
            <span className="mc-badge mc-badge--red">3</span>
          </div>
          <div className="col gap-10">
            <LaborBloqueada icon="flask" iconColor="#2c7ad9" titulo="Pulverización" lote="Lote 2 - Norte" alertaIcon="wind" alertaTitulo="Viento: 32 km/h" alertaSub="Riesgo de Deriva" accion="Reprogramar"/>
            <LaborBloqueada icon="sprout" iconColor="#4f9d52" titulo="Siembra Maíz" lote="Lote 4 - El Bajo" alertaIcon="building" alertaTitulo="Sin Stock: Semilla" alertaSub="Faltan 20 bolsas" accion="Solicitar"/>
            <LaborBloqueada icon="wrench" iconColor="#d9a538" titulo="Cosecha Soja" lote="Lote 7 - Sur" alertaIcon="alert" alertaTitulo="Cosechadora Averiada" alertaSub="En taller mecánico" accion="Ver Detalle"/>
          </div>
          <div className="text-xs text-muted mt-8" style={{ fontStyle: "italic" }}>
            * Estas tareas van de la mano con las Pausadas y Reportadas del bloque superior
          </div>
        </div>
      </div>

      {view === "kanban" && (
        <div className="grid g-cols-4 gap-12">
          {colsKanban.map(col => {
            const items = col.key === "Hoy"
              ? DATA.labores.filter(l => l.estado === "Hoy" || l.estado === "En curso")
              : col.key === "Completada"
                ? [{ id: "c1", tarea: "Pulverización Norte 2", fecha: "16/04", lote: "Norte 2", cultivo: "Soja", responsable: "C. Martínez", prioridad: "media", estado: "Completada" },
                   { id: "c2", tarea: "Siembra alfalfa", fecha: "12/04", lote: "Sur 2", cultivo: "Alfalfa", responsable: "Equipo", prioridad: "media", estado: "Completada" }]
                : DATA.labores.filter(l => l.estado === col.key);
            return (
              <div key={col.key} className="mc-card" style={{ background: "var(--mc-surface-2)", padding: 12, minHeight: 400 }}>
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
                  <div className="row gap-8">
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }}></span>
                    <span className="font-semi" style={{ color: "var(--mc-ink)" }}>{col.title}</span>
                  </div>
                  <span className="mc-badge mc-badge--neutral">{items.length}</span>
                </div>
                <div className="col gap-8">
                  {items.map(l => (
                    <div key={l.id} style={{ background: "var(--mc-surface)", border: "1px solid var(--mc-line)", borderRadius: 10, padding: 12, opacity: l.estado === "Completada" ? 0.7 : 1 }}>
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        {l.estado === "Completada"
                          ? <span className="mc-badge mc-badge--green"><Icon name="check" size={10}/>Completada</span>
                          : <span className={`mc-badge mc-badge--${l.prioridad === "alta" ? "red" : l.prioridad === "media" ? "amber" : "neutral"}`} style={{ textTransform: "uppercase", fontSize: 10 }}>{l.prioridad}</span>}
                        <button className="mc-icon-btn" style={{ width: 22, height: 22, border: "none" }}><Icon name="more" size={12}/></button>
                      </div>
                      <div className="font-semi mt-8" style={{ color: "var(--mc-ink)", fontSize: 13.5 }}>{l.tarea}</div>
                      <div className="text-xs text-muted mt-4">{l.lote} · {l.cultivo}</div>
                      <div className="mc-divider" style={{ margin: "8px 0" }}></div>
                      <div className="row" style={{ justifyContent: "space-between", fontSize: 11.5 }}>
                        <span className="text-muted">{l.responsable}</span>
                        <span className="font-mono font-semi" style={{ color: "var(--mc-ink)" }}>{l.fecha}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "tabla" && (
        <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="mc-table">
            <thead>
              <tr><th>Tarea</th><th>Lote</th><th>Cultivo</th><th>Responsable</th><th>Fecha</th><th>Prioridad</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {DATA.labores.map(l => (
                <tr key={l.id}>
                  <td className="mc-cell--emph">{l.tarea}</td>
                  <td>{l.lote}</td>
                  <td>{l.cultivo}</td>
                  <td>{l.responsable}</td>
                  <td className="mc-cell--mono">{l.fecha}</td>
                  <td><span className={`mc-badge mc-badge--${l.prioridad === 'alta' ? 'red' : l.prioridad === 'media' ? 'amber' : 'neutral'}`}>{l.prioridad}</span></td>
                  <td><span className={`mc-badge mc-badge--${l.estado === 'Atrasada' ? 'red' : l.estado === 'Hoy' || l.estado === 'En curso' ? 'green' : 'neutral'}`}><span className="mc-badge__dot"></span>{l.estado}</span></td>
                  <td><button className="mc-icon-btn" style={{ width: 26, height: 26, border: "none" }}><Icon name="more" size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "calendario" && (() => {
        const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
        const daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
        const eventsByMonth = {
          3: { 16: [{ t: "Fertiliz.", c: "var(--mc-red)" }], 18: [{ t: "Pulver. N1", c: "var(--mc-orange-500)" }, { t: "Riego A", c: "var(--mc-blue)" }], 20: [{ t: "Fungicida E1", c: "var(--mc-green-700)" }], 22: [{ t: "Siembra trigo", c: "var(--mc-green-500)" }], 25: [{ t: "Cosecha maíz", c: "var(--mc-amber)" }] },
          4: { 5: [{ t: "Pulver. S2", c: "var(--mc-orange-500)" }], 12: [{ t: "Cosecha soja", c: "var(--mc-amber)" }], 14: [{ t: "Riego B", c: "var(--mc-blue)" }], 21: [{ t: "Siembra trigo", c: "var(--mc-green-500)" }] },
          2: { 8: [{ t: "Análisis suelo", c: "var(--mc-green-700)" }], 15: [{ t: "Pulver. N2", c: "var(--mc-orange-500)" }], 22: [{ t: "Fertiliz. E1", c: "var(--mc-red)" }] },
          5: { 3: [{ t: "Cosecha maíz", c: "var(--mc-amber)" }], 10: [{ t: "Siembra trigo", c: "var(--mc-green-500)" }], 17: [{ t: "Riego A", c: "var(--mc-blue)" }] },
        };
        const monthEvents = eventsByMonth[calMonth] || {};
        const days = daysInMonth[calMonth];
        const todayDay = calMonth === 3 ? 18 : null;
        return (
          <div className="mc-card">
            <div className="mc-card__head">
              <div className="mc-card__title">{monthNames[calMonth]} 2026</div>
              <div className="mc-seg">
                <button onClick={() => setCalMonth(m => Math.max(0, m - 1))} title="Mes anterior">&lt;</button>
                <button className="is-on">Mes</button>
                <button>Semana</button>
                <button onClick={() => setCalMonth(m => Math.min(11, m + 1))} title="Mes siguiente">&gt;</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
              {["LUN","MAR","MIÉ","JUE","VIE","SÁB","DOM"].map(d => (
                <div key={d} className="text-xs text-muted" style={{ textAlign: "center", padding: "8px 0", fontWeight: 600, letterSpacing: "0.06em" }}>{d}</div>
              ))}
              {Array.from({ length: days }).map((_, i) => {
                const day = i + 1;
                const events = monthEvents[day] || [];
                const isToday = day === todayDay;
                return (
                  <div key={i} style={{ minHeight: 80, padding: 8, border: "1px solid var(--mc-line)", borderRadius: 8, background: isToday ? "var(--mc-green-50)" : "var(--mc-surface)" }}>
                    <div className="font-mono text-xs" style={{ color: isToday ? "var(--mc-green-700)" : "var(--mc-text-2)", fontWeight: isToday ? 700 : 500 }}>{day}</div>
                    <div className="col gap-2 mt-4">
                      {events.map((e, j) => (
                        <div key={j} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: e.c, color: "white", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.t}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </>
  );
}

function TareaHoy({ icon, iconColor, titulo, lote, responsable, maquina, inicial, cronometro, estado }) {
  return (
    <div style={{ padding: 12, border: "1px solid var(--mc-line)", borderRadius: 10, display: "flex", gap: 12, alignItems: "center" }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: iconColor, color: "white", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
        <Icon name={icon} size={20}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 14 }}>{titulo}</div>
        <div className="text-xs text-muted">{lote}</div>
      </div>
      <div className="row gap-6" style={{ alignItems: "center", fontSize: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#5E8F78", color: "white", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700 }}>{inicial}</div>
        <div>
          <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 12 }}>{responsable}</div>
          <div className="text-xs text-muted">{maquina}</div>
        </div>
      </div>
      <div className="col gap-4" style={{ alignItems: "stretch" }}>
        {cronometro && (
          <div className="row gap-4" style={{ alignItems: "center", fontSize: 11, color: "var(--mc-green-700)", fontWeight: 600, fontFamily: "var(--ff-mono)" }}>
            <Icon name="activity" size={11}/>{cronometro}
          </div>
        )}
        <div className="row gap-4">
          {estado === "en_curso"
            ? <button className="mc-btn mc-btn--secondary mc-btn--sm" style={{ padding: "4px 8px", fontSize: 11 }}><Icon name="x" size={10}/>Pausar</button>
            : <button className="mc-btn mc-btn--primary mc-btn--sm" style={{ padding: "4px 8px", fontSize: 11 }}><Icon name="arrowRight" size={10}/>Iniciar</button>
          }
          {estado === "en_curso" && <button className="mc-btn mc-btn--primary mc-btn--sm"><Icon name="check" size={10}/>Completar</button>}
          <button className="mc-btn mc-btn--ghost mc-btn--sm"><Icon name="search" size={10}/>Ver</button>
        </div>
        <button className="mc-btn mc-btn--slate mc-btn--sm">
          <Icon name="alert" size={10}/>Reportar
        </button>
      </div>
    </div>
  );
}

function LaborBloqueada({ icon, iconColor, titulo, lote, alertaIcon, alertaTitulo, alertaSub, accion }) {
  return (
    <div style={{ padding: 10, border: "1px solid var(--mc-line)", borderRadius: 10, display: "flex", gap: 10, alignItems: "center" }}>
      <div style={{ width: 38, height: 38, borderRadius: 8, background: iconColor, color: "white", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
        <Icon name={icon} size={17}/>
      </div>
      <div style={{ flex: "0 0 auto", minWidth: 100 }}>
        <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 13 }}>{titulo}</div>
        <div className="text-xs text-muted">{lote}</div>
      </div>
      <div style={{ flex: 1, padding: "6px 10px", background: "var(--mc-red-bg)", borderRadius: 8, minWidth: 0 }}>
        <div className="row gap-4" style={{ alignItems: "center", fontSize: 12 }}>
          <Icon name={alertaIcon} size={11} style={{ color: "var(--mc-red)" }}/>
          <span className="font-semi" style={{ color: "var(--mc-red)" }}>{alertaTitulo}</span>
        </div>
        <div className="text-xs" style={{ color: "var(--mc-red)", opacity: 0.8 }}>{alertaSub}</div>
      </div>
      <button className="mc-btn mc-btn--secondary mc-btn--sm" style={{ padding: "4px 10px", fontSize: 11, flex: "0 0 auto" }}>
        <Icon name="calendar" size={11}/>{accion}
      </button>
    </div>
  );
}

/* ========== MODAL: PLAN DE SIEMBRA ========== */
function PlanSiembraModal({ onClose }) {
  const { useState } = React;
  const [lote, setLote] = useState("Lote 1 – Vacío 70 Ha");
  const [fecha, setFecha] = useState("2024-11-11");
  const [cultivo, setCultivo] = useState(null);
  const [variedad, setVariedad] = useState("");
  const [densidad, setDensidad] = useState("");
  const [buscar, setBuscar] = useState("");
  const [inversion, setInversion] = useState("");
  const [responsable, setResponsable] = useState("");
  const [equipo, setEquipo] = useState("");
  const [destinos, setDestinos] = useState([]);
  const [usarIA, setUsarIA] = useState(false);

  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #c0c5ce", background: "#fff", color: "var(--mc-ink)", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  const lbl = { fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".04em", display: "block" };

  const cultivosBase = [
    { id: "maiz", label: "Maíz", emoji: "🌽" },
    { id: "soja", label: "Soja", emoji: "🌱" },
    { id: "trigo", label: "Trigo", emoji: "🌾" },
    { id: "sorgo", label: "Sorgo", emoji: "🌿" },
    { id: "girasol", label: "Girasol", emoji: "🌻" },
    { id: "otro", label: "Otro", emoji: "?", add: true },
  ];
  const cultivosFiltrados = cultivosBase.filter(c => !buscar || c.label.toLowerCase().includes(buscar.toLowerCase()));

  const Section = ({ icon, title, children }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }}/>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,22,36,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, width: 760, maxWidth: "100%", maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}>

        {/* Header */}
        <div style={{ padding: "22px 28px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--mc-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Agricultura · Campo Digital · Cultivos</div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--mc-ink)" }}>Nueva Siembra</h3>
            <div style={{ fontSize: 13, color: "var(--mc-muted)", marginTop: 4 }}>Planificá una nueva siembra: lote, cultivo y recursos.</div>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 34, height: 34, cursor: "pointer", color: "#64748b", fontSize: 17, display: "grid", placeItems: "center", flexShrink: 0 }}>?</button>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 28px", overflowY: "auto", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

            <div>
              <Section icon="📍" title="Ubicación y Fecha">
                <div style={{ marginBottom: 12 }}>
                  <label style={lbl}>Lote</label>
                  <select value={lote} onChange={e => setLote(e.target.value)} style={inp}>
                    <option>Lote 1 – Vacío 70 Ha</option>
                    <option>Lote 2 – Vacío 45 Ha</option>
                    <option>Lote 6 – Vacío 30 Ha</option>
                    <option>Lote 7 – Vacío 20 Ha</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Fecha de Siembra</label>
                  <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inp}/>
                </div>
              </Section>

              <Section icon="💰" title="Finanzas y Recursos">
                <div style={{ marginBottom: 10 }}>
                  <label style={lbl}>Inversión Estimada</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: 13 }}>$</span>
                    <input value={inversion} onChange={e => setInversion(e.target.value)} placeholder="0" style={{ ...inp, paddingLeft: 24 }}/>
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={lbl}>Responsable</label>
                  <input value={responsable} onChange={e => setResponsable(e.target.value)} placeholder="Nombre del responsable" style={inp}/>
                </div>
                <div>
                  <label style={lbl}>Equipo del Servicio</label>
                  <input value={equipo} onChange={e => setEquipo(e.target.value)} placeholder="Maquinaria / contratista" style={inp}/>
                </div>
              </Section>
            </div>

            <div>
              <Section icon="🌱" title="Selección de Cultivo">
                <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar cultivo..." style={{ ...inp, marginBottom: 12 }}/>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                  {cultivosFiltrados.map(c => {
                    const sel = cultivo === c.id;
                    return (
                      <button key={c.id} onClick={() => !c.add && setCultivo(c.id)} title={c.label}
                        style={{ width: 44, height: 44, borderRadius: "50%", border: sel ? "2.5px solid var(--mc-green-600)" : "1.5px solid #c0c5ce", background: sel ? "rgba(34,162,97,0.10)" : "#fff", fontSize: 20, cursor: "pointer", display: "grid", placeItems: "center", transition: "all .15s" }}>
                        {c.emoji}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={lbl}>Variedad</label>
                    <input value={variedad} onChange={e => setVariedad(e.target.value)} placeholder="Ej: DK7210" style={inp}/>
                  </div>
                  <div>
                    <label style={lbl}>Densidad</label>
                    <input value={densidad} onChange={e => setDensidad(e.target.value)} placeholder="Ej: 77000" style={inp}/>
                  </div>
                </div>
              </Section>

              <Section icon="📋" title="Planificación">
                <label style={lbl}>Destino Planificado</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                  {["Silo", "Puerto", "Acopio", "Industria"].map(d => {
                    const sel = destinos.includes(d);
                    return (
                      <button key={d} onClick={() => setDestinos(prev => sel ? prev.filter(x => x !== d) : [...prev, d])}
                        style={{ padding: "6px 14px", borderRadius: 8, border: sel ? "2px solid var(--mc-green-600)" : "1.5px solid #c0c5ce", background: sel ? "rgba(34,162,97,0.10)" : "#fff", fontSize: 12, fontWeight: sel ? 700 : 500, color: sel ? "var(--mc-green-600)" : "var(--mc-ink)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all .15s" }}>
                        {sel && <span style={{ fontSize: 10 }}>?</span>}{d}
                      </button>
                    );
                  })}
                </div>
                <div onClick={() => setUsarIA(!usarIA)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, background: usarIA ? "rgba(34,162,97,0.07)" : "#f8fafc", border: "1.5px solid " + (usarIA ? "var(--mc-green-600)" : "#e2e8f0"), cursor: "pointer", transition: "all .15s" }}>
                  <div style={{ width: 36, height: 20, borderRadius: 10, background: usarIA ? "var(--mc-green-600)" : "#cbd0d8", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
                    <div style={{ position: "absolute", top: 2, left: usarIA ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "white", transition: "left 0.2s" }}/>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--mc-ink)", fontWeight: 500, userSelect: "none", display: "flex", alignItems: "center", gap: 6 }}>Usar Recomendación <IABadge/> para insumos</span>
                </div>
              </Section>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button className="mc-btn mc-btn--secondary" onClick={onClose}>Cancelar</button>
          <button className="mc-btn mc-btn--secondary">Guardar Borrador</button>
          <button className="mc-btn mc-btn--primary">Guardar Siembra</button>
        </div>
      </div>
    </div>
  );
}

/* ========== MODAL: NUEVA COSECHA ========== */
function NuevaCosechaModal({ onClose }) {
  const { useState } = React;
  const [loteSeleccionado, setLoteSeleccionado] = useState("lote4");
  const [rendimiento, setRendimiento] = useState("");
  const [humedad, setHumedad] = useState("");
  const [impurezas, setImpurezas] = useState("");
  const [maquinaria, setMaquinaria] = useState("propia");
  const [costoLabor, setCostoLabor] = useState("");
  const [destinos, setDestinos] = useState(["Silo"]);
  const [remito, setRemito] = useState("");
  const [cerrarLote, setCerrarLote] = useState(false);

  const lotes = [
    { id: "lote4", nombre: "Lote 4 - Maíz", estado: "En cosecha", madurez: 100, humedadL: 14, color: "#4f9d52" },
    { id: "lote2", nombre: "Lote 2 - Soja", estado: "En crecimiento", madurez: 85, humedadL: 18, color: "#3aa6d9" },
  ];

  const pesoNeto = rendimiento
    ? (parseFloat(rendimiento) * (1 - (parseFloat(impurezas) || 0) / 100)).toFixed(1)
    : "—";

  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #c0c5ce", background: "#fff", color: "var(--mc-ink)", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  const lbl = { fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".04em", display: "block" };

  const Section = ({ icon, title, children }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }}/>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,22,36,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, width: 680, maxWidth: "100%", maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}>

        {/* Header */}
        <div style={{ padding: "22px 28px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--mc-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Agricultura · Campo Digital · Cultivos</div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--mc-ink)" }}>Nueva Cosecha</h3>
            <div style={{ fontSize: 13, color: "var(--mc-muted)", marginTop: 4 }}>Registro de cosecha: rendimiento, calidad y destino.</div>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 34, height: 34, cursor: "pointer", color: "#64748b", fontSize: 17, display: "grid", placeItems: "center", flexShrink: 0 }}>?</button>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 28px", overflowY: "auto", flex: 1 }}>

          <Section icon="🌽" title="Seleccionar Cultivo">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {lotes.map(l => {
                const sel = loteSeleccionado === l.id;
                return (
                  <div key={l.id} onClick={() => setLoteSeleccionado(l.id)}
                    style={{ border: sel ? `2px solid ${l.color}` : "1.5px solid #c0c5ce", borderRadius: 10, padding: "14px 16px", cursor: "pointer", background: sel ? `${l.color}12` : "#fff", position: "relative", transition: "all 0.15s" }}>
                    {sel && <div style={{ position: "absolute", top: 10, right: 10, width: 22, height: 22, borderRadius: "50%", background: l.color, display: "grid", placeItems: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>?</div>}
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: "var(--mc-ink)" }}>{l.nombre}</div>
                    <div style={{ fontSize: 12, color: "var(--mc-muted)", marginBottom: 2 }}>Estado: {l.estado}</div>
                    <div style={{ fontSize: 12, color: "var(--mc-muted)", marginBottom: 2 }}>Madurez: {l.madurez}%</div>
                    <div style={{ fontSize: 12, color: "var(--mc-muted)" }}>Humedad: {l.humedadL}%</div>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section icon="📊" title="Rendimiento y Calidad">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 10 }}>
              <div>
                <label style={lbl}>Rendimiento (Tn)</label>
                <input value={rendimiento} onChange={e => setRendimiento(e.target.value)} placeholder="450" type="number" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Humedad %</label>
                <input value={humedad} onChange={e => setHumedad(e.target.value)} placeholder="Ej. 14" type="number" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Impurezas/Merma %</label>
                <input value={impurezas} onChange={e => setImpurezas(e.target.value)} placeholder="Ej. 2" type="number" style={inp}/>
              </div>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--mc-muted)", display: "flex", alignItems: "center", gap: 8 }}>
              <span>Peso Neto Est:</span>
              <span style={{ fontWeight: 700, color: "var(--mc-ink)", fontSize: 15 }}>{pesoNeto} Tn</span>
            </div>
          </Section>

          <Section icon="💰" title="Costos de Labor">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 8 }}>
                {[["propia", "Maquinaria Propia"], ["contratista", "Contratista"]].map(([id, label]) => {
                  const sel = maquinaria === id;
                  return (
                    <button key={id} onClick={() => setMaquinaria(id)}
                      style={{ padding: "8px 14px", borderRadius: 8, border: sel ? "2px solid var(--mc-green-600)" : "1.5px solid #c0c5ce", background: sel ? "rgba(34,162,97,0.10)" : "#fff", fontSize: 12, fontWeight: sel ? 700 : 500, color: sel ? "var(--mc-green-600)" : "var(--mc-ink)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all .15s" }}>
                      {sel && <span style={{ fontSize: 10 }}>?</span>}{label}
                    </button>
                  );
                })}
              </div>
              <div>
                <label style={lbl}>Costo Labor (USD/Ha)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: 13 }}>$</span>
                  <input value={costoLabor} onChange={e => setCostoLabor(e.target.value)} placeholder="65" type="number" style={{ ...inp, paddingLeft: 24 }}/>
                </div>
              </div>
            </div>
          </Section>

          <Section icon="🚛" title="Destino & Transporte">
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <button style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px dashed #c0c5ce", background: "#fff", fontSize: 12, fontWeight: 600, color: "var(--mc-muted)", cursor: "pointer" }}>+ Añadir Destino</button>
              {["Silo", "Puerto", "Acopio"].map(d => {
                const sel = destinos.includes(d);
                return (
                  <button key={d} onClick={() => setDestinos(prev => sel ? prev.filter(x => x !== d) : [...prev, d])}
                    style={{ padding: "7px 14px", borderRadius: 8, border: sel ? "2px solid var(--mc-green-600)" : "1.5px solid #c0c5ce", background: sel ? "rgba(34,162,97,0.10)" : "#fff", fontSize: 12, fontWeight: sel ? 700 : 500, color: sel ? "var(--mc-green-600)" : "var(--mc-ink)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all .15s" }}>
                    {sel && <span style={{ fontSize: 10 }}>?</span>}{d}
                  </button>
                );
              })}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Nro. Remito / Chofer</label>
              <input value={remito} onChange={e => setRemito(e.target.value)} placeholder="Ej: 12345 / Juan Pérez" style={inp}/>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, fontWeight: 500, padding: "10px 12px", background: "#f8fafc", borderRadius: 8, border: "1.5px solid #e2e8f0" }}>
              <input type="checkbox" checked={cerrarLote} onChange={e => setCerrarLote(e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--mc-green-600)" }}/>
              Cerrar Lote (Finalizar Ciclo)
            </label>
          </Section>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button className="mc-btn mc-btn--secondary" onClick={onClose}>Cancelar</button>
          <button className="mc-btn mc-btn--primary">Registrar Cosecha</button>
        </div>
      </div>
    </div>
  );
}

/* ========== CULTIVOS — con subpestañas ========== */
function CDCultivos() {
  const { useState } = React;
  const [sub, setSub] = useState("Estados");
  const [planSiembraOpen, setPlanSiembraOpen] = useState(false);
  const [cosechaOpen, setCosechaOpen] = useState(false);

  const headerActions = sub === "Análisis de Suelo"
    ? <button className="mc-btn mc-btn--slate"><Icon name="plus" size={14}/>Nuevo Análisis</button>
    : <>
        <button className="mc-btn mc-btn--secondary" onClick={() => setPlanSiembraOpen(true)}><Icon name="sprout" size={14}/>Plan de Siembra</button>
        <button className="mc-btn mc-btn--primary" onClick={() => setCosechaOpen(true)}><Icon name="plus" size={14}/>Nueva Cosecha</button>
      </>;

  return (
    <>
      {planSiembraOpen && <PlanSiembraModal onClose={() => setPlanSiembraOpen(false)}/>}
      {cosechaOpen && <NuevaCosechaModal onClose={() => setCosechaOpen(false)}/>}

      {sub === "Estados" && (
        <div className="grid g-cols-5">
          <KPI label="Superficie Sembrada" value="235 Ha" delta="84% del campo" trend="up" icon="sprout" accent/>
          <KPI label="Cosecha Total" value="2.300 Tn" delta="+14% vs anterior" trend="up" icon="wrench"/>
          <KPI label="Próxima Cosecha" value="Lote 5" delta="06 oct · Soja" trend="up" icon="calendar"/>
          <KPI label="Lotes Listos" value="3" delta="Para sembrar" trend="up" icon="check"/>
          <KPI label="Lotes Vacíos" value="5" delta="Sin asignar" trend="warn" icon="alert"/>
        </div>
      )}

      {sub === "Planificador de Siembra (IA)" && (
        <div className="grid g-cols-5">
          <KPI label="Planes Generados" value="3" delta="2 esta semana" trend="up" icon="sprout" accent/>
          <KPI label="Planes Aprobados" value="2" delta="67% conversión" trend="up" icon="check"/>
          <KPI label="Superficie Planificada" value="850 Ha" delta="Campaña 25/26" trend="up" icon="map"/>
          <KPI label="Inversión Estimada" value="$162.500 USD" delta="0 ejecutado" trend="up" icon="dollar"/>
          <KPI label="Próxima Siembra" value="03/12/25" delta="Maíz Tardío" trend="up" icon="calendar"/>
        </div>
      )}

      {sub === "Análisis de Suelo" && (
        <div className="grid g-cols-5">
          <KPI label="Análisis del Año" value="14" delta="+3 este mes" trend="up" icon="leaf" accent/>
          <KPI label="Lotes Críticos" value="2" delta="P bajo · Norte/Oeste" trend="warn" icon="alert" warn/>
          <KPI label="Lotes Óptimos" value="9" delta="64% del total" trend="up" icon="check"/>
          <KPI label="pH Promedio" value="6.4" delta="Rango óptimo" trend="up" icon="activity"/>
          <KPI label="MO Promedio" value="2.6%" delta="-0.1 vs 23/24" trend="down" icon="sprout"/>
        </div>
      )}

      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <SubTabs tabs={["Estados","Planificador de Siembra (IA)","Análisis de Suelo"]} active={sub} onChange={setSub}/>
        <div className="row gap-8">{headerActions}</div>
      </div>

      {sub === "Estados" && <CultivosEstados/>}
      {sub === "Planificador de Siembra (IA)" && <CultivosPlanificador/>}
      {sub === "Análisis de Suelo" && <CultivosAnalisisSuelo/>}
    </>
  );
}

function CultivosEstados() {
  const lotes = [
    { id: "LOTE 4", cultivo: "Maíz", color: "#4f9d52", bg: "#f1faf2", siembra: "An 9/3/2020", semilla: "Semill semilla", densidad: "300 kpa", inversion: "$30.000", estadio: "V6 - Vegetativo", agua: "140 mm", gdd: "450 GDD", fertilizacion: "Últ. Fertilización", monitoreo: "Próx. Monitoreo", cosechaFecha: "Est. 03/6/2021", rinde: "8.5 Tn/Ha ?", destino: "—", progress: 40, has: 120, alerta: true },
    { id: "LOTE 5", cultivo: "Soja", color: "#3aa6d9", bg: "#f0f7fc", siembra: "Junio", semilla: "Semill semilla", densidad: "200 kpa", inversion: "$25.000", estadio: "V6 - Vegetativo", agua: "140 mm", gdd: "450 GDD", fertilizacion: "Últ. Fertilización", monitoreo: "Próx. Monitoreo", cosechaFecha: "Est. 06/10/2021", rinde: "3.2 Tn/Ha ?", destino: "—", progress: 28, has: 85, alerta: true },
  ];
  return (
    <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
      <div className="mc-card">
        <div className="mc-card__head">
          <div className="mc-card__title">Estados de los Cultivos</div>
          <button className="mc-icon-btn"><Icon name="filter" size={13}/></button>
        </div>
        <div className="col gap-14">
          {lotes.map((l, i) => (
            <div key={i} style={{ border: `1.5px solid ${l.color}40`, borderRadius: 14, overflow: "hidden" }}>
              {/* Colored header strip */}
              <div style={{ background: l.color, padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div className="row gap-12" style={{ alignItems: "center" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.22)", display: "grid", placeItems: "center", fontSize: 22 }}>
                    {l.cultivo === "Maíz" ? "🌽" : "🌱"}
                  </div>
                  <div>
                    <div style={{ color: "white", fontWeight: 700, fontSize: 16, fontFamily: "var(--ff-display)", lineHeight: 1.2 }}>{l.id} — {l.cultivo}</div>
                    <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 2 }}>{l.has} Ha · Activo · {l.siembra}</div>
                  </div>
                </div>
                <div className="row gap-8">
                  <button className="mc-btn mc-btn--sm" style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1.5px solid rgba(255,255,255,0.35)", fontSize: 11 }}><Icon name="plus" size={10}/>Nueva Tarea</button>
                </div>
              </div>
              {/* Progress strip — uniform */}
              <div style={{ height: 4, background: `${l.color}25` }}></div>
              {/* Four sections */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", background: l.bg }}>
                {/* SIEMBRA */}
                <div style={{ padding: "14px 18px", borderRight: `1px solid ${l.color}25` }}>
                  <div className="row gap-6" style={{ alignItems: "center", marginBottom: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: l.color, display: "grid", placeItems: "center" }}>
                      <Icon name="sprout" size={11} style={{ color: "white" }}/>
                    </div>
                    <span style={{ color: l.color, fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>Siembra</span>
                  </div>
                  <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{l.siembra}</div>
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ padding: "6px 10px", background: "rgba(255,255,255,0.7)", borderRadius: 7, fontSize: 11 }}>
                      <span className="text-muted">Semilla:</span> <span className="font-semi">{l.semilla}</span>
                    </div>
                    <div style={{ padding: "6px 10px", background: "rgba(255,255,255,0.7)", borderRadius: 7, fontSize: 11 }}>
                      <span className="text-muted">Densidad:</span> <span className="font-semi">{l.densidad}</span>
                    </div>
                    <div style={{ padding: "6px 10px", background: "rgba(255,255,255,0.7)", borderRadius: 7, fontSize: 11 }}>
                      <span className="text-muted">Inversión:</span> <span className="font-semi" style={{ color: l.color }}>{l.inversion}</span>
                    </div>
                  </div>
                </div>
                {/* PROCESO */}
                <div style={{ padding: "14px 18px", borderRight: `1px solid ${l.color}25` }}>
                  <div className="row gap-6" style={{ alignItems: "center", marginBottom: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: l.color, display: "grid", placeItems: "center" }}>
                      <Icon name="activity" size={11} style={{ color: "white" }}/>
                    </div>
                    <span style={{ color: l.color, fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>Proceso</span>
                    <span className="font-mono" style={{ marginLeft: "auto", color: l.color, fontWeight: 700, fontSize: 13 }}>{l.progress}%</span>
                  </div>
                  <div className="mc-prog" style={{ height: 8, borderRadius: 4, marginBottom: 12 }}>
                    <div className="mc-prog__bar" style={{ width: `${l.progress}%`, background: l.color, borderRadius: 4 }}></div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ padding: "6px 10px", background: "rgba(255,255,255,0.7)", borderRadius: 7, fontSize: 11 }}>
                      <span className="text-muted">Estadio:</span> <span className="font-semi">{l.estadio}</span>
                    </div>
                    <div style={{ padding: "6px 10px", background: "rgba(255,255,255,0.7)", borderRadius: 7, fontSize: 11 }}>
                      <span className="text-muted">Agua acum.:</span> <span className="font-semi">{l.agua}</span>
                    </div>
                    <div style={{ padding: "6px 10px", background: "rgba(255,255,255,0.7)", borderRadius: 7, fontSize: 11 }}>
                      <span className="text-muted">GDD:</span> <span className="font-semi">{l.gdd}</span>
                    </div>
                  </div>
                </div>
                {/* COSECHA */}
                <div style={{ padding: "14px 18px", borderRight: `1px solid ${l.color}25` }}>
                  <div className="row gap-6" style={{ alignItems: "center", marginBottom: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: l.color, display: "grid", placeItems: "center" }}>
                      <Icon name="wrench" size={11} style={{ color: "white" }}/>
                    </div>
                    <span style={{ color: l.color, fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>Cosecha</span>
                  </div>
                  <div className="text-xs text-muted">{l.cosechaFecha}</div>
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ padding: "8px 10px", background: "rgba(255,255,255,0.7)", borderRadius: 7 }}>
                      <div className="text-xs text-muted">Rinde proyectado <IABadge size={11}/></div>
                      <div className="font-semi" style={{ color: l.color, fontSize: 16, marginTop: 2 }}>{l.rinde}</div>
                    </div>
                    <div style={{ padding: "6px 10px", background: "rgba(255,255,255,0.7)", borderRadius: 7, fontSize: 11 }}>
                      <span className="text-muted">Destino:</span> <span className="font-semi">{l.destino || "—"}</span>
                    </div>
                  </div>
                </div>
                {/* TAREAS */}
                <div style={{ padding: "14px 18px" }}>
                  <div className="row gap-6" style={{ alignItems: "center", marginBottom: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: l.color, display: "grid", placeItems: "center" }}>
                      <Icon name="calendar" size={11} style={{ color: "white" }}/>
                    </div>
                    <span style={{ color: l.color, fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>Tareas</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <div style={{ padding: "8px 10px", background: `${l.color}10`, borderRadius: 8, borderLeft: `3px solid ${l.color}60` }}>
                      <div className="text-xs text-muted" style={{ marginBottom: 2 }}>Última</div>
                      <div className="font-semi text-xs" style={{ color: "var(--mc-ink)" }}>{l.fertilizacion}</div>
                    </div>
                    <div style={{ padding: "8px 10px", background: "rgba(255,255,255,0.7)", borderRadius: 8, border: `1px dashed ${l.color}50` }}>
                      <div className="text-xs text-muted" style={{ marginBottom: 2 }}>Próxima</div>
                      <div className="font-semi text-xs" style={{ color: l.color }}>{l.monitoreo}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mc-card">
        <div className="mc-card__head">
          <div>
            <div className="mc-card__eyebrow">Distribución de cultivos</div>
            <div className="mc-card__title mt-2">Resumen del campo</div>
          </div>
          <span className="mc-badge mc-badge--green" style={{ fontSize: 11 }}>3 activos</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
          <DonutResumen/>
        </div>
        <div className="col gap-10 mt-12">
          {[
            { nombre: "Maíz", ha: 120, pct: 51, color: "#4f9d52", emoji: "🌽", trend: "up", delta: "+8 Ha" },
            { nombre: "Soja", ha: 85, pct: 36, color: "#3aa6d9", emoji: "🌱", trend: "flat", delta: "—" },
            { nombre: "Sorgo", ha: 30, pct: 13, color: "#e7892b", emoji: "🌿", trend: "down", delta: "-4 Ha" },
          ].map(d => (
            <div key={d.nombre} style={{ padding: "10px 12px", background: `${d.color}0d`, borderRadius: 10, border: `1px solid ${d.color}25` }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <div className="row gap-8" style={{ alignItems: "center" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: d.color, display: "grid", placeItems: "center", fontSize: 14 }}>{d.emoji}</div>
                  <div>
                    <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 13 }}>{d.nombre}</div>
                    <div className="text-xs text-muted">{d.ha} Ha</div>
                  </div>
                </div>
                <div className="col" style={{ alignItems: "flex-end", gap: 1 }}>
                  <div style={{ fontFamily: "var(--ff-display)", fontSize: 18, fontWeight: 800, color: d.color }}>{d.pct}%</div>
                  <div className="text-xs" style={{ color: d.trend === "up" ? "var(--mc-green-700)" : d.trend === "down" ? "var(--mc-red)" : "var(--mc-text-3)", fontWeight: 600 }}>
                    {d.trend === "up" ? "?" : d.trend === "down" ? "?" : "—"} {d.delta}
                  </div>
                </div>
              </div>
              <div style={{ height: 4, background: `${d.color}20`, borderRadius: 999, marginTop: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${d.pct}%`, background: d.color, borderRadius: 999 }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DonutResumen() {
  const data = [
    { nombre: "Maíz", ha: 120, pct: 51, color: "#4f9d52", colorLight: "#6db870" },
    { nombre: "Soja", ha: 85, pct: 36, color: "#3aa6d9", colorLight: "#5fb6e5" },
    { nombre: "Sorgo", ha: 30, pct: 13, color: "#e7892b", colorLight: "#f3a64f" },
  ];
  const cx = 130, cy = 130, r = 88, sw = 26, gap = 5;
  let cumPct = 0;

  const seg = data.map((d, i) => {
    const startDeg = cumPct * 3.6 - 90;
    cumPct += d.pct;
    const endDeg = cumPct * 3.6 - 90;
    const startRad = startDeg * Math.PI / 180;
    const endRad = endDeg * Math.PI / 180;
    const gapRad = (gap / (2 * Math.PI * r)) * Math.PI * 2;
    const x1 = cx + r * Math.cos(startRad + gapRad / 2);
    const y1 = cy + r * Math.sin(startRad + gapRad / 2);
    const x2 = cx + r * Math.cos(endRad - gapRad / 2);
    const y2 = cy + r * Math.sin(endRad - gapRad / 2);
    const large = d.pct > 50 ? 1 : 0;
    return { ...d, x1, y1, x2, y2, large };
  });

  // Decorative tick marks every 5%
  const ticks = Array.from({ length: 20 }).map((_, i) => {
    const a = (i * 18 - 90) * Math.PI / 180;
    const ri = r + sw / 2 + 6;
    const ro = r + sw / 2 + (i % 5 === 0 ? 12 : 9);
    return { x1: cx + ri * Math.cos(a), y1: cy + ri * Math.sin(a), x2: cx + ro * Math.cos(a), y2: cy + ro * Math.sin(a), major: i % 5 === 0 };
  });

  return (
    <svg width="260" height="260" viewBox="0 0 260 260">
      <defs>
        {data.map((d, i) => (
          <linearGradient key={i} id={`donutGrad${i}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={d.color}/>
            <stop offset="100%" stopColor={d.colorLight}/>
          </linearGradient>
        ))}
        <filter id="donutGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>

      {/* Decorative tick ring */}
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={t.major ? "var(--mc-line)" : "var(--mc-surface-2)"}
          strokeWidth={t.major ? 1.5 : 1} opacity="0.7"/>
      ))}

      {/* Track ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--mc-surface-2)" strokeWidth={sw + 6}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--mc-line)" strokeWidth="1" opacity="0.6"/>

      {/* Segments */}
      {seg.map((s, i) => (
        <g key={i}>
          <path
            d={`M ${s.x1} ${s.y1} A ${r} ${r} 0 ${s.large} 1 ${s.x2} ${s.y2}`}
            stroke={`url(#donutGrad${i})`}
            strokeWidth={sw}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      ))}

      {/* Inner radial-feel circle (subtle highlight) */}
      <circle cx={cx} cy={cy} r={r - sw / 2 - 4} fill="var(--mc-surface)"/>
      <circle cx={cx} cy={cy} r={r - sw / 2 - 4} fill="none" stroke="var(--mc-line)" strokeWidth="1" opacity="0.5"/>

      {/* Center stats */}
      <text x={cx} y={cy - 18} textAnchor="middle" fontSize="11" fontFamily="var(--ff-ui)" fontWeight="700" fill="var(--mc-text-3)" letterSpacing="0.1em">SUPERFICIE</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="42" fontFamily="var(--ff-display)" fontWeight="800" fill="var(--mc-ink)">235</text>
      <text x={cx} y={cy + 30} textAnchor="middle" fontSize="11" fontFamily="var(--ff-mono)" fontWeight="600" fill="var(--mc-text-2)">Ha · 42% campo</text>

      {/* Decorative stat dots */}
      <circle cx={cx} cy={cy + 44} r="3" fill="#4f9d52"/>
      <circle cx={cx + 10} cy={cy + 44} r="3" fill="#3aa6d9"/>
      <circle cx={cx - 10} cy={cy + 44} r="3" fill="#e7892b"/>
    </svg>
  );
}

function CultivosPlanificador() {
  return (
    <>
      <div className="mc-card ia-card">
        <div className="mc-card__head">
          <div className="row gap-8" style={{ alignItems: "center" }}>
            <div className="mc-card__title">Planes Activos</div>
            <IABadge/>
          </div>
          <button className="mc-icon-btn"><Icon name="chevRight" size={13}/></button>
        </div>
        <div className="grid g-cols-3 gap-14">
          {[
            { titulo: "Maíz Tardío - Lotes Norte", emoji: "🌽", costo: "$45.500 USD", lotes: "4, 5, 8", ha: "320 Ha", fecha: "20-25 Oct", insumo: "Híbrido DK-7210", densidad: "70 pl/Ha", steps: 3, color: "#d9a538" },
            { titulo: "Soja Primera - Lotes Sur", emoji: "🌱", costo: "$62.000 USD", lotes: "9, 12, 15", ha: "450 Ha", fecha: "05-10 Nov", insumo: "Semilla SY 5x1", densidad: "280k pl/Ha", steps: 2, color: "#4f9d52" },
            { titulo: "Girasol - Lotes Oeste", emoji: "🌻", costo: "$55.000 USD", lotes: "1, 3, 7", ha: "280 Ha", fecha: "15-20 Nov", insumo: "Semilla P245", densidad: "60k pl/Ha", steps: 4, color: "#e7892b" },
          ].map((p, i) => (
            <div key={i} style={{ border: `1.5px solid ${p.color}50`, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {/* Card header strip */}
              <div style={{ background: `${p.color}15`, borderBottom: `1.5px solid ${p.color}30`, padding: "12px 16px" }}>
                <div className="row gap-10" style={{ alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: p.color, display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>{p.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 13, lineHeight: 1.3 }}>{p.titulo}</div>
                    <div className="text-xs text-muted mt-2">{p.ha} · Lotes {p.lotes}</div>
                  </div>
                </div>
              </div>
              {/* Data rows */}
              <div style={{ padding: "12px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 11, color: "var(--mc-text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Inversión Est.</div>
                  <div style={{ fontFamily: "var(--ff-display)", fontSize: 17, color: p.color, fontWeight: 700 }}>{p.costo}</div>
                </div>
                <div className="mc-divider"></div>
                <div className="row gap-8" style={{ fontSize: 12 }}>
                  <div style={{ flex: 1, padding: "8px 10px", background: "var(--mc-surface-2)", borderRadius: 8 }}>
                    <div className="text-xs text-muted">Fecha</div>
                    <div className="font-semi mt-2" style={{ color: "var(--mc-ink)" }}>{p.fecha}</div>
                  </div>
                  <div style={{ flex: 1, padding: "8px 10px", background: "var(--mc-surface-2)", borderRadius: 8 }}>
                    <div className="text-xs text-muted">Densidad</div>
                    <div className="font-semi mt-2" style={{ color: "var(--mc-ink)" }}>{p.densidad}</div>
                  </div>
                </div>
                <div style={{ padding: "8px 10px", background: "var(--mc-surface-2)", borderRadius: 8, fontSize: 12 }}>
                  <div className="text-xs text-muted">Insumo</div>
                  <div className="font-semi mt-2" style={{ color: "var(--mc-ink)" }}>{p.insumo}</div>
                </div>
                {/* Progress stepper */}
                <div className="row gap-2" style={{ alignItems: "center", marginTop: 4 }}>
                  {["Borrador","Insumos","Asignación","Listo"].map((s, j) => (
                    <React.Fragment key={j}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ width: "100%", height: 4, borderRadius: 2, background: j < p.steps ? p.color : "var(--mc-line)" }}></div>
                        <div style={{ fontSize: 9, color: j < p.steps ? p.color : "var(--mc-text-3)", fontWeight: j < p.steps ? 700 : 400, textAlign: "center" }}>{s}</div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              {/* Actions */}
              <div className="row gap-8" style={{ padding: "10px 16px", borderTop: `1.5px solid ${p.color}20` }}>
                <button className="mc-btn mc-btn--secondary mc-btn--sm flex-1" style={{ fontSize: 11 }}><Icon name="edit" size={10}/>Editar</button>
                <button className="mc-btn mc-btn--primary mc-btn--sm flex-1" style={{ fontSize: 11, background: p.color, border: "none" }}><Icon name="arrowRight" size={11}/>Avanzar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mc-card ia-card">
        <div className="mc-card__head">
          <div className="row gap-8" style={{ alignItems: "center" }}>
            <div className="mc-card__title">Planes Recomendados por IA</div>
            <IABadge/>
          </div>
          <button className="mc-icon-btn"><Icon name="chevRight" size={13}/></button>
        </div>
        <div className="grid g-cols-3 gap-14">
          {[
            { sugerencia: "Rotación a Maíz Tardío", confianza: 92, nivel: "Alta", color: "#4f9d52", lotes: "Lotes 3 y 7", razon: "Compactación severa y déficit de N en suelo detectado.", proy: "+15% margen vs. repetir Soja", beneficio: "Aporte clave de rastrojo y mejora estructural del suelo." },
            { sugerencia: "Cultivo de Cobertura", confianza: 85, nivel: "Alta", color: "#3aa6d9", lotes: "Lotes 2 y 8", razon: "Alto riesgo de erosión y presión de malezas invernales.", proy: "Costo est. $30 USD/ha — reduce herbicidas", beneficio: "Protección de suelo, mejora de humedad, supresión de malezas." },
            { sugerencia: "Nitrógeno Variable", confianza: 78, nivel: "Media", color: "#e7892b", lotes: "Lotes 5 y 9", razon: "Variabilidad significativa de N y zonas de bajo potencial.", proy: "+8% rinde estimado por eficiencia de uso", beneficio: "Optimización de insumos y menor impacto ambiental." },
          ].map((p, i) => (
            <div key={i} style={{ border: "1.5px solid var(--mc-line)", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
              {/* IA badge floating top-right */}
              <div style={{ position: "absolute", top: 10, right: 12, padding: "3px 8px", background: "linear-gradient(135deg, #FFF8EC, #FFF0DD)", border: "1.5px solid #FF9D00", borderRadius: 999, display: "flex", alignItems: "center", gap: 5, zIndex: 1, boxShadow: "0 1px 3px rgba(255,157,0,0.15)" }}>
                <IABadge/>
                <span style={{ fontSize: 9, fontWeight: 800, color: "#a85f00", letterSpacing: "0.06em", textTransform: "uppercase" }}>IA</span>
              </div>
              {/* Header */}
              <div style={{ padding: "14px 16px 12px", background: `${p.color}10`, borderBottom: "1.5px solid var(--mc-line)", paddingRight: 70 }}>
                <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 14, lineHeight: 1.25 }}>{p.sugerencia}</div>
                <div className="row gap-6 mt-4" style={{ alignItems: "baseline" }}>
                  <span style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 800, color: p.color, lineHeight: 1 }}>{p.confianza}%</span>
                  <span style={{ fontSize: 10, color: p.color, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Confianza {p.nivel}</span>
                </div>
              </div>
              <div style={{ padding: "12px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12 }}>
                  <div className="text-xs text-muted" style={{ marginBottom: 2 }}>Lotes afectados</div>
                  <div className="font-semi" style={{ color: "var(--mc-ink)" }}>{p.lotes}</div>
                </div>
                <div style={{ padding: "10px 12px", background: "var(--mc-surface-2)", borderRadius: 9, fontSize: 12 }}>
                  <div className="row gap-6 mb-4" style={{ alignItems: "center" }}>
                    <IABadge/>
                    <div className="font-semi" style={{ color: "var(--mc-ink)" }}>Razonamiento</div>
                  </div>
                  <div className="text-muted">{p.razon}</div>
                </div>
                <div style={{ padding: "10px 12px", background: `${p.color}0d`, borderRadius: 9, fontSize: 12 }}>
                  <div className="row gap-6 mb-4" style={{ alignItems: "center" }}>
                    <IABadge/>
                    <div style={{ color: p.color, fontWeight: 700, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.06em" }}>Proyección</div>
                  </div>
                  <div className="font-semi" style={{ color: "var(--mc-ink)" }}>{p.proy}</div>
                </div>
                <div style={{ padding: "10px 12px", background: "linear-gradient(to right, #00FF0010, #FF9D0010)", border: "1.5px solid #FF9D0040", borderRadius: 9, fontSize: 12 }}>
                  <div className="row gap-6 mb-4" style={{ alignItems: "center" }}>
                    <IABadge/>
                    <div style={{ color: "#a85f00", fontWeight: 700, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.06em" }}>Beneficio Clave</div>
                  </div>
                  <div style={{ color: "var(--mc-ink)", fontWeight: 600, lineHeight: 1.4 }}>{p.beneficio}</div>
                </div>
              </div>
              <div className="row gap-8" style={{ padding: "10px 16px", borderTop: "1.5px solid var(--mc-line)" }}>
                <button className="mc-btn mc-btn--secondary mc-btn--sm flex-1" style={{ fontSize: 11, color: "var(--mc-red)" }}><Icon name="x" size={10}/>Descartar</button>
                <button className="mc-btn mc-btn--primary mc-btn--sm flex-1" style={{ fontSize: 11 }}>Convertir en Plan</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function CultivosAnalisisSuelo() {
  const lotesAnalisis = [
    { lote: "Lote 4 - El Bajo", cultivo: "Maíz Tardío - Hace 2 semanas", n: 60, p: 40, k: 90, ph: 6.2, mo: "2.8%", phStatus: "ok", moStatus: "ok" },
    { lote: "Lote 12 - Norte", cultivo: "Trigo Ciclo Corto - Hace 3 días", n: 95, p: 75, k: 60, ph: 6.2, mo: "1.8%", phStatus: "ok", moStatus: "warn" },
    { lote: "Lote 7 - La Loma", cultivo: "Soja de Primera - Hace 1 mes", n: 30, p: 85, k: 65, ph: 5.8, mo: "3.2%", phStatus: "warn", moStatus: "ok" },
    { lote: "Lote 4 - El Bajo", cultivo: "Maíz Tardío - Hace 2 semanas", n: 20, p: 60, k: 90, ph: 6.2, mo: "2.8%", phStatus: "ok", moStatus: "ok" },
  ];

  const labResults = [
    { fecha: "15/10/2024", lote: "Lote Norte", prof: "0-20", p: "8 ppm", n: 45, ph: "5.5", phWarn: true, estado: "Crítico", estadoColor: "red" },
    { fecha: "14/10/2024", lote: "Lote Sur", prof: "0-20", p: "18 ppm", n: 60, ph: "6.2", estado: "Alerta", estadoColor: "amber" },
    { fecha: "12/10/2024", lote: "Lote Este", prof: "0-20", p: "25 ppm", n: 75, ph: "6.8", estado: "Óptimo", estadoColor: "green" },
    { fecha: "10/10/2024", lote: "Lote Oeste", prof: "20-40", p: "12 ppm", n: 50, ph: "6.0", phWarn: true, estado: "Alerta", estadoColor: "amber" },
  ];

  return (
    <>
      <div className="mc-card ia-card">
        <div className="mc-card__head"><div className="mc-card__title">Análisis del Suelo</div><IABadge/></div>
        <div className="grid g-cols-2 gap-12">
          {lotesAnalisis.map((l, i) => (
            <div key={i} style={{ padding: 14, border: "1px solid var(--mc-line)", borderRadius: 10, display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr auto", gap: 16, alignItems: "center" }}>
              <div>
                <div className="text-xs text-muted" style={{ textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>Identidad</div>
                <div className="font-semi text-sm mt-4" style={{ color: "var(--mc-ink)" }}>📍 {l.lote}</div>
                <div className="text-xs text-muted mt-2">{l.cultivo}</div>
              </div>
              <div>
                <div className="text-xs text-muted" style={{ textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>Macronutrientes</div>
                <div className="col gap-4 mt-4">
                  <NutBar letter="N" value={l.n}/>
                  <NutBar letter="P" value={l.p}/>
                  <NutBar letter="K" value={l.k}/>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted" style={{ textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>Salud del Suelo</div>
                <div className="row gap-4 mt-4" style={{ alignItems: "center", fontSize: 13 }}>
                  <span className="font-semi">pH {l.ph}</span>
                  <span style={{ color: l.phStatus === "ok" ? "var(--mc-green-700)" : "var(--mc-amber)" }}>{l.phStatus === "ok" ? "?" : "?"}</span>
                </div>
                <div className="row gap-4" style={{ alignItems: "center", fontSize: 13 }}>
                  <span className="font-semi">MO {l.mo}</span>
                  <span style={{ color: l.moStatus === "ok" ? "var(--mc-green-700)" : "var(--mc-amber)" }}>⬤</span>
                </div>
              </div>
              <div className="col gap-4" style={{ minWidth: 130 }}>
                <div className="text-xs text-muted" style={{ textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em", marginBottom: 4 }}>Acciones</div>
                <button className="mc-btn mc-btn--primary mc-btn--sm" style={{ width: "100%", padding: "5px 8px", fontSize: 11, justifyContent: "center", gap: 5 }}><IABadge/>Receta IA</button>
                <button className="mc-btn mc-btn--secondary mc-btn--sm" style={{ width: "100%", padding: "5px 8px", fontSize: 11, justifyContent: "center", gap: 5 }}><Icon name="calendar" size={11}/>Programar</button>
                <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ width: "100%", padding: "5px 8px", fontSize: 11, justifyContent: "center", gap: 5 }}><Icon name="search" size={11}/>Ver detalle</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid g-cols-2 gap-16">
        <div className="mc-card">
          <div className="mc-card__head"><div className="mc-card__title">Últimos Resultados de Laboratorio</div></div>
          <table className="mc-table">
            <thead>
              <tr><th>Fecha</th><th>Lote</th><th>Prof. (cm)</th><th>P (ppm)</th><th>N (kg/ha)</th><th>pH</th><th>Estado</th><th>PDF</th></tr>
            </thead>
            <tbody>
              {labResults.map((r, i) => (
                <tr key={i}>
                  <td className="mc-cell--mono">{r.fecha}</td>
                  <td>{r.lote}</td>
                  <td className="mc-cell--mono">{r.prof}</td>
                  <td><span style={{ color: r.estadoColor === "red" ? "var(--mc-red)" : "var(--mc-ink)", fontWeight: r.estadoColor === "red" ? 700 : 500 }}>{r.p} {r.estadoColor === "red" && "?"}</span></td>
                  <td className="mc-cell--mono">{r.n}</td>
                  <td><span style={{ color: r.phWarn ? "var(--mc-red)" : "var(--mc-ink)" }}>{r.ph} {r.phWarn && "?"}</span></td>
                  <td><span className={`mc-badge mc-badge--${r.estadoColor}`}>{r.estado}</span></td>
                  <td><button className="mc-icon-btn" style={{ width: 22, height: 22, border: "none" }}><Icon name="download" size={11}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__title">Evolución Histórica:</div>
            <div className="mc-seg"><button className="is-on">Tipo</button><button>Lote</button></div>
          </div>
          <svg viewBox="0 0 400 220" width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
            {[0, 10, 20, 30, 40].map((v, i) => {
              const y = 200 - (v / 40) * 170;
              return <g key={i}><line x1="40" y1={y} x2="390" y2={y} stroke="var(--mc-line)" strokeDasharray="2,3"/><text x="32" y={y + 3} fontSize="9" fontFamily="var(--ff-mono)" fill="var(--mc-text-3)" textAnchor="end">{v}</text></g>;
            })}
            <text x="22" y="120" fontSize="9" fontFamily="var(--ff-ui)" fill="var(--mc-text-3)" textAnchor="middle" transform="rotate(-90, 22, 120)">ppm</text>
            {/* línea umbral crítico */}
            <line x1="40" y1={200 - (15 / 40) * 170} x2="390" y2={200 - (15 / 40) * 170} stroke="var(--mc-red)" strokeDasharray="4,3" opacity="0.6"/>
            <text x="385" y={200 - (15 / 40) * 170 - 4} fontSize="9" fill="var(--mc-red)" textAnchor="end">Umbral Crítico (15 ppm)</text>
            <polyline points="60,140 130,180 200,160 270,170 340,90" fill="none" stroke="var(--mc-blue)" strokeWidth="2.5"/>
            {[60,130,200,270,340].map((x, i) => <circle key={i} cx={x} cy={[140,180,160,170,90][i]} r="4" fill="var(--mc-blue)"/>)}
            {[2020,2021,2022,2023,2024].map((y, i) => <text key={y} x={[60,130,200,270,340][i]} y="218" fontSize="10" fontFamily="var(--ff-ui)" fill="var(--mc-text-2)" textAnchor="middle">{y}</text>)}
          </svg>
        </div>
      </div>
    </>
  );
}

function NutBar({ letter, value }) {
  const color = value < 35 ? "var(--mc-red)" : value < 65 ? "var(--mc-amber)" : "var(--mc-green-500)";
  return (
    <div className="row gap-4" style={{ alignItems: "center", fontSize: 11 }}>
      <span style={{ width: 14, fontWeight: 700, color: "var(--mc-ink)" }}>{letter}</span>
      <span style={{ color: value < 35 ? "var(--mc-red)" : "var(--mc-text)" }}>{value < 35 ? "?" : "?"}</span>
      <div className="mc-prog" style={{ flex: 1, height: 6 }}><div className="mc-prog__bar" style={{ width: `${value}%`, background: color }}></div></div>
      <span className="font-mono" style={{ width: 32, textAlign: "right" }}>{value}%</span>
    </div>
  );
}

/* ========== REPORTAR PLAGA MODAL ========== */
function ReportarPlagaModal({ onClose }) {
  const { useState } = React;
  const [lote, setLote] = useState("Lote 4 - Maíz 140");
  const [busqueda, setBusqueda] = useState("");
  const [tags, setTags] = useState(["Roya Común"]);
  const [sugerencias] = useState(["Roya Común (Puccinia)","Pulgón Verde","Oruga Cogollera","Mancha Marrón","Esclerotinia","Fusarium","Mildiu","Carbón"]);
  const [incidencia, setIncidencia] = useState(15);
  const [notas, setNotas] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const addTag = (s) => {
    const nombre = s.split(" (")[0];
    if (!tags.includes(nombre)) setTags([...tags, nombre]);
    setBusqueda("");
  };
  const removeTag = (t) => setTags(tags.filter(x => x !== t));

  const filtradas = busqueda.length > 1
    ? sugerencias.filter(s => s.toLowerCase().includes(busqueda.toLowerCase()) && !tags.includes(s.split(" (")[0]))
    : [];

  const incColor = incidencia < 20 ? "#22a261" : incidencia < 50 ? "#e59700" : "#d94040";

  const tagColors = ["#22a261","#2c82c9","#d94040","#9b5de5","#e59700"];

  const lotes = ["Lote 1 - Trigo 80","Lote 2 - Maíz 95","Lote 4 - Maíz 140","Lote 5 - Girasol 60","Lote 7 - Soja 110"];

  const inp = { width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #c0c5ce", background:"#fff", color:"var(--mc-ink)", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };
  const Section = ({ icon, title, right, children }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }}/>
        {right}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,22,36,0.55)", zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"#fff", borderRadius:16, width:820, maxWidth:"100%", maxHeight:"92vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,0.22)" }}>

        {/* Header gradient */}
        <div style={{ background:"linear-gradient(135deg,#475569 0%,#1e293b 100%)", padding:"22px 28px 20px", color:"#fff", display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:11, opacity:0.8, marginBottom:6, letterSpacing:".06em", textTransform:"uppercase" }}>Agricultura · Campo Digital · Detección</div>
            <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-.02em", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:26 }}>🐛</span> Reportar Plaga o Enfermedad
            </div>
            <div style={{ fontSize:13, opacity:0.85, marginTop:4 }}>Generá una alerta para que el equipo agronómico la priorice.</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.18)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:8, width:34, height:34, cursor:"pointer", color:"#fff", fontSize:17, display:"grid", placeItems:"center", flexShrink:0 }}>?</button>
        </div>

        {/* Body */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", flex:1, overflow:"hidden" }}>

          {/* Left */}
          <div style={{ padding:"22px 22px 22px 28px", overflowY:"auto", borderRight:"1px solid #e2e8f0" }}>

            <Section icon="📍" title="Ubicación">
              <select value={lote} onChange={e=>setLote(e.target.value)} style={inp}>
                {lotes.map(l=><option key={l}>{l}</option>)}
              </select>
            </Section>

            <Section icon="🔍" title="Identificación">
              <div style={{ position:"relative" }}>
                <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar Plaga o Enfermedad..." style={inp}/>
                {filtradas.length > 0 && (
                  <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:8, zIndex:10, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", overflow:"hidden", marginTop:4 }}>
                    {filtradas.slice(0,5).map(s=>(
                      <div key={s} onClick={()=>addTag(s)} style={{ padding:"9px 14px", cursor:"pointer", fontSize:13, color:"var(--mc-ink)" }}
                        onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {tags.length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:10 }}>
                  {tags.map((t,i)=>(
                    <span key={t} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:600, color:"#fff", background:tagColors[i % tagColors.length] }}>
                      ? {t}
                      <span onClick={()=>removeTag(t)} style={{ cursor:"pointer", opacity:0.7, fontSize:14, lineHeight:1 }}>×</span>
                    </span>
                  ))}
                </div>
              )}

              {tags.length > 0 && (
                <div style={{ marginTop:12, padding:"10px 14px", background:"#f8fafc", borderRadius:8, border:"1.5px solid #e2e8f0" }}>
                  <div style={{ fontSize:11, color:"var(--mc-muted)", marginBottom:3, textTransform:"uppercase", letterSpacing:".04em", fontWeight:600 }}>Nombre técnico identificado</div>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--mc-ink)" }}>{tags[0] === "Roya Común" ? "Roya Común (Puccinia sorghi)" : tags[0] === "Oruga Cogollera" ? "Oruga Cogollera (Spodoptera frugiperda)" : tags[0] === "Pulgón Verde" ? "Pulgón Verde (Schizaphis graminum)" : `${tags[0]}`}</div>
                </div>
              )}
            </Section>

            <Section icon="📊" title="Nivel de Daño" right={<span style={{ fontSize:13, fontWeight:700, color:incColor }}>Incidencia {incidencia}%</span>}>
              <div style={{ position:"relative", height:10, borderRadius:6, background:"linear-gradient(to right,#22a261,#e59700,#d94040)", marginBottom:10, overflow:"visible" }}>
                <div style={{ position:"absolute", left:`${incidencia}%`, top:"50%", transform:"translate(-50%,-50%)", width:18, height:18, borderRadius:"50%", background:"#fff", border:`2.5px solid ${incColor}`, boxShadow:"0 2px 6px rgba(0,0,0,0.2)", zIndex:1 }}/>
                <input type="range" min={1} max={100} value={incidencia} onChange={e=>setIncidencia(+e.target.value)}
                  style={{ width:"100%", opacity:0, position:"absolute", top:-4, left:0, height:18, cursor:"pointer", margin:0 }}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--mc-muted)" }}>
                <span>Leve (1–20%)</span><span>Moderado (20–50%)</span><span>Severo (50–100%)</span>
              </div>
            </Section>
          </div>

          {/* Right */}
          <div style={{ padding:"22px 28px 22px 22px", overflowY:"auto", display:"flex", flexDirection:"column" }}>

            <Section icon="📷" title="Foto del Lote">
              <div onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false)}}
                style={{ border:`2px dashed ${dragOver?"#475569":"#c0c5ce"}`, borderRadius:10, padding:"30px 20px", textAlign:"center", background:dragOver?"rgba(71,85,105,0.06)":"#f8fafc", cursor:"pointer", transition:"all 0.2s" }}>
                <div style={{ fontSize:30, marginBottom:8 }}>📷</div>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--mc-ink)", marginBottom:4 }}>Arrastrar foto o Capturar</div>
                <div style={{ fontSize:11, color:"var(--mc-muted)", marginBottom:14 }}>+ adicionar archivo</div>
                <label className="mc-btn mc-btn--primary mc-btn--sm" style={{ cursor:"pointer" }}>
                  <input type="file" accept="image/*" style={{ display:"none" }}/>
                  Seleccionar Archivo
                </label>
              </div>
            </Section>

            <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 14 }}>📝</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Observaciones / Notas de campo</span>
                <div style={{ flex: 1, height: 1, background: "#e2e8f0" }}/>
              </div>
              <textarea value={notas} onChange={e=>setNotas(e.target.value)} placeholder="Escribir detalles adicionales aquí..."
                style={{ flex:1, minHeight:120, padding:"11px 13px", borderRadius:8, border:"1.5px solid #c0c5ce", background:"#fff", color:"var(--mc-ink)", fontSize:13, resize:"vertical", fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}/>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"16px 28px", borderTop:"1px solid #e2e8f0", display:"flex", justifyContent:"flex-end", gap:10, flexShrink:0 }}>
          <button onClick={onClose} className="mc-btn mc-btn--secondary">Cancelar</button>
          <button className="mc-btn mc-btn--slate">
            <Icon name="alert" size={14}/> Generar Alerta
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========== ENFERMEDADES IA — con subpestañas ========== */
function CDEnfermedades() {
  const { useState } = React;
  const [sub, setSub] = useState("Información");
  const [reportarOpen, setReportarOpen] = useState(false);

  return (
    <>
      {reportarOpen && <ReportarPlagaModal onClose={()=>setReportarOpen(false)}/>}

      <div className="grid g-cols-5">
        <KPI label="Alertas Activas" value="5" delta="2 críticas" trend="warn" icon="alert" warn/>
        <KPI label="Confianza IA" value="96%" delta="Alta precisión" trend="up" icon="target" accent/>
        <KPI label="Vigor Promedio (NDVI)" value="0.78" delta="Alto" trend="up" icon="leaf"/>
        <KPI label="Riesgo Económico" value="$1.250" delta="USD/Ha potencial" trend="warn" icon="dollar"/>
        <KPI label="Monitoreo Semanal" value="85%" delta="17/20 lotes" trend="up" icon="check"/>
      </div>

      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <SubTabs tabs={["Información","Análisis (IA)"]} active={sub} onChange={setSub}/>
        <div className="row gap-8">
          <button className="mc-btn mc-btn--primary"><Icon name="upload" size={14}/>Cargar Imagen de Lote</button>
          <button className="mc-btn mc-btn--slate" onClick={()=>setReportarOpen(true)}><Icon name="alert" size={14}/>Reportar Plaga</button>
        </div>
      </div>

      {sub === "Información" && <EnfermedadesInfo/>}
      {sub === "Análisis (IA)" && <EnfermedadesAnalisisIA/>}
    </>
  );
}

function EnfermedadesInfo() {
  const { useState } = React;
  const [enlarged, setEnlarged] = useState(null);

  const alertas = [
    { lote: "Lote 4 (Maíz)", enfermedad: "Roya Común (Puccinia)", estadio: "R1 (Floración)", img: "🌽", imgBg: "linear-gradient(135deg,#4f9d52,#3aa6d9)", deteccion: "Detección Satelital NDVI", afect: "15 Ha afectadas · Hace 2h", riesgo: "ALTA (35%)", riesgoColor: "red", perdida: "$4.500 USD", proy: "Proyección a cosecha", recom: "Aplicar Fungicida (Triazol)", iaIcon: true },
    { lote: "Lote 2 (Maíz)", enfermedad: "Oruga Cogollera", estadio: "V8 (Vegetativo)", img: "🐛", imgBg: "linear-gradient(135deg,#6db870,#4f9d52)", deteccion: "Foto de Monitoreo (Dani)", afect: "8 Ha afectadas · Ayer", riesgo: "MEDIA (15%)", riesgoColor: "amber", perdida: "$1.200 USD", proy: "Daño foliar progresivo", recom: "Monitoreo + Insecticida" },
    { lote: "Lote 7 (Soja)", enfermedad: "Mancha Marrón", estadio: "R3 (Form. Vainas)", img: "🌱", imgBg: "linear-gradient(135deg,#9ecf8c,#6db870)", deteccion: "Detección Satelital NDVI", afect: "20 Ha afectadas · Hace 5h", riesgo: "BAJA (5%)", riesgoColor: "green", perdida: "$500 USD", proy: "Impacto leve", recom: "Monitoreo Intensivo", iaIcon: true },
    { lote: "Lote 1 (Trigo)", enfermedad: "Pulgón Verde", estadio: "Z31 (Primer Nudo)", img: "🌾", imgBg: "linear-gradient(135deg,#a88032,#d9a538)", deteccion: "Foto de Campo", afect: "30 Ha afectadas · Hace 1h", riesgo: "ALTA (40%)", riesgoColor: "red", perdida: "$3.200 USD", proy: "Rápida propagación", recom: "Aplicar Insecticida Sistémico" },
    { lote: "Lote 5 (Girasol)", enfermedad: "Esclerotinia", estadio: "R5 (Llenado Grano)", img: "🌻", imgBg: "linear-gradient(135deg,#e8b94a,#d9a538)", deteccion: "Detección Satelital NDVI", afect: "12 Ha afectadas · Ayer", riesgo: "MEDIA (20%)", riesgoColor: "amber", perdida: "$2.100 USD", proy: "Riesgo de vuelco", recom: "Evaluar Daño y Cosecha Anticipada", iaIcon: true },
  ];

  return (
    <>
    {enlarged && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 200, display: "grid", placeItems: "center" }} onClick={() => setEnlarged(null)}>
        <div style={{ background: "var(--mc-surface)", borderRadius: 14, padding: 20, width: 460, maxWidth: "92vw", boxShadow: "0 12px 48px rgba(0,0,0,0.35)" }} onClick={e => e.stopPropagation()}>
          <div style={{ width: "100%", aspectRatio: "16/10", background: enlarged.imgBg, borderRadius: 10, display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden", position: "relative", marginBottom: 14 }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 64 }}>{enlarged.img}</div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.7))", padding: "14px 16px" }}>
              <div style={{ color: "white", fontWeight: 700, fontSize: 13 }}>{enlarged.deteccion}</div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{enlarged.afect}</div>
            </div>
          </div>
          <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 15 }}>{enlarged.enfermedad}</div>
          <div className="text-xs text-muted mt-2">{enlarged.lote} · {enlarged.estadio}</div>
          <button onClick={() => setEnlarged(null)} className="mc-btn mc-btn--secondary mc-btn--sm mt-12" style={{ width: "100%", justifyContent: "center" }}>Cerrar</button>
        </div>
      </div>
    )}
    <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
      <div className="mc-card ia-card">
        <div className="mc-card__head"><div className="mc-card__title">Alertas Activas</div><IABadge/></div>
        <div className="col gap-8">
          {alertas.map((a, i) => (
            <div key={i} style={{ padding: "10px 12px", border: "1px solid var(--mc-line)", borderRadius: 10, display: "grid", gridTemplateColumns: "120px 1fr 90px 120px 120px 140px", gap: 10, alignItems: "center" }}>
              {/* Image cell — 120×80 with detection overlay, click to enlarge */}
              <div style={{ width: 120, height: 80, borderRadius: 8, background: a.imgBg, position: "relative", overflow: "hidden", cursor: "pointer", flexShrink: 0 }} onClick={() => setEnlarged(a)}>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-60%)", fontSize: 32 }}>{a.img}</div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.65)", padding: "4px 6px" }}>
                  <div style={{ color: "white", fontSize: 9, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.deteccion}</div>
                </div>
              </div>
              {/* Lot + disease info */}
              <div>
                <div className="font-semi text-xs" style={{ color: "var(--mc-ink)" }}>{a.lote}</div>
                <div className="text-xs text-muted">{a.enfermedad}</div>
                <div className="text-xs text-muted" style={{ fontSize: 9, marginTop: 2 }}>{a.estadio}</div>
              </div>
              {/* % probabilidad */}
              <div className="col gap-4" style={{ alignItems: "flex-start" }}>
                <span className={`mc-badge mc-badge--${a.riesgoColor}`} style={{ fontSize: 10, whiteSpace: "nowrap" }}>{a.riesgo}</span>
                {a.iaIcon && <div style={{ marginTop: 4 }}><IABadge/></div>}
              </div>
              {/* Ha afectadas + hace cuánto */}
              <div className="col gap-2">
                {(() => {
                  const [haText, timeText] = a.afect.split(" · ");
                  return <>
                    <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 11 }}>{haText}</div>
                    <div className="text-xs text-muted">{timeText}</div>
                  </>;
                })()}
              </div>
              {/* Riesgo de pérdida */}
              <div className="col gap-2">
                <div className="text-xs text-muted" style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Riesgo Pérdida</div>
                <div className="font-semi" style={{ color: "var(--mc-red)", fontSize: 13 }}>{a.perdida}</div>
                <div className="text-xs text-muted" style={{ fontSize: 9 }}>{a.proy}</div>
              </div>
              {/* Action buttons — equal width + centered */}
              <div className="col gap-6">
                <button className="mc-btn mc-btn--secondary mc-btn--sm" style={{ padding: "5px 8px", fontSize: 10, width: "100%", justifyContent: "center" }}>
                  🔍 {a.recom.length > 22 ? a.recom.slice(0,22)+"…" : a.recom}
                </button>
                <button className="mc-btn mc-btn--primary mc-btn--sm" style={{ padding: "5px 8px", fontSize: 10, width: "100%", justifyContent: "center" }}>
                  <Icon name="plus" size={10}/>Agregar a Labores
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="col gap-14">
        <div className="mc-card ia-card">
          <div className="mc-card__head">
            <div className="row gap-8" style={{ alignItems: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--mc-green-100)", display: "grid", placeItems: "center" }}>✓</div>
              <div className="mc-card__title">Estrategia de Control Sugerida</div>
            </div>
            <IABadge/>
          </div>
          <div className="text-xs text-muted">Estrategia de Control Sugerida</div>
          <div className="font-semi mt-4" style={{ color: "var(--mc-ink)", fontSize: 16 }}>Fungicida (Triazol + Estrob.)</div>
          <div className="text-xs text-muted">Tratamiento Prioritario para Roya</div>
          <div className="grid g-cols-3 gap-8 mt-12">
            <div style={{ padding: 8, background: "var(--mc-surface-2)", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 16 }}>📍</div>
              <div className="text-xs text-muted">Dosis</div>
              <div className="font-semi text-sm">400 cc/Ha</div>
            </div>
            <div style={{ padding: 8, background: "var(--mc-surface-2)", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 16 }}>?</div>
              <div className="text-xs text-muted">Próx. Vent. Óptima</div>
              <div className="font-semi text-sm">4 hs</div>
            </div>
            <div style={{ padding: 8, background: "var(--mc-surface-2)", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 16 }}>📅</div>
              <div className="text-xs text-muted">Costo Estimado</div>
              <div className="font-semi text-sm">$28/Ha</div>
            </div>
          </div>
          <div className="text-xs mt-8" style={{ padding: 8, background: "var(--mc-green-50)", borderRadius: 6, color: "var(--mc-text)" }}>
            <span className="font-semi" style={{ color: "var(--mc-green-700)" }}>Análisis IA:</span> Eficacia contra la roya en ensayos de campo. La combinación Triazol + Estrobilurina ofrece control preventivo, curativo y antiestresantes.
          </div>
        </div>

        <div className="mc-card ia-card">
          <div className="mc-card__head">
            <div className="row gap-8" style={{ alignItems: "center" }}>
              <div className="mc-card__title">Probabilidades</div>
              <IABadge/>
            </div>
            <span className="text-xs text-muted">Análisis predictivo · 7d</span>
          </div>
          <div className="col gap-10">
            {[
              { rank: 1, nombre: "Roya Común", cientifico: "Puccinia sorghi", pct: 88, color: "#d13a3a", colorLight: "#e85f5f", tinte: "rgba(209,58,58,0.08)", tendencia: "up", deltaText: "+12% vs ayer", riesgo: "ALTO", lotes: ["Lote 4", "Lote 7"] },
              { rank: 2, nombre: "Tizón del Maíz", cientifico: "Exserohilum turcicum", pct: 42, color: "#d9a538", colorLight: "#e8b859", tinte: "rgba(217,165,56,0.08)", tendencia: "flat", deltaText: "Estable", riesgo: "MEDIO", lotes: ["Lote 2"] },
              { rank: 3, nombre: "Cercospora", cientifico: "Mancha Gris", pct: 15, color: "#4f9d52", colorLight: "#6db870", tinte: "rgba(79,157,82,0.08)", tendencia: "down", deltaText: "Bajando", riesgo: "BAJO", lotes: ["Lote 5"] },
            ].map((p, i) => (
              <div key={i} style={{ padding: "12px 14px", background: p.tinte, borderRadius: 10, border: `1px solid ${p.color}30`, borderLeft: `4px solid ${p.color}` }}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  {/* Left: rank + name */}
                  <div className="row gap-10" style={{ alignItems: "center", flex: 1, minWidth: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: p.color, color: "white", display: "grid", placeItems: "center", fontFamily: "var(--ff-display)", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                      {p.rank}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 13, lineHeight: 1.2 }}>{p.nombre}</div>
                      <div className="text-xs" style={{ color: "var(--mc-text-2)", fontStyle: "italic" }}>{p.cientifico}</div>
                    </div>
                  </div>
                  {/* Right: big pct + risk pill */}
                  <div className="col" style={{ alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
                    <div style={{ fontFamily: "var(--ff-display)", fontSize: 26, fontWeight: 800, color: p.color, lineHeight: 1 }}>{p.pct}%</div>
                    <span style={{ padding: "2px 8px", background: p.color, color: "white", borderRadius: 999, fontSize: 9, fontWeight: 800, letterSpacing: "0.06em" }}>
                      {p.riesgo}
                    </span>
                  </div>
                </div>
                {/* Progress with gradient */}
                <div style={{ height: 6, background: `${p.color}20`, borderRadius: 999, marginTop: 10, overflow: "hidden", position: "relative" }}>
                  <div style={{ height: "100%", width: `${p.pct}%`, background: `linear-gradient(90deg, ${p.color}, ${p.colorLight})`, borderRadius: 999 }}></div>
                </div>
                {/* Footer: trend + lotes */}
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginTop: 10, gap: 8 }}>
                  <div className="row gap-6" style={{ alignItems: "center" }}>
                    <svg width="16" height="14" viewBox="0 0 16 14">
                      {p.tendencia === "up" && <path d="M2 11 L7 6 L10 9 L14 3 M14 3 L10 3 M14 3 L14 7" stroke={p.color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}
                      {p.tendencia === "flat" && <path d="M2 7 L14 7 M14 7 L11 4 M14 7 L11 10" stroke={p.color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}
                      {p.tendencia === "down" && <path d="M2 3 L7 8 L10 5 L14 11 M14 11 L10 11 M14 11 L14 7" stroke={p.color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}
                    </svg>
                    <span className="text-xs" style={{ color: p.color, fontWeight: 700 }}>{p.deltaText}</span>
                  </div>
                  <div className="row gap-4" style={{ alignItems: "center" }}>
                    <span className="text-xs text-muted" style={{ fontWeight: 600 }}>Afectados:</span>
                    {p.lotes.map((l, j) => (
                      <span key={j} style={{ padding: "2px 8px", background: "var(--mc-surface)", border: `1px solid ${p.color}40`, borderRadius: 999, fontSize: 10, fontWeight: 700, color: p.color }}>
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

function EnfermedadesAnalisisIA() {
  return (
    <div className="grid" style={{ gridTemplateColumns: "1.2fr 1fr", gap: 14 }}>
      <div className="mc-card ia-card">
        <div className="mc-card__head">
          <div className="mc-card__title">Detección</div>
          <button className="mc-btn mc-btn--primary mc-btn--sm"><Icon name="upload" size={12}/>Cargar Imagen</button>
        </div>
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/10", background: "linear-gradient(135deg, #4f9d52, #5fae62)", borderRadius: 10, overflow: "hidden" }}>
          {/* Simulated leaf with detection boxes */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #4f9d52 0%, #6db870 50%, #5fae62 100%)" }}></div>
          {/* Vein lines */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 400 250" preserveAspectRatio="none">
            <line x1="200" y1="0" x2="200" y2="250" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
            {[40, 80, 120, 160, 200].map(y => (
              <g key={y}>
                <line x1="200" y1={y} x2="60" y2={y - 10} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
                <line x1="200" y1={y} x2="340" y2={y - 10} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
              </g>
            ))}
          </svg>
          {/* Detection boxes */}
          {[
            { x: 25, y: 30, w: 12, h: 8 },
            { x: 50, y: 25, w: 10, h: 7 },
            { x: 35, y: 50, w: 14, h: 10 },
            { x: 60, y: 55, w: 12, h: 8 },
            { x: 45, y: 70, w: 11, h: 7 },
            { x: 70, y: 35, w: 10, h: 7 },
            { x: 30, y: 80, w: 13, h: 9 },
          ].map((b, i) => (
            <div key={i} style={{ position: "absolute", left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`, border: "2px solid #ff6b1a", borderRadius: 3, background: "rgba(255,107,26,0.1)" }}></div>
          ))}
        </div>
        <div className="row gap-8 mt-12" style={{ justifyContent: "center" }}>
          <button className="mc-btn mc-btn--slate mc-btn--sm">Cajas</button>
          <button className="mc-btn mc-btn--secondary mc-btn--sm">Mapa de Calor</button>
          <button className="mc-btn mc-btn--secondary mc-btn--sm">Alto Contraste</button>
        </div>
      </div>

      <div className="col gap-14">
        <div className="mc-card ia-card">
          <div className="mc-card__head"><div className="mc-card__title">Resultados del Análisis:</div><IABadge/></div>
          <div className="row gap-16" style={{ alignItems: "center" }}>
            <DonutConfianza/>
            <div style={{ flex: 1 }}>
              <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 16 }}>Roya Común <span style={{ fontStyle: "italic", color: "var(--mc-text-2)", fontSize: 13 }}>(Puccinia sorghi)</span></div>
              <span className="mc-badge mc-badge--amber mt-4">? Severidad Media</span>
              <div className="col gap-4 mt-12">
                <div className="row gap-6" style={{ alignItems: "center", fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--mc-orange-500)" }}></span>
                  <span>Lesión A (Foco Principal) - <span className="font-semi">98%</span></span>
                </div>
                <div className="row gap-6" style={{ alignItems: "center", fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--mc-orange-500)" }}></span>
                  <span>Lesión B (Esporulación) - <span className="font-semi">92%</span></span>
                </div>
                <div className="row gap-6" style={{ alignItems: "center", fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--mc-orange-500)" }}></span>
                  <span>Lesión C (Inicial) - <span className="font-semi">85%</span></span>
                </div>
              </div>
              <button className="mc-btn mc-btn--ghost mc-btn--sm mt-8" style={{ padding: 0, color: "var(--mc-green-700)", textDecoration: "underline" }}>Ver 5 detecciones más...</button>
            </div>
          </div>
        </div>

        <div className="mc-card ia-card">
          <div className="mc-card__head">
            <div className="row gap-8" style={{ alignItems: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--mc-green-100)", display: "grid", placeItems: "center" }}>✓</div>
              <div className="mc-card__title">Recomendación</div>
            </div>
            <IABadge/>
          </div>
          <div className="text-xs text-muted">Estrategia de Control Sugerida</div>
          <div className="font-semi mt-4" style={{ color: "var(--mc-ink)", fontSize: 16 }}>Fungicida (Triazol + Estrob.)</div>
          <div className="text-xs text-muted">Tratamiento Prioritario para Roya</div>
          <div className="grid g-cols-3 gap-8 mt-12">
            <div style={{ padding: 8, background: "var(--mc-surface-2)", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 16 }}>📍</div>
              <div className="text-xs text-muted">Dosis</div>
              <div className="font-semi text-sm">400 cc/Ha</div>
            </div>
            <div style={{ padding: 8, background: "var(--mc-surface-2)", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 16 }}>?</div>
              <div className="text-xs text-muted">Próx. Vent. Óptima</div>
              <div className="font-semi text-sm">4 hs</div>
            </div>
            <div style={{ padding: 8, background: "var(--mc-surface-2)", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 16 }}>📅</div>
              <div className="text-xs text-muted">Costo Estimado</div>
              <div className="font-semi text-sm">$28/Ha</div>
            </div>
          </div>
          <div className="text-xs mt-8" style={{ padding: 8, background: "var(--mc-green-50)", borderRadius: 6, color: "var(--mc-text)" }}>
            <span className="font-semi" style={{ color: "var(--mc-green-700)" }}>Análisis IA:</span> Eficacia contra la roya en ensayos de campo. La combinación Triazol + Estrobilurina offers...
          </div>
        </div>
      </div>
    </div>
  );
}

function DonutConfianza() {
  const pct = 96;
  const c = 75, r = 58, sw = 12;
  const rOuter = r + sw / 2 + 4;
  const circ = 2 * Math.PI * r;
  const circOuter = 2 * Math.PI * rOuter;

  // Decorative tick marks every 10°
  const ticks = Array.from({ length: 36 }).map((_, i) => {
    const a = (i * 10 - 90) * Math.PI / 180;
    const ri = r - sw / 2 - 6;
    const ro = r - sw / 2 - (i % 9 === 0 ? 11 : 8);
    return { x1: c + ri * Math.cos(a), y1: c + ri * Math.sin(a), x2: c + ro * Math.cos(a), y2: c + ro * Math.sin(a), major: i % 9 === 0 };
  });

  return (
    <svg width="150" height="150" viewBox="0 0 150 150">
      <defs>
        <linearGradient id="confGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f9d52"/>
          <stop offset="100%" stopColor="#7ec47f"/>
        </linearGradient>
        <filter id="confGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Decorative outer thin arc */}
      <circle cx={c} cy={c} r={rOuter} fill="none" stroke="var(--mc-surface-2)" strokeWidth="1.5" strokeDasharray="2 4"/>
      <circle cx={c} cy={c} r={rOuter} fill="none" stroke="#4f9d52" strokeWidth="2"
        strokeDasharray={`${(pct/100)*circOuter} ${circOuter}`}
        transform={`rotate(-90 ${c} ${c})`} strokeLinecap="round" opacity="0.4"/>

      {/* Track ring */}
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--mc-line)" strokeWidth={sw} opacity="0.5"/>

      {/* Filled progress arc */}
      <circle cx={c} cy={c} r={r} fill="none" stroke="url(#confGrad)" strokeWidth={sw}
        strokeDasharray={`${(pct/100)*circ} ${circ}`}
        transform={`rotate(-90 ${c} ${c})`} strokeLinecap="round" filter="url(#confGlow)"/>

      {/* Inner ticks */}
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={t.major ? "var(--mc-line)" : "var(--mc-surface-2)"}
          strokeWidth={t.major ? 1.5 : 1} opacity="0.6"/>
      ))}

      {/* Center stats */}
      <text x={c} y={c - 4} textAnchor="middle" fontSize="32" fontFamily="var(--ff-display)" fontWeight="800" fill="var(--mc-ink)">{pct}</text>
      <text x={c + 26} y={c - 14} textAnchor="middle" fontSize="14" fontFamily="var(--ff-display)" fontWeight="700" fill="#4f9d52">%</text>
      <text x={c} y={c + 14} textAnchor="middle" fontSize="9" fontFamily="var(--ff-ui)" fontWeight="700" fill="var(--mc-text-2)" letterSpacing="0.1em">CONFIANZA</text>
      <text x={c} y={c + 26} textAnchor="middle" fontSize="9" fontFamily="var(--ff-ui)" fontWeight="600" fill="var(--mc-text-3)">Global IA</text>
    </svg>
  );
}

/* ========== TIMELINE ========== */
function CDTimeline() {
  const events = [
    { fecha: "18 abr 2026", hora: "14:00", tipo: "Pulver.", titulo: "Pulverización Glifosato", lote: "Lote Norte 1", cultivo: "Soja", detail: "3.0 L/Ha · 85 Ha · 255 L total · C. Martínez", color: "var(--mc-orange-500)", icon: "flask" },
    { fecha: "18 abr 2026", hora: "06:00", tipo: "Riego", titulo: "Riego Sector A iniciado", lote: "Lote Este 1", cultivo: "Maíz", detail: "Pivote · 42 m³/h · automático", color: "var(--mc-blue)", icon: "droplet" },
    { fecha: "17 abr 2026", hora: "11:30", tipo: "IA", titulo: "Detección IA: Mancha foliar", lote: "Lote Este 1", cultivo: "Maíz", detail: "Confianza 81% · bajo umbral · monitorear", color: "var(--mc-amber)", icon: "leaf" },
    { fecha: "16 abr 2026", hora: "15:00", tipo: "Lluvia", titulo: "Lluvia registrada · 12mm", lote: "Todos los lotes", cultivo: "—", detail: "Estación automática WS-Davis", color: "var(--mc-blue)", icon: "droplet" },
    { fecha: "15 abr 2026", hora: "09:00", tipo: "Calc.", titulo: "Cálculo de dosis · Glifosato", lote: "Lote Norte 1", cultivo: "Soja", detail: "$412.500 estimado · J. Rodríguez", color: "var(--mc-green-700)", icon: "flask" },
    { fecha: "14 abr 2026", hora: "08:30", tipo: "Siembra", titulo: "Siembra alfalfa completada", lote: "Lote Sur 2", cultivo: "Alfalfa", detail: "Variedad Genesis · 42 Ha", color: "var(--mc-green-500)", icon: "sprout" },
  ];

  return (
    <>
      <div className="row gap-8" style={{ justifyContent: "space-between" }}>
        <div className="row gap-8">
          <div className="mc-seg">
            <button className="is-on">Todo</button>
            <button>Labores</button>
            <button>Sanidad</button>
            <button>Riego</button>
            <button>IA</button>
          </div>
          <div className="mc-seg">
            <button className="is-on">7 días</button>
            <button>30 días</button>
            <button>Campaña</button>
          </div>
        </div>
        <div className="row gap-8">
          <button className="mc-btn mc-btn--secondary mc-btn--sm"><Icon name="filter" size={13}/>Filtros</button>
          <button className="mc-btn mc-btn--secondary mc-btn--sm"><Icon name="download" size={13}/>Exportar</button>
        </div>
      </div>

      <div className="mc-card">
        <div style={{ position: "relative", paddingLeft: 32 }}>
          <div style={{ position: "absolute", left: 11, top: 8, bottom: 8, width: 2, background: "var(--mc-line)" }}></div>
          {events.map((e, i) => (
            <div key={i} style={{ position: "relative", paddingBottom: i < events.length - 1 ? 24 : 0 }}>
              <div style={{ position: "absolute", left: -27, top: 4, width: 24, height: 24, borderRadius: "50%", background: e.color, color: "white", display: "grid", placeItems: "center", border: "3px solid var(--mc-surface)", boxShadow: "var(--sh-sm)" }}>
                <Icon name={e.icon} size={12}/>
              </div>
              <div style={{ padding: 14, border: "1px solid var(--mc-line)", borderRadius: 12, background: "var(--mc-surface-2)" }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div className="row gap-8">
                    <span className="mc-badge mc-badge--neutral" style={{ textTransform: "uppercase", fontSize: 10 }}>{e.tipo}</span>
                    <span className="font-semi" style={{ color: "var(--mc-ink)" }}>{e.titulo}</span>
                  </div>
                  <div className="text-xs font-mono text-muted">{e.fecha} · {e.hora}</div>
                </div>
                <div className="text-xs text-muted mt-4">{e.lote}{e.cultivo !== "—" && ` · ${e.cultivo}`}</div>
                <div className="text-sm mt-4" style={{ color: "var(--mc-text)" }}>{e.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

window.CampoDigital = CampoDigital;
window.FocoRow = FocoRow;


