import { describe, it, expect } from "vitest";
import { detectarFertilizante, dosisAgronomica, factorRindeZona, rindeReferencia, esLeguminosa } from "@/lib/prescripcion-agro";

describe("detección de fertilizante", () => {
  it("reconoce los fertilizantes comunes y su nutriente", () => {
    expect(detectarFertilizante("Urea")).toMatchObject({ nutriente: "N", pct: 46 });
    expect(detectarFertilizante("DAP")).toMatchObject({ nutriente: "P", pct: 46 });
    expect(detectarFertilizante("MAP")).toMatchObject({ nutriente: "P", pct: 52 });
    expect(detectarFertilizante("Cloruro de potasio")).toMatchObject({ nutriente: "K", pct: 60 });
    expect(detectarFertilizante("UAN")).toMatchObject({ nutriente: "N", pct: 32 });
    expect(detectarFertilizante("algo raro")).toBeNull();
  });
});

describe("dosis agronómica (balance de nutrientes)", () => {
  const urea = detectarFertilizante("Urea")!;
  const dap = detectarFertilizante("DAP")!;

  it("Maíz de alto rinde con Urea da una dosis realista (kg/ha)", () => {
    const d = dosisAgronomica({ fert: urea, cultivo: "Maíz", rinde: 8.5, suelo: null });
    // ~ (8.5×20 − 56) / 0.65 / 0.46
    expect(d.dosis).toBeGreaterThan(280);
    expect(d.dosis).toBeLessThan(460);
    expect(d.requerido).toBe(170);
  });

  it("acredita el N del suelo: más N en el análisis → menos fertilizante", () => {
    const pobre = dosisAgronomica({ fert: urea, cultivo: "Maíz", rinde: 8.5, suelo: { nitrogeno: 5, fosforo: 12, potasio: 150, pH: 6, materiaOrganica: 2 } });
    const rico = dosisAgronomica({ fert: urea, cultivo: "Maíz", rinde: 8.5, suelo: { nitrogeno: 30, fosforo: 12, potasio: 150, pH: 6, materiaOrganica: 4 } });
    expect(rico.aporte).toBeGreaterThan(pobre.aporte);
    expect(rico.dosis).toBeLessThan(pobre.dosis);
  });

  it("leguminosa (Soja) + N → dosis 0 (fija nitrógeno)", () => {
    expect(esLeguminosa("Soja")).toBe(true);
    expect(dosisAgronomica({ fert: urea, cultivo: "Soja", rinde: 4, suelo: null }).dosis).toBe(0);
  });

  it("fósforo (DAP) por extracción de grano, dosis realista", () => {
    const d = dosisAgronomica({ fert: dap, cultivo: "Maíz", rinde: 8.5, suelo: null });
    // 8.5×6 = 51 kg P2O5 / 0.9 / 0.46
    expect(d.dosis).toBeGreaterThan(80);
    expect(d.dosis).toBeLessThan(180);
  });

  it("suelo deficiente en P → más dosis que suelo suficiente", () => {
    const def = dosisAgronomica({ fert: dap, cultivo: "Maíz", rinde: 8.5, suelo: { nitrogeno: null, fosforo: 6, potasio: null, pH: null, materiaOrganica: null } });
    const suf = dosisAgronomica({ fert: dap, cultivo: "Maíz", rinde: 8.5, suelo: { nitrogeno: null, fosforo: 25, potasio: null, pH: null, materiaOrganica: null } });
    expect(def.dosis).toBeGreaterThan(suf.dosis);
  });
});

describe("factor de rinde por zona", () => {
  it("potenciar sube donde el vigor es alto; compensar al revés", () => {
    expect(factorRindeZona(0.75, 0.6, "potenciar")).toBeGreaterThan(1);
    expect(factorRindeZona(0.45, 0.6, "potenciar")).toBeLessThan(1);
    expect(factorRindeZona(0.75, 0.6, "compensar")).toBeLessThan(1);
    expect(factorRindeZona(0.45, 0.6, "compensar")).toBeGreaterThan(1);
  });
  it("queda acotado entre 0.75 y 1.25", () => {
    expect(factorRindeZona(0.99, 0.3, "potenciar")).toBeLessThanOrEqual(1.25);
    expect(factorRindeZona(0.05, 0.6, "potenciar")).toBeGreaterThanOrEqual(0.75);
  });
});

describe("rinde de referencia", () => {
  it("usa el del cultivo o un default", () => {
    expect(rindeReferencia("Maíz")).toBe(8.5);
    expect(rindeReferencia(null)).toBe(4.0);
  });
});
