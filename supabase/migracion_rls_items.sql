-- Migración: agrega las políticas de RLS que faltaban en pedido_items y
-- ventas_caja_items. Sin ellas, esas tablas tenían RLS activado pero cero
-- políticas, así que TODO acceso (incluidas las inserciones desde el
-- checkout y la caja) se bloqueaba silenciosamente.
-- Solo corre esto si ya habías ejecutado supabase/schema.sql antes de esta actualización.

drop policy if exists "pedido_items_select" on public.pedido_items;
create policy "pedido_items_select" on public.pedido_items
  for select using (
    pedido_id in (
      select id from public.pedidos
      where cliente_id = auth.uid()
         or negocio_id in (select id from public.negocios where vendedor_id = auth.uid())
    )
    or public.rol_actual() = 'admin'
  );

drop policy if exists "pedido_items_insert" on public.pedido_items;
create policy "pedido_items_insert" on public.pedido_items
  for insert with check (true);

drop policy if exists "ventas_caja_items_select" on public.ventas_caja_items;
create policy "ventas_caja_items_select" on public.ventas_caja_items
  for select using (
    public.rol_actual() = 'admin'
    or venta_id in (
      select id from public.ventas_caja
      where negocio_id in (select id from public.negocios where vendedor_id = auth.uid())
    )
  );

drop policy if exists "ventas_caja_items_insert" on public.ventas_caja_items;
create policy "ventas_caja_items_insert" on public.ventas_caja_items
  for insert with check (
    venta_id in (
      select id from public.ventas_caja
      where negocio_id in (select id from public.negocios where vendedor_id = auth.uid())
    )
  );
