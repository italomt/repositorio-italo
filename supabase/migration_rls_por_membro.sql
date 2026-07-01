-- RLS por membro: cada usuário só acessa viagens em que está em usuarios_viagem.
-- Aplicada em 01/07/2026.

-- 0. Membros reais da Europa 2026
insert into usuarios_viagem (viagem_id, usuario_id, papel, status)
select 'c63a9221-8a30-4edd-b246-6bf0189aa98a'::uuid, u.id, 'editor', 'aceito'
from auth.users u
where u.email in ('roniel.falcao@gmail.com', 'italomouraotimbo@hotmail.com')
on conflict do nothing;

-- 1. Helper security definer (bypassa RLS de usuarios_viagem, sem recursão)
create or replace function public.eh_membro(v uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from usuarios_viagem
    where viagem_id = v and usuario_id = auth.uid() and status = 'aceito'
  )
$$;

-- 2. viagens: criador enxerga a própria linha antes do vínculo existir
alter table viagens add column if not exists created_by uuid default auth.uid();
update viagens set created_by = uv.usuario_id
from usuarios_viagem uv
where uv.viagem_id = viagens.id and uv.papel = 'owner' and viagens.created_by is null;

drop policy if exists "autenticados acessam viagens" on viagens;
create policy "membros leem viagens" on viagens for select
  using (eh_membro(id) or created_by = auth.uid());
create policy "autenticados criam viagens" on viagens for insert
  with check (auth.role() = 'authenticated');
create policy "membros atualizam viagens" on viagens for update
  using (eh_membro(id) or created_by = auth.uid());
create policy "membros excluem viagens" on viagens for delete
  using (eh_membro(id) or created_by = auth.uid());

-- 3. usuarios_viagem: cada um gerencia o próprio vínculo; membros veem a lista
drop policy if exists "aut u_v" on usuarios_viagem;
create policy "membros leem vinculos" on usuarios_viagem for select
  using (usuario_id = auth.uid() or eh_membro(viagem_id));
create policy "usuario cria proprio vinculo" on usuarios_viagem for insert
  with check (usuario_id = auth.uid());
create policy "usuario altera proprio vinculo" on usuarios_viagem for update
  using (usuario_id = auth.uid());
create policy "usuario remove proprio vinculo" on usuarios_viagem for delete
  using (usuario_id = auth.uid());

-- 4. Tabelas filhas: acesso só para membros da viagem
do $$
declare t text;
begin
  foreach t in array array['dias','atracoes','gastos','pendencias','hospedagens','transportes','documentos'] loop
    execute format('drop policy if exists "autenticados acessam %1$s" on %1$I', t);
    execute format('drop policy if exists "aut dias" on %I', t);
    execute format('drop policy if exists "aut hosp" on %I', t);
    execute format('drop policy if exists "Usuarios autenticados podem ler documentos" on %I', t);
    execute format('drop policy if exists "Usuarios autenticados podem inserir documentos" on %I', t);
    execute format('drop policy if exists "Usuarios autenticados podem atualizar documentos" on %I', t);
    execute format('drop policy if exists "Usuarios autenticados podem excluir documentos" on %I', t);
    execute format('create policy "membros acessam %1$s" on %1$I for all using (eh_membro(viagem_id)) with check (eh_membro(viagem_id))', t);
  end loop;
end $$;

-- 5. Convite: lookup de viagem por código sem ser membro, via RPC controlada
create or replace function public.viagem_por_convite(codigo text)
returns table (id uuid, nome text)
language sql stable security definer
set search_path = public
as $$
  select v.id, v.nome from viagens v
  where upper(v.codigo_convite) = upper(codigo)
$$;

-- 6. Códigos de convite não podem colidir
create unique index if not exists uq_viagens_codigo_convite
  on viagens (codigo_convite) where codigo_convite is not null;
