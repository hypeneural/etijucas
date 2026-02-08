# WEATHER_TASKS_EXECUCAO_PR.md - Plano de Execucao Weather 2.0 (PR por PR)

Data: 2026-02-08  
Base: `WEATHER_MULTI_TENANCY_ANALISE_COMPLETA.md`  
Objetivo: executar Weather 2.0 com PRs pequenos, rastreaveis e com baixo risco  
Codificacao obrigatoria: UTF-8 sem BOM

---

## 1. Regras globais de execucao

- [ ] Nao criar arquivo com BOM.
- [ ] Manter arquivos texto em UTF-8 sem BOM.
- [ ] Evitar copy/paste de texto com encoding quebrado (especialmente de docs externas).
- [ ] Validar encoding antes de commit.
- [ ] Nao subir PR sem plano de rollback.
- [ ] Nao subir PR sem testes minimos automatizados.
- [ ] Nao misturar refactor grande com feature no mesmo PR.

Comando de verificacao BOM (PowerShell):

```powershell
Get-ChildItem -Recurse -File -Include *.php,*.ts,*.tsx,*.js,*.md,*.json | ForEach-Object {
  $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    $_.FullName
  }
}
```

Se o comando retornar arquivos, corrigir antes do commit.

---

## 2. Ordem obrigatoria dos PRs

1. PR-WTH-000 Guardrails de encoding e padrao Weather 2.0  
2. PR-WTH-001 Dados de cidade: `is_coastal`, qualidade de lat/lon/timezone e seeds  
3. PR-WTH-002 Tenant source of truth: `tenant_key` e headers `X-Tenant-*`  
4. PR-WTH-003 Arquitetura base: Contracts + Provider interface + Service novo  
5. PR-WTH-004 Cache robusto: Redis+DB, soft/hard TTL, jitter, lock, stale-if-busy, circuit breaker  
6. PR-WTH-005 Endpoint `GET /api/v1/weather/bundle` com `sections` e contrato 2.0  
7. PR-WTH-006 Frontend transporte tenant-aware (`X-City`, tenantKey, validacao URL)  
8. PR-WTH-007 Frontend cache tenant-aware (React Query + IndexedDB + offline real)  
9. PR-WTH-008 UI/UX clima timezone-safe e consumo por secoes  
10. PR-WTH-009 Correcao HomeAggregator + limpeza de fallback hardcoded  
11. PR-WTH-010 Telemetria, testes de regressao e hardening  
12. PR-WTH-011 Rollout controlado com feature flag e canary por cidade

---

## 3. PR-WTH-000 - Guardrails de encoding e padrao Weather 2.0 (P0)

Objetivo: travar riscos basicos de encoding e alinhar padrao para os proximos PRs.

Subtarefas:
- [ ] Criar checklist de PR weather no repositorio (separado do checklist tenancy geral).
- [ ] Adicionar script/etapa CI para detectar BOM em arquivos alterados.
- [ ] Documentar naming padrao de cache keys de weather.
- [ ] Documentar contrato minimo de `bundle` v2.0 (campos obrigatorios).
- [ ] Definir convencao de branch para PR weather (`feature/weather-wth-xxx`).

Arquivos alvo:
- [ ] `WEATHER_TASKS_EXECUCAO_PR.md`
- [ ] `TENANCY_PR_CHECKLIST.md` (secao weather, se necessario)
- [ ] scripts CI (onde o projeto ja concentra validacoes)

Testes:
- [ ] Fixture com BOM deve falhar na verificacao.
- [ ] Fixture sem BOM deve passar.

Criterio de aceite:
- [ ] CI bloqueia BOM.
- [ ] Time possui padrao unico para iniciar os PRs weather.

Rollback:
- [ ] Reverter somente guardrails novos se gerar falso positivo.

---

## 4. PR-WTH-001 - Dados de cidade e seeds (P0)

Objetivo: garantir base de dados correta para weather por cidade.

Subtarefas:
- [ ] Criar migration para `cities.is_coastal` (boolean, default false, index).
- [ ] Criar script de auditoria para cidades ativas sem `lat/lon/timezone`.
- [ ] Corrigir seeds de cidades foco (Tijucas, Porto Belo, Itapema, Balneario Camboriu, Canelinha).
- [ ] Validar e corrigir inconsistencia de IBGE em `CitiesSeeder`.
- [ ] Garantir timezone IANA valido em cidades ativas.

