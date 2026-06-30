# Relatório de Arquitetura — Europa Trip App

**Data**: 29/06/2026
**Escopo**: Frontend (React), Backend (Supabase/Postgres), Componentes, Fluxos de dados.
**Objetivo**: Diagnosticar a arquitetura atual, avaliar se suporta crescimento, e propor melhorias estruturais antes de novas funcionalidades.

---

## Parte 1 — Diagnóstico da Arquitetura Atual

### 1.1 Estrutura do Banco de Dados

#### Tabelas existentes (12)

| Tabela | Linhas | Usada no app? | Função |
|--------|--------|---------------|--------|
| `destinos` | 22+ | Sim | Dias do roteiro (data + cidade) |
| `atracoes` | ~30+ | Sim | Atrações vinculadas a um dia |
| `gastos` | Variável | Sim | Gastos da viagem |
| `pendencias` | ~22+ | Sim | Tarefas/checklist |
| `transportes` | Variável | Sim | Transporte entre cidades |
| `acomodacoes` | Variável | Sim | Hospedagem por cidade |
| `documentos` | Variável | Sim | Arquivos e links |
| `profiles` | 2-4 | Sim | Perfis de usuários autenticados |
| `base_atracoes` | ~17 | Sim (QuickAdd) | Base de conhecimento de atrações famosas |
| `memorias` | 0 | **Não** | Criada mas nunca integrada ao app |
| `orcamentos` | 0 | **Não** | Criada mas nunca usada |
| `atracao_participantes` | 0 | **Não** | Feature removida (split de participantes) |
| `gasto_participantes` | 0 | **Não** | Feature removida (split de gastos) |

**4 tabelas fantasmas** ocupam schema mas não têm código que as utilize.

---

#### Como as entidades se relacionam HOJE

```
destinos (dias)
  ├── atracoes.destino_id → destinos.id  ✅ FK explícita
  ├── gastos.destino_id → destinos.id    ✅ FK explícita (nullable)
  ├── transportes.destino_origem_id      ✅ FK explícita
  └── transportes.destino_destino_id     ✅ FK explícita

acomodacoes
  └── cidade TEXT (único)               ❌ Sem FK, link frágil por string

pendencias
  ├── atracao_id → atracoes.id          ✅ FK explícita
  ├── contexto_tipo TEXT                 ❌ Sem FK, sem CHECK
  └── contexto_id TEXT                   ❌ Sem FK, armazena UUIDs e strings no mesmo campo

documentos
  ├── contexto_tipo TEXT                 ❌ Sem FK, sem CHECK
  └── contexto_id TEXT                   ❌ Sem FK

profiles
  └── id → auth.users.id                ✅ FK para tabela do Supabase Auth
```

**Problema central**: 3 das 7 tabelas ativas vinculam contexto via strings (TEXT) sem foreign keys. Só `atracoes` e `gastos` têm FKs reais para `destinos`.

---

### 1.2 Ausência de tabelas fundamentais

O domínio do app é uma **viagem** com **cidades** visitadas em **dias** específicos. Mas:

- **Não existe tabela `viagens`**: O app assume 1 viagem implícita. `contexto_tipo = 'viagem'` é uma string mágica.
- **Não existe tabela `cidades`**: O nome da cidade é repetido em `destinos.cidade`, `acomodacoes.cidade`, `base_atracoes.cidade`. Se uma cidade mudar de nome, precisa atualizar N lugares.
- **Não existe tabela de estado para pendências**: `concluida BOOLEAN` é binário. Não suporta "Em andamento", "Cancelada", ou manter histórico.

---

### 1.3 Problemas de normalização

