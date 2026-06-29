# Relatório de Auditoria — Europa Trip App

**Data**: 29/06/2026
**Escopo**: Todas as telas, componentes, formulários, navegação, regras de negócio e schema do banco.
**Objetivo**: Consolidar a base antes de novas funcionalidades.

---

## 1. Bugs Encontrados

| ID | Descrição | Local | Severidade |
|----|-----------|-------|------------|
| **B1** | Navegação "Resolver pendência" do AtracaoEditor vai para `/viagem` mas ViagemView não tem handler de `abrirPendenciaId` — o estado se perde. | `AtracaoEditor.jsx:82` → `ViagemView.jsx` | Alta |
| **B2** | PendenciaEditor não permite editar **categoria** nem **contexto**. Se o usuário criou pendência com contexto errado, não consegue corrigir. | `PendenciaEditor.jsx` | Média |
| **B3** | PendenciaAdder mostra só 3 contextos (viagem, cidade, dia) mas o schema suporta 6 (viagem, cidade, dia, atracao, hospedagem, transporte). Opções faltando. | `PendenciaAdder.jsx:12-16` | Média |
| **B4** | Contador de pendências em PendenciasView soma `cidadesSemAcomodacao.length + transiçõesSemTransporte.length` como se fossem pendências — são entidades diferentes. | `PendenciasView.jsx:153` | Baixa |
| **B5** | Transporte não pode ser excluído. TransportEditor não tem botão de deletar. | `TransportEditor.jsx` | Média |
| **B6** | Acomodação não pode ser excluída pelo editor (hook `useAcomodacoes.remover` existe mas nunca é chamado). | `AcomodacaoEditor.jsx` | Baixa |
| **B7** | Tab de Documentos no CidadeDetail é só leitura — não tem botão de adicionar documento. Usuário precisa ir até Mais → Documentos. | `CidadeDetailView.jsx:513-536` | Média |
| **B8** | UploadModal e AddLinkModal no MaisView não usam o componente `<Modal>` — criam seu próprio overlay, com bordas e animações diferentes. | `MaisView.jsx:49,110` | Baixa |
| **B9** | Schema seed tem datas de 2025, mas a migration corrige para 2026. Se o seed for re-executado, sobrescreve com 2025. | `schema_and_seed.sql:126-148` | Baixa |
| **B10** | `useGastos` filtra por `created_by` do usuário logado. Na Finanças, só mostra gastos do próprio usuário. Contador de gastos na ViagemView usa `useGastos()` sem filtrar. | `useGastos.js:11-12` vs `ViagemView.jsx:29` | Média |

---

## 2. Fluxos Quebrados ou Incompletos

### F1 — Navegação Atracao → Pendencia não resolve

**Caminho do bug:**
1. Usuário está no DayDetail, abre AtracaoEditor
2. AtracaoEditor mostra banner "Resolver pendência de reserva"
3. Usuário clica → `navigate('/viagem', { state: { abrirPendenciaId } })` (linha 82)
4. ViagemView **não tem** `useEffect` para `location.state.abrirPendenciaId`
5. Só PendenciasView tem esse handler (linha 45-52)

**Solução:** Mover o handler para `/pendencias` ou fazer ViagemView também abrir o PendenciaEditor.

---

### F2 — Transporte sem exclusão

TransportEditor permite criar mas não excluir. O hook `useDestinos` não expõe função de remover transporte. Uma vez criado, transporte só pode ser alterado manualmente no banco.

---

### F3 — Datas no CidadeAutocomplete inconsistentes

O autocomplete de cidade no DayAdder e DayEditor preenche cidade + país + flag automaticamente. Mas o campo de país não é editável depois de preenchido.

---

### F4 — QuickAdd: IA falha → fallback manual não tem geocodificação automática

Quando a análise de IA falha (`erroIA`), o QuickAdd abre AtracaoForm com dados manuais, mas o texto digitado pelo usuário não é geocodificado antes (diferente do fluxo `handleModoManual` que tenta geocodificar). O componente AtracaoForm precisa receber latitude/longitude pré-calculadas.

---

### F5 — Adicionar atração via QuickAdd ou PreencherDia não dispara pendência de acomodação

Se a cidade do dia selecionado não tem acomodação, o sistema não avisa nem sugere criar uma.

---

## 3. Componentes Duplicados

### D1 — AtracaoForm vs AtracaoEditor (70% de overlap)

