# PR-07 Tasks Detalhadas - Rate Limiting Dedicado por Tenant+IP

Data: 2026-02-08
Escopo: `apps/api`
Status geral: `CONCLUIDO_TECNICO`

---

## Objetivo do PR-07

Implementar rate limiting dedicado para o modulo de denuncias com isolamento por `tenant + ip`, mantendo seguranca anti-spam sem degradar tenants vizinhos.

---

## Task Board (com IDs)

### `PR07-T001` - Criar limiters nomeados para criacao e upload de midia
Status: `DONE`
Objetivo: separar politicas de limite do modulo de denuncias.

Subtarefas:
- `PR07-T001.1` Criar limiter `reports-create` com limite de `10/h`.
- `PR07-T001.2` Criar limiter `reports-media` com limite de `30/h`.
- `PR07-T001.3` Definir chave com escopo `tenant_city_id + ip`.
- Arquivo: `apps/api/app/Providers/AppServiceProvider.php`

Resultado:
- Limiters dedicados ativos com chaves isoladas por tenant e IP.

---

### `PR07-T002` - Aplicar throttles dedicados nas rotas criticas
Status: `DONE`
Objetivo: garantir enforcement real no endpoint de criacao e upload.

Subtarefas:
- `PR07-T002.1` Aplicar `throttle:reports-create` em `POST /api/v1/reports`.
- `PR07-T002.2` Aplicar `throttle:reports-media` em `POST /api/v1/reports/{id}/media`.
- `PR07-T002.3` Remover throttle generico herdado no grupo autenticado de reports.
- Arquivo: `apps/api/routes/api.php`

Resultado:
- Regras dedicadas aplicadas por rota sem conflito com throttle generico.

---

### `PR07-T003` - Instrumentar logs de bloqueio para auditoria
Status: `DONE`
Objetivo: dar visibilidade operacional para abuso por tenant/IP.

Subtarefas:
- `PR07-T003.1` Adicionar callback `response(...)` nos limiters para retorno 429 padronizado.
- `PR07-T003.2` Registrar `Log::warning` com `tenant_city_id`, `ip`, `user_id`, `path`, `method`.
- `PR07-T003.3` Definir codigos de erro dedicados:
  - `REPORTS_CREATE_RATE_LIMITED`
  - `REPORTS_MEDIA_RATE_LIMITED`
- Arquivo: `apps/api/app/Providers/AppServiceProvider.php`

Resultado:
- Bloqueios de rate limit sao auditaveis com contexto completo por tenant/IP.

---

### `PR07-T004` - Cobertura automatizada de escopo e isolamento por tenant
Status: `DONE`
Objetivo: provar tecnicamente que tenant A bloqueado nao afeta tenant B.

Subtarefas:
- `PR07-T004.1` Validar key/limite do `reports-create`.
- `PR07-T004.2` Validar key/limite do `reports-media`.
- `PR07-T004.3` Simular tenant A no limite maximo e confirmar tenant B livre.
- Arquivo: `apps/api/tests/Unit/Providers/RateLimiterTenantScopeTest.php`

Resultado:
- Isolamento entre tenants comprovado por teste automatizado.

---

### `PR07-T005` - Gate tecnico e regressao do modulo de reports
Status: `DONE`
Objetivo: fechar PR com evidencias de estabilidade no escopo.

Subtarefas:
- `PR07-T005.1` Rodar suite de unit do limiter tenant-scoped.
- `PR07-T005.2` Rodar regressao de features criticas de reports.

Resultado:
- PR validado com testes passando no backend.

---

## Evidencias de Teste (Gate da PR)

### 1) Unit tests de rate limiter tenant-scoped
Comando:
- `php artisan test --filter=RateLimiterTenantScopeTest`

Resultado:
- `PASS` (5 testes, 16 assertions)

### 2) Regressao de features criticas do modulo reports
Comando:
- `php artisan test --filter="(ReportUploadLimitTest|ReportIdempotencyTest|PublicReportsVisibilityTest|CitizenReportStatusTest)"`

Resultado:
- `PASS` (10 testes, 48 assertions)

---

## Checklist de Saida PR-07

- [x] Limiters dedicados por tenant+ip implementados.
- [x] Rotas de criacao/upload usando throttles dedicados.
- [x] Respostas 429 padronizadas por tipo de bloqueio.
- [x] Logs de auditoria com contexto minimo operacional.
- [x] Testes de isolamento por tenant passando.
- [x] Regressao do modulo reports passando.
- [ ] Validacao manual em ambiente integrado dos logs de bloqueio (observabilidade operacional).

---

## Observacoes

- O PR manteve o comportamento tenant-aware existente e isolou somente o escopo de denuncias para evitar interferencia com outros modulos.
- A validacao manual de logs em ambiente integrado permanece recomendada antes de promover para producao.
