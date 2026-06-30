-- ============================================================
-- Europa Trip App — Migração v2 (Arquitetura Final)
-- Multi-viagem, FK reais, auditoria, soft delete.
-- Execute no SQL Editor do Supabase.
-- ============================================================

-- ============================================================
-- 1. VIAGENS
-- ============================================================
CREATE TABLE IF NOT EXISTS viagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  descricao TEXT,
  tipo TEXT DEFAULT 'lazer',
  status TEXT DEFAULT 'planejando',
  moeda_principal TEXT DEFAULT 'EUR',
  fuso_principal TEXT,
  idioma TEXT DEFAULT 'pt-BR',
  cor TEXT DEFAULT '#5B7FFF',
  imagem_capa TEXT,
  orcamento_total NUMERIC,
  orcamento_gasto NUMERIC DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE viagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "autenticados acessam viagens" ON viagens FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

INSERT INTO viagens (nome, data_inicio, data_fim, tipo, status)
SELECT 'Europa 2026', '2026-09-14', '2026-10-05', 'lazer', 'planejando'
WHERE NOT EXISTS (SELECT 1 FROM viagens LIMIT 1);

-- ============================================================
-- 2. USUARIOS_VIAGEM
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios_viagem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id UUID NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  papel TEXT NOT NULL DEFAULT 'editor',
  status TEXT DEFAULT 'aceito',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (viagem_id, usuario_id)
);

ALTER TABLE usuarios_viagem ENABLE ROW LEVEL SECURITY;
CREATE POLICY "autenticados acessam usuarios_viagem" ON usuarios_viagem FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Vincula todos os usuários existentes como owner da viagem padrão
INSERT INTO usuarios_viagem (viagem_id, usuario_id, papel, status)
SELECT v.id, p.id, 'owner', 'aceito'
FROM viagens v, profiles p
WHERE NOT EXISTS (SELECT 1 FROM usuarios_viagem uv WHERE uv.viagem_id = v.id AND uv.usuario_id = p.id);

-- ============================================================
-- 3. CIDADES (catálogo global)
-- ============================================================
CREATE TABLE IF NOT EXISTS cidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  pais TEXT NOT NULL,
  flag_emoji TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  fuso_horario TEXT,
  UNIQUE (nome, pais)
);

ALTER TABLE cidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "autenticados acessam cidades" ON cidades FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Extrai cidades únicas dos destinos
INSERT INTO cidades (nome, pais, flag_emoji)
SELECT DISTINCT d.cidade, d.pais, d.flag_emoji
FROM destinos d
WHERE NOT EXISTS (SELECT 1 FROM cidades c WHERE c.nome = d.cidade AND c.pais = d.pais);

-- ============================================================
-- 4. DIAS
-- ============================================================
CREATE TABLE IF NOT EXISTS dias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id UUID NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
  cidade_id UUID NOT NULL REFERENCES cidades(id),
  data DATE NOT NULL,
  notas TEXT,
  status TEXT DEFAULT 'planejando',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id),
  UNIQUE (viagem_id, data)
);

ALTER TABLE dias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "autenticados acessam dias" ON dias FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Migra destinos → dias
INSERT INTO dias (id, viagem_id, cidade_id, data, notas, status)
SELECT d.id, v.id, c.id, d.data, d.notas, d.status
FROM destinos d
JOIN viagens v ON true
JOIN cidades c ON c.nome = d.cidade AND c.pais = d.pais
WHERE NOT EXISTS (SELECT 1 FROM dias WHERE id = d.id);

-- ============================================================
-- 5. ATRAÇÕES — adiciona colunas novas
-- ============================================================
ALTER TABLE atracoes ADD COLUMN IF NOT EXISTS viagem_id UUID REFERENCES viagens(id);
ALTER TABLE atracoes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE atracoes ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id);
ALTER TABLE atracoes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE atracoes ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE atracoes ADD COLUMN IF NOT EXISTS favorito BOOLEAN DEFAULT false;
ALTER TABLE atracoes ADD COLUMN IF NOT EXISTS prioridade INTEGER DEFAULT 0;
ALTER TABLE atracoes ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'manual';

