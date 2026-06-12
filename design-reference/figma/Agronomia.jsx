// Agronomia.jsx - Calculadora, Clima, Plan de Riego

/* ================= CALCULADORA ================= */
function Calculadora() {
  const { useState } = React;
  const [tab, setTab] = useState("Nuevo Cálculo");
  const tabs = ["Inicio","Nuevo Cálculo","Historial","Preestablecidos"];

  return (
    <div className="col gap-20">
      <PageHeader
        crumbs={["Agronomía","Calculadora de Dosis"]}
        title="Calculadora de Dosis"
        subtitle="Dosificación precisa para herbicidas, fungicidas, insecticidas y fertilizantes."
      />
      <Tabs tabs={tabs} active={tab} onChange={setTab}/>
      {tab === "Inicio" && <CalcInicio/>}
      {tab === "Nuevo Cálculo" && <CalcNuevo/>}
      {tab === "Historial" && <CalcHistorial/>}
      {tab === "Preestablecidos" && <CalcPreset/>}
    </div>
  );
}

function CalcInicio() {
  return (
    <>
      <div className="grid g-cols-5">
        <KPI label="Cálculos este mes" value="42" delta="+12 vs mes pasado" trend="up" icon="flask" accent/>
        <KPI label="Insumos dosificados" value="8,240 L" delta="glifosato + 2,4-D" trend="up" icon="droplet"/>
        <KPI label="Costo estimado" value="$1.2M" delta="Campaña actual" trend="up" icon="dollar"/>
        <KPI label="Ahorro vs ficha técnica" value="7.3%" delta="Por ajuste de dosis" trend="up" icon="target"/>
        <KPI label="Producto más usado" value="Glifosato 48%" delta="18 cálculos · 3.060 L" trend="up" icon="leaf"/>
      </div>
      <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
        <button className="mc-btn mc-btn--secondary"><Icon name="book" size={14}/>Preestablecidos</button>
        <button className="mc-btn mc-btn--primary"><Icon name="plus" size={14}/>Nuevo cálculo</button>
      </div>
      <div className="grid g-cols-3 gap-16">
        <QuickCalcCard tipo="Herbicida" desc="Dosis por mezcla en tanque" color="var(--mc-green-600)"/>
        <QuickCalcCard tipo="Fungicida" desc="Para control preventivo y curativo" color="var(--mc-blue)"/>
        <QuickCalcCard tipo="Insecticida" desc="Cálculo por ingrediente activo" color="var(--mc-orange-600)"/>
        <QuickCalcCard tipo="Fertilizante" desc="Balance NPK por hectárea" color="var(--mc-amber)"/>
        <QuickCalcCard tipo="Mezcla personalizada" desc="Combinación de productos" color="var(--mc-green-700)"/>
        <QuickCalcCard tipo="Riego + agroquímico" desc="Dosificación en fertirriego" color="var(--mc-green-500)"/>
      </div>
    </>
  );
}

function QuickCalcCard({ tipo, desc, color }) {
  return (
    <div className="mc-card" style={{ cursor: "pointer", borderTop: `3px solid ${color}` }}>
      <div className="row gap-8">
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + "22", color, display: "grid", placeItems: "center" }}>
          <Icon name="flask" size={18}/>
        </div>
        <div>
          <div className="font-semi" style={{ color: "var(--mc-ink)" }}>{tipo}</div>
          <div className="text-xs text-muted">{desc}</div>
        </div>
      </div>
      <button className="mc-btn mc-btn--secondary mc-btn--sm mt-12" style={{ width: "100%", justifyContent: "center" }}>Abrir calculadora →</button>
    </div>
  );
}

function CalcNuevo() {
  const { useState } = React;
  const TIPOS = ["Herbicida","Fungicida","Insecticida","Fertilizante","Regulador"];
  const PRODS = ["Glifosato 48%","2,4-D Amina","Atrazina","Cipermetrina","Tebuconazole","Urea 46%"];
  const [productos, setProductos] = useState([
    { tipo: "Herbicida", nombre: "Glifosato 48%", dosis: "3.0", unidad: "L/Ha" },
  ]);
  const [area, setArea] = useState(85);
  const [caldo, setCaldo] = useState(150);
  const [tanque, setTanque] = useState(3000);

  const addProd = () => setProductos([...productos, { tipo: "Herbicida", nombre: "Glifosato 48%", dosis: "1.0", unidad: "L/Ha" }]);
  const removeProd = (i) => setProductos(productos.filter((_, idx) => idx !== i));
  const updateProd = (i, key, val) => setProductos(productos.map((p, idx) => idx === i ? { ...p, [key]: val } : p));

  const caldoTotal = caldo * area;
  const cargas = Math.ceil(caldoTotal / tanque);

  return (
    <div className="grid" style={{ gridTemplateColumns: "1.15fr 1fr", gap: 14 }}>
      <div className="mc-card">
        <div className="mc-card__head">
          <div>
            <div className="mc-card__eyebrow">Configuración de aplicación</div>
            <div className="mc-card__title mt-4">Nueva Mezcla</div>
          </div>
        </div>
        <div className="col gap-18">
          {/* STEP 1 — Lote y Campo */}
          <div>
            <div className="row gap-8" style={{ alignItems: "center", marginBottom: 10 }}>
              <span style={{ width: 22, height: 22, borderRadius: 7, background: "var(--mc-green-600)", color: "white", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, fontFamily: "var(--ff-mono)" }}>1</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Lote(s) seleccionado(s) y campo</span>
              <div style={{ flex: 1, height: 1, background: "var(--mc-line)" }}/>
            </div>
            <div className="grid g-cols-2 gap-12">
              <div className="mc-field">
                <label className="mc-label">Lote</label>
                <select className="mc-select">{DATA.lotes.map(l => <option key={l.id}>{l.name} ({l.ha} Ha)</option>)}</select>
              </div>
              <div className="mc-field">
                <label className="mc-label">Área a tratar (Ha)</label>
                <input className="mc-input" value={area} type="number" onChange={e => setArea(+e.target.value)}/>
              </div>
              <div className="mc-field">
                <label className="mc-label">Volumen de caldo</label>
                <div className="row gap-4">
                  <input className="mc-input" value={caldo} onChange={e => setCaldo(+e.target.value)}/>
                  <select className="mc-select" style={{ width: 80 }}><option>L/Ha</option></select>
                </div>
              </div>
              <div className="mc-field">
                <label className="mc-label">Capacidad tanque</label>
                <div className="row gap-4">
                  <input className="mc-input" value={tanque} onChange={e => setTanque(+e.target.value)}/>
                  <select className="mc-select" style={{ width: 60 }}><option>L</option></select>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2 — Productos */}
          <div>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div className="row gap-8" style={{ alignItems: "center", flex: 1 }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: "var(--mc-green-600)", color: "white", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, fontFamily: "var(--ff-mono)" }}>2</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Productos en la mezcla</span>
                <div style={{ flex: 1, height: 1, background: "var(--mc-line)" }}/>
              </div>
              <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={addProd} style={{ marginLeft: 10 }}><Icon name="plus" size={12}/>Agregar Producto</button>
            </div>
            <div className="col gap-8">
              {productos.map((p, i) => (
                <div key={i} style={{ padding: 12, border: "1.5px solid var(--mc-line)", borderRadius: 10, background: "var(--mc-surface-2)" }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div className="row gap-6">
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--mc-green-100)", color: "var(--mc-green-700)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 11 }}>{i + 1}</div>
                      <span className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>Producto {i + 1}</span>
                    </div>
                    {productos.length > 1 && (
                      <button className="mc-icon-btn" style={{ width: 22, height: 22, border: "none", color: "var(--mc-red)" }} onClick={() => removeProd(i)}><Icon name="trash" size={12}/></button>
                    )}
                  </div>
                  <div className="grid g-cols-3 gap-10">
                    <div className="mc-field">
                      <label className="mc-label">Tipo</label>
                      <select className="mc-select" value={p.tipo} onChange={e => updateProd(i, "tipo", e.target.value)}>
                        {TIPOS.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="mc-field">
                      <label className="mc-label">Producto</label>
                      <select className="mc-select" value={p.nombre} onChange={e => updateProd(i, "nombre", e.target.value)}>
                        {PRODS.map(pr => <option key={pr}>{pr}</option>)}
                      </select>
                    </div>
                    <div className="mc-field">
                      <label className="mc-label">Dosis</label>
                      <div className="row gap-4">
                        <input className="mc-input" value={p.dosis} onChange={e => updateProd(i, "dosis", e.target.value)} style={{ width: 60 }}/>
                        <select className="mc-select" style={{ width: 80 }} value={p.unidad} onChange={e => updateProd(i, "unidad", e.target.value)}>
                          <option>L/Ha</option><option>cc/Ha</option><option>kg/Ha</option><option>g/Ha</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="row gap-8 mt-4">
            <button className="mc-btn mc-btn--ghost">Cancelar</button>
            <div style={{ flex: 1 }}></div>
            <button className="mc-btn mc-btn--secondary">Guardar borrador</button>
            <button className="mc-btn mc-btn--primary">Calcular dosis <Icon name="arrowRight" size={14}/></button>
          </div>
        </div>
      </div>

      <div className="mc-card" style={{ background: "var(--mc-green-50)", borderColor: "var(--mc-green-200)" }}>
        <div className="mc-card__eyebrow" style={{ color: "var(--mc-green-700)" }}>Resultado estimado · {productos.length} producto(s)</div>
        <div className="col gap-14 mt-12">
          {productos.map((p, i) => {
            const dosisNum = parseFloat(p.dosis) || 0;
            const total = (dosisNum * area).toFixed(1);
            const porCarga = (dosisNum * caldo).toFixed(1);
            return (
              <div key={i}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div className="text-xs font-semi" style={{ color: "var(--mc-green-700)" }}>{p.nombre}</div>
                  <span className="mc-badge mc-badge--neutral" style={{ fontSize: 10 }}>{p.tipo}</span>
                </div>
                <ResultRow label="Total producto" value={`${total} ${p.unidad.replace("/Ha","")}`} detail={`${area} Ha × ${p.dosis} ${p.unidad}`}/>
                <div className="text-xs text-muted mt-2">{porCarga} {p.unidad.replace("/Ha","")} / tanque</div>
              </div>
            );
          })}
          <div className="mc-divider"></div>
          <ResultRow label="Caldo total" value={`${(caldoTotal).toLocaleString()} L`} detail={`${caldo} L/Ha × ${area} Ha`}/>
          <ResultRow label="Cargas de tanque" value={`${cargas} carga${cargas !== 1 ? "s" : ""}`} detail={`Tanque ${tanque.toLocaleString()} L`}/>
          <div className="mc-divider"></div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="mc-card__eyebrow">Costo estimado</div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 32, color: "var(--mc-green-800)", lineHeight: 1 }}>$412,500</div>
          </div>
          <div className="text-xs text-muted">Basado en último precio de insumos registrados</div>
        </div>
      </div>
    </div>
  );
}

function ResultRow({ label, value, detail }) {
  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="text-sm" style={{ color: "var(--mc-text-2)" }}>{label}</div>
        <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, color: "var(--mc-ink)", lineHeight: 1 }}>{value}</div>
      </div>
      <div className="text-xs text-muted">{detail}</div>
    </div>
  );
}

