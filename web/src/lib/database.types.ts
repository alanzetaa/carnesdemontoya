// Tipos escritos a mano a partir de supabase-schema.sql (no generados con la
// CLI de Supabase). Si se cambia el esquema, hay que actualizar este archivo
// a mano también.
//
// Importante: estos tipos se declaran con "type", no "interface" -- con
// "interface" la inferencia genérica de @supabase/supabase-js para
// .insert()/.upsert()/.update() se rompe (el tipo esperado colapsa a
// "never"), un comportamiento conocido de TypeScript con conditional types
// sobre interfaces declaradas por nombre.

export type Categoria = "corte" | "combo";
export type Unidad = "kg" | "caja" | "unidad";
export type EstadoPedido = "pendiente" | "confirmado" | "entregado" | "cancelado";

export type ProfileRow = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  whatsapp: string | null;
  direccion: string;
  localidad: string | null;
  provincia: string | null;
  terminos_version_aceptada: number;
  terminos_aceptados_at: string | null;
  suspendido_hasta: string | null;
  created_at: string;
};
export type ProfileInsert = Omit<
  ProfileRow,
  "terminos_version_aceptada" | "terminos_aceptados_at" | "suspendido_hasta" | "created_at"
> & {
  terminos_version_aceptada?: number;
  terminos_aceptados_at?: string | null;
  suspendido_hasta?: string | null;
  created_at?: string;
};
export type ProfileUpdate = Partial<ProfileInsert>;

export type SuperAdminRow = { user_id: string };

export type ProductoRow = {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: Categoria;
  precio: number;
  unidad: Unidad;
  peso_referencia: string | null;
  stock: number;
  activo: boolean;
  imagen_url: string | null;
  orden: number;
  created_at: string;
  updated_at: string;
};
export type ProductoInsert = Omit<ProductoRow, "id" | "created_at" | "updated_at" | "orden"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  orden?: number;
};
export type ProductoUpdate = Partial<ProductoInsert>;

export type PedidoRow = {
  id: string;
  user_id: string | null;
  comprador_nombre: string;
  comprador_apellido: string;
  comprador_email: string;
  whatsapp_contacto: string | null;
  direccion_envio: string;
  notas: string | null;
  estado: EstadoPedido;
  total: number;
  mensaje_admin: string | null;
  created_at: string;
};

export type PedidoItemRow = {
  id: string;
  pedido_id: string;
  producto_id: string | null;
  nombre_producto: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
};

// ---- Funciones (RPC) ----

export type AdminMiembroRow = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  whatsapp: string | null;
  direccion: string;
  created_at: string;
  ultima_conexion: string | null;
  suspendido_hasta: string | null;
  pedidos_realizados: number;
};

export type AdminPedidoItem = {
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
};

export type AdminPedidoRow = {
  id: string;
  created_at: string;
  estado: EstadoPedido;
  comprador_nombre: string;
  comprador_apellido: string;
  comprador_email: string;
  whatsapp_contacto: string | null;
  direccion_envio: string;
  notas: string | null;
  total: number;
  mensaje_admin: string | null;
  items: AdminPedidoItem[];
};

export type StatsResumenRow = {
  total_miembros: number;
  total_pedidos: number;
  pedidos_pendientes: number;
  ingresos_confirmados: number;
};

export type StatsPorDiaRow = {
  dia: string;
  cantidad: number;
};

export type CrearPedidoItemArg = { producto_id: string; cantidad: number };

export type Database = {
  public: {
    Tables: {
      profiles: { Row: ProfileRow; Insert: ProfileInsert; Update: ProfileUpdate; Relationships: [] };
      super_admins: { Row: SuperAdminRow; Insert: SuperAdminRow; Update: never; Relationships: [] };
      productos: { Row: ProductoRow; Insert: ProductoInsert; Update: ProductoUpdate; Relationships: [] };
      pedidos: { Row: PedidoRow; Insert: never; Update: never; Relationships: [] };
      pedido_items: { Row: PedidoItemRow; Insert: never; Update: never; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      es_super_admin: { Args: Record<string, never>; Returns: boolean };
      crear_pedido: {
        Args: { p_items: CrearPedidoItemArg[]; p_direccion: string; p_whatsapp: string | null; p_notas: string | null };
        Returns: string;
      };
      admin_listar_miembros: { Args: Record<string, never>; Returns: AdminMiembroRow[] };
      admin_suspender_usuario: { Args: { target_id: string; hasta: string | null }; Returns: void };
      admin_eliminar_perfil: { Args: { target_id: string }; Returns: void };
      admin_listar_pedidos: { Args: Record<string, never>; Returns: AdminPedidoRow[] };
      admin_actualizar_estado_pedido: {
        Args: { p_pedido_id: string; p_nuevo_estado: EstadoPedido; p_mensaje: string | null };
        Returns: void;
      };
      admin_stats_resumen: { Args: Record<string, never>; Returns: StatsResumenRow[] };
      admin_stats_pedidos_por_dia: { Args: Record<string, never>; Returns: StatsPorDiaRow[] };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
