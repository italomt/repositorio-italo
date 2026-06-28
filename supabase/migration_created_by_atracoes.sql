-- ============================================================
-- Migração: created_by em atracoes (vincular criador)
-- Execute no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE atracoes ADD COLUMN created_by UUID REFERENCES profiles(id);