| Problema | Onde | Consequência |
|----------|------|-------------|
| Cidade como TEXT repetido | `destinos`, `acomodacoes`, `base_atracoes` | Sem integridade referencial, dados duplicados |
| País como TEXT repetido | `destinos` (22 linhas repetem "Portugal", "Espanha"...) | Sem tabela de países |
| `contexto_id` armazena UUID + string no mesmo campo | `pendencias`, `documentos` | Impossível criar FK |
| Sem CHECK constraints | `pendencias.urgencia`, `gastos.categoria` | Valores inválidos aceitos pelo banco |
| Colunas com nomes inconsistentes | `custo_estimado_eur` vs `valor_original` vs `custo_estimado_brl` | Confusão semântica |
| `concluida BOOLEAN` | `atracoes`, `pendencias` | Sem estado intermediário, sem histórico |

---

### 1.4 Problemas de índices

| Falta índice em | Impacto |
|----------------|---------|
| `atracoes.destino_id` | Query mais lenta ao carregar atrações do dia |
| `gastos.destino_id` | Query mais lenta ao filtrar gastos por dia |
| `gastos.data_gasto` | Ordenação sem índice |
| `pendencias.categoria` | Filtro por categoria sem índice |

---

### 1.5 Arquitetura de Componentes (Frontend)

#### Estrutura atual
```
pages/           (7 arquivos — thin wrappers)
components/
  ├── atracao/   (6 arquivos — AtracaoCard, AtracaoForm, AtracaoEditor, etc.)
  ├── finance/   (4 arquivos — GastoForm, GastoCard, Dashboard, FinancasView)
  ├── pendencias/(4 arquivos — PendenciaItem, PendenciaAdder, PendenciaEditor, PendenciasView)
  ├── roteiro/   (5 arquivos — AcomodacaoEditor, DayAdder, DayEditor, DayCard, TransportEditor)
  ├── viagem/    (3 arquivos — ViagemView, CidadeDetailView, DayDetailView)
  ├── mais/      (1 arquivo — MaisView)
  ├── hoje/      (3 arquivos — HojeView, AgendaItem, GastoRapido)
  ├── layout/    (2 arquivos — Layout, TabBar)
  ├── ui/        (12 arquivos — componentes genéricos)
  ├── auth/      (1 arquivo — LoginScreen)
  └── documentos/(2 arquivos — novos modais extraídos)
hooks/            (10 arquivos)
contexts/         (2 arquivos — AuthContext, ToastContext)
lib/              (8 arquivos — supabase, maps, clima, cambio, etc.)
```

#### Problemas identificados

1. **Pages são wrappers vazios**: Cada page só importa uma View e retorna `<XView />`. Camada desnecessária.
2. **Components misturam responsabilidades**: `PendenciasView` renderiza cards de 3 entidades diferentes (pendencias, acomodacoes, transportes).
3. **Forms não compartilham infraestrutura**: Cada formulário implementa seu próprio padrão de validação, erro, e layout (parcialmente resolvido com FormField/FormFooter/DeleteSection).
4. **Sem separação clara entre "smart" e "dumb" components**: Views chamam hooks diretamente e passam dados para baixo sem camada intermediária.
5. **States de modal pulverizados**: Cada View controla seus próprios `useState` para modais (adicionandoDia, mapaAberto, gastoEditando, etc.) — são ~30 states de modal espalhados.

---

### 1.6 Fluxo de Dados

```
Supabase (Postgres)
  ↓ supabase-js
hooks/ (useDestinos, useAtracoes, useGastos, etc.)
  ↓ retornam { data, loading, erro, criar, atualizar, remover }
Views (HojeView, ViagemView, FinancasView...)
  ↓ props
Componentes (AtracaoCard, PendenciaItem, GastoForm...)
```

**Padrão**: Cada hook faz `select * from tabela`, carrega tudo, filtra no cliente. Não há paginação, não há cache entre hooks.

**Problema de performance**: `useAtracoes()` sem `destinoId` carrega TODAS as atrações. O mesmo para `useGastos()` e `usePendencias()`.

---

## Parte 2 — Avaliação da Arquitetura Atual

### 2.1 O que funciona bem

