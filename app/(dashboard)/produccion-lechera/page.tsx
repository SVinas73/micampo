"use client";

// GANADERÍA / PRODUCCIÓN LECHERA — seguimiento de ordeñe, curvas de lactancia
// y calidad. Tabs: Resumen · Ordeñe · Estado de Lactancia · Curvas · Calidad.
// Todos los datos derivan de /api/animales, /api/registros-lecheros y
// /api/boletas-lecheras. Sin datos demo.

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Tabs } from "@/components/mc";
import { AnimalAPI } from "@/components/ganaderia/tipos";
import {
  BoletaAPI,
  RegLecheroAPI,
  TurnoDef,
  TURNOS_BASE,
  WOOD_REFERENCIA,
  WoodParams,
  derivarVacas,
  fitWood,
  turnosExtraHoy,
} from "@/components/ganaderia/lechera-tipos";
import { PLResumen } from "@/components/ganaderia/lechera-tab-resumen";
import { PLOrdene } from "@/components/ganaderia/lechera-tab-ordene";
import { PLEstadoLactancia } from "@/components/ganaderia/lechera-tab-lactancia";
import { PLCurvas } from "@/components/ganaderia/lechera-tab-curvas";
import { PLCalidad } from "@/components/ganaderia/lechera-tab-calidad";

const TABS = ["Resumen", "Ordeñe", "Estado de Lactancia", "Curvas", "Calidad"];

export default function ProduccionLecheraPage() {
  const [tab, setTab] = useState("Resumen");
  const [animales, setAnimales] = useState<AnimalAPI[]>([]);
  const [registros, setRegistros] = useState<RegLecheroAPI[]>([]);
  const [boletas, setBoletas] = useState<BoletaAPI[]>([]);
  const [turnosExtra, setTurnosExtra] = useState<TurnoDef[]>(() => turnosExtraHoy());

  const cargar = useCallback(() => {
    // Últimos 12 meses de registros para curvas y comparativos
    const desde = new Date();
    desde.setMonth(desde.getMonth() - 12);
    const desdeStr = `${desde.getFullYear()}-${String(desde.getMonth() + 1).padStart(2, "0")}-${String(desde.getDate()).padStart(2, "0")}`;
    fetch("/api/animales").then((r) => (r.ok ? r.json() : [])).then((d) => setAnimales(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`/api/registros-lecheros?desde=${desdeStr}`).then((r) => (r.ok ? r.json() : [])).then((d) => setRegistros(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/boletas-lecheras").then((r) => (r.ok ? r.json() : [])).then((d) => setBoletas(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Curva esperada del rodeo: ajuste de Wood si hay datos, si no la de referencia
  const esperada: WoodParams = useMemo(() => {
    const pts: { del: number; litros: number }[] = [];
    const porAnimal = new Map<string, RegLecheroAPI[]>();
    for (const r of registros) {
      if (!porAnimal.has(r.animalId)) porAnimal.set(r.animalId, []);
      porAnimal.get(r.animalId)!.push(r);
    }
    for (const a of animales) {
      const up = a.historialReproductivo?.ultimoParto;
      if (!up) continue;
      const parto = new Date(up.slice(0, 10) + "T00:00:00").getTime();
      for (const r of porAnimal.get(a.id) || []) {
        const t = Math.round((new Date(r.fecha.slice(0, 10) + "T00:00:00").getTime() - parto) / (24 * 3600 * 1000));
        if (t > 0 && t <= 400) pts.push({ del: t, litros: r.litros });
      }
    }
    return fitWood(pts) || WOOD_REFERENCIA;
  }, [animales, registros]);

  const vacas = useMemo(() => derivarVacas(animales, registros, esperada), [animales, registros, esperada]);

  const turnos: TurnoDef[] = useMemo(() => [...TURNOS_BASE, ...turnosExtra], [turnosExtra]);

  const refrescar = useCallback(() => {
    cargar();
    setTurnosExtra(turnosExtraHoy());
  }, [cargar]);

  return (
    <div className="col gap-20">
      <PageHeader
        crumbs={["Ganadería", "Producción Lechera"]}
        title="Producción Lechera"
        subtitle="Seguimiento de ordeñe, curvas de lactancia y calidad."
      />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "Resumen" && (
        <PLResumen vacas={vacas} registros={registros} turnos={turnos} esperada={esperada} onRefresh={refrescar} onGoToOrdene={() => setTab("Ordeñe")} />
      )}
      {tab === "Ordeñe" && <PLOrdene vacas={vacas} registros={registros} boletas={boletas} turnos={turnos} onRefresh={refrescar} />}
      {tab === "Estado de Lactancia" && <PLEstadoLactancia vacas={vacas} esperada={esperada} />}
      {tab === "Curvas" && <PLCurvas vacas={vacas} esperada={esperada} />}
      {tab === "Calidad" && <PLCalidad boletas={boletas} onRefresh={refrescar} />}
    </div>
  );
}
