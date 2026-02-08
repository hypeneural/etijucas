# Weather Module 2.0 - Analise Completa da Stack Atual e Roadmap

Data: 2026-02-08  
Escopo: backend Laravel + frontend React + tenancy + dados de cidades + UX/registro

## 1. Objetivo
Transformar o modulo de previsao do tempo de "cidade fixa" para multi-tenancy real por cidade, com:
- previsao correta por cidade (lat/lon/timezone da cidade ativa),
- cache robusto sem vazamento entre cidades,
- dia civil correto no timezone local da cidade,
- arquitetura extensivel para mar, score "Da Praia?" e alertas oficiais.

## 2. Inventario do que temos hoje (AS-IS)

### 2.1 Backend - API de clima
- Endpoints atuais em `apps/api/routes/api.php:100` ate `apps/api/routes/api.php:105`:
  - `GET /api/v1/weather/home`
  - `GET /api/v1/weather/forecast`
  - `GET /api/v1/weather/marine`
  - `GET /api/v1/weather/insights`
  - `GET /api/v1/weather/preset/{type}`
- Controller atual: `apps/api/app/Domains/Weather/Http/Controllers/WeatherController.php`.
- Service atual: `apps/api/app/Domains/Weather/Services/OpenMeteoService.php`.
- Insights: `apps/api/app/Domains/Weather/Services/WeatherInsightsService.php`.
- Cache persistido em tabela `external_api_cache`:
  - migration: `apps/api/database/migrations/2026_02_04_140000_create_external_api_cache_table.php`.
  - model: `apps/api/app/Domains/Weather/Models/ExternalApiCache.php`.

### 2.2 Tenancy atual
- Tenant resolvido globalmente por middleware:
  - alias/middleware global em `apps/api/bootstrap/app.php:22` e `apps/api/bootstrap/app.php:37`.
- Regra de resolucao em `apps/api/app/Http/Middleware/TenantContext.php`:
  1. dominio (`resolveByDomain`)
  2. header `X-City`
  3. path `/uf/cidade`
  4. fallback (`default_city_slug`)
- Rotas API v1 estao sob `require-tenant` em `apps/api/routes/api.php:32`.

### 2.3 Dados de cidades
- Tabela `cities` possui hoje:
  - `lat`, `lon`, `timezone`, `active` em `apps/api/database/migrations/2026_02_06_200001_create_cities_table.php:19` ate `apps/api/database/migrations/2026_02_06_200001_create_cities_table.php:23`.
  - `status` em `apps/api/database/migrations/2026_02_06_220000_add_status_to_cities.php:16`.
  - `brand` em `apps/api/database/migrations/2026_02_06_224900_add_brand_to_cities.php:15`.
- Nao existe coluna `is_coastal` no schema atual.
- Seeders:
  - `CitiesSeeder` com cidades SC e timezone fixo em `apps/api/database/seeders/CitiesSeeder.php`.
  - `FullBrazilianCitiesSeeder` com timezone por cidade em `apps/api/database/seeders/FullBrazilianCitiesSeeder.php:106`.

### 2.4 Frontend - stack do modulo clima
- Service/hook clima: `apps/web/src/services/weather.service.ts`.
- Pagina clima: `apps/web/src/pages/WeatherPage.tsx`.
- Card home clima: `apps/web/src/components/weather/WeatherHomeCard.tsx`.
- Tipos clima: `apps/web/src/types/weather.ts`.
- Cache offline clima (IndexedDB) existe, mas nao esta integrado aos hooks principais:
  - `apps/web/src/hooks/useOfflineWeather.ts`
  - `apps/web/src/services/weather-cache.service.ts`

### 2.5 Tenant no frontend
- Bootstrap tenant usa `X-City` somente no `GET /config`:
  - `apps/web/src/store/useTenantStore.ts:101` e `apps/web/src/store/useTenantStore.ts:102`.
- Cliente HTTP principal (`apiClient`) nao injeta `X-City` nas chamadas gerais:
  - headers em `apps/web/src/api/client.ts:181` ate `apps/web/src/api/client.ts:186`.

## 3. Diagnostico tecnico (gaps e riscos)

## 3.1 Gap critico - clima hardcoded em Tijucas (nao multi-tenant)
Evidencias:
- `LAT`, `LON`, `TIMEZONE` fixos em `apps/api/app/Domains/Weather/Services/OpenMeteoService.php:15` ate `apps/api/app/Domains/Weather/Services/OpenMeteoService.php:17`.
- Chaves fixas de cache em `apps/api/app/Domains/Weather/Services/OpenMeteoService.php:25` e `apps/api/app/Domains/Weather/Services/OpenMeteoService.php:26`.
- `getLocation()` fixo em Tijucas em `apps/api/app/Domains/Weather/Services/OpenMeteoService.php:300`.

