# PR-03 Tasks Detalhadas - Tenant-Safe Networking e Cache Safety

Data: 2026-02-08
Escopo: `apps/web`, `apps/api`
Status geral: `CONCLUIDO`

---

## Objetivo do PR-03

Eliminar risco de vazamento de tenant por chamadas diretas de API no modulo de denuncias e impedir reaproveitamento incorreto de cache entre cidades (client cache + cache intermediario HTTP).

---

## Task Board (com IDs)

### `PR03-T001` - Remover `fetch` direto do mapa de denuncias
Status: `DONE`
Objetivo: garantir que toda chamada de API de denuncias passe pelo `apiClient` tenant-aware.

Subtarefas:
- `PR03-T001.1` Adicionar endpoint dedicado de mapa em config de API.
  - Arquivo: `apps/web/src/api/config.ts`
- `PR03-T001.2` Criar `reportService.getReportsMap(...)` com params de viewport/filtros.
  - Arquivo: `apps/web/src/services/report.service.ts`
- `PR03-T001.3` Migrar `ReportsMapScreen` para usar `reportService.getCategories()` e `reportService.getReportsMap()`.
  - Arquivo: `apps/web/src/screens/ReportsMapScreen.tsx`

Resultado:
- `ReportsMapScreen` nao usa mais `fetch('/api/v1/...')`.
- Requisicoes de mapa e categorias herdam automaticamente `X-City`/tenant context do `apiClient`.

---

### `PR03-T002` - Tornar query keys tenant-scoped (React Query)
Status: `DONE`
Objetivo: evitar cache cross-city ao trocar tenant/cidade.

Subtarefas:
- `PR03-T002.1` Incluir `tenantCacheScope` nas keys de `useMyReports`, `usePublicReports`, `useReportDetail` e `useReportsStats`.
  - Arquivo: `apps/web/src/hooks/useMyReports.ts`
- `PR03-T002.2` Incluir `tenantCacheScope` na key de categorias de denuncias.
  - Arquivo: `apps/web/src/hooks/useReportCategories.ts`
- `PR03-T002.3` Incluir `tenantCacheScope` na key de detalhe de denuncia.
  - Arquivo: `apps/web/src/pages/ReportDetailPage.tsx`
- `PR03-T002.4` Incluir `tenantCacheScope` nas keys de mapa/categorias da tela de mapa.
  - Arquivo: `apps/web/src/screens/ReportsMapScreen.tsx`

Resultado:
- Cache de denuncias agora fica isolado por tenant (`tenantKey` ou `city.slug` fallback).
- Invalidation de mutacoes passou a atuar por prefixo tenant-scoped.

---

### `PR03-T003` - Guardrail de engenharia contra `fetch` direto em denuncias
Status: `DONE`
Objetivo: bloquear regressao futura no modulo.

Subtarefas:
- `PR03-T003.1` Reescrever regra local de lint `no-direct-fetch` para detectar API paths (`/api` e `/v1`).
  - Arquivo: `apps/web/eslint-rules/no-direct-fetch.js`
- `PR03-T003.2` Integrar regra no `eslint.config.js` somente para escopo do modulo de denuncias.
  - Arquivo: `apps/web/eslint.config.js`
- `PR03-T003.3` Ignorar `dev-dist` no lint para reduzir ruido de artefatos.
  - Arquivo: `apps/web/eslint.config.js`

Resultado:
- CI/lint agora falha se algum arquivo de denuncias voltar a usar `fetch` direto para API.

---

### `PR03-T004` - Cache safety no backend (HTTP Vary tenant-aware)
Status: `DONE`
Objetivo: reduzir risco de mistura de resposta em cache intermediario.

Subtarefas:
- `PR03-T004.1` Incluir `Vary: Host, X-City` no `TenantContext` de forma composable.
  - Arquivo: `apps/api/app/Http/Middleware/TenantContext.php`
- `PR03-T004.2` Cobrir comportamento em teste de tenancy.
  - Arquivo: `apps/api/tests/Feature/Tenancy/TenantContextHeadersTest.php`

Resultado:
- Respostas com tenant context informam variacao de cache por host/header de cidade.

---

### `PR03-T005` - Higiene de lint no escopo alterado
Status: `DONE`
Objetivo: fechar PR sem debito de qualidade.

Subtarefas:
- `PR03-T005.1` Tipar `statusConfig` em `ReportPreviewContent` (remover `any`).
  - Arquivo: `apps/web/src/screens/ReportsMapScreen.tsx`
- `PR03-T005.2` Remover `catch {}` vazio no fluxo de compartilhamento.
  - Arquivo: `apps/web/src/screens/ReportsMapScreen.tsx`

Resultado:
- Escopo alterado sem erros de lint.

---

## Evidencias de Teste (Gate da PR)

### 1) Lint web (escopo PR-03)
Comando:
- `pnpm --filter @repo/web exec eslint src/screens/ReportsMapScreen.tsx src/services/report.service.ts src/hooks/useMyReports.ts src/hooks/useReportCategories.ts src/pages/ReportDetailPage.tsx`

Resultado:
- `PASS`

### 2) Teste unitario web (regressao report service)
Comando:
- `pnpm --filter @repo/web test -- src/services/report.service.test.ts`

Resultado:
- `PASS` (4 testes)

### 3) Testes API de tenancy + fluxo critico reports
Comando:
- `php artisan test --testsuite=Feature --filter="(TenantContextHeadersTest|ReportIdempotencyTest|CitizenReportStatusTest)"`

Resultado:
- `PASS` (6 testes, 30 assertions)

---

## Checklist de Saida PR-03

- [x] `ReportsMapScreen` sem `fetch('/api/v1/...')`.
- [x] Endpoint `/reports/map` centralizado em `reportService`.
- [x] Query keys de denuncias tenant-scoped no modulo principal.
- [x] Guardrail de lint ativo contra `fetch` direto em denuncias.
- [x] `Vary: Host, X-City` aplicado no middleware de tenancy.
- [x] Lint e testes do escopo passando.

---

## Observacoes

- O guardrail de lint foi aplicado no escopo do modulo de denuncias para nao gerar quebra massiva imediata em modulos legados que ainda usam `fetch` direto.
- A expansao desse guardrail para todo `apps/web` fica recomendada para PR de governanca (PR-10), junto de migracao gradual dos modulos restantes para `apiClient`.
