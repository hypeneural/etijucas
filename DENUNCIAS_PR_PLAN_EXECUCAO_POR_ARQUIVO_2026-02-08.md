# PR Plan Detalhado por Arquivo - Modulo Denuncias

Data: 2026-02-08
Escopo: `apps/web`, `apps/api`, `contracts`
Objetivo: executar as melhorias P0/P1/P2 com baixo risco de regressao, em PRs pequenos, testaveis e com rollback claro.

---

## Status Consolidado (atual)

- Checklist central por prioridade: `DENUNCIAS_PR_CHECKLIST_PRIORIZADA_2026-02-08.md`
- PR-01: `CONCLUIDO` (`DENUNCIAS_PR01_TASKS_DETALHADAS_2026-02-08.md`)
- PR-02: `CONCLUIDO` (`DENUNCIAS_PR02_TASKS_DETALHADAS_2026-02-08.md`)
- PR-03: `CONCLUIDO` (`DENUNCIAS_PR03_TASKS_DETALHADAS_2026-02-08.md`)
- PR-04: `CONCLUIDO` (`DENUNCIAS_PR04_TASKS_DETALHADAS_2026-02-08.md`)
- PR-05 ate PR-10: `PENDENTE`

---

## 0. Guardrails (preservar)

Nao alterar os pilares abaixo, apenas evoluir:

- wizard mobile-first por steps;
- draft em IndexedDB com Blob;
- tenant resolution em middleware + tenant scope no model;
- dominio de reports com status history + media.

---

## 1. Ordem de Execucao Recomendada

1. PR-01 Idempotencia real (front+api) e replay deterministico.
2. PR-02 Outbox unica oficial (eliminar fragmentacao de sync).
3. PR-03 Tenant-safe networking e cache safety no front.
4. PR-04 Politica de visibilidade publica + resource publico.
5. PR-05 Pipeline de imagem (compressao alvo + limite backend + EXIF policy).
6. PR-06 UX mapa premium (skeleton, confirmar local, haptic, fallback parcial).
7. PR-07 Rate limiting dedicado por tenant+ip + logs.
8. PR-08 Conflitos de edicao (409) com token de versao.
9. PR-09 Hardening de dados (`city_id`) + indices compostos tenant-aware.
10. PR-10 Contratos, types, lint/testes e observabilidade.

---

## PR-01 - Idempotencia Real (P0)

Execucao detalhada com IDs de tasks e subtarefas:

- `DENUNCIAS_PR01_TASKS_DETALHADAS_2026-02-08.md`

Objetivo:

- garantir que requests repetidos de criacao nao dupliquem denuncia;
- alinhar formato da key (UUID v4) entre front e backend;
- ativar middleware na rota correta.

Arquivos (Front):

- `apps/web/src/types/report.ts`
  - trocar `generateIdempotencyKey` para UUID v4 real (`crypto.randomUUID` ou `generateUUID()` de `lib/uuid.ts`).
- `apps/web/src/hooks/useReportDraft.ts`
  - remover sobrescrita de `idempotencyKey` com `ACTIVE_DRAFT_ID`.
  - separar `draftStorageId` (ID interno de persistencia) de `idempotencyKey` (ID de request).
- `apps/web/src/lib/idb/reportDraftDB.ts`
  - ajustar API para salvar por `draftId` sem reciclar `idempotencyKey`.

Arquivos (API):

- `apps/api/routes/api.php`
  - aplicar middleware `idempotent` em `POST /api/v1/reports`.
  - opcional recomendado: aplicar em `POST /api/v1/reports/{id}/media`.
- `apps/api/app/Http/Middleware/IdempotencyKey.php`
  - chave de cache/store incluir tenant + endpoint + actor (user_id/ip) + hash do payload.
  - se key repetida com payload diferente: retornar `409` (ou `422`) explicito.
  - eliminar estado ambiguo `processing` sem lock robusto.

Arquivos (Testes):

