# PR-05 Tasks Detalhadas - Pipeline de Imagem e Limite de Upload

Data: 2026-02-08
Escopo: `apps/web`, `apps/api`
Status geral: `CONCLUIDO`

---

## Objetivo do PR-05

Padronizar o pipeline de imagens do modulo de denuncias com compressao client-side previsivel (1920px, alvo ~350KB, WebP com fallback JPEG, sem EXIF) e reforcar o limite de seguranca no backend para 8MB por arquivo.

---

## Task Board (com IDs)

### `PR05-T001` - Adotar biblioteca oficial de compressao no frontend
Status: `DONE`
Objetivo: consolidar compressao com worker e fallback robusto.

Subtarefas:
- `PR05-T001.1` Adicionar dependencia `browser-image-compression`.
  - Arquivo: `apps/web/package.json`
- `PR05-T001.2` Reescrever utilitario de compressao com politica unificada:
  - max dimension 1920
  - target ~350KB
  - WebP preferencial
  - fallback JPEG
  - `preserveExif: false`
  - Arquivo: `apps/web/src/lib/imageCompression.ts`

Resultado:
- Pipeline unico documentado e reutilizavel por camera, galeria e upload.

---

### `PR05-T002` - Garantir compressao antes de persistir no draft
Status: `DONE`
Objetivo: evitar armazenar blobs brutos no IndexedDB do wizard.

Subtarefas:
- `PR05-T002.1` Atualizar captura de camera para usar `compressForReportUpload`.
- `PR05-T002.2` Atualizar upload da galeria para usar a mesma pipeline.
- `PR05-T002.3` Manter feedback de economia de bytes no UX de camera.
  - Arquivo: `apps/web/src/components/report/StepCamera.tsx`

Resultado:
- Imagens entram no draft ja otimizadas, reduzindo custo de storage e sync offline.

---

### `PR05-T003` - Garantir compressao antes de upload em todos os caminhos
Status: `DONE`
Objetivo: proteger envio direto e envio via outbox/sync.

Subtarefas:
- `PR05-T003.1` Integrar compressao no `createReport` antes de montar `FormData`.
- `PR05-T003.2` Adicionar fallback por arquivo (se compressao falhar usa original).
- `PR05-T003.3` Adicionar guardrail client-side para bloquear arquivo >8MB apos tentativa de otimizacao.
  - Arquivo: `apps/web/src/services/report.service.ts`

Resultado:
- Qualquer fluxo que chama `createReport` envia imagem otimizada por padrao.

---

### `PR05-T004` - Alinhar backend para limite maximo de 8MB
Status: `DONE`
Objetivo: reforcar validacao de seguranca no create e no add media.

Subtarefas:
- `PR05-T004.1` Alterar limite de `CreateReportRequest` para `max:8192`.
  - Arquivo: `apps/api/app/Domains/Reports/Http/Requests/CreateReportRequest.php`
- `PR05-T004.2` Atualizar mensagem de validacao para 8MB.
  - Arquivo: `apps/api/app/Domains/Reports/Http/Requests/CreateReportRequest.php`
- `PR05-T004.3` Alinhar validacao de `addMedia` para `max:8192`.
  - Arquivo: `apps/api/app/Domains/Reports/Http/Controllers/ReportController.php`

Resultado:
- Backend com regra unica de tamanho por arquivo (8MB) para todos os endpoints de media de reports.

---

### `PR05-T005` - Cobertura automatizada front + api
Status: `DONE`
Objetivo: evitar regressao no fallback de compressao e no limite de upload.

Subtarefas:
- `PR05-T005.1` Criar testes unitarios da pipeline de compressao:
  - sucesso em WebP
  - fallback JPEG quando WebP falha
  - Arquivo: `apps/web/src/lib/imageCompression.test.ts`
- `PR05-T005.2` Criar testes de feature para limite de 8MB:
  - create rejeita >8MB
  - create aceita <=8MB
  - addMedia rejeita >8MB
  - Arquivo: `apps/api/tests/Feature/Reports/ReportUploadLimitTest.php`

Resultado:
- Regras criticas de PR-05 protegidas por testes automatizados.

---

## Evidencias de Teste (Gate da PR)

### 1) Lint Web (escopo alterado)
Comando:
- `pnpm --filter @repo/web exec eslint src/lib/imageCompression.ts src/lib/imageCompression.test.ts src/services/report.service.ts src/components/report/StepCamera.tsx`

Resultado:
- `PASS` (sem erros no escopo)

### 2) Testes Web (escopo reports)
Comando:
- `pnpm --filter @repo/web test -- src/lib/imageCompression.test.ts src/services/report.service.test.ts`

Resultado:
- `PASS` (2 arquivos, 6 testes)

### 3) Testes API (reports + regressao tenancy/idempotencia/visibilidade)
Comando:
- `php artisan test --filter="(ReportUploadLimitTest|ReportIdempotencyTest|PublicReportsVisibilityTest|CitizenReportStatusTest)"`

Resultado:
- `PASS` (10 testes, 48 assertions)

---

## Checklist de Saida PR-05

- [x] Dependencia `browser-image-compression` instalada.
- [x] Pipeline unica de compressao implementada no frontend.
- [x] Compressao aplicada antes do draft e antes do upload.
- [x] Limite backend ajustado para 8MB em create e addMedia.
- [x] Testes front e api adicionados e passando.

---

## Observacoes

- A remocao de EXIF foi tratada como requisito explicito no pipeline (`preserveExif: false`).
- Foi adicionado guardrail client-side de 8MB no upload para feedback mais cedo ao usuario, mesmo com validacao definitiva no backend.
