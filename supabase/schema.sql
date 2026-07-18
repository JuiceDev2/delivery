-- ============================================================
-- ESQUEMA: App de delivery de comida tipo Rappi
-- 4 roles: admin, vendedor, cliente_registrado, cliente_no_registrado
-- ============================================================

-- Extensión para generar UUIDs
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- TABLA: usuarios (extiende auth.users de Supabase)
-- ------------------------------------------------------------
create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  rol text not null check (rol in ('admin', 'vendedor', 'cliente')),
  nombre_completo text not null,
  telefono text not null,
  email text unique,
  es_registrado boolean not null default true, -- false = "cliente no registrado" (solo nombre+telefono)
  lat numeric(10,7), -- ubicación fija del cliente (su casa)
  lng numeric(10,7),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABLA: negocios (perfil del vendedor)
-- ------------------------------------------------------------
create table public.negocios (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid not null references public.usuarios(id) on delete cascade,
  nombre_negocio text not null,
  categoria text not null check (categoria in ('comida', 'electronica', 'otro')),
  logo_url text,
  direccion text,
  lat numeric(10,7), -- ubicación fija del local
  lng numeric(10,7),
  activo boolean not null default true,
  -- control de horario, lo decide el vendedor
  abierto boolean not null default true,
  cerrado_hasta timestamptz, -- ej. "cerrado hasta las 9am" - solo informativo, no bloquea nada por sí solo
  acepta_pedidos_cerrado boolean not null default false, -- si el vendedor SÍ quiere recibir pedidos aunque esté cerrado
  creado_en timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABLA: productos
-- ------------------------------------------------------------
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  nombre text not null,
  descripcion text,
  precio numeric(10,2) not null check (precio >= 0),
  stock integer not null default 0 check (stock >= 0),
  imagen_url text, -- ya optimizada a webp por la API route de subida
  categoria text, -- ej "platillo", "bebida", "electronica"
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABLA: pedidos
-- ------------------------------------------------------------
create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id),
  -- si es cliente registrado, se usa cliente_id; si no, se usan los campos sueltos
  cliente_id uuid references public.usuarios(id),
  cliente_nombre text, -- requerido si no es cliente registrado
  cliente_telefono text, -- requerido si no es cliente registrado
  tipo_entrega text not null check (tipo_entrega in ('domicilio', 'sucursal')),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'confirmado', 'en_camino', 'entregado', 'cancelado', 'error')),
  costo_envio numeric(10,2) not null default 0,
  subtotal numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  -- ubicación de entrega (solo aplica si tipo_entrega = domicilio, y solo cliente registrado puede pedir domicilio)
  lat_cliente numeric(10,7),
  lng_cliente numeric(10,7),
  distancia_total_km numeric(10,3), -- calculada al crear el pedido (haversine), para el % de avance
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  -- regla: cliente no registrado nunca puede pedir domicilio
  constraint chk_no_registrado_solo_sucursal check (
    (cliente_id is not null) or (tipo_entrega = 'sucursal')
  )
);

-- ------------------------------------------------------------
-- TABLA: pedido_items (detalle de productos por pedido)
-- ------------------------------------------------------------
create table public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  producto_id uuid not null references public.productos(id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(10,2) not null
);

-- ------------------------------------------------------------
-- TABLA: ubicaciones_activas (tracking en vivo del repartidor)
-- una fila por pedido en curso; se actualiza (upsert) constantemente
-- ------------------------------------------------------------
create table public.ubicaciones_activas (
  pedido_id uuid primary key references public.pedidos(id) on delete cascade,
  lat_vendedor numeric(10,7) not null,
  lng_vendedor numeric(10,7) not null,
  actualizado_en timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABLA: ventas_caja (punto de venta presencial del vendedor)
-- ------------------------------------------------------------
create table public.ventas_caja (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id),
  total numeric(10,2) not null,
  efectivo_recibido numeric(10,2) not null,
  cambio numeric(10,2) not null,
  creado_en timestamptz not null default now()
);

create table public.ventas_caja_items (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas_caja(id) on delete cascade,
  producto_id uuid not null references public.productos(id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(10,2) not null
);

-- ------------------------------------------------------------
-- ÍNDICES
-- ------------------------------------------------------------
create index idx_productos_negocio on public.productos(negocio_id);
create index idx_pedidos_negocio on public.pedidos(negocio_id);
create index idx_pedidos_cliente on public.pedidos(cliente_id);
create index idx_pedidos_estado on public.pedidos(estado);
create index idx_pedido_items_pedido on public.pedido_items(pedido_id);

-- ------------------------------------------------------------
-- TRIGGER: crea automáticamente el perfil en public.usuarios
-- cuando se crea la cuenta en auth.users (por signUp del cliente
-- o por admin.createUser del panel admin). Corre con permisos de
-- superusuario (security definer), así que no depende de RLS ni
-- de que ya exista una sesión activa (funciona aunque el proyecto
-- tenga activada la confirmación de correo).
-- ------------------------------------------------------------
create or replace function public.manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.usuarios (id, rol, nombre_completo, telefono, email, es_registrado, lat, lng)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'rol', 'cliente'),
    coalesce(new.raw_user_meta_data->>'nombre_completo', ''),
    coalesce(new.raw_user_meta_data->>'telefono', ''),
    new.email,
    true,
    nullif(new.raw_user_meta_data->>'lat', '')::numeric,
    nullif(new.raw_user_meta_data->>'lng', '')::numeric
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trigger_nuevo_usuario on auth.users;
create trigger trigger_nuevo_usuario
  after insert on auth.users
  for each row execute function public.manejar_nuevo_usuario();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.usuarios enable row level security;
