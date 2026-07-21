"use client";

// GANADERÍA / ENGORDE (feedlot) — seguimiento de corrales, conversión, curva
// de engorde con IA y faena. Tabs: Resumen · Corrales · Nutrición y Conversión ·
// Curva de Engorde (IA) · Faena y Venta. Todo derivado de datos reales.

import { useCallback, useEffect, useState } from "react";
import { PageHeader, Tabs } from "@/components/mc";
import { CorralAPI, DTEAPI, gdpReal } from "@/components/ganaderia/engorde-tipos";
import { EngordeResumen } from "@/components/ganaderia/engorde-tab-resumen";
import { EngordeCorrales } from "@/components/ganaderia/engorde-tab-corrales";
import { EngordeConversion } from "@/components/ganaderia/engorde-tab-conversion";
import { EngordeCurva } from "@/components/ganaderia/engorde-tab-curva";
import { EngordeFaena } from "@/components/ganaderia/engorde-tab-faena";

type RacionLite = { id: string; nombre: string; etapaProductiva?: string | null; animalObjetivo?: string | null; costoTotal?: number | null; consumoDiario?: number | null; proteinaTotal?: number | null };

const TABS = ["Resumen", "Corrales", "Nutrición y Conversión", "Curva de Engorde (IA)", "Faena y Venta"];

export default function EngordePage() {
  const [tab, setTab] = useState("Resumen");
  const [corralFocus, setCorralFocus] = useState<string | null>(null);
  const [corrales, setCorrales] = useState<CorralAPI[]>([]);
  const [raciones, setRaciones] = useState<RacionLite[]>([]);
  const [documentos, setDocumentos] = useState<DTEAPI[]>([]);

  const cargar = useCallback(() => {
    fetch("/api/corrales-engorde").then((r) => (r.ok ? r.json() : [])).then((d) => setCorrales(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/raciones").then((r) => (r.ok ? r.json() : [])).then((d) => setRaciones(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/documentos-transito").then((r) => (r.ok ? r.json() : [])).then((d) => setDocumentos(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const activos = corrales.filter((c) => c.estado !== "Cerrado");
  const totalCab = activos.reduce((s, c) => s + c.cabezas, 0);
  const hayRiesgo = activos.some((c) => { const g = gdpReal(c); return g !== null && c.gdpObjetivo != null && g < c.gdpObjetivo * 0.85; });
  const warnTabs = hayRiesgo ? ["Corrales", "Curva de Engorde (IA)"] : [];

  const subtitle = activos.length
    ? `${totalCab.toLocaleString("es-AR")} cabezas en feedlot · ${activos.length} corrales activos.`
    : "Seguimiento de corrales de engorde, conversión y faena.";

  return (
    <div className="col gap-20">
      <PageHeader crumbs={["Ganadería", "Engorde"]} title="Engorde" subtitle={subtitle} />
      <Tabs tabs={TABS} active={tab} onChange={(t) => { setCorralFocus(null); setTab(t); }} warnTabs={warnTabs} />

      {tab === "Resumen" && <EngordeResumen corrales={corrales} raciones={raciones} onRefresh={cargar} onGoToCorrales={(id) => { setCorralFocus(id ?? null); setTab("Corrales"); }} />}
      {tab === "Corrales" && <EngordeCorrales corrales={corrales} raciones={raciones} focusId={corralFocus} onRefresh={cargar} />}
      {tab === "Nutrición y Conversión" && <EngordeConversion corrales={corrales} raciones={raciones} />}
      {tab === "Curva de Engorde (IA)" && <EngordeCurva corrales={corrales} />}
      {tab === "Faena y Venta" && <EngordeFaena corrales={corrales} documentos={documentos} onRefresh={cargar} />}
    </div>
  );
}
