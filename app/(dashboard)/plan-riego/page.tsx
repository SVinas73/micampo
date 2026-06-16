"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Icon, KPI, useToast, PageHeader, SubTabs } from "@/components/mc";
import BalanceHidrico, { type PuntoBalance, type SugerenciaIA } from "@/components/plan-riego/BalanceHidrico";
import AguaUlt30Dias, { type EventoAgua } from "@/components/plan-riego/AguaUlt30Dias";
import RegistrarRiegoModal, { type RegistroRiego } from "@/components/plan-riego/RegistrarRiegoModal";
import { demo } from "@/lib/demo";

/* ============ Datos demo (Figma) ============ */
const BALANCE_DEMO: PuntoBalance[] = [
  { dia: "HOY 22", sinRiego: 82, conRiego: 82 },
  { dia: "JUE 23", sinRiego: 70, conRiego: 72 },
  { dia: "VIE 24", sinRiego: 58, conRiego: 62 },
  { dia: "SÁB 25", sinRiego: 38, conRiego: 78 },
  { dia: "DOM 26", sinRiego: 22, conRiego: 68 },
  { dia: "LUN 27", sinRiego: 12, conRiego: 82 },
  { dia: "MAR 28", sinRiego: 5, conRiego: 70 },
];

const SUGERENCIAS_DEMO: SugerenciaIA[] = [
  { fecha: "2025-09-25", mm: 15, motivo: "Humedad proyectada cae a 22% sin riego (estrés severo)", costoUSD: 225 },
  { fecha: "2025-09-27", mm: 15, motivo: "Balance hídrico negativo proyectado en 5 días", costoUSD: 225 },
];