alter table public.negocios enable row level security;
alter table public.productos enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;
alter table public.ubicaciones_activas enable row level security;
alter table public.ventas_caja enable row level security;
alter table public.ventas_caja_items enable row level security;

-- Función helper: obtiene el rol del usuario autenticado actual
create or replace function public.rol_actual()
returns text
language sql
security definer
stable
as $$
  select rol from public.usuarios where id = auth.uid();
$$;

-- usuarios: cada quien ve su propio registro; admin ve todos
create policy "usuarios_select" on public.usuarios
  for select using (id = auth.uid() or public.rol_actual() = 'admin');
create policy "usuarios_update_propio" on public.usuarios
  for update using (id = auth.uid() or public.rol_actual() = 'admin');
create policy "usuarios_insert_propio" on public.usuarios
  for insert with check (id = auth.uid());

-- negocios: público puede ver negocios activos (catálogo); vendedor gestiona el suyo; admin todo
create policy "negocios_select_publico" on public.negocios
  for select using (activo = true or public.rol_actual() = 'admin' or vendedor_id = auth.uid());
create policy "negocios_insert_vendedor" on public.negocios
  for insert with check (vendedor_id = auth.uid() or public.rol_actual() = 'admin');
create policy "negocios_update_propio" on public.negocios
  for update using (vendedor_id = auth.uid() or public.rol_actual() = 'admin');

-- productos: público ve productos activos; vendedor gestiona los de su negocio; admin todo
create policy "productos_select_publico" on public.productos
  for select using (
    activo = true or public.rol_actual() = 'admin'
    or negocio_id in (select id from public.negocios where vendedor_id = auth.uid())
  );
create policy "productos_modifica_vendedor" on public.productos
  for all using (
    public.rol_actual() = 'admin'
    or negocio_id in (select id from public.negocios where vendedor_id = auth.uid())
  );

-- pedidos: cliente ve los suyos; vendedor ve los de su negocio; admin todos
create policy "pedidos_select" on public.pedidos
  for select using (
    cliente_id = auth.uid()
    or public.rol_actual() = 'admin'
    or negocio_id in (select id from public.negocios where vendedor_id = auth.uid())
  );
create policy "pedidos_insert" on public.pedidos
  for insert with check (true); -- cualquiera puede crear un pedido (incluye no registrados vía función pública)
create policy "pedidos_update" on public.pedidos
  for update using (
    public.rol_actual() = 'admin'
    or negocio_id in (select id from public.negocios where vendedor_id = auth.uid())
  );

-- pedido_items: mismo criterio que su pedido — cliente dueño, vendedor del negocio, o admin
create policy "pedido_items_select" on public.pedido_items
  for select using (
    pedido_id in (
      select id from public.pedidos
      where cliente_id = auth.uid()
         or negocio_id in (select id from public.negocios where vendedor_id = auth.uid())
    )
    or public.rol_actual() = 'admin'
  );
create policy "pedido_items_insert" on public.pedido_items
  for insert with check (true); -- se crea junto con el pedido, incluye clientes no registrados

-- ubicaciones_activas: cliente del pedido y vendedor del negocio pueden ver/actualizar
create policy "ubicaciones_select" on public.ubicaciones_activas
  for select using (
    pedido_id in (
      select id from public.pedidos
      where cliente_id = auth.uid()
         or negocio_id in (select id from public.negocios where vendedor_id = auth.uid())
    )
    or public.rol_actual() = 'admin'
  );
create policy "ubicaciones_upsert_vendedor" on public.ubicaciones_activas
  for all using (
    pedido_id in (
      select id from public.pedidos
      where negocio_id in (select id from public.negocios where vendedor_id = auth.uid())
    )
    or public.rol_actual() = 'admin'
  );

-- ventas_caja: solo el vendedor dueño del negocio y admin
create policy "ventas_caja_select" on public.ventas_caja
  for select using (
    public.rol_actual() = 'admin'
    or negocio_id in (select id from public.negocios where vendedor_id = auth.uid())
  );
create policy "ventas_caja_insert" on public.ventas_caja
  for insert with check (
    negocio_id in (select id from public.negocios where vendedor_id = auth.uid())
  );

-- ventas_caja_items: mismo criterio que su venta — solo el vendedor dueño y admin
create policy "ventas_caja_items_select" on public.ventas_caja_items
  for select using (
    public.rol_actual() = 'admin'
    or venta_id in (
      select id from public.ventas_caja
      where negocio_id in (select id from public.negocios where vendedor_id = auth.uid())
    )
  );
create policy "ventas_caja_items_insert" on public.ventas_caja_items
  for insert with check (
    venta_id in (
      select id from public.ventas_caja
      where negocio_id in (select id from public.negocios where vendedor_id = auth.uid())
    )
  );

-- Habilitar Realtime en ubicaciones_activas y pedidos (para tracking en vivo y estado de pedido)
alter publication supabase_realtime add table public.ubicaciones_activas;
alter publication supabase_realtime add table public.pedidos;
