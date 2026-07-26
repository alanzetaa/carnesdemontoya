import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { ESTADO_LABELS } from "../pedidos/EstadoBadge";
import type { EstadoPedido } from "../../lib/database.types";

interface CambiarEstadoModalProps {
  open: boolean;
  clienteNombre: string;
  nuevoEstado: EstadoPedido | null;
  mensajeActual: string | null;
  onClose: () => void;
  onConfirm: (mensaje: string | null) => void;
}

export function CambiarEstadoModal({
  open,
  clienteNombre,
  nuevoEstado,
  mensajeActual,
  onClose,
  onConfirm,
}: CambiarEstadoModalProps) {
  const [mensaje, setMensaje] = useState(mensajeActual ?? "");

  useEffect(() => {
    if (open) setMensaje(mensajeActual ?? "");
  }, [open, mensajeActual]);

  if (!nuevoEstado) return null;

  return (
    <Modal open={open} onClose={onClose} title="Cambiar estado del pedido" maxWidth={480}>
      <p className="hint" style={{ marginTop: 0 }}>
        Vas a pasar el pedido de {clienteNombre} a <strong>{ESTADO_LABELS[nuevoEstado]}</strong>.
      </p>
      <div className="form-row">
        <div className="field">
          <label htmlFor="mensajeCliente">Mensaje para el cliente (opcional)</label>
          <textarea
            id="mensajeCliente"
            rows={3}
            placeholder="Ej: Salió hoy, llega mañana a la tarde."
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
          />
        </div>
      </div>
      <p className="hint" style={{ marginTop: 0 }}>
        El cliente lo va a ver en "Mis pedidos".
      </p>
      <div className="form-actions">
        <button type="button" className="btn btn-outline-dark" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="btn btn-dark" onClick={() => onConfirm(mensaje.trim() || null)}>
          Confirmar cambio
        </button>
      </div>
    </Modal>
  );
}
