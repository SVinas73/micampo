"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader, Tabs } from "@/components/mc";
import { ActionsProvider, useHeaderActions } from "@/components/campo-digital/ActionsContext";
import TabResumen from "@/components/campo-digital/TabResumen";
import TabLotes from "@/components/campo-digital/TabLotes";
import TabLabores from "@/components/campo-digital/TabLabores";
import TabCultivos from "@/components/campo-digital/TabCultivos";
import TabDeteccion from "@/components/campo-digital/TabDeteccion";

const TABS = [
  "Resumen",
  "Lotes",
  "Labores",
  "Cultivos",
  "Detección de Enfermedades (IA)",
  "Planificador de Siembras (IA)",
];

export default function CampoDigitalPage() {
  return (
    <Suspense>
      <ActionsProvider>
        <CampoDigitalInner />
      </ActionsProvider>
    </Suspense>
  );
}

function CampoDigitalInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") && TABS.includes(searchParams.get("tab")!) ? searchParams.get("tab")! : "Resumen";
  const { actions } = useHeaderActions();

  const setTab = (t: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", t);
    router.replace(`/campo-digital?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="col gap-20">
      <PageHeader
        crumbs={["Agronomía", "Campo Digital"]}
        title="Campo Digital"
        subtitle="Mapa operativo, siembras, cultivos y sanidad de tus hectáreas productivas."
        actions={actions}
      />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === "Resumen" && <TabResumen onNavigateTab={setTab} />}
      {tab === "Lotes" && <TabLotes />}
      {tab === "Labores" && <TabLabores />}
      {tab === "Cultivos" && <TabCultivos />}
      {tab === "Detección de Enfermedades (IA)" && <TabDeteccion />}
      {tab === "Planificador de Siembras (IA)" && <TabCultivos initialSub="Planificador de Siembra (IA)" />}
    </div>
  );
}
