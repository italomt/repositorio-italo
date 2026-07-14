# Europa Trip App

PWA multi-usuário para planejar a viagem pela Europa (14/set–05/out 2026, 22 dias). React + Vite + Tailwind + Supabase, com IA (via OpenRouter) para input rápido por texto/foto.

## Stack

- **Frontend**: React 18, Vite, react-router-dom v6, Tailwind, framer-motion, lucide-react, recharts. Estética Scandinavian com paleta natural e tons quentes.
- **Backend**: Supabase (Postgres + Auth + RLS). Acesso compartilhado entre usuários autenticados.
- **IA de texto**: OpenRouter via Edge Function `openrouter-proxy` (chave fica em secret no Supabase, nunca no bundle). Modelo `deepseek/deepseek-chat` com fallback `openai/gpt-4o-mini` (`src/lib/openrouter.js` monta os prompts e chama `supabase.functions.invoke`)
- **IA de visão** (OCR de foto de recibo): `google/gemini-2.0-flash-001` com fallback `openai/gpt-4o-mini`
- **Mapas**: Google Maps Platform — Maps JS API, Geocoding API, Places API
- **Observabilidade**: Sentry (`@sentry/react`) para erros/performance/replays + PostHog (`posthog-js`) para analytics de produto. Inicializados em `src/main.jsx` antes do render; config em `src/lib/sentry.js` e `src/lib/posthog.js`. Identidade do usuário sincronizada em `src/hooks/useAuth.js` (login/logout).

## Estrutura de páginas (tabs)

1. **Hoje** (`/`) — agenda do dia, clima, gasto do dia, checklist de pendências
2. **Roteiro** (`/viagem`) — lista de cidades/dias com linha do tempo, transportes e mapa geral
3. **Atrações** (`/viagem/dia/:destinoId`) — atrações do dia com mapa, otimização de rota, preenchimento por IA
4. **Finanças** (`/financas`) — dashboard com gráfico de pizza, lista de gastos, Quick Add IA/foto
5. **Pendências** (`/pendencias`) — tarefas com filtro por categoria, estado (aberta/concluida/cancelada), urgência
6. **Documentos** (`/mais`) — upload de arquivos e links

## Schema Supabase (arquitetura final pós-migração)

### Tabelas principais

- **`viagens`** — metadados da viagem: `nome`, `data_inicio`, `data_fim`, `tipo`, `moeda_principal`, `orcamento_total`
- **`cidades`** — catálogo global: `nome`, `pais`, `flag_emoji`, `latitude`, `longitude`
- **`dias`** — dias do roteiro: `viagem_id`, `cidade_id` (FK→cidades), `data`, `notas`, `status`
- **`atracoes`** — vinculadas a `destino_id` (FK→dias): `nome`, `categoria`, `custo_estimado_eur`, `horario_previsto`, `ordem_no_dia`, `ocupa_dia_inteiro`, `precisa_reserva`, `status_reserva`, `foto_url`, `latitude`, `longitude`, `viagem_id`
- **`gastos`** — `descricao`, `valor`, `moeda`, `valor_brl`, `categoria`, `data_gasto`, `destino_id` (FK→dias), `viagem_id`
- **`pendencias`** — `titulo`, `categoria`, `prazo_sugerido`, `link`, `urgencia`, `estado` (`aberta`|`concluida`|`cancelada`), `atracao_id`, `viagem_id`
- **`hospedagens`** — `viagem_id`, `cidade_id` (FK→cidades), `nome`, `tipo`, `endereco`, `link`, `valor_noite`, `moeda`
- **`transportes`** — `destino_origem_id`/`destino_destino_id` (FK→dias), `tipo`, `operadora`, `custo_estimado_brl`, `link`, `viagem_id`
- **`documentos`** — `nome`, `categoria`, `tipo`, `arquivo_url`, `viagem_id`
- **`profiles`** — `nome`, `cor`

### Tabelas removidas na migração
`destinos`, `acomodacoes`, `memorias`, `orcamentos` — substituídas por `dias`+`cidades`, `hospedagens`.

### Hooks (todos filtram por `viagem_id`)

| Hook | Tabela | Filtro |
|------|--------|--------|
| `useViagem` | `viagens` | `.limit(1)` |
| `useDestinos(viagemId)` | `dias` + `cidades` + `transportes` | `.eq('viagem_id', viagemId)` |
| `useAtracoes(viagemId, destinoId?)` | `atracoes` + `profiles` | `.eq('viagem_id')` + `.eq('destino_id')` |
| `useGastos(viagemId)` | `gastos` | `.eq('viagem_id', viagemId)` |
| `usePendencias(viagemId)` | `pendencias` | `.eq('viagem_id', viagemId)` |
| `useAcomodacoes(viagemId)` | `hospedagens` + `cidades` | `.eq('viagem_id', viagemId)` |
| `useDocumentos(viagemId)` | `documentos` | `.eq('viagem_id', viagemId)` |
| `useHoje(viagemId)` | via `useDestinos` | — |

