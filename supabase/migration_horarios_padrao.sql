-- Check-in/check-out de hospedagem e horário de saída/chegada de transporte
-- viravam texto solto em "notas" porque os campos não existiam nos formulários.
-- Isso vira campo padrão: check_in/check_out passam de DATE pra TIMESTAMPTZ
-- (mesmo padrão que horario_saida/horario_chegada já usam em transportes).
ALTER TABLE hospedagens
  ALTER COLUMN check_in TYPE TIMESTAMPTZ USING check_in::TIMESTAMPTZ,
  ALTER COLUMN check_out TYPE TIMESTAMPTZ USING check_out::TIMESTAMPTZ;
