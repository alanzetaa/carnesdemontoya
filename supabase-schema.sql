-- ============================================================================
-- Carnes de Montoya — schema de Supabase (Postgres + Auth + Storage)
-- ============================================================================
-- Se corre entero desde el SQL Editor del dashboard de Supabase. Es seguro
-- volver a correrlo si hay cambios (todo usa "if not exists" / "or replace" /
-- "drop policy if exists" antes de crear). Mismo patrón que se usa en el
-- proyecto hermano "Comunidad Metales Julio".
--
-- Orden de las secciones: profiles -> super_admins -> productos -> pedidos ->
-- pedido_items -> storage -> RPCs de pedidos -> RPCs de admin.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles: datos de la persona que compra. Bastante más simple que en
-- Metales Julio a propósito (pedido explícito del dueño) -- sin DNI/CUIT,
-- solo lo necesario para poder armar y enviar un pedido.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  apellido text not null,
  email text not null,
  whatsapp text,
  direccion text not null,
  localidad text,
  provincia text,
  terminos_version_aceptada integer not null default 0,
  terminos_aceptados_at timestamptz,
  -- Suspensión temporal (pedido explícito del dueño, HQ De Montoya): si está
  -- en el futuro, la persona está suspendida. Se compara contra now() en
  -- cada lectura, no hace falta un cron para "levantar" la suspensión.
  suspendido_hasta timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "select_own_profile" on public.profiles;
create policy "select_own_profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "insert_own_profile" on public.profiles;
create policy "insert_own_profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "update_own_profile" on public.profiles;
create policy "update_own_profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- super_admins: mismo patrón que Metales Julio. Solo se lee a través de
-- es_super_admin() (security definer) -- no hay policy de select directa.
-- ----------------------------------------------------------------------------
create table if not exists public.super_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.super_admins enable row level security;

create or replace function public.es_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(select 1 from public.super_admins where user_id = auth.uid());
$$;

grant execute on function public.es_super_admin() to authenticated, anon;

-- ----------------------------------------------------------------------------
-- productos: los cortes / combos / cajas que vende la empresa (ver flyers:
-- "Caja Familiar de Montoya", "De Montoya Premium"). El catálogo con precio
-- es público (a diferencia de Metales Julio, esto es una tienda, no una
-- comunidad privada) -- cualquiera puede ver productos activos sin login.
-- ----------------------------------------------------------------------------
create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  categoria text not null check (categoria in ('corte', 'combo')),
  precio numeric(12, 2) not null check (precio >= 0),
  unidad text not null check (unidad in ('kg', 'caja', 'unidad')),
  peso_referencia text,
  stock numeric(12, 2) not null default 0 check (stock >= 0),
  activo boolean not null default true,
  imagen_url text,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_productos_updated_at on public.productos;
create trigger trg_productos_updated_at
  before update on public.productos
  for each row execute function public.set_updated_at();

alter table public.productos enable row level security;

-- El catálogo (precios incluidos) es un beneficio de tener cuenta -- la
-- landing pública NO lo muestra (pedido explícito del dueño). Una sola
-- policy de select: cualquier cuenta logueada ve lo activo, el súper admin
-- ve todo (incluidos productos pausados/agotados que sacó de la vidriera).
-- Gente sin sesión (anon) no puede leer esta tabla.
drop policy if exists "select_productos" on public.productos;
create policy "select_productos"
  on public.productos for select
  using ((auth.uid() is not null and activo = true) or public.es_super_admin());

drop policy if exists "admin_insert_productos" on public.productos;
create policy "admin_insert_productos"
  on public.productos for insert
  with check (public.es_super_admin());

drop policy if exists "admin_update_productos" on public.productos;
create policy "admin_update_productos"
  on public.productos for update
  using (public.es_super_admin());

drop policy if exists "admin_delete_productos" on public.productos;
create policy "admin_delete_productos"
  on public.productos for delete
  using (public.es_super_admin());