Arquivos alvo:
- [ ] `apps/api/database/migrations/*_add_is_coastal_to_cities.php`
- [ ] `apps/api/database/seeders/CitiesSeeder.php`
- [ ] `apps/api/database/seeders/FullBrazilianCitiesSeeder.php`
- [ ] comando de auditoria (se criar)

Testes:
- [ ] Migration up/down.
- [ ] Seeder preenche `is_coastal` corretamente nas cidades foco.
- [ ] Teste de validacao de timezone IANA para cidades ativas.

Teste manual:
- [ ] Conferir no banco cidades foco com lat/lon/timezone/is_coastal corretos.

Criterio de aceite:
- [ ] Nenhuma cidade ativa sem lat/lon/timezone.
- [ ] `is_coastal` pronto para regras de marine.

Rollback:
- [ ] Migration down remove apenas `is_coastal`.
- [ ] Seeder pode ser reexecutado sem duplicar dados.

---

## 5. PR-WTH-002 - Tenant source of truth (tenant_key + headers) (P0)

Objetivo: criar base canonica de tenant para backend e frontend.

Subtarefas:
- [ ] Calcular `tenant_key` no `TenantContext` com slug|timezone|status|brand_hash.
- [ ] Publicar headers em respostas API:
- [ ] `X-Tenant-City`
- [ ] `X-Tenant-Timezone`
- [ ] `X-Tenant-Key`
- [ ] Expor `timezone` e `is_coastal` em `Tenant::config()`.
- [ ] Atualizar tipos de tenant no `packages/sdk`.

Arquivos alvo:
- [ ] `apps/api/app/Http/Middleware/TenantContext.php`
- [ ] `apps/api/app/Support/Tenant.php`
- [ ] `apps/api/app/Http/Controllers/Api/V1/ConfigController.php`
- [ ] `packages/sdk/src/tenant-config.ts`

Testes:
- [ ] Feature test de headers `X-Tenant-*` em rotas v1.
- [ ] Teste de consistencia `tenant_key` para mesma cidade.
- [ ] Teste de mudanca de `tenant_key` quando muda cidade.

Teste manual:
- [ ] `curl /api/v1/config` com cidades diferentes e verificar headers.

Criterio de aceite:
- [ ] Tenant pode ser rastreado por headers em toda resposta.

Rollback:
- [ ] Manter calculo de tenant antigo e desligar headers novos por flag, se necessario.

---

## 6. PR-WTH-003 - Arquitetura base Weather 2.0 (P0)

Objetivo: introduzir estrutura nova sem trocar comportamento em producao.

Subtarefas:
- [ ] Criar estrutura:
- [ ] `Domains/Weather/Contracts`
- [ ] `Domains/Weather/Providers`
- [ ] `Domains/Weather/Services`
- [ ] `Domains/Weather/Http`
- [ ] `Domains/Weather/Support`
- [ ] Criar `WeatherOptions` DTO.
- [ ] Criar `WeatherProviderInterface`.
- [ ] Criar `OpenMeteoProvider` com `capabilities()`.
- [ ] Criar `WeatherServiceV2` (orquestrador) com dependencias injetadas.
- [ ] Manter service legado intacto neste PR (sem troca de rota).

Arquivos alvo:
- [ ] novos arquivos em `apps/api/app/Domains/Weather/*`
- [ ] `apps/api/app/Providers/*` (bindings DI, se aplicavel)

Testes:
- [ ] Unit para DTO e interface contracts.
- [ ] Unit para capabilities do provider.
- [ ] Unit para normalizer base.

Criterio de aceite:
- [ ] Estrutura nova pronta, sem impacto funcional ainda.

Rollback:
- [ ] Remover bindings novos e manter somente service legado.

---

## 7. PR-WTH-004 - Cache robusto e resiliencia (P0)

Objetivo: implementar cache profissional com degradacao controlada.

Subtarefas:
- [ ] Definir padrao de chave:
- [ ] `weather:bundle:{citySlug}:tz:{tz}:u:{units}:days:{days}:sections:{sections}:v1`
- [ ] Implementar cache quente em Redis.
- [ ] Persistir cache frio em `external_api_cache`.
- [ ] Implementar Soft TTL (revalidacao) e Hard TTL (stale seguro).
- [ ] Implementar lock por chave (`Cache::lock`).
- [ ] Implementar jitter de TTL (+/-10%).
- [ ] Implementar `stale-if-busy` quando lock nao for adquirido.
- [ ] Implementar circuit breaker por cidade/chave:
- [ ] abrir com 3 falhas em 2 min
- [ ] manter aberto por 1-2 min
- [ ] durante circuito aberto, servir stale com `degraded=true`