- `apps/api/tests/Feature/Reports/ReportIdempotencyTest.php` (novo)
  - 2 POST iguais com mesma key -> 1 registro.
  - replay retorna mesmo body/status.
  - mesma key com payload diferente -> erro esperado.

DoD:

- `X-Idempotency-Key` com UUID v4 em 100% das criacoes.
- replay comprovado por teste automatizado.
- sem duplicacao em retry de rede.

Risco:

- medio (mudanca de comportamento de middleware).

Rollback:

- remover middleware da rota e manter apenas validacao de key no front (temporario).

---

## PR-02 - Outbox Unica Oficial (P0)

Execucao detalhada com IDs de tasks e subtarefas:

- `DENUNCIAS_PR02_TASKS_DETALHADAS_2026-02-08.md`

Objetivo:

- parar de manter 2-3 fluxos de sync competindo;
- garantir envio offline com midia preservada.

Arquivos (Front - novos):

- `apps/web/src/lib/idb/reportOutboxDB.ts` (novo)
  - store unica de outbox (`queued`, `sending`, `failed`, `sent`).
  - item referencia `draftId` e nunca perde blobs.
- `apps/web/src/services/reportOutbox.service.ts` (novo)
  - enqueue, dequeue, retry com backoff, lock de processamento.

Arquivos (Front - alteracoes):

- `apps/web/src/lib/idb/reportDraftDB.ts`
  - manter blobs no draft e API de leitura para reconstruir multipart.
- `apps/web/src/services/report.service.ts`
  - remover fallback legado `syncQueueDB.add(...)` para reports.
  - encaminhar erro offline para outbox oficial.
- `apps/web/src/services/reportSync.service.ts`
  - substituir ou consolidar com `reportOutbox.service.ts`.
- `apps/web/src/hooks/useOnlineSync.ts`
  - remover reports do fluxo legado ou marcar como deprecated para reports.
- `apps/web/src/App.tsx`
  - registrar bootstrap do worker de sync de reports ao iniciar app.

Arquivos (UI):

- `apps/web/src/components/report/ReportSyncStatus.tsx` (novo)
  - badge/central de pendencias (pendente, sincronizando, falhou).
- `apps/web/src/pages/MyReportsPage.tsx`
  - exibir resumo de pendencias offline com CTA "Enviar agora".

DoD:

- denuncia offline com 3 fotos sincroniza com fotos ao reconectar.
- nao existe caminho ativo de reports usando `syncQueueDB` legado.
- idempotencia previne duplicata mesmo com retry concorrente.

Risco:

- alto (nucleo offline do modulo).

Rollback:

- feature flag: manter worker novo desativavel e fallback no fluxo atual.

---

## PR-03 - Tenant-Safe Networking (P0)

Execucao detalhada com IDs de tasks e subtarefas:

- `DENUNCIAS_PR03_TASKS_DETALHADAS_2026-02-08.md`

Objetivo:

- eliminar vazamento de tenant por `fetch` direto;
- impedir cache cross-city no front.

Arquivos (Front):

- `apps/web/src/screens/ReportsMapScreen.tsx`
  - trocar `fetch('/api/v1/report-categories')` por `reportService.getCategories()`.
  - trocar `fetch('/api/v1/reports/map?...')` por `reportService.getReportsMap(...)`.
- `apps/web/src/services/report.service.ts`
  - adicionar `getReportsMap`.
- `apps/web/src/api/config.ts`
  - adicionar `ENDPOINTS.reports.map`.

Arquivos (Query keys):

- `apps/web/src/hooks/useMyReports.ts`
- `apps/web/src/hooks/useReportCategories.ts`
- `apps/web/src/pages/ReportDetailPage.tsx`
  - incluir `tenantKey` ou `citySlug` nas query keys de reports.

Arquivos (Lint guardrail):

- `apps/web/eslint.config.js`
  - integrar regra local `no-direct-fetch` para bloquear API fetch direto.
