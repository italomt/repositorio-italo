# Redesign UX/UI — Europa Trip App

**Fase**: Produto (não arquitetura, não código)
**Time atuando**: Head of Product, Sr Product Designer, UX Researcher, UX Writer, Design Systems
**Princípio**: O usuário pensa em Viagem → Cidade → Dia → Item. A navegação deve seguir essa hierarquia. Nunca o contrário.

---

## Parte 1 — Auditoria da Experiência Atual

### 1.1 Jornada atual do usuário

```
Login → Home
         ├── TabBar: Viagem → CidadeDetail → DayDetail
         ├── TabBar: Finanças
         ├── TabBar: Pendências
         └── TabBar: Mais (Documentos + Config + Sobre)
```

### 1.2 O que funciona bem

- TabBar com 5 abas — escopo claro e enxuto
- Home contextual: pré-viagem mostra contagem regressiva, durante a viagem mostra agenda do dia
- CidadeDetail agrupa por abas (Resumo, Dias, Pendências, Hospedagem, Documentos)
- Pull-to-refresh em listas
- Animações de transição entre páginas (framer-motion)
- Skeletons durante loading

### 1.3 Problemas de UX identificados

| # | Problema | Impacto |
|---|----------|---------|
| 1 | **CidadeDetail é uma "página dumping ground"** — 6 abas com tudo junto. Resumo tem cards de atrações, gastos, clima, fuso horário, tudo competindo por atenção. | Carga cognitiva alta. Usuário não sabe o que olhar primeiro. |
| 2 | **DayDetail é uma lista, não uma agenda** — Horários são texto pequeno. Não há timeline visual. Navegar entre dias requer voltar pra CidadeDetail. | Experiência de "agenda do dia" fraca. |
| 3 | **Finanças é só uma lista + gráfico** — Sem dashboard. Sem orçamento vs realizado. Sem resumo por cidade. Só scroll infinito. | Difícil tomar decisão financeira. |
| 4 | **Explorar/IA está escondida** — QuickAdd é um modal dentro de DayDetail. PreencherDia é outro botão. O usuário não descobre lugares naturalmente. | Descoberta zero. IA reativa, não proativa. |
| 5 | **Home duplica Viagem** — Durante a viagem, Home mostra o dia atual. Viagem mostra cidades. São duas visões da mesma coisa com propósitos confusos. | Duplicação de propósito. |
| 6 | **Pendências parecem registros, não tarefas** — Checkbox com animação, mas sem sensação de progresso real. Sem agrupamento inteligente. | Checklist, não task manager. |
| 7 | **Formulários são modais, não sheets** — Todo formulário abre um modal que cobre a tela. Perde-se o contexto do que está sendo editado. | Contexto perdido. |
| 8 | **Navegação entre dias é quebrada** — Do CidadeDetail, clica num dia → DayDetail. Pra ver o próximo dia, volta → clica no próximo. | 2 cliques por transição de dia. |
| 9 | **Documentos não têm dono claro** — Aparecem em CidadeDetail e em Mais. O usuário não sabe onde gerenciar. | Confusão de localização. |
| 10 | **Sem empty states úteis** — "Nenhuma atração planejada" é genérico. Não sugere ação, não contextualiza. | Oportunidade perdida de engajamento. |

---

## Parte 2 — Nova Arquitetura de UX

### 2.1 Hierarquia de navegação (repensada)

```
TabBar (5 abas, mantidas mas reorganizadas)
├── 🏠 Hoje      → Agenda do dia + resumo rápido
├── 🗺️ Viagem    → Cidades (dashboard, não lista)
├── 💰 Finanças  → Dashboard financeiro
├── ✅ Tarefas   → Pendências como task manager
└── ⚙️ Mais      → Documentos, IA, Configurações
```

### 2.2 Fluxo principal

```
Hoje (visão do dia)
  ↓ toque na cidade
Cidade (hub da cidade)
  ├── Aba: Visão geral (dashboard)
  ├── Aba: Agenda (dias com swipe horizontal)
  ├── Aba: Hospedagem
  └── Aba: Info (mapa, clima, docs)
  ↓ toque num dia
Dia (agenda visual)
  ├── Timeline vertical com horários
  ├── Swipe horizontal entre dias da cidade
  └── Botões: + Atração, + Gasto, IA Preencher
```

