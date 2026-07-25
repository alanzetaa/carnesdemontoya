import { useMemo } from "react";
import { useProductos } from "../hooks/useProductos";
import { ProductoCard } from "../components/catalogo/ProductoCard";

export function CatalogoPage() {
  const { data: productos, isLoading } = useProductos();

  // Cortes primero, combos después, pero en una sola grilla -- separarlos
  // en secciones distintas dejaba filas a medio llenar (ej. un solo corte
  // desperdiciando el resto del ancho) cuando la cantidad de productos por
  // categoría no completa una fila entera.
  const ordenados = useMemo(() => {
    const lista = productos ?? [];
    return [...lista].sort((a, b) => {
      if (a.categoria !== b.categoria) return a.categoria === "corte" ? -1 : 1;
      return a.orden - b.orden;
    });
  }, [productos]);

  return (
    <div className="app-content-inner app-content-wide">
      <h2>Productos</h2>
      <p className="hint">Elegí tus cortes y combos, agregalos al carrito y confirmá tu pedido.</p>

      {isLoading && <p className="hint">Cargando catálogo…</p>}

      {ordenados.length > 0 && (
        <div className="producto-grid" style={{ marginTop: 20 }}>
          {ordenados.map((p) => (
            <ProductoCard key={p.id} producto={p} />
          ))}
        </div>
      )}

      {!isLoading && ordenados.length === 0 && <p className="hint">Todavía no hay productos cargados.</p>}
    </div>
  );
}
