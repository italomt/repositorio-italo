-- ============================================================
-- Migração: tabela acomodacoes (hospedagem por cidade)
-- Execute no SQL Editor do Supabase.
-- ============================================================

CREATE TABLE acomodacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cidade TEXT NOT NULL,
  pais TEXT,
  nome TEXT NOT NULL,
  tipo TEXT DEFAULT 'hotel',
  endereco TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  check_in DATE,
  check_out DATE,
  link_reserva TEXT,
  preco_noite DOUBLE PRECISION,
  moeda TEXT DEFAULT 'EUR',
  notas TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Uma acomodação por cidade
CREATE UNIQUE INDEX idx_acomodacoes_cidade ON acomodacoes(cidade);

ALTER TABLE acomodacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ler acomodações"
  ON acomodacoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir acomodações"
  ON acomodacoes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar acomodações"
  ON acomodacoes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem excluir acomodações"
  ON acomodacoes FOR DELETE
  TO authenticated
  USING (true);
