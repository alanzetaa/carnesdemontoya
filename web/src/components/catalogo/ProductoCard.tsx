import { useState } from "react";
import type { ProductoRow } from "../../lib/database.types";
import { formatMoneda } from "../../utils/format";
import { useCart } from "../../context/CartContext";
import { fotoProductoUrl } from "../../lib/supabaseClient";

const PASO_POR_UNIDAD: Record<ProductoRow["unidad"], number> = { kg: 0.5, caja: 1, unidad: 1 };

export function ProductoCard({ producto }: { producto: ProductoRow }) {
  const { addItem } = useCart();
  const paso = PASO_POR_UNIDAD[producto.unidad];
  const [cantidad, setCantidad] = useState(paso);
  const agotado = producto.stock <= 0;

  return (
    <div className="producto-card">
      <div className="producto-card-img">
        {producto.imagen_url ? (
          <img src={fotoProductoUrl(producto.imagen_url)} alt={producto.nombre} loading="lazy" />
        ) : (
          <div className="producto-card-img-placeholder" aria-hidden="true" />
        )}
        {agotado && <span className="producto-badge-agotado">Agotado</span>}
      </div>
      <div className="producto-card-body">
        <h3>{producto.nombre}</h3>
        {producto.peso_referencia && <p className="producto-peso">{producto.peso_referencia}</p>}
        {producto.descripcion && <p className="producto-descripcion">{producto.descripcion}</p>}
        <p className="producto-precio">
          {formatMoneda(producto.precio)} <span>/ {producto.unidad}</span>
        </p>
        {!agotado && (
          <div className="producto-card-actions">
            <input
              type="number"
              className="producto-cantidad"
              min={paso}
              step={paso}
              value={cantidad}
              onChange={(e) => setCantidad(Math.max(paso, Number(e.target.value) || paso))}
              aria-label={`Cantidad de ${producto.nombre}`}
            />
            <button
              type="button"
              className="btn btn-dark"
              onClick={() => {
                addItem(producto, cantidad);
                setCantidad(paso);
              }}
            >
              Agregar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
