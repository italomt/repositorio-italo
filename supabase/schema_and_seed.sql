-- ============================================================
-- Europa Trip App — schema + seeds
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute.
-- ============================================================

-- Destinos: os 22 dias do roteiro
CREATE TABLE destinos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL UNIQUE,
  cidade TEXT NOT NULL,
  pais TEXT NOT NULL,
  flag_emoji TEXT,
  notas TEXT,
  status TEXT DEFAULT 'planejando',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transportes entre destinos
CREATE TABLE transportes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destino_origem_id UUID REFERENCES destinos(id),
  destino_destino_id UUID REFERENCES destinos(id),
  tipo TEXT NOT NULL,
  operadora TEXT,
  horario_saida TIMESTAMPTZ,
  horario_chegada TIMESTAMPTZ,
  custo_estimado_brl NUMERIC,
  custo_real_brl NUMERIC,
  status TEXT DEFAULT 'pendente',
  link_reserva TEXT,
  codigo_reserva TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Atrações por dia
CREATE TABLE atracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destino_id UUID REFERENCES destinos(id),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  horario_previsto TIME,
  duracao_minutos INTEGER,
  precisa_reserva BOOLEAN DEFAULT false,
  status_reserva TEXT DEFAULT 'nao_precisa',
  link_reserva TEXT,
  custo_estimado_eur NUMERIC,
  custo_real_eur NUMERIC,
  latitude NUMERIC,
  longitude NUMERIC,
  notas TEXT,
  origem_ideia TEXT DEFAULT 'manual',
  concluida BOOLEAN DEFAULT false,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  foto_url TEXT,
  ordem_no_dia INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Gastos durante a viagem
CREATE TABLE gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destino_id UUID REFERENCES destinos(id),
  descricao TEXT NOT NULL,
  valor_original NUMERIC NOT NULL,
  moeda_original TEXT NOT NULL DEFAULT 'EUR',
  valor_brl NUMERIC,
  cotacao_usada NUMERIC,
  categoria TEXT NOT NULL,
  data_gasto DATE NOT NULL,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pendências e checklist pré-viagem
CREATE TABLE pendencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  prazo_sugerido DATE,
  link TEXT,
  concluida BOOLEAN DEFAULT false,
  notas TEXT,
  urgencia TEXT DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Memórias por dia
CREATE TABLE memorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destino_id UUID REFERENCES destinos(id) UNIQUE,
  nota TEXT,
  rating_dia INTEGER CHECK (rating_dia >= 1 AND rating_dia <= 5),
  foto_capa_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orçamentos por destino
CREATE TABLE orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destino_id UUID REFERENCES destinos(id) UNIQUE,
  orcamento_diario_eur NUMERIC DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Base de conhecimento: atrações famosas que precisam de reserva
CREATE TABLE base_atracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  pais TEXT NOT NULL,
  precisa_reserva BOOLEAN DEFAULT false,
  dias_antecedencia INTEGER DEFAULT 0,
  custo_estimado_eur NUMERIC,
  latitude NUMERIC,
  longitude NUMERIC,
  link_reserva_oficial TEXT,
  dica TEXT
);

-- ============================================================
-- SEEDS
-- ============================================================

-- Seed: 22 dias do roteiro
INSERT INTO destinos (data, cidade, pais, flag_emoji, status) VALUES
('2025-09-14', 'Lisboa', 'Portugal', '🇵🇹', 'planejando'),
('2025-09-15', 'Lisboa', 'Portugal', '🇵🇹', 'planejando'),
('2025-09-16', 'Madrid', 'Espanha', '🇪🇸', 'planejando'),
('2025-09-17', 'Madrid', 'Espanha', '🇪🇸', 'planejando'),
('2025-09-18', 'Barcelona', 'Espanha', '🇪🇸', 'planejando'),
('2025-09-19', 'Barcelona', 'Espanha', '🇪🇸', 'planejando'),
('2025-09-20', 'Milão', 'Itália', '🇮🇹', 'planejando'),
('2025-09-21', 'Milão', 'Itália', '🇮🇹', 'planejando'),
('2025-09-22', 'Florença', 'Itália', '🇮🇹', 'planejando'),
('2025-09-23', 'Roma', 'Itália', '🇮🇹', 'planejando'),
('2025-09-24', 'Roma', 'Itália', '🇮🇹', 'planejando'),
('2025-09-25', 'Roma', 'Itália', '🇮🇹', 'planejando'),
('2025-09-26', 'Paris', 'França', '🇫🇷', 'planejando'),
('2025-09-27', 'Paris', 'França', '🇫🇷', 'planejando'),
('2025-09-28', 'Paris', 'França', '🇫🇷', 'planejando'),
('2025-09-29', 'Paris', 'França', '🇫🇷', 'planejando'),
('2025-09-30', 'Amsterdã', 'Holanda', '🇳🇱', 'planejando'),
('2025-10-01', 'Amsterdã', 'França', '🇳🇱', 'planejando'),
('2025-10-02', 'Porto', 'Portugal', '🇵🇹', 'planejando'),
('2025-10-03', 'Lisboa', 'Portugal', '🇵🇹', 'planejando'),
('2025-10-04', 'Lisboa', 'Portugal', '🇵🇹', 'planejando'),
('2025-10-05', 'Lisboa', 'Portugal', '🇵🇹', 'planejando');

