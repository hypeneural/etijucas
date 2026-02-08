# PR-09 Tasks Detalhadas - Hardening de Dados (`city_id`) + Indices Compostos

Data: 2026-02-08
Escopo: `apps/api`
Status geral: `CONCLUIDO_TECNICO`

---

## Objetivo do PR-09

Fortalecer a base de dados do modulo de denuncias para escala multi-tenant:

- eliminar legado com `city_id` nulo em `citizen_reports`;
- aplicar enforce de `NOT NULL` com seguranca;
- criar indices compostos tenant-aware para consultas criticas.

---

## Task Board (com IDs)

### `PR09-T001` - Backfill de `city_id` legado em `citizen_reports`
Status: `DONE`
Objetivo: preencher registros antigos sem cidade.

Subtarefas:
- `PR09-T001.1` Backfill por `users.city_id` quando disponivel.
- `PR09-T001.2` Fallback por `bairros.city_id` quando `user` nao resolver.
- `PR09-T001.3` Fallback final por cidade default (`tijucas-sc`, ativa ou primeira disponivel).
- `PR09-T001.4` Compatibilidade SQLite com loop seguro (sem SQL de join-update).
- Arquivo: `apps/api/database/migrations/2026_02_08_230000_backfill_city_id_in_citizen_reports.php`

Resultado:
- Base legado preparada para enforce de integridade em `city_id`.

---

### `PR09-T002` - Enforce `city_id NOT NULL` com validacao defensiva
Status: `DONE`
Objetivo: impedir novos registros sem tenant.

Subtarefas:
- `PR09-T002.1` Validar previamente se ainda existem linhas `city_id IS NULL`.
- `PR09-T002.2` Aplicar `ALTER TABLE ... MODIFY city_id CHAR(36) NOT NULL` em MySQL/MariaDB.
- `PR09-T002.3` Manter guard de compatibilidade para SQLite no CI (sem `ALTER COLUMN`).
- `PR09-T002.4` Implementar rollback seguro para voltar `NULL` em MySQL/MariaDB.
- Arquivo: `apps/api/database/migrations/2026_02_08_230100_make_city_id_not_null_in_citizen_reports.php`

Resultado:
- Integridade de tenant reforcada em bancos de producao (MySQL/MariaDB).

---

### `PR09-T003` - Indices compostos tenant-aware para reports
Status: `DONE`
Objetivo: acelerar queries por cidade em listagem/filtros.

Subtarefas:
- `PR09-T003.1` Criar indice `(city_id, created_at)`.
- `PR09-T003.2` Criar indice `(city_id, status, created_at)`.
- `PR09-T003.3` Criar indice `(city_id, category_id, created_at)`.
- `PR09-T003.4` Garantir rollback removendo os mesmos nomes de indice.
- Arquivo: `apps/api/database/migrations/2026_02_08_230200_add_reports_tenant_composite_indexes.php`

Resultado:
- Cobertura de indices alinhada com queries tenant-scoped do modulo.

---

### `PR09-T004` - Cobertura automatizada de indices
Status: `DONE`
Objetivo: impedir regressao de schema no pipeline de testes.

Subtarefas:
- `PR09-T004.1` Criar teste para validar existencia dos 3 indices compostos.
- `PR09-T004.2` Implementar leitura de indices para SQLite (`PRAGMA index_list`) e MySQL (`SHOW INDEX`).
- Arquivo: `apps/api/tests/Feature/Reports/ReportsIndexesCoverageTest.php`

Resultado:
- Presenca dos indices criticos passou a ser validada automaticamente.

---

### `PR09-T005` - Gate de regressao do modulo reports
Status: `DONE`
Objetivo: confirmar que as migrations novas nao quebraram features ja entregues.

Subtarefas:
- `PR09-T005.1` Rodar teste dedicado de indices.
- `PR09-T005.2` Rodar regressao combinada de reports (idempotencia, visibilidade, conflito, upload limit, rate limit).

Resultado:
- Escopo de reports validado sem regressao funcional.

---

## Evidencias de Teste (Gate da PR)

### 1) Cobertura de indices compostos
Comando:
- `php artisan test --filter=ReportsIndexesCoverageTest`

Resultado:
- `PASS` (1 teste, 3 assertions)

### 2) Regressao combinada do modulo reports
Comando:
- `php artisan test --filter="(ReportsIndexesCoverageTest|ReportStatusConflictTest|CitizenReportStatusTest|ReportIdempotencyTest|ReportUploadLimitTest|PublicReportsVisibilityTest|RateLimiterTenantScopeTest)"`

Resultado:
- `PASS` (19 testes, 81 assertions)

---

## Checklist de Saida PR-09

- [x] Backfill de `city_id` legado implementado.
- [x] Enforce `NOT NULL` implementado para MySQL/MariaDB.
- [x] Indices compostos tenant-aware criados.
- [x] Teste automatizado cobrindo existencia dos indices.
- [x] Regressao do modulo reports passando.
- [ ] Validar `EXPLAIN` em MySQL/MariaDB de staging/producao com queries reais.

---

## Observacoes

- O enforce `NOT NULL` foi protegido para SQLite porque o CI de testes usa SQLite com suporte limitado de alteracao de coluna.
- A validacao final de `EXPLAIN` depende de ambiente MySQL/MariaDB com volume representativo para aferir plano de execucao real.