- `apps/web/eslint-rules/no-direct-fetch.js`
  - manter regra ativa para `/api` e `/v1`.

DoD:

- nenhum `fetch('/api` no modulo de denuncias.
- troca de tenant nao reaproveita cache de cidade errada.
- CI falha se novo fetch direto de API for introduzido.

Risco:

- baixo/medio.

Rollback:

- desativar regra lint temporariamente sem reverter migracao para `apiClient`.

---

## PR-04 - Politica de Visibilidade Publica (P0)

Execucao detalhada com IDs de tasks e subtarefas:

- `DENUNCIAS_PR04_TASKS_DETALHADAS_2026-02-08.md`

Objetivo:

- endpoint publico retornar apenas dados publicaveis;
- separar claramente recurso publico e privado.

Arquivos (API):

- `apps/api/app/Domains/Reports/Models/CitizenReport.php`
  - adicionar scope `publicVisible()` (ex.: status permitido + filtros de privacidade).
- `apps/api/app/Domains/Reports/Http/Controllers/ReportController.php`
  - em `index`, usar scope publico explicitamente.
  - em `show`, decidir politica publica/privada por permissao.
- `apps/api/app/Domains/Reports/Http/Controllers/ReportMapController.php`
  - usar `publicVisible()` no mapa publico.
- `apps/api/app/Domains/Reports/Http/Resources/PublicReportResource.php` (novo)
  - remover campos internos (nota interna, dados sensiveis, etc).
- `apps/api/app/Domains/Reports/Http/Resources/ReportResource.php`
  - manter resource privado/admin.

Arquivos (Testes):

- `apps/api/tests/Feature/Reports/PublicReportsVisibilityTest.php` (novo)
  - endpoint publico nao retorna status nao permitidos.
  - payload publico nao inclui campos internos.

DoD:

- politica "publico vs privado" documentada e testada.
- endpoint publico nunca vaza campos internos.

Risco:

- medio (impacto em UX publica atual).

Rollback:

- manter status policy conservadora por feature flag de status publicavel.

---

## PR-05 - Pipeline de Imagem e Limites (P0)

Objetivo:

- padronizar compressao no client;
- reduzir payload em rede movel;
- reforcar guarda backend.

Arquivos (Front):

- `apps/web/package.json`
  - adicionar `browser-image-compression`.
- `apps/web/src/lib/imageCompression.ts`
  - migrar para pipeline com:
    - `maxWidthOrHeight: 1920`
    - alvo ~350KB
    - WebP preferencial
    - fallback JPEG
    - remocao de metadados por re-encode.
- `apps/web/src/components/report/StepCamera.tsx`
  - aplicar compressao antes de persistir no draft.
- `apps/web/src/services/report.service.ts`
  - garantir compressao antes de upload em todos os caminhos.

Arquivos (API):

- `apps/api/app/Domains/Reports/Http/Requests/CreateReportRequest.php`
  - reduzir limite max imagem para 8MB.
- `apps/api/app/Domains/Reports/Http/Controllers/ReportController.php`
  - alinhar validacao em `addMedia` para 8MB.

Arquivos (Testes):

- `apps/web/src/lib/imageCompression.test.ts` (novo)
  - verificar fallback quando WebP falha.
  - verificar reducao de tamanho.
- `apps/api/tests/Feature/Reports/ReportUploadLimitTest.php` (novo)
  - rejeitar arquivo >8MB.

DoD:

- 90% das imagens <= 400KB em amostra real.
- uploads em 4G com menos timeout/erro.
- backend bloqueia payload acima do limite definido.

Risco:

- medio (compatibilidade de browsers antigos).

Rollback:

- fallback temporario para JPEG-only mantendo limite de dimensao.

---

## PR-06 - UX Mapa Native Feel (P0/P1)

Objetivo:

- reduzir abandono no step de localizacao;
- tornar feedback mais claro e tolerante a erro parcial.

Arquivos (Front):