Arquivos alvo:
- [ ] `apps/api/app/Domains/Weather/Services/WeatherServiceV2.php`
- [ ] `apps/api/app/Domains/Weather/Support/*`
- [ ] `apps/api/app/Domains/Weather/Models/ExternalApiCache.php`

Testes:
- [ ] Unit: key builder e TTL policy.
- [ ] Unit: jitter range.
- [ ] Unit: stale-if-busy path.
- [ ] Unit: circuit breaker open/half-open/closed.
- [ ] Feature: cache hit/miss/stale por cidade.

Criterio de aceite:
- [ ] Nao ha stampede em carga concorrente da mesma chave.
- [ ] Fallback stale funciona com `degraded=true`.

Rollback:
- [ ] Flag para desativar circuit breaker e voltar para lock simples.

---

## 8. PR-WTH-005 - Endpoint Weather Bundle 2.0 (P0)

Objetivo: disponibilizar endpoint unico, tenant-aware e autoexplicavel.

Subtarefas:
- [ ] Criar `GET /api/v1/weather/bundle`.
- [ ] Adicionar query param `sections`.
- [ ] Adicionar query params de controle (`days`, `units`) com validacao.
- [ ] Retornar contrato 2.0:
- [ ] `contract_version`
- [ ] `provider`
- [ ] `request_id`
- [ ] `location` completo
- [ ] `cache` completo (`generated_at_utc`, `expires_at_utc`, `stale_until_utc`, `degraded`, `degraded_reason`)
- [ ] `errors` por secao no formato `null | {code,msg}`
- [ ] `data` por secao
- [ ] Aplicar marine somente se cidade costeira e secao pedida.
- [ ] Garantir controller magro (orquestracao apenas).

Arquivos alvo:
- [ ] `apps/api/routes/api.php`
- [ ] `apps/api/app/Domains/Weather/Http/Controllers/WeatherBundleController.php`
- [ ] `apps/api/app/Domains/Weather/Http/Requests/WeatherBundleRequest.php`
- [ ] `apps/api/app/Domains/Weather/Http/Resources/WeatherBundleResource.php`

Testes:
- [ ] Feature: retorna dados corretos por cidade.
- [ ] Feature: `sections=current` retorna apenas current.
- [ ] Feature: cidade nao costeira nao retorna marine.
- [ ] Feature: erro de uma secao nao quebra payload inteiro.
- [ ] Feature: headers `X-Tenant-*` + request_id presentes.

Teste manual:
- [ ] Chamar bundle para Tijucas e Canelinha e comparar location/timezone.

Criterio de aceite:
- [ ] Bundle pronto para substituir endpoints antigos no frontend.

Rollback:
- [ ] Manter endpoints legados ativos e controlar bundle por feature flag.

---

## 9. PR-WTH-006 - Frontend transporte tenant-aware (P0)

Objetivo: eliminar chamadas sem contexto de cidade.

Subtarefas:
- [ ] Injetar `X-City` global no `apiClient` a partir do tenant store.
- [ ] Ler `X-Tenant-Key` nas respostas e sincronizar no store.
- [ ] Validar coerencia URL `/uf/cidade` vs cidade no store.
- [ ] Definir comportamento de conflito (URL canonica vence).
- [ ] Garantir que chamadas weather usem tenant atual sempre.

Arquivos alvo:
- [ ] `apps/web/src/api/client.ts`
- [ ] `apps/web/src/store/useTenantStore.ts`
- [ ] hooks de rota tenant-aware

Testes:
- [ ] Unit: header `X-City` presente em requests.
- [ ] Unit: atualizacao de tenantKey no store.
- [ ] Integration: troca de cidade atualiza contexto de requests.

Teste manual:
- [ ] Navegar entre `/sc/tijucas/previsao` e `/sc/canelinha/previsao`.

Criterio de aceite:
- [ ] Nenhuma chamada weather sem contexto de tenant.

Rollback:
- [ ] Flag para fallback de transporte antigo em caso de regressao.

---

## 10. PR-WTH-007 - React Query + IndexedDB tenant-aware (P0)