Impacto:
- API de clima ignora cidade do tenant.
- Nao escala para multi-cidade real.

## 3.2 Gap critico - timezone/dia civil inconsistente
Evidencias:
- Timezone global da app em UTC: `apps/api/config/app.php:74`.
- Controller filtra "proximas horas" com `now()` sem timezone da cidade (`WeatherController` usa comparacao por `now()` em varios pontos, ex. `apps/api/app/Domains/Weather/Http/Controllers/WeatherController.php:101`).
- Insights fixam `America/Sao_Paulo` em `apps/api/app/Domains/Weather/Services/WeatherInsightsService.php:40` e `apps/api/app/Domains/Weather/Services/WeatherInsightsService.php:559`.

Impacto:
- Risco de "dia errado" no `daily` quando cidade/timezone divergir.
- Risco de janela horaria incorreta para "agora/proximas horas".

## 3.3 Gap critico - risco de cache bleed no frontend
Evidencias:
- Query keys de clima nao incluem cidade nem params:
  - `apps/web/src/services/weather.service.ts:127` ate `apps/web/src/services/weather.service.ts:133`.
- Chaves de cache local (IndexedDB) tambem estaticas:
  - `apps/web/src/services/weather-cache.service.ts:285` ate `apps/web/src/services/weather-cache.service.ts:289`.

Impacto:
- Possibilidade de mostrar dados de uma cidade em outra ao alternar tenant.

## 3.4 Gap alto - contexto de cidade nao acompanha todas as chamadas API no frontend
Evidencias:
- `X-City` aparece no bootstrap de tenant (`/config`) mas nao no `apiClient` geral.
- Header do `apiClient`: `apps/web/src/api/client.ts:181` ate `apps/web/src/api/client.ts:186`.

Impacto:
- Em cenarios sem dominio dedicado por cidade, chamadas podem cair na cidade errada.
- Em URL multi-cidade (`/uf/cidade`), clima pode nao refletir a cidade da rota.

## 3.5 Gap alto - mar sempre consultado (sem regra coastal)
Evidencias:
- `getAll()` sempre chama weather + marine: `apps/api/app/Domains/Weather/Services/OpenMeteoService.php:55` ate `apps/api/app/Domains/Weather/Services/OpenMeteoService.php:59`.
- Nao existe `is_coastal` no schema de `cities`.

Impacto:
- Custo desnecessario para cidades nao costeiras.
- UX pode mostrar dados marinhos irrelevantes.

## 3.6 Gap alto - bug funcional no Home Aggregator (weather mini)
Evidencias em `apps/api/app/Domains/Home/Services/HomeAggregatorService.php`:
- Leitura de `current` em caminho incorreto: `apps/api/app/Domains/Home/Services/HomeAggregatorService.php:352`.
- Tratamento de insights como mapa associativo, mas retorno e lista: `apps/api/app/Domains/Home/Services/HomeAggregatorService.php:357` e `apps/api/app/Domains/Home/Services/HomeAggregatorService.php:358`.

Impacto:
- Widget de clima da home tende a cair em fallback estatico ("Tempo bom em Tijucas").

## 3.7 Gap medio - contrato tenant sem timezone explicito no payload de bootstrap
Evidencias:
- `Tenant::config()` retorna `city` e `geo` sem timezone: `apps/api/app/Support/Tenant.php:88` ate `apps/api/app/Support/Tenant.php:111`.
- Tipos SDK de tenant tambem sem timezone:
  - `packages/sdk/src/tenant-config.ts:1`
  - `packages/sdk/src/tenant-config.ts:31` ate `packages/sdk/src/tenant-config.ts:34`.

Impacto:
- Frontend nao tem timezone oficial da cidade no bootstrap para formatacoes globais.

## 3.8 Gap medio - cobertura de testes praticamente inexistente para clima
Evidencia:
- Busca por testes de weather em `apps/api/tests` retorna apenas normalizacao de modulo:
  - `apps/api/tests/Unit/Models/ModuleIdentifierTest.php:18`.

Impacto:
- Risco alto de regressao em refatoracao Weather 2.0.