-- Preenche viagem_id
UPDATE atracoes SET viagem_id = (SELECT id FROM viagens LIMIT 1) WHERE viagem_id IS NULL;

-- ============================================================
-- 6. GASTOS — adiciona colunas novas
-- ============================================================
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS viagem_id UUID REFERENCES viagens(id);
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS atracao_id UUID REFERENCES atracoes(id);
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS hospedagem_id UUID REFERENCES hospedagens(id);
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS transporte_id UUID REFERENCES transportes(id);
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id);
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE gastos SET viagem_id = (SELECT id FROM viagens LIMIT 1) WHERE viagem_id IS NULL;

-- Garante que as colunas renomeadas existam
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS valor NUMERIC;
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'EUR';
UPDATE gastos SET valor = valor_original WHERE valor IS NULL AND valor_original IS NOT NULL;
UPDATE gastos SET moeda = moeda_original WHERE moeda IS NULL AND moeda_original IS NOT NULL;

-- ============================================================
-- 7. HOSPEDAGENS (substitui acomodacoes)
-- ============================================================
CREATE TABLE IF NOT EXISTS hospedagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id UUID NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
  cidade_id UUID NOT NULL REFERENCES cidades(id),
  nome TEXT NOT NULL,
  tipo TEXT DEFAULT 'hotel',
  status TEXT NOT NULL DEFAULT 'reservada',
  endereco TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  check_in DATE,
  check_out DATE,
  link TEXT,
  valor_noite NUMERIC,
  moeda TEXT DEFAULT 'EUR',
  favorito BOOLEAN DEFAULT false,
  notas TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE hospedagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "autenticados acessam hospedagens" ON hospedagens FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Migra acomodacoes → hospedagens
INSERT INTO hospedagens (id, viagem_id, cidade_id, nome, tipo, status, endereco, latitude, longitude, check_in, check_out, link, valor_noite, moeda, notas, created_by)
SELECT
  a.id, v.id, c.id, a.nome, a.tipo, 'reservada',
  a.endereco, a.latitude, a.longitude,
  a.check_in, a.check_out,
  a.link, a.valor_noite, a.moeda, a.notas, a.created_by
FROM acomodacoes a
JOIN viagens v ON true
JOIN cidades c ON c.nome = a.cidade AND c.pais = a.pais
WHERE EXISTS (SELECT 1 FROM cidades c2 WHERE c2.nome = a.cidade)
  AND NOT EXISTS (SELECT 1 FROM hospedagens WHERE id = a.id);

-- ============================================================
-- 8. TRANSPORTES — adiciona colunas novas
-- ============================================================
ALTER TABLE transportes ADD COLUMN IF NOT EXISTS viagem_id UUID REFERENCES viagens(id);
ALTER TABLE transportes ADD COLUMN IF NOT EXISTS cidade_origem_id UUID REFERENCES cidades(id);
ALTER TABLE transportes ADD COLUMN IF NOT EXISTS cidade_destino_id UUID REFERENCES cidades(id);
ALTER TABLE transportes ADD COLUMN IF NOT EXISTS dia_origem_id UUID REFERENCES dias(id);
ALTER TABLE transportes ADD COLUMN IF NOT EXISTS dia_destino_id UUID REFERENCES dias(id);
ALTER TABLE transportes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE transportes ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id);
ALTER TABLE transportes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE transportes SET viagem_id = (SELECT id FROM viagens LIMIT 1) WHERE viagem_id IS NULL;

ALTER TABLE transportes ADD COLUMN IF NOT EXISTS valor NUMERIC;
ALTER TABLE transportes ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'BRL';
UPDATE transportes SET valor = custo_estimado_brl WHERE valor IS NULL AND custo_estimado_brl IS NOT NULL;
UPDATE transportes SET moeda = 'BRL' WHERE moeda IS NULL;

