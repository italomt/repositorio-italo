# PRODUCT POSITIONING & NAVIGATION

**Tipo**: Estratégia de produto
**Objetivo**: Definir o que torna este app único e como a navegação reflete isso, ANTES de implementar qualquer tela.

---

## PARTE 1 — Posicionamento

### As 10 perguntas

**1. Quem é seu usuário?**
Viajantes de lazer que querem planejar viagens com várias cidades, mas não querem perder horas montando planilhas. Não são mochileiros extremos nem viajantes corporativos. São pessoas que gostam de viajar bem, mas não têm tempo ou paciência para planejamento hiper-detalhado.

**2. Quem NÃO é seu usuário?**
- Viajantes corporativos (já têm TripIt, Concur)
- Mochileiros "sem roteiro" (não querem planejar nada)
- Grupos grandes que precisam de split de gastos complexo (Wanderlog é melhor)
- Pessoas que só fazem bate-volta

**3. Por que ele instalaria seu app?**
Porque alguém falou "esse app monta o roteiro sozinho". Ou porque viu um anúncio: "IA planeja sua viagem pela Europa em 2 minutos."

**4. Por que abandonaria o Wanderlog?**
Wanderlog é poderoso mas cansativo. Exige que você monte manualmente. É uma planilha turbinada. Nosso app faz o oposto: você responde perguntas simples e a IA monta.

**5. Qual é a principal promessa?**
**"Sua viagem inteira planejada em minutos, não horas."**

**6. Qual é a primeira sensação em 30 segundos?**
"Uau, ele já sabe o que eu quero fazer." O wizard conversacional pergunta 4-5 coisas e já mostra um roteiro pronto. Zero tela em branco.

**7. Qual funcionalidade gera o efeito "uau"?**
A IA monta o roteiro completo de 22 dias em segundos, com atrações, horários, distâncias a pé, e ainda avisa "o Coliseu precisa ser reservado com 60 dias de antecedência".

**8. Qual funcionalidade faz ele voltar amanhã?**
Durante o planejamento: a IA sugere coisas novas todo dia ("descobri um restaurante em Barcelona que combina com você"). Durante a viagem: a agenda do dia com dicas contextuais ("hoje o Museu do Prado é gratuito depois das 18h").

**9. Qual funcionalidade faz ele indicar para um amigo?**
Compartilhar o roteiro pronto com um link. O amigo abre e vê o roteiro completo, bonito, com fotos, mapa e orçamento.

**10. Em uma frase: por que este aplicativo existe?**
**Para que planejar uma viagem seja tão prazeroso quanto fazê-la.**

---

## PARTE 2 — Análise da Concorrência

### Filosofia de navegação de cada app

| App | Entidade principal | O que aparece primeiro | O que fica escondido |
|-----|-------------------|----------------------|---------------------|
| **Wanderlog** | Roteiro (timeline) | Lista de dias em ordem cronológica | Mapa (é uma aba separada) |
| **Tripsy** | Viagem (dashboard) | Cards de cidade com progresso visual | Timeline (precisa scrollar) |
| **Polarsteps** | Mapa | Mapa mundi com rota da viagem | Planejamento (foco é registro, não planejamento) |
| **TripIt** | Itinerário (lista) | Lista cronológica de reservas/eventos | Descoberta (não tem) |
| **Google Maps** | Mapa | Mapa + busca | Roteiro (não é app de viagem) |

### Padrão que emerge

Cada app ESCOLHE uma entidade principal e a coloca no centro. As outras funcionalidades orbitam em torno dela:

```
Wanderlog:        [TIMELINE] ← mapa, gastos, notas
Tripsy:           [DASHBOARD] ← timeline, checklists, budget
Polarsteps:       [MAPA] ← fotos, diário, timeline
TripIt:           [LISTA] ← documentos, mapa
```

**Nosso app atual**: [5 ABAS IGUAIS]. Nenhuma entidade é protagonista. Tudo tem o mesmo peso.

Isso é o oposto de como produtos maduros funcionam.

---

## PARTE 3 — Três Arquiteturas Radicalmente Diferentes

### Arquitetura A — MAP-FIRST ("Discovery")

