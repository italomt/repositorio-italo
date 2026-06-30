# Arquitetura Final — Europa Trip App (vFinal)

**Status**: APROVADA
**Princípio #1**: Novas features devem ser implementadas sem quebrar esta arquitetura.
**Princípio #2**: Nunca usar `SELECT *` sem `WHERE viagem_id`. Sempre filtrar no banco.

---

## Diagrama ER (Relacionamentos)

```
┌─────────────────────────────────────────────────────────────────────┐
│                           auth.users                                │
│                              │                                      │
│                         profiles                                   │
│                              │                                      │
│              ┌───────────────┼───────────────┐                      │
│              │               │               │                      │
│     usuarios_viagem    created_by     updated_by                    │
│         (owner/        (em todas      (em todas                     │
│         editor/         as tabelas)    as tabelas)                  │
│         viewer)                                                     │
│              │                                                      │
│         ┌────┴────┐                                                │
│         │ viagens │                                                │
│         │ 1 ──── N│                                                │
│         └────┬────┘                                                │
│              │                                                      │
│     ┌────────┼────────┬──────────┬──────────┬──────────┐           │
│     │        │        │          │          │          │           │
│  ┌──┴──┐ ┌──┴──┐ ┌───┴───┐ ┌───┴───┐ ┌───┴───┐ ┌───┴────┐      │
│  │dias │ │gast │ │hosped │ │transp │ │penden │ │documen │      │
│  │     │ │os   │ │agens  │ │ortes  │ │cias   │ │tos     │      │
│  └──┬──┘ └──┬──┘ └───┬───┘ └───┬───┘ └───┬───┘ └───┬────┘      │
│     │       │         │         │         │         │            │
│  ┌──┴──┐    │    ┌────┴────┐    │         │         │            │
│  │atra │    │    │cidades  │    │         │         │            │
│  │coes │    │    │(catálogo│    │         │         │            │
│  └─────┘    │    │ global) │    │         │         │            │
│             │    └─────────┘    │         │         │            │
│             │         ▲         │         │         │            │
│             │         │         │         │         │            │
│     Links opcionais entre entidades:                               │
│     gastos ──→ atracoes, hospedagens, transportes                  │
│     pendencias ──→ dia_id, atracao_id, hospedagem_id, transporte_id│
│     documentos ──→ entidade + entidade_id (polimórfico)            │
│     comentarios ──→ entidade + entidade_id (polimórfico)           │
└─────────────────────────────────────────────────────────────────────┘
```

### Tabelas: Obrigatórios vs Opcionais

| Tabela | viagem_id | cidade_id | dia_id | Outros FKs opcionais |
|--------|-----------|-----------|--------|---------------------|
| viagens | — | — | — | — |
| dias | ✅ | ✅ | — | — |
| atracoes | ✅ | ❌ (via dia) | ✅ | — |
| gastos | ✅ | ❌ | ❌ | atracao_id, hospedagem_id, transporte_id |
| hospedagens | ✅ | ✅ | ❌ | — |
| transportes | ✅ | ❌ (cidade_origem/destino) | ❌ | — |
| pendencias | ✅ | ❌ | ❌ | atracao_id, hospedagem_id, transporte_id |
| documentos | ✅ | ❌ | ❌ | entidade + entidade_id (polimórfico) |
| comentarios | ✅ | ❌ | ❌ | entidade + entidade_id (polimórfico) |

---

## Schema Completo

### Tabelas Core

