"use client";

/**
 * Sparkline minimalista en SVG. Dibuja una mini-tendencia a partir de una serie
 * de números, con relleno suave. Pensado para vivir dentro de una card KPI.
 */
export function Sparkline({
  data,
  color = "#5e7733",
  width = 96,
  height = 28,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const puntos = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * w;
    const y = pad + h - ((v - min) / span) * h;
    return [x, y] as const;
  });
  const linea = puntos.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${linea} L${puntos[puntos.length - 1][0].toFixed(1)} ${height} L${puntos[0][0].toFixed(1)} ${height} Z`;
  const id = `sl-${Math.round(puntos[0][1] * 1000) % 100000}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={linea} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
