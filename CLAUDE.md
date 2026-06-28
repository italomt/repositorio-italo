# Europa Trip App

PWA multi-usuário para planejar a viagem pela Europa (14/set–05/out 2026, 22 dias). React + Vite + Tailwind + Supabase, com IA (via OpenRouter) para input rápido por texto/foto.

## Stack

- **Frontend**: React 18, Vite, react-router-dom v6, Tailwind (tokens estilo Apple/iOS HIG via CSS vars com `data-theme`)
- **Backend**: Supabase (Postgres + Auth + RLS). Acesso compartilhado entre usuários autenticados (`auth.role() = 'authenticated'`), não é multi-tenant — todos os usuários logados veem os mesmos dados da viagem.
- **IA de texto** (Quick Add de atrações/gastos): OpenRouter, modelo principal `deepseek/deepseek-chat` com fallback para `openai/gpt-4o-mini` (`src/lib/openrouter.js`)
- **IA de visão** (OCR de foto de recibo): `google/gemini-2.0-flash-001` com fallback `openai/gpt-4o-mini`
- **Mapas**: Google Maps Platform — Maps JS API, Directions API, Geocoding API (via `google.maps.Geocoder`), Places API (autocomplete de cidade)

## Estrutura de páginas (tabs)

1. **Hoje** (`/`) — agenda do dia atual, gasto rápido, único lugar com o botão de ⚙️ Configurações/Aparência
2. **Roteiro** (`/roteiro`) — lista de dias do trip, cada um com cidade/país; FAB "+" abre `DayAdder` para inserir um novo dia em qualquer data (autocompletado por `CidadeAutocomplete`, entra automaticamente na ordem cronológica certa)
3. **Atrações** (`/atracoes`) — atrações por dia, Quick Add por IA (texto ou foto), sugestão de dia por proximidade geográfica
4. **Finanças** (`/financas`) — gastos da viagem, Quick Add por IA (texto ou foto/OCR), suporta EUR/USD/CHF/BRL/GBP com conversão
5. **Pendências** (`/pendencias`) — tarefas pendentes (reservas, documentação, transporte), agrupadas por categoria; FAB "+" abre `PendenciaAdder` para criar pendências avulsas não vinculadas a nenhuma atração

`Layout.jsx` envolve todas as rotas; usa `useLocation` para só mostrar o botão de Configurações quando `pathname === '/'`.

## Schema Supabase (principal)

- `destinos` — dias do roteiro: `data`, `cidade`, `pais`, `flag_emoji`, `notas`, `status`
- `atracoes` — vinculadas a `destino_id`; campos incluem `local_busca` (endereço real pra geocodificação), `ocupa_dia_inteiro` (bloqueia o dia, ex: Disneyland Paris), lat/lng
- `transportes` — vinculados a `destino_origem_id` (FK explícita `transportes_destino_origem_id_fkey` por causa de ambiguidade)
- `gastos` — categoria, valor, moeda, conversão
- `pendencias` — `titulo`, `categoria` (`transporte` | `atracoes` | `documentacao`), `prazo_sugerido`, `link`, `urgencia` (`alta`/`media`/`baixa`), `concluida`, `atracao_id` (nullable — liga a uma atração específica ou fica solta/genérica)
- `profiles` — perfis dos usuários autenticados (sistema multi-usuário sem split de gastos)

RLS habilitado com policies simples de "qualquer autenticado pode ler/escrever". Migrations relevantes em `supabase/`: `schema_and_seed.sql`, `migration_multiusuario.sql`, `migration_link_pendencias.sql`, `migration_dia_inteiro.sql`, `migration_destino_opcional_gastos.sql`, `migration_created_by_atracoes.sql`, `migration_created_by_gastos.sql`.

## Features implementadas