### 2.3 Telas que MUDAM de propósito

| Tela atual | Nova proposta | Mudança |
|-----------|---------------|---------|
| Home (agenda do dia) | **Hoje** — mantém função mas ganha resumo financeiro + tarefas pendentes | Evolução |
| Viagem (lista de cidades) | **Viagem** — dashboard de viagem com cards de cidade, progresso, gastos | Redesign |
| CidadeDetail (6 abas) | **Cidade** — 4 abas: Visão geral, Agenda, Hospedagem, Info | Simplificação |
| DayDetail (lista) | **Dia** — timeline visual com swipe entre dias | Redesign |
| Finanças (lista) | **Finanças** — dashboard com orçamento, gráficos, resumo | Redesign |
| Pendências (lista) | **Tarefas** — kanban/lista com estados visuais | Redesign |
| Mais (3 abas) | **Mais** — Explora/IA ganha destaque, Docs ficam aqui | Reorganização |

### 2.4 O que some ou é absorvido

| Componente antigo | Destino |
|-------------------|---------|
| Aba "Resumo" do CidadeDetail | Absorvida pela nova aba "Visão geral" |
| Aba "Pendências" do CidadeDetail | Movida para Tarefas (já é global, não por cidade) |
| Aba "Documentos" do CidadeDetail | Movida para Info (contextualizada) |
| QuickAdd modal | Substituído por botão "+" contextual em cada tela |
| PreencherDia modal | Substituído por IA inline na tela do Dia |

---

## Parte 3 — Jornada do Usuário (tela a tela)

### 3.1 🏠 Hoje

**Pergunta que responde**: "O que está acontecendo agora na minha viagem?"

```
┌─────────────────────────────────────┐
│ 👤 Italo                      ⚙️   │
│                                     │
│ Europa 2026 · Dia 3 de 22           │
│ ████████░░░░░░ 14%                 │
│                                     │
│ 📅 16 de setembro · Terça-feira     │
│ 🇪🇸 Madrid                          │
│ ☀️ 24°C · Parcialmente nublado     │
│                                     │
│ ┌─ HOJE ──────────────────────────┐ │
│ │                                 │ │
│ │ 09:00  Museu do Prado           │ │
│ │        €15 · Reservado ✅       │ │
│ │                                 │ │
│ │ 12:30  Mercado San Miguel       │ │
│ │        €25 · Almoço            │ │
│ │                                 │ │
│ │ 15:00  Parque del Retiro        │ │
│ │        Grátis · Natureza       │ │
│ │                                 │ │
│ │ 18:00  Gran Via                 │ │
│ │        Compras                  │ │
│ │                                 │ │
│ │         + Adicionar             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ GASTO HOJE ────────────────────┐ │
│ │ R$ 215,00    │ + Adicionar      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ TAREFAS ───────────────────────┐ │
│ │ ⬜ Reservar Sagrada Família      │ │
│ │ ⬜ Comprar trem Madrid→Barcelona │ │
│ │ ✅ Seguro viagem                 │ │
│ │        3 pendentes · Ver todas →│ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ AMANHÃ ────────────────────────┐ │
│ │ 🇪🇸 Madrid · Dia 2              │ │
│ │ 3 atrações planejadas      ›    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Por que funciona**: Uma tela, um propósito: responder "o que está rolando agora". Agenda do dia é protagonista. Gasto rápido e tarefas são ações secundárias. Amanhã é teaser, não tela separada.

---

### 3.2 🗺️ Viagem

**Pergunta que responde**: "Como está minha viagem como um todo?"

```
┌─────────────────────────────────────┐
│ ← Voltar      VIAGEM     + Adicionar│
│                                     │
│ Europa 2026                         │
│ 14 set – 5 out · 22 dias           │
│ ████████████████░░ 73%             │
│                                     │
│ ┌─ RESUMO ────────────────────────┐ │
│ │ 8 cidades  │ 31 atrações        │ │
│ │ R$ 4.215   │ 5 pendências       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ 🇵🇹 LISBOA ─────────────────────┐ │
│ │ 14–16 set · 2 dias              │ │
│ │ ████████████████████ 100%       │ │
│ │ ✓ Hospedagem  · 4 atrações      │ │
│ │ R$ 580 gastos               ›   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ 🇪🇸 MADRID ─────────────────────┐ │
│ │ 16–18 set · 2 dias              │ │
│ │ ██████████░░░░░░░░░░ 55%        │ │
│ │ ⚠ Sem hospedagem · 3 atrações   │ │
│ │ R$ 215 gastos               ›   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ 🇪🇸 BARCELONA ──────────────────┐ │
│ │ 18–20 set · 2 dias              │ │
│ │ ░░░░░░░░░░░░░░░░░░░░ 0%         │ │
│ │ ⚠ Sem hospedagem                │ │
│ │ ⚠ Nenhuma atração           ›   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ...                                 │
│                                     │
│ ┌─ 🗺️ Mapa geral ──────────────────┐ │
│ │ Todas as cidades no mapa    ›   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Por que funciona**: Dashboard de progresso. Cada cidade é um card com indicadores visuais (check, warning, progresso). Um olhar responde "como está a viagem". Toque na cidade vai pro hub.

