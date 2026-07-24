import type { AdminMiembroRow } from "../../lib/database.types";
import { capitalizarNombre, formatFechaCorta, formatWhatsappDisplay } from "../../utils/format";
import { isSuspended } from "../../utils/suspension";

interface Props {
  members: AdminMiembroRow[];
  isLoading?: boolean;
  onSuspender: (id: string, nombre: string) => void;
  onReactivar: (id: string) => void;
  onEliminar: (id: string, nombre: string) => void;
}

export function AdminMiembrosTable({ members, isLoading, onSuspender, onReactivar, onEliminar }: Props) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>WhatsApp</th>
            <th>Dirección</th>
            <th>Registro</th>
            <th>Pedidos</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={8} className="hint" style={{ padding: 20 }}>
                Cargando…
              </td>
            </tr>
          ) : members.length === 0 ? (
            <tr>
              <td colSpan={8} className="hint" style={{ padding: 20 }}>
                No se encontraron clientes.
              </td>
            </tr>
          ) : (
            members.map((m) => {
              const suspendido = isSuspended(m);
              const nombreCompleto = `${capitalizarNombre(m.nombre)} ${capitalizarNombre(m.apellido)}`;
              return (
                <tr key={m.id}>
                  <td title={nombreCompleto}>{nombreCompleto}</td>
                  <td title={m.email}>{m.email}</td>
                  <td>{formatWhatsappDisplay(m.whatsapp)}</td>
                  <td title={m.direccion}>{m.direccion}</td>
                  <td>{formatFechaCorta(m.created_at)}</td>
                  <td>{Number(m.pedidos_realizados) || 0}</td>
                  <td>
                    {suspendido ? (
                      <span className="admin-badge-suspendido">Susp. hasta {formatFechaCorta(m.suspendido_hasta)}</span>
                    ) : (
                      <span className="admin-badge-activo">Activo</span>
                    )}
                  </td>
                  <td style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                    <button type="button" className="btn btn-warning" onClick={() => onSuspender(m.id, nombreCompleto)}>
                      Suspender
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => onEliminar(m.id, nombreCompleto)}>
                      Eliminar
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      disabled={!suspendido}
                      onClick={() => onReactivar(m.id)}
                    >
                      Reactivar
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
