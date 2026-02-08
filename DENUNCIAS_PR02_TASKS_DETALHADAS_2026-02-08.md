# PR-02 Tasks Detalhadas - Outbox Unica Oficial (Modulo Denuncias)

Data: 2026-02-08
Escopo: `apps/web`
Status geral: `CONCLUIDO`

---

## Objetivo do PR-02

Eliminar a fragmentacao de sincronizacao offline de denuncias, adotando uma outbox unica baseada em `reportDraftDB` + `reportSync/reportOutbox service`, garantindo preservacao de midia e sincronizacao automatica ao reconectar.

---

## Task Board (com IDs)

### `PR02-T001` - Remover fallback legado de reports no `syncQueueDB`
Status: `DONE`
Objetivo: impedir duplicidade de fluxo e perda de imagens no caminho legado.

Subtarefas:
- `PR02-T001.1` Remover uso de `syncQueueDB` em `createReport`.
  - Arquivo: `apps/web/src/services/report.service.ts`
- `PR02-T001.2` Manter erro original para tratamento no fluxo do wizard/outbox oficial.
  - Arquivo: `apps/web/src/services/report.service.ts`

Resultado:
- Reports nao entram mais na fila generica com `images: []`.

---

### `PR02-T002` - Padrao de identificador do draft ativo
Status: `DONE`
Objetivo: centralizar o ID de storage para queue oficial por draft.

Subtarefas:
- `PR02-T002.1` Exportar constante oficial do draft ativo.
  - Arquivo: `apps/web/src/lib/idb/reportDraftDB.ts`
- `PR02-T002.2` Atualizar hook para consumir a constante central.
  - Arquivo: `apps/web/src/hooks/useReportDraft.ts`

Resultado:
- `ACTIVE_REPORT_DRAFT_STORAGE_ID` padronizado entre hook e outbox.

---

### `PR02-T003` - Melhorar runtime da sync de reports (outbox)
Status: `DONE`
Objetivo: tornar o worker de sync inicializavel no bootstrap e com retry mais robusto.

Subtarefas:
- `PR02-T003.1` Adicionar bootstrap explicito (`startReportSync`) para inicializacao unica.
- `PR02-T003.2` Validar existencia do draft antes de enfileirar.
- `PR02-T003.3` Diferenciar erros retryable vs non-retryable (4xx fatais nao entram em loop).
- `PR02-T003.4` Expor `startReportSync` no objeto de service.
  - Arquivo: `apps/web/src/services/reportSync.service.ts`

Resultado:
- Sync inicializada de forma controlada no app.
- Falhas fatais nao ficam em retry infinito.

---

### `PR02-T004` - Criar facade canonica de outbox para reports
Status: `DONE`
Objetivo: tornar explicito o ponto unico de orquestracao de outbox.

Subtarefas:
- `PR02-T004.1` Criar `reportOutbox.service.ts` como API canonica de fila/sync/status.
  - Arquivo: `apps/web/src/services/reportOutbox.service.ts`

Resultado:
- Modulo passa a consumir API semantica de outbox (`enqueue`, `syncNow`, `status`, `retryFailed`).

---

### `PR02-T005` - Integrar wizard ao outbox oficial em erro offline/rede
Status: `DONE`
Objetivo: garantir persistencia + queue com blobs preservados ao falhar envio online.

Subtarefas:
- `PR02-T005.1` Adicionar detector de erro offline/rede (`isOfflineLikeReportError`).
  - Arquivo: `apps/web/src/services/report.service.ts`
- `PR02-T005.2` No submit do wizard, ao detectar erro offline:
  - salvar draft atual,
  - enfileirar draft oficial no outbox,
  - exibir feedback ao usuario,
  - redirecionar para `minhas-denuncias`.
  - Arquivo: `apps/web/src/pages/ReportWizardPage.tsx`

Resultado:
- Denuncia offline fica pendente com midia preservada e pronta para sync.

---

### `PR02-T006` - Bootstrap do outbox no ciclo de vida do app
Status: `DONE`
Objetivo: drenar fila de reports automaticamente sem depender de hook legado.

