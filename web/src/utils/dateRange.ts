import type { StatsPorDiaRow } from "../lib/database.types";

export interface DiaDelRango {
  iso: string;
  fecha: Date;
  diasAtras: number;
  cantidad: number;
}

/**
 * Relleno de días en cero para que el gráfico de "pedidos por día" no se vea
 * vacío con pocos datos.
 */
export function construirRangoDias(porDiaArray: StatsPorDiaRow[] | null | undefined, dias: number): DiaDelRango[] {
  const mapa: Record<string, number> = {};
  (porDiaArray ?? []).forEach((d) => {
    mapa[d.dia] = Number(d.cantidad) || 0;
  });

  // "hoy" se calcula en UTC (Date.UTC), no con setHours() en hora local --
  // en un huso horario detrás de UTC (como Argentina, UTC-3) las últimas ~3
  // horas de cada día calculaban mal el "iso" de hoy con setHours().
  const resultado: DiaDelRango[] = [];
  const ahora = new Date();
  const hoyUTC = Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate());

  for (let i = dias - 1; i >= 0; i--) {
    const fecha = new Date(hoyUTC - i * 24 * 60 * 60 * 1000);
    const iso = fecha.toISOString().slice(0, 10);
    resultado.push({ iso, fecha, diasAtras: i, cantidad: mapa[iso] ?? 0 });
  }

  return resultado;
}
