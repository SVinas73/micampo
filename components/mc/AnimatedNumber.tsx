"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Contador animado. Recibe un texto que puede contener un número
 * ("$1.234", "82%", "1,2M") y anima solo la parte numérica, conservando
 * prefijo y sufijo. Si no encuentra número, renderiza el texto tal cual.
 */
export function AnimatedNumber({ value, duration = 900 }: { value: React.ReactNode; duration?: number }) {
  const texto = typeof value === "string" || typeof value === "number" ? String(value) : null;

  // Extraer el primer número (admite . y , como separadores)
  const match = texto?.match(/-?[\d][\d.,]*/);
  const [display, setDisplay] = useState<string>(texto ?? "");
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (texto == null || !match) {
      setDisplay(texto ?? "");
      return;
    }
    const raw = match[0];
    // Detectar separador decimal: si hay coma seguida de 1-2 dígitos al final
    const usaComaDecimal = /,\d{1,2}$/.test(raw);
    const limpio = usaComaDecimal ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(/,/g, "");
    const objetivo = parseFloat(limpio);
    if (!isFinite(objetivo)) {
      setDisplay(texto);
      return;
    }
    const decimales = (limpio.split(".")[1] || "").length;
    const prefijo = texto.slice(0, match.index!);
    const sufijo = texto.slice(match.index! + raw.length);
    const inicio = performance.now();
    const desde = 0;

    const fmt = (n: number) => {
      const s = n.toLocaleString("es-AR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
      return `${prefijo}${s}${sufijo}`;
    };

    const tick = (now: number) => {
      const t = Math.min(1, (now - inicio) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(fmt(desde + (objetivo - desde) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else setDisplay(texto);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  if (texto == null) return <>{value}</>;
  return <>{display}</>;
}
