# USER LIFECYCLE — Europa Trip App

**Tipo**: Documento de produto (zero código)
**Objetivo**: Desenhar a jornada completa do usuário, do primeiro acesso até a terceira viagem.
**Regra**: Nenhuma tela é desenhada antes de entender em qual fase do ciclo de vida ela aparece.

---

## Ciclo de Vida do Usuário

```
FASE 1 — DESCOBERTA
  Usuário instalou o app. Nunca usou.
  ↓
FASE 2 — CRIAÇÃO
  Criou conta (email/senha ou Google).
  ↓
FASE 3 — PRIMEIRA VIAGEM
  Criou a primeira viagem (assistida, passo a passo).
  ↓
FASE 4 — PLANEJAMENTO
  Adicionou cidades, dias, atrações, hospedagens.
  ↓
FASE 5 — PRÉ-VIAGEM
  Viagem criada, data ainda não chegou. Modo preparação.
  ↓
FASE 6 — VIAGEM EM ANDAMENTO
  Está viajando. Modo execução.
  ↓
FASE 7 — PÓS-VIAGEM
  Viagem terminou. Modo memória.
  ↓
FASE 8 — REVIVAL
  Quer ver o que fez. Fotos, gastos, memórias.
  ↓
FASE 9 — PRÓXIMA VIAGEM
  Cria nova viagem. O ciclo recomeça.
```

---

## FASE 1 — DESCOBERTA (0 viagens)

**Usuário**: Instalou o app, nunca abriu.
**Pergunta que o app responde**: "O que é isso e por que eu deveria usar?"

### Estado: App fechado → Primeira abertura

```
┌─────────────────────────────────────┐
│                                     │
│           ✈️                        │
│                                     │
│     Europa Trip                     │
│     Planeje viagens com IA          │
│                                     │
│     "Montei meu roteiro de 22        │
│      dias pela Europa em 10 minutos" │
│      — Italo, Lisboa 2026           │
│                                     │
│                                     │
│     ┌─────────────────────────────┐ │
│     │   COMEÇAR                   │ │
│     └─────────────────────────────┘ │
│                                     │
│     Já tem conta? Entrar            │
└─────────────────────────────────────┘
```

### Decisão de produto
- **NÃO ter slides de onboarding** (3 telas "deslize para ver features"). Ninguém lê.
- **NÃO pedir conta antes de mostrar valor**. O botão "Começar" leva direto para criar viagem.
- Conta é criada no final do fluxo de criação da viagem ("salve sua viagem criando uma conta").

---

## FASE 2 — CRIAÇÃO DE CONTA

### Fluxo

```
Começar (sem conta)
  ↓
Cria viagem primeiro (FASE 3)
  ↓
"No final: Crie sua conta para salvar"
  ↓
Email + senha OU Google
  ↓
Pronto. Viagem salva.
```

### Decisão de produto
- **Conta DEPOIS da primeira viagem**. O usuário já investiu tempo planejando, a conversão é muito maior.
- Login social (Google) como opção principal. Email/senha como alternativa.
- Nunca pedir "confirme sua senha" — se errar, recupera depois.

---

## FASE 3 — PRIMEIRA VIAGEM (criação assistida)

**Usuário**: Nunca criou uma viagem. Não sabe o que o app faz.
**Pergunta que o app responde**: "Me guie. Não sei por onde começar."

### Fluxo assistido (wizard de 5 passos)

