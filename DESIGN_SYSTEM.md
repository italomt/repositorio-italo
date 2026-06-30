# DESIGN SYSTEM — Europa Trip App

**Tipo**: Documento de produto (não de código)
**Objetivo**: Garantir consistência visual e de experiência em toda evolução futura do app.
**Regra**: Toda nova funcionalidade deve seguir este documento. Se não se encaixar, o design system evolui primeiro — nunca se cria exceção.

---

## 1. Navegação

### TabBar (5 abas fixas)
```
🏠 Hoje      🗺️ Viagem    💰 Finanças    ✅ Tarefas    ⚙️ Mais
```

- **Hoje**: Agenda do dia + contexto imediato
- **Viagem**: Dashboard da viagem + cidades
- **Finanças**: Dashboard financeiro
- **Tarefas**: Pendências + acomodações/transportes faltando
- **Mais**: Documentos, IA/Explorar, Configurações, Sobre

### Push navigation
- CidadeDetail e DayDetail são acessadas por push a partir de Viagem
- NUNCA acessar CidadeDetail diretamente da TabBar
- Swipe entre dias DENTRO da CidadeDetail, não como telas separadas

### Back navigation
- Sempre `< Back` no canto superior esquerdo
- NUNCA usar `X` para voltar (X = fechar/cancelar, não navegar)

---

## 2. Componentes e quando usar cada um

### Modal (tela cheia, bottom sheet)
- **Usar para**: Criar ou editar qualquer item. Ocupa 90% da tela no mobile.
- **NÃO usar para**: Confirmar exclusão (use Dialog). Mostrar detalhes (use Push).
- **Sempre ter**: Título no topo, botão X ou Cancelar, botão Salvar no footer.

### Dialog (centralizado, pequeno)
- **Usar para**: Confirmar ações destrutivas (excluir, cancelar reserva).
- **NÃO usar para**: Formulários. Informações.
- **Sempre ter**: Título, descrição, Cancelar + Confirmar.

### Card
- **Usar para**: Agrupar itens relacionados em lista. Dashboard de métricas.
- **NÃO usar para**: Cards dentro de cards. Seção única (use div simples).
- **Sempre ter**: `rounded-ios-lg`, `shadow-ios`, `bg-card`.

### Chip/Pill (botão arredondado pequeno)
- **Usar para**: Filtros, tags, seleção de categoria rápida.
- **NÃO usar para**: Ações primárias. Navegação.

### Banner inline
- **Usar para**: Sugestões da IA, alertas não-críticos, dicas contextuais.
- **NÃO usar para**: Erros que bloqueiam ação (use Dialog). Feedback de sucesso (use Toast).

### Toast
- **Usar para**: Confirmação de ação ("Gasto adicionado"). Feedback rápido.
- **NÃO usar para**: Erros persistentes. Informações que o usuário precisa ler.
- **Duração**: 3 segundos. Com ação: 6 segundos.

### Badge
- **Usar para**: Contadores (TabBar), estados (pendente, concluído).
- **NÃO usar para**: Títulos ou labels.

### Skeleton
- **Usar para**: Primeira carga de qualquer lista ou dashboard.
- **NÃO usar para**: Pull-to-refresh (use indicador nativo).

---

## 3. Formulários

### Regra universal

TODO formulário de criação/edição segue esta estrutura:

```
┌──────────────────────────────────┐
│ [Cancelar]     TÍTULO            │  ← Header fixo
├──────────────────────────────────┤
│                                  │
│ Nome                             │  ← Label padrão
│ [________________________]       │  ← Input padrão
│                                  │
│ Vinculado a                      │  ← ContextPicker
│ [Viagem] [Cidade] [Dia]          │
│                                  │
│ Categoria                        │  ← CategorySelector
│ [Museu] [Gastronomia]            │
│                                  │
│ Valor                            │  ← CurrencyInput
│ [____] [EUR ▾]                   │
│                                  │
│ Data                             │  ← DatePicker
│ [____]                           │
│                                  │
├──────────────────────────────────┤
│ [Cancelar]      [Salvar]         │  ← Footer fixo
└──────────────────────────────────┘
```

### O que NUNCA fazer em formulários
- ❌ Campos sem label
- ❌ Placeholder como substituto de label
- ❌ Botão Salvar sem Cancelar visível
- ❌ Formulário sem validação visual (borda vermelha + mensagem)
- ❌ Fechar modal sem confirmar se há dados não salvos
- ❌ Usar `alert()` para erros