Objetivo: impedir cache bleed entre cidades e ativar offline real.

Subtarefas:
- [ ] Alterar query keys de weather para:
- [ ] `['weather', 'bundle', tenantKey, days, units, sections]`
- [ ] Revisar hooks de weather para incluir params na key.
- [ ] Atualizar chaves do IndexedDB:
- [ ] `weather:bundle:{tenantKey}:days:{n}:units:{u}:sections:{s}`
- [ ] Integrar `useOfflineWeather` aos hooks reais.
- [ ] Exibir status offline + "atualizado em ...".

Arquivos alvo:
- [ ] `apps/web/src/services/weather.service.ts`
- [ ] `apps/web/src/services/weather-cache.service.ts`
- [ ] `apps/web/src/hooks/useOfflineWeather.ts`
- [ ] componentes de indicador offline de weather

Testes:
- [ ] Unit: key builder de React Query com tenantKey.
- [ ] Unit: key builder de IndexedDB com tenantKey+params.
- [ ] E2E: troca de cidade nao reaproveita cache da outra cidade.
- [ ] E2E: offline mostra ultimo payload correto da cidade atual.

Criterio de aceite:
- [ ] Nao ha vazamento de cache entre cidades.

Rollback:
- [ ] Voltar para fetch online-only temporario por flag.

---

## 11. PR-WTH-008 - UI Weather timezone-safe e secoes (P1)

Objetivo: frontend exibir dia/horario corretos da cidade e carregar so o necessario.

Subtarefas:
- [x] WeatherPage usar endpoint bundle.
- [x] Home widget usar `sections=current`.
- [x] Tela detalhada usar `sections=current,hourly,daily,insights`.
- [x] Marine renderizar somente quando existir secao e `is_coastal=true`.
- [x] Formatar datas/horarios com `location.timezone`.
- [x] Remover comparacoes de dia baseadas no timezone do device.

Arquivos alvo:
- [x] `apps/web/src/pages/WeatherPage.tsx`
- [x] `apps/web/src/components/weather/WeatherHomeCard.tsx`
- [x] `apps/web/src/types/weather.ts`

Testes:
- [x] Unit: helpers de data usando timezone do payload.
- [ ] E2E: "Hoje" consistente com timezone da cidade.
- [ ] E2E: cidade nao costeira nao mostra bloco marine.

Teste manual:
- [ ] Simular timezone local diferente e validar output.

Criterio de aceite:
- [x] Dia civil e horarios corretos por cidade.

Rollback:
- [ ] Manter fallback para endpoints legados enquanto bundle estabiliza.

---

## 12. PR-WTH-009 - HomeAggregator fix e limpeza de hardcode (P1)

Objetivo: corrigir bug funcional da home e remover texto fixo de Tijucas.

Subtarefas:
- [x] Ajustar `getWeatherBrief()` para ler payload correto do service.
- [x] Ajustar leitura de insights (lista, nao mapa fixo).
- [x] Remover fallback textual hardcoded "Tempo bom em Tijucas".
- [x] Usar cidade atual no texto/fallback dinamico.

Arquivos alvo:
- [x] `apps/api/app/Domains/Home/Services/HomeAggregatorService.php`

Testes:
- [x] Unit: weather mini monta dados corretos quando bundle responde.
- [x] Unit: fallback dinamico usa cidade tenant atual.
- [ ] Feature: home retorna bloco weather_mini coerente.

Criterio de aceite:
- [x] Home deixa de depender de fallback fixo de Tijucas.

Rollback:
- [ ] Voltar para fallback generico sem cidade fixa.

---

## 13. PR-WTH-010 - Telemetria e testes de regressao (P1)

Objetivo: adicionar observabilidade minima e cobertura de risco.

Subtarefas:
- [ ] Instrumentar metricas:
- [ ] `weather_bundle.cache_hit|miss|stale`
- [ ] `provider.latency_ms`
- [ ] `provider.error_rate`
- [ ] `bundle.payload_kb`
- [ ] `bundle.sections_requested`
- [ ] Correlacionar logs por `request_id` e `tenant_key`.
- [ ] Criar suite de testes de regressao multi-cidade para weather.

Arquivos alvo:
- [ ] `apps/api/app/Domains/Weather/*`
- [ ] testes em `apps/api/tests/*`
- [ ] dashboards/queries (conforme stack de observabilidade atual)

