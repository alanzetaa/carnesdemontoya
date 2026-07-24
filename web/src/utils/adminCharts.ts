import { construirRangoDias } from "./dateRange";
import type { StatsPorDiaRow } from "../lib/database.types";

export interface ChartBarItem {
  label: string;
  value: number;
  color?: string;
  tooltip?: string;
}

/** Últimos 30 días rellenados en cero, con etiqueta cada 6 días para no amontonar texto. */
export function pedidosPorDiaChartItems(data: StatsPorDiaRow[], color: string): ChartBarItem[] {
  return construirRangoDias(data, 30).map((d) => {
    const mostrarEtiqueta = d.diasAtras % 6 === 0;
    return {
      label: mostrarEtiqueta ? d.fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) : "",
      tooltip: d.fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }),
      value: d.cantidad,
      color,
    };
  });
}