```
PASSO 1: NOME E TIPO
┌─────────────────────────────────────┐
│          Nova viagem                │
│                                     │
│ Como quer chamar essa viagem?       │
│ ┌─────────────────────────────────┐ │
│ │ Europa 2026                     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Que tipo de viagem?                 │
│ ○ Lazer                            │
│ ○ Trabalho                         │
│ ○ Mochilão                         │
│ ○ Família                          │
│ ○ Fim de semana                    │
│                                     │
│                        [Próximo →]  │
└─────────────────────────────────────┘

PASSO 2: DATAS
┌─────────────────────────────────────┐
│          Nova viagem                │
│                                     │
│ Quando você vai?                    │
│                                     │
│ Ida:  [14 de setembro    📅]       │
│ Volta:[5 de outubro      📅]       │
│                                     │
│ Duração: 22 dias                   │
│                                     │
│              [← Voltar]  [Próximo→] │
└─────────────────────────────────────┘

PASSO 3: PRIMEIRO DESTINO
┌─────────────────────────────────────┐
│          Nova viagem                │
│                                     │
│ Qual seu primeiro destino?          │
│ ┌─────────────────────────────────┐ │
│ │ 🔍 Lisboa                       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🇵🇹 Lisboa, Portugal                │
│                                     │
│ Quantos dias?                       │
│ [3]                                 │
│                                     │
│              [← Voltar]  [Próximo→] │
└─────────────────────────────────────┘

PASSO 4: HOSPEDAGEM (opcional)
┌─────────────────────────────────────┐
│          Nova viagem                │
│                                     │
│ Onde vai ficar em Lisboa?           │
│                                     │
│ ○ Ainda não sei (pular)             │
│ ○ Já tenho reserva                  │
│   ┌───────────────────────────────┐ │
│   │ Nome do hotel...              │ │
│   └───────────────────────────────┘ │
│                                     │
│              [← Voltar]  [Próximo→] │
└─────────────────────────────────────┘

PASSO 5: COMO CHEGAR (opcional)
┌─────────────────────────────────────┐
│          Nova viagem                │
│                                     │
│ Como vai chegar em Lisboa?          │
│                                     │
│ ○ Avião                            │
│ ○ Trem                             │
│ ○ Carro                            │
│ ○ Ainda não sei (pular)            │
│                                     │
│              [← Voltar]  [Criar ✨] │
└─────────────────────────────────────┘
```

### Após criar

```
┌─────────────────────────────────────┐
│          ✨ Pronto!                  │
│                                     │
│     Sua viagem para Europa 2026     │
│     foi criada.                     │
│                                     │
│     🇵🇹 Lisboa · 3 dias              │
│     14 – 17 de setembro             │
│                                     │
│     O que fazer agora?              │
│                                     │
│ ┌─ 🗺️ Explorar Lisboa ────────────┐ │
│ │ Ver mapa, atrações e sugestões  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ ⚡ IA: Monte meu roteiro ───────┐ │
│ │ A IA sugere um roteiro completo │ │
│ │ baseado no seu perfil           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ 📋 Adicionar mais destinos ────┐ │
│ │ Adicione Madrid, Barcelona...   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ 🔐 Criar conta e salvar ───────┐ │
│ │ Salve sua viagem na nuvem       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Decisões de produto
- **Wizard, não formulário**. Cada passo é uma pergunta simples.
- **Pular é sempre uma opção**. O usuário não é obrigado a preencher tudo.
- **IA é oferecida como atalho**: "Quer que eu monte o resto?"
- **Conta no final**: depois que o usuário já viu valor.
- **Próximos destinos**: depois de criar o primeiro, o app pergunta "quer adicionar mais cidades?". Se sim, repete passos 3-5 para cada cidade.

---

## FASE 4 — PLANEJAMENTO (viagem criada, adicionando conteúdo)

**Usuário**: Já tem viagem com pelo menos 1 cidade. Está montando o roteiro.
**Pergunta que o app responde**: "O que fazer em cada cidade?"

### Modos de planejamento

O app oferece 3 modos. O usuário escolhe:

```
┌─────────────────────────────────────┐
│ Como prefere planejar?              │
│                                     │
│ ┌─ 🏙️ CIDADE POR CIDADE ──────────┐ │
│ │ Escolho uma cidade e monto      │ │
│ │ tudo que quero fazer nela.      │ │
│ │ Ideal para: roteiros flexíveis  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ 📅 DIA POR DIA ────────────────┐ │
│ │ Organizo cada dia em ordem      │ │
│ │ cronológica.                    │ │
│ │ Ideal para: roteiros detalhados │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ ⚡ IA MONTA PRA MIM ───────────┐ │
│ │ Respondo perguntas rápidas e    │ │
│ │ a IA cria o roteiro completo.   │ │
│ │ Ideal para: primeira viagem     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

Esta tela aparece UMA VEZ. Depois o usuário pode mudar nas Configurações.

### Decisões de produto
- **3 modos de planejamento** = 3 personas diferentes. Não force um único fluxo.
- **IA não é feature, é modo**. Trate como alternativa legítima ao planejamento manual.
- **O modo escolhido define a UI**: Cidade-por-cidade → tela da Cidade é o hub. Dia-a-dia → tela do Dia é o hub.

---

## FASE 5 — PRÉ-VIAGEM (viagem criada, data não chegou)

**Usuário**: Já planejou. Está ansioso. Quer saber se está pronto.
**Pergunta que o app responde**: "Está tudo pronto para a viagem?"

### Tela principal: Home pré-viagem