---

### 3.3 🏙️ Cidade (hub)

**Pergunta que responde**: "Como está Lisboa?"

```
┌─────────────────────────────────────┐
│ ← Viagem      LISBOA      ⚡ IA    │
│                                     │
│ 🇵🇹 Lisboa, Portugal                │
│ 14–16 set · 2 dias                 │
│                                     │
│ [Visão geral] [Agenda] [Hosped.] [Info] │
│                                     │
│ ┌─ VISÃO GERAL ───────────────────┐ │
│ │                                 │ │
│ │ Progresso: ████████████████ 100%│ │
│ │                                 │ │
│ │ ┌────────┐ ┌────────┐ ┌───────┐ │ │
│ │ │ 4      │ │ R$ 580 │ │ ✓     │ │ │
│ │ │atrações│ │ gastos │ │hosped │ │ │
│ │ └────────┘ └────────┘ └───────┘ │ │
│ │                                 │ │
│ │ ┌─ ☀️ Clima ──────────────────┐ │ │
│ │ │ 22°–28°C · Ensolarado      │ │ │
│ │ │ UTC+1 · 3h a mais q Brasil │ │ │
│ │ └─────────────────────────────┘ │ │
│ │                                 │ │
│ │ ┌─ ⚡ Sugestões IA ────────────┐ │ │
│ │ │ • Adicionar Torre de Belém  │ │ │
│ │ │ • Pastel de nata no Bairro  │ │ │
│ │ │   Alto (14h–16h livre)      │ │ │
│ │ │         Ver mais sugestões →│ │ │
│ │ └─────────────────────────────┘ │ │
│ │                                 │ │
│ │ ┌─ 🗺️ Mapa da cidade ─────────┐ │ │
│ │ │ [mini mapa com atrações]   │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Aba Agenda**:
```
┌─ AGENDA ──────────────────────────┐
│                                    │
│ ← 14 set │ ● 15 set │ 16 set →   │  ← swipe/bolinhas entre dias
│                                    │
│ ┌─ 15 de setembro · Terça ───────┐ │
│ │                                │ │
│ │ 09:00  Torre de Belém          │ │
│ │        €6 · Cultura           │ │
│ │                                │ │
│ │ 12:00  LX Factory              │ │
│ │        Grátis · Cultura       │ │
│ │                                │ │
│ │ 16:00  Príncipe Real           │ │
│ │        €20 · Gastronomia      │ │
│ │                                │ │
│ │ 21:00  Bairro Alto             │ │
│ │        €30 · Balada           │ │
│ │                                │ │
│ │        + Adicionar atração     │ │
│ │        ⚡ Preencher dia com IA │ │
│ │        🗺️ Otimizar rota       │ │
│ └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

Por que funciona: O hub da cidade tem 4 abas com propósito claro. Visão geral é dashboard. Agenda tem swipe entre dias — zero voltar pra trás. IA sugere proativamente baseado em gaps no dia.

---

### 3.4 💰 Finanças

**Pergunta que responde**: "Quanto gastei e quanto falta?"