- `apps/web/src/components/report/LocationMap.tsx`
  - adicionar skeleton enquanto tiles carregam.
  - suportar evento de "pronto" para ocultar skeleton.
- `apps/web/src/components/report/StepLocation.tsx`
  - CTA flutuante "Confirmar local".
  - haptic leve em dragend/confirmacao via `useHaptic`.
  - tratamento "reverse geocode falhou -> Enviar mesmo assim".
- `apps/web/src/hooks/useHaptic.ts`
  - reaproveitar (sem nova dependencia).

Arquivos (UI extras):

- `apps/web/src/components/report/MapSkeleton.tsx` (novo)

DoD:

- usuario nunca bloqueado por falha de reverse geocode.
- mapa nao apresenta flash branco inicial.
- medicao de abandono no step de localizacao reduz.

Risco:

- baixo.

Rollback:

- esconder CTA de confirmacao por flag e manter fluxo atual.

---

## PR-07 - Rate Limiting Dedicado + Logs (P1)

Objetivo:

- conter spam sem degradar experiencia legitima;
- isolar impacto por tenant.

Arquivos (API):

- `apps/api/app/Providers/AppServiceProvider.php`
  - criar limiters nomeados:
    - `reports-create` (10/h por tenant+ip)
    - `reports-media` (30/h por tenant+ip)
- `apps/api/routes/api.php`
  - aplicar `throttle:reports-create` em `POST /reports`.
  - aplicar `throttle:reports-media` em `POST /reports/{id}/media`.
- `apps/api/app/Http/Middleware/RequestIdMiddleware.php`
  - garantir contexto para logs de bloqueio.

Arquivos (Testes):

- `apps/api/tests/Feature/Reports/ReportRateLimitTenantScopeTest.php` (novo)
  - bloqueio por tenant+ip.
  - tenant A bloqueado nao impacta tenant B.

DoD:

- throttling dedicado ativo e validado por teste.
- logs com tenant/ip para auditoria.

Risco:

- baixo.

Rollback:

- retornar temporariamente para throttle anterior por minuto.

---

## PR-08 - Conflito de Edicao (409) (P1)

Objetivo:

- evitar sobrescrita silenciosa de status em concorrencia/offline.

Arquivos (API):

- `apps/api/app/Domains/Reports/Http/Requests/UpdateReportStatusRequest.php`
  - aceitar token de versao (`If-Unmodified-Since` ou `version`).
- `apps/api/app/Domains/Reports/Http/Controllers/ReportController.php`
  - validar token antes de atualizar.
  - retornar `409 Conflict` com estado atual quando divergente.
- `apps/api/app/Domains/Reports/Actions/UpdateReportStatusAction.php`
  - manter acao pura; conflito tratado no controller.

Arquivos (Front/Admin Web):

- `apps/web/src/services/report.service.ts`
  - mapear erro `409` para tipo de conflito.
- `apps/web/src/pages/ReportDetailPage.tsx` (ou tela admin correspondente)
  - exibir mensagem "denuncia atualizada por outro moderador" + CTA refresh.

Arquivos (Testes):

- `apps/api/tests/Feature/Reports/ReportStatusConflictTest.php` (novo)

DoD:

- update concorrente gera 409 de forma reprodutivel.
- UX trata conflito sem quebrar fluxo.

Risco:

- medio.

Rollback:

- fallback para last-write-wins com log de alerta (temporario).

---

## PR-09 - Hardening de Dados + Indices (P1)

Objetivo:

- eliminar registros sem `city_id`;
- melhorar performance de filtros/listagens tenant-aware.

Arquivos (DB migrations):

- `apps/api/database/migrations/2026_02_08_220000_backfill_city_id_in_citizen_reports.php` (novo)
  - preencher `city_id` legado (via user/categoria/cidade default controlada).
- `apps/api/database/migrations/2026_02_08_220100_make_city_id_not_null_in_citizen_reports.php` (novo)
  - aplicar `NOT NULL` com seguranca.
