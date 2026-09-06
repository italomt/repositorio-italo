-- Assistente de viagem: histórico de conversa por viagem.
-- O chat guarda o que foi dito e a ação executada (jsonb) para o card de "Desfazer"
-- continuar funcionando depois de recarregar a página.

create table if not exists public.assistente_mensagens (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references viagens(id) on delete cascade,
  papel text not null check (papel in ('user', 'assistente')),
  conteudo text not null default '',
  -- {tipo, dados, resultado_id} — resultado_id é a linha criada, usada pelo "Desfazer"
  acao jsonb,
  -- anexo enviado pelo usuário (PDF/imagem), no bucket privado 'documentos'
  anexo_path text,
  anexo_tipo text,
  criado_por uuid default auth.uid() references auth.users(id) on delete set null,
  criado_em timestamptz not null default now()
);

create index if not exists idx_assistente_mensagens_viagem
  on public.assistente_mensagens (viagem_id, criado_em);

alter table public.assistente_mensagens enable row level security;

drop policy if exists "membros leem mensagens do assistente" on public.assistente_mensagens;
create policy "membros leem mensagens do assistente" on public.assistente_mensagens for select
  using (eh_membro(viagem_id));

drop policy if exists "membros criam mensagens do assistente" on public.assistente_mensagens;
create policy "membros criam mensagens do assistente" on public.assistente_mensagens for insert
  with check (eh_membro(viagem_id));

-- Só quem escreveu apaga (limpar conversa)
drop policy if exists "autor apaga mensagens do assistente" on public.assistente_mensagens;
create policy "autor apaga mensagens do assistente" on public.assistente_mensagens for delete
  using (eh_membro(viagem_id) and criado_por = auth.uid());