- **Quick Add por IA**: texto livre interpretado em atração/gasto estruturado; campos genéricos (ex: "comer pastel de nata em Lisboa") fazem a IA sugerir um local real e específico, que é geocodificado automaticamente
- **Dia inteiro**: IA detecta parques temáticos/passeios de dia cheio e já marca `ocupa_dia_inteiro`; esse dia fica bloqueado para outras atrações
- **Sugestão de dia por proximidade**: ao adicionar uma atração, `src/lib/geo.js` (`ranquearDias`, distância de Haversine) ordena os dias candidatos pela menor distância média até as atrações já marcadas naquele dia, priorizando dias não bloqueados
- **Autocomplete de cidade**: `CidadeAutocomplete.jsx` usa Google Places para preencher cidade + país + bandeira (emoji via regional indicators) automaticamente, tanto ao editar um dia (`DayEditor`) quanto ao criar um novo (`DayAdder`)
- **Pendências ↔ Atrações**: pendências de categoria `atracoes` podem ter `atracao_id`; ao tocar numa atração com reserva pendente, navega para Pendências e abre o editor daquela pendência específica (`location.state.abrirPendenciaId`)
- **Pendências avulsas**: FAB "+" em Pendências abre `PendenciaAdder.jsx` (criação, distinto do `PendenciaEditor.jsx` que é só edição) para itens sem atração vinculada — ex: comprar passagem, tirar visto, etc.
- **Tema**: claro/escuro/sistema via `useTheme` + `ThemeSheet`, acessível só na Home
- **Formatação brasileira de valores**: `formatarBRL()` em `src/lib/cambio.js` — valores em reais usam separador brasileiro (ex: `R$ 1.234,56`). Usado em `Dashboard.jsx`, `GastoCard.jsx`, `GastoForm.jsx`, `HojeView.jsx`.
- **Gastos pré-viagem**: `destino_id` opcional na tabela `gastos`. O seletor de destino no `GastoForm.jsx` tem opção "Pré-viagem" no topo. Gastos sem destino aparecem como "Pré-viagem" nos cards e no dashboard.
- **Criador de atração**: `created_by` (FK → `profiles.id`) em `atracoes`. O `useAtracoes` faz join para trazer `profiles.nome`. `AtracoesView` injeta `usuario.id` ao criar. `AtracaoCard` exibe o nome do criador.
- **Gastos por usuário**: `created_by` (FK → `profiles.id`) em `gastos`. `useGastos(usuarioId)` filtra e insere com `created_by`. Cada usuário vê apenas seus próprios gastos.
- **Home pré-viagem**: antes da viagem, mostra contagem regressiva, checklist com barra de progresso, roteiro visual com bandeiras das cidades, temperatura histórica das datas exatas de cada cidade (via Open-Meteo Archive API), e total de gastos pré-viagem.
- **Clima na Home**: `src/lib/clima.js` com Open-Meteo (sem chave). Durante a viagem mostra clima atual da cidade. Pré-viagem mostra temperatura média histórica das datas específicas da viagem (usando dados de 2024 ajustados para o mesmo dia/mês).
- **Gráfico de Finanças com legenda**: gráfico de pizza agora tem legenda visual com bolinhas coloridas, nomes em português e valores em BRL.
- **Context Menu + Swipe em cards**: clique com botão direito (desktop) abre menu flutuante com Editar/Excluir. No celular, **arrastar o card para a direita** revela "Editar" (azul) e **arrastar para a esquerda** revela "Excluir" (vermelho), estilo iOS Mail. Componente `SwipeActions` em `src/components/ui/SwipeActions.jsx`, hook `useContextMenu` em `src/hooks/useContextMenu.js`. Aplicado em `AtracaoCard`, `GastoCard` e `PendenciaItem`.

## Problemas conhecidos

- **Google Places Autocomplete intermitente**: já apareceu `LegacyApiNotActivatedMapError` mesmo com Places API e Geocoding API mostrando "ativadas" no Google Cloud Console. A classe legada `google.maps.places.Autocomplete` (usada em `CidadeAutocomplete.jsx`) está marcada como deprecada pelo Google para "novos clientes" desde março/2025 — se o erro voltar, a correção provável é migrar para `google.maps.places.PlaceAutocompleteElement` ("Places API New"). `geocodificar()` em `src/lib/maps.js` usa a classe `Geocoder` (JS SDK antigo, não afetado pela mesma depreciação) e deve ser testado separadamente se o erro for específico do Autocomplete.

## Decisões de produto (não reverter sem pedir)

- **Sem split de gastos**: o sistema de divisão de despesas entre participantes (saldo, `pago_por`, `divisao_tipo`) foi implementado e depois **removido por completo** a pedido do usuário — complexidade desproporcional ao valor. Não recriar essa feature sem novo pedido explícito.
- **Sem seleção de "quem vai" em Atrações**: participante por atração também foi removido.
- **Senha de usuário nunca vai para arquivo**: credenciais de login (email/senha de um usuário do app) nunca devem ser salvas em `.env` ou qualquer arquivo do repo. Apenas credenciais de serviço (Supabase URL/key, OpenRouter key, Google Maps key, Supabase service_role key) pertencem a `.env.local`.

## Deploy

- **Vercel**: https://repositorio-italo.vercel.app (importado do GitHub, build automático com Vite)
- **Env vars no Vercel**: as 4 chaves do `.env.local` configuradas em Production & Preview
- **SPA routing**: `vercel.json` com rewrite para `/index.html` para evitar 404 em rotas como `/financas`
