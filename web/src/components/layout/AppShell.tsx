import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { capitalizarNombre } from "../../utils/format";
import { isSuspended } from "../../utils/suspension";
import { supabase } from "../../lib/supabaseClient";
import { Sidebar } from "./Sidebar";

/**
 * Layout de la app logueada: topbar + sidebar + <Outlet/>. Cada página
 * decide su propio ancho de contenido.
 */
export function AppShell() {
  const { session, loadingSession, profile, loadingProfile } = useAuth();

  if (loadingSession || loadingProfile) return null;
  if (!session) return <Navigate to="/" replace />;
  if (isSuspended(profile)) return <Navigate to="/suspendido" replace />;

  return (
    <div>
      <header className="app-topbar">
        <div className="app-topbar-row">
          <span className="logo">
            <span className="logo-badge">DM</span>
            <span className="logo-text">
              <strong>DE MONTOYA</strong>
              <span>Carnes Entrerrianas</span>
            </span>
          </span>
          <span className="app-slogan">Desde 1882</span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="auth-greeting">
              Hola{profile ? `, ${capitalizarNombre(profile.nombre)}` : ""}
            </span>
            <button type="button" className="btn btn-dark" id="logoutBtn" onClick={() => void supabase.auth.signOut()}>
              Salir
            </button>
          </div>
        </div>
      </header>
      <div className="app-shell">
        <Sidebar />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
