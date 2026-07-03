-- Fecha a auto-inscrição em viagem alheia (item #5 da AUDITORIA_GERAL).
-- Antes: qualquer autenticado podia inserir direto em usuarios_viagem como
-- 'editor'/'aceito' pra QUALQUER viagem_id que descobrisse, sem validar convite.
-- Agora: entrar como editor só é possível via RPC security definer que exige
-- um codigo_convite válido; a policy de INSERT direta só permite papel='owner'
-- (usado quando o próprio usuário cria uma viagem nova).
-- Aplicada em 03/07/2026.

drop policy if exists "usuario cria proprio vinculo" on usuarios_viagem;
create policy "dono cria proprio vinculo ao criar viagem" on usuarios_viagem for insert
  with check (usuario_id = auth.uid() and papel = 'owner');

create or replace function public.entrar_em_viagem_por_codigo(p_codigo text)
returns table (id uuid, nome text, ja_membro boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_nome text;
  v_ja_membro boolean;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  select v.id, v.nome into v_id, v_nome
  from viagens v
  where upper(v.codigo_convite) = upper(p_codigo);

  if v_id is null then
    raise exception 'Código de convite inválido';
  end if;

  select exists (
    select 1 from usuarios_viagem uv
    where uv.viagem_id = v_id and uv.usuario_id = auth.uid()
  ) into v_ja_membro;

  if not v_ja_membro then
    insert into usuarios_viagem (viagem_id, usuario_id, papel, status)
    values (v_id, auth.uid(), 'editor', 'aceito')
    on conflict (viagem_id, usuario_id) do nothing;
  end if;

  update profiles set active_viagem_id = v_id where id = auth.uid();

  return query select v_id, v_nome, v_ja_membro;
end;
$$;
