**Denuncias Cidadas - Analise e Checklist de Implementacao**

**Resumo**
Documento unico com analise minuciosa do que ja existe, gaps e checklist detalhado para evoluir o modulo de Denuncias Cidadas mantendo a stack atual e mudancas cirurgicas.

**Stack atual**
- Front: React + Vite PWA, TypeScript, Tailwind, Framer Motion, Lucide, shadcn/ui, Zustand, TanStack Query, IndexedDB.
- Mapas: Leaflet via react-leaflet.
- Back: Laravel 11 API, MariaDB, Sanctum, Spatie Media Library.
- Geocoding: proxy backend com Nominatim, cache e throttle.

**Arquivos base (existentes)**
- Wizard: `apps/web/src/pages/ReportWizardPage.tsx`
- Steps: `apps/web/src/components/report/StepCategory.tsx`, `apps/web/src/components/report/StepLocation.tsx`, `apps/web/src/components/report/StepCamera.tsx`, `apps/web/src/components/report/StepReview.tsx`
- Tipos e services: `apps/web/src/types/report.ts`, `apps/web/src/services/report.service.ts`, `apps/web/src/api/config.ts`
- Back: `apps/api/routes/api.php`, `apps/api/app/Domains/Reports/Http/Controllers/ReportController.php`, `apps/api/app/Domains/Geocoding/Http/Controllers/GeocodeController.php`
- Spec: `contracts/openapi.yaml`, `DENUNCIAS_SPEC.md`

**Analise do que ja temos**
- Wizard em 4 passos funcionando, com CTA e validacoes basicas.
- Draft salvo em localStorage, mas sem persistencia de imagens.
- Upload multipart ja implementado no backend com limite de 3 imagens.
- Geocoding via proxy backend com cache e throttle.
- Endpoints completos: create, list public, list me, detail, media, status e stats.
- Offline basico com fila (syncQueueDB) para envios sem rede.

**Gaps principais**
- Status inconsistentes entre front e backend.
- OpenAPI ainda aponta `GET /users/me/reports` enquanto o sistema usa `/reports/me`.
- Mapa ainda e placeholder, sem pino real e sem interacao de zoom/pan.
- Camera inicia no mount e aumenta erro de permissao.
- Draft nao persiste imagens, gerando perda de trabalho.
- Autocomplete nao envia bias lat/lon, reduzindo qualidade.
- Offline sem fallback claro no mapa.

**Melhorias recomendadas (cirurgicas)**
- Unificar status oficial e ajustar KPIs e filtros.
- Alinhar path `/reports/me` em OpenAPI e front/back.
- Substituir mapa placeholder por Leaflet com pin draggable.
- Iniciar camera somente ao clicar "Ativar camera".
- Persistir draft + imagens em IndexedDB com Blob.
- Implementar Outbox com estados formais e retry.
- Enviar bias lat/lon no autocomplete.
- Fallback offline inteligente no mapa.
- Reduzir exposicao de dados sensiveis no endpoint publico.

**Aceite final**
1. Status e KPIs consistentes: `recebido | em_analise | resolvido | rejeitado`.
2. OpenAPI e frontend usam `GET /api/v1/reports/me`.
3. StepLocation com mapa real, pin draggable e reverse apenas em `dragend/click`.
4. StepCamera sem auto-start, com fallback de upload.
5. Draft e imagens persistem offline via IndexedDB.
6. Outbox com estados `draft -> queued -> sending -> sent -> failed`.
7. Autocomplete envia bias lat/lon quando disponivel.
8. Offline com fallback inteligente sem travar o wizard.

---

**Checklist de implementacao**

**1) Consistencia de dominio: status + paths**
- [ ] Definir enum oficial no front em `apps/web/src/types/report.ts`.
- [ ] Remover uso de `em_andamento` e `nao_procede` em KPIs, chips e badges.
- [ ] Ajustar KPIs no front para refletir apenas status oficiais.
- [ ] Atualizar OpenAPI para `/api/v1/reports/me` em `contracts/openapi.yaml`.
- [ ] Confirmar rota `/api/v1/reports/me` no backend em `apps/api/routes/api.php`.
- [ ] Opcional: criar alias `/users/me/reports` por periodo de transicao.
- [ ] Criar script simples que valida config vs OpenAPI.

