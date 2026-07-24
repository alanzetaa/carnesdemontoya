import { describe, expect, it } from "vitest";
import {
  capitalizarNombre,
  formatFecha,
  formatFechaCorta,
  formatMoneda,
  formatWhatsappDisplay,
  normalizeWhatsapp,
  whatsappLink,
} from "../../src/utils/format";

describe("capitalizarNombre", () => {
  it("pone en mayúscula la primera letra de cada palabra", () => {
    expect(capitalizarNombre("justo montoya")).toBe("Justo Montoya");
  });
  it("respeta acentos y ñ", () => {
    expect(capitalizarNombre("ñandú pérez")).toBe("Ñandú Pérez");
  });
  it("devuelve string vacío para null/undefined", () => {
    expect(capitalizarNombre(null)).toBe("");
    expect(capitalizarNombre(undefined)).toBe("");
  });
});

describe("formatFecha / formatFechaCorta", () => {
  it("devuelve un guion largo para fechas nulas", () => {
    expect(formatFecha(null)).toBe("—");
    expect(formatFechaCorta(undefined)).toBe("—");
  });
  it("formatea una fecha ISO real sin tirar error", () => {
    expect(formatFecha("2026-07-07T12:30:00Z")).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(formatFechaCorta("2026-07-07T12:30:00Z")).toMatch(/\d{2}\/\d{2}\/\d{2}/);
  });
});

describe("formatMoneda", () => {
  it("formatea un número como pesos argentinos", () => {
    expect(formatMoneda(17300)).toMatch(/17\.300/);
  });
  it("trata null/undefined como 0", () => {
    expect(formatMoneda(null)).toMatch(/0/);
    expect(formatMoneda(undefined)).toMatch(/0/);
  });
});

describe("normalizeWhatsapp / formatWhatsappDisplay", () => {
  it("normaliza un número local sin 0 al formato 549...", () => {
    expect(normalizeWhatsapp("11 4123-4567")).toBe("5491141234567");
  });
  it("normaliza un número ya en formato internacional", () => {
    expect(normalizeWhatsapp("+54 9 11 1234-5678")).toBe("5491112345678");
  });
  it("da el mismo resultado normalizado sin importar cómo se tipeó", () => {
    expect(normalizeWhatsapp("011 1234-5678")).toBe(normalizeWhatsapp("+54 9 11 12345678"));
  });
  it("formatWhatsappDisplay agrupa los últimos 4 dígitos con guion", () => {
    expect(formatWhatsappDisplay("5491112345678")).toBe("+54 9 111234-5678");
  });
  it("formatWhatsappDisplay devuelve guion largo si no hay número", () => {
    expect(formatWhatsappDisplay(null)).toBe("—");
  });
});

describe("whatsappLink", () => {
  it("arma un link wa.me con el número normalizado", () => {
    expect(whatsappLink("5491112345678")).toBe("https://wa.me/5491112345678");
  });
  it("agrega el texto codificado si se pasa un mensaje", () => {
    expect(whatsappLink("5491112345678", "Hola")).toBe("https://wa.me/5491112345678?text=Hola");
  });
  it("devuelve '#' si no hay número", () => {
    expect(whatsappLink(null)).toBe("#");
  });
});