-- Seed: base de atrações famosas com info de reserva
INSERT INTO base_atracoes (nome, cidade, pais, precisa_reserva, dias_antecedencia, custo_estimado_eur, latitude, longitude, link_reserva_oficial, dica) VALUES
('Coliseu', 'Roma', 'Itália', true, 60, 18, 41.8902, 12.4922, 'https://www.coopculture.it', 'Reservar com no mínimo 60 dias. Inclui Fórum Romano.'),
('Vaticano + Museus', 'Roma', 'Itália', true, 45, 17, 41.9022, 12.4539, 'https://www.museivaticani.va', 'Filas enormes sem reserva. Reservar com 45 dias.'),
('Torre Eiffel', 'Paris', 'França', true, 30, 29, 48.8584, 2.2945, 'https://www.toureiffel.paris', 'Subida ao topo esgota rápido. Reservar com 30 dias.'),
('Disneyland Paris', 'Paris', 'França', true, 14, 79, 48.8722, 2.7760, 'https://www.disneylandparis.com', 'Comprar online é mais barato que na bilheteria.'),
('Versalhes', 'Paris', 'França', true, 14, 21, 48.8049, 2.1204, 'https://www.chateauversailles.fr', 'Chegar cedo. Jardins às vezes têm entrada separada.'),
('Sagrada Família', 'Barcelona', 'Espanha', true, 60, 26, 41.4036, 2.1744, 'https://www.sagradafamilia.org', 'Reserva obrigatória. Torres custam mais.'),
('Museu do Louvre', 'Paris', 'França', true, 7, 22, 48.8606, 2.3376, 'https://www.louvre.fr', 'Comprar online evita fila de horas.'),
('Park Güell', 'Barcelona', 'Espanha', true, 30, 10, 41.4145, 2.1527, 'https://parkguell.barcelona', 'Zona monumental tem limite de visitantes por hora.'),
('Museu do Prado', 'Madrid', 'Espanha', false, 0, 15, 40.4138, -3.6922, 'https://www.museodelprado.es', 'Às terças gratuito das 18h às 20h.'),
('LX Factory', 'Lisboa', 'Portugal', false, 0, 0, 38.7025, -9.1782, null, 'Melhor aos domingos com o mercado. Entrada gratuita.'),
('Belém + Torre', 'Lisboa', 'Portugal', true, 7, 6, 38.6916, -9.2160, 'https://www.torrebelem.pt', 'Fila rápida com reserva online.'),
('Duomo di Milano', 'Milão', 'Itália', true, 7, 5, 45.4641, 9.1919, 'https://www.duomomilano.it', 'Entrada da catedral gratuita. Terraço pago.'),
('Ponte Vecchio', 'Florença', 'Itália', false, 0, 0, 43.7681, 11.2531, null, 'Exterior gratuito. Melhor ao amanhecer sem turistas.'),
('Torre de Pisa', 'Pisa', 'Itália', true, 14, 18, 43.7230, 10.3966, 'https://www.opapisa.it', 'Escalar a torre requer reserva. Praça é gratuita.'),
('Rijksmuseum', 'Amsterdã', 'Holanda', true, 14, 22, 52.3600, 4.8852, 'https://www.rijksmuseum.nl', 'Bilhetes esgotam. Reservar com antecedência.'),
('Anne Frank Huis', 'Amsterdã', 'Holanda', true, 60, 16, 52.3752, 4.8839, 'https://www.annefrank.org', 'Ingressos liberam com 2 meses de antecedência e esgotam.'),
('Museu do Futebol Barcelona', 'Barcelona', 'Espanha', true, 7, 26, 41.3809, 2.1228, 'https://www.fcbarcelona.com', 'Inclui tour ao Camp Nou.'),
('Palácio Real de Madrid', 'Madrid', 'Espanha', false, 0, 14, 40.4179, -3.7143, 'https://www.patrimonionacional.es', 'Gratuito para cidadãos da UE. Turistas pagam.'),
('Spaccanapoli', 'Nápoles', 'Itália', false, 0, 0, 40.8494, 14.2559, null, 'Rua histórica gratuita. Pedir pizza na Di Matteo.'),
('Vondelpark', 'Amsterdã', 'Holanda', false, 0, 0, 52.3580, 4.8686, null, 'Parque público gratuito. Ótimo para relaxar.');

