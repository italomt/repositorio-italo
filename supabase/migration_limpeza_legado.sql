-- ============================================================
-- Migração: Limpeza do legado
-- Remove tabelas antigas após migração completa para nova arquitetura
-- ============================================================

-- 1. Remove acomodacoes (substituída por hospedagens)
DROP TABLE IF EXISTS acomodacoes CASCADE;

-- 2. Migra FKs de destinos para dias
ALTER TABLE transportes DROP CONSTRAINT IF EXISTS transportes_destino_origem_id_fkey;
ALTER TABLE transportes DROP CONSTRAINT IF EXISTS transportes_destino_destino_id_fkey;
ALTER TABLE atracoes DROP CONSTRAINT IF EXISTS atracoes_destino_id_fkey;
ALTER TABLE gastos DROP CONSTRAINT IF EXISTS gastos_destino_id_fkey;

ALTER TABLE transportes ADD CONSTRAINT transportes_destino_origem_id_fkey FOREIGN KEY (destino_origem_id) REFERENCES dias(id);
ALTER TABLE transportes ADD CONSTRAINT transportes_destino_destino_id_fkey FOREIGN KEY (destino_destino_id) REFERENCES dias(id);
ALTER TABLE atracoes ADD CONSTRAINT atracoes_destino_id_fkey FOREIGN KEY (destino_id) REFERENCES dias(id);
ALTER TABLE gastos ADD CONSTRAINT gastos_destino_id_fkey FOREIGN KEY (destino_id) REFERENCES dias(id);

-- 3. Remove destinos (substituída por dias + cidades)
DROP TABLE IF EXISTS destinos CASCADE;
