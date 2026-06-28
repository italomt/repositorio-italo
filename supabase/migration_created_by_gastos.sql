-- ============================================================
-- Migração: created_by em gastos (cada usuário vê só seus gastos)
-- Execute no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE gastos ADD COLUMN created_by UUID REFERENCES profiles(id);
