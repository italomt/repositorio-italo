-- Adiciona coluna foto_url à tabela atracoes
ALTER TABLE atracoes ADD COLUMN IF NOT EXISTS foto_url TEXT;
