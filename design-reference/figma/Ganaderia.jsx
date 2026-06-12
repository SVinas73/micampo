// Ganaderia.jsx - Animales + Movimiento de Tropas

function Animales() {
  const { useState } = React;
  const [tab, setTab] = useState("Resumen");
  const tabs = ["Resumen","Ganado","Peso","Nutrición","Reproducción","Sanidad","Timeline"];
  return (
    <div className="col gap-20">
      <PageHeader
        crumbs={["Ganadería","Animales"]}
        title="Animales"
        subtitle="1,284 cabezas · 4 tropas · trazabilidad SENASA al día."
        actions={
          <>
            <button className="mc-btn mc-btn--secondary"><Icon name="download" size={14}/>Exportar</button>
            <button className="mc-btn mc-btn--primary"><Icon name="plus" size={14}/>Nuevo animal</button>
          </>
        }
      />
      <Tabs tabs={tabs} active={tab} onChange={setTab} warnTabs={["Sanidad"]} />
      {tab === "Resumen" && <AnimResumen/>}
      {tab === "Ganado" && <AnimGanado/>}
      {tab === "Peso" && <AnimPeso/>}
      {tab === "Nutrición" && <AnimNutricion/>}
      {tab === "Reproducción" && <AnimRepro/>}
      {tab === "Sanidad" && <AnimSanidad/>}
      {tab === "Timeline" && <AnimTimeline/>}
    </div>
  );
}