Subtarefas:
- `PR02-T006.1` Inicializar `startReportSync()` apos tenant bootstrap.
  - Arquivo: `apps/web/src/App.tsx`

Resultado:
- Ao app iniciar (tenant pronto), sync de pendencias entra em operacao.

---

### `PR02-T007` - UX de pendencias offline no modulo
Status: `DONE`
Objetivo: expor estado de fila ao usuario com acao manual de retry/sync.

Subtarefas:
- `PR02-T007.1` Criar componente `ReportSyncStatus` com polling de status e CTA "Enviar agora".
  - Arquivo: `apps/web/src/components/report/ReportSyncStatus.tsx`
- `PR02-T007.2` Integrar componente na `MyReportsPage`.
  - Arquivo: `apps/web/src/pages/MyReportsPage.tsx`
- `PR02-T007.3` Corrigir botao "Limpar filtro" quebrado (`setFilter` inexistente).
  - Arquivo: `apps/web/src/pages/MyReportsPage.tsx`

Resultado:
- Usuario visualiza pendencias de envio e consegue disparar sync manual.

---

### `PR02-T008` - Isolar hook legado para nao processar reports
Status: `DONE`
Objetivo: evitar concorrencia entre fila antiga e outbox nova.

Subtarefas:
- `PR02-T008.1` Em `useOnlineSync`, ignorar/remover item legado `type='report'`.
  - Arquivo: `apps/web/src/hooks/useOnlineSync.ts`

Resultado:
- Fluxo legado nao interfere mais no modulo de denuncias.

---

### `PR02-T009` - Higiene de lint/testes e regressao
Status: `DONE`
Objetivo: fechar PR com gate tecnico validado.

Subtarefas:
- `PR02-T009.1` Corrigir hooks condicionais nas paginas tocadas para lint verde no escopo.
  - Arquivos:
    - `apps/web/src/pages/ReportWizardPage.tsx`
    - `apps/web/src/pages/MyReportsPage.tsx`
- `PR02-T009.2` Criar teste unitario de deteccao de erro offline/rede.
  - Arquivo: `apps/web/src/services/report.service.test.ts`
- `PR02-T009.3` Executar gate de lint/test.

Resultado:
- Escopo alterado com lint e testes passando.

---

## Evidencias de Teste (Gate da PR)

### 1) Lint no escopo alterado (web)
Comando:
- `pnpm --filter @repo/web exec eslint src/pages/ReportWizardPage.tsx src/pages/MyReportsPage.tsx src/components/report/ReportSyncStatus.tsx src/services/report.service.ts src/services/report.service.test.ts src/services/reportSync.service.ts src/services/reportOutbox.service.ts src/hooks/useReportDraft.ts src/lib/idb/reportDraftDB.ts src/hooks/useOnlineSync.ts src/App.tsx`

Resultado:
- `PASS`

### 2) Teste unitario web (novo)
Comando:
- `pnpm --filter @repo/web test -- src/services/report.service.test.ts`

Resultado:
- `PASS` (4 testes)

### 3) Regressao backend reports (mantida verde)
Comando:
- `php artisan test --testsuite=Feature --filter="(ReportIdempotencyTest|CitizenReportStatusTest)"`

Resultado:
- `PASS` (3 testes, 20 assertions)

---

## Checklist de Saida PR-02

- [x] Reports nao usam mais `syncQueueDB` como caminho principal.
- [x] Queue oficial usa draft IDB com blobs preservados.
- [x] Bootstrap de sync ativo no app com tenant pronto.
- [x] UX de pendencias offline disponivel em `MyReportsPage`.
- [x] Hook legado nao processa mais `report`.
- [x] Lint no escopo alterado passando.
- [x] Teste unitario novo passando.

---

## Observacoes de Arquitetura

- Neste PR, a outbox oficial de reports foi consolidada sobre `reportDraftDB` (status `queued/sending/failed/sent`) + worker de sync, evitando criar uma segunda store paralela.
- Isso reduz complexidade e elimina o risco mais grave identificado: envio offline sem midia por caminho legado.
- O `syncQueueDB` permanece para outros modulos legados (forum/turismo), mas desacoplado de reports.
