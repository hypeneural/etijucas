# Bairros, Endereco e CEP (ViaCEP) - Analise e Plano

**Objetivo**: Documentar o estado atual, o que ja existe, o que falta e como integrar ViaCEP mantendo bairros fixos de Tijucas e preparado para multi-cidades.
**Ultima atualizacao**: 2026-02-05

## O que ja foi feito (estado real do codigo)
**Backend**
- Tabela `bairros` com `id`, `nome`, `slug`, `active` e relacionamento em `users.bairro_id`.
`apps/api/database/migrations/2026_01_28_000003_create_bairros_table.php`
- Seeder de bairros (lista inicial).
`apps/api/database/seeders/BairrosSeeder.php`
- Endpoint publico para listar bairros ativos.
`apps/api/app/Http/Controllers/Api/BairroController.php`
`apps/api/routes/api.php`
- Regras de cadastro forcam cidade/estado em Tijucas/SC e aceitam `bairroId` ou `address.bairro`.
`apps/api/app/Http/Requests/Auth/RegisterRequest.php`
`apps/api/app/Http/Controllers/Auth/AuthController.php`
- Relacoes com bairros em features chave: Forum (topics), Denuncias, Eventos (venues), Turismo, Alertas.
`apps/api/database/migrations/2026_01_28_111310_create_topics_and_comments_tables.php`
`apps/api/database/migrations/2026_02_03_160002_create_citizen_reports_table.php`
`apps/api/database/migrations/2026_01_31_000001_create_events_tables.php`
`apps/api/database/migrations/2026_02_03_140001_create_tourism_spots_table.php`
`apps/api/database/migrations/2026_02_04_215409_create_alerts_table.php`

**Frontend**
- Cache local de bairros com fallback para constantes (uso por convidados).
`apps/web/src/constants/bairros.ts`
`apps/web/src/hooks/queries/useBairros.ts`
`apps/web/src/services/bairro.service.ts`
- Selecionador de bairro em UI (Header/Home e filtros de Forum).
`apps/web/src/components/home/HeaderSlim.tsx`
`apps/web/src/components/forum/ForumFiltersChips.tsx`
- `selectedBairro` persistido no app store (inclui uso offline).
`apps/web/src/store/useAppStore.ts`

## Estrutura atual de dados (tabelas)
**users**
- Campos relevantes: `bairro_id` (FK), `address` (JSON), `phone_verified`, `phone_verified_at`.
`apps/api/database/migrations/0001_01_01_000000_create_users_table.php`

**bairros**
- `id`, `nome`, `slug`, `active`.
`apps/api/database/migrations/2026_01_28_000003_create_bairros_table.php`

**citizen_reports**
- `bairro_id`, `address_text`, `address_source`, `latitude`, `longitude`.
`apps/api/database/migrations/2026_02_03_160002_create_citizen_reports_table.php`

**topics**
- `bairro_id` obrigatorio (Forum).
`apps/api/database/migrations/2026_01_28_111310_create_topics_and_comments_tables.php`

**venues**
- `bairro_id`, `address`, `cep`, `latitude`, `longitude`.
`apps/api/database/migrations/2026_01_31_000001_create_events_tables.php`
`apps/api/app/Models/Venue.php`

**tourism_spots**
- `bairro_id`, `endereco`, `latitude`, `longitude`.
`apps/api/database/migrations/2026_02_03_140001_create_tourism_spots_table.php`

**alerts**
- `bairro_id` opcional para alertas segmentados.
`apps/api/database/migrations/2026_02_04_215409_create_alerts_table.php`

## Endpoints que usam bairro ou endereco
- `GET /api/v1/bairros` lista bairros ativos.
- `GET /api/v1/home?bairro_id=...` filtra blocos por bairro.
- `GET /api/v1/forum/topics?bairroId=...` filtra topicos.
`apps/api/app/Http/Controllers/Api/Forum/TopicController.php`
- `GET /api/v1/reports?bairroId=...` e `/api/v1/reports/map` usam bairro e endereco.
`apps/api/app/Domains/Reports/Http/Controllers/ReportController.php`
`apps/api/app/Domains/Reports/Http/Controllers/ReportMapController.php`
- `GET /api/v1/events?bairroId=...` e `GET /api/v1/events/bairro/{bairro}`.
`apps/api/app/Http/Controllers/Api/Events/EventController.php`
- `GET /api/v1/tourism/spots?bairroId=...`.
`apps/api/app/Domains/Tourism/Http/Controllers/TourismSpotController.php`

