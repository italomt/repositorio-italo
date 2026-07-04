-- Gastos passam a ser privados por usuário: cada membro da viagem só enxerga
-- (e só mexe n)os próprios gastos, mesmo a viagem sendo compartilhada.
-- Aplicada em 03/07/2026.

drop policy if exists "membros acessam gastos" on gastos;

create policy "usuario le proprios gastos" on gastos for select
  using (eh_membro(viagem_id) and created_by = auth.uid());

create policy "usuario cria proprios gastos" on gastos for insert
  with check (eh_membro(viagem_id) and created_by = auth.uid());

create policy "usuario atualiza proprios gastos" on gastos for update
  using (eh_membro(viagem_id) and created_by = auth.uid());

create policy "usuario exclui proprios gastos" on gastos for delete
  using (eh_membro(viagem_id) and created_by = auth.uid());
