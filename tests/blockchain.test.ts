import { describe, it, expect, vi, afterEach } from "vitest";
import { generarHashBlockchain, generarCodigoQR, verificarCadenaBlockchain } from "@/lib/blockchain";

describe("trazabilidad / blockchain", () => {
  afterEach(() => vi.useRealTimers());

  it("genera un hash SHA-256 (64 hex)", () => {
    const h = generarHashBlockchain({ producto: "Soja" });
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });

  it("es determinístico para los mismos datos y timestamp", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const a = generarHashBlockchain({ x: 1 }, "prev");
    const b = generarHashBlockchain({ x: 1 }, "prev");
    expect(a).toBe(b);
  });

  it("cambia el hash si cambian los datos", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const a = generarHashBlockchain({ x: 1 });
    const b = generarHashBlockchain({ x: 2 });
    expect(a).not.toBe(b);
  });

  it("verificarCadenaBlockchain valida un hash correcto y rechaza uno alterado", () => {
    const ts = new Date("2026-03-15T12:00:00.000Z");
    const data = { etapa: "Cosecha", kg: 1000 };
    const hash = verificarHashHelper(data, "anterior", ts);
    expect(verificarCadenaBlockchain(hash, data, "anterior", ts)).toBe(true);
    expect(verificarCadenaBlockchain(hash, { ...data, kg: 999 }, "anterior", ts)).toBe(false);
  });

  it("genera códigos QR con el prefijo MC- y son únicos", () => {
    const c1 = generarCodigoQR();
    const c2 = generarCodigoQR();
    expect(c1).toMatch(/^MC-\d+-[A-F0-9]+$/);
    expect(c1).not.toBe(c2);
  });
});

// Reproduce el cálculo de hash de la cadena para construir un caso válido
function verificarHashHelper(data: any, hashAnterior: string, timestamp: Date): string {
  // Mismo contenido que verificarCadenaBlockchain calcula internamente
  const crypto = require("crypto");
  const contenido = JSON.stringify({ data, timestamp: timestamp.toISOString(), hashAnterior });
  return crypto.createHash("sha256").update(contenido).digest("hex");
}
