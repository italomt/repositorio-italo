-- Orçamento diário de gasto em viagem.
-- orcamento_total misturava custo fixo já pago (passagens, hostels) com o
-- dinheiro do dia a dia, e ficava obsoleto quando a viagem mudava de duração.
-- O diário é o número que o viajante realmente tem na cabeça.

alter table public.viagens
  add column if not exists orcamento_diario numeric;

comment on column public.viagens.orcamento_diario is
  'Quanto se pretende gastar por dia DURANTE a viagem, na moeda_principal. Não inclui o que foi pago antes de viajar (passagens, hospedagens pré-pagas).';

update public.viagens
set orcamento_diario = 100
where id = 'c63a9221-8a30-4edd-b246-6bf0189aa98a'
  and orcamento_diario is null;
