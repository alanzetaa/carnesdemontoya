import type { EstadoPedido } from "../../lib/database.types";

export const ESTADO_LABELS: Record<EstadoPedido, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const ESTADO_COLORS: Record<EstadoPedido, string> = {
  pendiente: "#c9a227",
  confirmado: "#4895ef",
  entregado: "#16a34a",
  cancelado: "#e07a5f",
};

export function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  return (
    <span className="estado-badge" style={{ "--estado-color": ESTADO_COLORS[estado] } as React.CSSProperties}>
      {ESTADO_LABELS[estado]}
    </span>
  );
}
