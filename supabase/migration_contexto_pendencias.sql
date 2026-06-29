-- ============================================================
-- Migração: linking contextual de pendências e documentos
-- Permite vincular pendências/documentos a viagem, cidade,
-- dia, atração, hospedagem ou transporte.
-- Execute no SQL Editor do Supabase.
-- ============================================================

-- Pendências: contexto_tipo + contexto_id
-- contexto_tipo: 'viagem' | 'cidade' | 'dia' | 'atracao' | 'hospedagem' | 'transporte'
-- contexto_id: UUID da entidade (ou nome da cidade para 'cidade')
ALTER TABLE pendencias ADD COLUMN contexto_tipo TEXT;
ALTER TABLE pendencias ADD COLUMN contexto_id TEXT;

-- Documentos: mesmo esquema
ALTER TABLE documentos ADD COLUMN contexto_tipo TEXT;
ALTER TABLE documentos ADD COLUMN contexto_id TEXT;

-- Índices para consultas por contexto
CREATE INDEX idx_pendencias_contexto ON pendencias(contexto_tipo, contexto_id);
CREATE INDEX idx_documentos_contexto ON documentos(contexto_tipo, contexto_id);

-- ============================================================
-- Migrar pendências existentes para o novo schema
-- ============================================================

-- Pendências de transporte viagem → viagem
UPDATE pendencias SET contexto_tipo = 'viagem', contexto_id = 'viagem'
WHERE categoria = 'transporte' AND atracao_id IS NULL;

-- Pendências de documentação → viagem
UPDATE pendencias SET contexto_tipo = 'viagem', contexto_id = 'viagem'
WHERE categoria = 'documentacao' AND atracao_id IS NULL;

-- Pendências de atração com atracao_id → atracao
UPDATE pendencias SET contexto_tipo = 'atracao', contexto_id = atracao_id::text
WHERE atracao_id IS NOT NULL;
