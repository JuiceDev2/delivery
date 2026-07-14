-- Migración: agrega control de horario a negocios ya existentes.
-- Solo corre esto si ya habías ejecutado supabase/schema.sql antes de esta actualización.

alter table public.negocios
  add column if not exists abierto boolean not null default true,
  add column if not exists cerrado_hasta timestamptz,
  add column if not exists acepta_pedidos_cerrado boolean not null default false;