Testes:
- [ ] Unit e feature para metricas emitidas.
- [ ] Feature para erro parcial por secao.
- [ ] Concurrency test de lock/circuit breaker.

Criterio de aceite:
- [ ] Time consegue rastrear incidente weather por request e cidade.

Rollback:
- [ ] Desativar emissao de metricas nao criticas por flag.

---

## 14. PR-WTH-011 - Rollout controlado (P2)

Objetivo: colocar em producao sem risco alto.

Subtarefas:
- [ ] Criar feature flag `weather_v2`.
- [ ] Habilitar canary por cidade (ex.: Tijucas e Porto Belo).
- [ ] Definir criterio de promocao para 100% das cidades.
- [ ] Definir gatilhos de rollback (erro_rate, latencia, incidentes tenant).
- [ ] Publicar runbook operacional weather (incidente + rollback).

Arquivos alvo:
- [ ] config/flags (backend e frontend)
- [ ] docs de operacao

Testes:
- [ ] Feature test com flag ON/OFF.
- [ ] Smoke test canary por cidade.

Criterio de aceite:
- [ ] Rollout e rollback executaveis em minutos.

Rollback:
- [ ] Desligar `weather_v2` e voltar para endpoints legados.

---

## 15. Definition of Done do MVP Weather 2.0

- [ ] Nenhuma coordenada/timezone hardcoded no fluxo principal.
- [x] `bundle` inclui timezone da cidade e metadados de cache.
- [x] Cache keys backend incluem tenant + params.
- [x] Frontend envia `X-City` sempre.
- [x] Query keys e IndexedDB keys sao tenant-aware.
- [ ] Offline mostra ultimo payload da cidade correta.
- [x] Stale fallback ativo com `degraded=true`.
- [x] Erros por secao nao quebram tela.
- [x] Marine somente para cidade costeira quando secao pedida.
- [ ] Suite minima de testes backend/frontend cobrindo troca de cidade.

---

## 16. Sprint de arranque recomendada (primeiros 7 dias)

Dia 1:
- [ ] PR-WTH-000
- [ ] PR-WTH-001 (migration + seed + auditoria)

Dia 2:
- [ ] PR-WTH-002
- [ ] PR-WTH-003 (estrutura base)

Dia 3:
- [ ] PR-WTH-004 (cache/resiliencia)

Dia 4:
- [ ] PR-WTH-005 (bundle endpoint)

Dia 5:
- [ ] PR-WTH-006 (apiClient tenant-aware)
- [ ] PR-WTH-007 (query/IndexedDB tenant-aware)

Dia 6:
- [ ] PR-WTH-008 (UI timezone-safe)

Dia 7:
- [ ] PR-WTH-009 + PR-WTH-010 (home fix + telemetria/testes)

---

## 17. Matriz de dependencias (nao quebrar ordem)

- `PR-WTH-000` depende de: nenhum.
- `PR-WTH-001` depende de: `PR-WTH-000`.
- `PR-WTH-002` depende de: `PR-WTH-001`.
- `PR-WTH-003` depende de: `PR-WTH-001`.
- `PR-WTH-004` depende de: `PR-WTH-003`.
- `PR-WTH-005` depende de: `PR-WTH-002` + `PR-WTH-004`.
- `PR-WTH-006` depende de: `PR-WTH-002`.
- `PR-WTH-007` depende de: `PR-WTH-006` + `PR-WTH-005`.
- `PR-WTH-008` depende de: `PR-WTH-007` + `PR-WTH-005`.
- `PR-WTH-009` depende de: `PR-WTH-005`.
- `PR-WTH-010` depende de: `PR-WTH-005`.
- `PR-WTH-011` depende de: `PR-WTH-008` + `PR-WTH-010`.

Regra:
- [ ] Nao iniciar PR sem PR dependente mergeado.
- [ ] Se dependencia atrasar, quebrar escopo em PR de preparacao (sem mudanca funcional).

---

## 18. Backlog operacional (subtarefas com ID)

Uso:
- Cada item abaixo vira task no board (Jira/Linear/GitHub Projects).
- Prefixo de branch por task: `feature/weather-wth-xxx-yy`.
- Marcar dono e data no board, nao neste arquivo.

### 18.1 PR-WTH-000 (guardrails)

