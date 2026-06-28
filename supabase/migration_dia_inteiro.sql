-- Marca atrações que ocupam o dia inteiro (ex: Disneyland Paris), pra não sugerir
-- mais nada nesse dia, e permite saber isso de antemão pelas atrações famosas.
ALTER TABLE atracoes ADD COLUMN ocupa_dia_inteiro BOOLEAN DEFAULT false;
ALTER TABLE base_atracoes ADD COLUMN ocupa_dia_inteiro BOOLEAN DEFAULT false;

UPDATE base_atracoes SET ocupa_dia_inteiro = true WHERE nome = 'Disneyland Paris';

-- Atualiza a atração já existente no roteiro (seed original) pra refletir isso também
UPDATE atracoes SET ocupa_dia_inteiro = true WHERE nome = 'Disneyland Paris';
