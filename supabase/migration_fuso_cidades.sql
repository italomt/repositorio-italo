-- Fuso horário (IANA) por cidade, pra converter check-in/check-out e
-- horário de saída/chegada pro horário local do destino, em vez do
-- fuso de quem está preenchendo o formulário.
ALTER TABLE cidades ADD COLUMN IF NOT EXISTS fuso_horario TEXT;

UPDATE cidades SET fuso_horario = 'Europe/Lisbon' WHERE nome IN ('Lisboa', 'Porto');
UPDATE cidades SET fuso_horario = 'Europe/Madrid' WHERE nome IN ('Madrid', 'Barcelona');
UPDATE cidades SET fuso_horario = 'Europe/Rome' WHERE nome IN ('Milão', 'Florença', 'Roma');
UPDATE cidades SET fuso_horario = 'Europe/Paris' WHERE nome = 'Paris';
UPDATE cidades SET fuso_horario = 'Europe/Zurich' WHERE nome = 'Zurique';
UPDATE cidades SET fuso_horario = 'Europe/Amsterdam' WHERE nome = 'Amsterdã';
UPDATE cidades SET fuso_horario = 'Europe/Oslo' WHERE nome = 'Tromsø';
UPDATE cidades SET fuso_horario = 'America/Argentina/Buenos_Aires' WHERE nome = 'Buenos Aires';
UPDATE cidades SET fuso_horario = 'America/Fortaleza' WHERE nome IN ('Fortaleza', 'Natal', 'Recife', 'Taiba', 'São Luís do Curu', 'Pecém');
UPDATE cidades SET fuso_horario = 'America/Sao_Paulo' WHERE nome = 'Navegantes';