```
Tela principal: MAPA em tela cheia
  ↓
Bottom sheet (arrastável):
  ├── Aba 1: Hoje (agenda do dia)
  ├── Aba 2: Viagem (resumo rápido)
  └── Aba 3: IA (conversa)
  
FAB: + (adicionar atração, gasto, nota)
```

**Como funciona**: O mapa É o app. A rota da viagem aparece desenhada. Toque numa cidade → expande mostrando dias e atrações. Toque numa atração → card com detalhes. A IA é acessível via FAB ou comando de voz.

**Trade-offs**:
- ✅ Natural para "durante a viagem". Sensação de exploração.
- ✅ Diferente de todos os concorrentes (Polarsteps chega perto, mas é focado em foto).
- ❌ Ruim para planejamento detalhado pré-viagem.
- ❌ Difícil mostrar dados financeiros e tarefas de forma natural.
- ❌ Requer Google Maps sempre carregado (performance, custo de API).

---

### Arquitetura B — CONVERSATIONAL ("AI-First")

```
Tela principal: CHAT com IA
  ↓
Histórico de conversa:
  "Bom dia, Italo! Hoje você está em Madrid."
  "Sua primeira atração é o Museu do Prado às 9h."
  "Quer ver o mapa? Quer adicionar um gasto?"
  
  [input: "quanto gastei hoje?"]
  [resposta: "R$ 155 até agora. Almoço R$ 93, Museu R$ 62."]
  
Navegação secundária (acessível via menu):
  ├── Roteiro (timeline tradicional)
  ├── Mapa
  └── Perfil
```

**Como funciona**: Tudo começa com uma conversa. A IA é proativa e reativa. Você pode pedir qualquer coisa em linguagem natural. Cards e telas tradicionais são gerados sob demanda, não são o ponto de partida.

**Trade-offs**:
- ✅ MÁXIMO diferencial competitivo. Nenhum concorrente faz isso bem.
- ✅ Natural para novos usuários (não precisam aprender o app).
- ✅ Escala infinitamente (novas features = novos comandos).
- ❌ Usuários avançados podem achar lento ("só quero ver a lista").
- ❌ IA precisa ser MUITO boa. Se errar, a experiência quebra.
- ❌ Difícil de projetar (não tem "telas fixas").

---

### Arquitetura C — CONTEXT-AWARE ("Phase-Adaptive")

```
A navegação MUDA conforme a fase da viagem:

PRÉ-VIAGEM (planejando):
  TabBar: [🏠 Dashboard] [🗺️ Mapa] [🤖 IA]
  Home = Progresso + Pendências + Orçamento

DURANTE A VIAGEM (executando):
  TabBar: [📅 Hoje] [🗺️ Mapa] [➕ Adicionar]
  Home = Agenda do dia + Próximo + Gasto rápido

PÓS-VIAGEM (revivendo):
  TabBar: [📊 Resumo] [🗺️ Mapa] [📸 Memórias]
  Home = Estatísticas + Melhores momentos + Compartilhar
```

**Como funciona**: O app sabe em qual fase você está e adapta a interface. A TabBar é dinâmica — muda de ícones e funções conforme o contexto. A IA está sempre presente como assistente (não como aba), aparecendo com sugestões contextuais.

**Trade-offs**:
- ✅ Melhor experiência em CADA fase. Nada de funcionalidade fora de contexto.
- ✅ TabBar enxuta (3 itens sempre, nunca 5).
- ✅ Parece "inteligente" — o app se adapta a você.
- ❌ Mais complexo de construir (3 UIs diferentes).
- ❌ Usuário pode estranhar a mudança ("cadê a aba que estava aqui ontem?").
- ❌ Transições entre fases precisam ser suaves (animação, onboarding sutil).

---

### Arquitetura D — TRIP-CENTRIC ("The One Screen")

```
Tela ÚNICA: A VIAGEM
  ↓
Scroll vertical infinito:
  ├── Cabeçalho: nome, datas, progresso
  ├── Cards de cidades (expansíveis)
  │     └── Abre revelando dias e atrações
  ├── Seção: Pendências
  ├── Seção: Gastos (gráfico mini)
  ├── Seção: Mapa (miniatura, expande ao tocar)
  └── Seção: Documentos

Bottom bar: [➕ Adicionar] [🤖 IA] [👤 Perfil]
```

