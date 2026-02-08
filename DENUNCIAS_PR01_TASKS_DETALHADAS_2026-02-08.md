# PR-01 Tasks Detalhadas - Idempotencia Real (Front + API)

Data: 2026-02-08
Escopo: `apps/web`, `apps/api`
Status geral: `CONCLUIDO`

---

## Objetivo do PR-01

Garantir idempotencia real no fluxo de criacao de denuncias, eliminando duplicacao silenciosa em retries de rede, com comportamento deterministico e cobertura automatizada.

---

## Task Board (com IDs)

### `PR01-T001` - Padronizar Idempotency Key no Front para UUID v4
Status: `DONE`
Objetivo: garantir formato compativel com validacao backend.

Subtarefas:
- `PR01-T001.1` Atualizar gerador de key para UUID v4.
  - Arquivo: `apps/web/src/types/report.ts`
- `PR01-T001.2` Garantir que o draft inicial use a key UUID v4.
  - Arquivo: `apps/web/src/types/report.ts`

Resultado:
- `generateIdempotencyKey()` agora usa `generateUUID()`.

---

### `PR01-T002` - Separar ID de armazenamento do draft vs idempotencyKey de request
Status: `DONE`
Objetivo: impedir sobrescrita de idempotencyKey com `active-report-draft`.

Subtarefas:
- `PR01-T002.1` Introduzir storage key fixa para draft ativo sem tocar na idempotency key.
  - Arquivo: `apps/web/src/hooks/useReportDraft.ts`
- `PR01-T002.2` Normalizar drafts legados com key invalida (auto-regeneracao UUID).
  - Arquivo: `apps/web/src/hooks/useReportDraft.ts`
- `PR01-T002.3` Ajustar persistencia IDB para aceitar `draftStorageId` explicito.
  - Arquivo: `apps/web/src/lib/idb/reportDraftDB.ts`
- `PR01-T002.4` Preservar `createdAt` original no IDB (evitar reset em cada save).
  - Arquivo: `apps/web/src/lib/idb/reportDraftDB.ts`

Resultado:
- Draft continua salvo em `active-report-draft`.
- `idempotencyKey` permanece UUID de request (nao e mais reciclada como storage id).

---

### `PR01-T003` - Ativar middleware idempotente nas rotas criticas de reports
Status: `DONE`
Objetivo: aplicar protecao real nas mutacoes principais.

Subtarefas:
- `PR01-T003.1` Aplicar `idempotent` em `POST /api/v1/reports`.
  - Arquivo: `apps/api/routes/api.php`
- `PR01-T003.2` Aplicar `idempotent` em `POST /api/v1/reports/{id}/media`.
  - Arquivo: `apps/api/routes/api.php`

Resultado:
- Rotas de criacao e upload de midia cobertas por middleware idempotente.

---

### `PR01-T004` - Reescrever middleware IdempotencyKey para escopo robusto
Status: `DONE`
Objetivo: replay deterministico + conflito explicito para payload divergente.

Subtarefas:
- `PR01-T004.1` Validar key UUID.
- `PR01-T004.2` Gerar cache key com escopo: `tenant + endpoint + actor + idempotencyKey`.
- `PR01-T004.3` Calcular hash estavel de payload (`input + files metadata`).
- `PR01-T004.4` Retornar replay com `X-Idempotency-Replay=true` quando payload e igual.
- `PR01-T004.5` Retornar `409` com `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH` quando payload diverge.
- `PR01-T004.6` Adicionar lock de processamento para reduzir corrida concorrente.
- `PR01-T004.7` Melhorar logs de processamento/replay/conflito.
  - Arquivo: `apps/api/app/Http/Middleware/IdempotencyKey.php`

Resultado:
- Reuso de key com payload igual: replay deterministico.
- Reuso de key com payload diferente: bloqueado com 409.

---

### `PR01-T005` - Cobertura automatizada do comportamento idempotente
Status: `DONE`
Objetivo: garantir nao regressao com cenarios obrigatorios.

Subtarefas:
- `PR01-T005.1` Criar teste de replay (mesma key + mesmo payload => 1 report).
- `PR01-T005.2` Criar teste de conflito (mesma key + payload diferente => 409).
- `PR01-T005.3` Isolar middlewares nao relacionados (throttle redis, tenancy host check) para focar idempotencia no teste.
  - Arquivo: `apps/api/tests/Feature/Reports/ReportIdempotencyTest.php`

Resultado:
- Testes cobrindo os 2 cenarios criticos implementados e passando.

---

### `PR01-T006` - Ajustes de suporte para ambiente de teste SQLite
Status: `DONE`
Objetivo: remover bloqueios de CI/test local que impediam validar PR-01.

Subtarefas:
- `PR01-T006.1` Guardas de compatibilidade SQLite para migrations com `ALTER ... MODIFY ENUM`.
  - Arquivo: `apps/api/database/migrations/2026_02_04_030000_add_passwordless_type_to_otp_codes.php`
- `PR01-T006.2` Guardas/backfill SQLite para SQLs MySQL-specific de users/city domains/moderation.
  - Arquivos:
    - `apps/api/database/migrations/2026_02_07_024016_add_city_id_to_users_table.php`
    - `apps/api/database/migrations/2026_02_07_025132_add_is_primary_to_city_domains_table.php`
    - `apps/api/database/migrations/2026_02_07_160100_add_city_scope_to_moderation_tables.php`
    - `apps/api/database/migrations/2026_02_07_160200_finalize_moderation_city_columns_not_nullable.php`
- `PR01-T006.3` Ajustar teste existente de status para novo requisito tenant-aware.
  - Arquivo: `apps/api/tests/Feature/Reports/CitizenReportStatusTest.php`

Resultado:
- Suite de reports desbloqueada e executavel em SQLite de teste.

---

### `PR01-T007` - Higiene de tipagem/lint no front
Status: `DONE`
Objetivo: remover ruido e manter baseline limpo no escopo alterado.

Subtarefas:
- `PR01-T007.1` Remover import de tipo invalido em `report.service.ts`.
  - Arquivo: `apps/web/src/services/report.service.ts`
- `PR01-T007.2` Validar lint apenas dos arquivos tocados pelo PR.

Resultado:
- Escopo front alterado com lint local limpo.

---

## Evidencias de Teste (Gate da PR)

### 1) Lint front (escopo alterado)
Comando:
- `pnpm --filter @repo/web exec eslint src/types/report.ts src/hooks/useReportDraft.ts src/lib/idb/reportDraftDB.ts src/services/report.service.ts`

Resultado:
- `PASS` (sem erros)

### 2) Testes de API reports (feature)
Comando:
- `php artisan test --testsuite=Feature --filter="(ReportIdempotencyTest|CitizenReportStatusTest)"`

Resultado:
- `PASS`
- 3 testes, 20 assertions

---

## Checklist de Saida PR-01

- [x] UUID v4 no front para idempotency key.
- [x] Draft storage ID separado de idempotency key.
- [x] Middleware idempotente aplicado nas rotas criticas.
- [x] Replay deterministico implementado.
- [x] Conflito 409 para payload divergente implementado.
- [x] Testes automatizados de idempotencia criados e passando.
- [x] Gate de lint no escopo front alterado passando.

---

## Observacoes de Seguranca e Performance

- Escopo de idempotencia agora evita colisao cross-tenant/cross-user.
- Hash de payload usa estrutura deterministica (`input + files metadata`) para detectar reuse indevido.
- Lock curto de processamento reduz corrida de retries concorrentes.
- Compatibilidade SQLite adicionada apenas para ambiente de teste (sem alterar semantica de producao MySQL/MariaDB).
