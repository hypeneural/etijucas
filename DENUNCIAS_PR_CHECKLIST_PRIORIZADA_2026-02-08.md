# Checklist Priorizada das PRs - Modulo Denuncias

Data: 2026-02-08
Projeto: `etijucas`
Fonte de verdade: `DENUNCIAS_PR_PLAN_EXECUCAO_POR_ARQUIVO_2026-02-08.md` + docs de tasks por PR.

---

## 1. Status Macro por Prioridade

- [x] `PR-01` (P0) Idempotencia real (front+api)
- [x] `PR-02` (P0) Outbox unica oficial (offline sync)
- [x] `PR-03` (P0) Tenant-safe networking + cache safety
- [x] `PR-04` (P0) Politica de visibilidade publica + resource publico
- [ ] `PR-05` (P0) Pipeline de imagem (compressao alvo + limite backend)
- [ ] `PR-06` (P0/P1) UX mapa premium
- [ ] `PR-07` (P1) Rate limiting dedicado por tenant+ip
- [ ] `PR-08` (P1) Conflitos de edicao (409)
- [ ] `PR-09` (P1) Hardening de dados (`city_id`) + indices compostos
- [ ] `PR-10` (P2) Contratos/types/lint-test/observabilidade

---

## 2. Checklist Detalhada por PR

## `PR-01` - Idempotencia Real
Referencia: `DENUNCIAS_PR01_TASKS_DETALHADAS_2026-02-08.md`

- [x] `PR01-T001` UUID v4 no front para idempotency key.
- [x] `PR01-T002` Separacao de storage ID do draft vs idempotency key.
- [x] `PR01-T003` Middleware `idempotent` aplicado nas rotas criticas.
- [x] `PR01-T004` Middleware robusto com escopo tenant+actor+endpoint+payload hash.
- [x] `PR01-T005` Testes automatizados de replay/conflito.
- [x] `PR01-T006` Compatibilidade de migrations para ambiente SQLite de teste.
- [x] `PR01-T007` Higiene de lint no escopo alterado.

Gate:
- [x] Lint front (escopo) PASS
- [x] Testes API reports (feature) PASS

---

## `PR-02` - Outbox Unica Oficial
Referencia: `DENUNCIAS_PR02_TASKS_DETALHADAS_2026-02-08.md`

- [x] `PR02-T001` Remocao de fallback legado `syncQueueDB` para reports.
- [x] `PR02-T002` ID canonico do draft ativo compartilhado.
- [x] `PR02-T003` Runtime de sync robusto (`startReportSync`, retry policy).
- [x] `PR02-T004` Facade oficial `reportOutbox.service.ts`.
- [x] `PR02-T005` Wizard integrado ao outbox em erro offline/rede.
- [x] `PR02-T006` Bootstrap de sync no ciclo de vida do app.
- [x] `PR02-T007` UX de pendencias offline em `MyReportsPage`.
- [x] `PR02-T008` Hook legado isolado para nao processar reports.
- [x] `PR02-T009` Lint/testes e regressao no escopo.

Gate:
- [x] Lint web (escopo) PASS
- [x] Unit test web PASS
- [x] Regressao API reports PASS

---

## `PR-03` - Tenant-Safe Networking e Cache Safety
Referencia: `DENUNCIAS_PR03_TASKS_DETALHADAS_2026-02-08.md`

- [x] `PR03-T001` Remover `fetch` direto do mapa e centralizar em `reportService`.
- [x] `PR03-T002` Query keys tenant-scoped nas telas/hooks centrais de denuncias.
- [x] `PR03-T003` Guardrail ESLint contra `fetch` direto em denuncias.
- [x] `PR03-T004` `Vary: Host, X-City` no middleware `TenantContext`.
- [x] `PR03-T005` Higiene de lint no escopo alterado.

Gate:
- [x] Lint web (escopo) PASS
- [x] Unit test web PASS
- [x] Feature tests API (tenancy + reports) PASS

---

## `PR-04` - Politica de Visibilidade Publica
Referencia: `DENUNCIAS_PR04_TASKS_DETALHADAS_2026-02-08.md`
Status: `CONCLUIDO`

- [x] Criar scope backend `publicVisible()` no model de reports.
- [x] Separar resource publico vs privado (`PublicReportResource`).
- [x] Aplicar politica publica em `ReportController@index` e `ReportMapController@index`.
- [x] Revisar `show` para evitar campos internos sem permissao.
- [x] Criar testes de visibilidade publica (status permitido + payload sem campos internos).