- **Supabase com RLS**: Autenticação robusta, políticas simples e eficazes para app multi-usuário de grupo único.
- **React + Vite + Tailwind**: Stack moderna com code splitting funcionando.
- **Hooks pattern**: Separação clara entre dados (hooks) e UI (components). Consistente entre entidades.
- **Componentes de UI reutilizáveis**: Modal, Card, Button, PullToRefresh, Skeleton, Stagger — bem implementados.
- **IA integration**: OpenRouter para QuickAdd e OCR de recibos bem integrada.
- **Google Maps**: Geocodificação, Places Autocomplete, Directions API — bem encapsulados em `lib/maps.js`.

### 2.2 O que não escala

| Limitação | Risco |
|-----------|-------|
| **Sem tabela `viagens`** | Impossível ter múltiplas viagens no futuro |
| **Sem tabela `cidades`** | Dados duplicados, sem FK, sem metadados por cidade (fuso, país, coordenadas) |
| **`contexto_id` TEXT** | Sem integridade referencial. Um DELETE em destinos não cascateia para pendências/documentos vinculados |
| **Pendências binárias** | Sem fluxo de trabalho (aberta → em andamento → concluída). Sem cancelamento sem perda de dados |
| **Sem índices** | Performance degrada linearmente com crescimento de dados |
| **Tabelas fantasmas** | `memorias`, `orcamentos`, `*_participantes` poluem o schema |
| **Nomes de colunas inconsistentes** | Cada nova feature escolhe sua própria convenção |

### 2.3 Veredito

**A arquitetura atual NÃO suporta crescimento saudável.** Os problemas de normalização (sem tabela de cidades, sem FKs para contexto) e a ausência de máquina de estados para pendências são limitações estruturais. Corrigir agora evita migrações dolorosas depois.

**Recomendação**: Refatorar o schema com uma hierarquia explícita `viagens → cidades → dias → itens`, usando FKs reais em toda a cadeia.

---

## Parte 3 — Arquitetura de Dados Proposta

### 3.1 Novo Schema