**Como funciona**: Uma única tela com scroll contém TUDO sobre a viagem. Cada cidade é um card expansível. Toque para expandir e ver os dias. Toque num dia para ver a timeline. Sem push navigation — tudo é inline, como o Notion.

**Trade-offs**:
- ✅ Simplicidade máxima. Uma tela, um scroll.
- ✅ Perfeito para mobile (scroll natural).
- ✅ Fácil de construir e manter.
- ❌ Pode ficar gigante com viagens longas (22 dias = muito scroll).
- ❌ Navegação entre cidades distantes requer muito scroll.
- ❌ Difícil de mostrar informações densas (finanças, tarefas).

---

## PARTE 4 — Recomendação

### Minha escolha: **C (Context-Aware)** com elementos de **B (Conversational)**

**Por que não A (Map-First)**: Google Maps é caro em chamadas de API e o app seria muito dependente de conexão. Mapas são ótimos DURANTE a viagem, mas não antes.

**Por que não B puro (AI-First)**: A tecnologia de IA ainda não é confiável o suficiente para ser a ÚNICA interface. Um erro da IA deixa o usuário perdido.

**Por que não D (One Screen)**: Com 22 dias e 8 cidades, o scroll seria impraticável. Funcionaria para viagens de 3-4 dias.

**Por que C + B**:
- A adaptação por fase resolve o problema de "funcionalidades irrelevantes no momento errado"
- Elementos de IA conversacional (sugestões proativas, comando de voz, chat) tornam o app único
- A estrutura de dados que já construímos (viagens → cidades → dias) suporta naturalmente o modelo por fase
- A implementação pode ser incremental: começa com fase pré-viagem, depois adiciona durante, depois pós

### Como seria a navegação final

```
QUALQUER FASE:
  ┌─────────────────────────────────────┐
  │ 🤖 Assistente IA (sempre acessível) │  ← ícone no canto superior
  └─────────────────────────────────────┘

FASE PRÉ-VIAGEM:
  TabBar: [📋 Progresso] [🗺️ Roteiro] [⚙️ Mais]
  
FASE DURANTE VIAGEM:  
  TabBar: [📅 Hoje] [🗺️ Roteiro] [➕]
  
FASE PÓS-VIAGEM:
  TabBar: [📊 Resumo] [📸 Memórias] [⚙️ Mais]
```

**3 abas sempre. Nunca 5.** O que mudou:

- **Progresso** (pré) / **Hoje** (durante) / **Resumo** (pós) = mesma posição na TabBar, ícone e função diferentes
- **Roteiro** = mapa + cidades + dias (sempre presente, consolida as antigas Viagem + Cidade + Dia)
- **+** (durante) = adicionar gasto, atração, nota (ação rápida)
- **Mais** (pré/pós) = tarefas, documentos, configurações

---

## PARTE 5 — O Que Isso Muda na Implementação

| Antes (5 abas fixas) | Depois (3 abas por fase) |
|---------------------|-------------------------|
| Home fixa | Home adaptável (Progresso / Hoje / Resumo) |
| Viagem (lista) | Roteiro (mapa + cidades, sempre presente) |
| Finanças (lista) | Absorvido em Progresso e Resumo |
| Pendências (lista) | Absorvido em Progresso |
| Mais (misc) | Reduzido a tarefas + docs + config |

**Ganho**: De 5 abas estáticas para 3 abas dinâmicas. Cada tela tem UMA responsabilidade clara por fase.

### O que implementar primeiro

1. **Wizard conversacional** (FASE 3 do lifecycle) — entrada de novos usuários
2. **Home pré-viagem** (Progresso) — estado mais comum após criar viagem
3. **Roteiro** (mapa + cidades + dias) — a "Viagem" repensada
4. **IA assistente** — sugestões proativas em todas as telas
5. **Home durante viagem** (Hoje) — agenda + ações rápidas
6. **Home pós-viagem** (Resumo) — memórias + stats
