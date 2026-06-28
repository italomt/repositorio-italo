ALTER TABLE profiles ADD COLUMN email_alias TEXT UNIQUE;
ALTER TABLE documentos ADD COLUMN origem TEXT DEFAULT 'manual';

-- Gera alias de 8 caracteres pra cada usuario existente
CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE profiles
SET email_alias = 'viagem-' || substring(replace(gen_random_uuid()::text, '-', '') FROM 1 FOR 8)
WHERE email_alias IS NULL;

-- Trigger para gerar alias automaticamente em novos signups
CREATE OR REPLACE FUNCTION gerar_email_alias()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_alias := 'viagem-' || substring(replace(gen_random_uuid()::text, '-', '') FROM 1 FOR 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_gerar_email_alias
  BEFORE INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.email_alias IS NULL)
  EXECUTE FUNCTION gerar_email_alias();
