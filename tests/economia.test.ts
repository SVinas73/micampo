import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock de Prisma antes de importar la lib que lo usa.
// vi.hoisted evita el error de "variable usada antes de inicializar" en el factory hoisteado.
const { lote, costoLote, margenBruto } = vi.hoisted(() => ({
  lote: { findMany: vi.fn() },
  costoLote: { findMany: vi.fn() },
  margenBruto: { findMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: { lote, costoLote, margenBruto } }));

import { resumenEconomicoLotes } from "@/lib/economia";

describe("finanzas · resumenEconomicoLotes", () => {
  beforeEach(() => {
    lote.findMany.mockReset();
    costoLote.findMany.mockReset();
    margenBruto.findMany.mockReset();
  });

  it("usa MargenBruto cuando existe y calcula $/ha correctamente", async () => {
    lote.findMany.mockResolvedValue([{ id: "L1", nombre: "Norte 1", hectareas: 100, cultivo: "Soja" }]);
    costoLote.findMany.mockResolvedValue([{ loteId: "L1", costoTotal: 30000, monto: 0 }]);
    margenBruto.findMany.mockResolvedValue([
      { referenciaId: "L1", tipo: "Lote", ingresos: 50000, costos: 30000, margen: 0, createdAt: new Date() },
    ]);

    const [r] = await resumenEconomicoLotes("u1");
    expect(r.fuente).toBe("margen-bruto");
    expect(r.ingresos).toBe(50000);
    expect(r.costos).toBe(30000);
    expect(r.margen).toBe(20000); // ingresos - costos
    expect(r.margenPorHa).toBe(200); // 20000 / 100
    expect(r.costoPorHa).toBe(300);
    expect(Math.round(r.porcentajeMargen)).toBe(40);
  });

  it("cae a costos acumulados cuando no hay MargenBruto", async () => {
    lote.findMany.mockResolvedValue([{ id: "L2", nombre: "Sur 1", hectareas: 50, cultivo: "Maíz" }]);
    costoLote.findMany.mockResolvedValue([
      { loteId: "L2", costoTotal: 10000, monto: 0 },
      { loteId: "L2", costoTotal: 5000, monto: 0 },
    ]);
    margenBruto.findMany.mockResolvedValue([]);

    const [r] = await resumenEconomicoLotes("u1");
    expect(r.fuente).toBe("costos");
    expect(r.costos).toBe(15000);
    expect(r.costoPorHa).toBe(300);
    expect(r.ingresos).toBe(0);
    expect(r.margenPorHa).toBe(-300); // sin ingresos, margen negativo = -costos
  });

  it("marca sin-datos cuando no hay costos ni margen", async () => {
    lote.findMany.mockResolvedValue([{ id: "L3", nombre: "Loma", hectareas: 40, cultivo: null }]);
    costoLote.findMany.mockResolvedValue([]);
    margenBruto.findMany.mockResolvedValue([]);

    const [r] = await resumenEconomicoLotes("u1");
    expect(r.fuente).toBe("sin-datos");
    expect(r.costoPorHa).toBe(0);
    expect(r.margenPorHa).toBe(0);
  });

  it("evita división por cero con hectáreas en 0", async () => {
    lote.findMany.mockResolvedValue([{ id: "L4", nombre: "X", hectareas: 0, cultivo: null }]);
    costoLote.findMany.mockResolvedValue([{ loteId: "L4", costoTotal: 1000, monto: 0 }]);
    margenBruto.findMany.mockResolvedValue([]);

    const [r] = await resumenEconomicoLotes("u1");
    expect(r.costoPorHa).toBe(0);
    expect(r.margenPorHa).toBe(0);
  });
});
