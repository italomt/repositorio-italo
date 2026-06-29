-- ============================================================
-- Migração: arquitetura de contexto unificada
-- Adiciona contexto_tipo + contexto_id em gastos, atracoes,
-- acomodacoes e transportes para vincular qualquer registro
-- a viagem, cidade, dia, atracao, hospedagem ou transporte.
-- Execute no SQL Editor do Supabase.
-- ============================================================

-- 1) Gastos: adicionar contexto_tipo + contexto_id
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS contexto_tipo TEXT DEFAULT 'dia';
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS contexto_id TEXT;

-- Migrar destino_id existente para contexto
UPDATE gastos
SET contexto_tipo = 'dia',
    contexto_id = destino_id::text
WHERE destino_id IS NOT NULL;

UPDATE gastos
SET contexto_tipo = 'viagem',
    contexto_id = 'viagem'
WHERE destino_id IS NULL;

-- 2) Atracoes: adicionar contexto_tipo (sempre 'dia')
ALTER TABLE atracoes ADD COLUMN IF NOT EXISTS contexto_tipo TEXT DEFAULT 'dia';
ALTER TABLE atracoes ADD COLUMN IF NOT EXISTS contexto_id TEXT;

UPDATE atracoes
SET contexto_id = destino_id::text
WHERE destino_id IS NOT NULL;

-- 3) Acomodacoes: adicionar contexto_tipo (sempre 'cidade')
ALTER TABLE acomodacoes ADD COLUMN IF NOT EXISTS contexto_tipo TEXT DEFAULT 'cidade';
ALTER TABLE acomodacoes ADD COLUMN IF NOT EXISTS contexto_id TEXT;

UPDATE acomodacoes
SET contexto_id = cidade
WHERE cidade IS NOT NULL;

-- 4) Transportes: adicionar contexto_tipo (sempre 'transporte')
ALTER TABLE transportes ADD COLUMN IF NOT EXISTS contexto_tipo TEXT DEFAULT 'transporte';
ALTER TABLE transportes ADD COLUMN IF NOT EXISTS contexto_id TEXT;

UPDATE transportes
SET contexto_id = id::text
WHERE id IS NOT NULL;

-- 5) Índices para consultas por contexto
CREATE INDEX IF NOT EXISTS idx_gastos_contexto ON gastos(contexto_tipo, contexto_id);
CREATE INDEX IF NOT EXISTS idx_atracoes_contexto ON atracoes(contexto_tipo, contexto_id);
CREATE INDEX IF NOT EXISTS idx_acomodacoes_contexto ON acomodacoes(contexto_tipo, contexto_id);
CREATE INDEX IF NOT EXISTS idx_transportes_contexto ON transportes(contexto_tipo, contexto_id);

-- 6) Trigger para manter contexto sincronizado com destino_id
-- (opcional: mantém compatibilidade com código legado)
CREATE OR REPLACE FUNCTION sync_atracao_contexto()
RETURNS TRIGGER AS $$
BEGIN
  NEW.contexto_tipo := 'dia';
  NEW.contexto_id := NEW.destino_id::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_atracao_contexto ON atracoes;
CREATE TRIGGER trg_sync_atracao_contexto
  BEFORE INSERT OR UPDATE ON atracoes
  FOR EACH ROW
  WHEN (NEW.destino_id IS NOT NULL)
  EXECUTE FUNCTION sync_atracao_contexto();
