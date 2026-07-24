import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProductos } from "../hooks/useProductos";
import { ProductoCard } from "../components/catalogo/ProductoCard";
import { CATEGORIA_LABELS } from "../constants/categorias";
import { useCart } from "../context/CartContext";
import { formatMoneda } from "../utils/format";
import { LoginModal } from "../components/auth/LoginModal";
import { RegisterModal } from "../components/auth/RegisterModal";
import { ForgotPasswordModal } from "../components/auth/ForgotPasswordModal";
import type { Categoria, ProductoRow } from "../lib/database.types";

type ModalAbierto = "login" | "register" | "forgot" | null;

export function LandingPage() {
  const { data: productos, isLoading } = useProductos();
  const { totalItems, total } = useCart();
  const [modal, setModal] = useState<ModalAbierto>(null);
  const navigate = useNavigate();

  const porCategoria = useMemo(() => {
    const grupos: Record<Categoria, ProductoRow[]> = { corte: [], combo: [] };
    (productos ?? []).forEach((p) => grupos[p.categoria].push(p));
    return grupos;
  }, [productos]);

  return (
    <div>
      <header className="public-header">
        <span className="logo">
          <span className="logo-badge">DM</span>
          <span className="logo-text">
            <strong>DE MONTOYA</strong>
            <span>Carnes Entrerrianas · Desde 1882</span>
          </span>
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="btn btn-outline-light" onClick={() => setModal("login")}>
            Ingresar
          </button>
          <button type="button" className="btn btn-dark" onClick={() => setModal("register")}>
            Crear cuenta
          </button>
        </div>
      </header>

      <section className="hero">
        <h1>Carne premium envasada al vacío, directo del campo a tu mesa</h1>
        <p>
          Producimos en nuestro establecimiento de Entre Ríos (SENASA N.º 5620) y enviamos con vehículo
          refrigerado a <strong>Rosario</strong> y <strong>Buenos Aires</strong>.
        </p>
      </section>

      <section className="app-content-inner app-content-wide" id="catalogo-publico">
        <h2>Nuestros productos</h2>
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
      </section>

      <section className="app-content-inner how-it-works">
        <h2>Cómo funciona</h2>
        <ol>
          <li>Armá tu pedido eligiendo cortes y combos del catálogo.</li>
          <li>Creá tu cuenta (rápido, solo email y tus datos de envío) para confirmarlo.</li>
          <li>Te contactamos por WhatsApp o email para coordinar el pago y la entrega.</li>
          <li>Recibís tu pedido con cadena de frío garantizada, en Rosario o Buenos Aires.</li>
        </ol>
      </section>

      <footer className="footer">
        <p>
          De Montoya — Carnes Entrerrianas, desde 1882. Producido en Establecimiento Oficial SENASA N.º
          5620.
        </p>
        <p>WhatsApp: 11 6816-4189 · ventas@demontoya.com · @carnesdemontoya</p>
      </footer>

      {totalItems > 0 && (
        <div className="cart-float-bar">
          <span>
            {totalItems} producto{totalItems === 1 ? "" : "s"} en el carrito · {formatMoneda(total)}
          </span>
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => {
              setModal("register");
              navigate("/", { replace: true });
            }}
          >
            Crear cuenta para confirmar
          </button>
        </div>
      )}

      <LoginModal open={modal === "login"} onClose={() => setModal(null)} onForgotPassword={() => setModal("forgot")} />
      <RegisterModal open={modal === "register"} onClose={() => setModal(null)} />
      <ForgotPasswordModal open={modal === "forgot"} onClose={() => setModal(null)} />
    </div>
  );
}