Ambos renderizam: nome, seletor de dia (lista ranqueada), categoria, custo com moeda, horário, checkbox "precisa reserva", checkbox "Dia inteiro".

**Diferenças:**
- AtracaoForm: EnderecoAutocomplete, usado dentro do QuickAdd
- AtracaoEditor: foto URL, notas, exclusão, banner de pendência

**Ação:** Unificar em um único `AtracaoFormSection` com props condicionais.

---

### D2 — PendenciaAdder vs PendenciaEditor (60% overlap)

Ambos têm: título, data limite, link, urgência.

**Diferenças:**
- PendenciaAdder: categoria + contexto (viagem/cidade/dia)
- PendenciaEditor: exclusão com dois passos

---

### D3 — GastoForm vs GastoRapido (50% overlap)

GastoForm: IA + câmera + conversão BRL + seletor de dia + data
GastoRapido: descrição + valor + moeda + categoria, usado no Hoje

Campos descrição/valor/moeda/categoria são idênticos mas duplicados.

---

### D4 — UploadModal e AddLinkModal inline no MaisView

Definidos dentro de `MaisView.jsx` (linhas 34-93 e 95-136), não reutilizáveis. Deveriam ser componentes exportados ou unificados com `<Modal>`.

---

### D5 — TransportEditor duplicado em ViagemView e PendenciasView

A lógica `handleSalvarTransporte` está copiada em `ViagemView.jsx:45-53` e `PendenciasView.jsx:100-108`. Deveria estar no hook `useDestinos` ou em um hook específico `useTransportes`.

---

## 4. Inconsistências Visuais e de UX

### 4.1 — Layout dos botões de ação dos formulários

| Componente | Cancelar | Salvar | Excluir |
|------------|----------|--------|---------|
| AtracaoForm | Sim (side-by-side) | "Salvar" | Não |
| AtracaoEditor | Não (só X modal) | "Salvar alterações" (full width) | Sim (2 passos) |
| GastoForm | Sim (fase 1) / Não (fase 2) | "Salvar gasto" / "Salvar alterações" | Sim (2 passos, só edição) |
| GastoRapido | Não (só X modal) | "Salvar gasto" (full width) | Não |
| PendenciaAdder | Não (só X modal) | "Adicionar pendência" (full width) | Não |
| PendenciaEditor | Não (só X modal) | "Salvar alterações" (full width) | Sim (2 passos) |
| AcomodacaoEditor | Sim (side-by-side) | "Salvar" | Não |
| TransportEditor | Sim (side-by-side) | "Adicionar transporte" | Não |
| DayAdder | Não (só X modal) | "Adicionar dia" (full width) | Não |
| DayEditor | Não (só X modal) | "Salvar alterações" (full width) | Não |
| UploadModal | Não | "Enviar" | Não |
| AddLinkModal | Não | "Adicionar" | Não |

**Problema:** Sem padrão. Alguns têm Cancel, outros não. Alguns têm Save full-width, outros side-by-side. Texto do botão varia entre "Salvar", "Salvar alterações", "Adicionar X".

---

### 4.2 — Títulos dos modais

| Formulário | Título (criação) | Título (edição) |
|------------|-------------------|------------------|
| Atracao | "Adicionar com IA" / "Adicionar atração" | "Editar atração" |
| Gasto | "Novo gasto" | "Editar gasto" |
| Pendencia | "Nova pendência" | "Editar pendência" |
| Acomodacao | "Nova acomodação" | "Editar acomodação" |
| Transporte | — | "Transporte {origem} → {destino}" |
| Dia | "Adicionar dia ao roteiro" | "Editar dia {data}" |
| Documento | "Adicionar documento" / "Adicionar link" | — |

**Problema:** Pattern "Novo/Nova X" vs "Adicionar X" vs descritivo. Sem consistência.

---

### 4.3 — Nomes de campos para a mesma semântica

| Conceito | Atrações | Gastos | Pendências | Acomodações | Transporte |
|----------|----------|--------|------------|-------------|------------|
| Identificador | "Nome" | "Descrição" | "Título" | "Nome" | — |
| Valor monetário | "Custo estimado" | "Valor" | — | — | "Custo estimado (R$)" |
| Link externo | "link_reserva" (implícito) | — | "Link" | "Link da reserva" | "Link da reserva" |
| Observações | "Notas" | — | — | "Notas" | "Notas" |
| Data | "Horário previsto" | "Data do gasto" | "Data limite" | — | — |

