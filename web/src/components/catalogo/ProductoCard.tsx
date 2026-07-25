import { useState } from "react";
import type { ProductoRow } from "../../lib/database.types";
import { formatMoneda, parseCantidadDecimal } from "../../utils/format";
import { useCart } from "../../context/CartContext";
import { fotoProductoUrl } from "../../lib/supabaseClient";

const PASO_POR_UNIDAD: Record<ProductoRow["unidad"], number> = { kg: 0.5, caja: 1, unidad: 1 };

export function ProductoCard({ producto }: { producto: ProductoRow }) {
  const { items, addItem } = useCart();
  const paso = PASO_POR_UNIDAD[producto.unidad];
  const [cantidadTexto, setCantidadTexto] = useState(String(paso));
  const agotado = producto.stock <= 0;
  // Persiste mientras el producto siga en el carrito (no un timeout que
  // desaparece solo) -- pedido explícito del dueño.
  const enCarrito = items.some((i) => i.productoId === producto.id);

  return (
    <div className="producto-card">
      <div className="producto-card-img">
        {producto.imagen_url ? (
          <img src={fotoProductoUrl(producto.imagen_url)} alt={producto.nombre} loading="lazy" />
        ) : (
          <div className="producto-card-img-placeholder" aria-hidden="true" />
        )}
        {producto.categoria === "combo" && <span className="producto-badge-categoria">Combo</span>}
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
              type="text"
              inputMode="decimal"
              className="producto-cantidad"
              value={cantidadTexto}
              onChange={(e) => {
                const val = e.target.value;
                // solo dígitos y un separador decimal (coma o punto) mientras se tipea
                if (/^[0-9]*[.,]?[0-9]*$/.test(val)) setCantidadTexto(val);
              }}
              onBlur={() => setCantidadTexto(String(parseCantidadDecimal(cantidadTexto, paso)))}
              aria-label={`Cantidad de ${producto.nombre}`}
            />
            <button
              type="button"
              className="btn btn-dark"
              onClick={() => {
                const cantidad = parseCantidadDecimal(cantidadTexto, paso);
                setCantidadTexto(String(cantidad));
                addItem(producto, cantidad);
              }}
            >
              Agregar
            </button>
            {enCarrito && (
              <span className="producto-agregado-check" title="Ya está en tu carrito">
                ✓
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