## 3.9 Gap medio - onboarding/cadastro ainda Tijucas-only
Evidencias:
- Restricao explicita de cidade no cadastro:
  - `apps/api/app/Http/Requests/Auth/RegisterRequest.php:90` ate `apps/api/app/Http/Requests/Auth/RegisterRequest.php:92`.
- Forca `Tijucas/SC` no payload:
  - `apps/api/app/Http/Requests/Auth/RegisterRequest.php:131` ate `apps/api/app/Http/Requests/Auth/RegisterRequest.php:137`.
- NeighborhoodService ainda grava `cidade = Tijucas`:
  - `apps/api/app/Services/NeighborhoodService.php:32`.

Impacto:
- Fluxo de cadastro conflita com estrategia multi-cidade.

## 4. Decisoes arquiteturais recomendadas (target)

## 4.1 Backend Weather 2.0 (Provider Pattern)
- Criar `WeatherOptions` DTO:
  - `days`, `units`, `timezone`, `lang`, `model`.
- Criar interface `WeatherProviderInterface`:
  - `forecast(lat, lon, options)`
  - `marine(lat, lon, options)`
- Implementar `OpenMeteoProvider`:
  - timeout + retry + tratamento de erro + mapeamento de payload.
- Criar `WeatherService` orquestrador:
  - recebe `City` do contexto tenant,
  - monta cache keys dinamicas por cidade/timezone/opcoes,
  - aplica lock anti-stampede por chave.

## 4.2 Estrategia de timezone
- Regra: dia civil no timezone da cidade.
- Backend:
  - sempre chamar Open-Meteo com `timezone = city.timezone`,
  - salvar metadados: `timezone`, `generated_at_utc`, `source_model`.
- Frontend:
  - nao recalcular dia; apenas formatar/exibir.
- Resultado esperado:
  - elimina bug "previsao de sabado aparece na sexta".

## 4.3 Estrategia de cache
- Padrao recomendado:
  - `weather:forecast:{citySlug}:tz:{tz}:u:{units}:days:{days}:v1`
  - `weather:marine:{citySlug}:tz:{tz}:u:{units}:days:{days}:v1`
  - `weather:bundle:{citySlug}:tz:{tz}:u:{units}:days:{days}:v1`
- TTL recomendado:
  - current/hourly: 10-20 min
  - daily: 30-60 min
  - marine: 30-60 min
- Lock:
  - `Cache::lock(<key>:lock, 10-30s)`

## 4.4 Regra marinha (coastal-aware)
- Adicionar `cities.is_coastal` (boolean, default false).
- Executar marine somente quando `is_coastal = true`.
- Em cidades nao costeiras:
  - retornar `marine = null` com motivo (`not_applicable_non_coastal`).

## 4.5 Endpoint alvo
- Novo endpoint principal: `GET /api/v1/weather/bundle`.
- Deve incluir:
  - `location` (city, lat, lon, timezone),
  - `current`, `hourly`, `daily`,
  - `marine` condicional,
  - `insights` e opcional `beach_score`.
- Opcional explorador:
  - `?city=slug` com politica de seguranca definida.

## 4.6 Contrato padrao do bundle (escalavel e debugavel)
- Adotar contrato fixo com `contract_version` e `provider` no topo.
- `location` sempre completo:
  - `city_slug`, `lat`, `lon`, `timezone` (IANA), `is_coastal`.
- Metadados de cache obrigatorios:
  - `generated_at_utc`
  - `expires_at_utc`
  - `stale_until_utc`
  - `degraded` (boolean)
  - `degraded_reason` (nullable)
- Erros por secao sem quebrar a tela:
  - `errors.forecast`
  - `errors.marine`
  - `errors.insights`
  - formato: `null | { code: string, msg: string }`
- Incluir `request_id` no payload e no header para rastreabilidade.

Exemplo minimo recomendado:

```json
{
  "contract_version": "2.0",
  "provider": "open_meteo",
  "request_id": "req_01H...",
  "location": {
    "city_slug": "tijucas-sc",
    "lat": -27.2413,
    "lon": -48.6317,
    "timezone": "America/Sao_Paulo",
    "is_coastal": true
  },
  "cache": {
    "generated_at_utc": "2026-02-08T12:00:00Z",
    "expires_at_utc": "2026-02-08T12:15:00Z",
    "stale_until_utc": "2026-02-08T18:00:00Z",
    "degraded": false,
    "degraded_reason": null
  },
  "errors": {
    "forecast": null,
    "marine": { "code": "UPSTREAM_TIMEOUT", "msg": "Marine indisponivel no momento" },
    "insights": null
  },
  "data": {
    "current": {},
    "hourly": [],
    "daily": [],
    "marine": null,
    "insights": []
  }
}
```

