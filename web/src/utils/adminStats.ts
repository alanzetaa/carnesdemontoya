import type { StatsResumenRow } from "../lib/database.types";
import { formatMoneda } from "./format";

export interface StatTile {
  valor: string;
  etiqueta: string;
  color: string;
}

export function buildStatsTiles(resumen: StatsResumenRow | null | undefined): StatTile[] {
  const r = resumen ?? { total_miembros: 0, total_pedidos: 0, pedidos_pendientes: 0, ingresos_confirmados: 0 };
  return [
    { valor: String(r.pedidos_pendientes), etiqueta: "Pedidos pendientes", color: "#c9a227" },
    { valor: String(r.total_pedidos), etiqueta: "Pedidos totales", color: "#8a6a3a" },
    { valor: String(r.total_miembros), etiqueta: "Clientes registrados", color: "#6b4a2f" },
    { valor: formatMoneda(r.ingresos_confirmados), etiqueta: "Ingresos (no cancelados)", color: "#16a34a" },
  ];
}
