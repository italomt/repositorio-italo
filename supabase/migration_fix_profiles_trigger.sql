-- Correções da auditoria de 01/07/2026

-- 1. Trigger: cria profile automaticamente para todo novo usuário
-- (hoje o app tenta criar via cliente após signUp, mas sem sessão o RLS bloqueia em silêncio)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Backfill dos 4 usuários existentes sem profile
insert into public.profiles (id, nome)
select u.id, split_part(u.email, '@', 1)
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- 3. Advisor: fixa search_path da função existente (lint function_search_path_mutable)
alter function public.sync_atracao_contexto() set search_path = public;

-- 4. Remove policy duplicada em cidades (idêntica a "autenticados acessam cidades")
drop policy if exists "aut cid" on public.cidades;