---

### 4.4 — UploadModal e AddLinkModal não usam `<Modal>`

Criam manualmente `fixed inset-0 z-50 bg-black/40` com `rounded-t-2xl` em vez de `rounded-t-ios-xl`. Faltam o drag handle superior e o botão X padronizado que o `<Modal>` tem.

---

### 4.5 — Espaçamento de conteúdo nos formulários

Todos usam `space-y-3` internamente (bom), mas os wrappers externos variam:
- Alguns usam `pt-6 pb-6` (AtracaoForm, PendenciaAdder)
- Outros não têm padding (transporte, dayadder)

---

### 4.6 — Labels de campos

A maioria usa o padrão `text-[12px] text-muted font-semibold uppercase tracking-wide` (correto), mas UploadModal e AddLinkModal usam `text-muted2` e sem uppercase/tracking.

---

## 5. Inconsistências de Regras de Negócio

### 5.1 — Sistema de contexto fragmentado (PROBLEMA CENTRAL)

O schema define 6 tipos de contexto (`contexto_tipo`: viagem, cidade, dia, atracao, hospedagem, transporte), mas **cada entidade implementa vinculação de forma diferente:**

| Entidade | Como vincula | Suporta contexto unificado? |
|----------|-------------|------------------------------|
| **Pendencias** | `contexto_tipo` + `contexto_id` (TEXT) | Sim (parcial — UI só mostra 3 dos 6 tipos) |
| **Documentos** | `contexto_tipo` + `contexto_id` (TEXT) | Sim (parcial — UI só mostra viagem ou cidade) |
| **Gastos** | `destino_id` (UUID, FK para destinos) | **Não** — só linka a dia |
| **Atracoes** | `destino_id` (UUID, FK para destinos) | **Não** — só linka a dia |
| **Acomodacoes** | `cidade` (TEXT, sem FK) | **Não** — só linka a cidade por string |
| **Transportes** | `destino_origem_id` + `destino_destino_id` | **Não** — linka a pares de dias |

**Consequências:**
- Um gasto não pode ser vinculado diretamente à cidade ("alimentação em Paris, qualquer dia") — só a um dia específico ou null (pré-viagem)
- Uma atração não sabe a qual cidade pertence sem JOIN com destinos
- Acomodações usam string "cidade" em vez de FK, então se renomear a cidade nos destinos, a acomodação fica órfã
- Cada hook carrega seus dados com join diferente, não há padrão de eager loading

---

### 5.2 — Moeda inconsistente por entidade

| Entidade | Campo de valor | Moeda |
|----------|---------------|-------|
| Atracoes | `custo_estimado_eur` | Hardcoded EUR no nome da coluna |
| Gastos | `valor_original` + `moeda_original` | Flexível (EUR, USD, CHF, BRL, GBP) |
| Transportes | `custo_estimado_brl` | Hardcoded BRL no nome da coluna |
| Acomodacoes | `preco_noite` + `moeda` | Flexível (schema tem campo `moeda`) |

---

### 5.3 — Pendencias e Acomodações são entidades separadas mas tratadas juntas na UI

PendenciasView renderiza 3 tipos de "card" na mesma lista:
1. PendenciaItem (tabela pendencias)
2. Cidades sem acomodação (tabela acomodacoes — via cidadesSemAcomodacao)
3. Transportes pendentes (tabela transportes — via todasTransicoes)

O contador "X ainda não resolvidas" soma os 3 tipos, mas são entidades/tabelas diferentes com hooks diferentes.

---

### 5.4 — `ocupa_dia_inteiro` só existe em atracoes

Uma viagem de trem de 8h ou um tour guiado de dia inteiro também bloqueia o dia, mas transportes não tem esse campo.

---

### 5.5 — Upsert de acomodação impede múltiplas hospedagens na mesma cidade

O índice único `idx_acomodacoes_cidade ON acomodacoes(cidade)` + upsert por cidade significa que só pode existir UMA acomodação por cidade. Se o usuário ficar 5 dias em Paris com 2 hotéis diferentes, só consegue cadastrar 1.

---

### 5.6 — `contexto_id` é TEXT, não UUID

No schema de pendencias e documentos, `contexto_id` é `TEXT`. Para contexto 'viagem', armazena a string literal `'viagem'`. Para 'cidade', armazena o nome da cidade (string). Para 'dia', armazena o UUID do destino. Isso é frágil — se uma cidade mudar de nome, as pendências vinculadas quebram.

