import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { supabase } from "../lib/supabaseClient";
import { formatMoneda, formatWhatsappDisplay, normalizeWhatsapp, parseCantidadDecimal } from "../utils/format";

/** Acepta "0,5" o "0.5" -- misma idea que en ProductoCard. */
function CantidadInput({
  cantidad,
  onCommit,
}: {
  cantidad: number;
  onCommit: (valor: number) => void;
}) {
  const [texto, setTexto] = useState(String(cantidad));

  useEffect(() => setTexto(String(cantidad)), [cantidad]);

  function confirmar() {
    onCommit(parseCantidadDecimal(texto, 0));
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      className="producto-cantidad"
      value={texto}
      onChange={(e) => {
        const val = e.target.value;
        if (/^[0-9]*[.,]?[0-9]*$/.test(val)) setTexto(val);
      }}
      onBlur={confirmar}
    />
  );
}

export function CarritoPage() {
  const { items, total, updateCantidad, removeItem, clear } = useCart();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [direccion, setDireccion] = useState(profile?.direccion ?? "");
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp ? formatWhatsappDisplay(profile.whatsapp) : "");
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);

  const perfilIncompleto = !profile?.nombre || !profile?.apellido;

  async function confirmarPedido() {
    if (items.length === 0) return;
    if (!direccion.trim()) {
      showToast("Ingresá una dirección de envío.");
      return;
    }
    setEnviando(true);
    const { error } = await supabase.rpc("crear_pedido", {
      p_items: items.map((i) => ({ producto_id: i.productoId, cantidad: i.cantidad })),
      p_direccion: direccion.trim(),
      p_whatsapp: whatsapp ? normalizeWhatsapp(whatsapp) : null,
      p_notas: notas.trim() || null,
    });
    setEnviando(false);
    if (error) {
      showToast(error.message);
      return;
    }
    clear();
    void queryClient.invalidateQueries({ queryKey: ["productos"] });
    showToast("¡Pedido enviado! Te contactamos para coordinar pago y entrega.");
    navigate("/mis-pedidos");
  }

  if (perfilIncompleto) {
    return (
      <div className="app-content-inner">
        <h2>Mi carrito</h2>
        <p className="hint">
          Completá tu <button className="link-btn" onClick={() => navigate("/perfil")}>perfil</button> (nombre,
          apellido y dirección) antes de confirmar un pedido.
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="app-content-inner">
        <h2>Mi carrito</h2>
        <p className="hint">
          Todavía no agregaste productos.{" "}
          <button className="link-btn" onClick={() => navigate("/catalogo")}>
            Ir al catálogo
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="app-content-inner">
      <h2>Mi carrito</h2>

      <table className="cart-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio</th>
            <th>Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.productoId}>
              <td>{i.nombre}</td>
              <td>
                <CantidadInput cantidad={i.cantidad} onCommit={(valor) => updateCantidad(i.productoId, valor)} />{" "}
                {i.unidad}
              </td>
              <td>{formatMoneda(i.precio)}</td>
              <td>{formatMoneda(i.precio * i.cantidad)}</td>
              <td>
                <button type="button" className="link-btn" onClick={() => removeItem(i.productoId)}>
                  Quitar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="cart-total">Total estimado: {formatMoneda(total)}</p>

      <div className="form-row">
        <div className="field">
          <label htmlFor="cDireccion">Dirección de envío *</label>
          <input id="cDireccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="cWhatsapp">WhatsApp de contacto (opcional)</label>
          <input id="cWhatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="cNotas">Notas para el pedido (opcional)</label>
          <textarea id="cNotas" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} />
        </div>
      </div>

      <p className="hint">
        Esto es una solicitud de pedido, no un cobro: te contactamos para coordinar el pago y la entrega.
      </p>

      <div className="form-actions">
        <button type="button" className="btn btn-dark" disabled={enviando} onClick={() => void confirmarPedido()}>
          {enviando ? "Enviando…" : "Confirmar pedido"}
        </button>
      </div>
    </div>
  );
}
