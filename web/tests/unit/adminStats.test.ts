import { describe, expect, it } from "vitest";
import { buildStatsTiles } from "../../src/utils/adminStats";

describe("buildStatsTiles", () => {
  it("usa ceros cuando no hay resumen todavía", () => {
    const tiles = buildStatsTiles(null);
    expect(tiles.find((t) => t.etiqueta === "Pedidos totales")?.valor).toBe("0");
  });

  it("mapea cada campo del resumen a su tile", () => {
    const tiles = buildStatsTiles({
      total_miembros: 12,
      total_pedidos: 30,
      pedidos_pendientes: 4,
      ingresos_confirmados: 150000,
    });
    expect(tiles.find((t) => t.etiqueta === "Pedidos pendientes")?.valor).toBe("4");
    expect(tiles.find((t) => t.etiqueta === "Clientes registrados")?.valor).toBe("12");
    expect(tiles.find((t) => t.etiqueta === "Ingresos (no cancelados)")?.valor).toMatch(/150\.000/);
  });
});
