import { useState } from "react";
import type { AdminPedidoRow, EstadoPedido } from "../../lib/database.types";
import { formatFecha, formatMoneda, formatWhatsappDisplay } from "../../utils/format";
import { EstadoBadge } from "../pedidos/EstadoBadge";
import { CambiarEstadoModal } from "./CambiarEstadoModal";

const ESTADOS: EstadoPedido[] = ["pendiente", "confirmado", "entregado", "cancelado"];

interface Props {
  pedidos: AdminPedidoRow[];
  isLoading?: boolean;
  onCambiarEstado: (id: string, estado: EstadoPedido, mensaje: string | null) => void;
}

export function AdminPedidosTable({ pedidos, isLoading, onCambiarEstado }: Props) {
  const [pendiente, setPendiente] = useState<{ pedido: AdminPedidoRow; estado: EstadoPedido } | null>(null);

  if (isLoading) return <p className="hint">Cargando…</p>;
  if (pedidos.length === 0) return <p className="hint">Todavía no hay pedidos.</p>;

  return (
    <div className="admin-pedidos-list">
      {pedidos.map((p) => (
        <div className="pedido-card" key={p.id}>
          <div className="pedido-card-header">
            <span>
              <strong>
                {p.comprador_nombre} {p.comprador_apellido}
              </strong>{" "}
              — {formatFecha(p.created_at)}
            </span>
            <EstadoBadge estado={p.estado} />
          </div>
          <ul className="pedido-items-list">
            {p.items.map((it, i) => (
              <li key={i}>
                {it.cantidad} × {it.nombre_producto} — {formatMoneda(it.subtotal)}
              </li>
            ))}
          </ul>
          <p className="hint" style={{ margin: "4px 0" }}>
            {p.comprador_email} · {formatWhatsappDisplay(p.whatsapp_contacto)}
            <br />
            Envío a: {p.direccion_envio}
            {p.notas && (
              <>
                <br />
                Notas: {p.notas}
              </>
            )}
          </p>
          <div className="pedido-card-footer">
            <p className="pedido-total">Total: {formatMoneda(p.total)}</p>
            <select
              value={p.estado}
              onChange={(e) => setPendiente({ pedido: p, estado: e.target.value as EstadoPedido })}
            >
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}

      <CambiarEstadoModal
        open={pendiente !== null}
        clienteNombre={pendiente ? `${pendiente.pedido.comprador_nombre} ${pendiente.pedido.comprador_apellido}` : ""}
        nuevoEstado={pendiente?.estado ?? null}
        mensajeActual={pendiente?.pedido.mensaje_admin ?? null}
        onClose={() => setPendiente(null)}
        onConfirm={(mensaje) => {
          if (!pendiente) return;
          onCambiarEstado(pendiente.pedido.id, pendiente.estado, mensaje);
          setPendiente(null);
        }}
      />
    </div>
  );
}
