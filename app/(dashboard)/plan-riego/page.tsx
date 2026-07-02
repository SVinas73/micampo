"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Icon, KPI, useToast, PageHeader } from "@/components/mc";
import BalanceHidrico, { type PuntoBalance, type SugerenciaIA } from "@/components/plan-riego/BalanceHidrico";
import AguaUlt30Dias from "@/components/plan-riego/AguaUlt30Dias";
import RegistrarRiegoModal, { type RegistroRiego } from "@/components/plan-riego/RegistrarRiegoModal";
import { useLoteScope } from "@/components/LoteScope";

/* ============================================================
   Plan de Riego — balance hídrico REAL.
   El balance se proyecta con datos reales: ET0 (evapotranspiración)
   y lluvia del pronóstico (Open-Meteo, /api/clima), partiendo de una
   humedad de suelo estimada por la lluvia reciente registrada. Los
   eventos de "Agua últ. 30 días" son reales (riegos + lluvias).
   La IA (optimización) se conectará después; hoy el modelo es
   determinístico y agronómico.
   ============================================================ */

type ClimaDia = { nombre: string; num: number; esHoy: boolean; et0: number; mm: number };

// Coeficiente de cultivo (Kc) por ETAPA fenológica (FAO-56, aprox.)
type Etapa = "Inicial" | "Desarrollo" | "Media" | "Final";
const ETAPAS: Etapa[] = ["Inicial", "Desarrollo", "Media", "Final"];
const KC_ETAPA: Record<string, Record<Etapa, number>> = {
  Maíz: { Inicial: 0.3, Desarrollo: 0.7, Media: 1.15, Final: 0.6 },
  Soja: { Inicial: 0.4, Desarrollo: 0.75, Media: 1.1, Final: 0.5 },
  Trigo: { Inicial: 0.3, Desarrollo: 0.7, Media: 1.05, Final: 0.4 },
  Girasol: { Inicial: 0.35, Desarrollo: 0.7, Media: 1.0, Final: 0.45 },
  Alfalfa: { Inicial: 0.4, Desarrollo: 0.9, Media: 1.2, Final: 1.1 },
  Sorgo: { Inicial: 0.3, Desarrollo: 0.7, Media: 1.05, Final: 0.55 },
  Cebada: { Inicial: 0.3, Desarrollo: 0.7, Media: 1.05, Final: 0.4 },
};
const KC_DEFAULT: Record<Etapa, number> = { Inicial: 0.35, Desarrollo: 0.7, Media: 1.05, Final: 0.5 };
function kcDe(cultivo: string, etapa: Etapa): number {
  return (KC_ETAPA[cultivo] || KC_DEFAULT)[etapa];
}
// Estima la etapa fenológica a partir de los días desde la siembra
function etapaPorDias(dias: number): Etapa {
  if (dias < 25) return "Inicial";
  if (dias < 55) return "Desarrollo";
  if (dias < 100) return "Media";
  return "Final";
}
const AWC_DEFAULT = 120; // mm de agua útil en el perfil (suelo franco ~1 m) por defecto
const COSTO_MM = 12; // USD/mm (energía + insumo)

// Agua útil del suelo (mm) estimada a partir de la materia orgánica del análisis del
// lote: más MO → más capacidad de retención. Sin análisis, usa el valor por defecto.
function awcDeMateriaOrganica(mo: number | null | undefined): number {
  if (mo == null || isNaN(mo)) return AWC_DEFAULT;
  return Math.round(Math.max(70, Math.min(190, 90 + mo * 15)));
}

export default function PlanRiegoPage() {
  return (
    <Suspense>
      <PlanRiegoInner />
    </Suspense>
  );
}