function CalcHistorial() {
  const rows = [
    { fecha: "15/04/2026", producto: "Glifosato 48%", lote: "Norte 1", ha: 85, dosis: "3.0 L/Ha", total: "255 L", costo: "$412,500", usuario: "J. Rodríguez" },
    { fecha: "12/04/2026", producto: "2,4-D Amina", lote: "Norte 2", ha: 72, dosis: "0.5 L/Ha", total: "36 L", costo: "$48,600", usuario: "J. Rodríguez" },
    { fecha: "08/04/2026", producto: "Atrazina", lote: "Este 1", ha: 110, dosis: "2.5 L/Ha", total: "275 L", costo: "$357,500", usuario: "C. Martínez" },
    { fecha: "02/04/2026", producto: "Cipermetrina", lote: "Sur 2", ha: 42, dosis: "0.3 L/Ha", total: "12.6 L", costo: "$28,350", usuario: "C. Martínez" },
    { fecha: "28/03/2026", producto: "Tebuconazole", lote: "Sur 1", ha: 64, dosis: "0.4 L/Ha", total: "25.6 L", costo: "$89,600", usuario: "J. Rodríguez" },
  ];
  return (
    <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between" }}>
        <div className="mc-card__title">Historial de cálculos</div>
        <div className="row gap-8">
          <button className="mc-btn mc-btn--ghost mc-btn--sm"><Icon name="filter" size={13}/>Filtrar</button>
          <button className="mc-btn mc-btn--secondary mc-btn--sm"><Icon name="download" size={13}/>Exportar</button>
        </div>
      </div>
      <table className="mc-table">
        <thead><tr><th>Fecha</th><th>Producto</th><th>Lote</th><th className="mc-cell--num">Ha</th><th>Dosis</th><th className="mc-cell--num">Total</th><th className="mc-cell--num">Costo</th><th>Usuario</th><th></th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="mc-cell--mono">{r.fecha}</td>
              <td className="mc-cell--emph">{r.producto}</td>
              <td>{r.lote}</td>
              <td className="mc-cell--num">{r.ha}</td>
              <td>{r.dosis}</td>
              <td className="mc-cell--num">{r.total}</td>
              <td className="mc-cell--num">{r.costo}</td>
              <td>{r.usuario}</td>
              <td><button className="mc-icon-btn" style={{ width: 26, height: 26, border: "none" }} title="Duplicar cálculo" aria-label="Duplicar cálculo"><Icon name="copy" size={13}/></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CalcPreset() {
  const presets = [
    { nombre: "Glifosato barbecho", tipo: "Herbicida", dosis: "3.0 L/Ha", caldo: "150 L/Ha", productos: 1, color: "var(--mc-green-600)" },
    { nombre: "Control chinche soja", tipo: "Insecticida", dosis: "0.3 L/Ha", caldo: "100 L/Ha", productos: 2, color: "var(--mc-orange-600)" },
    { nombre: "Fungicida preventivo maíz", tipo: "Fungicida", dosis: "0.4 L/Ha", caldo: "120 L/Ha", productos: 1, color: "var(--mc-blue)" },
    { nombre: "Pre-siembra trigo", tipo: "Mezcla", dosis: "2.5 L/Ha + 0.5 L/Ha", caldo: "130 L/Ha", productos: 3, color: "var(--mc-green-700)" },
  ];
  return (
    <div className="grid g-cols-2 gap-16">
      {presets.map((p, i) => (
        <div key={i} className="mc-card" style={{ borderTop: `3px solid ${p.color}` }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="mc-card__eyebrow">{p.tipo}</div>
              <div className="mc-card__title mt-4">{p.nombre}</div>
            </div>
            <button className="mc-icon-btn"><Icon name="more" size={14}/></button>
          </div>
          <div className="grid g-cols-3 gap-8 mt-12">
            <div><div className="text-xs text-muted">Dosis</div><div className="font-semi">{p.dosis}</div></div>
            <div><div className="text-xs text-muted">Caldo</div><div className="font-semi">{p.caldo}</div></div>
            <div><div className="text-xs text-muted">Productos</div><div className="font-semi">{p.productos}</div></div>
          </div>
          <div className="row gap-8 mt-12">
            <button className="mc-btn mc-btn--secondary mc-btn--sm">Ver detalle</button>
            <button className="mc-btn mc-btn--primary mc-btn--sm">Usar preset</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================= MODALES CLIMA ================= */
function RegistrarLluviaModal({ onClose }) {
  const { useState } = React;
  const B = "#2c82c9", BG = "#eef4fb", BD = "#1a5fa0";
  const inp = { fontSize:13, border:"1.5px solid #c0c5ce", borderRadius:8, padding:"7px 10px", width:"100%", boxSizing:"border-box", outline:"none", fontFamily:"inherit" };
  const lbl = { fontSize:11, fontWeight:600, color:"#64748b", marginBottom:4, textTransform:"uppercase", letterSpacing:".04em" };

  const [mm, setMm] = useState(45);
  const [fecha, setFecha] = useState("2026-05-05");
  const [hora, setHora] = useState("04:30");
  const [duracion, setDuracion] = useState(5);
  const [notas, setNotas] = useState("");
  const [selectedLotes, setSelectedLotes] = useState(["l1","l2"]);
  const [condiciones, setCondiciones] = useState(["lm"]);

  const campos = [
    { id:"c1", label:"El Amanecer", lotes:[{id:"l1",label:"Lote 1"},{id:"l2",label:"Lote 2"},{id:"l5",label:"Lote 3"}] },
    { id:"c2", label:"La Cañada",   lotes:[{id:"l3",label:"Lote Norte"},{id:"l4",label:"Lote Sur"}] },
  ];
  const condOpts = [
    { id:"gran",  label:"Granizo",               icon:"🌨️" },
    { id:"torr",  label:"Torrencial",             icon:"🌊" },
    { id:"vf",    label:"Viento Fuerte",          icon:"💨" },
    { id:"lm",    label:"Lluvia Mansa",           icon:"🌧️" },
    { id:"elect", label:"Actividad Eléctrica",    icon:"⚡" },
    { id:"camin", label:"Caminos Intransitables", icon:"🚫" },
  ];
  const toggleLote = id => setSelectedLotes(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);
  const toggleCond = id => setCondiciones(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);
  const totalLotes = selectedLotes.length;

  const Section = ({ title, icon, children }) => (
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
    <div style={{ position:"fixed", inset:0, background:"rgba(15,22,36,0.55)", zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"#fff", borderRadius:16, width:620, maxWidth:"100%", maxHeight:"92vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,0.22)" }}>

        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${B} 0%,${BD} 100%)`, padding:"22px 28px 20px", color:"#fff", display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:11, opacity:0.8, marginBottom:6, letterSpacing:".06em", textTransform:"uppercase" }}>Agricultura · Clima · Registro</div>
            <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-.02em", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:26 }}>🌧️</span> Registrar Lluvia
            </div>
            <div style={{ fontSize:13, opacity:0.85, marginTop:4 }}>Observación manual de precipitaciones en campo.</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.18)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:8, width:34, height:34, cursor:"pointer", color:"#fff", fontSize:17, display:"grid", placeItems:"center", flexShrink:0 }}>✕</button>
        </div>

        <div style={{ padding:"22px 28px", overflowY:"auto", flex:1 }}>

          {/* Row 1: Cantidad + Fecha/Hora */}
          <Section title="Cantidad y Momento" icon="💧">
            <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:16, alignItems:"start" }}>
              {/* MM Big */}
              <div style={{ background:BG, border:`2.5px solid ${B}`, borderRadius:16, padding:"18px 22px", textAlign:"center", minWidth:130 }}>
                <div style={{ fontSize:11, fontWeight:700, color:B, textTransform:"uppercase", letterSpacing:".05em", marginBottom:6 }}>Precipitación</div>
                <div style={{ display:"flex", alignItems:"baseline", justifyContent:"center", gap:4 }}>
                  <input type="number" value={mm} min={0} max={999} onChange={e=>setMm(e.target.value)}
                    style={{ width:80, fontSize:52, fontWeight:900, color:B, border:"none", background:"transparent", textAlign:"center", outline:"none", lineHeight:1 }}/>
                  <span style={{ fontSize:24, fontWeight:800, color:B, opacity:0.8 }}>mm</span>
                </div>
                <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:8 }}>
                  <button onClick={()=>setMm(m=>Math.max(0,Number(m)-5))} style={{ width:30, height:30, borderRadius:8, border:`1.5px solid ${B}`, background:"#fff", color:B, fontSize:16, cursor:"pointer", display:"grid", placeItems:"center", fontWeight:700 }}>−</button>
                  <button onClick={()=>setMm(m=>Math.min(999,Number(m)+5))} style={{ width:30, height:30, borderRadius:8, border:"none", background:B, color:"#fff", fontSize:16, cursor:"pointer", display:"grid", placeItems:"center", fontWeight:700 }}>+</button>
                </div>
              </div>
              {/* Fecha / Hora / Duración */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <div style={lbl}>Fecha</div>
                  <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={inp}/>
                </div>
                <div>
                  <div style={lbl}>Hora de inicio</div>
                  <input type="time" value={hora} onChange={e=>setHora(e.target.value)} style={inp}/>
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <div style={lbl}>Duración (horas)</div>
                  <input type="number" value={duracion} min={0} max={72} onChange={e=>setDuracion(e.target.value)} style={inp}/>
                </div>
              </div>
            </div>
          </Section>

          {/* Row 2: Lotes */}
          <Section title={`Lotes Afectados${totalLotes ? ` · ${totalLotes} seleccionados` : ""}`} icon="📍">
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {campos.map(c=>(
                <div key={c.id} style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, padding:"12px 14px" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:".04em", marginBottom:8 }}>📍 {c.label}</div>
                  <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                    {c.lotes.map(l=>{
                      const sel = selectedLotes.includes(l.id);
                      return (
                        <button key={l.id} onClick={()=>toggleLote(l.id)}
                          style={{ border: sel ? `2px solid ${B}` : "1.5px solid #c0c5ce", borderRadius:9, padding:"6px 16px", fontSize:13, cursor:"pointer",
                            background: sel ? BG : "#fff", color: sel ? B : "var(--mc-ink)", fontWeight: sel ? 700 : 400,
                            display:"flex", alignItems:"center", gap:5, transition:"all .15s" }}>
                          {sel && <span style={{ fontSize:10, fontWeight:900 }}>✓</span>}{l.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Row 3: Condiciones */}
          <Section title="Condiciones del Evento (opcional)" icon="🌩️">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
              {condOpts.map(c=>{
                const sel = condiciones.includes(c.id);
                return (
                  <button key={c.id} onClick={()=>toggleCond(c.id)}
                    style={{ border: sel ? `2px solid ${B}` : "1.5px solid #c0c5ce", borderRadius:10, padding:"10px 8px", fontSize:12, cursor:"pointer",
                      background: sel ? BG : "#fff", color: sel ? B : "var(--mc-ink)", fontWeight: sel ? 700 : 400,
                      display:"flex", flexDirection:"column", alignItems:"center", gap:5, transition:"all .15s" }}>
                    <span style={{ fontSize:20 }}>{c.icon}</span>
                    <span style={{ textAlign:"center", lineHeight:1.2 }}>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Row 4: Notas */}
          <Section title="Observaciones (opcional)" icon="📝">
            <textarea value={notas} onChange={e=>setNotas(e.target.value)} rows={3}
              placeholder="Ej: lluvia pareja, sin granizo, camino al lote 3 anegado..."
              style={{ ...inp, resize:"vertical", lineHeight:1.5 }}/>
          </Section>
        </div>

        {/* Footer */}
        <div style={{ padding:"16px 28px", borderTop:"1px solid #e2e8f0", display:"flex", justifyContent:"flex-end", gap:10, flexShrink:0 }}>
          <button className="mc-btn mc-btn--secondary" onClick={onClose}>Cancelar</button>
          <button onClick={onClose} className="mc-btn mc-btn--blue">
            <span style={{ fontSize:14 }}>💧</span> Guardar Registro
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportarAlertaModal({ onClose }) {
  const { useState } = React;
  const inp = { fontSize:13, border:"1.5px solid #c0c5ce", borderRadius:8, padding:"7px 10px", boxSizing:"border-box", outline:"none", fontFamily:"inherit" };
  const lbl = { fontSize:11, fontWeight:600, color:"#64748b", marginBottom:4, textTransform:"uppercase", letterSpacing:".04em" };

  const [severity, setSeverity] = useState("Moderado");
  const [tipo, setTipo] = useState("Granizo");
  const [selectedLotes, setSelectedLotes] = useState(["l4"]);
  const [fecha, setFecha] = useState("2026-05-05");
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [duracion, setDuracion] = useState("");
  const [durUnit, setDurUnit] = useState("horas");
  const [notas, setNotas] = useState("");

  const severities = [
    { id:"Leve",    icon:"🟡", desc:"Sin pérdida significativa",   color:"#16a34a", bg:"#f0fdf4", border:"#86efac" },
    { id:"Moderado",icon:"🟠", desc:"Daño parcial, requiere revisión", color:"#d97706", bg:"#fffbeb", border:"#fcd34d" },
    { id:"Severo",  icon:"🔴", desc:"Pérdida importante de cultivo",  color:"#dc2626", bg:"#fef2f2", border:"#fca5a5" },
  ];
  const tipos = [
    { id:"Granizo",    label:"Granizo",           icon:"🌨️" },
    { id:"Viento",     label:"Viento / Voladura", icon:"💨" },
    { id:"Helada",     label:"Helada",            icon:"❄️" },
    { id:"Inundacion", label:"Inundación",        icon:"🌊" },
    { id:"Descarga",   label:"Descarga Eléctrica",icon:"⚡" },
    { id:"Foco",       label:"Foco de Incendio",  icon:"🔥" },
  ];
  const campos = [
    { id:"c1", label:"El Amanecer", lotes:[{id:"l1",label:"Lote 1"},{id:"l2",label:"Lote 2"}] },
    { id:"c2", label:"La Cañada",   lotes:[{id:"l3",label:"Lote Norte"},{id:"l4",label:"Lote Sur"}] },
  ];
  const toggleLote = id => setSelectedLotes(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);
  const sevSel = severities.find(s=>s.id===severity);
  const tipoSel = tipos.find(t=>t.id===tipo);

  const Section = ({ title, icon, children }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }}/>
      </div>
      {children}
    </div>
  );

  const headerBg = sevSel ? `linear-gradient(135deg,${sevSel.color} 0%,#7f1d1d 100%)` : "linear-gradient(135deg,#dc2626 0%,#991b1b 100%)";

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,22,36,0.55)", zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"#fff", borderRadius:16, width:660, maxWidth:"100%", maxHeight:"92vh", overflow:"hidden", boxShadow:"0 24px 64px rgba(0,0,0,0.22)", display:"flex", flexDirection:"column" }}>

        {/* Header */}
        <div style={{ background:headerBg, padding:"22px 28px 20px", color:"#fff", display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexShrink:0, transition:"background .3s" }}>
          <div>
            <div style={{ fontSize:11, opacity:0.8, marginBottom:6, letterSpacing:".06em", textTransform:"uppercase" }}>Agricultura · Clima · Alertas</div>
            <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-.02em", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:26 }}>⚠️</span> Reportar Evento Climático
            </div>
            <div style={{ fontSize:13, opacity:0.85, marginTop:4 }}>
              {sevSel && tipoSel
                ? `${tipoSel.label} · Severidad ${sevSel.id} · ${selectedLotes.length} lotes seleccionados`
                : "Seleccioná el tipo y nivel de severidad del evento."}
            </div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.18)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:8, width:34, height:34, cursor:"pointer", color:"#fff", fontSize:17, display:"grid", placeItems:"center", flexShrink:0 }}>✕</button>
        </div>

        <div style={{ padding:"22px 28px", overflowY:"auto", flex:1 }}>

          {/* Severidad */}
          <Section title="Nivel de Severidad" icon="🚨">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
              {severities.map(s=>{
                const sel = severity===s.id;
                return (
                  <button key={s.id} onClick={()=>setSeverity(s.id)}
                    style={{ border: sel ? `2.5px solid ${s.color}` : "1.5px solid #c0c5ce", borderRadius:12, padding:"16px 12px", cursor:"pointer",
                      background: sel ? s.bg : "#fff", color: sel ? s.color : "var(--mc-ink)",
                      display:"flex", flexDirection:"column", alignItems:"center", gap:6, transition:"all .15s" }}>
                    <span style={{ fontSize:28 }}>{s.icon}</span>
                    <span style={{ fontSize:14, fontWeight:700 }}>{s.id}</span>
                    <span style={{ fontSize:11, color: sel ? s.color : "#94a3b8", textAlign:"center", lineHeight:1.3 }}>{s.desc}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Tipo */}
          <Section title="Tipo de Evento" icon="🌩️">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8 }}>
              {tipos.map(t=>{
                const sel = tipo===t.id;
                const C = sevSel ? sevSel.color : "#ef4444";
                const BG = sevSel ? sevSel.bg : "#fef2f2";
                return (
                  <button key={t.id} onClick={()=>setTipo(t.id)}
                    style={{ border: sel ? `2.5px solid ${C}` : "1.5px solid #c0c5ce", borderRadius:12, padding:"14px 6px", cursor:"pointer",
                      background: sel ? BG : "#fff", color: sel ? C : "var(--mc-ink)",
                      display:"flex", flexDirection:"column", alignItems:"center", gap:6, transition:"all .15s" }}>
                    <span style={{ fontSize:26 }}>{t.icon}</span>
                    <span style={{ fontSize:11, fontWeight: sel ? 700 : 400, textAlign:"center", lineHeight:1.2 }}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Lotes + Detalles */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:18 }}>
            {/* Lotes */}
            <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:14, padding:"16px" }}>
              <div style={{ ...lbl, marginBottom:12, color:"#475569" }}>📍 Lotes Afectados · {selectedLotes.length} sel.</div>
              {campos.map(c=>(
                <div key={c.id} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", marginBottom:6 }}>{c.label}</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {c.lotes.map(l=>{
                      const sel = selectedLotes.includes(l.id);
                      const C = sevSel ? sevSel.color : "#ef4444";
                      const BG = sevSel ? sevSel.bg : "#fef2f2";
                      return (
                        <button key={l.id} onClick={()=>toggleLote(l.id)}
                          style={{ border: sel ? `2px solid ${C}` : "1.5px solid #c0c5ce", borderRadius:8, padding:"6px 14px", fontSize:12, cursor:"pointer",
                            background: sel ? BG : "#fff", color: sel ? C : "var(--mc-ink)", fontWeight: sel ? 700 : 400,
                            display:"flex", alignItems:"center", gap:4, transition:"all .15s" }}>
                          {sel && <span style={{ fontSize:10 }}>✓</span>}{l.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Detalles */}
            <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:14, padding:"16px", display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ ...lbl, color:"#475569" }}>🕐 Detalles del Evento</div>
              <div>
                <div style={lbl}>Fecha</div>
                <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={{ ...inp, width:"100%" }}/>
              </div>
              <div>
                <div style={lbl}>Hora de inicio</div>
                <input type="time" value={horaInicio} onChange={e=>setHoraInicio(e.target.value)} style={{ ...inp, width:"100%" }}/>
              </div>
              <div>
                <div style={lbl}>Duración aproximada</div>
                <div style={{ display:"flex", gap:6 }}>
                  <input type="number" value={duracion} min={0} onChange={e=>setDuracion(e.target.value)} placeholder="—"
                    style={{ ...inp, width:70, textAlign:"center" }}/>
                  <select value={durUnit} onChange={e=>setDurUnit(e.target.value)} style={{ ...inp, flex:1 }}>
                    <option>horas</option><option>minutos</option><option>días</option>
                  </select>
                </div>
              </div>
              <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
                <div style={lbl}>Observaciones</div>
                <textarea value={notas} onChange={e=>setNotas(e.target.value)} rows={3}
                  placeholder="Describe el impacto observado en el campo..."
                  style={{ ...inp, width:"100%", resize:"vertical", flex:1, lineHeight:1.5 }}/>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"16px 28px", borderTop:"1px solid #e2e8f0", display:"flex", justifyContent:"flex-end", gap:10, flexShrink:0 }}>
          <button className="mc-btn mc-btn--secondary" onClick={onClose}>Cancelar</button>
          <button onClick={onClose} className="mc-btn"
            style={{ background: sevSel ? sevSel.color : "#dc2626", color:"#fff", boxShadow:"0 1px 2px rgba(0,0,0,0.06), inset 0 -2px 0 rgba(0,0,0,0.10)", transition:"background .3s, transform .05s" }}>
            <span style={{ fontSize:14 }}>🔔</span> Guardar Alerta
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= CLIMA ================= */
function Clima() {
  const { useState } = React;
  const [tab, setTab] = useState("Inicio");
  const [showLluvia, setShowLluvia] = useState(false);
  const [showAlerta, setShowAlerta] = useState(false);
  const tabs = ["Inicio","Alertas","Registro de Lluvias"];
  return (
    <div className="col gap-20">
      {showLluvia && <RegistrarLluviaModal onClose={()=>setShowLluvia(false)}/>}
      {showAlerta && <ReportarAlertaModal onClose={()=>setShowAlerta(false)}/>}
      <PageHeader
        crumbs={["Agricultura","Clima"]}
        title="Clima"
        subtitle="Pronóstico, alertas, ventana de pulverización y lluvias registradas."
      />
      <Tabs tabs={tabs} active={tab} onChange={setTab}/>

      <div className="grid g-cols-5">
        <KPI label="Temperatura" value="28.6 °C" delta="Sensación 30°" trend="up" icon="thermometer" accent/>
        <KPI label="Viento" value="18 km/h" delta="NE · ráfagas 25" trend="up" icon="wind"/>
        <KPI label="Delta T" value="5" delta="✓ Apto pulverizar" trend="up" icon="activity"/>
        <KPI label="Lluvias últ. 7 días" value="40 mm" delta="vs prom 28 mm" trend="up" icon="droplet"/>
        <KPI label="Alertas climáticas" value={tab === "Alertas" ? "6" : "1"} delta={tab === "Alertas" ? "3 críticas" : "Heladas lun"} trend="warn" icon="alert" warn/>
      </div>
      <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
        <button className="mc-btn mc-btn--primary" onClick={()=>setShowLluvia(true)}><Icon name="droplet" size={14}/>Registrar Lluvia</button>
        <button className="mc-btn mc-btn--slate" onClick={()=>setShowAlerta(true)}><Icon name="alert" size={14}/>Registrar Alerta</button>
      </div>

      {tab === "Inicio" && <ClimaInicio/>}
      {tab === "Alertas" && <ClimaAlertasNew/>}
      {tab === "Registro de Lluvias" && <ClimaLluviasNew onRegistrar={()=>setShowLluvia(true)}/>}
    </div>
  );
}

function ClimaInicio() {
  const days = [
    { d: "HOY 21", num: 21, ic: "☀️", max: 31, min: 19, mm: 0,  vent: "ok" },
    { d: "JUE 22", num: 22, ic: "⛅", max: 28, min: 17, mm: 0,  vent: "warn" },
    { d: "VIE 23", num: 23, ic: "🌧️", max: 22, min: 15, mm: 25, vent: "ok" },
    { d: "SÁB 24", num: 24, ic: "🌦️", max: 19, min: 13, mm: 15, vent: "ok" },
    { d: "DOM 25", num: 25, ic: "🌦️", max: 21, min: 14, mm: 5,  vent: "warn" },
    { d: "LUN 26", num: 26, ic: "🌧️", max: 25, min: 16, mm: 3,  vent: "ok" },
    { d: "MAR 27", num: 27, ic: "🌦️", max: 27, min: 17, mm: 10, vent: "warn" },
    { d: "MIÉ 28", num: 28, ic: "⛅", max: 29, min: 18, mm: 0,  vent: "bad" },
    { d: "JUE 29", num: 29, ic: "☀️", max: 32, min: 20, mm: 0,  vent: "bad" },
    { d: "VIE 30", num: 30, ic: "🌧️", max: 30, min: 19, mm: 0,  vent: "ok" },
  ];

  return (
    <>
      {/* 10-day horizontal forecast — full width */}
      <div className="mc-card">
        <div className="mc-card__head">
          <div>
            <div className="mc-card__eyebrow">Pronóstico extendido · Don Ramón, Pergamino</div>
            <div className="mc-card__title mt-4">Próximos 10 días</div>
          </div>
          <div className="row gap-12" style={{ alignItems: "center" }}>
            <div className="row gap-10 text-xs" style={{ alignItems: "center", padding: "6px 12px", background: "var(--mc-surface-2)", borderRadius: 999, border: "1px solid var(--mc-line)" }}>
              <span className="row gap-4" style={{ alignItems: "center" }}><span style={{ width: 14, height: 3, background: "#e7892b", borderRadius: 2 }}></span><span style={{ color: "var(--mc-text-2)", fontWeight: 600 }}>Máx</span></span>
              <span style={{ width: 1, height: 12, background: "var(--mc-line)" }}></span>
              <span className="row gap-4" style={{ alignItems: "center" }}><span style={{ width: 14, height: 3, background: "#3aa6d9", borderRadius: 2 }}></span><span style={{ color: "var(--mc-text-2)", fontWeight: 600 }}>Mín</span></span>
              <span style={{ width: 1, height: 12, background: "var(--mc-line)" }}></span>
              <span className="row gap-4" style={{ alignItems: "center" }}><span style={{ width: 10, height: 10, background: "linear-gradient(180deg, #5fb6e5, #2c82c9)", borderRadius: 2 }}></span><span style={{ color: "var(--mc-text-2)", fontWeight: 600 }}>Lluvia</span></span>
            </div>
            <button className="mc-btn mc-btn--secondary mc-btn--sm">Ver Detalles</button>
          </div>
        </div>
        <ForecastChart days={days}/>
      </div>

      {/* Mapa climático aéreo + Ventana de pulverización */}
      <div className="grid" style={{ gridTemplateColumns: "1fr 1.3fr", gap: 14 }}>
        <div className="mc-card" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
          <div style={{ height: 300, background: "linear-gradient(135deg, #4f9d52 0%, #3aa6d9 50%, #d9a538 100%)", position: "relative" }}>
            {/* Simulated radar map */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
              <defs>
                <radialGradient id="storm1" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ff3030" stopOpacity="0.8"/>
                  <stop offset="50%" stopColor="#e7892b" stopOpacity="0.6"/>
                  <stop offset="100%" stopColor="#d9a538" stopOpacity="0.2"/>
                </radialGradient>
                <radialGradient id="storm2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#3aa6d9" stopOpacity="0.7"/>
                  <stop offset="100%" stopColor="#3aa6d9" stopOpacity="0"/>
                </radialGradient>
                <pattern id="aerialField" patternUnits="userSpaceOnUse" width="80" height="60">
                  <rect width="80" height="60" fill="#4f9d52"/>
                  <rect x="0" y="0" width="40" height="30" fill="#5fae62"/>
                  <rect x="40" y="30" width="40" height="30" fill="#6db870"/>
                </pattern>
              </defs>
              <rect width="400" height="300" fill="url(#aerialField)"/>
              <ellipse cx="180" cy="120" rx="80" ry="50" fill="url(#storm1)"/>
                <ellipse cx="120" cy="200" rx="60" ry="40" fill="url(#storm2)"/>
              <ellipse cx="280" cy="180" rx="50" ry="35" fill="url(#storm2)"/>
            </svg>
            {/* Marker */}
            <div style={{ position: "absolute", left: "45%", top: "40%", width: 30, height: 30, borderRadius: "50%", background: "var(--mc-red)", border: "3px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.4)", display: "grid", placeItems: "center", color: "white" }}>
              <Icon name="map" size={14}/>
            </div>
            <div style={{ position: "absolute", left: "calc(45% + 35px)", top: "calc(40% - 4px)", background: "rgba(255,255,255,0.95)", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "var(--mc-ink)" }}>Tu Lote</div>

            {/* Live indicator */}
            <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, background: "rgba(0,0,0,0.65)", color: "white", padding: "8px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff3030", animation: "pulse 1.5s infinite" }}></span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>En vivo · Última act: Hace 2 min</span>
              <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2 }}>
                <div style={{ width: "70%", height: "100%", background: "white", borderRadius: 2 }}></div>
              </div>
            </div>

            {/* Expand button */}
            <button className="mc-icon-btn" style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.95)", border: "none", boxShadow: "var(--sh-sm)" }}>
              <Icon name="search" size={14}/>
            </button>
          </div>
        </div>

        <VentanaPulverizacion/>
      </div>
    </>
  );
}

function VentanaPulverizacion() {
  const now = new Date();
  const horaActual = now.getHours();
  const minutosActual = now.getMinutes();
  const horaStr = `${String(horaActual).padStart(2,"0")}:${String(minutosActual).padStart(2,"0")}`;
  // 6 slots desde la próxima hora redonda
  const startHour = horaActual + 1;
  // Patrón de condiciones a lo largo del día (24h): viento, dt, estado
  const fullDay = [
    { v: "Calma",  dt: 1.0, e: "INV. TERM.", c: "var(--mc-amber)",       bg: "var(--mc-amber-bg)" },        // 00
    { v: "Calma",  dt: 0.8, e: "INV. TERM.", c: "var(--mc-amber)",       bg: "var(--mc-amber-bg)" },        // 01
    { v: "2 km/h", dt: 0.6, e: "INV. TERM.", c: "var(--mc-amber)",       bg: "var(--mc-amber-bg)" },        // 02
    { v: "2 km/h", dt: 0.5, e: "INV. TERM.", c: "var(--mc-amber)",       bg: "var(--mc-amber-bg)" },        // 03
    { v: "3 km/h", dt: 1.2, e: "INV. TERM.", c: "var(--mc-amber)",       bg: "var(--mc-amber-bg)" },        // 04
    { v: "4 km/h", dt: 2.5, e: "ÓPTIMO",     c: "var(--mc-green-700)",   bg: "var(--mc-green-50)" },         // 05
    { v: "5 km/h", dt: 3.2, e: "ÓPTIMO",     c: "var(--mc-green-700)",   bg: "var(--mc-green-50)" },         // 06
    { v: "6 km/h", dt: 3.8, e: "ÓPTIMO",     c: "var(--mc-green-700)",   bg: "var(--mc-green-50)" },         // 07
    { v: "8 km/h", dt: 4.2, e: "ÓPTIMO",     c: "var(--mc-green-700)",   bg: "var(--mc-green-50)" },         // 08
    { v: "10 km/h",dt: 5.0, e: "BUENO",      c: "var(--mc-green-600)",   bg: "var(--mc-green-50)" },         // 09
    { v: "12 km/h",dt: 5.6, e: "BUENO",      c: "var(--mc-green-600)",   bg: "var(--mc-green-50)" },         // 10
    { v: "15 km/h",dt: 6.1, e: "MARGINAL",   c: "var(--mc-amber)",       bg: "var(--mc-amber-bg)" },        // 11
    { v: "18 km/h",dt: 6.5, e: "RIESGO MOD.",c: "var(--mc-amber)",       bg: "var(--mc-amber-bg)" },        // 12
    { v: "20 km/h",dt: 6.8, e: "RIESGO MOD.",c: "var(--mc-amber)",       bg: "var(--mc-amber-bg)" },        // 13
    { v: "22 km/h",dt: 6.2, e: "RIESGO MOD.",c: "var(--mc-amber)",       bg: "var(--mc-amber-bg)" },        // 14
    { v: "20 km/h",dt: 5.8, e: "RIESGO MOD.",c: "var(--mc-amber)",       bg: "var(--mc-amber-bg)" },        // 15
    { v: "18 km/h",dt: 5.2, e: "RIESGO MOD.",c: "var(--mc-amber)",       bg: "var(--mc-amber-bg)" },        // 16
    { v: "22 km/h",dt: 4.8, e: "RIESGO ALTO",c: "var(--mc-orange-700)",  bg: "var(--mc-orange-50)" },       // 17
    { v: "25 km/h",dt: 4.5, e: "NO APTO",    c: "var(--mc-red)",         bg: "var(--mc-red-bg)" },          // 18
    { v: "Calma",  dt: 3.8, e: "ÓPTIMO",     c: "var(--mc-green-700)",   bg: "var(--mc-green-50)" },         // 19
    { v: "5 km/h", dt: 3.5, e: "ÓPTIMO",     c: "var(--mc-green-700)",   bg: "var(--mc-green-50)" },         // 20
    { v: "3 km/h", dt: 1.2, e: "INV. TERM.", c: "var(--mc-amber)",       bg: "var(--mc-amber-bg)" },        // 21
    { v: "Calma",  dt: 1.0, e: "INV. TERM.", c: "var(--mc-amber)",       bg: "var(--mc-amber-bg)" },        // 22
    { v: "Calma",  dt: 0.8, e: "INV. TERM.", c: "var(--mc-amber)",       bg: "var(--mc-amber-bg)" },        // 23
  ];
  const slots = Array.from({ length: 6 }).map((_, i) => {
    const h = (startHour + i) % 24;
    const cond = fullDay[h];
    return { hora: `${String(h).padStart(2,"0")}:00 hs`, ...cond };
  });
  const condActual = fullDay[horaActual];

  const stateIcon = (e) => {
    if (e === "ÓPTIMO" || e === "BUENO") return "✓";
    if (e === "NO APTO" || e === "RIESGO ALTO") return "✗";
    return "⚠";
  };
  const stateBadgeColor = (e) =>
    e === "ÓPTIMO" || e === "BUENO" ? "green" :
    e === "NO APTO" ? "red" :
    e === "RIESGO ALTO" ? "orange" : "amber";

  return (
    <div className="mc-card" style={{ display: "flex", flexDirection: "column" }}>
      <div className="mc-card__head">
        <div>
          <div className="mc-card__title">Ventana de Pulverización</div>
          <div className="text-xs text-muted mt-2">Próximas 6 horas · Hoy</div>
        </div>
        <div className="row gap-8" style={{ alignItems: "center" }}>
          <div className="col" style={{ alignItems: "flex-end", gap: 2 }}>
            <span className="text-xs text-muted">Ahora · {horaStr}</span>
            <span className={`mc-badge mc-badge--${stateBadgeColor(condActual.e)}`} style={{ fontSize: 11, fontWeight: 800 }}>
              {stateIcon(condActual.e)} {condActual.e}
            </span>
          </div>
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(6, 1fr)", gap: 8, flex: 1, alignItems: "stretch" }}>
        {slots.map((h, i) => {
          const isNow = i === 0;
          return (
            <div key={i} style={{
              position: "relative",
              padding: "14px 10px 12px",
              borderRadius: 10,
              border: `1.5px solid ${isNow ? h.c : `${h.c}55`}`,
              background: `linear-gradient(180deg, ${h.bg} 0%, var(--mc-surface) 100%)`,
              display: "flex", flexDirection: "column", gap: 10,
              boxShadow: isNow ? `0 4px 14px ${h.c}25` : "none",
              transform: isNow ? "translateY(-2px)" : "none",
              transition: "transform 0.15s",
            }}>
              {isNow && (
                <div style={{
                  position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                  padding: "3px 10px", background: h.c, color: "white",
                  borderRadius: 999, fontSize: 9, fontWeight: 800, letterSpacing: "0.08em",
                }}>AHORA</div>
              )}
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--mc-ink)", fontFamily: "var(--ff-mono)" }}>{h.hora}</div>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: h.c, display: "grid", placeItems: "center", color: "white", fontSize: 11, fontWeight: 800 }}>
                  {stateIcon(h.e)}
                </div>
              </div>
              <div className="col gap-4" style={{ flex: 1 }}>
                <div className="row gap-6" style={{ alignItems: "center", padding: "5px 8px", background: "var(--mc-surface)", borderRadius: 6, border: "1px solid var(--mc-line)" }}>
                  <Icon name="wind" size={11} color="var(--mc-text-2)"/>
                  <span className="text-xs" style={{ color: "var(--mc-ink)", fontWeight: 600 }}>{h.v}</span>
                </div>
                <div className="row gap-6" style={{ alignItems: "center", padding: "5px 8px", background: "var(--mc-surface)", borderRadius: 6, border: "1px solid var(--mc-line)" }}>
                  <Icon name="thermometer" size={11} color="var(--mc-text-2)"/>
                  <span className="text-xs" style={{ color: "var(--mc-ink)", fontWeight: 600, fontFamily: "var(--ff-mono)" }}>ΔT {h.dt}</span>
                </div>
              </div>
              <div style={{ padding: "6px 8px", background: h.c, color: "white", borderRadius: 6, fontSize: 9, fontWeight: 800, textAlign: "center", letterSpacing: "0.05em" }}>
                {h.e}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Forecast 10-day chart — hybrid: HTML grid + SVG curve overlay so emojis render reliably */
function ForecastChart({ days }) {
  const N = days.length;
  const tempMin = 10, tempMax = 35;
  const maxMM = 30;
  // Y coordinates within the SVG overlay (height 160)
  const OVERLAY_H = 160;
  const tY = (t) => OVERLAY_H * (1 - (t - tempMin) / (tempMax - tempMin)) * 0.55 + 26;
  // viewBox unit = 100 per column (so curve x = i*100 + 50)
  const VBX = N * 100;

  const spray = {
    ok:   { color: "#4f9d52", label: "APTO",    icon: "✓", bg: "rgba(79,157,82,0.12)"  },
    warn: { color: "#d9a538", label: "MARG.",   icon: "⚠", bg: "rgba(217,165,56,0.12)" },
    bad:  { color: "#d13a3a", label: "NO APTO", icon: "✗", bg: "rgba(209,58,58,0.12)"  },
  };

  return (
    <div style={{ width: "100%", position: "relative", paddingTop: 8 }}>
      {/* HTML grid of day cards — provides icon, day label, vent pill */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${N}, 1fr)`, position: "relative" }}>
        {days.map((d, i) => {
          const isToday = i === 0;
          const sp = spray[d.vent];
          return (
            <div key={i} style={{
              position: "relative",
              padding: "10px 4px 14px",
              textAlign: "center",
              borderRight: i < N - 1 ? "1px solid var(--mc-line)" : "none",
              background: isToday ? "rgba(79,157,82,0.05)" : "transparent",
              minHeight: 270,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}>
              {isToday && <span style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 3, background: "#4f9d52" }}/>}
              {/* Day name */}
              <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 700, color: isToday ? "#4f9d52" : "var(--mc-ink)", letterSpacing: "0.04em" }}>{isToday ? "HOY" : d.d}</div>
              {/* Weather icon — HTML emoji guarantees rendering */}
              <div style={{ fontSize: 32, lineHeight: 1, marginTop: 6, fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif" }}>{d.ic}</div>
              {/* spacer that overlaps with the SVG (180px tall) */}
              <div style={{ flex: 1, minHeight: 174 }}/>
              {/* Spray status pill */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px 4px 4px",
                borderRadius: 999,
                background: sp.bg,
                border: `1.5px solid ${sp.color}`,
              }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: sp.color, color: "white", fontSize: 11, fontWeight: 800, display: "grid", placeItems: "center", lineHeight: 1 }}>{sp.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: sp.color, letterSpacing: "0.04em" }}>{sp.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SVG overlay — temp curves, area fills, rain bars */}
      <svg style={{ position: "absolute", top: 60, left: 0, width: "100%", height: OVERLAY_H, pointerEvents: "none" }} viewBox={`0 0 ${VBX} ${OVERLAY_H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="fcRainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5fb6e5" stopOpacity="0.95"/>
            <stop offset="100%" stopColor="#2c82c9" stopOpacity="0.85"/>
          </linearGradient>
          <linearGradient id="fcMaxArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e7892b" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#e7892b" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="fcMinArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3aa6d9" stopOpacity="0.14"/>
            <stop offset="100%" stopColor="#3aa6d9" stopOpacity="0"/>
          </linearGradient>
          <filter id="fcDotShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* Rain bars */}
        {days.map((d, i) => {
          if (d.mm === 0) return null;
          const cx = i * 100 + 50;
          const bh = (d.mm / maxMM) * OVERLAY_H * 0.45;
          const by = OVERLAY_H - bh;
          return (
            <g key={`r${i}`}>
              <rect x={cx - 22} y={by} width="44" height={bh} fill="url(#fcRainGrad)" rx="3"/>
              <rect x={cx - 22} y={by} width="44" height="3" fill="#5fb6e5" rx="1.5"/>
            </g>
          );
        })}

        {/* Area fills */}
        <polygon
          points={`50,${OVERLAY_H} ${days.map((d, i) => `${i * 100 + 50},${tY(d.max)}`).join(' ')} ${(N - 1) * 100 + 50},${OVERLAY_H}`}
          fill="url(#fcMaxArea)"/>
        <polygon
          points={`50,${OVERLAY_H} ${days.map((d, i) => `${i * 100 + 50},${tY(d.min)}`).join(' ')} ${(N - 1) * 100 + 50},${OVERLAY_H}`}
          fill="url(#fcMinArea)"/>

        {/* Min line */}
        <polyline fill="none" stroke="#3aa6d9" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
          points={days.map((d, i) => `${i * 100 + 50},${tY(d.min)}`).join(' ')}/>
        {/* Max line */}
        <polyline fill="none" stroke="#e7892b" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
          points={days.map((d, i) => `${i * 100 + 50},${tY(d.max)}`).join(' ')}/>

        {/* Dots */}
        {days.map((d, i) => {
          const x = i * 100 + 50;
          return (
            <g key={`d${i}`}>
              <circle cx={x} cy={tY(d.max)} r="6" fill="#e7892b" stroke="white" strokeWidth="2" filter="url(#fcDotShadow)"/>
              <circle cx={x} cy={tY(d.min)} r="5" fill="#3aa6d9" stroke="white" strokeWidth="2" filter="url(#fcDotShadow)"/>
            </g>
          );
        })}
      </svg>

      {/* HTML temp + rain labels (so they stay readable & not stretched) */}
      <div style={{ position: "absolute", top: 60, left: 0, width: "100%", height: OVERLAY_H, display: "grid", gridTemplateColumns: `repeat(${N}, 1fr)`, pointerEvents: "none" }}>
        {days.map((d, i) => (
          <div key={i} style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: tY(d.max) - 22, fontSize: 14, fontWeight: 800, color: "var(--mc-ink)", fontFamily: "var(--ff-mono)", whiteSpace: "nowrap" }}>{d.max}°</span>
            <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: tY(d.min) + 8, fontSize: 13, fontWeight: 700, color: "var(--mc-ink)", fontFamily: "var(--ff-mono)", whiteSpace: "nowrap" }}>{d.min}°</span>
            {d.mm > 0 && (
              <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 4, fontSize: 11, fontWeight: 800, color: "white", padding: "2px 8px", background: "#2c82c9", borderRadius: 6, fontFamily: "var(--ff-mono)", whiteSpace: "nowrap" }}>{d.mm}mm</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ClimaAlertasNew() {
  const criticas = [
    { titulo: "Riesgo de Helada Inminente", lugar: "Lote Bajo · 04:00 AM", icon: "thermometer", color: "#3aa6d9", val: "-2.5°C", chart: "temp" },
    { titulo: "Reporte de Granizo Confirmado", lugar: "Campo Oeste · Hace 15 min", icon: "alert", color: "#3aa6d9", val: "Intensidad: ALTA (Daño visible)", chart: "icon" },
    { titulo: "Alerta de Tormenta Eléctrica", lugar: "Área General · En curso", icon: "bolt", color: "#e7892b", val: "Proximidad: < 5km (Riesgo personal)", chart: "icon" },
  ];
  const alertas = [
    { titulo: "Umbral de Isoca Superado", lugar: "Lote 4 (Soja)", icon: "leaf", color: "#d9a538", val: "8/10 por metro", chart: "bar", pct: 80 },
    { titulo: "Viento Excesivo para Pulverizar", lugar: "Actualmente", icon: "wind", color: "#e7892b", val: "Ráfagas: 45 km/h", chart: "icon" },
    { titulo: "Estrés Hídrico Detectado", lugar: "Lote de Maíz", icon: "droplet", color: "#a88032", val: "Agua Útil: 20% (Crítico)", chart: "icon" },
  ];
  const info = [
    { titulo: "Lluvia Registrada (Automático)", lugar: "Hace 30 min", icon: "droplet", color: "#3aa6d9", val: "45 mm", chart: "drop" },
  ];

  const Section = ({ title, items, accentColor }) => (
    <div>
      <div className="text-xs" style={{ textTransform: "uppercase", color: accentColor, fontWeight: 700, letterSpacing: "0.06em", padding: "10px 0 6px" }}>{title}</div>
      <div className="col gap-6">
        {items.map((a, i) => (
          <div key={i} style={{ padding: "10px 14px", border: `1px solid var(--mc-line)`, borderLeft: `4px solid ${accentColor}`, borderRadius: 10, display: "grid", gridTemplateColumns: "auto 1fr 1.2fr auto", gap: 14, alignItems: "center", background: "var(--mc-surface)" }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${a.color}1a`, color: a.color, display: "grid", placeItems: "center" }}>
              <Icon name={a.icon} size={18}/>
            </div>
            <div>
              <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 14 }}>{a.titulo}</div>
              <div className="text-xs text-muted">{a.lugar}</div>
            </div>
            <div className="row gap-8" style={{ alignItems: "center" }}>
              {a.chart === "temp" && (
                <svg width="100" height="36" viewBox="0 0 100 36">
                  <polyline fill="none" stroke="var(--mc-red)" strokeWidth="2" points="0,8 20,12 40,18 60,24 80,30 100,32"/>
                </svg>
              )}
              {a.chart === "bar" && (
                <div style={{ flex: 1, maxWidth: 120 }}>
                  <div className="text-xs font-mono" style={{ color: "var(--mc-amber)", textAlign: "right", fontWeight: 700 }}>{a.pct}%</div>
                  <div className="mc-prog mt-2"><div className="mc-prog__bar" style={{ width: `${a.pct}%`, background: "var(--mc-amber)" }}></div></div>
                </div>
              )}
              {a.chart === "drop" && (
                <span className="mc-badge mc-badge--blue" style={{ fontSize: 12 }}><Icon name="droplet" size={11}/>{a.val}</span>
              )}
              {a.chart !== "drop" && (
                <span className="text-xs font-semi" style={{ color: a.color }}>{a.val}</span>
              )}
            </div>
            <button className="mc-btn mc-btn--primary mc-btn--sm">Gestionar Tareas</button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mc-card">
      <div className="row gap-8" style={{ marginBottom: 4 }}>
        <span className="mc-badge" style={{ background: "#1a1f1c", color: "white" }}>● Todos (7)</span>
        <span className="mc-badge mc-badge--red">● Críticos (3)</span>
        <span className="mc-badge mc-badge--amber">● Alertas (3)</span>
        <span className="mc-badge mc-badge--blue">● Informativos (1)</span>
      </div>
      <Section title="Critical Section" items={criticas} accentColor="var(--mc-red)"/>
      <Section title="Warning Section" items={alertas} accentColor="var(--mc-amber)"/>
      <Section title="Info Section" items={info} accentColor="var(--mc-blue)"/>
    </div>
  );
}

function ClimaLluviasNew({ onRegistrar }) {
  const { useState } = React;
  const [scope, setScope] = useState("30d");

  const data30 = [4, 0, 0, 12, 8, 0, 0, 20, 32, 0, 0, 0, 4, 0, 0, 0, 8, 12, 0, 0, 5, 18, 0, 0, 6, 0, 0, 14, 0, 22];
  const hist30 = [3, 2, 0, 9, 6, 0, 0, 18, 25, 0, 0, 0, 3, 0, 0, 0, 7, 10, 0, 0, 4, 15, 0, 0, 5, 0, 0, 11, 0, 18];
  const dataMonth = [85, 110, 130, 95, 60, 25, 15, 35, 55, 95, 120, 140];
  const histMonth = [90, 105, 118, 88, 72, 32, 18, 38, 62, 88, 115, 135];
  const dataYear = [612, 720, 685, 850, 740, 680];
  const histYear = [590, 680, 710, 790, 760, 700];
  const monthLabels = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const yearLabels = ["2020","2021","2022","2023","2024","2025"];

  const dataset = scope === "30d" ? data30 : scope === "mensual" ? dataMonth : dataYear;
  const histset = scope === "30d" ? hist30 : scope === "mensual" ? histMonth : histYear;
  const labels = scope === "30d" ? null : scope === "mensual" ? monthLabels : yearLabels;
  const max = Math.max(...dataset, ...histset);

  return (
    <>
      {/* Main chart — reorganized to top */}
      <div className="mc-card">
        <div className="mc-card__head">
          <div>
            <div className="mc-card__title">Actual vs Histórico</div>
            <div className="row gap-12 text-xs text-muted mt-4">
              <span className="row gap-4"><span style={{ width: 14, height: 3, background: "var(--mc-blue)", borderRadius: 2, display: "inline-block" }}></span>Período actual</span>
              <span className="row gap-4"><span style={{ width: 14, height: 3, background: "var(--mc-text-3)", borderRadius: 2, display: "inline-block", borderTop: "2px dashed var(--mc-text-3)" }}></span>Histórico promedio</span>
            </div>
          </div>
          <div className="mc-seg">
            <button className={scope === "30d" ? "is-on" : ""} onClick={() => setScope("30d")}>Últ. 30 días</button>
            <button className={scope === "mensual" ? "is-on" : ""} onClick={() => setScope("mensual")}>Mensual</button>
            <button className={scope === "anual" ? "is-on" : ""} onClick={() => setScope("anual")}>Anual</button>
          </div>
        </div>
        <svg viewBox="0 0 1000 280" width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const y = 30 + (220 * (1 - t));
            return <g key={i}>
              <line x1="40" y1={y} x2="980" y2={y} stroke="var(--mc-line)" strokeDasharray={i === 0 ? "0" : "2,3"}/>
              <text x="34" y={y + 3} fontSize="11" fontFamily="var(--ff-mono)" fill="var(--mc-text-3)" textAnchor="end">{Math.round(max * t)}</text>
            </g>;
          })}
          {/* Current bars (blue, slightly translucent) */}
          {dataset.map((v, i) => {
            const bw = (940 / dataset.length);
            const x = 40 + i * bw + 2;
            const bh = v > 0 ? (v / max) * 220 : 0;
            const y = 30 + 220 - bh;
            return (
              <g key={i}>
                {bh > 0 && <rect x={x} y={y} width={bw - 4} height={bh} fill="var(--mc-blue)" rx="2" opacity="0.75"/>}
                {labels && <text x={x + bw/2} y={270} fontSize="11" fontFamily="var(--ff-ui)" fill="var(--mc-text-2)" textAnchor="middle">{labels[i]}</text>}
              </g>
            );
          })}
          {/* Historical line (gray dashed) */}
          <polyline
            fill="none"
            stroke="var(--mc-text-3)"
            strokeWidth="2"
            strokeDasharray="5,4"
            opacity="0.8"
            points={histset.map((v, i) => {
              const bw = 940 / histset.length;
              const x = 40 + i * bw + bw / 2;
              const y = 30 + 220 - (v / max) * 220;
              return `${x},${y}`;
            }).join(' ')}
          />
          {histset.map((v, i) => {
            const bw = 940 / histset.length;
            const x = 40 + i * bw + bw / 2;
            const y = 30 + 220 - (v / max) * 220;
            return <circle key={i} cx={x} cy={y} r="3" fill="var(--mc-text-3)" opacity="0.7"/>;
          })}
        </svg>
      </div>

      {/* 3 KPI cards — compact horizontal row */}
      <div className="grid g-cols-3 gap-14">
        <div className="mc-card">
          <div className="row gap-14" style={{ alignItems: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--mc-blue-bg)", display: "grid", placeItems: "center", color: "var(--mc-blue)", flexShrink: 0 }}>
              <Icon name="droplet" size={24}/>
            </div>
            <div>
              <div className="text-xs text-muted">Acumulado del año</div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, color: "var(--mc-blue)", fontWeight: 700, lineHeight: 1.1 }}>850 mm</div>
              <div className="text-xs mt-4" style={{ color: "var(--mc-green-700)", fontWeight: 600 }}>+15% vs año pasado</div>
            </div>
          </div>
        </div>
        <div className="mc-card">
          <div className="row gap-14" style={{ alignItems: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--mc-blue-bg)", display: "grid", placeItems: "center", color: "var(--mc-blue)", flexShrink: 0 }}>
              <Icon name="activity" size={24}/>
            </div>
            <div>
              <div className="text-xs text-muted">Promedio diario · últ. 30 días</div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, color: "var(--mc-ink)", fontWeight: 700, lineHeight: 1.1 }}>2.3 mm</div>
              <div className="text-xs mt-4 text-muted">Faltan 20 mm para promedio</div>
            </div>
          </div>
        </div>
        <div className="mc-card">
          <div className="row gap-14" style={{ alignItems: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--mc-red-bg)", display: "grid", placeItems: "center", color: "var(--mc-red)", flexShrink: 0 }}>
              <Icon name="clock" size={24}/>
            </div>
            <div>
              <div className="text-xs text-muted">Días sin lluvia</div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, color: "var(--mc-ink)", fontWeight: 700, lineHeight: 1.1 }}>8 días</div>
              <div className="text-xs mt-4" style={{ color: "var(--mc-amber)", fontWeight: 600 }}>Suelo perdiendo humedad</div>
            </div>
          </div>
        </div>
      </div>

      {/* Registro histórico de eventos */}
      <div className="mc-card">
        <div className="mc-card__head">
          <div className="mc-card__title">Eventos de Lluvia Registrados</div>
          <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={onRegistrar}><Icon name="droplet" size={13}/>Registrar Lluvia</button>
        </div>
        <div className="col gap-8">
          {[
            { fecha: "22 Dic - 04:30 AM", lugar: "Campo El Amanecer (Lotes 1, 2)", mm: 45, pct: 85, tags: [{ label: "Granizo", color: "amber", icon: "alert" }, { label: "Torrencial", color: "blue", icon: "droplet" }] },
            { fecha: "15 Dic - 10:00 AM", lugar: "Campo La Cañada (Todo)", mm: 20, pct: 38, tags: [{ label: "Lluvia Mansa", color: "blue", icon: "droplet" }] },
            { fecha: "02 Dic", lugar: "Campo General", mm: 5, pct: 9, tags: [] },
          ].map((r, i) => (
            <div key={i} style={{ padding: "10px 14px", border: "1px solid var(--mc-line)", borderRadius: 10, display: "grid", gridTemplateColumns: "160px 1fr 1.5fr auto auto", gap: 16, alignItems: "center" }}>
              <div className="font-mono text-sm" style={{ color: "var(--mc-ink)" }}>{r.fecha}</div>
              <div className="text-sm" style={{ color: "var(--mc-text)" }}>{r.lugar}</div>
              <div>
                <div className="row" style={{ alignItems: "center", gap: 8 }}>
                  <div className="mc-prog" style={{ flex: 1 }}><div className="mc-prog__bar" style={{ width: `${r.pct}%`, background: "var(--mc-blue)" }}></div></div>
                  <span className="font-semi text-sm" style={{ color: "var(--mc-blue)", minWidth: 48, textAlign: "right" }}>{r.mm} mm</span>
                </div>
              </div>
              <div className="row gap-4">
                {r.tags.map((t, j) => (
                  <span key={j} className={`mc-badge mc-badge--${t.color}`}><Icon name={t.icon} size={10}/>{t.label}</span>
                ))}
              </div>
              <button className="mc-icon-btn"><Icon name="edit" size={13}/></button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ================= REGISTRAR RIEGO MODAL ================= */
function RegistrarRiegoModal({ open, onClose }) {
  const { useState } = React;
  const [modo, setModo] = useState("ia"); // "ia" | "manual"
  const [fecha, setFecha] = useState("2025-09-24");
  const [hora, setHora] = useState("05:00");
  const [mm, setMm] = useState(15);
  const [ubicacion, setUbicacion] = useState("pivot1");
  const [lotes, setLotes] = useState({ l4: true, l7: true, l9: false, l2: false });
  const [obs, setObs] = useState("");

  if (!open) return null;

  const toggleLote = k => setLotes(prev => ({ ...prev, [k]: !prev[k] }));
  const selectedCount = Object.values(lotes).filter(Boolean).length;

  const overlay = { position:"fixed",inset:0,background:"rgba(15,22,36,0.55)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:24 };
  const modal = { background:"#fff",borderRadius:16,width:"100%",maxWidth:660,maxHeight:"92vh",overflow:"hidden",boxShadow:"0 24px 64px rgba(0,0,0,0.22)",display:"flex",flexDirection:"column" };
  const inp = { width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #c0c5ce", background:"#fff", color:"var(--mc-ink)", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };
  const lbl = { fontSize:11, fontWeight:600, color:"#64748b", marginBottom:4, textTransform:"uppercase", letterSpacing:".04em", display:"block" };
  const bigNum = { fontSize:52,fontWeight:800,color:"#2c82c9",lineHeight:1,textAlign:"center" };

  const Section = ({ title, icon, right, children }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }}/>
        {right}
      </div>
      {children}
    </div>
  );
  const pivotOptions = [
    { value:"pivot1", label:"Pivot Central 1" },
    { value:"pivot2", label:"Pivot Norte 2" },
    { value:"sector3", label:"Sector Sur — Goteo" },
    { value:"aspersion", label:"Aspersión — Lotes 7-9" },
  ];
  const lotesOptions = [
    { key:"l4", label:"Lote 4 — Maíz V6", has:"18 Ha" },
    { key:"l7", label:"Lote 7 — Sorgo V3", has:"14 Ha" },
    { key:"l9", label:"Lote 9 — Girasol R1", has:"22 Ha" },
    { key:"l2", label:"Lote 2 — Soja V4", has:"16 Ha" },
  ];

  const iaSugerencias = [
    { fecha:"Hoy 24/09 · 05:00", mm:15, pivot:"Pivot Central 1", lotes:"Lote 4 + Lote 7", motivo:"Humedad proyectada cae a 22% sin riego hoy", saving:"$320 vs estrés" },
    { fecha:"Lun 27/09 · 05:00", mm:15, pivot:"Pivot Norte 2", lotes:"Lote 9 + Lote 2", motivo:"Balance hídrico negativo en 5 días", saving:"$280 vs estrés" },
  ];

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#2c82c9 0%,#1a5fa0 100%)",padding:"22px 28px 20px",color:"#fff",display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexShrink:0 }}>
          <div>
            <div style={{ fontSize:11, opacity:0.8, marginBottom:6, letterSpacing:".06em", textTransform:"uppercase" }}>Agricultura · Plan de Riego</div>
            <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-.02em", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:26 }}>💧</span> Registrar Evento de Riego
            </div>
            <div style={{ fontSize:13, opacity:0.85, marginTop:4 }}>Confirmá una sugerencia IA o ingresá un riego manual.</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.18)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:8,color:"#fff",width:34,height:34,fontSize:17,cursor:"pointer",display:"grid",placeItems:"center",flexShrink:0 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding:"22px 28px", overflowY:"auto", flex:1 }}>
          {/* Mode toggle */}
          <div style={{ display:"flex", gap:8, marginBottom:18 }}>
            <button
              onClick={()=>setModo("ia")}
              style={{ flex:1, padding:"10px 14px", border:`2px solid ${modo==="ia"?"#2c82c9":"#c0c5ce"}`, borderRadius:10, background:modo==="ia"?"#eff6ff":"#fff", color:modo==="ia"?"#1e40af":"var(--mc-ink)", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all .15s" }}>
              <IABadge/> Confirmar Sugerencia IA <span style={{ background:"#2c82c9",color:"#fff",borderRadius:99,padding:"1px 8px",fontSize:11,fontWeight:700 }}>2</span>
            </button>
            <button
              onClick={()=>setModo("manual")}
              style={{ flex:1, padding:"10px 14px", border:`2px solid ${modo==="manual"?"#475569":"#c0c5ce"}`, borderRadius:10, background:modo==="manual"?"#f1f5f9":"#fff", color:modo==="manual"?"#1e293b":"var(--mc-ink)", fontWeight:700, fontSize:13, cursor:"pointer", transition:"all .15s" }}>
              Registro Manual
            </button>
          </div>

          {modo === "ia" ? (
            <Section title="Sugerencias IA — esta semana" icon="✨" right={<span style={{ fontSize:11, color:"#2c82c9", fontWeight:600 }}>2 detectadas</span>}>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {iaSugerencias.map((s, i) => (
                  <div key={i} style={{ background:"#eff6ff", border:"1.5px solid #bfdbfe", borderRadius:12, padding:"14px 16px", display:"flex", flexDirection:"column", gap:10 }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
                      <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                        <div style={{ width:42, height:42, borderRadius:10, background:"#2c82c9", display:"grid", placeItems:"center", flexShrink:0 }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 2 C12 2 5 10 5 14 a7 7 0 0 0 14 0 C19 10 12 2 12 2z"/></svg>
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:14, color:"#1e3a5f" }}>Riego Sugerido #{i+1}</div>
                          <div style={{ fontSize:13, color:"#2c82c9", fontWeight:600 }}>{s.fecha}</div>
                          <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{s.lotes} · {s.pivot}</div>
                        </div>
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <div style={{ fontSize:26, fontWeight:800, color:"#2c82c9", lineHeight:1 }}>{s.mm} mm</div>
                        <div style={{ fontSize:11, color:"#64748b" }}>recomendados</div>
                      </div>
                    </div>
                    <div style={{ background:"#dbeafe", borderRadius:8, padding:"8px 12px", fontSize:12, color:"#1e40af", display:"flex", gap:6, alignItems:"center" }}>
                      <IABadge/> {s.motivo} <span style={{ marginLeft:"auto", color:"#16a34a", fontWeight:700 }}>Ahorro est. {s.saving}</span>
                    </div>
                    <button className="mc-btn mc-btn--blue mc-btn--sm mc-btn--block">
                      ✓ Confirmar Riego #{i+1}
                    </button>
                  </div>
                ))}
              </div>
            </Section>
          ) : (
            <>
              <Section title="Cantidad de Agua" icon="💧">
                <div style={{ display:"flex", alignItems:"stretch", gap:14 }}>
                  <div style={{ flex:"0 0 160px", display:"flex", flexDirection:"column", alignItems:"center", gap:6, background:"#eff6ff", borderRadius:12, padding:"14px 12px", border:"1.5px solid #bfdbfe" }}>
                    <div style={bigNum}>{mm}</div>
                    <div style={{ fontSize:12, color:"#64748b", fontWeight:600 }}>milímetros</div>
                    <div style={{ display:"flex", gap:6, marginTop:2 }}>
                      <button onClick={()=>setMm(m=>Math.max(0,m-5))} style={{ width:30, height:30, borderRadius:8, border:"1.5px solid #c0c5ce", background:"#fff", fontSize:16, cursor:"pointer", fontWeight:700 }}>−</button>
                      <button onClick={()=>setMm(m=>m+5)} style={{ width:30, height:30, borderRadius:8, border:"none", background:"#2c82c9", color:"#fff", fontSize:16, cursor:"pointer", fontWeight:700 }}>+</button>
                    </div>
                  </div>
                  <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, alignContent:"start" }}>
                    <div>
                      <label style={lbl}>Fecha</label>
                      <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={inp}/>
                    </div>
                    <div>
                      <label style={lbl}>Hora de inicio</label>
                      <input type="time" value={hora} onChange={e=>setHora(e.target.value)} style={inp}/>
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Ubicación y Sistema" icon="📍">
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div>
                    <label style={lbl}>Sistema / Pivot</label>
                    <select value={ubicacion} onChange={e=>setUbicacion(e.target.value)} style={inp}>
                      {pivotOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Duración estimada</label>
                    <div style={{ display:"flex", gap:6 }}>
                      <input type="number" defaultValue={4} min={0} style={{ ...inp, width:70 }}/>
                      <select style={{ ...inp, flex:1 }}>
                        <option>horas</option>
                        <option>minutos</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Lotes Incluidos" icon="🌾" right={<span style={{ fontSize:11, color:"#2c82c9", fontWeight:600 }}>{selectedCount} seleccionados</span>}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {lotesOptions.map(o => (
                    <div key={o.key} onClick={()=>toggleLote(o.key)} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, border:`2px solid ${lotes[o.key]?"#2c82c9":"#c0c5ce"}`, background:lotes[o.key]?"#eff6ff":"#fff", cursor:"pointer", transition:"all .15s" }}>
                      <div style={{ width:20, height:20, borderRadius:5, border:`2px solid ${lotes[o.key]?"#2c82c9":"#c0c5ce"}`, background:lotes[o.key]?"#2c82c9":"#fff", display:"grid", placeItems:"center", flexShrink:0 }}>
                        {lotes[o.key] && <svg width="12" height="12" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{o.label}</div>
                        <div style={{ fontSize:11, color:"#64748b" }}>{o.has}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Observaciones (opcional)" icon="📝">
                <textarea value={obs} onChange={e=>setObs(e.target.value)} rows={3} placeholder="Ej: Riego complementario post-lluvia · Verificar caudal de pivot 1..." style={{ ...inp, resize:"vertical", lineHeight:1.5 }}/>
              </Section>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"16px 28px", borderTop:"1px solid #e2e8f0", display:"flex", justifyContent:"flex-end", gap:10, flexShrink:0 }}>
          <button className="mc-btn mc-btn--secondary" onClick={onClose}>Cancelar</button>
          <button onClick={onClose} className="mc-btn mc-btn--blue">
            <span style={{ fontSize:14 }}>💧</span> {modo === "ia" ? "Confirmar Ambos Riegos" : "Guardar Registro"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= PLAN DE RIEGO ================= */
function PlanRiego() {
  const { useState } = React;
  const [riegoOpen, setRiegoOpen] = useState(false);

  return (
    <div className="col gap-20">
      <RegistrarRiegoModal open={riegoOpen} onClose={()=>setRiegoOpen(false)}/>
      <PageHeader
        crumbs={["Agricultura","Plan de Riego"]}
        title="Plan de Riego"
        subtitle="Balance hídrico proyectado, sugerencias de IA y registro de riegos."
      />
      <div className="grid g-cols-5">
        <KPI label="Estado Hídrico" value="Bien Hidratado" delta="✓ Lotes en confort" trend="up" icon="droplet" accent/>
        <KPI label="Agua Útil (Tanque)" value="45%" delta="120 mm disponibles" trend="up" icon="activity"/>
        <KPI label="Consumo Diario (ETo)" value="6 mm/día" delta="Maíz V6 · K=1.1" trend="up" icon="thermometer"/>
        <KPI label="Próximo Riego" value="24/09 5:00" delta="+15 mm sugeridos" trend="up" icon="calendar" ia/>
        <KPI label="Costo Proyectado" value="$12/mm" delta="Energía + insumo" trend="up" icon="dollar"/>
      </div>
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button className="mc-btn mc-btn--primary" onClick={()=>setRiegoOpen(true)}><Icon name="plus" size={14}/>Registrar Riego</button>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
        <BalanceHidricoProyectado/>
        <AguaUlt30Dias/>
      </div>
    </div>
  );
}

function BalanceHidricoProyectado() {
  const { useState } = React;
  const W = 900, H = 360;
  const padL = 56, padR = 30, padT = 40, padB = 56;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const days = ["HOY 22","JUE 23","VIE 24","SÁB 25","DOM 26","LUN 27","MAR 28"];
  const dx = innerW / (days.length - 1);
  const yPct = p => padT + innerH * (1 - p / 100);

  const [estrategia, setEstrategia] = useState(75);

  const sinRiego = [82, 70, 58, 38, 22, 12, 5];
  const conRiego = [82, 72, 62, 78, 68, 82, 70];

  // smooth catmull-rom-ish curve for nicer lines
  const smoothPath = (vals) => {
    const pts = vals.map((v, i) => [padL + i * dx, yPct(v)]);
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[Math.max(0, i - 2)];
      const p1 = pts[i - 1];
      const p2 = pts[i];
      const p3 = pts[Math.min(pts.length - 1, i + 1)];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
    }
    return d;
  };

  const sinRiegoPath = smoothPath(sinRiego);
  const conRiegoPath = smoothPath(conRiego);

  const iaBars = [
    { day: 3, level: conRiego[3], label: "+15mm" },
    { day: 5, level: conRiego[5], label: "+15mm" },
  ];

  return (
    <div className="mc-card ia-card" style={{ border: "none", padding: 0, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 0" }}>
        <div className="row" style={{ alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div className="row gap-8" style={{ alignItems: "center" }}>
              <div className="mc-card__title">Balance Hídrico Proyectado</div>
              <IABadge/>
            </div>
            <div className="text-xs text-muted mt-2">Próximos 7 días · Don Ramón · Maíz Lote 4 (V6)</div>
          </div>
          <div className="row gap-6" style={{ flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end" }}>
            <Legend color="var(--mc-blue)" label="Humedad Actual" mode="line"/>
            <Legend color="var(--mc-text-3)" label="Sin Riego" mode="dashed"/>
            <Legend color="var(--mc-blue)" label="Con Riego" mode="dotted"/>
            <Legend color="#2c82c9" label="IA Riego" mode="bar"/>
          </div>
        </div>

        {/* KPI badges row inside the IA card */}
        <div className="grid g-cols-4 gap-8" style={{ marginBottom: 8 }}>
          <BHKpi label="Humedad actual" value="82%" sub="Capacidad campo" tone="blue"/>
          <BHKpi label="Agua útil" value="120 mm" sub="Suelo perfil 1m" tone="blue"/>
          <BHKpi label="Déficit proyectado" value="-25 mm" sub="día 4-5 sin riego" tone="red"/>
          <BHKpi label="Próximo riego IA" value="Sáb 25" sub="+15 mm sugeridos" tone="orange"/>
        </div>
      </div>

      {/* Chart */}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block", padding: "0 8px" }}>
        <defs>
          <linearGradient id="bhConRiegoArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c82c9" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#2c82c9" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="bhIABarFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c82c9" stopOpacity="0.42"/>
            <stop offset="100%" stopColor="#2c82c9" stopOpacity="0.18"/>
          </linearGradient>
        </defs>

        {/* Y grid */}
        {[0, 20, 40, 60, 80, 100].map(p => {
          const y = yPct(p);
          return (
            <g key={p}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--mc-line)" strokeDasharray={p === 0 ? "0" : "2,3"}/>
              <text x={padL - 8} y={y + 4} fontSize="11" fontFamily="var(--ff-mono)" fill="var(--mc-text-3)" textAnchor="end">{p}%</text>
            </g>
          );
        })}

        {/* Red zone */}
        <rect x={padL} y={yPct(20)} width={innerW} height={yPct(0) - yPct(20)} fill="var(--mc-red)" opacity="0.07"/>
        <text x={padL + 10} y={yPct(15)} fontSize="11" fontFamily="var(--ff-ui)" fill="var(--mc-red)" fontWeight="700" letterSpacing="0.04em">⚠ ZONA ROJA · PUNTO DE MARCHITEZ</text>

        {/* IA Suggestion bars — solid blue with all 4 borders + IA chip on top */}
        {iaBars.map((s, i) => {
          const x = padL + s.day * dx;
          const barW = 38;
          const barTop = yPct(s.level);
          const barBot = yPct(0);
          const barH = barBot - barTop;
          return (
            <g key={i}>
              <rect x={x - barW/2} y={barTop} width={barW} height={barH} fill="url(#bhIABarFill)" stroke="#2c82c9" strokeWidth="2" rx={3}/>
              {/* Top accent line emphasis */}
              <line x1={x - barW/2} y1={barTop} x2={x + barW/2} y2={barTop} stroke="#2c82c9" strokeWidth="3"/>
              {/* IA chip */}
              <g transform={`translate(${x - 38}, ${barTop - 36})`}>
                <rect width="76" height="26" rx="13" fill="#FF9D00"/>
                <path d="M 50 6 L 51.3 12.7 L 58 14 L 51.3 15.3 L 50 22 L 48.7 15.3 L 42 14 L 48.7 12.7 Z" fill="white"/>
                <text x="22" y="17" fontSize="11" fontFamily="var(--ff-ui)" fill="white" fontWeight="800" textAnchor="middle" letterSpacing="0.04em">{s.label}</text>
              </g>
              {/* Connector dot at top */}
              <circle cx={x} cy={barTop} r="4" fill="#2c82c9" stroke="white" strokeWidth="1.5"/>
            </g>
          );
        })}

        {/* Sin riego — dashed gray */}
        <path d={sinRiegoPath} fill="none" stroke="var(--mc-text-3)" strokeWidth="2" strokeDasharray="6,4"/>

        {/* Con riego area + line */}
        <path d={`${conRiegoPath} L${padL + 6 * dx},${yPct(0)} L${padL},${yPct(0)} Z`} fill="url(#bhConRiegoArea)"/>
        <path d={conRiegoPath} fill="none" stroke="#2c82c9" strokeWidth="2.5" strokeDasharray="2,4"/>

        {/* Humedad actual marker (solid first segment) */}
        <line x1={padL} y1={yPct(82)} x2={padL + dx * 0.3} y2={yPct(82)} stroke="var(--mc-blue)" strokeWidth="3.5"/>
        <circle cx={padL} cy={yPct(82)} r="6" fill="var(--mc-blue)" stroke="white" strokeWidth="2"/>

        {/* Dots on con-riego line */}
        {conRiego.map((v, i) => (
          <circle key={i} cx={padL + i * dx} cy={yPct(v)} r="3.5" fill="white" stroke="#2c82c9" strokeWidth="1.5"/>
        ))}

        {/* X-axis */}
        {days.map((d, i) => (
          <text key={d} x={padL + i * dx} y={H - padB + 22} fontSize="11" fontFamily="var(--ff-ui)" fontWeight={i === 0 ? "800" : "600"} fill={i === 0 ? "#4f9d52" : "var(--mc-ink)"} textAnchor="middle">{d}</text>
        ))}
      </svg>

      {/* Estrategia slider footer */}
      <div className="row gap-12" style={{ alignItems: "center", padding: "14px 18px", background: "var(--mc-surface-2)", borderTop: "1px solid var(--mc-line)" }}>
        <div style={{ flex: 1 }}>
          <div className="row gap-6 mb-6" style={{ alignItems: "center" }}>
            <span className="text-xs text-muted font-semi" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>Estrategia de Riego</span>
            <IABadge/>
          </div>
          <div className="row gap-10" style={{ alignItems: "center" }}>
            <span className="text-xs text-muted" style={{ whiteSpace: "nowrap" }}>💧 Ahorrar Agua</span>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                type="range" min={0} max={100} value={estrategia}
                onChange={e => setEstrategia(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--mc-blue)", cursor: "pointer" }}
              />
              <div className="row" style={{ justifyContent: "space-between", marginTop: 4 }}>
                <span className="text-xs text-muted">0%</span>
                <span className="font-mono font-semi" style={{ color: "var(--mc-blue)", fontSize: 13 }}>{estrategia}%</span>
                <span className="text-xs text-muted">100%</span>
              </div>
            </div>
            <span className="text-xs text-muted" style={{ whiteSpace: "nowrap" }}>Maximizar Rinde 🌾</span>
          </div>
        </div>
        <div className="text-right" style={{ borderLeft: "1px solid var(--mc-line)", paddingLeft: 14, minWidth: 130 }}>
          <div className="text-xs text-muted">COSTO ESTIMADO</div>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, color: "var(--mc-ink)" }}>$450 USD</div>
        </div>
        <button className="mc-btn mc-btn--primary"><Icon name="check" size={13}/>Aprobar Orden</button>
      </div>
    </div>
  );
}

function Legend({ color, label, mode }) {
  let line;
  if (mode === "line") line = <span style={{ width: 16, height: 3, background: color, borderRadius: 1 }}/>;
  else if (mode === "dashed") line = <span style={{ width: 16, height: 0, borderTop: `2px dashed ${color}` }}/>;
  else if (mode === "dotted") line = <span style={{ width: 16, height: 0, borderTop: `2.5px dotted ${color}` }}/>;
  else if (mode === "bar") line = <span style={{ width: 12, height: 12, background: "rgba(44,130,201,0.2)", border: `2px solid ${color}`, borderRadius: 2 }}/>;
  return (
    <span className="row gap-4 text-xs" style={{ alignItems: "center", padding: "4px 8px", background: "var(--mc-surface-2)", border: "1px solid var(--mc-line)", borderRadius: 999, color: "var(--mc-text-2)", fontWeight: 600 }}>
      {line}
      {label}
    </span>
  );
}

function BHKpi({ label, value, sub, tone }) {
  const map = {
    blue:   { bg: "#eff6ff", border: "#bfdbfe", txt: "#1e40af", fg: "#2c82c9" },
    red:    { bg: "#fef2f2", border: "#fecaca", txt: "#991b1b", fg: "#dc2626" },
    orange: { bg: "linear-gradient(135deg, #FFF8EC, #FFF0DD)", border: "#FF9D00", txt: "#a85f00", fg: "#a85f00" },
    green:  { bg: "#f0fdf4", border: "#bbf7d0", txt: "#166534", fg: "#22a261" },
  };
  const c = map[tone] || map.blue;
  return (
    <div style={{ padding: "10px 12px", background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 10, minHeight: 70 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: c.txt, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
        {tone === "orange" && <IABadge/>}
      </div>
      <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 800, color: c.fg, lineHeight: 1.1, marginTop: 2 }}>{value}</div>
      <div style={{ fontSize: 11, color: c.txt, opacity: 0.8, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function AguaUlt30Dias() {
  const events = [
    { tipo: "Riego Variable (IA)", fecha: "Ayer, 04:00 AM", icon: "droplet", color: "#3aa6d9", val: "+12 mm", status: "ejecutado", iaIcon: true },
    { tipo: "Lluvia Fuerte", fecha: "Jueves 21, PM", icon: "droplet", color: "#3aa6d9", val: "+45 mm", status: "Reporte Manual" },
    { tipo: "Fertirriego", fecha: "Lunes 18", icon: "leaf", color: "#4f9d52", val: "+10 mm", status: "Aplicación Urea" },
    { tipo: "Llovizna", fecha: "Sábado 16", icon: "droplet", color: "#3aa6d9", val: "+5 mm", status: "" },
    { tipo: "Riego IA", fecha: "Miércoles 13", icon: "droplet", color: "#3aa6d9", val: "+15 mm", status: "", iaIcon: true },
  ];

  return (
    <div className="mc-card" style={{ padding: 20 }}>
      {/* Header with total */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div className="mc-card__eyebrow">Agua Últ. 30 Días</div>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 42, color: "var(--mc-blue)", fontWeight: 800, lineHeight: 1, marginTop: 4 }}>112 mm</div>
          <div className="row gap-12 mt-6 text-xs">
            <span className="row gap-4" style={{ color: "var(--mc-blue)" }}><Icon name="droplet" size={11}/>Lluvia: 80mm</span>
            <span className="row gap-4" style={{ color: "var(--mc-green-700)" }}><Icon name="droplet" size={11}/>Riego: 32mm</span>
          </div>
        </div>
        <div style={{ padding: "8px 12px", background: "var(--mc-blue-bg)", borderRadius: 10, textAlign: "right" }}>
          <div className="text-xs text-muted">vs prom. histórico</div>
          <div className="font-semi" style={{ color: "var(--mc-blue)", fontSize: 14 }}>98 mm</div>
          <div className="text-xs" style={{ color: "var(--mc-green-700)", fontWeight: 600 }}>+14%</div>
        </div>
      </div>

      <div className="mc-divider"></div>

      <div style={{ position: "relative", marginTop: 14 }}>
        <div style={{ position: "absolute", left: 14, top: 8, bottom: 8, width: 2, background: "var(--mc-line)" }}></div>
        {events.map((e, i) => (
          <div key={i} className="row gap-12" style={{ alignItems: "flex-start", paddingBottom: i < events.length - 1 ? 16 : 0, position: "relative" }}>
            {/* Timeline dot */}
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: e.color, color: "white", display: "grid", placeItems: "center", border: "3px solid var(--mc-surface)", flexShrink: 0, zIndex: 1 }}>
              <Icon name={e.icon} size={13}/>
            </div>
            {/* Text — clearly to the right of the icon */}
            <div className="row" style={{ flex: 1, justifyContent: "space-between", alignItems: "flex-start", gap: 8, paddingTop: 2 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row gap-4" style={{ alignItems: "center" }}>
                  <span className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{e.tipo}</span>
                  {e.iaIcon && <IABadge/>}
                </div>
                <div className="text-xs text-muted">{e.fecha}</div>
                {e.status && (
                  <div className="text-xs mt-2" style={{ color: e.status === "ejecutado" ? "var(--mc-green-700)" : "var(--mc-text-3)", fontWeight: 500 }}>
                    {e.status === "ejecutado" ? "✓ Ejecutado" : e.status}
                  </div>
                )}
              </div>
              <span className="mc-badge mc-badge--blue" style={{ fontSize: 11, flexShrink: 0 }}>{e.val}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Calculadora, Clima, PlanRiego });