---

### 5.7 — Validação de dia bloqueado (diaCheio) inconsistente

No AtracaoForm (linha 91), dias bloqueados são desabilitados (`disabled={diaCheio}`) mas ainda mostrados. No AtracaoEditor (linha 113), dias bloqueados são clicáveis com badge "dia cheio" — ou seja, você pode mover uma atração para um dia cheio no editor, mas não pode criar uma nova atração lá.

---

### 5.8 — Gastos filtrados por usuário vs totais globais

`useGastos(usuarioId)` filtra por `created_by` do usuário logado. Isso significa:
- FinancasView: mostra só os gastos DO usuário
- HojeView: `useGastos(usuario?.id)` — também filtrado
- ViagemView: `useGastos()` — sem userId, NÃO filtra

Resultado: mesmos dados aparecem com totais diferentes em páginas diferentes.

---

## 6. Sugestões de Padronização

### 6.1 — Arquitetura de contexto unificada (MIGRAÇÃO DE SCHEMA)

Criar colunas `contexto_tipo` e `contexto_id` em TODAS as tabelas:

| Tabela | Migração necessária |
|--------|---------------------|
| `gastos` | Adicionar `contexto_tipo` + `contexto_id`. Migrar: `destino_id` → `contexto_tipo='dia', contexto_id=destino_id` |
| `atracoes` | Adicionar `contexto_tipo` (default 'dia') + `contexto_id`. Migrar: `destino_id` → `contexto_id=destino_id` |
| `acomodacoes` | Adicionar `contexto_tipo` (default 'cidade') + `contexto_id` (usar FK para destinos via cidade) |
| `transportes` | Adicionar `contexto_tipo` (default 'transporte') + `contexto_id` |

Criar índice composto: `(contexto_tipo, contexto_id)` em cada tabela.

**Componente UI:** Criar `<ContextSelector>` único reutilizado em todos os formulários, com os 6 tipos.

---

### 6.2 — Componentes de formulário padronizados

Criar os componentes base:

| Componente | Props | Substitui |
|------------|-------|-----------|
| `<FormField>` | `label`, `hint`, `error`, `required`, `children` | Todos os `<div><label>...<input/></div>` |
| `<FormFooter>` | `onCancel`, `onSave`, `saveLabel`, `saving`, `mode` | Todos os botões Cancel/Save |
| `<DeleteSection>` | `onDelete`, `itemName`, `itemType` | Todos os "Excluir X" com confirmação |
| `<ContextSelector>` | `value`, `onChange`, `contextoId`, `onContextoIdChange`, `cidades`, `dias` | Contexto em PendenciaAdder e Documentos |

---

### 6.3 — Unificar formulários duplicados

| Formulário unificado | Substitui | Props de controle |
|----------------------|-----------|-------------------|
| `AtracaoFormUnificado` | AtracaoForm + AtracaoEditor | `mode="create"\|"edit"`, `showEndereco`, `showFoto`, `onDelete` |
| `GastoFormUnificado` | GastoForm + GastoRapido | `mode="create"\|"edit"\|"quick"`, `compact` |
| `PendenciaFormUnificado` | PendenciaAdder + PendenciaEditor | `mode="create"\|"edit"`, `showContexto`, `showCategoria` |
| `DocumentUploadModal` (extrair do MaisView) | UploadModal + AddLinkModal inline | Usar `<Modal>` como wrapper |

---

### 6.4 — Padrão de formulário

Todo formulário deve seguir:

```
<Modal titulo="{Ação} {entidade}">
  <div className="space-y-4">
    <FormField label="Nome">...</FormField>
    <FormField label="Categoria">...</FormField>
    <ContextSelector ... />
    ... campos específicos ...
    
    <FormFooter onCancel={onClose} onSave={handleSalvar} saveLabel="Salvar" />
    <DeleteSection ... />  {/* só em modo edição */}
  </div>
</Modal>
```

---

### 6.5 — Padrão de nomes de campos

| Semântica | Nome do campo | Label |
|-----------|--------------|-------|
| Identificador principal | `nome` | "Nome" |
| Descrição longa | `notas` | "Notas" |
| Valor monetário | `valor` + `moeda` | "Valor" |
| Data/hora | `data` / `horario` | "Data" / "Horário" |
| Categoria | `categoria` | "Categoria" |
| Contexto | `contexto_tipo` + `contexto_id` | "Vinculado a" |
| Link externo | `link` | "Link" |
| Urgência | `urgencia` | "Urgência" |