## 4.7 Tenancy com fonte unica de verdade (tenant_key)
- Gerar `tenant_key` canonico no middleware:
  - `tenant_key = city_slug + "|" + timezone + "|" + status + "|" + brand_hash`
  - observacao: usar `brand_hash` (ex.: sha256 do JSON) para evitar header grande.
- Propagar headers em toda resposta API:
  - `X-Tenant-City: <slug>`
  - `X-Tenant-Timezone: <iana>`
  - `X-Tenant-Key: <tenant_key>`
- Frontend:
  - `apiClient` envia `X-City` sempre.
  - se URL tiver `/uf/cidade`, validar coerencia com `tenantStore.city.slug`.
  - query keys devem usar `tenantKey` (nao apenas slug).

## 4.8 Cache profissional com 2 camadas + soft/hard TTL
- Camada quente: Redis.
- Camada fria/auditoria: tabela `external_api_cache`.
- Politica:
  - Soft TTL (ex.: 15 min): tenta revalidar.
  - Hard TTL (ex.: 2-6h): ainda pode servir stale com `degraded=true`.
- Anti-stampede completo:
  - lock por chave
  - jitter de TTL (+/- 10%)
  - `stale-if-busy` quando lock estiver ocupado

## 4.9 Timezone - regra operacional sem ambiguidade
- Backend:
  - `now()` de clima sempre no timezone da cidade.
  - chamada ao provider sempre com `timezone = city.timezone`.
- Frontend:
  - nao recalcular dia civil; apenas formatar com `location.timezone`.
- UX:
  - sempre exibir "Atualizado ha X min" com base em `generated_at_utc`.

## 4.10 Bundle por secoes (reduz custo e latencia)
- Endpoint: `GET /weather/bundle?sections=current,hourly,daily,marine,insights`
- Regras:
  - Home widget: `sections=current`
  - Pagina clima: `sections=current,hourly,daily,insights`
  - Marine somente se `is_coastal=true` e se `sections` incluir `marine`

## 4.11 Provider pattern com capabilities + circuit breaker
- Expandir contrato do provider:
  - `capabilities(): { hasMarine: bool, supportsTimezone: bool, maxDays: int }`
- Centralizar `normalize()` no provider/service (evitar mapping espalhado).
- Adicionar circuit breaker por cidade/chave:
  - 3 falhas seguidas em 2 min => abre circuito por 1-2 min
  - durante circuito aberto: servir stale com `degraded=true`

## 4.12 Organizacao de codigo (evitar acoplamento)
- Estrutura recomendada:
  - `Domains/Weather/Contracts` (DTOs, interfaces, value objects)
  - `Domains/Weather/Providers`
  - `Domains/Weather/Services`
  - `Domains/Weather/Http` (controllers, requests, resources)
  - `Domains/Weather/Support` (cache keys, normalizers, helpers)
- Regra de implementacao:
  - controller nao calcula regra de negocio; apenas valida input e orquestra service.

## 5. Roadmap de execucao (tarefas detalhadas)

## Fase 1 - Core Backend (prioridade maxima)

### 1.1 Dados e schema
- [ ] Criar migration para `cities.is_coastal` (default false, index).
- [ ] Validar/ajustar `lat`, `lon`, `timezone` em cidades ativas.
- [ ] Corrigir inconsistencias de seed (ex.: IBGE de Tijucas em `CitiesSeeder`).
- [ ] Atualizar seeder de cidades foco: Tijucas, Porto Belo, Itapema, Balneario Camboriu, Canelinha.

Criterio de aceite:
- Cidade ativa sempre com `lat/lon/timezone`.
- `is_coastal` preenchido para cidades costeiras.

### 1.2 Refatoracao de arquitetura
- [ ] Criar `WeatherOptions` DTO.
- [ ] Criar `WeatherProviderInterface`.
- [ ] Implementar `OpenMeteoProvider`.
- [ ] Criar `WeatherService` novo (sem hardcode).
- [ ] Deprecar uso direto de `OpenMeteoService` antigo.

Criterio de aceite:
- Nenhum `LAT/LON/TIMEZONE` hardcoded para cidade fixa no fluxo principal.