-- Seed: pendências pré-viagem
INSERT INTO pendencias (titulo, categoria, prazo_sugerido, link, urgencia) VALUES
('Comprar voo Ryanair Lisboa → Madrid (16/set, 07h00)', 'transporte', '2025-07-15', 'https://www.ryanair.com', 'alta'),
('Comprar AVE Madrid → Barcelona (18/set, 08h00)', 'transporte', '2025-07-15', 'https://www.renfe.com', 'alta'),
('Comprar voo Vueling Barcelona → Milão (20/set, 17h00)', 'transporte', '2025-07-15', 'https://www.vueling.com', 'alta'),
('Reservar carro alugado em Milão (22 a 25/set, ~4 dias)', 'transporte', '2025-07-20', 'https://www.europcar.com', 'alta'),
('Comprar voo Transavia Roma → Paris (26/set, 06h30)', 'transporte', '2025-07-15', 'https://www.transavia.com', 'alta'),
('Comprar TGV Paris → Berna → Paris (28/set)', 'transporte', '2025-07-20', 'https://www.sncf-connect.com', 'alta'),
('Comprar FlixBus Paris → Amsterdã (29/set, 23h00)', 'transporte', '2025-07-25', 'https://www.flixbus.com.br', 'media'),
('Comprar Thalys Amsterdã → Paris (01/out)', 'transporte', '2025-07-25', 'https://www.eurostar.com', 'media'),
('Comprar voo Paris → Porto (02/out, 07h00)', 'transporte', '2025-07-15', 'https://www.google.com/flights', 'alta'),
('Comprar trem CP Porto → Lisboa (03/out, manhã)', 'transporte', '2025-08-01', 'https://www.cp.pt', 'media'),
('Reservar ingresso Coliseu (23/set)', 'atracoes', '2025-07-15', 'https://www.coopculture.it', 'alta'),
('Reservar Museus do Vaticano (24/set)', 'atracoes', '2025-07-20', 'https://www.museivaticani.va', 'alta'),
('Reservar Torre Eiffel (Paris)', 'atracoes', '2025-08-01', 'https://www.toureiffel.paris', 'alta'),
('Reservar Disneyland Paris (27/set)', 'atracoes', '2025-08-15', 'https://www.disneylandparis.com', 'media'),
('Reservar Versalhes (29/set)', 'atracoes', '2025-08-15', 'https://www.chateauversailles.fr', 'media'),
('Reservar Sagrada Família (Barcelona)', 'atracoes', '2025-07-15', 'https://www.sagradafamilia.org', 'alta'),
('Reservar Anne Frank Huis (Amsterdã)', 'atracoes', '2025-07-15', 'https://www.annefrank.org', 'alta'),
('Contratar seguro viagem', 'documentacao', '2025-08-01', null, 'alta'),
('Solicitar cartão sem IOF (Wise ou Nomad)', 'documentacao', '2025-07-20', 'https://wise.com/br', 'alta'),
('Comprar chip/eSIM Europa', 'documentacao', '2025-08-20', null, 'media'),
('Comprar adaptador tomada tipo C/F', 'documentacao', '2025-08-20', null, 'baixa'),
('Verificar validade do passaporte', 'documentacao', '2025-07-10', null, 'alta'),
('Separar dinheiro em CHF para Suíça', 'documentacao', '2025-09-10', null, 'media');