-- ============================================================
-- 9. PENDÊNCIAS — adiciona colunas novas
-- ============================================================
ALTER TABLE pendencias ADD COLUMN IF NOT EXISTS viagem_id UUID REFERENCES viagens(id);
ALTER TABLE pendencias ADD COLUMN IF NOT EXISTS dia_id UUID REFERENCES dias(id);
ALTER TABLE pendencias ADD COLUMN IF NOT EXISTS hospedagem_id UUID REFERENCES hospedagens(id);
ALTER TABLE pendencias ADD COLUMN IF NOT EXISTS transporte_id UUID REFERENCES transportes(id);
ALTER TABLE pendencias ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE pendencias ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id);
ALTER TABLE pendencias ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE pendencias SET viagem_id = (SELECT id FROM viagens LIMIT 1) WHERE viagem_id IS NULL;

-- ============================================================
-- 10. DOCUMENTOS — adiciona colunas novas + polimórfico
-- ============================================================
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS viagem_id UUID REFERENCES viagens(id);
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS entidade TEXT;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS entidade_id UUID;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS tamanho_bytes BIGINT;

UPDATE documentos SET viagem_id = (SELECT id FROM viagens LIMIT 1) WHERE viagem_id IS NULL;

-- Migra contexto_tipo/contexto_id existentes para entidade/entidade_id
UPDATE documentos SET entidade = contexto_tipo, entidade_id = contexto_id::uuid
WHERE contexto_tipo IS NOT NULL AND contexto_id IS NOT NULL AND contexto_tipo != 'viagem';

-- ============================================================
-- 11. ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_viagem_viagem ON usuarios_viagem(viagem_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_viagem_usuario ON usuarios_viagem(usuario_id);
CREATE INDEX IF NOT EXISTS idx_dias_viagem ON dias(viagem_id);
CREATE INDEX IF NOT EXISTS idx_dias_cidade ON dias(cidade_id);
CREATE INDEX IF NOT EXISTS idx_atracoes_viagem ON atracoes(viagem_id);
CREATE INDEX IF NOT EXISTS idx_atracoes_dia ON atracoes(dia_id);
CREATE INDEX IF NOT EXISTS idx_gastos_viagem ON gastos(viagem_id);
CREATE INDEX IF NOT EXISTS idx_gastos_dia ON gastos(dia_id);
CREATE INDEX IF NOT EXISTS idx_gastos_data ON gastos(data_gasto);
CREATE INDEX IF NOT EXISTS idx_hospedagens_viagem ON hospedagens(viagem_id);
CREATE INDEX IF NOT EXISTS idx_hospedagens_cidade ON hospedagens(cidade_id);
CREATE INDEX IF NOT EXISTS idx_transportes_viagem ON transportes(viagem_id);
CREATE INDEX IF NOT EXISTS idx_pendencias_viagem ON pendencias(viagem_id);
CREATE INDEX IF NOT EXISTS idx_pendencias_status ON pendencias(status);
CREATE INDEX IF NOT EXISTS idx_documentos_viagem ON documentos(viagem_id);
CREATE INDEX IF NOT EXISTS idx_documentos_entidade ON documentos(entidade, entidade_id);

-- ============================================================
-- 12. TABELAS FUTURAS (schema pronto, sem dados)
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id UUID NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES profiles(id),
  entidade TEXT NOT NULL,
  entidade_id UUID NOT NULL,
  acao TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "autenticados acessam activity_log" ON activity_log FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS configuracoes_viagem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id UUID NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
  chave TEXT NOT NULL,
  valor TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (viagem_id, chave)
);

ALTER TABLE configuracoes_viagem ENABLE ROW LEVEL SECURITY;
CREATE POLICY "autenticados acessam config" ON configuracoes_viagem FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 13. LIMPEZA
-- ============================================================
DROP TABLE IF EXISTS memorias_old CASCADE;
DROP TABLE IF EXISTS orcamentos_old CASCADE;
DROP TABLE IF EXISTS atracao_participantes_old CASCADE;
DROP TABLE IF EXISTS gasto_participantes_old CASCADE;
