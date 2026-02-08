# Análise Completa da Stack e Lógica do Módulo de Denúncias

Data: 2026-02-08  
Projeto: `etijucas`  
Escopo analisado: Frontend (`apps/web`), API/Backend (`apps/api`), multi-tenancy e UX/UI do módulo de denúncias.

---

## 1. Resumo Executivo

O módulo de denúncias está funcional e já possui base sólida em:

- wizard mobile-first com categorias, localização, fotos e revisão;
- persistência de rascunho em IndexedDB com blobs;
- isolamento tenant-aware no backend com `TenantContext` + `BelongsToTenant`;
- domínio backend organizado (`Domains/Reports`) com histórico de status e mídia via Spatie.

Principais gaps para fechar:

- idempotência de criação não está ativa no endpoint de denúncias;
- fila offline e background sync estão parciais/desconectados entre si;
- compressão de imagem existe, mas não segue o padrão-alvo (biblioteca, tamanho alvo, EXIF explícito, fallback controlado);
- falta controle de conflito de edição (`409 Conflict`) no update de status;
- rate limiting específico de denúncias por `tenant + ip` (por hora) não está implementado;
- índices compostos de escala para `citizen_reports` ainda incompletos;
- UX do mapa pode evoluir (skeleton, haptic, confirmação explícita de local, estados offline/sync melhores).

---

## 2. Metodologia e Evidências

Leitura e validação de código-fonte real (não só documentação), incluindo:

- Front: `apps/web/src/components/report/*`, `apps/web/src/pages/*Report*`, `apps/web/src/services/report*.ts`, `apps/web/src/hooks/*report*`, `apps/web/src/lib/idb/reportDraftDB.ts`, `apps/web/src/lib/imageCompression.ts`, `apps/web/src/api/*`, `apps/web/src/store/useTenantStore.ts`.
- API/Backend: `apps/api/routes/api.php`, `apps/api/app/Http/Middleware/TenantContext.php`, `apps/api/app/Traits/BelongsToTenant.php`, `apps/api/app/Domains/Reports/*`, migrações de reports e tenancy.
- Contratos: `contracts/openapi.yaml`, `contracts/features.yaml`.

Validação executada:

- `pnpm --filter @repo/web lint` -> **falhou** com vários erros globais de lint (incluindo hooks condicionais em páginas de denúncias).
- `php artisan test --filter=CitizenReportStatusTest` (em `apps/api`) -> **falhou** por incompatibilidade de migration com SQLite (`ALTER TABLE ... MODIFY COLUMN ... ENUM`).

---

## 3. Stack Atual

## 3.1 Frontend (apps/web)

- React 18 + Vite + TypeScript
- TailwindCSS + Radix UI + Framer Motion
- TanStack Query v5 + persistência de cache
- Zustand (estado global, inclusive tenant)
- Leaflet + React-Leaflet
- IndexedDB (`idb` + `idb-keyval`)
- PWA com `vite-plugin-pwa` e Workbox

Arquivo-base de dependências: `apps/web/package.json`.

## 3.2 API/Backend (apps/api)

- Laravel 12 / PHP 8.2
- Sanctum (auth)
- Spatie Media Library
- Spatie Activitylog / Permission / QueryBuilder
- Filament (painel admin)
- MariaDB/MySQL (produção), SQLite em testes

Arquivo-base de dependências: `apps/api/composer.json`.

## 3.3 Arquitetura Geral

- Monorepo (`apps/web`, `apps/api`, `packages/*`).
- API principal em `routes/api.php`.
- Domínio de denúncias em `app/Domains/Reports`.
- Multi-tenancy lógico por `city_id` com resolução de tenant por middleware.

---

## 4. Módulo de Denúncias: Estado Atual

## 4.1 Frontend

Fluxo principal:

- Página wizard: `apps/web/src/pages/ReportWizardPage.tsx`
- Steps:
  - `StepCategory.tsx`
  - `StepLocation.tsx`
  - `StepCamera.tsx`
  - `StepReview.tsx`
- Lista: `apps/web/src/pages/MyReportsPage.tsx` e `apps/web/src/screens/ReportScreen.tsx`
- Detalhe: `apps/web/src/pages/ReportDetailPage.tsx`
- Mapa: `apps/web/src/screens/ReportsMapScreen.tsx`

Serviços:

- API reports: `apps/web/src/services/report.service.ts`
- Sync outbox (draft-based): `apps/web/src/services/reportSync.service.ts`
- Sync queue legado: `apps/web/src/hooks/useOnlineSync.ts` + `apps/web/src/lib/localDatabase.ts`
- Draft IDB: `apps/web/src/lib/idb/reportDraftDB.ts`

Pontos fortes:

- Wizard estruturado e com feedback visual consistente.
- Captura de localização com GPS + busca + pin arrastável.
- Persistência de rascunho com imagem em blob no IndexedDB.
- Limite de 3 imagens aplicado no front.

Pontos frágeis:

- Dois modelos offline coexistem (`reportDraftDB` e `syncQueueDB`), com pouca integração.
- `reportSync.service.ts` existe, mas não está claramente plugado no fluxo principal.
- `useOnlineSync` existe, mas não está ligado no bootstrap do app.
- `ReportsMapScreen.tsx` usa `fetch('/api/v1/...')` direto (não usa `apiClient` tenant-aware).

## 4.2 API/Backend

Rotas de reports (públicas e autenticadas): `apps/api/routes/api.php`.

Domínio:

- Controller: `apps/api/app/Domains/Reports/Http/Controllers/ReportController.php`
- Model: `apps/api/app/Domains/Reports/Models/CitizenReport.php`
- Request: `CreateReportRequest.php`, `UpdateReportStatusRequest.php`
- Resource: `ReportResource.php`
- Map endpoint: `ReportMapController.php`

Dados:

- Tabela principal: `citizen_reports`
- Histórico: `report_status_history`
- Categorias: `report_categories`
- Cidade por tenant: coluna `city_id` (migration separada)

Pontos fortes:

- Histórico de status consistente.
- Mídia com conversões (`thumb`, `web`) via Spatie.
- Scope tenant aplicado no model (`BelongsToTenant`).

Pontos frágeis:

- Endpoint público de listagem não filtra explicitamente “somente aprovadas”.
- Endpoint de mapa usa campo `address` em vez de `address_text` (inconsistência).
- Idempotência middleware existe, mas não está aplicada nas rotas de reports.
- Upload máximo backend está em 15MB (não 8MB).

---

## 5. Multi-Tenancy no Módulo de Denúncias

## 5.1 Backend (implementação)

Resolução de tenant:

- Middleware: `apps/api/app/Http/Middleware/TenantContext.php`
- Ordem de resolução:
  - domínio (`city_domains`)
  - header `X-City` (se habilitado)
  - path `/uf/cidade`
  - fallback (se `strict_mode` false)

Exigência de tenant real:

- Middleware `require-tenant`: `apps/api/app/Http/Middleware/RequireTenant.php`
- Rejeita fallback para rotas que exigem tenant.

Isolamento de dados no model:

- Trait `BelongsToTenant`: `apps/api/app/Traits/BelongsToTenant.php`
- Comportamentos:
  - auto set `city_id` no `creating`;
  - global scope `where city_id = Tenant::cityId()` no read;
  - bloqueio de `save` com `city_id` divergente;
  - validação de `bairro_id` pertencer à mesma cidade.

No módulo de denúncias:

- `CitizenReport` usa `BelongsToTenant`, então operações padrão ficam tenant-scoped.

## 5.2 Frontend (implementação)

- Tenant store: `apps/web/src/store/useTenantStore.ts`
- API client envia `X-City` com base na URL/tenant atual: `apps/web/src/api/client.ts`.
- Rotas suportam modo canônico com prefixo (`/:uf/:cidade/...`): `apps/web/src/App.tsx`.

## 5.3 Riscos de tenancy ainda presentes

- Chamadas diretas via `fetch('/api/v1/...')` em `ReportsMapScreen.tsx` ignoram `apiClient` e podem quebrar cenário com header override.
- Cache HTTP de endpoints estáticos não define `Vary: X-City` no middleware genérico.
- `city_id` em `citizen_reports` foi criado como nullable; sem backfill formal para legado.

---

## 6. Diagnóstico UX/UI Atual (Front de Denúncias)

Estado atual:

- UX geral boa no wizard (passo a passo, ajuda contextual, mapas, fotos, revisão).
- Componente de mapa funcional com drag/click e `flyTo`.
- Fluxo visual moderno com animações leves e feedbacks.

Gaps de UX/UI relevantes:

- Não há modo “Denúncia Rápida” separado do fluxo completo.
- Não há mini-central visível de “pendências offline” do módulo.
- Não há haptic no fluxo de pin/confirmações.
- Não há skeleton dedicado para carregamento de tiles no mapa.
- Tela de envio offline ainda retorna erro genérico, em vez de confirmação “salvo para sincronizar”.

Bugs/consistência no front:

- `MyReportsPage.tsx` chama `setFilter(null)` sem `setFilter` definido (erro de runtime nesse botão).
- `ReportWizardPage.tsx` e `MyReportsPage.tsx` apresentam hooks condicionais (apontado pelo lint).

---

## 7. Gap Analysis das Melhorias Solicitadas

## 7.1 Compressão de imagem client-side (🔴)

Status atual: **Parcial**