```
┌─────────────────────────────────────┐
│ Bom dia, Italo!               👤   │
│                                     │
│ Europa 2026                         │
│ Faltam 76 dias                     │
│ ████████░░░░░░░░░░░░░░ 35% pronto  │
│                                     │
│ ┌─ ✅ O QUE FALTA ────────────────┐ │
│ │                                 │ │
│ │ ⚠ 3 pendências                 │ │
│ │ ⚠ 2 cidades sem hospedagem      │ │
│ │ ⚠ 5 trechos sem transporte      │ │
│ │                                 │ │
│ │ Resolva tudo para ficar 100% → │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ 📋 PRÓXIMAS TAREFAS ───────────┐ │
│ │ 🔴 Reservar Sagrada Família      │ │
│ │    Prazo: 15 de julho           │ │
│ │ 🔴 Comprar trem Madrid→Barcelona │ │
│ │    Prazo: 20 de julho           │ │
│ │ 🟡 Contratar seguro viagem      │ │
│ │    Prazo: 1 de agosto           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ 💰 ORÇAMENTO ──────────────────┐ │
│ │ Orçamento:    R$ 15.000         │ │
│ │ Já gasto:     R$ 4.215 (28%)    │ │
│ │ Previsto:     R$ 8.500 (56%)    │ │
│ │ Restante:     R$ 2.285 (16%)    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ 🇵🇹 LISBOA ─────────────────────┐ │
│ │ 14–17 set · 3 dias · ✓ pronto  │ │
│ └─────────────────────────────────┘ │
│ ┌─ 🇪🇸 MADRID ────────────────────┐ │
│ │ 17–19 set · 2 dias · ⚠ 60%     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Decisões de produto
- **Progresso é o protagonista**. Barra de progresso + "faltam X dias".
- **Pendências são o call-to-action**. "Resolva tudo para ficar 100%".
- **Orçamento visível**. O usuário quer saber se está gastando certo antes de viajar.

---

## FASE 6 — VIAGEM EM ANDAMENTO (durante a viagem)

**Usuário**: Está na rua, no celular. Precisa de informação rápida.
**Pergunta que o app responde**: "O que vou fazer agora?"

### Tela principal: Hoje (modo viagem)

```
┌─────────────────────────────────────┐
│ 16 de setembro · Terça-feira        │
│ 🇪🇸 Madrid · Dia 3 de 22            │
│ ☀️ 24°C                             │
│                                     │
│ ┌─ AGORA ─────────────────────────┐ │
│ │                                 │ │
│ │ 09:00  Museu do Prado    ✅     │ │
│ │        €15 · Reservado         │ │
│ │        🚶 12min do hotel       │ │
│ │                                 │ │
│ │ 12:30  Mercado San Miguel       │ │
│ │        €25 · Almoço            │ │
│ │        🚶 8min                 │ │
│ │                                 │ │
│ │ 15:00  Parque del Retiro        │ │
│ │        Grátis · Natureza       │ │
│ │        🚶 15min                 │ │
│ │                                 │ │
│ │ 18:00  Gran Via                 │ │
│ │        Compras                  │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ 💰 HOJE ───────────────────────┐ │
│ │ Gasto: R$ 155    │ + Add gasto  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ 📅 AMANHÃ ─────────────────────┐ │
│ │ 3 atrações · Parque del Retiro  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ ⚡ DICA ───────────────────────┐ │
│ │ O Museu do Prado é gratuito     │ │
│ │ às terças das 18h às 20h.       │ │
│ │ Vale a pena voltar no fim da    │ │
│ │ tarde!                          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Decisões de produto
- **AGORA é o foco**. A agenda do dia ocupa 60% da tela.
- **Informação contextual**: clima, distância a pé do hotel, se já está pago/reservado.
- **IA proativa**: dicas baseadas no dia atual (clima, dia da semana, horário).
- **Gasto rápido**: add gasto em 2 toques, sem sair da tela.
- **Amanhã é teaser**: só uma linha, sem detalhes. O foco é hoje.

---

## FASE 7 — PÓS-VIAGEM (viagem terminou)

**Usuário**: Voltou pra casa. Quer ver o que fez.
**Pergunta que o app responde**: "O que eu vivi?"

### Tela principal: Home pós-viagem

