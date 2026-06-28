# Europa Trip App

PWA multi-usuário para planejar a viagem pela Europa (14/set–05/out 2026, 22 dias). React + Vite + Tailwind + Supabase, com IA (via OpenRouter) para input rápido por texto/foto.

## Stack

- **Frontend**: React 18, Vite, react-router-dom v6, Tailwind, framer-motion, lucide-react, recharts. Estética Scandinavian com paleta natural e tons quentes.
- **Backend**: Supabase (Postgres + Auth + RLS). Acesso compartilhado entre usuários autenticados (`auth.role() = 'authenticated'`), não é multi-tenant — todos os usuários logados veem os mesmos dados da viagem.
- **IA de texto** (Quick Add de atrações/gastos): OpenRouter, modelo principal `deepseek/deepseek-chat` com fallback para `openai/gpt-4o-mini` (`src/lib/openrouter.js`)
- **IA de visão** (OCR de foto de recibo): `google/gemini-2.0-flash-001` com fallback `openai/gpt-4o-mini`
- **Mapas**: Google Maps Platform — Maps JS API, Directions API, Geocoding API (via `google.maps.Geocoder`), Places API (autocomplete de cidade)

## Estrutura de páginas (tabs)

1. **Hoje** (`/`) — agenda do dia atual, gasto rápido, único lugar com o botão de ⚙️ Configurações/Aparência
2. **Roteiro** (`/roteiro`) — lista de dias do trip, cada um com cidade/país; FAB "+" abre `DayAdder` para inserir um novo dia em qualquer data (autocompletado por `CidadeAutocomplete`, entra automaticamente na ordem cronológica certa)
3. **Atrações** (`/atracoes`) — atrações por dia, Quick Add por IA (texto ou foto), sugestão de dia por proximidade geográfica
4. **Finanças** (`/financas`) — gastos da viagem, Quick Add por IA (texto ou foto/OCR), suporta EUR/USD/CHF/BRL/GBP com conversão
5. **Pendências** (`/pendencias`) — tarefas pendentes (reservas, documentação, transporte, acomodações), agrupadas por categoria com filtro por abas no topo (Todas, Transporte, Atrações, Documentação, Acomodações). FAB "+" abre `PendenciaAdder` para criar pendências avulsas.

`Layout.jsx` envolve todas as rotas; usa `useLocation` para só mostrar o botão de Conta (avatar + versão + Sair) quando `pathname === '/'`.

## Schema Supabase (principal)

- `destinos` — dias do roteiro: `data`, `cidade`, `pais`, `flag_emoji`, `notas`, `status`
- `atracoes` — vinculadas a `destino_id`; campos incluem `local_busca` (endereço real pra geocodificação), `ocupa_dia_inteiro` (bloqueia o dia, ex: Disneyland Paris), lat/lng
- `transportes` — vinculados a `destino_origem_id` (FK explícita `transportes_destino_origem_id_fkey` por causa de ambiguidade)
- `gastos` — categoria, valor, moeda, conversão
- `pendencias` — `titulo`, `categoria` (`transporte` | `atracoes` | `documentacao`), `prazo_sugerido`, `link`, `urgencia` (`alta`/`media`/`baixa`), `concluida`, `atracao_id` (nullable — liga a uma atração específica ou fica solta/genérica)
- `profiles` — perfis dos usuários autenticados (sistema multi-usuário sem split de gastos)
- `acomodacoes` — hospedagem por cidade (hotel, Airbnb, hostel), com endereço, coordenadas, link, preço

RLS habilitado com policies simples de "qualquer autenticado pode ler/escrever". Migrations relevantes em `supabase/`: `schema_and_seed.sql`, `migration_multiusuario.sql`, `migration_link_pendencias.sql`, `migration_dia_inteiro.sql`, `migration_destino_opcional_gastos.sql`, `migration_created_by_atracoes.sql`, `migration_created_by_gastos.sql`, `migration_acomodacoes.sql`.

## Features implementadas

- **Quick Add por IA**: texto livre interpretado em atração/gasto estruturado; campos genéricos (ex: "comer pastel de nata em Lisboa") fazem a IA sugerir um local real e específico, que é geocodificado automaticamente
- **Dia inteiro**: IA detecta parques temáticos/passeios de dia cheio e já marca `ocupa_dia_inteiro`; esse dia fica bloqueado para outras atrações
- **Sugestão de dia por proximidade**: ao adicionar uma atração, `src/lib/geo.js` (`ranquearDias`, distância de Haversine) ordena os dias candidatos pela menor distância média até as atrações já marcadas naquele dia, priorizando dias não bloqueados. Também considera a distância até a acomodação da cidade.
- **Autocomplete de cidade**: `CidadeAutocomplete.jsx` usa Google Places para preencher cidade + país + bandeira automaticamente
- **Autocomplete de endereço**: `EnderecoAutocomplete.jsx` usa Google Places para buscar endereço completo com coordenadas, usado no cadastro de acomodações
- **Pendências ↔ Atrações**: pendências de categoria `atracoes` podem ter `atracao_id`; toque em "Resolver" no card da atração abre o link da reserva diretamente (se houver) ou marca como concluída
- **Pendências avulsas**: FAB "+" em Pendências para itens sem atração vinculada
- **Filtro por categoria em Pendências**: abas no topo (Todas, Transporte, Atrações, Documentação, Acomodações) para filtrar, igual ao seletor de cidade em Atrações
- **Acomodações por cidade**: seção no Roteiro para cadastrar hotel/Airbnb, com autocomplete de endereço via Google Maps. Coordenadas usadas no ranqueamento de proximidade. Pendências de acomodação mostradas automaticamente para cidades sem hospedagem.
- **Labels nos formulários**: todos os campos de atração (Nome, Categoria, Custo com €) e acomodação com labels claras
- **Home pré-viagem**: saudação "Olá, {nome}", contagem "faltam X dias" com avião, data de início, checklist com barra de progresso, roteiro visual com bandeiras, temperatura histórica, gastos pré-viagem
- **Clima na Home**: Open-Meteo (sem chave). Durante a viagem mostra clima atual. Pré-viagem mostra temperatura média histórica das datas específicas.
- **Gráfico de Finanças com legenda**: gráfico de pizza com legenda visual, nomes em português e valores em BRL.
- **Formatação brasileira de valores**: `formatarBRL()` — separador brasileiro (ex: `R$ 1.234,56`)
- **Gastos pré-viagem e por usuário**: `destino_id` opcional; `created_by` separa gastos por usuário; criador visível nos cards de atração
- **Estética Scandinavian**: paleta de tons naturais (off-white quente, carvão), Nunito (display) + Inter (corpo), gradiente radial sutil, textura de ruído SVG. Apenas modo claro fixo.
- **Lucide Icons**: emojis substituídos por `lucide-react`. Categoria icons via `src/lib/icons.jsx`.
- **Framer Motion**: transições de página (`AnimatePresence`), entrada escalonada de cards (`StaggerContainer`/`StaggerItem`), contador animado no Dashboard.
- **Versão no app**: número da versão (ex: 1.8.0) exibido no modal Conta, atualizado a cada deploy
- **Layout mobile-first**: `100dvh` para viewport dinâmica no Chrome mobile, `touch-action: manipulation`, scroll no `<main>`

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