### Validação
- Feedback visual IMEDIATO (borda do input fica vermelha)
- Mensagem de erro abaixo do campo
- Botão Salvar desabilitado enquanto houver erro
- NUNCA permitir submit com campos obrigatórios vazios

---

## 4. Tipografia

```
Display (títulos):     Nunito, 700, tracking: -0.02em
Body (texto):          Inter, 400
Body (médio):          Inter, 500
Body (semibold):       Inter, 600
Tabular (números):     Inter, tabular-nums
```

### Escala
```
34px → Título da tela (font-display, bold)
20px → Título de card/seção
17px → Corpo principal
15px → Corpo secundário, inputs, botões
14px → Labels de métrica
13px → Texto de apoio
12px → Labels de formulário (uppercase, tracking-wide)
11px → Microcopy, badges
10px → Notas de rodapé
```

### Regras
- Títulos NUNCA centralizados (sempre alinhados à esquerda)
- Máximo 2 fontes na tela (display + body)
- Labels de formulário SEMPRE uppercase + tracking-wide
- Números financeiros SEMPRE tabular-nums
- Nunca usar mais de 3 níveis de hierarquia na mesma tela

---

## 5. Cores

```
bg:       #F6F4F0  (fundo da página)
card:     #FFFFFF  (fundos de card)
text:     #2C2C2E  (texto principal)
muted:    #6B6860  (texto secundário)
muted2:   #8C8980  (placeholders)
separator:#rgba(44,44,46,0.1)
fill:     #rgba(44,44,46,0.06)

blue:     #5B7FFF  (ações primárias, navegação ativa)
green:    #6BA368  (sucesso, concluído, confirmado)
orange:   #E8894A  (aviso, pendente, atenção)
red:      #D4685A  (erro, exclusão, urgente)
purple:   #8B7EC8  (cultura)
teal:     #50A5A0  (transporte)
yellow:   #D4A843  (gastos/dinheiro)
```

### Onde usar cada cor de destaque

| Cor | Significado | Uso |
|-----|------------|-----|
| Blue | Ação, confiança | Botões primários, links, TabBar ativa, indicador de progresso |
| Green | Sucesso, concluído | Checkmarks, badges "Concluído", status "Visitada" |
| Orange | Atenção, pendente | Badges "Pendente", alertas não-críticos, ícones de warning |
| Red | Erro, urgente | Exclusão, erros de validação, badge "Alta prioridade" |
| Purple | Cultura, museus | Categoria cultura, ícones de arte |
| Teal | Transporte | Ícones de transporte, badge "Em trânsito" |
| Yellow | Financeiro | Ícones de dinheiro, badge "Previsto" |

### Regras
- NUNCA usar gradiente em texto
- NUNCA usar mais de 1 cor de destaque por elemento
- Fundo SEMPRE `bg` ou `card`, nunca colorido
- Texto SEMPRE `text` ou `muted`, nunca colorido exceto links
- Bordas NUNCA coloridas (apenas `separator`)

---

## 6. Ícones (Lucide)

### Mapeamento fixo

| Entidade | Ícone |
|----------|-------|
| Viagem | `Luggage` |
| Cidade | `Building2` |
| Dia | `Calendar` |
| Atração | `MapPin` |
| Restaurante | `UtensilsCrossed` |
| Gasto | `Wallet` |
| Hospedagem | `Bed` |
| Transporte (avião) | `Plane` |
| Transporte (trem) | `Train` |
| Transporte (ônibus) | `Bus` |
| Transporte (carro) | `Car` |
| Pendência | `ClipboardList` |
| Documento | `FileText` |
| IA | `Sparkles` |
| Adicionar | `Plus` |
| Configurações | `Settings` |

### Regras
- NUNCA usar emoji como ícone funcional
- Emoji permitido APENAS para bandeiras de país
- Ícones de TabBar: 24px, cor: `muted` (inativo) / `blue` (ativo)
- Ícones em cards: 20px, cor contextual

---

## 7. Estados de itens

### Pendências

