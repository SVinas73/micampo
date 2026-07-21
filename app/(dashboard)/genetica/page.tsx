"use client";

// GANADERÍA / GENÉTICA — reproductores, mérito genético y ROI. Tabs: Resumen ·
// Reproductores · ROI Genético. Derivado de /api/reproductores, /api/animales
// y /api/analisis-roi-genetico.

import { useCallback, useEffect, useState } from "react";
import { PageHeader, Tabs } from "@/components/mc";
import { AnimalAPI, AnimalRow, mapAnimal } from "@/components/ganaderia/tipos";
import { HembraLite, ROIAPI, ReproductorAPI } from "@/components/ganaderia/genetica-tipos";
import { GeneticaResumen, GeneticaReproductores, GeneticaROI } from "@/components/ganaderia/genetica-tabs";

const TABS = ["Resumen", "Reproductores", "ROI Genético"];

export default function GeneticaPage() {
  const [tab, setTab] = useState("Resumen");
  const [toros, setToros] = useState<ReproductorAPI[]>([]);
  const [animalesAPI, setAnimalesAPI] = useState<AnimalAPI[]>([]);
  const [roi, setRoi] = useState<ROIAPI[]>([]);

  const cargar = useCallback(() => {
    fetch("/api/reproductores").then((r) => (r.ok ? r.json() : [])).then((d) => setToros(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/animales").then((r) => (r.ok ? r.json() : [])).then((d) => setAnimalesAPI(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/analisis-roi-genetico").then((r) => (r.ok ? r.json() : [])).then((d) => setRoi(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const animales = animalesAPI.map(mapAnimal);
  const norm = (v: string) => v.replace(/^#/, "").toLowerCase();

  // Toros del rodeo sin registro genético (para "Nuevo Reproductor")
  const idsConRegistro = new Set(toros.map((t) => t.id));
  const torosSinRegistro = animales.filter((a) => a.categoria === "Toro" && a.sexo === "M" && a.activo && !idsConRegistro.has(a.dbId));

  // Crías por caravana de padre
  const criasPorPadre: Record<string, AnimalRow[]> = {};
  for (const a of animales) {
    if (a.padre) {
      const key = a.padre.replace(/^#/, "");
      (criasPorPadre[key] = criasPorPadre[key] || []).push(a);
    }
  }
  // Reindexar por caravana del toro (los toros vienen con caravana cruda)
  const criasPorCaravana: Record<string, AnimalRow[]> = {};
  for (const t of toros) {
    criasPorCaravana[t.caravana] = criasPorPadre[t.caravana.replace(/^#/, "")] || [];
  }

  // Hembras para la sugerencia de cruza
  const hembras: HembraLite[] = animales
    .filter((a) => a.sexo === "H" && a.activo)
    .map((a) => ({
      id: a.id,
      caravana: a.id,
      nombre: a.nombre,
      raza: a.raza,
      objetivo: /holando|jersey|lecher/i.test(`${a.raza} ${a.categoria}`) || norm(a.prod) !== "—" ? "Leche" : "Carne",
    }));

  return (
    <div className="col gap-20">
      <PageHeader crumbs={["Ganadería", "Genética"]} title="Genética" subtitle="Reproductores, cruzas y retorno de la inversión en genética premium." />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === "Resumen" && <GeneticaResumen toros={toros} torosSinRegistro={torosSinRegistro} onRefresh={cargar} />}
      {tab === "Reproductores" && <GeneticaReproductores toros={toros} criasPorPadre={criasPorCaravana} />}
      {tab === "ROI Genético" && <GeneticaROI toros={toros} roi={roi} hembras={hembras} onRefresh={cargar} />}
    </div>
  );
}
