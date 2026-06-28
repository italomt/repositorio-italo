CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'outro',
  tipo TEXT,
  arquivo_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados podem ler documentos"
  ON documentos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados podem inserir documentos"
  ON documentos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados podem atualizar documentos"
  ON documentos FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados podem excluir documentos"
  ON documentos FOR DELETE
  TO authenticated
  USING (true);
