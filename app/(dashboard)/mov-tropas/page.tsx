"use client";

// GANADERÍA / MOV. DE TROPAS — gestión inteligente de tropas, rutinas de
// arreo y trazabilidad de movimientos. Tabs: Resumen · Tropas · Gestión ·
// Rutinas · Planificador · Historial. Todo derivado de datos reales.

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Tabs } from "@/components/mc";
import { AnimalAPI, mapAnimal } from "@/components/ganaderia/tipos";
import {
  LoteGeoAPI,
  MovTropaAPI,
  RutinaAPI,
  TropaAPI,
  movAtrasado,
} from "@/components/ganaderia/tropas-tipos";
import { MovResumen } from "@/components/ganaderia/tropas-tab-resumen";
import { MovTropasLista } from "@/components/ganaderia/tropas-tab-lista";
import { MovGestion } from "@/components/ganaderia/tropas-tab-gestion";
import { MovRutinas } from "@/components/ganaderia/tropas-tab-rutinas";
import { MovPlanificador } from "@/components/ganaderia/tropas-tab-planificador";
import { MovHistorial } from "@/components/ganaderia/tropas-tab-historial";

const TABS = ["Resumen", "Tropas", "Gestión", "Rutinas", "Planificador", "Historial"];

export default function MovTropasPage() {
  const [tab, setTab] = useState("Resumen");

  const [tropas, setTropas] = useState<TropaAPI[]>([]);
  const [rutinas, setRutinas] = useState<RutinaAPI[]>([]);
  const [movimientos, setMovimientos] = useState<MovTropaAPI[]>([]);
  const [lotes, setLotes] = useState<LoteGeoAPI[]>([]);
  const [animalesAPI, setAnimalesAPI] = useState<AnimalAPI[]>([]);

  const cargar = useCallback(() => {
    fetch("/api/tropas").then((r) => (r.ok ? r.json() : [])).then((d) => setTropas(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/rutinas-tropa").then((r) => (r.ok ? r.json() : [])).then((d) => setRutinas(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/movimientos-tropa").then((r) => (r.ok ? r.json() : [])).then((d) => setMovimientos(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/lotes").then((r) => (r.ok ? r.json() : [])).then((d) => setLotes(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/animales").then((r) => (r.ok ? r.json() : [])).then((d) => setAnimalesAPI(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const animales = useMemo(() => animalesAPI.map(mapAnimal), [animalesAPI]);

  const sinAsignar = useMemo(() => animales.filter((a) => a.activo && !a.tropaId).length, [animales]);
  const hayAtrasados = useMemo(() => movimientos.some((m) => movAtrasado(m)), [movimientos]);
  const warnTabs = useMemo(() => {
    const w: string[] = [];
    if (sinAsignar > 0) w.push("Tropas");
    if (hayAtrasados) w.push("Planificador");
    return w;
  }, [sinAsignar, hayAtrasados]);

  return (
    <div className="col gap-20">
      <PageHeader
        crumbs={["Ganadería", "Mov. de Tropas"]}
        title="Movimiento de Tropas"
        subtitle="Gestión inteligente de tropas, rutinas de arreo y trazabilidad."
      />
      <Tabs tabs={TABS} active={tab} onChange={setTab} warnTabs={warnTabs} />

      {tab === "Resumen" && (
        <MovResumen
          tropas={tropas}
          rutinas={rutinas}
          movimientos={movimientos}
          lotes={lotes}
          animales={animales}
          onRefresh={cargar}
          onGoToGestion={() => setTab("Gestión")}
        />
      )}
      {tab === "Tropas" && (
        <MovTropasLista
          tropas={tropas}
          movimientos={movimientos}
          lotes={lotes}
          animales={animales}
          onRefresh={cargar}
          onGoToGestion={() => setTab("Gestión")}
        />
      )}
      {tab === "Gestión" && (
        <MovGestion
          tropas={tropas}
          rutinas={rutinas}
          movimientos={movimientos}
          lotes={lotes}
          onRefresh={cargar}
          onGoToHistorial={() => setTab("Historial")}
        />
      )}
      {tab === "Rutinas" && (
        <MovRutinas rutinas={rutinas} tropas={tropas} movimientos={movimientos} lotes={lotes} onRefresh={cargar} />
      )}
      {tab === "Planificador" && (
        <MovPlanificador tropas={tropas} rutinas={rutinas} movimientos={movimientos} lotes={lotes} onRefresh={cargar} />
      )}
      {tab === "Historial" && <MovHistorial tropas={tropas} movimientos={movimientos} onRefresh={cargar} />}
    </div>
  );
}