- Existe compressão (`apps/web/src/lib/imageCompression.ts`) e uso em `StepCamera.tsx`.
- Não usa `browser-image-compression`.
- Não há meta de tamanho alvo 300-400KB garantida.
- Não há controle explícito de remoção EXIF por política (embora reencode em canvas costume remover metadados).
- Captura nativa da câmera não aplica pipeline unificado de alvo/qualidade por arquivo.

O que falta:

- padronizar pipeline único (prefer WebP + fallback JPEG);
- meta por arquivo (ex.: ~350KB com limites);
- limite backend ajustado para rejeitar originais >8MB;
- garantir integração antes de persistir no draft e antes do upload.

## 7.2 Offline fila + background sync (🟡)

Status atual: **Parcial / Fragmentado**

- Há draft robusto em IDB (`reportDraftDB`).
- Há duas abordagens de sync em paralelo (`reportSync.service.ts` e `useOnlineSync` + `syncQueueDB`).
- Não há integração clara e única no fluxo de envio.
- `report.service.ts` enfileira em erro, mas com `images: []` (risco de perder mídia em sync automático).
- `sw-background-sync.ts` existe, porém não está claramente acoplado ao build de SW.

O que falta:

- unificar um único outbox oficial para reports;
- garantir idempotência e retry determinístico;
- estado UX “pendente/sincronizando/enviado/falhou” visível para usuário;
- fallback iOS baseado em `online` + timer/backoff ativo em runtime.

## 7.3 Conflitos de edição (409 + versionamento) (🟡)

Status atual: **Não implementado**

- Não há `If-Unmodified-Since`, `version`, ETag ou checagem de concorrência no update de status.
- Não há tratamento UX de conflito 409 no front.

O que falta:

- campo/version token no update;
- retorno `409 Conflict` quando versão divergir;
- UX no painel/front para recarregar estado e reaplicar ação.

## 7.4 Rate limiting por tenant + IP (🔴)

Status atual: **Parcial**

- Existe rate limit tenant-aware global (`RateLimiter::for('api')`).
- Rotas de reports usam `throttle:5,1` (genérico por minuto), não por política específica por hora para criação/upload.

O que falta:

- limiter dedicado de reports por `tenant + ip`:
  - criação: 10/h;
  - upload mídia: 30/h.
- logs observáveis para bloqueios por tenant.

## 7.5 Escalabilidade de dados e índices (🟢)

Status atual: **Parcial**

Existentes em `citizen_reports`:

- `user_id, created_at`
- `status, created_at`
- `bairro_id`
- `category_id`
- `city_id`
- `city_id, status`

Faltantes para queries tenant-scoped:

- `city_id, created_at`
- `city_id, status, created_at`
- `city_id, category_id`

## 7.6 UX mobile no mapa (🟢)

Status atual: **Parcial**

- `flyTo` existe.
- Badges de qualidade existem.
- Ajuste por drag/click existe.

Faltam:

- skeleton de tiles/mapa;
- haptic no ajuste/confirmar;
- CTA flutuante explícito “Confirmar Local”;
- fallback visual de erro parcial com “Enviar mesmo assim”.

---

## 8. Inconsistências de Contrato e Dívida Técnica

## 8.1 Contratos API desatualizados

- `contracts/openapi.yaml` ainda descreve criação de report com payload JSON legado (`category_id`, etc), enquanto implementação usa campos camelCase + multipart.
- `contracts/features.yaml` cita endpoint antigo `/api/v1/users/me/reports`.

## 8.2 Idempotência front/back desalinhada

- Front gera chaves não-UUID (`generateIdempotencyKey` em `types/report.ts`).
- Middleware backend `IdempotencyKey` exige UUID.
- Como middleware não está aplicado em `/reports`, o contrato está “quebrado silenciosamente”.

## 8.3 Duplicidade de modelos no front

- `types/index.ts` e `types/report.ts` mantêm modelos diferentes de report (legado x atual), gerando risco de bug em hooks/serviços offline legados.

---

## 9. Plano de Melhoria Priorizado (Roadmap)

## Sprint 1 - Performance + Segurança (impacto imediato)

1. Compressão client-side unificada:
   - adotar `browser-image-compression`;
   - alvo ~350KB, `maxWidthOrHeight=1920`, WebP com fallback JPEG;
   - aplicar antes de salvar no draft e antes do upload.
2. Rate limit dedicado para reports:
   - criação 10/h por `tenant+ip`;
   - mídia 30/h por `tenant+ip`.
3. Índices compostos de reports:
   - `(city_id, created_at)`,
   - `(city_id, status, created_at)`,
   - `(city_id, category_id)`.
4. Ajustes rápidos UX mapa:
   - skeleton inicial de mapa/tiles;
   - CTA de confirmação de local.

DoD Sprint 1:

- upload médio < 400KB;
- endpoints de reports respeitando limites por tenant/ip;
- `EXPLAIN` usando índices compostos de reports;
- mapa sem “flash” em branco durante carregamento.

