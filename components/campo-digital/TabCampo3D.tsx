"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@/components/mc";
import { mapLotesApi, type LoteUI } from "@/components/campo-digital/lotes-data";
import { useLoteScope } from "@/components/LoteScope";

// El motor 3D (three.js) solo en cliente y bajo demanda
const Campo3D = dynamic(() => import("@/components/campo-digital/Campo3D"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 560, display: "grid", placeItems: "center", border: "1px solid var(--mc-line)", borderRadius: 14, background: "var(--mc-surface-2)" }}>
      <div className="text-sm text-muted">Cargando gemelo 3D…</div>
    </div>
  ),
});

type EconLite = { margenPorHa: number; costoPorHa: number; margen: number; fuente: string };

export default function TabCampo3D() {
  const { loteIdsEnScope, esTodos } = useLoteScope();
  const [todos, setTodos] = useState<LoteUI[]>([]);
  const [economia, setEconomia] = useState<Record<string, EconLite>>({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/lotes").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/economia/lotes").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([rows, eco]) => {
        if (Array.isArray(rows) && rows.length) setTodos(mapLotesApi(rows));
        else setTodos([]);
        if (eco?.lotes) {
          const map: Record<string, EconLite> = {};
          eco.lotes.forEach((l: any) => {
            map[l.loteId] = { margenPorHa: l.margenPorHa, costoPorHa: l.costoPorHa, margen: l.margen, fuente: l.fuente };
          });
          setEconomia(map);
        }
      })
      .finally(() => setCargando(false));
  }, []);

  // Respeta el alcance global (establecimiento + lote)
  const lotes = useMemo(
    () => (esTodos ? todos : todos.filter((l) => loteIdsEnScope.includes(l.dbId || l.id))),
    [todos, loteIdsEnScope, esTodos]
  );

  const totalHa = lotes.reduce((s, l) => s + (l.ha || 0), 0);
  const conGeo = lotes.filter((l) => l.geojson?.coordinates?.[0]?.length).length;

  return (
    <div className="col gap-16">
      <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="mc-card__head" style={{ padding: "16px 20px 12px" }}>
          <div>
            <div className="mc-card__eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="map" size={13} /> Gemelo digital · 3D
            </div>
            <div className="mc-card__title mt-4">Tu establecimiento en 3D</div>
          </div>
          {lotes.length > 0 && (
            <span className="mc-badge mc-badge--neutral">
              <span className="mc-badge__dot" />
              {lotes.length} lotes · {totalHa.toFixed(0)} ha
            </span>
          )}
        </div>

        <div style={{ padding: "0 20px 20px" }}>
          {cargando ? (
            <div style={{ height: 560, display: "grid", placeItems: "center" }}>
              <div className="text-sm text-muted">Cargando lotes…</div>
            </div>
          ) : lotes.length === 0 ? (
            <div className="mc-empty" style={{ height: 420 }}>
              <div className="mc-empty__icon"><Icon name="map" size={22} /></div>
              <div className="mc-empty__title">Sin lotes para visualizar</div>
              <div className="mc-empty__text">Cargá y dibujá tus lotes en la pestaña “Lotes” para verlos en 3D.</div>
            </div>
          ) : (
            <>
              <Campo3D lotes={lotes} economia={economia} />
              {conGeo === 0 && (
                <div className="text-xs text-muted" style={{ marginTop: 10 }}>
                  Tus lotes todavía no tienen geometría dibujada: se muestran como parcelas en grilla.
                  Dibujá sus polígonos en “Lotes” para ver la forma real del campo.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
