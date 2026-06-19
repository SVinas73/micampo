import { describe, it, expect } from "vitest";
import { parseJsonTolerante } from "@/lib/ia";

describe("lib/ia · parseJsonTolerante", () => {
  it("parsea JSON limpio", () => {
    expect(parseJsonTolerante('{"a":1}')).toEqual({ a: 1 });
  });

  it("extrae JSON embebido en texto del modelo", () => {
    const texto = 'Claro, acá tenés el resultado:\n{"alertas": [{"tipo":"Clima"}]}\nEspero que sirva.';
    expect(parseJsonTolerante(texto)).toEqual({ alertas: [{ tipo: "Clima" }] });
  });

  it("extrae arrays embebidos", () => {
    expect(parseJsonTolerante("resultado: [1,2,3]")).toEqual([1, 2, 3]);
  });

  it("devuelve null cuando no hay JSON", () => {
    expect(parseJsonTolerante("sin json acá")).toBeNull();
  });
});