```sql
-- ============================================================
-- Nível 1: Viagem
-- ============================================================
CREATE TABLE viagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  status TEXT DEFAULT 'planejando',  -- 'planejando' | 'em_andamento' | 'concluida'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Nível 2: Cidades (normalizadas, sem duplicação)
-- ============================================================
CREATE TABLE cidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  pais TEXT NOT NULL,
  flag_emoji TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  fuso_horario TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (nome, pais)
);

-- ============================================================
-- Nível 3: Dias (ponte entre viagem e cidade)
-- ============================================================
CREATE TABLE dias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id UUID NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
  cidade_id UUID NOT NULL REFERENCES cidades(id),
  data DATE NOT NULL,
  notas TEXT,
  status TEXT DEFAULT 'planejando',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (viagem_id, data)
);

-- ============================================================
-- Nível 4: Itens (tudo que pertence a um dia ou contexto)
-- ============================================================

-- Base para todos os itens: cada item tem um contexto obrigatório
-- contexto_tipo: 'viagem' | 'cidade' | 'dia' | 'atracao' | 'hospedagem' | 'transporte'
-- Para 'dia', contexto_id referencia dias.id
-- Para 'viagem', contexto_id referencia viagens.id
-- Para 'cidade', contexto_id referencia cidades.id
-- Para 'atracao', contexto_id referencia atracoes.id
-- etc.

CREATE TABLE atracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_id UUID NOT NULL REFERENCES dias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  horario TIME,
  duracao_minutos INTEGER,
  precisa_reserva BOOLEAN DEFAULT false,
  status_reserva TEXT DEFAULT 'nao_precisa',
  link TEXT,
  valor NUMERIC,
  moeda TEXT DEFAULT 'EUR',
  valor_brl NUMERIC,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  foto_url TEXT,
  notas TEXT,
  ocupa_dia_inteiro BOOLEAN DEFAULT false,
  ordem_no_dia INTEGER DEFAULT 0,
  concluida BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_id UUID REFERENCES dias(id),            -- NULL = pré-viagem
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  moeda TEXT NOT NULL DEFAULT 'EUR',
  valor_brl NUMERIC,
  cotacao_usada NUMERIC,
  categoria TEXT NOT NULL,
  data_gasto DATE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hospedagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cidade_id UUID NOT NULL REFERENCES cidades(id),
  nome TEXT NOT NULL,
  tipo TEXT DEFAULT 'hotel',
  endereco TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  check_in DATE,
  check_out DATE,
  link TEXT,
  valor_noite NUMERIC,
  moeda TEXT DEFAULT 'EUR',
  notas TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE transportes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_origem_id UUID NOT NULL REFERENCES dias(id),
  dia_destino_id UUID NOT NULL REFERENCES dias(id),
  tipo TEXT NOT NULL,
  operadora TEXT,
  link TEXT,
  valor NUMERIC,
  moeda TEXT DEFAULT 'BRL',
  valor_brl NUMERIC,
  horario_saida TIMESTAMPTZ,
  horario_chegada TIMESTAMPTZ,
  status TEXT DEFAULT 'pendente',
  codigo_reserva TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Pendências como máquina de estados
-- ============================================================
CREATE TABLE pendencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  categoria TEXT NOT NULL,                     -- 'transporte' | 'atracoes' | 'documentacao'
  estado TEXT NOT NULL DEFAULT 'aberta',       -- 'aberta' | 'em_andamento' | 'concluida' | 'cancelada'
  urgencia TEXT DEFAULT 'media',               -- 'alta' | 'media' | 'baixa'
  prazo DATE,
  link TEXT,
  notas TEXT,
  contexto_tipo TEXT NOT NULL,                 -- 'viagem' | 'cidade' | 'dia' | 'atracao' | 'hospedagem' | 'transporte'
  contexto_id UUID NOT NULL,                   -- FK para a tabela correspondente
  created_at TIMESTAMPTZ DEFAULT now(),
  concluida_em TIMESTAMPTZ,                    -- timestamp de quando foi concluída
  cancelada_em TIMESTAMPTZ                     -- timestamp de quando foi cancelada
);

-- ============================================================
-- Documentos
-- ============================================================
CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'outro',
  tipo TEXT,                                    -- 'pdf' | 'jpg' | 'png' | 'link'
  arquivo_url TEXT,
  contexto_tipo TEXT,
  contexto_id UUID,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Tabela de apoio: base de atrações famosas (mantida)
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

### 3.2 Mudanças chave

| Antes | Depois | Justificativa |
|-------|--------|---------------|
| `destinos` (dias+cidade juntos) | `viagens` + `cidades` + `dias` | Normalização 3FN. Cidade existe independente do dia. |
| `cidade` como TEXT em 3 tabelas | `cidades.id` como FK | Integridade referencial. Metadados de cidade em um só lugar. |
| `contexto_id TEXT` | `contexto_id UUID` | Permite FKs. Tipos diferentes não se misturam no mesmo campo. |
| `pendencias.concluida BOOLEAN` | `pendencias.estado TEXT` + `concluida_em` + `cancelada_em` | Máquina de estados. Histórico. Sem perda de dados. |
| `custo_estimado_eur` / `custo_estimado_brl` | `valor` + `moeda` em todas as tabelas | Consistência semântica. |
| `link_reserva` / `link` | `link` em todas as tabelas | Consistência de nomenclatura. |
| Sem índices em FKs | Índices em todas as FKs | Performance de queries. |
| Tabelas fantasmas | Removidas | Schema limpo. |
| `precisa_reserva` + `status_reserva` duplicados entre `atracoes` e `base_atracoes` | Mantidos separados (são conceitos diferentes: base é referência, atração é instância) | Correto. |

### 3.3 Hierarquia de contexto (como os dados se relacionam)

```
viagens (id)
  └── dias (id, viagem_id, cidade_id)
        ├── atracoes (id, dia_id)
        └── gastos (id, dia_id — nullable para pré-viagem)
  
  └── cidades (id) — referenciada por dias e hospedagens
        └── hospedagens (id, cidade_id)