-- ----------------------------------------------------------------------------
-- pedidos / pedido_items: la solicitud de compra. Todo lo que puede cambiar
-- después (nombre/dirección del comprador, precio del producto) se guarda
-- como snapshot en el momento del pedido -- así el historial de HQ no se
-- corrompe si alguien edita su perfil, se le borra la cuenta, o el admin
-- cambia un precio más adelante. user_id apunta a auth.users (no a
-- profiles) con "on delete set null": si algún día se borra la cuenta de
-- autenticación de verdad (solo posible a mano desde el Dashboard, ver
-- admin_eliminar_perfil más abajo), el pedido no desaparece de las
-- estadísticas, solo pierde el vínculo con un usuario.
-- ----------------------------------------------------------------------------
create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  comprador_nombre text not null,
  comprador_apellido text not null,
  comprador_email text not null,
  whatsapp_contacto text,
  direccion_envio text not null,
  notas text,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'confirmado', 'entregado', 'cancelado')),
  total numeric(12, 2) not null default 0,
  -- Mensaje opcional que HQ deja al cambiar el estado (ej. "Salió hoy,
  -- llega mañana a la tarde"). Se pisa con el siguiente cambio de estado,
  -- no es un historial.
  mensaje_admin text,
  created_at timestamptz not null default now()
);

alter table public.pedidos enable row level security;

-- Solo lectura por RLS: cada persona ve sus propios pedidos, HQ los ve
-- todos. La creación/edición pasa siempre por las funciones de abajo
-- (crear_pedido / admin_actualizar_estado_pedido) -- no hay policy de
-- insert/update/delete directa, así nadie puede saltear la validación de
-- stock ni falsear un precio insertando la fila a mano vía la API REST.
drop policy if exists "select_own_pedidos" on public.pedidos;
create policy "select_own_pedidos"
  on public.pedidos for select
  using (auth.uid() = user_id or public.es_super_admin());

create table if not exists public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  producto_id uuid references public.productos (id) on delete set null,
  nombre_producto text not null,
  precio_unitario numeric(12, 2) not null,
  cantidad numeric(12, 2) not null check (cantidad > 0),
  subtotal numeric(12, 2) not null
);

alter table public.pedido_items enable row level security;

drop policy if exists "select_own_pedido_items" on public.pedido_items;
create policy "select_own_pedido_items"
  on public.pedido_items for select
  using (
    exists (
      select 1 from public.pedidos p
      where p.id = pedido_id and (p.user_id = auth.uid() or public.es_super_admin())
    )
  );

-- ----------------------------------------------------------------------------
-- Storage: fotos de productos. Bucket público (mismo criterio que
-- publicaciones-fotos en Metales Julio: no son datos sensibles), solo el
-- súper admin puede subir/reemplazar/borrar.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('productos-fotos', 'productos-fotos', true)
on conflict (id) do nothing;

drop policy if exists "select_fotos_productos" on storage.objects;
create policy "select_fotos_productos" on storage.objects for select
  using (bucket_id = 'productos-fotos');

drop policy if exists "admin_insert_foto_producto" on storage.objects;
create policy "admin_insert_foto_producto" on storage.objects for insert
  with check (bucket_id = 'productos-fotos' and public.es_super_admin());

drop policy if exists "admin_update_foto_producto" on storage.objects;
create policy "admin_update_foto_producto" on storage.objects for update
  using (bucket_id = 'productos-fotos' and public.es_super_admin());

drop policy if exists "admin_delete_foto_producto" on storage.objects;
create policy "admin_delete_foto_producto" on storage.objects for delete
  using (bucket_id = 'productos-fotos' and public.es_super_admin());

