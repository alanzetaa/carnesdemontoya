import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { EstadoBadge } from "../components/pedidos/EstadoBadge";
import { formatFecha, formatMoneda } from "../utils/format";
import type { PedidoItemRow, PedidoRow } from "../lib/database.types";

type PedidoConItems = PedidoRow & { items: PedidoItemRow[] };

export function MisPedidosPage() {
  const { session } = useAuth();

  const { data: pedidos, isLoading } = useQuery({
    queryKey: ["mis-pedidos", session?.user.id],
    enabled: Boolean(session),
    queryFn: async (): Promise<PedidoConItems[]> => {
      const { data: pedidosData, error: pedidosError } = await supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false });
      if (pedidosError) throw pedidosError;
      if (!pedidosData || pedidosData.length === 0) return [];

      const { data: itemsData, error: itemsError } = await supabase
        .from("pedido_items")
        .select("*")
        .in(
          "pedido_id",
          pedidosData.map((p) => p.id)
        );
      if (itemsError) throw itemsError;

      return pedidosData.map((p) => ({
        ...p,
        items: (itemsData ?? []).filter((it) => it.pedido_id === p.id),
      }));
    },
  });

  return (
    <div className="app-content-inner">
      <h2>Mis pedidos</h2>

      {isLoading && <p className="hint">Cargando…</p>}
      {!isLoading && (pedidos ?? []).length === 0 && <p className="hint">Todavía no hiciste ningún pedido.</p>}

      {(pedidos ?? []).map((pedido) => (
        <div className="pedido-card" key={pedido.id}>
          <div className="pedido-card-header">
            <span>{formatFecha(pedido.created_at)}</span>
            <EstadoBadge estado={pedido.estado} />
          </div>
          <ul className="pedido-items-list">
            {pedido.items.map((it) => (
              <li key={it.id}>
                {it.cantidad} × {it.nombre_producto} — {formatMoneda(it.subtotal)}
              </li>
            ))}
          </ul>
          <p className="pedido-total">Total: {formatMoneda(pedido.total)}</p>
          <p className="hint" style={{ margin: 0 }}>
            Envío a: {pedido.direccion_envio}
          </p>
          {pedido.mensaje_admin && <p className="pedido-mensaje-admin">De Montoya: {pedido.mensaje_admin}</p>}
        </div>
      ))}
    </div>
  );
}
