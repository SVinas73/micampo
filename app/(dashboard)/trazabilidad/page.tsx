"use client";

// GANADERÍA / TRAZABILIDAD — identificación electrónica, documentos de tránsito
// y cumplimiento regulatorio. Config por país (Uruguay/Argentina) con selector en
// caliente. Tabs: Resumen · Identificación Electrónica · {DTE} y Movimientos · Auditoría.
// Datos reales de /api/animales, /api/documentos-transito, /api/auditorias-trazabilidad
// y /api/tropas.

import { useCallback, useEffect, useState } from "react";
import { PageHeader, Tabs, Icon } from "@/components/mc";
import { AnimalAPI, mapAnimal } from "@/components/ganaderia/tipos";
import { TropaAPI } from "@/components/ganaderia/tropas-tipos";
import {
  AuditoriaApi,
  CONFIG_REGULATORIO,
  DTEApi,
  PAISES,
  PaisKey,
  ternerosPendientes,
} from "@/components/ganaderia/trazabilidad-tipos";
import { TrazaAuditoria, TrazaDTE, TrazaIdentificacion, TrazaResumen } from "@/components/ganaderia/trazabilidad-tabs";

export default function TrazabilidadPage() {
  const [pais, setPais] = useState<PaisKey>("uruguay");
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [animalesAPI, setAnimalesAPI] = useState<AnimalAPI[]>([]);
  const [dtes, setDtes] = useState<DTEApi[]>([]);
  const [auditorias, setAuditorias] = useState<AuditoriaApi[]>([]);
  const [tropas, setTropas] = useState<TropaAPI[]>([]);

  const cfg = CONFIG_REGULATORIO[pais];
  const tabs = ["Resumen", "Identificación Electrónica", `${cfg.documentoTransito} y Movimientos`, "Auditoría"];
  const [tab, setTab] = useState("Resumen");

  const cargar = useCallback(() => {
    fetch("/api/animales").then((r) => (r.ok ? r.json() : [])).then((d) => setAnimalesAPI(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/documentos-transito").then((r) => (r.ok ? r.json() : [])).then((d) => setDtes(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/auditorias-trazabilidad").then((r) => (r.ok ? r.json() : [])).then((d) => setAuditorias(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/tropas").then((r) => (r.ok ? r.json() : [])).then((d) => setTropas(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiarPais = (p: PaisKey) => {
    setPais(p);
    setSelectorAbierto(false);
    setTab("Resumen");
  };

  const animales = animalesAPI.map(mapAnimal);
  const terneros = ternerosPendientes(animales, cfg);

  return (
    <div className="col gap-20">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <PageHeader
          crumbs={["Ganadería", "Trazabilidad"]}
          title="Trazabilidad"
          subtitle={`Identificación electrónica, ${cfg.documentoTransito} y cumplimiento ${cfg.organismo} — al día, sin sorpresas.`}
        />
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button onClick={() => setSelectorAbierto((o) => !o)} className="mc-btn mc-btn--secondary mc-btn--sm">
            {cfg.bandera} {cfg.pais} <Icon name="chevron-down" size={12} />
          </button>
          {selectorAbierto && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "var(--mc-surface)", border: "1px solid var(--mc-line-2)", borderRadius: 10, boxShadow: "var(--sh-md)", zIndex: 20, overflow: "hidden", minWidth: 160 }}>
              {PAISES.map((key) => {
                const c = CONFIG_REGULATORIO[key];
                const activo = pais === key;
                return (
                  <div key={key} onClick={() => cambiarPais(key)} style={{ padding: "9px 14px", fontSize: 12.5, fontWeight: activo ? 700 : 500, color: activo ? "var(--mc-green-700)" : "var(--mc-ink)", background: activo ? "var(--mc-green-50)" : "transparent", cursor: "pointer" }}>
                    {c.bandera} {c.pais}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === "Resumen" && <TrazaResumen cfg={cfg} animales={animales} terneros={terneros} dtes={dtes} auditorias={auditorias} onRefresh={cargar} />}
      {tab === "Identificación Electrónica" && <TrazaIdentificacion cfg={cfg} animales={animales} terneros={terneros} onRefresh={cargar} />}
      {tab === `${cfg.documentoTransito} y Movimientos` && <TrazaDTE cfg={cfg} dtes={dtes} tropas={tropas} onRefresh={cargar} />}
      {tab === "Auditoría" && <TrazaAuditoria auditorias={auditorias} terneros={terneros} dtes={dtes} onRefresh={cargar} />}
    </div>
  );
}
