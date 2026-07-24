import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "../context/ToastContext";
import { AdminStatsRow } from "../components/admin/AdminStatsRow";
import { BarChart } from "../components/admin/BarChart";
import { AdminPedidosTable } from "../components/admin/AdminPedidosTable";
import { AdminProductosTable } from "../components/admin/AdminProductosTable";
import { AdminMiembrosTable } from "../components/admin/AdminMiembrosTable";
import { ProductoFormModal } from "../components/admin/ProductoFormModal";
import { SuspendModal } from "../components/admin/SuspendModal";
import { buildStatsTiles } from "../utils/adminStats";
import { pedidosPorDiaChartItems } from "../utils/adminCharts";
import type { AdminMiembroRow, AdminPedidoRow, EstadoPedido, ProductoRow, StatsResumenRow, StatsPorDiaRow } from "../lib/database.types";

type Tab = "resumen" | "pedidos" | "stock" | "miembros";

interface AdminDashboardData {
  resumen: StatsResumenRow | null;
  pedidosPorDia: StatsPorDiaRow[];
  pedidos: AdminPedidoRow[];
  productos: ProductoRow[];
  miembros: AdminMiembroRow[];
}

const QUERY_KEY = ["adminDashboard"];

export function AdminPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("resumen");
  const [productoEnEdicion, setProductoEnEdicion] = useState<ProductoRow | null>(null);
  const [formularioProductoAbierto, setFormularioProductoAbierto] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<{ id: string; nombre: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<AdminDashboardData> => {
      const [resumenRes, pedidosPorDiaRes, pedidosRes, productosRes, miembrosRes] = await Promise.all([
        supabase.rpc("admin_stats_resumen"),
        supabase.rpc("admin_stats_pedidos_por_dia"),
        supabase.rpc("admin_listar_pedidos"),
        supabase.from("productos").select("*").order("categoria").order("orden"),
        supabase.rpc("admin_listar_miembros"),
      ]);
      return {
        resumen: resumenRes.data?.[0] ?? null,
        pedidosPorDia: pedidosPorDiaRes.data ?? [],
        pedidos: pedidosRes.data ?? [],
        productos: productosRes.data ?? [],
        miembros: miembrosRes.data ?? [],
      };
    },
  });

  const statsTiles = useMemo(() => buildStatsTiles(data?.resumen), [data?.resumen]);
  const pedidosPorDiaItems = useMemo(
    () => pedidosPorDiaChartItems(data?.pedidosPorDia ?? [], "#c9a227"),
    [data?.pedidosPorDia]
  );

  function refetch() {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }

  async function handleCambiarEstadoPedido(id: string, estado: EstadoPedido) {
    const { error } = await supabase.rpc("admin_actualizar_estado_pedido", { p_pedido_id: id, p_nuevo_estado: estado });
    if (error) {
      showToast(`Error: ${error.message}`);
      return;
    }
    showToast("Estado del pedido actualizado.");
    refetch();
  }

  async function handleToggleActivo(producto: ProductoRow) {
    const { error } = await supabase.from("productos").update({ activo: !producto.activo }).eq("id", producto.id);
    if (error) {
      showToast(`Error: ${error.message}`);
      return;
    }
    refetch();
  }

  async function handleEliminarProducto(producto: ProductoRow) {
    if (!window.confirm(`¿Eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from("productos").delete().eq("id", producto.id);
    if (error) {
      showToast(`Error: ${error.message}`);
      return;
    }
    showToast("Producto eliminado.");
    refetch();
  }

  async function handleReactivarMiembro(id: string) {
    const { error } = await supabase.rpc("admin_suspender_usuario", { target_id: id, hasta: null });
    if (error) {
      showToast(`Error: ${error.message}`);
      return;
    }
    showToast("Cuenta reactivada.");
    refetch();
  }

  async function handleEliminarMiembro(id: string, nombre: string) {
    if (
      !window.confirm(`¿Eliminar el perfil de ${nombre}? Esto borra sus datos (la cuenta para iniciar sesión no se elimina).`)
    )
      return;
    const { error } = await supabase.rpc("admin_eliminar_perfil", { target_id: id });
    if (error) {
      showToast(`Error: ${error.message}`);
      return;
    }
    showToast("Perfil eliminado.");
    refetch();
  }

  async function handleSuspenderConfirm(hastaIso: string) {
    if (!suspendTarget) return;
    const { error } = await supabase.rpc("admin_suspender_usuario", { target_id: suspendTarget.id, hasta: hastaIso });
    if (error) {
      showToast(`Error: ${error.message}`);
      return;
    }
    setSuspendTarget(null);
    showToast("Cuenta suspendida.");
    refetch();
  }

  return (
    <div className="app-content-inner app-content-wide">
      <h2>HQ De Montoya</h2>
      <p className="hint">Stock, pedidos y clientes de la plataforma, en un solo lugar.</p>

      <div className="admin-tabs">
        {(["resumen", "pedidos", "stock", "miembros"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={"admin-tab" + (tab === t ? " active" : "")}
            onClick={() => setTab(t)}
          >
            {t === "resumen" ? "Resumen" : t === "pedidos" ? "Pedidos" : t === "stock" ? "Stock" : "Clientes"}
          </button>
        ))}
      </div>

      {tab === "resumen" && (
        <>
          <AdminStatsRow tiles={statsTiles} />
          <div className="card admin-chart-card" style={{ marginTop: 16 }}>
            <h3>Pedidos por día (últimos 30 días)</h3>
            <div className="admin-chart">
              <BarChart items={pedidosPorDiaItems} />
            </div>
          </div>
        </>
      )}

      {tab === "pedidos" && (
        <AdminPedidosTable
          pedidos={data?.pedidos ?? []}
          isLoading={isLoading}
          onCambiarEstado={(id, estado) => void handleCambiarEstadoPedido(id, estado)}
        />
      )}

      {tab === "stock" && (
        <>
          <div className="form-actions" style={{ justifyContent: "flex-start", marginBottom: 12 }}>
            <button
              type="button"
              className="btn btn-dark"
              onClick={() => {
                setProductoEnEdicion(null);
                setFormularioProductoAbierto(true);
              }}
            >
              + Nuevo producto
            </button>
          </div>
          <AdminProductosTable
            productos={data?.productos ?? []}
            isLoading={isLoading}
            onEditar={(p) => {
              setProductoEnEdicion(p);
              setFormularioProductoAbierto(true);
            }}
            onEliminar={(p) => void handleEliminarProducto(p)}
            onToggleActivo={(p) => void handleToggleActivo(p)}
          />
        </>
      )}

      {tab === "miembros" && (
        <AdminMiembrosTable
          members={data?.miembros ?? []}
          isLoading={isLoading}
          onSuspender={(id, nombre) => setSuspendTarget({ id, nombre })}
          onReactivar={(id) => void handleReactivarMiembro(id)}
          onEliminar={(id, nombre) => void handleEliminarMiembro(id, nombre)}
        />
      )}

      <ProductoFormModal
        open={formularioProductoAbierto}
        producto={productoEnEdicion}
        onClose={() => setFormularioProductoAbierto(false)}
        onSaved={refetch}
      />

      <SuspendModal
        open={Boolean(suspendTarget)}
        targetName={suspendTarget?.nombre ?? ""}
        onClose={() => setSuspendTarget(null)}
        onConfirm={(hasta) => void handleSuspenderConfirm(hasta)}
      />
    </div>
  );
}