transportes (id, dia_origem_id, dia_destino_id)
  └── liga dois dias (potencialmente de cidades diferentes)

pendencias (id, contexto_tipo, contexto_id)
  └── contexto_id referencia UUID da entidade alvo
  └── estado: aberta → em_andamento → concluída
  └── estado: aberta → cancelada

documentos (id, contexto_tipo, contexto_id)
  └── mesmo padrão de contexto que pendencias
```

### 3.4 Índices propostos

```sql
CREATE INDEX idx_dias_viagem ON dias(viagem_id);
CREATE INDEX idx_dias_cidade ON dias(cidade_id);
CREATE INDEX idx_dias_data ON dias(data);
CREATE INDEX idx_atracoes_dia ON atracoes(dia_id);
CREATE INDEX idx_gastos_dia ON gastos(dia_id);
CREATE INDEX idx_gastos_data ON gastos(data_gasto);
CREATE INDEX idx_hospedagens_cidade ON hospedagens(cidade_id);
CREATE INDEX idx_transportes_origem ON transportes(dia_origem_id);
CREATE INDEX idx_transportes_destino ON transportes(dia_destino_id);
CREATE INDEX idx_pendencias_contexto ON pendencias(contexto_tipo, contexto_id);
CREATE INDEX idx_pendencias_estado ON pendencias(estado);
CREATE INDEX idx_documentos_contexto ON documentos(contexto_tipo, contexto_id);
```

---

## Parte 4 — Padronização de Componentes (Frontend)

### 4.1 Família de componentes Travel*

| Componente | Props principais | Substitui |
|------------|-----------------|-----------|
| `<TravelForm>` | `title`, `onSave`, `onCancel`, `saving`, `children` | Wrapper padrão de todos os forms |
| `<TravelContextPicker>` | `value`, `onChange`, `contextoId`, `onContextoIdChange`, `cidades`, `dias`, `atracoes`, `hospedagens` | Contexto inline em PendenciaAdder e Documentos |
| `<TravelDatePicker>` | `value`, `onChange`, `label`, `min`, `max` | Todos os `<input type="date">` |
| `<TravelCurrencyInput>` | `valor`, `moeda`, `onValorChange`, `onMoedaChange`, `moedas` | Valor+moeda em AtracaoForm, GastoForm, TransportEditor |
| `<TravelCategorySelector>` | `value`, `onChange`, `options` | Categoria em todos os forms |
| `<TravelPrioritySelector>` | `value`, `onChange` | Urgência em PendenciaAdder/Editor |
| `<TravelFooterActions>` | `onSave`, `onCancel`, `saving`, `saveLabel`, `onDelete`, `deleteLabel` | FormFooter + DeleteSection combinados |

### 4.2 Estrutura de formulário padronizada

Todo formulário do app seguirá este template:

```jsx
<Modal titulo="Novo X | Editar X">
  <TravelForm title="Novo X" onSave={handleSave} onCancel={onClose} saving={saving}>
    <FormField label="Nome">
      <input className="input-padrao" />
    </FormField>
    
    <TravelContextPicker ... />
    <TravelCategorySelector ... />
    <TravelCurrencyInput ... />
    <TravelDatePicker ... />
    
    <TravelFooterActions 
      onSave={handleSave}
      onCancel={onClose}
      onDelete={isEditing ? handleDelete : null}
    />
  </TravelForm>
</Modal>
```

---

## Parte 5 — Pendências como Máquina de Estados

### 5.1 Estados e transições

```
         ┌─────────┐
         │ ABERTA  │
         └────┬────┘
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
┌───────┐ ┌────────┐ ┌──────────┐
│EM AND.│ │CONCLUÍDA│ │CANCELADA │
└───┬───┘ └────────┘ └──────────┘
    │
    ▼