```sql
-- ============================================================
-- PROFILES (linked to auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#5B7FFF',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- VIAGENS
-- ============================================================
CREATE TABLE viagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  descricao TEXT,
  tipo TEXT DEFAULT 'lazer',
  status TEXT DEFAULT 'planejando',
  moeda_principal TEXT DEFAULT 'EUR',
  fuso_principal TEXT,
  idioma TEXT DEFAULT 'pt-BR',
  cor TEXT DEFAULT '#5B7FFF',
  imagem_capa TEXT,
  orcamento_total NUMERIC,
  orcamento_gasto NUMERIC DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ
);

-- tipo: 'lazer' | 'trabalho' | 'mochilao' | 'fds' | 'outro'
-- status: 'planejando' | 'em_andamento' | 'concluida' | 'arquivada'
-- NOTA: Nunca deletar viagem. Usar deleted_at (soft delete).

-- ============================================================
-- USUARIOS_VIAGEM (ponte multi-user)
-- ============================================================
CREATE TABLE usuarios_viagem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id UUID NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  papel TEXT NOT NULL DEFAULT 'editor',
  status TEXT DEFAULT 'aceito',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (viagem_id, usuario_id)
);

-- papel: 'owner' | 'editor' | 'viewer'
-- status: 'convidado' | 'aceito' | 'removido'

-- ============================================================
-- CIDADES (catálogo global)
-- ============================================================
CREATE TABLE cidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  pais TEXT NOT NULL,
  flag_emoji TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  fuso_horario TEXT,
  UNIQUE (nome, pais)
);

-- ============================================================
-- DIAS
-- ============================================================
CREATE TABLE dias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id UUID NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
  cidade_id UUID NOT NULL REFERENCES cidades(id),
  data DATE NOT NULL,
  notas TEXT,
  status TEXT DEFAULT 'planejando',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id),
  UNIQUE (viagem_id, data)
);

-- ============================================================
-- ATRAÇÕES
-- ============================================================
CREATE TABLE atracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id UUID NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
  dia_id UUID NOT NULL REFERENCES dias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planejada',
  horario TIME,
  duracao_minutos INTEGER,
  precisa_reserva BOOLEAN DEFAULT false,
  status_reserva TEXT DEFAULT 'nao_precisa',
  link TEXT,
  valor NUMERIC,
  moeda TEXT DEFAULT 'EUR',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  foto_url TEXT,
  ocupa_dia_inteiro BOOLEAN DEFAULT false,
  ordem_no_dia INTEGER DEFAULT 0,
  tags TEXT[],
  favorito BOOLEAN DEFAULT false,
  prioridade INTEGER DEFAULT 0,
  origem TEXT DEFAULT 'manual',
  notas TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ
);

-- status: 'planejada' | 'reservada' | 'visitada' | 'cancelada'
-- origem: 'manual' | 'ia' | 'quick_add'

-- ============================================================
-- GASTOS
-- ============================================================
CREATE TABLE gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id UUID NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
  dia_id UUID REFERENCES dias(id),
  atracao_id UUID REFERENCES atracoes(id),
  hospedagem_id UUID REFERENCES hospedagens(id),
  transporte_id UUID REFERENCES transportes(id),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'previsto',
  valor NUMERIC NOT NULL,
  moeda TEXT NOT NULL DEFAULT 'EUR',
  valor_brl NUMERIC,
  cotacao_usada NUMERIC,
  data_gasto DATE NOT NULL,
  notas TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ
);

-- status: 'previsto' | 'pago'

-- ============================================================
-- HOSPEDAGENS
-- ============================================================
CREATE TABLE hospedagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id UUID NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
  cidade_id UUID NOT NULL REFERENCES cidades(id),
  nome TEXT NOT NULL,
  tipo TEXT DEFAULT 'hotel',
  status TEXT NOT NULL DEFAULT 'reservada',
  endereco TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  check_in DATE,
  check_out DATE,
  link TEXT,
  valor_noite NUMERIC,
  moeda TEXT DEFAULT 'EUR',
  favorito BOOLEAN DEFAULT false,
  notas TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ
);

-- status: 'reservada' | 'check-in' | 'check-out' | 'cancelada'

-- ============================================================
-- TRANSPORTES
-- ============================================================
CREATE TABLE transportes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id UUID NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
  cidade_origem_id UUID REFERENCES cidades(id),
  cidade_destino_id UUID REFERENCES cidades(id),
  dia_origem_id UUID REFERENCES dias(id),
  dia_destino_id UUID REFERENCES dias(id),
  tipo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  operadora TEXT,
  link TEXT,
  valor NUMERIC,
  moeda TEXT DEFAULT 'EUR',
  valor_brl NUMERIC,
  horario_saida TIMESTAMPTZ,
  horario_chegada TIMESTAMPTZ,
  codigo_reserva TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ
);

-- status: 'pendente' | 'comprado' | 'check-in' | 'embarcado' | 'concluido' | 'cancelado'

-- ============================================================
-- PENDÊNCIAS
-- ============================================================
CREATE TABLE pendencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id UUID NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
  dia_id UUID REFERENCES dias(id),
  atracao_id UUID REFERENCES atracoes(id),
  hospedagem_id UUID REFERENCES hospedagens(id),
  transporte_id UUID REFERENCES transportes(id),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberta',
  urgencia TEXT DEFAULT 'media',
  prazo DATE,
  link TEXT,
  notas TEXT,
  concluida_em TIMESTAMPTZ,
  cancelada_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ
);

-- status: 'aberta' | 'em_andamento' | 'concluida' | 'cancelada'
-- NOTA: Nunca deletar pendência. Usar status = 'cancelada' (soft delete via estado).

-- ============================================================
-- DOCUMENTOS (polimórfico)
-- ============================================================
CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id UUID NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
  entidade TEXT,
  entidade_id UUID,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'outro',
  tipo TEXT,
  arquivo_url TEXT,
  tamanho_bytes BIGINT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- entidade: 'viagem' | 'atracao' | 'hospedagem' | 'transporte' | 'pendencia' | 'dia'

-- ============================================================
-- COMENTÁRIOS (polimórfico)
-- ============================================================
CREATE TABLE comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id UUID NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entidade TEXT NOT NULL,
  entidade_id UUID NOT NULL,
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- entidade: 'atracao' | 'hospedagem' | 'transporte' | 'gasto' | 'pendencia' | 'documento' | 'dia'
```