function PlanRiegoInner() {
  const toast = useToast();
  const [riegoOpen, setRiegoOpen] = useState(false);

  const [estrategia, setEstrategia] = useState(() => {
    if (typeof window === "undefined") return 70;
    const v = Number(window.localStorage.getItem("mc-riego-estrategia"));
    return Number.isFinite(v) && v > 0 ? v : 70;
  });
  const [planRiegoId, setPlanRiegoId] = useState<string | null>(null);
  const [loteId, setLoteId] = useState<string | null>(null);
  const [loteNombre, setLoteNombre] = useState<string>("tu campo");
  const [cultivo, setCultivo] = useState<string>("Maíz");
  const [etapa, setEtapa] = useState<Etapa>("Media");
  const [etapaAuto, setEtapaAuto] = useState<{ etapa: Etapa; dias: number } | null>(null);

  const [dias, setDias] = useState<ClimaDia[] | null>(null);
  const [s0, setS0] = useState(65); // humedad de suelo inicial estimada (%)
  const [awc, setAwc] = useState(AWC_DEFAULT); // agua útil del suelo (mm) por lote
  const [tieneCampo, setTieneCampo] = useState<boolean | null>(null); // null=cargando

  // Datos crudos para el card "Agua últ. N días" (filtrables por período)
  const [lluvias, setLluvias] = useState<{ t: number; mm: number; lugar: string }[]>([]);
  const [riegos, setRiegos] = useState<{ t: number; mm: number; estado: string; ia: boolean }[]>([]);
  const [histMm, setHistMm] = useState<number | null>(null);

  const { loteActivo, lotes: scopeLotes } = useLoteScope();

  // Lote objetivo: el activo del selector global, o el primero con coordenadas si "Todos"
  const loteObjetivo = useMemo(() => {
    if (loteActivo) return loteActivo;
    return scopeLotes.find((l) => l.centroLatitud && l.centroLongitud) || scopeLotes[0] || null;
  }, [loteActivo, scopeLotes]);

  // Lote activo + clima + histórico (se re-evalúa al cambiar el lote global)
  useEffect(() => {
    const lote = loteObjetivo;
    if (!lote) { setTieneCampo(scopeLotes.length === 0 ? false : null); return; }
    setLoteId(lote.id);
    setLoteNombre(lote.nombre || "tu campo");
    if (lote.cultivo) setCultivo(lote.cultivo);

    // Plan de riego de ESE lote (si existe)
    fetch("/api/planes-riego").then((r) => (r.ok ? r.json() : [])).then((d) => {
      const planes = Array.isArray(d) ? d : [];
      const plan = planes.find((p: { loteId?: string }) => p.loteId === lote.id) || null;
      setPlanRiegoId(plan?.id ?? null);
    }).catch(() => {});

    // Auto-detecta la etapa fenológica desde la última siembra del lote, y el agua útil
    // del suelo (AWC) desde su análisis de suelo (materia orgánica).
    setEtapaAuto(null);
    setAwc(AWC_DEFAULT);
    fetch(`/api/lotes/${lote.id}`).then((r) => (r.ok ? r.json() : null)).then((det) => {
      const siembra = det?.siembras?.[0];
      if (siembra?.fechaSiembra) {
        const d = Math.round((Date.now() - new Date(siembra.fechaSiembra).getTime()) / 86400000);
        if (d >= 0) { const e = etapaPorDias(d); setEtapa(e); setEtapaAuto({ etapa: e, dias: d }); }
      }
      const suelo = det?.analisisSuelo?.[0];
      if (suelo?.materiaOrganica != null) setAwc(awcDeMateriaOrganica(suelo.materiaOrganica));
    }).catch(() => {});

    // El balance hídrico requiere coordenadas (clima de ese punto)
    if (!lote.centroLatitud || !lote.centroLongitud) { setTieneCampo(false); return; }
    setTieneCampo(true);
    const q = `?lat=${lote.centroLatitud}&lon=${lote.centroLongitud}`;
    fetch(`/api/clima${q}`).then((r) => (r.ok ? r.json() : null)).then((c) => {
      if (Array.isArray(c?.dias)) setDias(c.dias.map((x: { nombre: string; num: number; esHoy: boolean; et0: number; mm: number }) => ({ nombre: x.nombre, num: x.num, esHoy: x.esHoy, et0: x.et0, mm: x.mm })));
    }).catch(() => {});
    fetch(`/api/clima/historico-lluvia${q}`).then((r) => (r.ok ? r.json() : null)).then((h) => { if (Array.isArray(h?.promedioMensual)) setHistMm(h.promedioMensual[new Date().getMonth()]); }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loteObjetivo?.id]);

  // Lluvia + riego reales. Si hay un lote activo, la lluvia y la humedad inicial se
  // toman de ESE lote (por eso el balance cambia entre lotes); si no, del establecimiento.
  const scopeIds = scopeLotes.map((l) => l.id).join(",");
  const filtroLluvia = loteActivo?.id ? `loteId=${loteActivo.id}` : `loteIds=${scopeIds}`;
  useEffect(() => {
    const hace30 = Date.now() - 30 * 86400000;
    fetch(`/api/registro-pluviometrico?dias=60&${filtroLluvia}`).then((r) => (r.ok ? r.json() : [])).then((d) => {
      if (!Array.isArray(d)) return;
      const recientes = d.filter((r: { fecha: string }) => new Date(r.fecha).getTime() >= hace30);
      setLluvias(recientes.map((r: { fecha: string; milimetros: number; lote?: { nombre: string } }) => ({ t: new Date(r.fecha).getTime(), mm: r.milimetros || 0, lugar: r.lote?.nombre || "" })));
      // humedad inicial estimada por lluvia de los últimos 7 días (sobre el AWC del lote)
      const hace7 = Date.now() - 7 * 86400000;
      const lluvia7 = recientes.filter((r: { fecha: string }) => new Date(r.fecha).getTime() >= hace7).reduce((s: number, r: { milimetros: number }) => s + (r.milimetros || 0), 0);
      setS0(Math.max(35, Math.min(92, Math.round(50 + (lluvia7 / awc) * 100))));
    }).catch(() => {});

    // Riegos del alcance (mismo filtro que la lluvia): "Agua últ. 30 días" por lote/campo.
    fetch(`/api/eventos-riego?${filtroLluvia}`).then((r) => (r.ok ? r.json() : [])).then((d) => {
      if (!Array.isArray(d)) return;
      setRiegos(d.map((e: { fechaProgramada: string; laminaAplicada?: number; estado?: string; observaciones?: string }) => ({ t: new Date(e.fechaProgramada).getTime(), mm: e.laminaAplicada || 0, estado: e.estado || "", ia: (e.observaciones || "").toLowerCase().includes("ia") })));
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroLluvia, awc]);

  // Cálculo determinístico del balance hídrico (real: ET0 + lluvia)
  const { balance, sugerencias, etcDia, proximo } = useMemo(() => {
    if (!dias || dias.length === 0) {
      return { balance: [] as PuntoBalance[], sugerencias: [] as SugerenciaIA[], etcDia: 0, proximo: null as SugerenciaIA | null };
    }
    const kc = kcDe(cultivo, etapa);
    const mmEvento = Math.round(10 + (estrategia / 100) * 12);
    const umbral = 40;
    let sSin = s0, sCon = s0;
    const bal: PuntoBalance[] = [];
    const sugs: SugerenciaIA[] = [];
    dias.forEach((d, i) => {
      const etc = (d.et0 || 4) * kc;
      const deltaPct = (((d.mm || 0) - etc) / awc) * 100;
      sSin = clamp(sSin + deltaPct, 0, 100);
      let cs = clamp(sCon + deltaPct, 0, 100);
      if (i > 0 && cs < umbral) {
        cs = clamp(cs + (mmEvento / awc) * 100, 0, 100);
        // La fecha real de la sugerencia = hoy + i días (los días del balance son consecutivos desde hoy).
        const fecha = new Date(); fecha.setDate(fecha.getDate() + i);
        sugs.push({ fecha: `${d.nombre} ${d.num}`, fechaISO: fecha.toISOString(), mm: mmEvento, motivo: `Humedad proyectada cae a ${Math.round(sSin)}% sin riego`, costoUSD: Math.round(mmEvento * COSTO_MM) });
      }
      sCon = cs;
      bal.push({ dia: `${d.esHoy ? "HOY" : d.nombre.toUpperCase()} ${d.num}`, sinRiego: Math.round(sSin), conRiego: Math.round(cs) });
    });
    const etc0 = Math.round((dias[0].et0 || 4) * kc * 10) / 10;
    return { balance: bal, sugerencias: sugs, etcDia: etc0, proximo: sugs[0] || null };
  }, [dias, estrategia, s0, cultivo, etapa, awc]);

  const costoEvento = sugerencias.reduce((s, x) => s + x.costoUSD, 0);
  const aguaUtilMm = Math.round((s0 / 100) * awc);

  // Asegura que el lote tenga un plan de riego (lo crea si no existe)
  const ensurePlan = useCallback(async (): Promise<string | null> => {
    if (planRiegoId) return planRiegoId;
    if (!loteId) return null;
    try {
      const res = await fetch("/api/planes-riego", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loteId, nombre: `Plan de riego · ${loteNombre}`, cultivo, etapaFenologica: "Media",
          tipoSuelo: "Franco", etcDiaria: etcDia || 4, frecuenciaRiego: 3,
          laminaRiego: Math.round(10 + (estrategia / 100) * 12), fechaInicio: new Date().toISOString(),
          costoMM: COSTO_MM, eficienciaRiego: 85, modoIA: true,
        }),
      });
      if (!res.ok) return null;
      const p = await res.json();
      setPlanRiegoId(p.id);
      return p.id;
    } catch { return null; }
  }, [planRiegoId, loteId, loteNombre, cultivo, etcDia, estrategia]);

  const postEvento = useCallback(async (mm: number, fechaISO: string, observaciones: string) => {
    const plan = await ensurePlan();
    if (!plan) return false;
    // Usa la fecha indicada (sugerencia IA o manual); si viene inválida, hoy.
    const cuando = fechaISO && !Number.isNaN(new Date(fechaISO).getTime()) ? new Date(fechaISO).toISOString() : new Date().toISOString();
    try {
      const res = await fetch("/api/eventos-riego", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planRiegoId: plan, fechaProgramada: cuando, laminaAplicada: mm, estado: "Programado", observaciones }) });
      return res.ok;
    } catch { return false; }
  }, [ensurePlan]);

  const aprobarOrden = useCallback(async () => {
    if (sugerencias.length === 0) { toast.show("No hay riego sugerido por ahora", "err"); return; }
    let ok = 0;
    for (const s of sugerencias) { if (await postEvento(s.mm, s.fechaISO || "", s.motivo)) ok++; }
    if (ok === 0) { toast.show("No se pudo guardar la orden de riego", "err"); return; }
    setRiegos((prev) => [...sugerencias.map((s) => ({ t: Date.now(), mm: s.mm, estado: "Programado", ia: false })), ...prev]);
    toast.show(`Orden de riego aprobada · ${ok} evento(s) programado(s)`);
  }, [sugerencias, postEvento, toast]);

  const registrar = useCallback(async (r: RegistroRiego) => {
    // IA: fecha ISO de la sugerencia. Manual: compone fecha + hora del formulario.
    const iso = r.fuente === "ia"
      ? (r.fechaISO || new Date().toISOString())
      : (r.fecha ? new Date(`${r.fecha}T${r.hora || "00:00"}:00`).toISOString() : new Date().toISOString());
    const ok = await postEvento(r.mm, iso, r.observaciones);
    if (!ok) { toast.show("No se pudo guardar el riego", "err"); return; }
    setRiegos((prev) => [{ t: Date.now(), mm: r.mm, estado: r.fuente === "ia" ? "ejecutado" : "Reporte manual", ia: r.fuente === "ia" }, ...prev]);
    toast.show(r.fuente === "ia" ? "Riego IA confirmado" : "Registro manual guardado");
  }, [postEvento, toast]);

  const sinCampo = tieneCampo === false;
  const cargandoBalance = tieneCampo === null || (tieneCampo === true && dias === null);
  const estadoHidrico = s0 >= 50 ? "Bien hidratado" : s0 >= 35 ? "Déficit controlado" : "Estrés hídrico";

  const exportarPDF = useCallback(async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const hoy = new Date().toLocaleDateString("es-AR");
      doc.setFontSize(18); doc.setTextColor(34, 60, 30);
      doc.text("MiCampo — Plan de Riego", 14, 20);
      doc.setFontSize(10); doc.setTextColor(90, 90, 90);
      doc.text(`Generado: ${hoy}`, 14, 27);
      doc.setTextColor(30, 30, 30); doc.setFontSize(11);
      let y = 40;
      const line = (t: string) => { doc.text(t, 14, y); y += 7; };
      line(`Lote: ${loteNombre}`);
      line(`Cultivo: ${cultivo} · Etapa fenológica: ${etapa} (Kc ${kcDe(cultivo, etapa)})`);
      line(`Estado hídrico: ${estadoHidrico} · Agua útil estimada: ${s0}% (${aguaUtilMm} mm)`);
      line(`Consumo diario (ETc): ${etcDia} mm/día`);
      line(`Estrategia: ${estrategia <= 33 ? "Ahorro de agua" : estrategia >= 66 ? "Maximizar rinde" : "Balanceada"} (${estrategia}/100)`);
      line(`Costo proyectado de riego: $${costoEvento} USD`);
      y += 4; doc.setFontSize(13); doc.text("Riegos sugeridos (próximos 7 días)", 14, y); y += 8; doc.setFontSize(11);
      if (sugerencias.length === 0) { line("Sin riego necesario según el balance proyectado."); }
      else sugerencias.forEach((s, i) => line(`${i + 1}. ${s.fecha} — ${s.mm} mm · ${s.motivo} · $${s.costoUSD}`));
      y += 4; doc.setFontSize(13); doc.text("Balance hídrico proyectado (% humedad de suelo)", 14, y); y += 8; doc.setFontSize(10);
      balance.forEach((b) => line(`${b.dia}:  sin riego ${b.sinRiego}%  ·  con riego ${b.conRiego}%`));
      doc.setFontSize(8); doc.setTextColor(140, 140, 140);
      doc.text("Balance estimado con ET0 y lluvia de Open-Meteo + coeficiente de cultivo por etapa.", 14, 285);
      doc.save(`micampo-plan-riego-${loteNombre.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`);
      toast.show("Plan de riego descargado en PDF");
    } catch { toast.show("No se pudo generar el PDF", "err"); }
  }, [loteNombre, cultivo, etapa, estadoHidrico, s0, aguaUtilMm, etcDia, estrategia, costoEvento, sugerencias, balance, toast]);

  return (
    <div className="col gap-20">
      {toast.node}
      <RegistrarRiegoModal open={riegoOpen} onClose={() => setRiegoOpen(false)} sugerencias={sugerencias} onRegistrar={registrar} lotes={scopeLotes.map((l) => ({ id: l.id, nombre: l.nombre, cultivo: l.cultivo, hectareas: l.hectareas }))} loteActivoId={loteId} />

      <PageHeader
        crumbs={["Agronomía", "Plan de Riego"]}
        title="Plan de Riego"
        subtitle="Balance hídrico proyectado con datos reales de clima y lluvia, y registro de riegos."
      />

      <div className="grid g-cols-5">
        <KPI label="Estado Hídrico" value={sinCampo ? "—" : <span style={{ color: s0 >= 50 ? "var(--mc-green-700)" : "var(--mc-amber)" }}>{estadoHidrico}</span>} delta={sinCampo ? "Sin lote" : <span className="row gap-4" style={{ alignItems: "center" }}><Icon name="droplet" size={12} />{loteNombre}</span>} trend="up" icon="droplet" accent />
        <KPI label="Agua Útil (estimada)" value={sinCampo ? "—" : `${s0}%`} delta={sinCampo ? "—" : `${aguaUtilMm} mm disponibles`} trend="up" icon="activity" />
        <KPI label="Consumo Diario (ETc)" value={!sinCampo && etcDia ? `${etcDia} mm/día` : "—"} delta={sinCampo ? "—" : `${cultivo} · ${etapa} · Kc ${kcDe(cultivo, etapa)}`} trend="up" icon="thermometer" />
        <KPI label="Próximo Riego" value={proximo ? proximo.fecha : "—"} delta={sinCampo ? "—" : proximo ? `+${proximo.mm} mm sugeridos` : "Sin riego necesario"} trend="up" icon="calendar" />
        <KPI label="Costo Proyectado" value={sinCampo ? "—" : `$${costoEvento}`} delta="Energía + insumo" trend="up" icon="dollar" />
      </div>

      {/* Acciones del submódulo, debajo de los KPIs (alineadas a la derecha) */}
      <div className="row gap-8" style={{ justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={exportarPDF} disabled={sinCampo}><Icon name="download" size={13} />Exportar PDF</button>
        <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => setRiegoOpen(true)}><Icon name="plus" size={13} />Registrar Riego</button>
      </div>

      {/* Estadio fenológico — ajusta el Kc (consumo de agua) del cálculo */}
      {!sinCampo && (
        <div className="mc-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div className="row gap-8" style={{ alignItems: "center" }}>
            <Icon name="sprout" size={16} style={{ color: "var(--mc-green-700)" }} />
            <span className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 13.5 }}>Estadio fenológico</span>
            {etapaAuto && (
              <span className="mc-badge mc-badge--green" style={{ fontSize: 10.5 }}>
                <Icon name="bolt" size={10} />Auto · {etapaAuto.dias} d desde siembra
              </span>
            )}
          </div>
          <div className="mc-seg">
            {ETAPAS.map((e) => (
              <button key={e} className={etapa === e ? "is-on" : ""} onClick={() => setEtapa(e)}>{e}</button>
            ))}
          </div>
          <span className="text-xs text-muted">Kc {kcDe(cultivo, etapa)} · ajusta el consumo (ETc) y el riego sugerido</span>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
        <BalanceHidrico
          balance={balance}
          sugerencias={sugerencias}
          estrategia={estrategia}
          onEstrategia={setEstrategia}
          onEstrategiaCommit={() => { try { window.localStorage.setItem("mc-riego-estrategia", String(estrategia)); } catch {} }}
          costoEvento={costoEvento}
          onAprobar={aprobarOrden}
          cargando={cargandoBalance}
          subtitle={`Próximos ${balance.length || 7} días · ${loteNombre} · ${cultivo}`}
          aguaUtilMm={aguaUtilMm}
        />
        <AguaUlt30Dias lluvias={lluvias} riegos={riegos} histMm={histMm} />
      </div>
    </div>
  );
}

function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
