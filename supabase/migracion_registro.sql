-- Migración: arregla el registro de clientes desde /registro, que estaba
-- roto porque la tabla usuarios tenía RLS activado sin política de INSERT
-- (y además fallaría igual si tu proyecto de Supabase pide confirmar el
-- correo, porque en ese momento todavía no hay sesión activa).
--
-- La solución es un trigger que crea la fila en public.usuarios apenas se
-- crea la cuenta en auth.users, usando permisos de superusuario — así no
-- depende de RLS ni de que ya haya sesión.
--
-- Solo corre esto si ya habías ejecutado supabase/schema.sql antes de esta
-- actualización. Los proyectos nuevos ya lo incluyen.

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

drop policy if exists "usuarios_insert_propio" on public.usuarios;
create policy "usuarios_insert_propio" on public.usuarios
  for insert with check (id = auth.uid());

-- Si ya tenías cuentas huérfanas (se creó el auth.users pero nunca se pudo
-- guardar el perfil), esto las repara rellenando lo que se pueda desde el
-- correo. Edítalas después a mano desde el panel admin si hace falta.
insert into public.usuarios (id, rol, nombre_completo, telefono, email, es_registrado)
select u.id, 'cliente', '', '', u.email, true
from auth.users u
left join public.usuarios pu on pu.id = u.id
where pu.id is null
on conflict (id) do nothing;