-- Seed: atrações iniciais por destino
INSERT INTO atracoes (destino_id, nome, categoria, precisa_reserva, status_reserva, custo_estimado_eur, latitude, longitude, ordem_no_dia)
SELECT d.id, a.nome, a.categoria, a.precisa_reserva, a.status_reserva, a.custo, a.lat, a.lng, a.ordem
FROM destinos d
JOIN (VALUES
  ('2025-09-15'::date, 'LX Factory', 'cultura', false, 'nao_precisa', 0, 38.7025, -9.1782, 1),
  ('2025-09-15'::date, 'Belém + Torre', 'cultura', true, 'pendente', 6, 38.6916, -9.2160, 2),
  ('2025-09-15'::date, 'Príncipe Real', 'gastronomia', false, 'nao_precisa', 20, 38.7132, -9.1489, 3),
  ('2025-09-15'::date, 'Bairro Alto noite', 'balada', false, 'nao_precisa', 30, 38.7106, -9.1445, 4),
  ('2025-09-16'::date, 'Mercado San Miguel', 'gastronomia', false, 'nao_precisa', 25, 40.4153, -3.7093, 1),
  ('2025-09-16'::date, 'Gran Via', 'compras', false, 'nao_precisa', 0, 40.4200, -3.7024, 2),
  ('2025-09-17'::date, 'Parque del Retiro', 'natureza', false, 'nao_precisa', 0, 40.4153, -3.6844, 1),
  ('2025-09-17'::date, 'Malasaña', 'gastronomia', false, 'nao_precisa', 20, 40.4266, -3.7053, 2),
  ('2025-09-18'::date, 'Gothic Quarter', 'cultura', false, 'nao_precisa', 0, 41.3833, 2.1774, 1),
  ('2025-09-18'::date, 'La Boqueria', 'gastronomia', false, 'nao_precisa', 15, 41.3817, 2.1719, 2),
  ('2025-09-18'::date, 'Barceloneta', 'natureza', false, 'nao_precisa', 0, 41.3793, 2.1913, 3),
  ('2025-09-19'::date, 'Passeig de Gràcia', 'compras', false, 'nao_precisa', 0, 41.3925, 2.1649, 1),
  ('2025-09-19'::date, 'Sagrada Família', 'cultura', true, 'pendente', 26, 41.4036, 2.1744, 2),
  ('2025-09-21'::date, 'Navigli', 'gastronomia', false, 'nao_precisa', 20, 45.4483, 9.1717, 1),
  ('2025-09-21'::date, 'Brera', 'cultura', false, 'nao_precisa', 0, 45.4722, 9.1859, 2),
  ('2025-09-21'::date, 'Duomo di Milano', 'cultura', true, 'pendente', 5, 45.4641, 9.1919, 3),
  ('2025-09-23'::date, 'Trastevere', 'gastronomia', false, 'nao_precisa', 25, 41.8893, 12.4698, 1),
  ('2025-09-24'::date, 'Coliseu', 'cultura', true, 'pendente', 18, 41.8902, 12.4922, 1),
  ('2025-09-24'::date, 'Vaticano + Museus', 'cultura', true, 'pendente', 17, 41.9022, 12.4539, 2),
  ('2025-09-24'::date, 'Campo de Fiori', 'gastronomia', false, 'nao_precisa', 15, 41.8955, 12.4723, 3),
  ('2025-09-25'::date, 'Spaccanapoli Nápoles', 'cultura', false, 'nao_precisa', 0, 40.8494, 14.2559, 1),
  ('2025-09-26'::date, 'Le Marais', 'cultura', false, 'nao_precisa', 0, 48.8566, 2.3522, 1),
  ('2025-09-27'::date, 'Disneyland Paris', 'lazer', true, 'pendente', 79, 48.8722, 2.7760, 1),
  ('2025-09-28'::date, 'Berna centro histórico', 'cultura', false, 'nao_precisa', 0, 46.9480, 7.4474, 1),
  ('2025-09-29'::date, 'Versalhes', 'cultura', true, 'pendente', 21, 48.8049, 2.1204, 1),
  ('2025-09-29'::date, 'Torre Eiffel', 'cultura', true, 'pendente', 29, 48.8584, 2.2945, 2),
  ('2025-09-30'::date, 'Jordaan', 'cultura', false, 'nao_precisa', 0, 52.3752, 4.8839, 1),
  ('2025-09-30'::date, 'Vondelpark', 'natureza', false, 'nao_precisa', 0, 52.3580, 4.8686, 2),
  ('2025-09-30'::date, 'Anne Frank Huis', 'cultura', true, 'pendente', 16, 52.3752, 4.8839, 3),
  ('2025-10-02'::date, 'Mercado do Bolhão', 'gastronomia', false, 'nao_precisa', 15, 41.1496, -8.6109, 1),
  ('2025-10-02'::date, 'Galeria de Paris Porto', 'gastronomia', false, 'nao_precisa', 20, 41.1496, -8.6109, 2)
) AS a(data, nome, categoria, precisa_reserva, status_reserva, custo, lat, lng, ordem)
ON d.data = a.data;
