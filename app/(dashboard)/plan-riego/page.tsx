"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Icon, KPI, useToast, PageHeader, SubTabs } from "@/components/mc";
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

// Coeficiente de cultivo (Kc) aproximado por cultivo (etapa media)
const KC: Record<string, number> = { Maíz: 1.15, Soja: 1.1, Trigo: 1.05, Girasol: 1.0, Alfalfa: 1.2, Sorgo: 1.05, Cebada: 1.0 };
const AWC = 120; // mm de agua útil en el perfil (suelo franco, ~1 m)
const COSTO_MM = 12; // USD/mm (energía + insumo)

export default function PlanRiegoPage() {
  return (
    <Suspense>
      <PlanRiegoInner />
    </Suspense>
  );
}

function PlanRiegoInner() {
  const toast = useToast();
  const [sub, setSub] = useState("Inicio");
  const [riegoOpen, setRiegoOpen] = useState(false);

  const [estrategia, setEstrategia] = useState(70);
  const [planRiegoId, setPlanRiegoId] = useState<string | null>(null);
  const [loteId, setLoteId] = useState<string | null>(null);
  const [loteNombre, setLoteNombre] = useState<string>("tu campo");
  const [cultivo, setCultivo] = useState<string>("Maíz");

  const [dias, setDias] = useState<ClimaDia[] | null>(null);
  const [s0, setS0] = useState(65); // humedad de suelo inicial estimada (%)
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

  // Lluvia + riego reales (crudos, últimos 30 días) → se filtran por período en el card
  useEffect(() => {
    const hace30 = Date.now() - 30 * 86400000;
    fetch("/api/registro-pluviometrico").then((r) => (r.ok ? r.json() : [])).then((d) => {
      if (!Array.isArray(d)) return;
      const recientes = d.filter((r: { fecha: string }) => new Date(r.fecha).getTime() >= hace30);
      setLluvias(recientes.map((r: { fecha: string; milimetros: number; lote?: { nombre: string } }) => ({ t: new Date(r.fecha).getTime(), mm: r.milimetros || 0, lugar: r.lote?.nombre || "" })));
      // humedad inicial estimada por lluvia de los últimos 7 días
      const hace7 = Date.now() - 7 * 86400000;
      const lluvia7 = recientes.filter((r: { fecha: string }) => new Date(r.fecha).getTime() >= hace7).reduce((s: number, r: { milimetros: number }) => s + (r.milimetros || 0), 0);
      setS0(Math.max(35, Math.min(92, Math.round(50 + (lluvia7 / AWC) * 100))));
    }).catch(() => {});

    fetch("/api/eventos-riego").then((r) => (r.ok ? r.json() : [])).then((d) => {
      if (!Array.isArray(d)) return;
      setRiegos(d.map((e: { fechaProgramada: string; laminaAplicada?: number; estado?: string; observaciones?: string }) => ({ t: new Date(e.fechaProgramada).getTime(), mm: e.laminaAplicada || 0, estado: e.estado || "", ia: (e.observaciones || "").toLowerCase().includes("ia") })));
    }).catch(() => {});
  }, []);

  // Cálculo determinístico del balance hídrico (real: ET0 + lluvia)
  const { balance, sugerencias, etcDia, proximo } = useMemo(() => {
    if (!dias || dias.length === 0) {
      return { balance: [] as PuntoBalance[], sugerencias: [] as SugerenciaIA[], etcDia: 0, proximo: null as SugerenciaIA | null };
    }
    const kc = KC[cultivo] || 1.05;
    const mmEvento = Math.round(10 + (estrategia / 100) * 12);
    const umbral = 40;
    let sSin = s0, sCon = s0;
    const bal: PuntoBalance[] = [];
    const sugs: SugerenciaIA[] = [];
    dias.forEach((d, i) => {
      const etc = (d.et0 || 4) * kc;
      const deltaPct = (((d.mm || 0) - etc) / AWC) * 100;
      sSin = clamp(sSin + deltaPct, 0, 100);
      let cs = clamp(sCon + deltaPct, 0, 100);
      if (i > 0 && cs < umbral) {
        cs = clamp(cs + (mmEvento / AWC) * 100, 0, 100);
        sugs.push({ fecha: `${d.nombre} ${d.num}`, mm: mmEvento, motivo: `Humedad proyectada cae a ${Math.round(sSin)}% sin riego`, costoUSD: Math.round(mmEvento * COSTO_MM) });
      }
      sCon = cs;
      bal.push({ dia: `${d.esHoy ? "HOY" : d.nombre.toUpperCase()} ${d.num}`, sinRiego: Math.round(sSin), conRiego: Math.round(cs) });
    });
    const etc0 = Math.round((dias[0].et0 || 4) * kc * 10) / 10;
    return { balance: bal, sugerencias: sugs, etcDia: etc0, proximo: sugs[0] || null };
  }, [dias, estrategia, s0, cultivo]);

  const costoEvento = sugerencias.reduce((s, x) => s + x.costoUSD, 0);
  const aguaUtilMm = Math.round((s0 / 100) * AWC);

  const postEvento = useCallback(async (mm: number, fecha: string, observaciones: string) => {
    if (!planRiegoId) return false;
    try {
      const res = await fetch("/api/eventos-riego", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planRiegoId, fechaProgramada: new Date().toISOString(), laminaAplicada: mm, estado: "Programado", observaciones }) });
      return res.ok;
    } catch { return false; }
  }, [planRiegoId]);

  const aprobarOrden = useCallback(async () => {
    if (sugerencias.length === 0) { toast.show("No hay riego sugerido por ahora", "err"); return; }
    for (const s of sugerencias) await postEvento(s.mm, s.fecha, s.motivo);
    setRiegos((prev) => [...sugerencias.map((s) => ({ t: Date.now(), mm: s.mm, estado: "Programado", ia: false })), ...prev]);
    toast.show("Orden de riego aprobada");
  }, [sugerencias, postEvento, toast]);

  const registrar = useCallback(async (r: RegistroRiego) => {
    await postEvento(r.mm, r.fecha, r.observaciones);
    setRiegos((prev) => [{ t: Date.now(), mm: r.mm, estado: r.fuente === "ia" ? "ejecutado" : "Reporte manual", ia: r.fuente === "ia" }, ...prev]);
    toast.show(r.fuente === "ia" ? "Riego IA confirmado" : "Registro manual guardado");
  }, [postEvento, toast]);

  const sinCampo = tieneCampo === false;
  const cargandoBalance = tieneCampo === null || (tieneCampo === true && dias === null);
  const estadoHidrico = s0 >= 50 ? "Bien hidratado" : s0 >= 35 ? "Déficit controlado" : "Estrés hídrico";

  return (
    <div className="col gap-20">
      {toast.node}
      <RegistrarRiegoModal open={riegoOpen} onClose={() => setRiegoOpen(false)} sugerencias={sugerencias} onRegistrar={registrar} />

      <PageHeader
        crumbs={["Agronomía", "Plan de Riego"]}
        title="Plan de Riego"
        subtitle="Balance hídrico proyectado con datos reales de clima y lluvia, y registro de riegos."
        actions={<button className="mc-btn mc-btn--primary" onClick={() => setRiegoOpen(true)}><Icon name="plus" size={14} />Registrar Riego</button>}
      />

      <div className="grid g-cols-5">
        <KPI label="Estado Hídrico" value={sinCampo ? "—" : <span style={{ color: s0 >= 50 ? "var(--mc-green-700)" : "var(--mc-amber)" }}>{estadoHidrico}</span>} delta={sinCampo ? "Sin lote" : <span className="row gap-4" style={{ alignItems: "center" }}><Icon name="droplet" size={12} />{loteNombre}</span>} trend="up" icon="droplet" accent />
        <KPI label="Agua Útil (estimada)" value={sinCampo ? "—" : `${s0}%`} delta={sinCampo ? "—" : `${aguaUtilMm} mm disponibles`} trend="up" icon="activity" />
        <KPI label="Consumo Diario (ETc)" value={!sinCampo && etcDia ? `${etcDia} mm/día` : "—"} delta={sinCampo ? "—" : `${cultivo} · Kc ${KC[cultivo] || 1.05}`} trend="up" icon="thermometer" />
        <KPI label="Próximo Riego" value={proximo ? proximo.fecha : "—"} delta={sinCampo ? "—" : proximo ? `+${proximo.mm} mm sugeridos` : "Sin riego necesario"} trend="up" icon="calendar" />
        <KPI label="Costo Proyectado" value={sinCampo ? "—" : `$${costoEvento}`} delta="Energía + insumo" trend="up" icon="dollar" />
      </div>

      <SubTabs tabs={["Inicio"]} active={sub} onChange={setSub} />

      <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
        <BalanceHidrico
          balance={balance}
          sugerencias={sugerencias}
          estrategia={estrategia}
          onEstrategia={setEstrategia}
          onEstrategiaCommit={() => {}}
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