| Estado | Visual | Ícone |
|--------|--------|-------|
| `aberta` | Texto normal, badge laranja "Pendente" | `Circle` |
| `em_andamento` | Texto normal, badge azul "Em andamento" | `CircleDot` |
| `concluida` | Texto riscado, badge verde "Concluída" | `CheckCircle2` |
| `cancelada` | Texto opaco, badge cinza "Cancelada" | `XCircle` |

### Atrações

| Estado | Visual |
|--------|--------|
| `planejada` | Sem badge |
| `reservada` | Badge verde "Reservada" |
| `visitada` | Check verde no card + opacidade reduzida |
| `cancelada` | Riscado + opacidade 50% |

### Gastos

| Estado | Visual |
|--------|--------|
| `previsto` | Badge amarelo "Previsto" |
| `pago` | Sem badge |

### Hospedagens

| Estado | Visual |
|--------|--------|
| `reservada` | Badge azul "Reservada" |
| `check-in` | Badge verde "Check-in" |
| `check-out` | Badge muted "Check-out" |
| `cancelada` | Riscado + opacidade 50% |

---

## 8. Espaçamento

```
Entre seções:   space-y-5 (20px)
Entre cards:    gap-3 (12px)
Padding card:   p-4 (16px)
Padding tela:   px-4 (16px horizontal)
Padding modal:  p-5 (20px)
Gap formulário: space-y-3 (12px entre campos)
```

### Regras
- NUNCA usar `space-y-4` como fallback genérico — cada contexto tem seu espaçamento
- Seções sempre começam com `pt-6` e terminam com `pb-6`
- Nunca usar margem negativa para compensar padding

---

## 9. Microinterações

### Transições
- Navegação entre telas: `fade + slide (y: 12px)`, 180ms ease-out
- Modal abrindo: slide de baixo, 320ms
- Toast: fade-in + slide-down, 200ms
- Checkbox (pendência/atração): scale + rotate, 200ms
- Pull-to-refresh: indicador nativo do iOS

### Feedback tátil
- `tap-scale`: scale(0.96) no `:active`, 150ms, ease-ios
- Todos os botões clicáveis DEVEM ter `tap-scale`

### Regras
- NUNCA animar `width`, `height`, `top`, `left` (use `transform`)
- NUNCA usar bounce/elastic/spring (use ease-ios: `cubic-bezier(0.25, 0.1, 0.25, 1)`)
- `prefers-reduced-motion` SEMPRE respeitado (animações → instantâneas)

---

## 10. Tom de voz (UX Writing)

### Princípios
1. **Português brasileiro natural** — não traduzir literal do inglês
2. **Conciso** — menos palavras, mais clareza
3. **Contextual** — a mensagem sempre sugere o próximo passo
4. **Humano** — não parece que um robô escreveu

### Exemplos por contexto

**Empty states:**
- ❌ "Nenhum item encontrado"
- ✅ "Nenhuma atração em Lisboa ainda. Que tal começar?"

**Erros:**
- ❌ "Erro 500: Internal Server Error"
- ✅ "Algo deu errado. Tente novamente."

**Confirmação destrutiva:**
- ❌ "Deseja realmente excluir este item?"
- ✅ "Excluir Torre Eiffel? Esta ação não pode ser desfeita."

**Sucesso:**
- ❌ "Operação realizada com sucesso"
- ✅ "Atração adicionada" (toast, 3s)

**IA proativa:**
- ❌ "Sugestão: adicione atração X ao dia Y"
- ✅ "Seu dia 15 em Lisboa tem a tarde livre. Que tal visitar o Bairro Alto?"

---

## 11. Regras de ouro (nunca quebrar)

1. **Toda tela responde UMA pergunta**. Se responde duas, divida em duas telas.
2. **Formulário sempre tem Cancelar + Salvar**. Nunca só um deles.
3. **Nunca usar `alert()` ou `confirm()`**. Use Toast, Dialog, ou Banner.
4. **Placeholder NUNCA substitui label**.
5. **Cor NUNCA é o único indicador de estado** (use ícone + texto também).
6. **Nunca scroll horizontal para conteúdo principal** (só para chips/filtros).
7. **Nunca esconder informação atrás de hover** (mobile-first).
8. **Sempre mostrar estado de loading** (skeleton, nunca tela branca).
9. **Nunca usar `position: absolute` para layout** (só overlays/modais).
10. **Sempre ter skip-link para acessibilidade** (`<a href="#main">`).
