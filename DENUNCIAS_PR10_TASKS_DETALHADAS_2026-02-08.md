# PR-10 Tasks Detalhadas - Governanca Final (Contratos, Types, Qualidade, Observabilidade)

Data: 2026-02-08
Escopo: `contracts`, `apps/web`, `apps/api`
Status geral: `CONCLUIDO`

---

## Objetivo do PR-10

Fechar o ciclo de governanca do modulo de denuncias, eliminando drift de contrato, consolidando tipos e estabilizando checks de qualidade/observabilidade para evolucao segura.

---

## Task Board (com IDs)

### `PR10-T001` - Alinhar OpenAPI ao comportamento real de reports
Status: `DONE`
Objetivo: refletir no contrato os endpoints e payloads atuais.

Subtarefas:
- `PR10-T001.1` Atualizar `POST /api/v1/reports` para `multipart/form-data`.
- `PR10-T001.2` Documentar header `X-Idempotency-Key`.
- `PR10-T001.3` Incluir endpoints atuais:
  - `/api/v1/report-categories`
  - `/api/v1/reports/map`
  - `/api/v1/reports/{id}`
  - `/api/v1/reports/{id}/media`
  - `/api/v1/reports/{id}/media/{mediaId}`
  - `/api/v1/reports/{id}/status`
- `PR10-T001.4` Documentar conflito `409` de versionamento de status.
- Arquivo: `contracts/openapi.yaml`

Resultado:
- Contrato de reports atualizado para o fluxo real implementado.

---

### `PR10-T002` - Atualizar features map do modulo reports
Status: `DONE`
Objetivo: manter o mapa de features alinhado com rotas/tabelas atuais.

Subtarefas:
- `PR10-T002.1` Trocar endpoint legado `/users/me/reports` por `/reports/me`.
- `PR10-T002.2` Atualizar lista de endpoints, telas e tabelas do modulo.
- Arquivo: `contracts/features.yaml`

Resultado:
- `features.yaml` sincronizado com escopo atual de reports.

---

### `PR10-T003` - Regenerar checksum/artefatos de contrato
Status: `DONE`
Objetivo: remover drift de contrato no check automatizado.

Subtarefas:
- `PR10-T003.1` Executar `pnpm sdk:gen`.
- `PR10-T003.2` Validar sincronismo com `pnpm check:contracts`.
- Arquivos:
  - `packages/sdk/src/generated-types.ts`
  - `.contracts-checksum`

Resultado:
- Drift de contrato eliminado no pipeline.

---

### `PR10-T004` - Consolidar tipos de report no frontend
Status: `DONE`
Objetivo: remover duplicidade `types/index.ts` vs `types/report.ts`.

Subtarefas:
- `PR10-T004.1` mapear todos os imports de tipo de report. (`DONE`)
- `PR10-T004.2` migrar consumidores do modulo para `types/report.ts` como fonte unica. (`DONE`)
- `PR10-T004.3` atualizar bridge/hooks legados para contrato atual de reports. (`DONE`)
- `PR10-T004.4` manter compatibilidade de legado fora do modulo sem quebrar build. (`DONE`)

Arquivos:
- `apps/web/src/lib/localDatabase.ts`
- `apps/web/src/hooks/useOfflineReports.ts`
- `apps/web/src/hooks/queries/useReports.ts`
- `apps/web/src/services/report.service.ts`

Resultado:
- O modulo de denuncias deixou de depender do tipo legado `Report` de `@/types`.

---

### `PR10-T005` - Fechar debitos de lint/tests remanescentes no modulo
Status: `DONE`
Objetivo: terminar PR-10 com check de qualidade limpo.

Subtarefas:
- `PR10-T005.1` revisar hooks condicionais remanescentes. (`DONE`)
- `PR10-T005.2` executar lint no escopo denuncias e corrigir pendencias. (`DONE`)
- `PR10-T005.3` estabilizar fluxo de testes de reports no CI alvo com perfil Ãºnico. (`DONE`)

Arquivos:
- `package.json`

Resultado:
- Script `check:reports` padroniza execuÃ§Ã£o do gate tÃ©cnico (contracts + features + lint + testes web/api).

---

### `PR10-T006` - Observabilidade minima de operacao
Status: `DONE`
Objetivo: melhorar diagnostico de incidentes em producao.

Subtarefas:
- `PR10-T006.1` definir metricas de fila/outbox no frontend. (`DONE`)
- `PR10-T006.2` padronizar eventos e snapshot de sync no runtime de reports. (`DONE`)
- `PR10-T006.3` expor API de assinatura de metricas para UI/debug. (`DONE`)

Arquivos:
- `apps/web/src/services/reportSync.service.ts`
- `apps/web/src/services/reportOutbox.service.ts`

Resultado:
- Runtime de sync agora emite eventos estruturados (`queue_enqueued`, `sync_success`, `sync_failure`, `retry_scheduled`, etc.) e snapshot agregado de mÃ©tricas.

---

### `PR10-T007` - Integrar gate de reports no CI
Status: `DONE`
Objetivo: garantir verificacao automatica do modulo em PR/push.

Subtarefas:
- `PR10-T007.1` Criar workflow dedicado para quality gate de denuncias. (`DONE`)
- `PR10-T007.2` Configurar gatilho por paths do escopo de reports. (`DONE`)
- `PR10-T007.3` Executar comando unico `pnpm check:reports` no pipeline. (`DONE`)

Arquivos:
- `.github/workflows/reports-quality-gate.yml`

Resultado:
- Quality gate de reports automatizado no CI para regressao rapida e segura.

---

## Evidencias de Teste

### 1) Validacao do features map
Comando:
- `pnpm check:features`

Resultado:
- `PASS` (sem erros criticos)

### 2) Validacao de contratos
Comandos:
- `pnpm sdk:gen`
- `pnpm check:contracts`

Resultado:
- `PASS` (contracts in sync)

### 3) Regressao tecnica do escopo reports
Comandos:
- `pnpm --filter @repo/web exec eslint src/services/report.service.ts src/services/report.service.test.ts`
- `pnpm --filter @repo/web exec eslint "src/components/report/**/*.tsx" src/pages/ReportWizardPage.tsx src/pages/MyReportsPage.tsx src/screens/ReportsMapScreen.tsx src/services/report.service.ts src/services/report.service.test.ts`
- `pnpm --filter @repo/web exec eslint src/lib/localDatabase.ts src/hooks/useOfflineReports.ts src/hooks/queries/useReports.ts src/services/reportSync.service.ts src/services/reportOutbox.service.ts src/services/report.service.ts`
- `php artisan test --filter="(ReportsIndexesCoverageTest|ReportStatusConflictTest|RateLimiterTenantScopeTest)"`

Resultado:
- `PASS`

### 4) Gate unificado de reports (perfil CI-ready)
Comando:
- `pnpm check:reports`

Resultado:
- `PASS`

### 5) Integracao do workflow CI
Comando:
- `Test-Path .github/workflows/reports-quality-gate.yml`

Resultado:
- `True`

---

## Checklist de Saida PR-10

- [x] OpenAPI atualizado para reports.
- [x] Features map atualizado para reports.
- [x] Checksum/artefato de contrato sincronizados.
- [x] Tipos de reports consolidados no frontend (escopo modulo).
- [x] Debitos de lint remanescentes no modulo resolvidos.
- [x] Perfil de execuÃ§Ã£o de testes/checks de reports estabilizado (`check:reports`).
- [x] Observabilidade minima consolidada.
- [x] Integrar execucao automatica em workflow CI do repositorio (`.github/workflows/reports-quality-gate.yml`).