Gate necessario:
- [x] Feature tests de visibilidade PASS
- [x] Validacao manual de payload publico sem campos sensiveis

---

## `PR-05` - Pipeline de Imagem
Status: `PENDENTE`

- [ ] Adicionar `browser-image-compression` no web.
- [ ] Implementar pipeline unico (1920px, alvo ~350KB, WebP fallback JPEG).
- [ ] Garantir compressao antes do draft e antes do upload.
- [ ] Ajustar limite backend para 8MB em create/upload media.
- [ ] Criar testes (front compressao + backend limite upload).

Gate necessario:
- [ ] Lint + testes web/api PASS
- [ ] Amostra real: >=90% imagens <= 400KB

---

## `PR-06` - UX Mapa Premium
Status: `PENDENTE`

- [ ] Skeleton de mapa/tiles para evitar flash inicial.
- [ ] CTA flutuante "Confirmar local" no step de localizacao.
- [ ] Haptic leve em ajuste/confirmacao de pino.
- [ ] Fallback "Enviar mesmo assim" em falha de reverse geocode.
- [ ] Ajustes de acessibilidade e estados de erro sem bloqueio.

Gate necessario:
- [ ] Testes de fluxo manual mobile (GPS ok/negado/offline parcial)
- [ ] Sem bloqueio de envio em erro parcial

---

## `PR-07` - Rate Limit Dedicado
Status: `PENDENTE`

- [ ] Criar limiters `reports-create` (10/h tenant+ip) e `reports-media` (30/h tenant+ip).
- [ ] Aplicar middleware de throttle dedicado nas rotas de reports.
- [ ] Instrumentar logs para bloqueios (tenant/ip/rota).
- [ ] Testes de isolamento por tenant (A bloqueado nao afeta B).

Gate necessario:
- [ ] Testes de rate limit PASS
- [ ] Logs de bloqueio visiveis no ambiente de teste

---

## `PR-08` - Conflitos de Edicao (409)
Status: `PENDENTE`

- [ ] Definir token de versao (`updated_at` ou `version`) no contrato.
- [ ] Validar token no backend antes de atualizar status/edicao.
- [ ] Retornar `409 Conflict` com estado atual em divergencia.
- [ ] Tratar erro `409` no front com CTA de refresh/retry.
- [ ] Criar teste de concorrencia (dois updates concorrentes).

Gate necessario:
- [ ] Teste de conflito PASS
- [ ] UX de conflito sem quebrar fluxo

---

## `PR-09` - Hardening de Dados + Indices
Status: `PENDENTE`

- [ ] Backfill de `city_id` legado em `citizen_reports`.
- [ ] Tornar `city_id` `NOT NULL` com rollback seguro.
- [ ] Criar indices compostos tenant-aware:
  - [ ] `(city_id, created_at)`
  - [ ] `(city_id, status, created_at)`
  - [ ] `(city_id, category_id, created_at)`
- [ ] Validar `EXPLAIN` das queries principais.

Gate necessario:
- [ ] Migracoes executadas sem erro
- [ ] `EXPLAIN` com uso de indice nas consultas alvo

---

## `PR-10` - Governanca Final (Contratos/Types/Qualidade/Obs)
Status: `PENDENTE`

- [ ] Alinhar `contracts/openapi.yaml` ao comportamento real (multipart, headers, resources).
- [ ] Atualizar `contracts/features.yaml` (rotas reais do modulo).
- [ ] Consolidar tipos de report no front (eliminar duplicidade legado/novo).
- [ ] Fechar debitos de lint remanescentes no modulo de denuncias.
- [ ] Estabilizar execucao de testes em CI (stack DB definida).
- [ ] Instrumentar metricas minimas de outbox/rate-limit/idempotencia.

Gate necessario:
- [ ] Contrato e implementacao sem drift critico
- [ ] CI verde no pacote reports (web+api)

---

## 3. Regras de Execucao para Proxima PR

- [x] Sempre criar doc de tasks detalhadas por PR com IDs.
- [x] Cada task deve ter arquivo-alvo e DoD claro.
- [x] Encerrar PR com bloco de evidencias (comando + resultado).
- [x] Nao avancar para proxima PR sem gate de testes/lint do escopo atual.
- [x] Manter checklist central atualizado ao final de cada PR.
