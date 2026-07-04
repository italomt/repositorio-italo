-- Infraestrutura de notificações push (Web Push) + primeira regra: clima do dia seguinte.
-- Aplicada em 03/07/2026.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create table if not exists public.push_subscriptions (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "usuario gerencia proprias subscriptions" on push_subscriptions;
create policy "usuario gerencia proprias subscriptions" on push_subscriptions for all
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

-- Guarda o secret criptografado no Vault — a tabela cron.job fica só com a
-- referência (nome), nunca com o valor em texto puro.
create extension if not exists supabase_vault;

select vault.create_secret(
  'c96d41158d48ab98a0aeb01eefcc1b5f102c4f9e71ba5460',
  'cron_secret_notificacoes',
  'Secret que autentica o cron diário na edge function enviar-notificacoes'
) where not exists (select 1 from vault.secrets where name = 'cron_secret_notificacoes');

-- Roda todo dia às 11h UTC (08h em Brasília) e chama a edge function que decide
-- o que notificar. O secret no header (lido do Vault, nunca em texto puro aqui)
-- impede que qualquer um dispare o envio.
select cron.schedule(
  'notificacoes-diarias',
  '0 11 * * *',
  $$
  select net.http_post(
    url := 'https://ncdgfegnkhfytxkiqdek.supabase.co/functions/v1/enviar-notificacoes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret_notificacoes')
    ),
    body := '{}'::jsonb
  );
  $$
);