**2) Mapa real no StepLocation**
- [ ] Integrar Leaflet com `MapContainer` + `TileLayer`.
- [ ] Implementar pino draggable e click-to-move.
- [ ] Reverse geocode apenas em `dragend` e `click` com debounce 300-500ms.
- [ ] Evitar reverse em `moveend` e `zoomend`.
- [ ] Botao "Centralizar no GPS".
- [ ] Salvar `lat`, `lon`, `zoom`, `address_text`, `address_source`, `location_quality`.
- [ ] Autocomplete move o pino e chama `map.flyTo`.

**3) Modo offline no mapa**
- [ ] Detectar online/offline com listeners.
- [ ] Se offline, nao carregar tiles e exibir placeholder.
- [ ] Permitir apenas GPS e endereco manual.
- [ ] Definir `location_quality` = `manual` ou `aproximada`.

**4) Drafts + imagens em IndexedDB**
- [ ] Criar `apps/web/src/lib/idb/reportDraftDB.ts`.
- [ ] Migrar draft do localStorage para IndexedDB na primeira abertura.
- [ ] Persistir imagens como Blob no draft.
- [ ] Recriar objectURL ao carregar do IDB.

**5) Outbox e sync automatico**
- [ ] Criar `apps/web/src/services/reportSync.service.ts`.
- [ ] Implementar estados: `draft -> queued -> sending -> sent -> failed`.
- [ ] Implementar backoff exponencial.
- [ ] Enviar create report com `X-Idempotency-Key`.
- [ ] Enviar media por imagem em `/reports/{id}/media`.
- [ ] Marcar `failed` em erros 4xx sem retry automatico.

**6) Camera robusta**
- [ ] Remover auto-start no mount do `StepCamera`.
- [ ] Adicionar botao "Ativar camera" e "Escolher arquivo".
- [ ] Desabilitar camera se `!window.isSecureContext`.
- [ ] Checar `enumerateDevices()` antes de ativar.
- [ ] Tratar `NotAllowedError`, `NotReadableError`, `NotFoundError` com mensagens claras.
- [ ] Mobile: usar `input capture="environment"` como atalho.
- [ ] Mostrar feedback de compressao (ex: 8.2MB -> 1.1MB).

**7) Geocoding com bias**
- [ ] Autocomplete envia lat/lon quando houver.
- [ ] Debounce 250-350ms no autocomplete.
- [ ] Abortar requests anteriores.
- [ ] Backend: cache por query + lat/lon arredondado.
- [ ] Backend: fallback quando Nominatim falhar.

**8) Privacidade e visibilidade publica**
- [ ] Endpoint publico nao retorna `user_id` nem autor.
- [ ] Definir `is_public` ou `visibility`.
- [ ] Documentar regra de publicacao no OpenAPI e `DENUNCIAS_SPEC.md`.

**9) TanStack Query**
- [ ] Padronizar keys: `['reports','public',filters]`, `['reports','mine',filters]`, `['reports','detail',id]`, `['reports','stats']`, `['reports','categories']`.
- [ ] Invalidar `mine` e `stats` apos envio.

**10) Testes manuais**
- [ ] StepLocation: GPS permitido/negado, drag/click, autocomplete bias, offline fallback.
- [ ] StepCamera: HTTPS vs HTTP, sem camera, permissoes negadas, limite 3 imagens.
- [ ] Offline sync: criar denuncia offline e sincronizar ao voltar online.
- [ ] KPIs e filtros apenas com status oficial.

**Quick wins (1-2 dias)**
- [ ] Parar de iniciar camera no mount + fallback de upload.
- [ ] Pin draggable com reverse apenas em `dragend/click`.
- [ ] Ajustar enum de status e KPIs no front e docs.
