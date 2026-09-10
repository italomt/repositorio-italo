-- place_id do Google para atrações e hospedagens.
-- A URL do Google Maps montada só com latitude/longitude faz cada parada
-- aparecer como "Com alfinete", sem nome. Passando o place_id junto, o ponto
-- continua exato e o app do Maps mostra o nome real do lugar.

alter table public.atracoes
  add column if not exists place_id text;

alter table public.hospedagens
  add column if not exists place_id text;

comment on column public.atracoes.place_id is
  'Place ID do Google, obtido na geocodificação. Usado em waypoint_place_ids para o Maps exibir o nome da parada.';

comment on column public.hospedagens.place_id is
  'Place ID do Google, obtido na geocodificação. Usado como origin_place_id na rota do dia.';