```
┌─────────────────────────────────────┐
│ ← Voltar      FINANÇAS              │
│                                     │
│ Orçamento: R$ 15.000                │
│ Gasto:     R$ 4.215                │
│ ████████░░░░░░░░░░░░ 28%          │
│ Restam R$ 10.785 para 16 dias      │
│                                     │
│ ┌─ POR CATEGORIA ─────────────────┐ │
│ │ 🍽️ Alimentação  R$ 1.200  28%  │ │
│ │ 🚆 Transporte    R$ 950    22%  │ │
│ │ 🏨 Hospedagem    R$ 850    20%  │ │
│ │ 🎫 Atrações      R$ 615    14%  │ │
│ │ 🛍️ Compras       R$ 400     9%  │ │
│ │ 🎉 Lazer         R$ 200     7%  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ POR CIDADE ────────────────────┐ │
│ │ 🇵🇹 Lisboa     R$ 580           │ │
│ │ 🇪🇸 Madrid     R$ 215           │ │
│ │ 🇪🇸 Barcelona  R$ 0             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ ÚLTIMOS GASTOS ────────────────┐ │
│ │ Hoje                              │
│ │ Mercado San Miguel    €25  R$155 │ │
│ │ Museu do Prado        €15  R$93  │ │
│ │ Ontem                             │
│ │ Jantar Taberna        €30  R$186 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [+ Adicionar gasto]                 │
└─────────────────────────────────────┘
```

---

### 3.5 ✅ Tarefas

**Pergunta que responde**: "O que ainda preciso resolver?"

```
┌─────────────────────────────────────┐
│ ← Voltar      TAREFAS    + Nova     │
│                                     │
│ [Todas] [Transporte] [Atrações] [Docs]│
│                                     │
│ ┌─ 🔴 ALTA PRIORIDADE ────────────┐ │
│ │ ⬜ Reservar Sagrada Família      │ │
│ │    Atrações · Prazo: 15 jul     │ │
│ │ ⬜ Comprar trem Madrid→Barcelona │ │
│ │    Transporte · Prazo: 20 jul   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ 🟡 MÉDIA ──────────────────────┐ │
│ │ ⬜ Reservar Coliseu             │ │
│ │    Atrações · Prazo: 20 ago     │ │
│ │ ⬜ Comprar chip/eSIM            │ │
│ │    Documentação · Prazo: 20 ago │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ 🟢 CONCLUÍDAS ─────────────────┐ │
│ │ ✅ Seguro viagem                 │ │
│ │ ✅ Passaporte válido             │ │
│ │ ✅ Cartão Wise                   │ │
│ │        12 concluídas · Ocultar  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ ⚠ ACOMODAÇÕES FALTANDO ───────┐ │
│ │ 🇪🇸 Madrid     → Reservar       │ │
│ │ 🇪🇸 Barcelona  → Reservar       │ │
│ │ 🇮🇹 Milão      → Reservar       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ 🚆 TRANSPORTES FALTANDO ───────┐ │
│ │ Madrid → Barcelona  → Definir   │ │
│ │ Barcelona → Milão    → Definir  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

Por que funciona: Agrupado por urgência, não por categoria. Estados visuais (🔴🟡🟢). Concluídas colapsáveis. Acomodações e transportes faltando viram "tarefas implícitas" na mesma tela.

---

### 3.6 ⚙️ Mais

```
┌─────────────────────────────────────┐
│                MAIS                 │
│                                     │
│ ┌─ 📄 Documentos ─────────────────┐ │
│ │ 5 documentos · + Adicionar  ›   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ ⚡ Explorar / IA ──────────────┐ │
│ │ Descobrir lugares, restaurantes │ │
│ │ e otimizar seu roteiro     ›   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ ⚙️ Configurações ──────────────┐ │
│ │ Viagem, aparência, preferências ›│ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ 📊 Sobre ──────────────────────┐ │
│ │ Europa Trip App v1.15.5    ›   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Parte 4 — Padrão de Formulários (consolidado)

### 4.1 Template universal

Todo formulário de criação/edição segue:

```
┌─────────────────────────────────────┐
│ [Cancelar]     NOVA ATRAÇÃO         │
│                                     │
│ Nome                                │
│ ┌─────────────────────────────────┐ │
│ │ Torre Eiffel                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Vinculado a                         │
│ [Viagem] [Cidade] [Dia] [Atração]  │
│                                     │
│ Categoria                           │
│ [Museu] [Gastronomia] [Cultura]... │
│                                     │
│ Valor                               │
│ [  25,00  ] [EUR ▾]                │
│                                     │
│ Horário                             │
│ [  14:00  ]                         │
│                                     │
│ ┌─ ⬜ Precisa de reserva            │
│ └─ ⬜ Ocupa o dia inteiro           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │         SALVAR                  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 4.2 Componentes do Design System

| Componente | Uso |
|-----------|-----|
| `TravelForm` | Wrapper de todo formulário |
| `TravelField` | Label + input padronizado |
| `TravelContextPicker` | Seletor de viagem/cidade/dia |
| `TravelDatePicker` | Data padronizada |
| `TravelCurrencyInput` | Valor + moeda |
| `TravelCategorySelector` | Categoria (select ou chips) |
| `TravelPrioritySelector` | Urgência/prioridade |
| `TravelFooter` | Salvar + Cancelar + Excluir |

---

## Parte 5 — Plano de Implementação

### Fase 1: Hoje (1 tela, alto impacto)
- Redesenhar Home como dashboard do dia atual
- Adicionar resumo financeiro rápido
- Adicionar tarefas pendentes do dia
- Manter GastoRapido

### Fase 2: Viagem (1 tela, alto impacto)
- Dashboard de cidades com progresso
- Cards de cidade com indicadores
- Remover timeline vertical (mover para Cidade)

### Fase 3: Cidade (1 tela, alto impacto)
- 4 abas: Visão geral, Agenda, Hospedagem, Info
- Swipe entre dias na aba Agenda
- IA proativa na Visão geral

### Fase 4: Finanças (1 tela)
- Dashboard financeiro
- Orçamento vs realizado
- Resumo por categoria + cidade

### Fase 5: Tarefas (1 tela)
- Agrupamento por urgência
- Estados visuais
- Acomodações/transportes faltando integrados

### Fase 6: Mais (1 tela)
- Reorganizar: Docs, IA, Config, Sobre

### Fase 7: Formulários
- Aplicar Travel* em todos os forms restantes
- Unificar experiência de criação

**Estimativa: ~8h de implementação**

---

## Parte 6 — DESIGN_SYSTEM.md (princípios de produto)

### Quando usar cada padrão

| Situação | Padrão |
|----------|--------|
| Criar/editar um item | **Bottom sheet** (não modal full-screen) |
| Confirmar ação destrutiva | **Alert dialog** centralizado |
| Mostrar detalhes de um item | **Nova tela** (push navigation) |
| Ações rápidas no contexto | **Botão flutuante** ou **botão no header** |
| Lista de itens relacionados | **Card list** com separadores |
| Dashboard/resumo | **Grid de métricas** com cards pequenos |
| Timeline/agenda | **Lista vertical** com indicador de horário |
| Alertas/sugestões IA | **Banner inline** (não toast) |

### Hierarquia visual

```
Nível 1: Título da tela (font-display, 34px, bold)
Nível 2: Subtítulo/seção (14px, uppercase, tracking-wide, muted)
Nível 3: Card (bg-white, rounded-ios-lg, shadow-ios)
Nível 4: Label de campo (12px, uppercase, muted)
Nível 5: Texto de apoio (13px, muted)
Nível 6: Microcopy (11px, muted2)
```

### Estados de loading

| Situação | Componente |
|----------|-----------|
| Primeira carga | Skeleton cards (3-4) |
| Pull-to-refresh | Indicador nativo (seta → spinner) |
| Salvando | Botão "Salvando..." com spinner |
| Erro | Banner inline com ícone + mensagem + botão "Tentar novamente" |

### Tom de voz (UX Writing)

| Contexto | Exemplo |
|----------|---------|
| Empty state | "Nenhuma atração em Lisboa ainda. Que tal explorar?" + botão "Descobrir com IA" |
| Confirmação | "Tem certeza que deseja excluir Torre Eiffel? Esta ação não pode ser desfeita." |
| Sucesso | "Atração adicionada" (toast, 3s) |
| Erro | "Não foi possível salvar. Verifique sua conexão." (banner) |
| Sugestão IA | "Seu dia 15 tem uma tarde livre. Que tal visitar o Bairro Alto?" |