- [x] `WTH-000-01` Criar script `check:weather` e incluir no pipeline `pnpm ci`.
- [x] `WTH-000-02` Garantir validacao de BOM para arquivos weather docs/scripts.
- [x] `WTH-000-03` Publicar `WEATHER_BUNDLE_CONTRACT_V2.md`.
- [x] `WTH-000-04` Publicar `WEATHER_CACHE_KEYS_PADRAO.md`.
- [x] `WTH-000-05` Publicar `WEATHER_PR_CHECKLIST.md`.
- [x] `WTH-000-06` Rodar `pnpm check:weather` e anexar evidencias no PR.

### 18.2 PR-WTH-001 (dados de cidade)

- [x] `WTH-001-01` Criar migration `add_is_coastal_to_cities`.
- [x] `WTH-001-02` Atualizar `City` model (`fillable`, `casts`) para `is_coastal`.
- [x] `WTH-001-03` Corrigir IBGE de Tijucas nos seeders/comandos legados.
- [x] `WTH-001-04` Atualizar `CitiesSeeder` com cidades foco e `is_coastal`.
- [x] `WTH-001-05` Atualizar `FullBrazilianCitiesSeeder` para incluir `is_coastal=false` default.
- [x] `WTH-001-06` Criar comando de auditoria de cidades ativas sem `lat/lon/timezone`.
- [x] `WTH-001-07` Criar teste de migration up/down.
- [x] `WTH-001-08` Criar teste de seeder (cidades foco + timezone IANA valido).
- [ ] `WTH-001-09` Teste manual banco: Tijucas/Porto Belo/Itapema/Balneario Camboriu/Canelinha.

### 18.3 PR-WTH-002 (tenant source of truth)

- [x] `WTH-002-01` Gerar `tenant_key` canonico no `TenantContext`.
- [x] `WTH-002-02` Adicionar headers `X-Tenant-City`, `X-Tenant-Timezone`, `X-Tenant-Key`.
- [x] `WTH-002-03` Expor `timezone` e `is_coastal` em `Tenant::config()`.
- [x] `WTH-002-04` Atualizar `ConfigController` para refletir novo payload.
- [x] `WTH-002-05` Atualizar tipos no `packages/sdk`.
- [x] `WTH-002-06` Criar testes de consistencia de `tenant_key` e headers.

### 18.4 PR-WTH-003 (arquitetura base)

- [x] `WTH-003-01` Criar `WeatherOptions` DTO.
- [x] `WTH-003-02` Criar `WeatherProviderInterface` + contrato de `capabilities()`.
- [x] `WTH-003-03` Criar `OpenMeteoProvider` (sem trocar endpoint legado).
- [x] `WTH-003-04` Criar `WeatherServiceV2` com DI.
- [x] `WTH-003-05` Criar normalizer central em `Domains/Weather/Support`.
- [x] `WTH-003-06` Adicionar bindings no container.
- [x] `WTH-003-07` Criar unit tests de DTO/interface/capabilities.

### 18.5 PR-WTH-004 (cache e resiliencia)

- [x] `WTH-004-01` Implementar key builder canonico de weather.
- [x] `WTH-004-02` Implementar soft TTL e hard TTL por secao.
- [x] `WTH-004-03` Implementar jitter de TTL (+/-10%).
- [x] `WTH-004-04` Implementar lock com `Cache::lock`.
- [x] `WTH-004-05` Implementar stale-if-busy.
- [x] `WTH-004-06` Integrar cache frio em `external_api_cache`.
- [x] `WTH-004-07` Implementar circuit breaker por cidade/chave.
- [x] `WTH-004-08` Adicionar metadados `degraded` e `degraded_reason`.
- [x] `WTH-004-09` Criar unit tests de lock/jitter/circuit/ttl.

### 18.6 PR-WTH-005 (bundle endpoint)

- [x] `WTH-005-01` Criar `WeatherBundleRequest` com validacao (`sections`, `days`, `units`).
- [x] `WTH-005-02` Criar `WeatherBundleController` magro.
- [x] `WTH-005-03` Criar `WeatherBundleResource` com contrato `2.0`.
- [x] `WTH-005-04` Incluir `request_id` em body e header.
- [x] `WTH-005-05` Incluir `errors` por secao sem quebra geral.
- [x] `WTH-005-06` Habilitar marine so para `is_coastal=true` e secao solicitada.
- [x] `WTH-005-07` Criar feature tests de `sections` e erro parcial.

### 18.7 PR-WTH-006 (frontend transporte)