- `apps/api/database/migrations/2026_02_08_220200_add_reports_tenant_composite_indexes.php` (novo)
  - criar:
    - `(city_id, created_at)`
    - `(city_id, status, created_at)`
    - `(city_id, category_id, created_at)`

Arquivos (Testes/validacao):

- `apps/api/tests/Feature/Reports/ReportsIndexCoverageTest.php` (novo)
  - validar plano de execucao usando indice.

DoD:

- zero registros `citizen_reports.city_id IS NULL`.
- queries criticas usam indice no `EXPLAIN`.

Risco:

- alto (migracao de dados).

Rollback:

- executar em 2 passos: backfill + validacao + enforce.

---

## PR-10 - Contratos, Tipos, Lint/Testes e Observabilidade (P2)

Objetivo:

- reduzir drift entre API e front;
- estabilizar CI e dar visibilidade operacional.

Arquivos (Contratos):

- `contracts/openapi.yaml`
  - corrigir `POST /api/v1/reports` para multipart real.
  - documentar `X-Idempotency-Key`.
  - documentar respostas publicas x privadas.
- `contracts/features.yaml`
  - trocar `/users/me/reports` para `/reports/me`.

Arquivos (Front types):

- `apps/web/src/types/index.ts`
  - remover modelo legado de report (ou marcar explicitamente deprecated fora do modulo).
- `apps/web/src/types/report.ts`
  - consolidar como fonte unica para modulo de denuncias.

Arquivos (Lint):

- `apps/web/eslint.config.js`
  - ignorar `dev-dist/**`.
- `apps/web/src/pages/ReportWizardPage.tsx`
  - corrigir hooks condicionais.
- `apps/web/src/pages/MyReportsPage.tsx`
  - corrigir hooks condicionais e bug `setFilter(null)`.

Arquivos (Testes API):

- `apps/api/phpunit.xml` e/ou pipeline CI
  - alinhar ambiente de teste (preferencia MariaDB/MySQL para migrations atuais).

Arquivos (Observabilidade):

- `apps/web/src/services/reportOutbox.service.ts`
  - emitir metricas de fila (`pending`, `failed`, `retry`).
- `apps/api/app/Http/Middleware/IdempotencyKey.php`
  - logs de replay.
- `apps/api/app/Providers/AppServiceProvider.php`
  - logs de throttling de reports.

DoD:

- contratos alinhados com implementacao.
- lint passa no escopo do modulo de denuncias.
- testes de reports (idempotencia, visibilidade, rate limit, conflito) passam em CI.
- metricas minimas de operacao disponiveis em logs.

Risco:

- medio.

Rollback:

- contratos e lint podem ser separados em PR final de hardening se necessario.

---

## 2. Checklist de Saida por PR

Cada PR deve sair com:

- changelog tecnico curto;
- lista de arquivos alterados;
- evidencias de teste (comando + resultado);
- risco/rollback;
- feature flag (quando aplicavel).

---

## 3. Dependencias Entre PRs

- PR-02 depende de PR-01 (idempotencia pronta).
- PR-03 pode rodar paralelo a PR-02, mas merge ideal apos PR-02.
- PR-04 depende de PR-03 para reduzir risco de cache/tenant inconsistente no front.
- PR-05 e PR-06 podem rodar em paralelo apos PR-03.
- PR-07 pode iniciar apos PR-01.
- PR-08 depende de PR-04 (resource/public policy ja clara).
- PR-09 depende de PR-04/PR-07 para janela de migracao mais segura.
- PR-10 fecha o ciclo apos todos anteriores.

---

## 4. Resultado Esperado ao Final

- Sem duplicacao silenciosa de denuncias.
- Sem perda de midia em cenarios offline.
- Sem mistura de dados entre tenants no front.
- Endpoint publico com politica de visibilidade robusta.
- Upload menor, mais rapido e previsivel em rede movel.
- Modulo pronto para crescer em multiplas cidades com seguranca e observabilidade.
