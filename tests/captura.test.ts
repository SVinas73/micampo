import { describe, it, expect, vi } from "vitest";

// El parser heurístico no usa IA ni red; mockeamos lib/ia para que no toque nada.
vi.mock("@/lib/ia", () => ({
  getAnthropic: () => null,
  IA_MODEL: "test",
  parseJsonTolerante: () => null,
  modeloPropio: async () => null,
}));

import { parseHeuristico, TIPOS_LABOR } from "@/lib/captura";

const LOTES = [
  { id: "L1", nombre: "Norte 1" },
  { id: "L4", nombre: "Lote 4 - El Bajo" },
];

describe("captura · parseHeuristico", () => {
  it("detecta el tipo de labor por palabra clave", () => {
    expect(parseHeuristico("sembré algo", LOTES).labor.tipoLabor).toBe("Siembra");
    expect(parseHeuristico("pulvericé glifosato", LOTES).labor.tipoLabor).toBe("Pulverización");
    expect(parseHeuristico("apliqué fertilizante", LOTES).labor.tipoLabor).toBe("Fertilización");
    expect(parseHeuristico("coseché el maíz", LOTES).labor.tipoLabor).toBe("Cosecha");
  });

  it("empareja el lote por nombre y por número (lote N)", () => {
    const r1 = parseHeuristico("sembré soja en Norte 1 hoy", LOTES);
    expect(r1.labor.loteId).toBe("L1");
    const r2 = parseHeuristico("pulvericé el lote 4 ayer", LOTES);
    expect(r2.labor.loteId).toBe("L4");
  });

  it("interpreta fechas relativas (ayer)", () => {
    const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
    expect(parseHeuristico("regué ayer el Norte 1", LOTES).labor.fechaISO).toBe(ayer.toISOString().split("T")[0]);
  });

  it("baja la confianza cuando no identifica el lote", () => {
    const r = parseHeuristico("monitoreé un poco", LOTES);
    expect(r.labor.loteId).toBeNull();
    expect(r.confianza).toBeLessThan(70);
    expect(TIPOS_LABOR).toContain(r.labor.tipoLabor);
  });
});
