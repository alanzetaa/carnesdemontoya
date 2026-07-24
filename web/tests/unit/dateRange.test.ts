import { describe, expect, it } from "vitest";
import { construirRangoDias } from "../../src/utils/dateRange";

describe("construirRangoDias", () => {
  it("devuelve la cantidad de días pedida, terminando hoy", () => {
    const rango = construirRangoDias([], 7);
    expect(rango).toHaveLength(7);
    expect(rango[rango.length - 1].diasAtras).toBe(0);
    expect(rango[0].diasAtras).toBe(6);
  });

  it("rellena en cero los días sin datos y respeta los que sí tienen", () => {
    const hoyIso = new Date().toISOString().slice(0, 10);
    const rango = construirRangoDias([{ dia: hoyIso, cantidad: 5 }], 3);
    const hoy = rango[rango.length - 1];
    expect(hoy.cantidad).toBe(5);
    expect(rango[0].cantidad).toBe(0);
  });
});
