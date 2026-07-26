import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ProductoRow } from "../lib/database.types";

export interface CartItem {
  productoId: string;
  nombre: string;
  precio: number;
  unidad: ProductoRow["unidad"];
  pesoReferencia: string | null;
  imagenUrl: string | null;
  cantidad: number;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  total: number;
  addItem: (producto: ProductoRow, cantidad?: number) => void;
  updateCantidad: (productoId: string, cantidad: number) => void;
  removeItem: (productoId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "montoya-carrito";

function leerCarritoGuardado(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

/**
 * Carrito persistido en localStorage (no en la base) -- así nadie pierde su
 * selección si recién se le pide iniciar sesión al confirmar el pedido. La
 * validación real de stock y precio pasa siempre por el RPC crear_pedido en
 * el servidor, esto es solo para la experiencia de armar el pedido.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => leerCarritoGuardado());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(producto: ProductoRow, cantidad = 1) {
    setItems((prev) => {
      const existente = prev.find((i) => i.productoId === producto.id);
      if (existente) {
        return prev.map((i) =>
          i.productoId === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i
        );
      }
      return [
        ...prev,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          unidad: producto.unidad,
          pesoReferencia: producto.peso_referencia,
          imagenUrl: producto.imagen_url,
          cantidad,
        },
      ];
    });
  }

  function updateCantidad(productoId: string, cantidad: number) {
    if (cantidad <= 0) {
      removeItem(productoId);
      return;
    }
    setItems((prev) => prev.map((i) => (i.productoId === productoId ? { ...i, cantidad } : i)));
  }

  function removeItem(productoId: string) {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId));
  }

  function clear() {
    setItems([]);
  }

  // Cantidad de productos distintos en el carrito, no la suma de cantidades
  // -- "cantidad" puede estar en kg/cajas/unidades, sumarlas no tiene
  // sentido como badge (2kg de un solo corte no son "2 productos").
  const totalItems = useMemo(() => items.length, [items]);
  const total = useMemo(() => items.reduce((sum, i) => sum + i.cantidad * i.precio, 0), [items]);

  return (
    <CartContext.Provider value={{ items, totalItems, total, addItem, updateCantidad, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
