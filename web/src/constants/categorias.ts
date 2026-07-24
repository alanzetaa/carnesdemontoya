import type { Categoria } from "../lib/database.types";

export const CATEGORIA_LABELS: Record<Categoria, string> = {
  corte: "Cortes",
  combo: "Combos y cajas",
};

export const CATEGORIA_COLORS: Record<Categoria, string> = {
  corte: "#c9a227",
  combo: "#8a6a3a",
};
