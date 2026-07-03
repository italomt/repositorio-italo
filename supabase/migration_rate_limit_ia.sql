-- Rate limit por usuário para a edge function openrouter-proxy.
-- Aplicada em 03/07/2026 (item #3 da AUDITORIA_GERAL).

create table if not exists public.ia_uso (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now()
);

alter table public.ia_uso enable row level security;

drop policy if exists "usuario le proprio uso ia" on public.ia_uso;
create policy "usuario le proprio uso ia" on public.ia_uso for select
  using (usuario_id = auth.uid());

drop policy if exists "usuario registra proprio uso ia" on public.ia_uso;
create policy "usuario registra proprio uso ia" on public.ia_uso for insert
  with check (usuario_id = auth.uid());

create index if not exists idx_ia_uso_usuario_tempo on public.ia_uso (usuario_id, criado_em desc);

-- Atômico: conta uso na janela e já registra se estiver dentro do limite.
create or replace function public.registrar_uso_ia(limite int default 40, janela_minutos int default 60)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  contagem int;
begin
  if auth.uid() is null then
    return false;
  end if;

  select count(*) into contagem
  from ia_uso
  where usuario_id = auth.uid()
    and criado_em > now() - (janela_minutos || ' minutes')::interval;

  if contagem >= limite then
    return false;
  end if;

  insert into ia_uso (usuario_id) values (auth.uid());
  return true;
end;
$$;
