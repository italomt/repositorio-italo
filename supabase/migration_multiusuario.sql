-- ============================================================
-- Migração: datas para 2026 + multi-usuário (auth, participantes, divisão de gastos)
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute.
-- ============================================================

-- 1) Corrigir o ano da viagem (2025 -> 2026, mantendo dia/mês)
UPDATE destinos SET data = (data + INTERVAL '1 year')::date;

-- 2) Perfis de usuário (um por pessoa que vai viajar)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#007AFF',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3) Atrações: compartilhada com todos ou só com participantes específicos
ALTER TABLE atracoes ADD COLUMN compartilhada BOOLEAN DEFAULT true;

CREATE TABLE atracao_participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atracao_id UUID REFERENCES atracoes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE (atracao_id, user_id)
);

-- 4) Gastos: quem pagou e como divide entre participantes
ALTER TABLE gastos ADD COLUMN pago_por UUID REFERENCES profiles(id);
ALTER TABLE gastos ADD COLUMN divisao_tipo TEXT DEFAULT 'todos'; -- 'todos' | 'especifico'

CREATE TABLE gasto_participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gasto_id UUID REFERENCES gastos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  valor_devido NUMERIC,
  UNIQUE (gasto_id, user_id)
);

-- 5) Habilitar RLS agora que o app tem autenticação real
ALTER TABLE destinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE atracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE atracao_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gasto_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE base_atracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa autenticada (alguém do grupo de viagem) pode ler/escrever
-- tudo que é compartilhado da viagem. Não é uma plataforma multi-tenant,
-- é um app privado para o grupo, então a regra é simples: autenticado = acesso total.
CREATE POLICY "autenticados acessam destinos" ON destinos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "autenticados acessam transportes" ON transportes FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "autenticados acessam atracoes" ON atracoes FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "autenticados acessam atracao_participantes" ON atracao_participantes FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "autenticados acessam gastos" ON gastos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "autenticados acessam gasto_participantes" ON gasto_participantes FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "autenticados acessam pendencias" ON pendencias FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "autenticados acessam memorias" ON memorias FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "autenticados acessam orcamentos" ON orcamentos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "autenticados leem base_atracoes" ON base_atracoes FOR SELECT USING (auth.role() = 'authenticated');

-- profiles: todo autenticado pode ver os nomes do grupo, mas só edita o próprio
CREATE POLICY "autenticados leem profiles" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "usuario edita seu profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "usuario cria seu profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