### 1.3 Cache robusto
- [ ] Implementar chaves dinamicas por cidade/timezone/opcoes.
- [ ] Lock anti-stampede por chave.
- [ ] Adicionar jitter de TTL (+/-10%).
- [ ] Implementar `stale-if-busy` quando lock estiver ocupado.
- [ ] Implementar Soft TTL + Hard TTL.
- [ ] Cache em duas camadas: Redis (quente) + DB (frio/auditoria).
- [ ] Suporte a stale fallback com metadados de degradacao.

Criterio de aceite:
- Troca de cidade nao colide cache.
- Concurrency test valida 1 fetch externo por chave sob carga.

### 1.4 Controller e endpoints
- [ ] Criar `WeatherBundleController` (ou evoluir controller atual).
- [ ] Resolver cidade por `Tenant::city()`; fallback bloqueado em rota tenant-required.
- [ ] Adicionar validacao opcional para `?city=slug` (modo explorador).
- [ ] Suportar query param `sections`.
- [ ] Adicionar contrato padrao `contract_version=2.0` + `provider`.
- [ ] Retornar `request_id` no body/header.
- [ ] Retornar headers tenancy:
  - `X-Tenant-City`
  - `X-Tenant-Timezone`
  - `X-Tenant-Key`
- [ ] Retornar `errors` por secao no bundle.

Criterio de aceite:
- Bundle retorna cidade correta em dominio, header ou path valido.

## Fase 2 - Frontend e cache client-side

### 2.1 React Query tenant-aware
- [ ] Incluir `tenantKey` em todas query keys de clima.
- [ ] Incluir parametros (`days`, `units`, `timezone`) na key.
- [ ] Invalidar queries ao trocar tenant.

Criterio de aceite:
- Nao ha cache bleed entre cidades em troca rapida de tenant.

### 2.2 API client com contexto de cidade
- [ ] Injetar `X-City` globalmente no `apiClient` com base no tenant store.
- [ ] Validar coerencia URL `/uf/cidade` x tenantStore.
- [ ] Ler e armazenar `X-Tenant-Key` para uso nas query keys.
- [ ] Garantir coerencia com rotas city-prefixed.

Criterio de aceite:
- Todas chamadas de clima carregam contexto correto de cidade.

### 2.3 Timezone no frontend
- [ ] Usar timezone vindo do backend (`location.timezone`).
- [ ] Formatar horarios com `Intl.DateTimeFormat(..., { timeZone })`.
- [ ] Remover comparacoes de dia baseadas em timezone local do device quando nao apropriado.

Criterio de aceite:
- "Hoje/amanha" e horarios batem com calendario da cidade.

### 2.4 Offline cache real
- [ ] Conectar `useOfflineWeather` aos hooks reais de clima.
- [ ] Prefixar chaves local cache por tenant+params:
  - `weather:bundle:{tenantKey}:days:{n}:units:{u}:sections:{s}`.
- [ ] Offline badge + timestamp de ultimo payload por cidade.

Criterio de aceite:
- Offline mostra ultimo payload da cidade correta.

## Fase 3 - Features de produto

### 3.1 "Da Praia?" v2
- [ ] Recalibrar algoritmo com pesos por chuva, vento, temp, nebulosidade, ondas.
- [ ] Expor breakdown (`reasons`, `best_window`).
- [ ] Integrar alerta de balneabilidade (quando disponivel).

Criterio de aceite:
- Score 0-10 explicavel e consistente com regras documentadas.

### 3.2 Alertas oficiais
- [ ] Criar `AlertProviderInterface`.
- [ ] Implementar provider inicial (INMET/Defesa Civil).
- [ ] Exibir alertas criticos no topo do modulo clima.

Criterio de aceite:
- Alertas severos aparecem com prioridade e contexto da cidade.

### 3.3 Marine UX (seguranca)
- [ ] Manter disclaimer de "modelo mar aberto" no card de mar.
- [ ] Evitar linguagem de seguranca operacional para navegacao.

Criterio de aceite:
- UX clara sobre limitacoes de precisao costeira.

## Fase 4 - UX de cadastro e consistencia de cidade

### 4.1 CEP x tenant city
- [ ] Validar que CEP pertence a cidade do tenant.
- [ ] Bloquear ou sugerir troca de tenant em mismatch.

### 4.2 Remover hardcode Tijucas no registro
- [ ] Refatorar `RegisterRequest` e `NeighborhoodService` para contexto tenant.
- [ ] Integrar `CitySelector` no fluxo de cadastro quando necessario.

Criterio de aceite:
- Cadastro funciona para qualquer cidade ativa sem forcacao para Tijucas.

## Fase 5 - SEO e performance