```
┌─────────────────────────────────────┐
│                                     │
│         🎉                          │
│    Viagem concluída!                │
│    Europa 2026                      │
│                                     │
│ ┌─ 📊 RESUMO ─────────────────────┐ │
│ │ 22 dias · 8 cidades · 5 países  │ │
│ │ 31 atrações · 12 restaurantes   │ │
│ │ R$ 12.430 total                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ 💰 GASTOS ─────────────────────┐ │
│ │ Orçamento: R$ 15.000            │ │
│ │ Gasto:     R$ 12.430 (83%)     │ │
│ │ Economia:  R$ 2.570             │ │
│ │                                 │ │
│ │ [Ver relatório completo →]      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ 🏆 MELHORES MOMENTOS ──────────┐ │
│ │ ⭐⭐⭐⭐⭐ Coliseu                 │ │
│ │ ⭐⭐⭐⭐⭐ Vaticano                │ │
│ │ ⭐⭐⭐⭐☆ Torre Eiffel            │ │
│ │                                 │ │
│ │ [Ver todas as memórias →]       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ 🗺️ MAPA DA VIAGEM ────────────┐ │
│ │ [mini mapa com rota completa]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ ✨ NOVA VIAGEM ────────────────┐ │
│ │ Pronto para a próxima?          │ │
│ │ [Planejar Japão 2027]           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## FASE 8 — REVIVAL (meses depois)

**Usuário**: Abriu o app de novo depois de meses. Quer matar saudade.
**Pergunta que o app responde**: "Lembra disso?"

### Decisões de produto
- **Viagens antigas são arquivadas**, não deletadas.
- Tela de "Viagens" lista todas (ativas + arquivadas).
- Toque em viagem arquivada → modo leitura (não edição).
- Fotos e memórias são o conteúdo principal de viagens arquivadas.

---

## FASE 9 — PRÓXIMA VIAGEM

**Usuário**: Já usou o app antes. Sabe como funciona.
**Pergunta que o app responde**: "Vamos de novo?"

### Fluxo
```
Home (viagem anterior arquivada)
  ↓
[Nova viagem]
  ↓
Wizard rápido (já sabe usar)
  ↓
OU
  ↓
"Copiar viagem anterior como template"
  ↓
Planejamento começa com estrutura pronta
```

### Decisões de produto
- **Template de viagem anterior**: "Use Europa 2026 como base".
- **Wizard mais curto**: usuário experiente não precisa de 5 passos.

---

## Estados da Aplicação ( matriz completa )

| Estado | O que o usuário vê |
|--------|-------------------|
| **0 viagens, 0 conta** | Tela de boas-vindas → wizard de criação |
| **0 viagens, logado** | "Crie sua primeira viagem" + template se já teve antes |
| **1+ viagens, pré-viagem** | Home pré-viagem (progresso, pendências, orçamento) |
| **1+ viagens, durante** | Home viagem (agenda do dia, gasto rápido, IA proativa) |
| **1+ viagens, pós** | Home pós-viagem (resumo, memórias, gastos) |
| **1+ viagens, arquivada** | Modo leitura. Sem edição. Foco em memórias. |
| **Sem internet** | Dados em cache. Indicador offline. Sincroniza quando voltar. |
| **Modo compartilhado** | Badge "Compartilhada com X". Indicação de quem editou. |
| **Erro de carregamento** | Banner com "Tente novamente". Não mostrar tela branca. |

---

## O que Muda na Arquitetura de Telas

A estrutura de abas que eu propus antes (Hoje, Viagem, Finanças, Tarefas, Mais) CONTINUA VÁLIDA — mas AGORA eu entendo que:

1. **Hoje** tem 3 variações: pré-viagem, durante, pós-viagem. Três UIs diferentes, mesma TabBar.
2. **Viagem** tem 2 variações: planejamento (editável) e arquivada (leitura).
3. **Primeira viagem** não usa TabBar — é um wizard full-screen.
4. **Onboarding** é funcional, não tutorial.

### Nova prioridade de implementação

| Ordem | Tela/Estado | Por que |
|-------|-----------|---------|
| 1 | **Wizard de criação** (FASE 3) | Sem isso, o app não funciona pra novos usuários |
| 2 | **Home pré-viagem** (FASE 5) | Estado mais comum após criar viagem |
| 3 | **Home durante viagem** (FASE 6) | O "modo execução" do app |
| 4 | Viagem (dashboard) | Só faz sentido com dados |
| 5 | Cidade (hub) | Só faz sentido com conteúdo |
| 6 | Dia (agenda) | Só faz sentido com atrações |
| 7 | Tarefas | Preenchido automaticamente pelo wizard |
| 8 | Finanças | Dashboard só com dados |
| 9 | Pós-viagem | Memórias, resumo |
| 10 | Mais/Docs/IA | Features auxiliares |