### Tabelas Futuras (schema pronto, implementar depois)

```sql
-- ============================================================
-- MEMÓRIAS (diário de viagem)
-- ============================================================
CREATE TABLE memorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id UUID NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
  dia_id UUID REFERENCES dias(id),
  titulo TEXT,
  texto TEXT,
  foto_url TEXT,
  video_url TEXT,
  localizacao TEXT,
  humor TEXT,
  clima TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================
-- ACTIVITY LOG (feed de atividades)
-- ============================================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id UUID NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES profiles(id),
  entidade TEXT NOT NULL,
  entidade_id UUID NOT NULL,
  acao TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- acao: 'criou' | 'editou' | 'removeu' | 'concluiu' | 'cancelou' | 'comentou'
-- Exemplo: {usuario: "Italo", acao: "adicionou", entidade: "atracao", nome: "Torre Eiffel"}

-- ============================================================
-- CONFIGURAÇÕES DA VIAGEM (key-value)
-- ============================================================
CREATE TABLE configuracoes_viagem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id UUID NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
  chave TEXT NOT NULL,
  valor TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (viagem_id, chave)
);

-- Chaves previstas:
-- 'mostrar_clima'          → 'true'
-- 'mostrar_gastos'         → 'true'
-- 'mostrar_pendencias'     → 'true'
-- 'mostrar_documentos'     → 'true'
-- 'usar_orcamento'         → 'false'
-- 'usar_milhas'            → 'false'
-- 'usar_mapa_offline'      → 'false'
-- 'ia_sugestoes'           → 'true'
-- 'notificacoes'           → 'true'

-- ============================================================
-- BASE DE ATRAÇÕES (referência IA)
-- ============================================================
CREATE TABLE base_atracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  pais TEXT NOT NULL,
  precisa_reserva BOOLEAN DEFAULT false,
  dias_antecedencia INTEGER DEFAULT 0,
  valor NUMERIC,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  link TEXT,
  dica TEXT
);
```

---

## Máquina de Estados

| Entidade | Estados | Transições |
|----------|---------|-----------|
| **Viagem** | planejando → em_andamento → concluida | pode ser arquivada a qualquer momento |
| **Atração** | planejada → reservada → visitada | pode ser cancelada a qualquer momento |
| **Gasto** | previsto → pago | transição simples |
| **Hospedagem** | reservada → check-in → check-out | pode ser cancelada antes do check-in |
| **Transporte** | pendente → comprado → check-in → embarcado → concluido | pode ser cancelado antes do embarque |
| **Pendência** | aberta → em_andamento → concluida | pode ser cancelada (soft delete por estado) |

---

## Padrão de Colunas (toda entidade)

```
id              UUID PK
viagem_id       UUID FK NOT NULL    ← obrigatório, sempre
nome            TEXT NOT NULL       ← identificador
status          TEXT NOT NULL       ← máquina de estados
created_by      UUID FK             ← auditoria
created_at      TIMESTAMPTZ         ← auditoria
updated_at      TIMESTAMPTZ         ← auditoria
updated_by      UUID FK             ← auditoria
deleted_at      TIMESTAMPTZ         ← soft delete (NULL = ativo)
notas           TEXT                ← opcional

+ campos específicos do tipo
+ FKs opcionais para outras entidades
```

---

## Hooks

```js
useViagem()                              // hook raiz: carrega viagem ativa
useDias(viagemId)                        // JOIN cidades
useAtracoes(viagemId, diaId?)            // filtra por viagem, opcionalmente por dia
useGastos(viagemId)                      // todos os gastos da viagem
useHospedagens(viagemId)                 // todas as hospedagens da viagem
useTransportes(viagemId)                 // todos os transportes da viagem
usePendencias(viagemId)                  // todas as pendências da viagem
useDocumentos(viagemId, entidade?, id?)  // filtrável por entidade
useComentarios(viagemId, entidade, id)   // comentários de uma entidade
```

**Regra**: `WHERE viagem_id = ?` em toda query. NUNCA `SELECT *` global.

---
