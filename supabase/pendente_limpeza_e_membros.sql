-- AÇÕES PENDENTES DA AUDITORIA (rodar no SQL Editor do Supabase)
-- Backup das viagens de teste salvo em: ~/Desktop/backup_viagens_teste_2026-07-01.json

-- 1. Adicionar membros à Europa 2026 (ajuste os emails se quiser)
insert into usuarios_viagem (viagem_id, usuario_id, papel, status)
select 'c63a9221-8a30-4edd-b246-6bf0189aa98a'::uuid, u.id, 'editor', 'aceito'
from auth.users u
where u.email in ('roniel.falcao@gmail.com', 'italomouraotimbo@hotmail.com')
on conflict do nothing;

-- 2. Apagar as 3 viagens de teste (a Europa 2026, id c63a9221..., NÃO está na lista)
do $$
declare ids uuid[] := array[
  '315a7a30-c278-40bf-b49e-b136a2d0bf6e', -- Fortaleza · jul. de 2026
  'bc3f8ad7-f336-42a8-820c-04ee49fe7fb4', -- Teste viagem Fortaleza
  '23c37c1a-7951-4c6c-80ee-43fb32619349'  -- Taiba · jul. de 2026
]::uuid[];
begin
  update profiles set active_viagem_id = 'c63a9221-8a30-4edd-b246-6bf0189aa98a'
    where active_viagem_id = any(ids);
  delete from pendencias      where viagem_id = any(ids);
  delete from gastos          where viagem_id = any(ids);
  delete from atracoes        where viagem_id = any(ids);
  delete from transportes     where viagem_id = any(ids)
    or destino_origem_id  in (select id from dias where viagem_id = any(ids))
    or destino_destino_id in (select id from dias where viagem_id = any(ids))
    or dia_origem_id      in (select id from dias where viagem_id = any(ids))
    or dia_destino_id     in (select id from dias where viagem_id = any(ids));
  delete from documentos      where viagem_id = any(ids);
  delete from hospedagens     where viagem_id = any(ids);
  delete from usuarios_viagem where viagem_id = any(ids);
  delete from dias            where viagem_id = any(ids);
  delete from viagens         where id = any(ids);
end $$;
