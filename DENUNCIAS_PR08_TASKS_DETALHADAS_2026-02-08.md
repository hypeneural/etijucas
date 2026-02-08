# PR-08 Tasks Detalhadas - Conflito de Edicao (409)

Data: 2026-02-08
Escopo: `apps/api`, `apps/web`
Status geral: `CONCLUIDO_TECNICO`

---

## Objetivo do PR-08

Adicionar controle de concorrencia otimista no update de status de denuncias para impedir sobrescrita silenciosa quando o registro foi alterado por outro moderador.

---

## Task Board (com IDs)

### `PR08-T001` - Exigir token de versao no contrato de update status
Status: `DONE`
Objetivo: tornar a precondicao de atualizacao explicita no backend.

Subtarefas:
- `PR08-T001.1` Exigir campo `version` no request de update status.
- `PR08-T001.2` Suportar fallback do header `If-Unmodified-Since` para `version`.
- `PR08-T001.3` Padronizar mensagens de validacao para token ausente/invalido.
- Arquivo: `apps/api/app/Domains/Reports/Http/Requests/UpdateReportStatusRequest.php`

Resultado:
- Endpoint passa a validar precondicao de versao antes de qualquer alteracao de status.

---

### `PR08-T002` - Implementar checagem de versao no controller
Status: `DONE`
Objetivo: bloquear update com token desatualizado.

Subtarefas:
- `PR08-T002.1` Parsear `version` do payload validado.
- `PR08-T002.2` Comparar versao esperada com a versao atual (`updated_at`) do report.
- `PR08-T002.3` Em conflito, retornar `409` com payload atual e `currentVersion`.
- Arquivo: `apps/api/app/Domains/Reports/Http/Controllers/ReportController.php`

Resultado:
- Update concorrente retorna `409 REPORT_STATUS_CONFLICT` sem sobrescrever estado mais novo.

---

### `PR08-T003` - Testes de concorrencia e fallback via header
Status: `DONE`
Objetivo: comprovar comportamento de sucesso/conflito de forma reprodutivel.

Subtarefas:
- `PR08-T003.1` Criar teste de sucesso com `version` atual.
- `PR08-T003.2` Criar teste de conflito com `version` stale.
- `PR08-T003.3` Criar teste de fallback com `If-Unmodified-Since`.
- Arquivo: `apps/api/tests/Feature/Reports/ReportStatusConflictTest.php`

Resultado:
- Comportamento de conflito ficou coberto por suite automatizada.

---

### `PR08-T004` - Preparar front para tratar conflito 409
Status: `DONE`
Objetivo: habilitar UX de refresh/retry no consumidor da API.

Subtarefas:
- `PR08-T004.1` Adicionar helper `isReportStatusConflictError` no service.
- `PR08-T004.2` Adicionar endpoint tipado `updateReportStatus` com `version`.
- `PR08-T004.3` Adicionar testes unitarios para deteccao de erro `409`.
- Arquivos:
  - `apps/web/src/services/report.service.ts`
  - `apps/web/src/services/report.service.test.ts`

Resultado:
- Camada de service pronta para telas mostrarem CTA de refresh quando houver conflito.

---

### `PR08-T005` - Gate de regressao no modulo reports
Status: `DONE`
Objetivo: confirmar que o PR nao quebrou os fluxos criticos ja entregues.

Subtarefas:
- `PR08-T005.1` Rodar suite dedicada de conflito.
- `PR08-T005.2` Rodar regressao combinada (idempotencia, upload limit, visibilidade publica, rate limit).
- `PR08-T005.3` Rodar lint/test web do escopo alterado.

Resultado:
- Escopo backend e frontend validado sem regressao detectada.

---

## Evidencias de Teste (Gate da PR)

### 1) Feature tests de conflito (API)
Comando:
- `php artisan test --filter=ReportStatusConflictTest`

Resultado:
- `PASS` (3 testes, 14 assertions)

### 2) Regressao combinada de reports (API)
Comando:
- `php artisan test --filter="(ReportStatusConflictTest|CitizenReportStatusTest|ReportIdempotencyTest|ReportUploadLimitTest|PublicReportsVisibilityTest|RateLimiterTenantScopeTest)"`

Resultado:
- `PASS` (18 testes, 78 assertions)

### 3) Lint web (escopo alterado)
Comando:
- `pnpm --filter @repo/web exec eslint src/services/report.service.ts src/services/report.service.test.ts`

Resultado:
- `PASS`

### 4) Unit web (escopo alterado)
Comando:
- `pnpm --filter @repo/web test -- src/services/report.service.test.ts`

Resultado:
- `PASS` (1 arquivo, 6 testes)

---

## Checklist de Saida PR-08

- [x] Token de versao exigido no update de status.
- [x] Fallback por header `If-Unmodified-Since` suportado.
- [x] Conflito `409` com payload atual implementado.
- [x] Suite de testes de conflito adicionada e passando.
- [x] Service web preparado para deteccao de conflito.
- [ ] CTA visual de refresh/retry integrado na tela que editar status.

---

## Observacoes

- Para ambientes sem precisao sub-segundo em `updated_at`, o teste de stale version usa intervalo >1s para garantir diferenca observavel de versao.
- O endpoint ja esta pronto para UX de refresh/retry; a integracao visual depende da tela consumidora de update status.
