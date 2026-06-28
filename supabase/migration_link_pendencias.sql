-- Liga pendências à atração que as originou (quando criada via Quick Add)
ALTER TABLE pendencias ADD COLUMN atracao_id UUID REFERENCES atracoes(id) ON DELETE SET NULL;
