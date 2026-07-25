import { useState } from "react";
import { LoginModal } from "../components/auth/LoginModal";
import { RegisterModal } from "../components/auth/RegisterModal";
import { ForgotPasswordModal } from "../components/auth/ForgotPasswordModal";
import { IconClock, IconCut, IconShield, IconTruck } from "../components/ui/Icons";

type ModalAbierto = "login" | "register" | "forgot" | null;

export function LandingPage() {
  const [modal, setModal] = useState<ModalAbierto>(null);

  return (
    <div className="landing-page">
      <header className="public-header">
        <div className="app-topbar-row">
          <img src="/logo-transparent.png" alt="De Montoya — Carnes Entrerrianas, desde 1882" className="logo-img" />
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn btn-outline-light" onClick={() => setModal("login")}>
              Ingresar
            </button>
            <button type="button" className="btn btn-gold" onClick={() => setModal("register")}>
              Crear cuenta gratis
            </button>
          </div>
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
