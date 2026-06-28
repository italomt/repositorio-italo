-- ============================================================
-- Migração: destino_id opcional em gastos (gastos pré-viagem)
-- Execute no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE gastos ALTER COLUMN destino_id DROP NOT NULL;
