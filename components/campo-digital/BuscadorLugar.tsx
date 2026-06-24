"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/mc";

type Resultado = { display_name: string; lat: string; lon: string };

/**
 * Buscador de lugares estilo Google Maps para el mapa (usa nuestro proxy
 * /api/geo/search con caché). Al elegir un resultado, llama onElegir con las
 * coordenadas para que el mapa vuele hasta ahí.
 */
export default function BuscadorLugar({
  onElegir,
  placeholder = "Buscar lugar…",
  width = 220,
}: {
  onElegir: (p: { lat: number; lng: number; nombre: string }) => void;
  placeholder?: string;
  width?: number;
}) {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (q.trim().length < 3) {
      setResultados([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setBuscando(true);
      fetch(`/api/geo/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { resultados: [] }))
        .then((d) => {
          setResultados(Array.isArray(d.resultados) ? d.resultados : []);
          setAbierto(true);
        })
        .catch(() => {})
        .finally(() => setBuscando(false));
    }, 450);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q]);

  const elegir = (r: Resultado) => {
    onElegir({ lat: Number(r.lat), lng: Number(r.lon), nombre: r.display_name });
    setQ("");
    setResultados([]);
    setAbierto(false);
  };

  return (
    <div style={{ position: "relative", width }}>
      <div className="mc-glass" style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 10, padding: "0 10px", height: 32 }}>
        <Icon name="search" size={14} style={{ color: "var(--mc-text-3)", flexShrink: 0 }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => resultados.length && setAbierto(true)}
          placeholder={placeholder}
          style={{ border: "none", background: "transparent", outline: "none", fontSize: 12.5, color: "var(--mc-ink)", width: "100%" }}
        />
      </div>
      {abierto && (buscando || resultados.length > 0) && (
        <>
          <div onClick={() => setAbierto(false)} style={{ position: "fixed", inset: 0, zIndex: 559 }} />
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, zIndex: 560, background: "var(--mc-surface)", border: "1px solid var(--mc-line)", borderRadius: 10, boxShadow: "var(--sh-lg)", maxHeight: 240, overflowY: "auto" }}>
            {buscando && <div className="text-xs text-muted" style={{ padding: "8px 10px" }}>Buscando…</div>}
            {!buscando &&
              resultados.map((r, i) => (
                <button
                  key={i}
                  onClick={() => elegir(r)}
                  style={{ display: "flex", gap: 7, alignItems: "flex-start", width: "100%", textAlign: "left", padding: "8px 10px", border: "none", borderBottom: i < resultados.length - 1 ? "1px solid var(--mc-surface-2)" : "none", background: "transparent", cursor: "pointer", fontSize: 12, color: "var(--mc-ink)", lineHeight: 1.3 }}
                >
                  <Icon name="map" size={12} style={{ color: "var(--mc-green-700)", flexShrink: 0, marginTop: 1 }} />
                  <span>{r.display_name}</span>
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
