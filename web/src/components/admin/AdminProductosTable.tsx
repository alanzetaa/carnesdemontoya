import type { ProductoRow } from "../../lib/database.types";
import { formatMoneda } from "../../utils/format";

interface Props {
  productos: ProductoRow[];
  isLoading?: boolean;
  onEditar: (producto: ProductoRow) => void;
  onEliminar: (producto: ProductoRow) => void;
  onToggleActivo: (producto: ProductoRow) => void;
}

export function AdminProductosTable({ productos, isLoading, onEditar, onEliminar, onToggleActivo }: Props) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={6} className="hint" style={{ padding: 20 }}>
                Cargando…
              </td>
            </tr>
          ) : productos.length === 0 ? (
            <tr>
              <td colSpan={6} className="hint" style={{ padding: 20 }}>
                Todavía no cargaste productos.
              </td>
            </tr>
          ) : (
            productos.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>{p.categoria === "corte" ? "Corte" : "Combo"}</td>
                <td>
                  {formatMoneda(p.precio)} / {p.unidad}
                </td>
                <td>
                  {p.stock} {p.unidad}
                </td>
                <td>
                  {p.activo ? (
                    <span className="admin-badge-activo">Visible</span>
                  ) : (
                    <span className="admin-badge-suspendido">Oculto</span>
                  )}
                </td>
                <td style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                  <button type="button" className="btn btn-outline-dark" onClick={() => onEditar(p)}>
                    Editar
                  </button>
                  <button type="button" className="btn btn-warning" onClick={() => onToggleActivo(p)}>
                    {p.activo ? "Ocultar" : "Mostrar"}
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => onEliminar(p)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