┌────────┐
│CONCLUÍDA│
└────────┘
```

**Regras**:
- `aberta` → `em_andamento`: usuário começa a resolver
- `aberta` → `concluida`: resolução direta (ex: "comprar passagem" → comprou)
- `aberta` → `cancelada`: não é mais necessária
- `em_andamento` → `concluida`: terminou
- `em_andamento` → `cancelada`: desistiu
- NUNCA deletar pendência. `cancelada` vira soft delete.
- `concluida_em` e `cancelada_em` registram timestamps.

### 5.2 Impacto na UI

| Estado | Visual no card | Ação principal |
|--------|---------------|----------------|
| `aberta` | Badge laranja "Pendente" | Checkbox → concluída |
| `em_andamento` | Badge azul "Em andamento" | Checkbox → concluída |
| `concluida` | Badge verde + risco no texto | Ícone de check |
| `cancelada` | Badge cinza + opacidade reduzida | Oculto por padrão (filtrável) |

---

## Parte 6 — Migração do Banco de Dados

### 6.1 Estratégia

A migração será feita em 3 scripts:

1. **Criar novas tabelas** (`viagens`, `cidades`, `dias`, `hospedagens`)
2. **Migrar dados existentes** (`destinos` → `cidades` + `dias`, renomear colunas)
3. **Remover tabelas antigas** (após confirmar que tudo funciona)

### 6.2 Estimativa de impacto

| O que | Impacto no código |
|-------|-------------------|
| `destinos` → `dias` + `cidades` | ALTO — todos os hooks e views que referenciam `destinos` precisam ser atualizados |
| `destino_id` → `dia_id` | ALTO — `useAtracoes`, `useGastos`, `AtracaoForm`, `GastoForm`, `DayDetailView` |
| `concluida BOOLEAN` → `estado TEXT` | MÉDIO — `usePendencias`, `PendenciaItem`, `PendenciasView` |
| `custo_estimado_eur` → `valor` + `moeda` | MÉDIO — `AtracaoForm`, `AtracaoCard`, `QuickAdd` |
| `link_reserva` → `link` | BAIXO — renomear em forms |
| Novos índices | BAIXO — só SQL |
| Remover tabelas fantasmas | BAIXO — não têm código dependente |

### 6.3 Plano de execução

1. **Rodar script 1** (criar novas tabelas) — sem downtime
2. **Rodar script 2** (migrar dados) — sem downtime
3. **Atualizar hooks e componentes** para usar novo schema
4. **Testar build e todas as telas**
5. **Rodar script 3** (remover antigas) — após confirmação

---

## Parte 7 — Resumo e Recomendação

### Pontos fortes (manter)
- Stack React + Vite + Tailwind + Supabase
- Padrão de hooks por entidade
- Componentes de UI reutilizáveis (Modal, Card, Button, Skeleton)
- Integração com IA (OpenRouter) e Google Maps

### Pontos fracos (corrigir)
- Schema sem normalização (sem tabelas `viagens`/`cidades`)
- `contexto_id` como TEXT (sem integridade referencial)
- Pendências sem máquina de estados
- 4 tabelas fantasmas no schema
- Índices faltando em FKs comuns
- Nomes de colunas inconsistentes entre tabelas

### Próximos passos (após aprovação)

| Ordem | Tarefa | Duração estimada |
|-------|--------|-----------------|
| 1 | Criar migration SQL (script 1: novas tabelas) | 30 min |
| 2 | Criar migration SQL (script 2: migrar dados) | 30 min |
| 3 | Atualizar hooks (`useDestinos` → `useDias`, `useCidades`, `useViagem`) | 2h |
| 4 | Atualizar todos os forms para usar novo schema | 2h |
| 5 | Atualizar views (ViagemView, CidadeDetailView, DayDetailView) | 2h |
| 6 | Criar família de componentes Travel* | 2h |
| 7 | Implementar máquina de estados nas pendências | 1h |
| 8 | Criar migration SQL (script 3: limpar schema) | 15 min |
| 9 | Testes e build | 1h |
| **Total** | | **~11h** |
