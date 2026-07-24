import { useMemo } from "react";
import { useProductos } from "../hooks/useProductos";
import { ProductoCard } from "../components/catalogo/ProductoCard";
import { CATEGORIA_LABELS } from "../constants/categorias";
import type { Categoria, ProductoRow } from "../lib/database.types";

export function CatalogoPage() {
  const { data: productos, isLoading } = useProductos();

  const porCategoria = useMemo(() => {
    const grupos: Record<Categoria, ProductoRow[]> = { corte: [], combo: [] };
    (productos ?? []).forEach((p) => grupos[p.categoria].push(p));
    return grupos;
  }, [productos]);

  return (
    <div className="app-content-inner app-content-wide">
      <h2>Catálogo</h2>
      <p className="hint">Elegí tus cortes y combos, agregalos al carrito y confirmá tu pedido.</p>

      {isLoading && <p className="hint">Cargando catálogo…</p>}

      {(Object.keys(CATEGORIA_LABELS) as Categoria[]).map((cat) =>
        porCategoria[cat].length > 0 ? (
          <section key={cat} style={{ marginTop: 24 }}>
            <h3>{CATEGORIA_LABELS[cat]}</h3>
            <div className="producto-grid">
              {porCategoria[cat].map((p) => (
                <ProductoCard key={p.id} producto={p} />
              ))}
            </div>
          </section>
        ) : null
      )}

      {!isLoading && (productos ?? []).length === 0 && (
        <p className="hint">Todavía no hay productos cargados.</p>
      )}
    </div>
  );
}