const EVENTOS_DEMO: EventoAgua[] = [
  { tipo: "Riego Variable (IA)", fecha: "Ayer, 04:00 AM", icon: "droplet", color: "#3aa6d9", val: "+12 mm", status: "ejecutado", iaIcon: true },
  { tipo: "Lluvia Fuerte", fecha: "Jueves 21, PM", icon: "droplet", color: "#3aa6d9", val: "+45 mm", status: "Reporte Manual" },
  { tipo: "Fertirriego", fecha: "Lunes 18", icon: "leaf", color: "#768f44", val: "+10 mm", status: "Aplicación Urea" },
  { tipo: "Llovizna", fecha: "Sábado 16", icon: "droplet", color: "#3aa6d9", val: "+5 mm", status: "" },
  { tipo: "Riego IA", fecha: "Miércoles 13", icon: "droplet", color: "#3aa6d9", val: "+15 mm", status: "", iaIcon: true },
];

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

  const [balance, setBalance] = useState<PuntoBalance[]>(demo(BALANCE_DEMO, []));
  const [sugerencias, setSugerencias] = useState<SugerenciaIA[]>(demo(SUGERENCIAS_DEMO, []));
  const [estrategia, setEstrategia] = useState(75);
  const [costoEvento, setCostoEvento] = useState(demo(450, 0));
  const [cargando, setCargando] = useState(false);

  const [eventos, setEventos] = useState<EventoAgua[]>(demo(EVENTOS_DEMO, []));
  const [planRiegoId, setPlanRiegoId] = useState<string | null>(null);
  const [loteId, setLoteId] = useState<string | null>(null);

  // Plan de riego activo (para el planRiegoId del POST de eventos) y lote.
  useEffect(() => {
    fetch("/api/planes-riego")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (Array.isArray(d) && d.length > 0) {
          setPlanRiegoId(d[0].id ?? null);
          if (d[0].loteId) setLoteId(d[0].loteId);
        }
      })
      .catch(() => {});

    fetch("/api/lotes")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (Array.isArray(d) && d.length > 0 && !loteId) setLoteId(d[0].id ?? null);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analizar = useCallback(
    async (estr: number) => {
      setCargando(true);
      try {
        const res = await fetch("/api/riego-ia/analizar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loteId, cultivo: "Maíz", etapaFenologica: "Vegetativo", estrategia: estr }),
        });
        if (res.ok) {
          const d = await res.json();
          if (Array.isArray(d?.balanceProyectado) && d.balanceProyectado.length > 0) setBalance(d.balanceProyectado);
          if (Array.isArray(d?.sugerencias) && d.sugerencias.length > 0) setSugerencias(d.sugerencias);
          if (typeof d?.costoEvento === "number") setCostoEvento(d.costoEvento);
        }
      } catch {
        /* mantiene demo */
      } finally {
        setCargando(false);
      }
    },
    [loteId],
  );

  // Analiza al montar (y cuando se conoce el lote).
  const montado = useRef(false);
  useEffect(() => {
    if (montado.current) return;
    montado.current = true;
    analizar(estrategia);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analizar]);

  // POST de un evento de riego (común a aprobar orden y modal).
  const postEvento = useCallback(
    async (mm: number, fecha: string, observaciones: string) => {
      if (!planRiegoId) return false;
      try {
        const res = await fetch("/api/eventos-riego", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planRiegoId,
            fechaProgramada: fecha,
            laminaAplicada: mm,
            estado: "Programado",
            observaciones,
          }),
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    [planRiegoId],
  );

  const aprobarOrden = useCallback(async () => {
    for (const s of sugerencias) {
      await postEvento(s.mm, s.fecha, s.motivo);
    }
    setEventos((prev) => [
      ...sugerencias.map((s) => ({
        tipo: "Riego IA (Aprobado)",
        fecha: s.fecha,
        icon: "droplet",
        color: "#3aa6d9",
        val: `+${s.mm} mm`,
        status: "Programado",
        iaIcon: true,
      })),
      ...prev,
    ]);
    toast.show("Orden de riego aprobada");
  }, [sugerencias, postEvento, toast]);

  const registrar = useCallback(
    async (r: RegistroRiego) => {
      await postEvento(r.mm, r.fecha, r.observaciones);
      setEventos((prev) => [
        {
          tipo: r.fuente === "ia" ? "Riego IA" : "Riego Manual",
          fecha: `${r.fecha} · ${r.metodo}`,
          icon: "droplet",
          color: "#3aa6d9",
          val: `+${r.mm} mm`,
          status: r.fuente === "ia" ? "ejecutado" : "Reporte Manual",
          iaIcon: r.fuente === "ia",
        },
        ...prev,
      ]);
      toast.show(r.fuente === "ia" ? "Riego IA confirmado" : "Registro manual guardado");
    },
    [postEvento, toast],
  );

  return (
    <div className="col gap-20">
      {toast.node}
      <RegistrarRiegoModal open={riegoOpen} onClose={() => setRiegoOpen(false)} sugerencias={sugerencias} onRegistrar={registrar} />

      <PageHeader
        crumbs={["Agronomía", "Plan de Riego"]}
        title="Plan de Riego"
        subtitle="Balance hídrico proyectado, sugerencias de IA y registro de riegos."
        actions={
          <button className="mc-btn mc-btn--primary" onClick={() => setRiegoOpen(true)}>
            <Icon name="plus" size={14} />Registrar Riego
          </button>
        }
      />

      <div className="grid g-cols-5">
        <KPI label="Estado Hídrico" value={demo<React.ReactNode>(<span style={{ color: "var(--mc-green-700)" }}>Bien Hidratado</span>, "—")} delta={demo<React.ReactNode>(<span className="row gap-4" style={{ alignItems: "center" }}><Icon name="check" size={12} />Lotes en confort</span>, "—")} trend="up" icon="droplet" accent />
        <KPI label="Agua Útil (Tanque)" value={demo("45%", "—")} delta={demo("120 mm disponibles", "—")} trend="up" icon="activity" />
        <KPI label="Consumo Diario (ETo)" value={demo("6 mm/día", "—")} delta={demo("Maíz V6 · K=1.1", "—")} trend="up" icon="thermometer" />
        <KPI label="Próximo Riego IA" value={demo("24/09 5:00", "—")} delta={demo("+15 mm sugeridos", "—")} trend="up" icon="calendar" ia />
        <KPI label="Costo Proyectado" value={demo("$12/mm", "—")} delta={demo("Energía + insumo", "—")} trend="up" icon="dollar" />
      </div>

      <SubTabs tabs={["Inicio"]} active={sub} onChange={setSub} />

      <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
        <BalanceHidrico
          balance={balance}
          sugerencias={sugerencias}
          estrategia={estrategia}
          onEstrategia={setEstrategia}
          onEstrategiaCommit={(v) => analizar(v)}
          costoEvento={costoEvento}
          onAprobar={aprobarOrden}
          cargando={cargando}
        />
        <AguaUlt30Dias eventos={eventos} />
      </div>
    </div>
  );
}