### 5.1 Sitemap dinamico por cidade
- [ ] Gerar `sitemap.xml` por cidade e modulos publicos.

### 5.2 Performance operacional
- [ ] Meta de latencia no bundle:
  - cache hit: < 200ms
  - cache miss controlado por lock e timeout.
- [ ] Telemetria de hit/miss/stale/error por cidade.
- [ ] Medir tamanho de payload por `sections`.

### 5.3 Telemetria minima obrigatoria (MVP)
- [ ] `weather_bundle.cache_hit|miss|stale` por cidade.
- [ ] `provider.latency_ms`.
- [ ] `provider.error_rate`.
- [ ] `bundle.payload_kb`.
- [ ] `bundle.sections_requested`.
- [ ] Correlacao por `request_id`.

## Fase 6 - Testes e rollout seguro

### 6.1 Testes backend
- [ ] Unit: provider, score, normalizacao timezone.
- [ ] Feature: weather bundle por cidade + isolamento cache.
- [ ] Concurrency: anti-stampede.
- [ ] Testes de `sections` (cada secao isolada).
- [ ] Teste de circuito aberto (circuit breaker) servindo stale.

### 6.2 Testes frontend
- [ ] Hook tests para query key tenant-aware.
- [ ] E2E de troca de cidade sem vazamento de dados.
- [ ] E2E offline por tenantKey + params.

### 6.3 Rollout
- [ ] Feature flag `weather_v2`.
- [ ] Canary por 1-2 cidades.
- [ ] Plano de rollback (voltar para endpoint legado + cache antigo).

## 6. Ordem sugerida (execucao pragmatica)
1. Corrigir fundamentos de cidade/timezone/cache key (Fase 1.1 + 1.2 + 1.3).  
2. Entregar endpoint `bundle` com cidade real (Fase 1.4).  
3. Ajustar frontend para query keys + `X-City` + timezone local da cidade (Fase 2).  
4. Corrigir home aggregator (bug de leitura `current` e insights) e remover textos hardcoded de Tijucas.  
5. Evoluir features de valor (`Da Praia?`, alertas) e fluxo de cadastro multi-cidade (Fase 3 e 4).  
6. Fechar com SEO/perf, testes e rollout gradual (Fase 5 e 6).

## 6.1 Quick wins (1-2 dias, antes de features)
- [ ] Remover hardcode de Tijucas do provider e cache key.
- [ ] Injetar `X-City` global no `apiClient`.
- [ ] Tornar query keys React Query tenant-aware (`tenantKey`).
- [ ] Tornar chaves IndexedDB tenant-aware.
- [ ] Corrigir bug do HomeAggregator (`current`/`insights`) e fallback textual fixo.
- [ ] Expandir `Tenant::config()` para retornar `timezone` e `is_coastal`.

## 7. Notas importantes para o Timezone ("dia do usuario")
- Backend deve produzir o `daily` no timezone da cidade (IANA), nao no timezone do servidor.
- Frontend deve so formatar; nao deve redefinir o dia civil.
- Sempre retornar `location.timezone` e `generated_at_utc` no payload.

## 8. Riscos de produto e operacao (para acompanhar)
- Risco de dados marinhos nearshore divergirem do observado na praia.
- Risco de limite de provedor externo sob picos sem cache/lock bem configurados.
- Risco de inconsistencias em cidades sem `lat/lon/timezone` completos.
- Risco de regressao sem suite de testes de clima.

## 9. Checklist rapido de PR (Weather 2.0)
- [ ] Nenhuma coordenada/timezone hardcoded no fluxo principal.
- [ ] `bundle` inclui `location.timezone` e `location.is_coastal`.
- [ ] `bundle` inclui `generated_at_utc`, `expires_at_utc`, `stale_until_utc`.
- [ ] Stale fallback funciona com `degraded=true`.
- [ ] `degraded_reason` e `errors.{secao}` seguem formato `null | {code,msg}`.
- [ ] `errors` por secao sem quebrar resposta.
- [ ] Cache keys incluem `tenantKey` + parametros.
- [ ] Frontend envia `X-City` sempre.
- [ ] Response inclui `X-Tenant-City`, `X-Tenant-Timezone`, `X-Tenant-Key`.
- [ ] Query keys e IndexedDB keys sao tenant-aware.
- [ ] Offline mostra ultimo payload da cidade correta.
- [ ] `marine` so roda quando `is_coastal=true` e secao pedida.
- [ ] `request_id` presente em resposta e logs.
- [ ] Telemetria minima por cidade ativa.