function AnimResumen() {
  return (
    <>
      <div className="grid g-cols-4">
        <KPI label="Cabezas totales" value="1,284" delta="+24 últimos 30d" trend="up" icon="cow" accent/>
        <KPI label="Peso promedio" value="412 kg" delta="+8 kg vs mes ant." trend="up" icon="scale"/>
        <KPI label="Preñez general" value="78%" delta="Tacto parcial" trend="up" icon="heart"/>
        <KPI label="Sanidad pendiente" value="32" delta="Vacunación aftosa" trend="warn" icon="syringe" warn/>
      </div>

      <div className="grid g-cols-3" style={{ gridTemplateColumns: "1.5fr 1fr", gap: 14 }}>
        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__title">Composición del rodeo</div>
            <div className="mc-seg"><button className="is-on">Por categoría</button><button>Por tropa</button></div>
          </div>
          <div className="grid g-cols-3 gap-16">
            {[
              { cat: "Vacas", n: 412, pct: 32, color: "var(--mc-green-600)" },
              { cat: "Vaquillonas", n: 186, pct: 14, color: "var(--mc-green-500)" },
              { cat: "Novillos", n: 325, pct: 25, color: "var(--mc-orange-500)" },
              { cat: "Terneros", n: 284, pct: 22, color: "var(--mc-amber)" },
              { cat: "Toros", n: 32, pct: 3, color: "var(--mc-green-800)" },
              { cat: "Rechazo", n: 45, pct: 4, color: "var(--mc-text-3)" },
            ].map(c => (
              <div key={c.cat} style={{ padding: 12, border: "1px solid var(--mc-line)", borderRadius: 10 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <div className="text-xs text-muted">{c.cat}</div>
                    <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, color: "var(--mc-ink)", lineHeight: 1, marginTop: 4 }}>{c.n}</div>
                  </div>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: c.color + "22", color: c.color, display: "grid", placeItems: "center" }}><Icon name="cow" size={16}/></div>
                </div>
                <div className="mc-prog mt-8"><div className="mc-prog__bar" style={{ width: `${c.pct * 3}%`, background: c.color }}></div></div>
                <div className="text-xs text-muted mt-4">{c.pct}% del rodeo</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mc-card">
          <div className="mc-card__head"><div className="mc-card__title">Tropas activas</div></div>
          <div className="col gap-8">
            {[
              { tropa: "Tropa A", cat: "Cría", n: 412, ubi: "Potrero 3 – La Esperanza", color: "var(--mc-green-600)" },
              { tropa: "Tropa B", cat: "Engorde", n: 325, ubi: "Potrero 7 – Don Ramón", color: "var(--mc-orange-600)" },
              { tropa: "Tropa C", cat: "Destete", n: 284, ubi: "Potrero 2 – La Esperanza", color: "var(--mc-amber)" },
              { tropa: "Tropa D", cat: "Toros", n: 32, ubi: "Potrero 1 – Don Ramón", color: "var(--mc-green-800)" },
            ].map(t => (
              <div key={t.tropa} style={{ padding: 12, border: "1px solid var(--mc-line)", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: t.color + "22", color: t.color, display: "grid", placeItems: "center", fontFamily: "var(--ff-display)", fontSize: 20 }}>
                  {t.tropa.slice(-1)}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="font-semi" style={{ color: "var(--mc-ink)" }}>{t.tropa} · <span className="text-muted" style={{ fontWeight: 400 }}>{t.cat}</span></div>
                  <div className="text-xs text-muted">{t.ubi}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="font-semi font-mono" style={{ color: "var(--mc-ink)" }}>{t.n}</div>
                  <div className="text-xs text-muted">cabezas</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid g-cols-2 gap-16">
        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__title">Evolución del rodeo (12 meses)</div>
            <span className="mc-badge mc-badge--green">+3.2%</span>
          </div>
          <div style={{ height: 180, position: "relative" }}>
            <svg viewBox="0 0 400 180" width="100%" height="100%" preserveAspectRatio="none">
              <defs><linearGradient id="rodeoGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#0a5a24" stopOpacity="0.25"/><stop offset="1" stopColor="#0a5a24" stopOpacity="0"/></linearGradient></defs>
              {[30,60,90,120,150].map(y => <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#e6e8e4"/>)}
              <path d="M0,120 L50,115 L100,108 L150,100 L200,95 L250,88 L300,75 L350,68 L400,60 L400,180 L0,180 Z" fill="url(#rodeoGrad)"/>
              <path d="M0,120 L50,115 L100,108 L150,100 L200,95 L250,88 L300,75 L350,68 L400,60" fill="none" stroke="#0a5a24" strokeWidth="2.5"/>
              {[0,50,100,150,200,250,300,350,400].map((x,i) => (
                <circle key={i} cx={x} cy={[120,115,108,100,95,88,75,68,60][i]} r="3.5" fill="white" stroke="#0a5a24" strokeWidth="2"/>
              ))}
            </svg>
          </div>
          <div className="row" style={{ justifyContent: "space-between", fontSize: 10, color: "var(--mc-text-3)", fontFamily: "var(--ff-mono)" }}>
            {["May","Jun","Jul","Ago","Sep","Oct","Nov","Dic","Ene","Feb","Mar","Abr"].map(m => <span key={m}>{m}</span>)}
          </div>
        </div>

        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__title">Próximos eventos sanitarios</div>
            <button className="mc-btn mc-btn--ghost mc-btn--sm">Ver todos</button>
          </div>
          <div className="mc-feed">
            <FeedRow ic="syringe" tone="red" title="Vacunación aftosa 2ª dosis" meta="Tropa A · 148 animales" time="Hoy"/>
            <FeedRow ic="heart" tone="orange" title="Tacto preñez" meta="Tropa A · 186 vaquillonas" time="25 abr"/>
            <FeedRow ic="scale" tone="" title="Pesada mensual" meta="Todo el rodeo" time="30 abr"/>
            <FeedRow ic="syringe" tone="blue" title="Desparasitación" meta="Tropa C · terneros" time="03 may"/>
          </div>
        </div>
      </div>
    </>
  );
}

function AnimGanado() {
  return (
    <>
      <div className="row gap-8" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <div className="row gap-8">
          <div className="mc-seg">
            <button className="is-on">Tabla</button>
            <button>Tarjetas</button>
          </div>
          <div className="mc-seg">
            <button className="is-on">Todos</button>
            <button>Tropa A</button>
            <button>Tropa B</button>
            <button>Tropa C</button>
          </div>
        </div>
        <div className="row gap-8">
          <button className="mc-btn mc-btn--secondary mc-btn--sm"><Icon name="filter" size={13}/>Filtros</button>
          <button className="mc-btn mc-btn--secondary mc-btn--sm"><Icon name="download" size={13}/>Exportar</button>
          <button className="mc-btn mc-btn--primary mc-btn--sm"><Icon name="plus" size={13}/>Agregar</button>
        </div>
      </div>

      <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="mc-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}><input type="checkbox"/></th>
              <th>ID SENASA</th>
              <th>Caravana</th>
              <th>Categoría</th>
              <th>Raza</th>
              <th>Sexo</th>
              <th>Edad</th>
              <th className="mc-cell--num">Peso</th>
              <th>Estado</th>
              <th>Tropa</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {DATA.animales.map((a, i) => (
              <tr key={i}>
                <td><input type="checkbox"/></td>
                <td className="mc-cell--mono">{a.id}</td>
                <td>
                  <div className="row gap-8">
                    <div className="mc-animal-card__avatar" style={{ width: 28, height: 28, fontSize: 11, borderRadius: 8 }}>{a.caravana}</div>
                  </div>
                </td>
                <td className="mc-cell--emph">{a.categoria}</td>
                <td>{a.raza}</td>
                <td>{a.sexo}</td>
                <td>{a.edad}</td>
                <td className="mc-cell--num">{a.peso}</td>
                <td>
                  <span className={`mc-badge mc-badge--${
                    a.estado === "Preñada" || a.estado === "Saludable" || a.estado === "Listo venta" ? "green"
                    : a.estado === "En tratamiento" ? "red"
                    : a.estado === "Servicio" ? "blue"
                    : "amber"
                  }`}><span className="mc-badge__dot"></span>{a.estado}</span>
                </td>
                <td>{a.lote}</td>
                <td><button className="mc-icon-btn" style={{ width: 26, height: 26, border: "none" }}><Icon name="more" size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)" }} className="row">
          <div className="text-xs text-muted">Mostrando 7 de 1,284</div>
          <div style={{ flex: 1 }}></div>
          <div className="mc-seg">
            <button>&lt;</button>
            <button className="is-on">1</button><button>2</button><button>3</button>...<button>183</button>
            <button>&gt;</button>
          </div>
        </div>
      </div>
    </>
  );
}

function AnimPeso() {
  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <div className="mc-card">
        <div className="mc-card__head"><div className="mc-card__title">Evolución de peso por tropa</div></div>
        <div style={{ height: 240, position: "relative" }}>
          <svg viewBox="0 0 400 220" width="100%" height="100%" preserveAspectRatio="none">
            {[30,80,130,180].map(y => <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#e6e8e4"/>)}
            <path d="M0,160 C60,155 120,140 180,130 C240,120 300,105 400,85" fill="none" stroke="#00A738" strokeWidth="3"/>
            <path d="M0,140 C60,135 120,130 180,120 C240,110 300,95 400,70" fill="none" stroke="#D45812" strokeWidth="3"/>
            <path d="M0,180 C60,170 120,160 180,150 C240,140 300,125 400,110" fill="none" stroke="#c48410" strokeWidth="3"/>
          </svg>
          <div className="row gap-16" style={{ position: "absolute", top: 8, left: 8 }}>
            <div className="row gap-4 text-xs"><span style={{ width: 10, height: 3, background: "var(--mc-green-600)", borderRadius: 2 }}></span>Tropa A</div>
            <div className="row gap-4 text-xs"><span style={{ width: 10, height: 3, background: "var(--mc-orange-600)", borderRadius: 2 }}></span>Tropa B</div>
            <div className="row gap-4 text-xs"><span style={{ width: 10, height: 3, background: "var(--mc-amber)", borderRadius: 2 }}></span>Tropa C</div>
          </div>
        </div>
        <div className="grid g-cols-3 gap-8 mt-8">
          {[{t:"Tropa A",v:"468 kg",d:"+12"},{t:"Tropa B",v:"510 kg",d:"+18"},{t:"Tropa C",v:"145 kg",d:"+24"}].map(r => (
            <div key={r.t} style={{ padding: 10, background: "var(--mc-surface-2)", borderRadius: 8 }}>
              <div className="text-xs text-muted">{r.t}</div>
              <div className="font-semi" style={{ fontSize: 16, color: "var(--mc-ink)" }}>{r.v}</div>
              <div className="text-xs" style={{ color: "var(--mc-green-700)" }}>+{r.d} kg últ. mes</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mc-card">
        <div className="mc-card__head">
          <div className="mc-card__title">Registrar pesada</div>
          <span className="mc-badge mc-badge--blue"><Icon name="activity" size={10}/>Báscula conectada</span>
        </div>
        <div className="col gap-12">
          <div className="mc-field"><label className="mc-label">Método</label>
            <div className="mc-seg"><button className="is-on">Individual</button><button>Grupal</button><button>Báscula auto</button></div>
          </div>
          <div className="grid g-cols-2 gap-12">
            <div className="mc-field"><label className="mc-label">Caravana / ID</label><input className="mc-input" placeholder="Ej: 0124"/></div>
            <div className="mc-field"><label className="mc-label">Peso (kg)</label><input className="mc-input" placeholder="0"/></div>
          </div>
          <div className="grid g-cols-2 gap-12">
            <div className="mc-field"><label className="mc-label">Fecha</label><input className="mc-input" type="date" defaultValue="2026-04-18"/></div>
            <div className="mc-field"><label className="mc-label">Condición corporal</label>
              <div className="row gap-4">{[1,2,3,4,5].map(n => <button key={n} style={{ flex:1, padding: "8px 4px", border: "1px solid var(--mc-line-2)", borderRadius: 6, background: n === 3 ? "var(--mc-green-600)" : "var(--mc-surface)", color: n === 3 ? "white" : "var(--mc-text-2)", fontSize: 12, fontWeight: 600 }}>{n}</button>)}</div>
            </div>
          </div>
          <div className="mc-field"><label className="mc-label">Observaciones</label><textarea className="mc-textarea" placeholder="Ej: animal con buen desarrollo"/></div>
          <div className="row gap-8 mt-4">
            <button className="mc-btn mc-btn--ghost">Cancelar</button>
            <div style={{ flex: 1 }}></div>
            <button className="mc-btn mc-btn--primary">Guardar pesada</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimNutricion() {
  return (
    <div className="col gap-16">
      <div className="grid g-cols-4 gap-16">
        <KPI label="Raciones activas" value="6" delta="4 tropas alimentadas" trend="up" icon="leaf" accent/>
        <KPI label="Consumo diario" value="12.4 t MS" delta="Pradera + silaje" trend="up" icon="truck"/>
        <KPI label="Costo alimentación / día" value="$184,500" delta="$144/cabeza" trend="up" icon="dollar"/>
        <KPI label="GDP promedio" value="0.92 kg/d" delta="+0.08 vs mes pasado" trend="up" icon="arrowUp"/>
      </div>

      <div className="grid g-cols-2 gap-16">
        <div className="mc-card">
          <div className="mc-card__head"><div className="mc-card__title">Raciones por tropa</div><button className="mc-btn mc-btn--primary mc-btn--sm"><Icon name="plus" size={13}/>Nueva ración</button></div>
          <div className="col gap-8">
            {[
              { tropa: "Tropa A · Cría", ing: "Pastura + suplemento", kg: "10.5 kg MS/cab", costo: "$132/cab" },
              { tropa: "Tropa B · Engorde", ing: "Silaje maíz + grano", kg: "14.2 kg MS/cab", costo: "$198/cab" },
              { tropa: "Tropa C · Destete", ing: "Pastura + núcleo proteico", kg: "6.8 kg MS/cab", costo: "$95/cab" },
              { tropa: "Tropa D · Toros", ing: "Pastura + heno", kg: "12.0 kg MS/cab", costo: "$156/cab" },
            ].map((r, i) => (
              <div key={i} style={{ padding: 14, border: "1px solid var(--mc-line)", borderRadius: 10 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div className="font-semi" style={{ color: "var(--mc-ink)" }}>{r.tropa}</div>
                  <span className="mc-badge mc-badge--green"><span className="mc-badge__dot"></span>Activa</span>
                </div>
                <div className="text-sm text-muted mt-4">{r.ing}</div>
                <div className="row gap-16 mt-8 text-xs">
                  <span className="font-mono"><span className="text-muted">Consumo: </span>{r.kg}</span>
                  <span className="font-mono"><span className="text-muted">Costo: </span>{r.costo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mc-card">
          <div className="mc-card__head"><div className="mc-card__title">Stock de insumos</div></div>
          <div className="col gap-8">
            {[
              { insumo: "Silaje de maíz", stock: 78, max: 120, unidad: "tn" },
              { insumo: "Grano maíz", stock: 22, max: 40, unidad: "tn" },
              { insumo: "Núcleo proteico", stock: 4.2, max: 10, unidad: "tn" },
              { insumo: "Sal mineralizada", stock: 1.1, max: 3, unidad: "tn" },
              { insumo: "Heno alfalfa", stock: 15, max: 40, unidad: "rollos" },
            ].map((s, i) => {
              const pct = (s.stock / s.max) * 100;
              const low = pct < 30;
              return (
                <div key={i}>
                  <div className="row" style={{ justifyContent: "space-between", fontSize: 13 }}>
                    <span className="font-semi" style={{ color: "var(--mc-ink)" }}>{s.insumo}</span>
                    <span className="font-mono text-muted">{s.stock} / {s.max} {s.unidad}</span>
                  </div>
                  <div className="mc-prog mt-4"><div className={`mc-prog__bar ${low ? "mc-prog__bar--red" : pct < 50 ? "mc-prog__bar--orange" : ""}`} style={{ width: `${pct}%` }}></div></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimRepro() {
  return (
    <div className="col gap-16">
      <div className="grid g-cols-5 gap-16">
        <KPI label="Vientres servicio" value="412" delta="Tropa A + Vaquillonas" trend="up" icon="heart" accent/>
        <KPI label="Preñez confirmada" value="78%" delta="Tacto 60 días" trend="up" icon="check"/>
        <KPI label="Partos últimos 30d" value="42" delta="2 distócicos" trend="up" icon="cow"/>
        <KPI label="Terneros vivos" value="284" delta="Mortalidad 2.1%" trend="up" icon="egg"/>
        <KPI label="Días al parto (prom.)" value="45 días" delta="Pico calving oct/nov" trend="warn" icon="calendar"/>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="mc-card">
          <div className="mc-card__head"><div className="mc-card__title">Calendario reproductivo</div></div>
          <div className="col gap-12">
            {[
              { etapa: "Servicio", periodo: "Dic 2025 – Mar 2026", estado: "Completado", pct: 100, color: "var(--mc-green-500)" },
              { etapa: "Tacto rectal", periodo: "Abr – May 2026", estado: "En curso", pct: 62, color: "var(--mc-orange-500)" },
              { etapa: "Parición", periodo: "Sep – Dic 2026", estado: "Pendiente", pct: 0, color: "var(--mc-text-3)" },
              { etapa: "Destete", periodo: "Mar – Abr 2027", estado: "Pendiente", pct: 0, color: "var(--mc-text-3)" },
            ].map((e, i) => (
              <div key={i} style={{ padding: 12, border: "1px solid var(--mc-line)", borderRadius: 10 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <div className="font-semi" style={{ color: "var(--mc-ink)" }}>{e.etapa}</div>
                    <div className="text-xs text-muted">{e.periodo}</div>
                  </div>
                  <span className={`mc-badge mc-badge--${e.estado === "Completado" ? "green" : e.estado === "En curso" ? "orange" : "neutral"}`}>{e.estado}</span>
                </div>
                <div className="mc-prog mt-8"><div className="mc-prog__bar" style={{ width: `${e.pct}%`, background: e.color }}></div></div>
              </div>
            ))}
          </div>
        </div>

        <div className="mc-card">
          <div className="mc-card__head"><div className="mc-card__title">Registro rápido de eventos</div></div>
          <div className="grid g-cols-2 gap-8">
            {[
              { ev: "Celo", ic: "heart", color: "var(--mc-red)" },
              { ev: "Servicio", ic: "heart", color: "var(--mc-green-600)" },
              { ev: "Tacto", ic: "eye", color: "var(--mc-orange-600)" },
              { ev: "Parto", ic: "cow", color: "var(--mc-green-700)" },
              { ev: "Aborto", ic: "alert", color: "var(--mc-red)" },
              { ev: "Destete", ic: "egg", color: "var(--mc-amber)" },
            ].map(e => (
              <button key={e.ev} className="mc-card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", border: "1px solid var(--mc-line)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: e.color + "22", color: e.color, display: "grid", placeItems: "center" }}><Icon name={e.ic} size={16}/></div>
                <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{e.ev}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimSanidad() {
  return (
    <div className="col gap-16">
      <div className="grid g-cols-4">
        <KPI label="Pendientes" value="32" delta="Vacuna aftosa + desparasit." trend="warn" icon="syringe" warn/>
        <KPI label="Aplicadas últ. 30d" value="248" delta="Cobertura 91%" trend="up" icon="check" accent/>
        <KPI label="En tratamiento" value="4" delta="3 Tropa A · 1 Tropa B" trend="warn" icon="heart"/>
        <KPI label="Mortalidad anual" value="1.8%" delta="Por debajo del objetivo" trend="up" icon="activity"/>
      </div>

      <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between" }}>
          <div className="mc-card__title">Plan sanitario</div>
          <div className="row gap-8">
            <button className="mc-btn mc-btn--secondary mc-btn--sm"><Icon name="calendar" size={13}/>Ver calendario</button>
            <button className="mc-btn mc-btn--primary mc-btn--sm"><Icon name="plus" size={13}/>Nueva aplicación</button>
          </div>
        </div>
        <table className="mc-table">
          <thead><tr><th>Evento</th><th>Producto</th><th>Categoría</th><th>Dosis</th><th>Próxima fecha</th><th>Animales</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {[
              { ev: "Vacuna aftosa", prod: "Bioaftogen", cat: "Todo el rodeo", dosis: "5 ml SC", fecha: "18/04/2026", n: "148", estado: "Hoy", tone: "red" },
              { ev: "Desparasitación", prod: "Ivermectina 3.15%", cat: "Terneros", dosis: "1ml/50kg", fecha: "03/05/2026", n: "284", estado: "Programada", tone: "amber" },
              { ev: "Vacuna reproductiva", prod: "Reprogen", cat: "Vacas + vaquillonas", dosis: "2 ml SC", fecha: "15/05/2026", n: "598", estado: "Programada", tone: "amber" },
              { ev: "Anti-clostridial", prod: "Bioclostrigen", cat: "Terneros destetados", dosis: "5 ml SC", fecha: "02/04/2026", n: "284", estado: "Completada", tone: "green" },
              { ev: "Mineralización", prod: "Selenio + Yodo", cat: "Vaquillonas", dosis: "2 ml IM", fecha: "28/03/2026", n: "186", estado: "Completada", tone: "green" },
            ].map((r, i) => (
              <tr key={i}>
                <td className="mc-cell--emph">{r.ev}</td>
                <td>{r.prod}</td>
                <td>{r.cat}</td>
                <td className="mc-cell--mono">{r.dosis}</td>
                <td className="mc-cell--mono">{r.fecha}</td>
                <td className="mc-cell--num">{r.n}</td>
                <td><span className={`mc-badge mc-badge--${r.tone}`}><span className="mc-badge__dot"></span>{r.estado}</span></td>
                <td><button className="mc-icon-btn" style={{ width: 26, height: 26, border: "none" }}><Icon name="more" size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnimTimeline() {
  const events = [
    { fecha: "18/04/2026", hora: "09:30", tipo: "Sanidad", titulo: "Vacunación aftosa aplicada", meta: "Tropa A · 148 animales · Dr. M. López", tone: "green" },
    { fecha: "15/04/2026", hora: "14:00", tipo: "Peso", titulo: "Pesada mensual Tropa B", meta: "325 animales · peso prom. 510 kg (+18)", tone: "" },
    { fecha: "12/04/2026", hora: "08:00", tipo: "Nutrición", titulo: "Cambio de ración Tropa C", meta: "De suplemento a grano maíz + núcleo", tone: "amber" },
    { fecha: "10/04/2026", hora: "11:15", tipo: "Reproducción", titulo: "Tacto parcial Tropa A", meta: "72% preñez en 104 vientres evaluados", tone: "" },
    { fecha: "08/04/2026", hora: "—", tipo: "Movimiento", titulo: "Tropa B reubicada a Potrero 7", meta: "325 animales · Don Ramón", tone: "blue" },
    { fecha: "05/04/2026", hora: "09:00", tipo: "Sanidad", titulo: "Tratamiento antibiótico", meta: "3 animales · Tropa A · neumonía leve", tone: "red" },
    { fecha: "02/04/2026", hora: "07:45", tipo: "Parto", titulo: "Parto normal", meta: "Vaca 0088 · ternero macho 38 kg", tone: "green" },
    { fecha: "28/03/2026", hora: "—", tipo: "Ingreso", titulo: "Ingreso de 24 vaquillonas", meta: "Compra Remate Liniers", tone: "" },
  ];
  return (
    <div className="mc-card">
      <div className="mc-card__head">
        <div className="mc-card__title">Línea de tiempo del rodeo</div>
        <div className="mc-seg"><button className="is-on">Todo</button><button>Sanidad</button><button>Repro</button><button>Peso</button><button>Movs</button></div>
      </div>
      <div className="mc-timeline">
        {events.map((e, i) => (
          <div key={i} className="mc-tl-item" style={{ gridTemplateColumns: "24px 1fr auto auto", gap: 14 }}>
            <span className={`mc-tl-item__dot mc-tl-item__dot--${e.tone === 'blue' ? 'blue' : e.tone === 'red' ? 'red' : e.tone === 'amber' ? 'warn' : ''}`}></span>
            <div>
              <div className="mc-tl-item__label">{e.titulo}</div>
              <div className="mc-tl-item__meta">{e.tipo} · {e.meta}</div>
            </div>
            <span className="mc-badge mc-badge--neutral">{e.tipo}</span>
            <div className="mc-tl-item__time">{e.fecha} {e.hora}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ MOVIMIENTO DE TROPAS ============ */
function MovTropas() {
  const { useState } = React;
  const [tab, setTab] = useState("Resumen");
  const tabs = ["Resumen","Gestión"];
  return (
    <div className="col gap-20">
      <PageHeader
        crumbs={["Ganadería","Mov. de Tropas"]}
        title="Movimiento de Tropas"
        subtitle="Trazabilidad de traslados entre establecimientos y potreros, documentación SENASA."
        actions={
          <>
            <button className="mc-btn mc-btn--secondary"><Icon name="download" size={14}/>DT-e</button>
            <button className="mc-btn mc-btn--primary"><Icon name="plus" size={14}/>Nuevo movimiento</button>
          </>
        }
      />
      <Tabs tabs={tabs} active={tab} onChange={setTab}/>
      {tab === "Resumen" && <MovResumen/>}
      {tab === "Gestión" && <MovGestion/>}
    </div>
  );
}

function MovResumen() {
  return (
    <>
      <div className="grid g-cols-4">
        <KPI label="Movs. este mes" value="12" delta="+3 vs mes pasado" trend="up" icon="route" accent/>
        <KPI label="Cabezas movidas" value="648" delta="5 destinos" trend="up" icon="truck"/>
        <KPI label="DT-e emitidos" value="11" delta="1 pendiente firma" trend="warn" icon="edit"/>
        <KPI label="Km recorridos" value="1,240" delta="Transporte propio" trend="up" icon="map"/>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__title">Mapa de movimientos</div>
            <div className="mc-seg"><button className="is-on">Último mes</button><button>Trimestre</button><button>Año</button></div>
          </div>
          <div className="mc-map" style={{ minHeight: 360 }}>
            <div className="mc-map__grid"></div>
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 600 360" preserveAspectRatio="none">
              {/* Nodos */}
              <g>
                <circle cx="140" cy="120" r="22" fill="var(--mc-green-600)" stroke="white" strokeWidth="3"/>
                <text x="140" y="125" textAnchor="middle" fontSize="11" fill="white" fontWeight="600">D.R.</text>
                <text x="140" y="155" textAnchor="middle" fontSize="10" fill="#0a3d1a">Don Ramón</text>

                <circle cx="430" cy="90" r="22" fill="var(--mc-orange-600)" stroke="white" strokeWidth="3"/>
                <text x="430" y="95" textAnchor="middle" fontSize="11" fill="white" fontWeight="600">L.E.</text>
                <text x="430" y="125" textAnchor="middle" fontSize="10" fill="#0a3d1a">La Esperanza</text>

                <circle cx="320" cy="250" r="18" fill="var(--mc-amber)" stroke="white" strokeWidth="3"/>
                <text x="320" y="254" textAnchor="middle" fontSize="10" fill="white" fontWeight="600">LF</text>
                <text x="320" y="280" textAnchor="middle" fontSize="10" fill="#0a3d1a">Liniers</text>

                <circle cx="510" cy="280" r="16" fill="var(--mc-blue)" stroke="white" strokeWidth="3"/>
                <text x="510" y="284" textAnchor="middle" fontSize="10" fill="white" fontWeight="600">FR</text>
                <text x="510" y="308" textAnchor="middle" fontSize="10" fill="#0a3d1a">Frigorífico</text>
              </g>
              {/* Flechas */}
              <defs>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L9,3 z" fill="var(--mc-orange-600)"/>
                </marker>
              </defs>
              <path d="M160,120 Q280,60 410,90" stroke="var(--mc-orange-600)" strokeWidth="2.5" fill="none" strokeDasharray="5,4" markerEnd="url(#arrow)"/>
              <path d="M145,140 Q200,220 305,245" stroke="var(--mc-orange-600)" strokeWidth="2.5" fill="none" strokeDasharray="5,4" markerEnd="url(#arrow)"/>
              <path d="M430,110 Q490,200 508,265" stroke="var(--mc-orange-600)" strokeWidth="2.5" fill="none" strokeDasharray="5,4" markerEnd="url(#arrow)"/>
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
            {[
              { titulo: "148 animales · Don Ramón → La Esperanza", fecha: "15/04 · 07:30", tipo: "Interno", tone: "green" },
              { titulo: "42 novillos · Don Ramón → Frigorífico Rosario", fecha: "10/04 · 05:00", tipo: "Venta", tone: "blue" },
              { titulo: "24 vaquillonas · Liniers → Don Ramón", fecha: "28/03 · 11:00", tipo: "Compra", tone: "orange" },
              { titulo: "180 terneros · La Esperanza → Don Ramón", fecha: "12/03 · 08:00", tipo: "Destete", tone: "amber" },
            ].map((m, i) => (
              <div key={i} style={{ padding: 12, border: "1px solid var(--mc-line)", borderRadius: 10 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{m.titulo}</div>
                  <span className={`mc-badge mc-badge--${m.tone}`}>{m.tipo}</span>
                </div>
                <div className="text-xs text-muted mt-4"><Icon name="clock" size={10}/> {m.fecha}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function MovGestion() {
  return (
    <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between" }}>
        <div className="mc-card__title">Gestión de movimientos</div>
        <div className="row gap-8">
          <button className="mc-btn mc-btn--secondary mc-btn--sm"><Icon name="filter" size={13}/>Filtros</button>
          <button className="mc-btn mc-btn--primary mc-btn--sm"><Icon name="plus" size={13}/>Nuevo movimiento</button>
        </div>
      </div>
      <table className="mc-table">
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Origen</th><th>Destino</th><th className="mc-cell--num">Cab.</th><th>DT-e</th><th>Estado</th><th>Responsable</th><th></th></tr></thead>
        <tbody>
          {[
            { f: "15/04/2026", t: "Interno", o: "Don Ramón · Potrero 2", d: "La Esperanza · Potrero 3", n: 148, dte: "12045871", est: "Completado", tone: "green", r: "J. Rodríguez" },
            { f: "10/04/2026", t: "Venta", o: "Don Ramón · Corral encierre", d: "Frigorífico Rosario", n: 42, dte: "12042988", est: "Completado", tone: "green", r: "J. Rodríguez" },
            { f: "28/03/2026", t: "Compra", o: "Remate Liniers", d: "Don Ramón · Potrero 5", n: 24, dte: "12038114", est: "Completado", tone: "green", r: "C. Martínez" },
            { f: "12/03/2026", t: "Destete", o: "La Esperanza", d: "Don Ramón", n: 180, dte: "12030520", est: "Completado", tone: "green", r: "Equipo" },
            { f: "18/04/2026", t: "Venta", o: "Don Ramón", d: "Frigorífico Local", n: 28, dte: "—", est: "Pendiente DT-e", tone: "orange", r: "J. Rodríguez" },
          ].map((r, i) => (
            <tr key={i}>
              <td className="mc-cell--mono">{r.f}</td>
              <td><span className={`mc-badge mc-badge--${r.t === "Venta" ? "blue" : r.t === "Compra" ? "orange" : "neutral"}`}>{r.t}</span></td>
              <td>{r.o}</td>
              <td>{r.d}</td>
              <td className="mc-cell--num">{r.n}</td>
              <td className="mc-cell--mono">{r.dte}</td>
              <td><span className={`mc-badge mc-badge--${r.tone}`}><span className="mc-badge__dot"></span>{r.est}</span></td>
              <td>{r.r}</td>
              <td><button className="mc-icon-btn" style={{ width: 26, height: 26, border: "none" }}><Icon name="more" size={14}/></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

Object.assign(window, { Animales, MovTropas });
