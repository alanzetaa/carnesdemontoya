import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

function navItemClass({ isActive }: { isActive: boolean }): string {
  return "app-nav-item" + (isActive ? " active" : "");
}

function adminNavItemClass({ isActive }: { isActive: boolean }): string {
  return "app-nav-item app-nav-item-admin" + (isActive ? " active" : "");
}

export function Sidebar() {
  const { isSuperAdmin } = useAuth();
  const { totalItems } = useCart();

  return (
    <nav className="app-sidebar" id="appSidebar">
      <NavLink to="/catalogo" className={navItemClass}>
        <span className="app-nav-icon" />
        Productos
      </NavLink>
      <NavLink to="/carrito" className={navItemClass}>
        <span className="app-nav-icon" />
        Mi carrito
        {totalItems > 0 && <span className="nav-badge">{totalItems}</span>}
      </NavLink>
      <NavLink to="/mis-pedidos" className={navItemClass}>
        <span className="app-nav-icon" />
        Mis pedidos
      </NavLink>
      <NavLink to="/perfil" className={navItemClass}>
        <span className="app-nav-icon" />
        Mi perfil
      </NavLink>
      {isSuperAdmin && (
        <NavLink to="/admin" className={adminNavItemClass}>
          <span className="app-nav-icon">⚙</span>
          HQ De Montoya
        </NavLink>
      )}
    </nav>
  );
}