- [x] `WTH-006-01` Injetar `X-City` global no `apiClient`.
- [x] `WTH-006-02` Capturar `X-Tenant-Key` das responses e sincronizar store.
- [x] `WTH-006-03` Validar URL `/uf/cidade` versus store e resolver conflito.
- [x] `WTH-006-04` Criar unit tests do transporte tenant-aware.

### 18.8 PR-WTH-007 (frontend cache e offline)

- [x] `WTH-007-01` Migrar hooks para query key tenant-aware completa.
- [x] `WTH-007-02` Migrar IndexedDB keys para tenant-aware com params.
- [x] `WTH-007-03` Integrar `useOfflineWeather` aos hooks reais.
- [x] `WTH-007-04` Exibir badge offline com `updated_at` do payload local.
- [x] `WTH-007-05` Criar testes de nao-vazamento entre cidades.

### 18.9 PR-WTH-008 (UI timezone-safe)

- [x] `WTH-008-01` Home chamar `sections=current`.
- [x] `WTH-008-02` Pagina clima chamar `sections=current,hourly,daily,insights`.
- [x] `WTH-008-03` Formatar datas somente com `location.timezone`.
- [x] `WTH-008-04` Esconder bloco marine para cidade nao costeira.
- [x] `WTH-008-05` Criar testes de dia civil por timezone.

### 18.10 PR-WTH-009 (HomeAggregator)

- [x] `WTH-009-01` Corrigir leitura de `current` no payload.
- [x] `WTH-009-02` Corrigir leitura de insights (lista).
- [x] `WTH-009-03` Remover fallback fixo de Tijucas.
- [x] `WTH-009-04` Testar fallback dinamico por tenant atual.
- [x] `WTH-009-05` Refatorar endpoints weather legados para Tenant::city() e WeatherServiceV2.

### 18.11 PR-WTH-010 (telemetria e regressao)

- [x] `WTH-010-01` Emitir metricas de cache hit/miss/stale.
- [x] `WTH-010-02` Emitir latencia e erro do provider.
- [x] `WTH-010-03` Emitir tamanho de payload e secoes pedidas.
- [x] `WTH-010-04` Correlacionar logs por `request_id` + `tenant_key`.
- [x] `WTH-010-05` Criar suite de regressao multi-cidade.

### 18.12 PR-WTH-011 (rollout)

- [x] `WTH-011-01` Criar flag `weather_v2` backend/frontend.
- [x] `WTH-011-02` Configurar canary por cidade.
- [x] `WTH-011-03` Definir SLO de promocao para 100%.
- [x] `WTH-011-04` Publicar runbook de incidente/rollback weather.

---

## 19. Template minimo por PR (copiar no corpo do PR)

```md
## Objetivo
- [ ] Entregar PR-WTH-XXX sem alterar escopo paralelo.

## Subtarefas entregues
- [ ] WTH-XXX-01
- [ ] WTH-XXX-02

## Evidencias
- [ ] pnpm check:tenancy
- [ ] pnpm check:weather
- [ ] testes backend/frontend relevantes

## Riscos e rollback
- Risco principal:
- Mitigacao:
- Comando/acao de rollback:
```

---

## 20. Gate anti-encoding antes de commit

Checklist obrigatorio local:
- [ ] `pnpm check:weather`
- [ ] `pnpm check:tenancy`
- [ ] Verificacao manual BOM em arquivos alterados
- [ ] Confirmar arquivos salvos como UTF-8 sem BOM no editor

Comando sugerido (PowerShell, arquivos staged):

```powershell
$files = git diff --cached --name-only
foreach ($f in $files) {
  if (Test-Path $f) {
    $b = [System.IO.File]::ReadAllBytes($f)
    if ($b.Length -ge 3 -and $b[0] -eq 0xEF -and $b[1] -eq 0xBB -and $b[2] -eq 0xBF) {
      Write-Host "BOM detectado: $f"
    }
  }
}
```

Se houver saida:
- [ ] remover BOM,
- [ ] rodar checks novamente,
- [ ] somente depois commitar.

---

## 21. Pendencias reais apos validacao tecnica (2026-02-08)

Itens ainda pendentes para fechar weather sem ruido:

- [ ] `WTH-001-09` Teste manual no banco das cidades foco.
- [ ] `WTH-008` E2E/UI: validar "Hoje" por timezone e ausencia de marine em nao costeira.
- [ ] `WTH-009` Feature test da home (`weather_mini`) fim-a-fim.