## Sprint 2 - Resiliência Offline

1. Unificar outbox oficial do módulo (eliminar duplicidade de fluxo).
2. Integrar processamento de fila no bootstrap e em `online`.
3. Garantir envio de mídia em sync offline (não perder imagens).
4. Implementar mini-central de pendências no app.

DoD Sprint 2:

- criação offline entra em fila com mídia preservada;
- reconexão envia automaticamente sem duplicar;
- status de pendência visível ao usuário.

## Sprint 3 - Consistência e Governança

1. Implementar versionamento otimista e `409 Conflict`.
2. Aplicar middleware idempotente em criação de report.
3. Alinhar contratos (`openapi.yaml`, `features.yaml`) ao comportamento real.
4. Revisar lint/hook rules nas páginas de denúncias e tela de mapas.

DoD Sprint 3:

- conflito concorrente retorna 409 e UX trata com refresh;
- idempotência ativa e validada com replay;
- contratos e código sem drift crítico.

---

## 10. Checklist Técnico Objetivo por Camada

Frontend:

- mover `ReportsMapScreen` para `apiClient` (sem `fetch('/api/v1/...')`);
- unificar tipagem de report (`types/report.ts` como fonte única);
- corrigir hooks condicionais em `ReportWizardPage.tsx` e `MyReportsPage.tsx`;
- corrigir botão de limpar filtro em `MyReportsPage.tsx` (`setFilter` inexistente);
- implementar compressão padrão requerida + métricas de tamanho;
- status UX de fila offline no módulo.

API/Backend:

- aplicar `idempotent` em `POST /reports`;
- criar limiters dedicados `reports-create` e `reports-media`;
- adicionar validação de concorrência para update de status;
- corrigir `ReportMapController` para `address_text`;
- revisar visibilidade pública de status/notas internas.

Banco:

- migrations de índices compostos tenant-aware em `citizen_reports`;
- plano de backfill/normalização para `city_id` legado nullable.

Qualidade:

- ajustar lint para excluir artefatos `dev-dist`;
- estabilizar suite de testes para ambiente SQLite ou usar DB compatível;
- adicionar testes de integração para fluxo completo de reports.

---

## 11. Conclusão

O módulo de denúncias já está em um bom nível de maturidade para uso real, especialmente em UX do wizard, estrutura de domínio e isolamento multi-tenant no backend.  
Para atingir robustez de escala e operação “offline-first premium”, a prioridade é consolidar idempotência + fila/sync + compressão + rate limit dedicado, além de fechar inconsistências de contrato e pontos de UX mobile no mapa.


---

## 12. Atualizacao de Prioridades (P0/P1/P2)

Com base no estado real do codigo e nas prioridades de produto/operacao, a sequencia recomendada fica:

### P0 - Producao (nao pode esperar)

- Idempotencia real em `POST /reports`:
  - key UUID v4 no front;
  - middleware aplicado na rota;
  - replay retornando mesma resposta sem criar novo report.
- Outbox unica oficial para reports (sem fragmentacao entre `reportDraftDB`, `syncQueueDB`, `reportSync.service.ts`).
- Seguranca de tenant no front:
  - remover `fetch('/api/v1/...')` direto;
  - usar `apiClient` tenant-aware em 100% dos calls do modulo;
  - query keys tenant-aware no TanStack Query.
- Politica de visibilidade publica:
  - endpoint publico retornando apenas registros permitidos;
  - resource publico sem campos internos/sensiveis.

### P1 - Confiabilidade e Escala

- Pipeline unico de imagem (alvo ~350KB, max 1920, WebP com fallback JPEG, sem EXIF).
- Rate limiting dedicado por `tenant + ip`:
  - `reports:create` 10/h;
  - `reports:media` 30/h.
- Conflito de edicao com `409 Conflict` (token de versao em update de status).
- Backfill + hardening de `city_id` em `citizen_reports` (rumo a `NOT NULL`).
- Indices compostos faltantes em `citizen_reports`.

### P2 - Governanca e DevEx

- Contratos atualizados (`openapi.yaml`, `features.yaml`) refletindo multipart + idempotencia + visibilidade.
- Lint e testes estabilizados para CI (incluindo correcoes de hooks condicionais no front).
- Observabilidade minima para fila offline, throttling e deduplicacao.

---

## 13. PR Plan Detalhado por Arquivo

Plano detalhado por PR e por arquivo foi criado em:

- `DENUNCIAS_PR_PLAN_EXECUCAO_POR_ARQUIVO_2026-02-08.md`

Esse plano inclui:

- ordem de execucao em PRs pequenos e seguros;
- arquivos exatos a alterar em front/api/banco;
- DoD por PR;
- testes por PR;
- riscos e rollback.
