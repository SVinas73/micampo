"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/mc";

type Metrica = {
  clave: string;
  label: string;
  unidad: string;
  mejorEsMayor: boolean;
  valor: number;
  mediana: number;
  percentil: number;
};
type Bench = { disponible: boolean; cohorteN: number; minCohorte: number; metricas: Metrica[]; mensaje: string };

export function BenchmarkCard() {
  const [data, setData] = useState<Bench | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/benchmark")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const tono = (p: number) => (p >= 66 ? "#5e7733" : p >= 34 ? "#d9a538" : "#c93434");

  return (
    <div className="mc-card">
      <div className="mc-card__head">
        <div>
          <div className="mc-card__eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="target" size={13} /> Benchmark anónimo
          </div>
          <div className="mc-card__title mt-4">Cómo estás vs. otros campos</div>
        </div>
        {data && <span className="mc-badge mc-badge--neutral"><span className="mc-badge__dot" />{data.cohorteN} establecimientos</span>}
      </div>

      {cargando ? (
        <div className="text-sm text-muted" style={{ padding: "8px 0" }}>Calculando…</div>
      ) : !data || data.metricas.length === 0 ? (
        <div className="mc-empty">
          <div className="mc-empty__icon"><Icon name="target" size={20} /></div>
          <div className="mc-empty__text">
            Cargá costos y márgenes de tus lotes para activar la comparación contra otros productores.
          </div>
        </div>
      ) : (
        <div className="col gap-16">
          {!data.disponible && <div className="text-xs text-muted">{data.mensaje}</div>}
          {data.metricas.map((m) => (
            <div key={m.clave}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span className="text-sm" style={{ color: "var(--mc-text-2)" }}>{m.label}</span>
                <span className="font-semi" style={{ color: "var(--mc-ink)" }}>
                  ${m.valor.toLocaleString("es-AR")}<span className="text-xs text-muted"> {m.unidad}</span>
                </span>
              </div>
              {data.disponible && (
                <>
                  <div style={{ position: "relative", height: 8, borderRadius: 999, background: "var(--mc-surface-3, #ece9e1)" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.max(4, m.percentil)}%`, borderRadius: 999, background: tono(m.percentil) }} />
                    {/* marca de la mediana */}
                    <div title="Mediana" style={{ position: "absolute", left: "50%", top: -2, bottom: -2, width: 2, background: "#9b968a" }} />
                  </div>
                  <div className="row" style={{ justifyContent: "space-between", marginTop: 4 }}>
                    <span className="text-xs" style={{ color: tono(m.percentil), fontWeight: 600 }}>
                      Mejor que el {m.percentil}% de los campos
                    </span>
                    <span className="text-xs text-muted">Mediana ${m.mediana.toLocaleString("es-AR")}</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