-- ----------------------------------------------------------------------------
-- crear_pedido: única forma de generar un pedido. Corre en una sola
-- transacción; usa "select ... for update" sobre cada producto para evitar
-- que dos personas pidan el último kilo al mismo tiempo (condición de
-- carrera), toma el precio ACTUAL de la base (nunca confía en un precio
-- mandado por el cliente) y descuenta el stock antes de confirmar.
-- p_items: jsonb tipo [{"producto_id": "...", "cantidad": 2}, ...]
-- ----------------------------------------------------------------------------
create or replace function public.crear_pedido(
  p_items jsonb,
  p_direccion text,
  p_whatsapp text,
  p_notas text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_perfil record;
  v_pedido_id uuid;
  v_item jsonb;
  v_producto_id uuid;
  v_cantidad numeric;
  v_producto record;
  v_subtotal numeric;
  v_total numeric := 0;
begin
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  if p_direccion is null or trim(p_direccion) = '' then
    raise exception 'Falta la dirección de envío';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene items';
  end if;

  select nombre, apellido, email, suspendido_hasta into v_perfil
  from public.profiles where id = v_user_id;

  if not found then
    raise exception 'Completá tu perfil antes de hacer un pedido';
  end if;

  if v_perfil.suspendido_hasta is not null and v_perfil.suspendido_hasta > now() then
    raise exception 'Tu cuenta está suspendida temporalmente, no podés hacer pedidos';
  end if;

  insert into public.pedidos (
    user_id, comprador_nombre, comprador_apellido, comprador_email,
    whatsapp_contacto, direccion_envio, notas, estado, total
  )
  values (
    v_user_id, v_perfil.nombre, v_perfil.apellido, v_perfil.email,
    p_whatsapp, p_direccion, p_notas, 'pendiente', 0
  )
  returning id into v_pedido_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_producto_id := (v_item ->> 'producto_id')::uuid;
    v_cantidad := (v_item ->> 'cantidad')::numeric;

    if v_cantidad is null or v_cantidad <= 0 then
      raise exception 'Cantidad inválida en el pedido';
    end if;

    select * into v_producto
    from public.productos
    where id = v_producto_id and activo = true
    for update;

    if not found then
      raise exception 'Un producto del pedido ya no está disponible';
    end if;

    if v_producto.stock < v_cantidad then
      raise exception 'Sin stock suficiente de "%": quedan % % disponibles',
        v_producto.nombre, v_producto.stock, v_producto.unidad;
    end if;

    v_subtotal := v_producto.precio * v_cantidad;
    v_total := v_total + v_subtotal;

    insert into public.pedido_items (
      pedido_id, producto_id, nombre_producto, precio_unitario, cantidad, subtotal
    )
    values (
      v_pedido_id, v_producto_id, v_producto.nombre, v_producto.precio, v_cantidad, v_subtotal
    );

    update public.productos set stock = stock - v_cantidad where id = v_producto_id;
  end loop;

  update public.pedidos set total = v_total where id = v_pedido_id;

  return v_pedido_id;
end;
$$;

grant execute on function public.crear_pedido(jsonb, text, text, text) to authenticated;

-- ----------------------------------------------------------------------------
-- RPCs de administración (HQ De Montoya) -- mismo patrón "security definer +
-- chequeo de es_super_admin() adentro" que Metales Julio.
-- ----------------------------------------------------------------------------

create or replace function public.admin_listar_miembros()
returns table (
  id uuid,
  nombre text,
  apellido text,
  email text,
  whatsapp text,
  direccion text,
  created_at timestamptz,
  ultima_conexion timestamptz,
  suspendido_hasta timestamptz,
  pedidos_realizados bigint
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.nombre, p.apellido, p.email, p.whatsapp, p.direccion, p.created_at,
         u.last_sign_in_at, p.suspendido_hasta,
         (select count(*) from public.pedidos pe where pe.user_id = p.id)
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.es_super_admin();
$$;

grant execute on function public.admin_listar_miembros() to authenticated;

-- Suspende (o reactiva, pasando hasta = null) una cuenta. No usa RLS porque
-- profiles.update ya está limitado al dueño de la fila -- un admin necesita
-- esta función para poder tocar filas ajenas.
create or replace function public.admin_suspender_usuario(target_id uuid, hasta timestamptz)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_super_admin() then
    raise exception 'No autorizado';
  end if;
  update public.profiles set suspendido_hasta = hasta where id = target_id;
end;
$$;

grant execute on function public.admin_suspender_usuario(uuid, timestamptz) to authenticated;

-- Elimina el perfil de una persona (pedido explícito del dueño: "posibilidad
-- de eliminar cuentas"). NO borra la cuenta de autenticación (auth.users) --
-- eso requiere la service_role key, que nunca debe vivir en el cliente; se
-- hace a mano desde Supabase Dashboard > Authentication > Users si hace
-- falta borrarla del todo. El historial de pedidos de esa persona se
-- conserva igual (comprador_nombre/apellido/email quedan como snapshot en
-- "pedidos", no dependen de que el perfil siga existiendo).
create or replace function public.admin_eliminar_perfil(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_super_admin() then
    raise exception 'No autorizado';
  end if;
  delete from public.profiles where id = target_id;
end;
$$;

grant execute on function public.admin_eliminar_perfil(uuid) to authenticated;

-- Listado completo de pedidos con sus items agregados en un solo jsonb (evita
-- N+1 llamadas desde el front para armar el detalle de cada pedido en HQ).
drop function if exists public.admin_listar_pedidos();

create or replace function public.admin_listar_pedidos()
returns table (
  id uuid,
  created_at timestamptz,
  estado text,
  comprador_nombre text,
  comprador_apellido text,
  comprador_email text,
  whatsapp_contacto text,
  direccion_envio text,
  notas text,
  total numeric,
  mensaje_admin text,
  items jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    p.id, p.created_at, p.estado, p.comprador_nombre, p.comprador_apellido,
    p.comprador_email, p.whatsapp_contacto, p.direccion_envio, p.notas, p.total,
    p.mensaje_admin,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'nombre_producto', pi.nombre_producto,
        'cantidad', pi.cantidad,
        'precio_unitario', pi.precio_unitario,
        'subtotal', pi.subtotal
      ) order by pi.id)
      from public.pedido_items pi
      where pi.pedido_id = p.id
    ), '[]'::jsonb)
  from public.pedidos p
  where public.es_super_admin()
  order by p.created_at desc;
$$;

grant execute on function public.admin_listar_pedidos() to authenticated;

-- Cambia el estado de un pedido. Si pasa a "cancelado" desde cualquier otro
-- estado, reintegra el stock de cada item. Si un pedido cancelado se
-- reactiva a otro estado, vuelve a descontar el stock (puede fallar con un
-- mensaje legible si ya no alcanza). p_mensaje es opcional (lo escribe HQ en
-- el diálogo de confirmación) y queda visible para el comprador en "Mis
-- pedidos"; null borra el mensaje anterior.
drop function if exists public.admin_actualizar_estado_pedido(uuid, text);

create or replace function public.admin_actualizar_estado_pedido(
  p_pedido_id uuid,
  p_nuevo_estado text,
  p_mensaje text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado_actual text;
  v_item record;
begin
  if not public.es_super_admin() then
    raise exception 'No autorizado';
  end if;

  if p_nuevo_estado not in ('pendiente', 'confirmado', 'entregado', 'cancelado') then
    raise exception 'Estado inválido';
  end if;

  select estado into v_estado_actual from public.pedidos where id = p_pedido_id for update;

  if not found then
    raise exception 'Pedido no encontrado';
  end if;

  if v_estado_actual = p_nuevo_estado then
    update public.pedidos set mensaje_admin = p_mensaje where id = p_pedido_id;
    return;
  end if;

  if p_nuevo_estado = 'cancelado' then
    for v_item in
      select producto_id, cantidad from public.pedido_items
      where pedido_id = p_pedido_id and producto_id is not null
    loop
      update public.productos set stock = stock + v_item.cantidad where id = v_item.producto_id;
    end loop;
  elsif v_estado_actual = 'cancelado' then
    for v_item in
      select producto_id, cantidad from public.pedido_items
      where pedido_id = p_pedido_id and producto_id is not null
    loop
      update public.productos set stock = stock - v_item.cantidad
      where id = v_item.producto_id and stock >= v_item.cantidad;
      if not found then
        raise exception 'No hay stock suficiente para reactivar este pedido';
      end if;
    end loop;
  end if;

  update public.pedidos set estado = p_nuevo_estado, mensaje_admin = p_mensaje where id = p_pedido_id;
end;
$$;

grant execute on function public.admin_actualizar_estado_pedido(uuid, text, text) to authenticated;

-- Resumen para los tiles de HQ: miembros, pedidos totales, pedidos
-- pendientes, ingresos de pedidos no cancelados.
create or replace function public.admin_stats_resumen()
returns table (
  total_miembros bigint,
  total_pedidos bigint,
  pedidos_pendientes bigint,
  ingresos_confirmados numeric
)
language sql
security definer
set search_path = public
as $$
  select
    (select count(*) from public.profiles),
    (select count(*) from public.pedidos),
    (select count(*) from public.pedidos where estado = 'pendiente'),
    (select coalesce(sum(total), 0) from public.pedidos where estado <> 'cancelado')
  where public.es_super_admin();
$$;

grant execute on function public.admin_stats_resumen() to authenticated;

create or replace function public.admin_stats_pedidos_por_dia()
returns table (dia date, cantidad bigint)
language sql
security definer
set search_path = public
as $$
  select date_trunc('day', created_at)::date as dia, count(*) as cantidad
  from public.pedidos
  where public.es_super_admin()
  group by dia
  order by dia;
$$;

grant execute on function public.admin_stats_pedidos_por_dia() to authenticated;

-- ============================================================================
-- Después de correr todo lo de arriba, para convertir una cuenta en súper
-- admin (HQ De Montoya): registrala normalmente en el sitio (o creala desde
-- Dashboard > Authentication > Users > Add user), y después corré una sola
-- vez:
--
-- insert into public.super_admins (user_id)
-- select id from auth.users where email = 'justo@carnesdemontoya.com'
-- on conflict (user_id) do nothing;
--
-- El perfil (nombre/apellido/dirección) de esa cuenta se completa la primera
-- vez que entra a "Mi perfil" en la app, igual que cualquier otra cuenta.
-- ============================================================================