## Features implementadas

- **AdicionarModal unificado**: "+" no header abre seletor de tipo (Atração/Gasto/Pendência/Hospedagem/Transporte/Dia) e depois o formulário específico padronizado
- **Quick Add por IA**: texto livre → atração/gasto estruturado; geocodificação automática; busca de foto via Google Places/Wikipedia
- **Dia inteiro**: IA detecta parques e marca `ocupa_dia_inteiro`; dia fica bloqueado
- **Sugestão de dia por proximidade**: `ranquearDias()` (Haversine) ordena dias candidatos por distância até atrações e acomodações
- **Preencher dia com IA**: sugere 6-8 atrações, geocodifica, ordena por vizinho mais próximo
- **Otimizar rota**: algoritmo Nearest Neighbor a partir da acomodação; atualiza `ordem_no_dia` e `horario_previsto`
- **Autocomplete**: `CidadeAutocomplete` (Google Places) e `EnderecoAutocomplete` para acomodações
- **Pendências ↔ Atrações**: `atracao_id` linka pendência a atração; botão "Resolver" abre link ou conclui
- **Clima**: Open-Meteo (sem chave) — clima atual durante viagem, temperatura histórica pré-viagem
- **Dashboard Financeiro**: gráfico de pizza por categoria, totais em BRL, conversão multi-moeda
- **Formulários padronizados**: `TravelCurrencyInput`, `TravelCategorySelector`, `TravelPrioritySelector`, `TravelDatePicker`, `TravelDateTimePicker` (check-in/check-out de hospedagem, horário de saída/chegada de transporte — `hospedagens.check_in/check_out` e `transportes.horario_saida/horario_chegada` são TIMESTAMPTZ)
- **Pull-to-refresh**: indicador no topo, sem `translateY` (não quebra modais com `position: fixed`)
- **Code splitting**: `React.lazy` + `Suspense` em todas as páginas; bundle inicial ~1.1MB (Sentry+PostHog somam ~570KB além dos ~530KB originais)
- **Animações**: Framer Motion (`AnimatePresence`, checkmark animado, `StaggerContainer`)
- **Skeleton loading**: cards esqueleto durante carregamento lazy
- **Formatação brasileira**: `formatarBRL()` — separador brasileiro
- **Acessibilidade**: aria-labels, skip link, `prefers-reduced-motion`, `role="status"`
- **Touch targets**: botões de 44px (`w-11`), checkboxes com wrapper 44px
- **Mobile-first**: `100dvh`, `touch-action: manipulation`, `appearance: none` em inputs date/time
- **Error tracking**: `ErrorBoundary` (`src/components/ui/ErrorBoundary.jsx`) envia exceções de render ao Sentry via `captureException` mantendo UI de fallback existente
- **Pageview tracking (SPA)**: `PostHogPageviewTracker` em `src/App.jsx` dispara `$pageview` a cada mudança de rota (pathname/search/hash); PostHog autocapture + pageleave habilitados

## Decisões de design

- **Sem dark mode**: apenas modo claro (usuário testou e não gostou)
- **Sem split de gastos**: removido a pedido do usuário — não recriar
- **Labels uppercase tracking-wide mantidas**: marcadores funcionais de seção

## Migrations em `supabase/`

| Arquivo | Status |
|---------|--------|
| `schema_and_seed.sql` | Schema original (obsoleto) |
| `migration_normalizacao.sql` | Cria viagens, cidades, dias, renomeia colunas |
| `migration_v2.sql` | Arquitetura final: hospedagens, FKs, auditoria |
| `migration_limpeza_legado.sql` | Drop destinos + acomodacoes |

## Deploy

- **Vercel**: https://repositorio-italo.vercel.app (build automático com Vite)
- **SPA routing**: `vercel.json` com rewrite para `/index.html`
- **Env vars de observabilidade** (Vercel → Settings → Environment Variables, escopo `VITE_`):
  - `VITE_SENTRY_DSN` — DSN público do Sentry (US)
  - `VITE_SENTRY_ENVIRONMENT` — `production` em prod, `development` em dev
  - `VITE_POSTHOG_KEY` — project API key (`phc_…`), US Cloud
  - `VITE_POSTHOG_HOST` — `https://us.i.posthog.com`
- **Atenção ao editar env vars**: colar keys sem caracteres extras (ex: `│` U+2502 já contaminou a key do PostHog em prod e foi diagnosticado via hex dump do bundle). Mudar env var na Vercel **não** dispara rebuild automaticamente — usar "Redeploy" manual em Deployments.