---

### 6.6 — Padrão de hooks

Todos os hooks devem seguir a mesma assinatura:

```js
const { items, loading, erro, criar, atualizar, remover, recarregar } = useEntidade(filtros)
```

Hook `useGastos` é o único que exige `usuarioId` como parâmetro. Padronizar: carregar todos e filtrar no componente, ou fazer o filtro ser opcional com fallback para todos.

---

## 7. Plano de Refatoração

### Fase 1 — Correção de bugs críticos (1-2 dias)

| Item | Ação | Arquivos |
|------|------|----------|
| **P1.1** | Corrigir navegação AtracaoEditor → Pendencia | `AtracaoEditor.jsx:82`, `ViagemView.jsx` |
| **P1.2** | Adicionar handler `abrirPendenciaId` no ViagemView | `ViagemView.jsx` |
| **P1.3** | Adicionar opções atracao/hospedagem/transporte no PendenciaAdder | `PendenciaAdder.jsx:12-16` |
| **P1.4** | Adicionar botão de excluir no TransportEditor | `TransportEditor.jsx`, `useDestinos.js` |
| **P1.5** | Unificar filtro de gastos (remover filtro por usuário ou aplicar em todas as views) | `useGastos.js`, `ViagemView.jsx`, `FinancasView.jsx` |

### Fase 2 — Padronização de formulários (2-3 dias)

| Item | Ação | Arquivos |
|------|------|----------|
| **P2.1** | Criar `<FormField>`, `<FormFooter>`, `<DeleteSection>` | `src/components/ui/` |
| **P2.2** | Unificar AtracaoForm + AtracaoEditor | `src/components/atracoes/` |
| **P2.3** | Unificar GastoForm + GastoRapido | `src/components/financas/` |
| **P2.4** | Unificar PendenciaAdder + PendenciaEditor | `src/components/pendencias/` |
| **P2.5** | Extrair UploadModal e AddLinkModal do MaisView, usar `<Modal>` | `src/components/mais/`, `src/components/ui/` |
| **P2.6** | Aplicar padrão Cancel+Save em TODOS os formulários | Todos os forms |

### Fase 3 — Arquitetura de contexto unificada (2-3 dias)

| Item | Ação | Arquivos |
|------|------|----------|
| **P3.1** | Criar migration SQL: adicionar `contexto_tipo` + `contexto_id` em gastos, atracoes, acomodacoes, transportes | `supabase/` |
| **P3.2** | Migrar dados existentes (destino_id → contexto) | `supabase/` |
| **P3.3** | Criar `<ContextSelector>` unificado | `src/components/ui/` |
| **P3.4** | Atualizar hooks para usar contexto em vez de colunas específicas | `src/hooks/` |
| **P3.5** | Substituir `destino_id` por `contexto_tipo`/`contexto_id` em gastos, atracoes | Todos os forms e views |
| **P3.6** | Substituir `cidade` (string) em acomodacoes por FK ou contexto | `useAcomodacoes.js`, `AcomodacaoEditor.jsx` |

### Fase 4 — Polish e consistência visual (1 dia)

| Item | Ação | Arquivos |
|------|------|----------|
| **P4.1** | Padronizar padding das seções de conteúdo (`pt-6 pb-6` em todas as abas) | Views |
| **P4.2** | Normalizar nomes de labels de campos | Todos os forms |
| **P4.3** | Adicionar botão "+" no tab Documentos do CidadeDetail | `CidadeDetailView.jsx` |
| **P4.4** | Separar contador de pendências para não misturar com acomodações/transporte | `PendenciasView.jsx:153` |
| **P4.5** | Habilitar exclusão de acomodação no AcomodacaoEditor | `AcomodacaoEditor.jsx` |

---

## Resumo

| Categoria | Quantidade |
|-----------|------------|
| Bugs | 10 |
| Fluxos quebrados | 5 |
| Componentes duplicados | 5 pares |
| Inconsistências visuais | 6 categorias |
| Inconsistências de regra de negócio | 8 |
| **Problema central** | **Sistema de contexto fragmentado — cada entidade vincula de forma diferente** |

**Tempo estimado total:** 6-9 dias de trabalho focando apenas em refatoração, sem novas features.
