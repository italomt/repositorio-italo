-- ============================================================
-- Migração: normalização do schema
-- Cria viagens, cidades, dias. Migra dados existentes.
-- Execute no SQL Editor do Supabase.
-- ============================================================

-- 1) TABELA VIAGENS
CREATE TABLE IF NOT EXISTS viagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL DEFAULT 'Europa 2026',
  data_inicio DATE NOT NULL DEFAULT '2026-09-14',
  data_fim DATE NOT NULL DEFAULT '2026-10-05',
  status TEXT DEFAULT 'planejando',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE viagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "autenticados acessam viagens" ON viagens FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Insere a viagem padrão (se não existir)
INSERT INTO viagens (nome, data_inicio, data_fim, status)
SELECT 'Europa 2026', '2026-09-14', '2026-10-05', 'planejando'
WHERE NOT EXISTS (SELECT 1 FROM viagens LIMIT 1);

-- 2) TABELA CIDADES (extrai dados únicos de destinos)
CREATE TABLE IF NOT EXISTS cidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  pais TEXT NOT NULL,
  flag_emoji TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (nome, pais)
);

ALTER TABLE cidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "autenticados acessam cidades" ON cidades FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Extrai cidades únicas dos destinos existentes
INSERT INTO cidades (nome, pais, flag_emoji)
SELECT DISTINCT d.cidade, d.pais, d.flag_emoji
FROM destinos d
WHERE NOT EXISTS (
  SELECT 1 FROM cidades c WHERE c.nome = d.cidade AND c.pais = d.pais
);

-- 3) TABELA DIAS (substitui destinos)
CREATE TABLE IF NOT EXISTS dias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id UUID REFERENCES viagens(id) ON DELETE CASCADE,
  cidade_id UUID REFERENCES cidades(id),
  data DATE NOT NULL,
  notas TEXT,
  status TEXT DEFAULT 'planejando',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (viagem_id, data)
);

ALTER TABLE dias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "autenticados acessam dias" ON dias FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Migra destinos → dias, mapeando cidade via join
INSERT INTO dias (id, viagem_id, cidade_id, data, notas, status)
SELECT
  d.id,
  (SELECT id FROM viagens LIMIT 1),
  c.id,
  d.data,
  d.notas,
  d.status
FROM destinos d
JOIN cidades c ON c.nome = d.cidade AND c.pais = d.pais
WHERE NOT EXISTS (SELECT 1 FROM dias WHERE id = d.id);

-- Copia os IDs que não foram migrados (cidade não encontrada — fallback)
INSERT INTO cidades (nome, pais, flag_emoji)
SELECT DISTINCT d.cidade, d.pais, d.flag_emoji
FROM destinos d
WHERE NOT EXISTS (SELECT 1 FROM cidades c WHERE c.nome = d.cidade AND c.pais = d.pais);

INSERT INTO dias (id, viagem_id, cidade_id, data, notas, status)
SELECT
  d.id,
  (SELECT id FROM viagens LIMIT 1),
  c.id,
  d.data,
  d.notas,
  d.status
FROM destinos d
JOIN cidades c ON c.nome = d.cidade AND c.pais = d.pais
WHERE NOT EXISTS (SELECT 1 FROM dias WHERE id = d.id);

-- 4) ÍNDICES
CREATE INDEX IF NOT EXISTS idx_dias_viagem ON dias(viagem_id);
CREATE INDEX IF NOT EXISTS idx_dias_cidade ON dias(cidade_id);
CREATE INDEX IF NOT EXISTS idx_dias_data ON dias(data);
CREATE INDEX IF NOT EXISTS idx_atracoes_dia ON atracoes(destino_id);
CREATE INDEX IF NOT EXISTS idx_gastos_dia ON gastos(destino_id);
CREATE INDEX IF NOT EXISTS idx_gastos_data ON gastos(data_gasto);

-- 5) NORMALIZA PENDÊNCIAS: estado + CHECK constraints
ALTER TABLE pendencias ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'aberta';
UPDATE pendencias SET estado = 'concluida' WHERE concluida = true;
ALTER TABLE pendencias ADD COLUMN IF NOT EXISTS concluida_em TIMESTAMPTZ;
ALTER TABLE pendencias ADD COLUMN IF NOT EXISTS cancelada_em TIMESTAMPTZ;

-- CHECK constraint para estado
ALTER TABLE pendencias DROP CONSTRAINT IF EXISTS pendencias_estado_check;
ALTER TABLE pendencias ADD CONSTRAINT pendencias_estado_check
  CHECK (estado IN ('aberta', 'em_andamento', 'concluida', 'cancelada'));

-- CHECK constraint para urgencia
ALTER TABLE pendencias DROP CONSTRAINT IF EXISTS pendencias_urgencia_check;
ALTER TABLE pendencias ADD CONSTRAINT pendencias_urgencia_check
  CHECK (urgencia IN ('alta', 'media', 'baixa', 'normal'));

CREATE INDEX IF NOT EXISTS idx_pendencias_estado ON pendencias(estado);

-- 6) RENOMEIA COLUNAS PARA PADRONIZAR
-- Atracoes: custo_estimado_eur → valor + moeda (manter compatibilidade)
ALTER TABLE atracoes ADD COLUMN IF NOT EXISTS valor NUMERIC;
ALTER TABLE atracoes ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'EUR';
UPDATE atracoes SET valor = custo_estimado_eur, moeda = 'EUR' WHERE valor IS NULL AND custo_estimado_eur IS NOT NULL;
ALTER TABLE atracoes RENAME COLUMN link_reserva TO link;

-- Gastos: valor_original → valor, moeda_original → moeda (já feito parcialmente)
ALTER TABLE gastos RENAME COLUMN valor_original TO valor;
ALTER TABLE gastos RENAME COLUMN moeda_original TO moeda;

-- Transportes: custo_estimado_brl → valor + moeda
ALTER TABLE transportes ADD COLUMN IF NOT EXISTS valor NUMERIC;
ALTER TABLE transportes ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'BRL';
UPDATE transportes SET valor = custo_estimado_brl, moeda = 'BRL' WHERE valor IS NULL AND custo_estimado_brl IS NOT NULL;
ALTER TABLE transportes RENAME COLUMN link_reserva TO link;

-- Acomodacoes: preco_noite → valor_noite, link_reserva → link
ALTER TABLE acomodacoes ADD COLUMN IF NOT EXISTS valor_noite NUMERIC;
UPDATE acomodacoes SET valor_noite = preco_noite WHERE valor_noite IS NULL AND preco_noite IS NOT NULL;
ALTER TABLE acomodacoes RENAME COLUMN link_reserva TO link;

-- 7) LIMPA TABELAS FANTASMAS (não têm dados, não têm código)
DROP TABLE IF EXISTS memorias CASCADE;
DROP TABLE IF EXISTS orcamentos CASCADE;
DROP TABLE IF EXISTS atracao_participantes CASCADE;
DROP TABLE IF EXISTS gasto_participantes CASCADE;

-- Remove colunas órfãs das features removidas
ALTER TABLE atracoes DROP COLUMN IF EXISTS compartilhada;
ALTER TABLE gastos DROP COLUMN IF EXISTS pago_por;
ALTER TABLE gastos DROP COLUMN IF EXISTS divisao_tipo;
