import { useState } from "react";
import { LoginModal } from "../components/auth/LoginModal";
import { RegisterModal } from "../components/auth/RegisterModal";
import { ForgotPasswordModal } from "../components/auth/ForgotPasswordModal";
import { IconBox, IconClock, IconCut, IconShield, IconTruck } from "../components/ui/Icons";

type ModalAbierto = "login" | "register" | "forgot" | null;

export function LandingPage() {
  const [modal, setModal] = useState<ModalAbierto>(null);

  return (
    <div>
      <header className="public-header">
        <img src="/logo-transparent.png" alt="De Montoya — Carnes Entrerrianas, desde 1882" className="logo-img" />
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="btn btn-outline-light" onClick={() => setModal("login")}>
            Ingresar
          </button>
          <button type="button" className="btn btn-gold" onClick={() => setModal("register")}>
            Crear cuenta gratis
          </button>
        </div>
      </header>

      <section className="hero">
        <span className="hero-kicker">Establecimiento Oficial SENASA N.º 5620 · Entre Ríos</span>
        <h1>Carne premium envasada al vacío, directo del campo a tu mesa</h1>
        <p>
          Cortes madurados y combos familiares, con envío en vehículo refrigerado a{" "}
          <strong>Rosario</strong> y <strong>Buenos Aires</strong>. Creá tu cuenta gratis y accedé al
          catálogo completo con precios.
        </p>
      </section>

      <section className="trust-bar">
        <div className="trust-item">
          <IconShield />
          <span>
            <strong>Desde 1882</strong>
            <small>Tradición familiar entrerriana</small>
          </span>
        </div>
        <div className="trust-item">
          <IconCut />
          <span>
            <strong>Maduración 7–21 días</strong>
            <small>Cortes premium envasados al vacío</small>
          </span>
        </div>
        <div className="trust-item">
          <IconTruck />
          <span>
            <strong>Envío refrigerado</strong>
            <small>Cadena de frío garantizada</small>
          </span>
        </div>
        <div className="trust-item">
          <IconClock />
          <span>
            <strong>Rosario y Buenos Aires</strong>
            <small>Zona de cobertura actual</small>
          </span>
        </div>
      </section>

      <section className="app-content-inner app-content-wide category-teaser-section">
        <h2>Qué vas a encontrar</h2>
        <p className="hint" style={{ maxWidth: 560 }}>
          Catálogo completo con precios y stock disponible dentro de la plataforma — creá tu cuenta para
          verlo entero y armar tu pedido.
        </p>
        <div className="category-teaser-grid">
          <div className="category-teaser-card">
            <IconCut />
            <h3>Cortes Premium</h3>
            <p>Lomo, entraña, ojo de bife, bife de chorizo, asado banderita y más — madurados y envasados al vacío.</p>
          </div>
          <div className="category-teaser-card">
            <IconBox />
            <h3>Combos y Cajas Familiares</h3>
            <p>Cajas pensadas para simplificar tus comidas diarias, con una selección de cortes y preparados listos.</p>
          </div>
        </div>
      </section>

      <section className="app-content-inner how-it-works">
        <h2>Cómo funciona</h2>
        <ol>
          <li>Creá tu cuenta (rápido, solo email y tus datos de envío).</li>
          <li>Elegí tus cortes y combos del catálogo, con precios y stock reales.</li>
          <li>Confirmá el pedido — te contactamos por WhatsApp o email para coordinar el pago y la entrega.</li>
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

      <LoginModal open={modal === "login"} onClose={() => setModal(null)} onForgotPassword={() => setModal("forgot")} />
      <RegisterModal open={modal === "register"} onClose={() => setModal(null)} />
      <ForgotPasswordModal open={modal === "forgot"} onClose={() => setModal(null)} />
    </div>
  );
}