## Problemas atuais (gaps reais)
- **Encoding quebrado** em lista de bairros (Seeder e constantes do front possuem “VÃ¡rzea/SertÃ£ozinho”).
`apps/api/database/seeders/BairrosSeeder.php`
`apps/web/src/constants/bairros.ts`
- **Schema inconsistente de endereco** entre backend e frontend. Backend valida `address.cep`, `logradouro`, `bairro`, `cidade`, `estado`, enquanto o front usa `auth.types.ts` com `logradouro/localidade/uf` e `api.types.ts` com `street/city/state/zipCode`.
`apps/api/app/Http/Requests/Auth/RegisterRequest.php`
`apps/web/src/types/auth.types.ts`
`apps/web/src/types/api.types.ts`
- **Bairros duplicados e desincronizados** (Seeder, constantes, mockData, IndexedDB).
`apps/api/database/seeders/BairrosSeeder.php`
`apps/web/src/constants/bairros.ts`
`apps/web/src/data/mockData.ts`
- **NeighborhoodService tenta gravar campos inexistentes** (`cidade`, `uf`, `ativo`), indicando divergencia de modelo.
`apps/api/app/Services/NeighborhoodService.php`
`apps/api/app/Models/Bairro.php`
- **Convidados usam bairro local**: `selectedBairro` inicia em mock data, podendo nao refletir IDs reais do backend.
`apps/web/src/store/useAppStore.ts`

## O que fazer agora (prioridade alta)
1. Corrigir encoding dos bairros (UTF-8 real em Seeder e constantes).
2. Unificar schema de `address` entre backend e frontend.
3. Parar de depender de mockData para bairros em producao.
4. Popular `bairros` de Tijucas corretamente (lista oficial) e manter como fonte unica.

## Integracao ViaCEP (plano pratico)
**Regras da API ViaCEP**
- CEP deve ter 8 digitos. Se invalido, retornar 400.
- Se `erro: true`, CEP inexistente.

**Fluxo sugerido**
1. Criar `ViaCepService` no backend (com cache em memoria/redis por 24h).
2. Criar endpoint: `GET /api/v1/cep/{cep}`. Valida 8 digitos, consulta ViaCEP e retorna `{ success, data, meta }`.
3. Normalizar resposta para o schema unico de endereco: `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `estado`, `ibge`, `ddd`.
4. Mapear `bairro` da ViaCEP para `bairros.id` usando normalizacao. Recomendado: tabela `bairro_aliases` ou campo `aliases` JSON em `bairros`. Nao criar bairro automaticamente para manter lista fixa.
5. Validar cidade/UF: aceitar apenas `Tijucas/SC` (por enquanto).
6. No cadastro/atualizacao do usuario: se enviar `cep`, preencher automaticamente `address` e `bairro_id`. Se `bairro_id` nao existir, rejeitar ou usar “Outros”.

## Fixar bairros de Tijucas (fonte unica)
- Definir lista oficial de bairros de Tijucas em um unico lugar (Seeder).
- Gerar o cache local do front a partir do backend. Na primeira carga, buscar `/api/v1/bairros` e salvar no IndexedDB.
- Manter `constants/bairros.ts` apenas como fallback minimo (gerado ou verificado).
- Adicionar campo `is_system` (ou `locked`) em `bairros` para evitar criacao automatica.

## Multi-cidades no futuro (arquitetura sugerida)
**Estrutura de dados**
- Criar tabela `cities` com `id`, `nome`, `uf`, `ibge`, `slug`, `active`.
- Adicionar `city_id` em `bairros`, `users`, `venues`, `tourism_spots`, `alerts`, `events`.
- Unico: `(city_id, slug)`.

**ViaCEP multi-cidade**
- Ao consultar CEP, usar `localidade/uf/ibge` para resolver `city_id`.
- Rejeitar CEP de cidade nao habilitada.

## Melhorias adicionais (eficiencia e UX)
- Indexar `bairros.nome` e `bairros.slug` para lookup rapido (e normalizacao).
- Criar cache de bairros no backend (TTL longo) para reduzir custo do endpoint.
- Evitar auto-criacao de bairros via cadastro; usar mapping e revisao admin.

## Arquivos-chave para referencia
`apps/api/database/migrations/0001_01_01_000000_create_users_table.php`
`apps/api/database/migrations/2026_01_28_000003_create_bairros_table.php`
`apps/api/database/seeders/BairrosSeeder.php`
`apps/api/app/Services/NeighborhoodService.php`
`apps/api/app/Http/Controllers/Api/BairroController.php`
`apps/api/app/Http/Requests/Auth/RegisterRequest.php`
`apps/api/app/Http/Controllers/Auth/AuthController.php`
`apps/web/src/constants/bairros.ts`
`apps/web/src/hooks/queries/useBairros.ts`
`apps/web/src/services/bairro.service.ts`
`apps/web/src/store/useAppStore.ts`
