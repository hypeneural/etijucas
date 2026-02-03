**Denuncias Cidadas - Analise e Checklist de Implementacao**

**Resumo**
Documento unico com analise minuciosa do que ja existe, gaps e checklist detalhado para evoluir o modulo de Denuncias Cidadas mantendo a stack atual e mudancas cirurgicas.

**Stack atual (confirmado nos arquivos)**
- Front: React + Vite PWA, TypeScript, Tailwind, Framer Motion, Lucide, shadcn/ui, Zustand, TanStack Query, IndexedDB.
- Mapas: Leaflet via react-leaflet (ainda nao instalado no front).
- Back: Laravel 12 (composer.json), MariaDB, Sanctum, Spatie Media Library.
- Geocoding: proxy backend com Nominatim, cache e throttle.

**Arquivos base (existentes)**
- Wizard: `apps/web/src/pages/ReportWizardPage.tsx`
- Steps: `apps/web/src/components/report/StepCategory.tsx`, `apps/web/src/components/report/StepLocation.tsx`, `apps/web/src/components/report/StepCamera.tsx`, `apps/web/src/components/report/StepReview.tsx`
- Tipos e services: `apps/web/src/types/report.ts`, `apps/web/src/services/report.service.ts`, `apps/web/src/api/config.ts`
- Back: `apps/api/routes/api.php`, `apps/api/app/Domains/Reports/Http/Controllers/ReportController.php`, `apps/api/app/Domains/Geocoding/Http/Controllers/GeocodeController.php`
- Spec: `contracts/openapi.yaml`, `DENUNCIAS_SPEC.md`

**Analise do que ja temos (confirmado nos arquivos)**
- Wizard em 4 passos funcional em `ReportWizardPage.tsx`.
- StepCategory usa categorias do backend e exibe dicas (`tips`) por categoria.
- Existe tela publica `ReportScreen.tsx` com KPIs, busca e filtros.
- StepLocation ja faz:
  - GPS via `navigator.geolocation`.
  - reverse geocode no backend.
  - autocomplete com debounce 300ms.
  - mapa apenas placeholder (card com gradiente e pin animado).
- StepCamera ja tem:
  - captura por camera com `getUserMedia`.
  - galeria via input file.
  - tratamento de erros (NotAllowed, NotFound, NotReadable).
  - auto-start no mount (causa de friccao).
- StepReview exige titulo e confirmacao antes do envio.
- ReportSuccess com confetti, copia/compartilha protocolo e CTA de retorno.
- Draft salvo em localStorage em `ReportWizardPage.tsx` sem persistir imagens.
- Upload multipart no backend com limite 3 imagens (15MB cada) via Spatie Media Library.
- ReportController:
  - valida e salva denuncia com `strip_tags` em `description`.
  - limita 3 imagens por denuncia.
- ReportResource:
  - nao expõe `user_id` no publico.
  - retorna `user` apenas para admin/moderator.
  - retorna `statusLabel`, `statusColor`, `statusIcon` e `locationQualityLabel`.
- Enums no backend:
  - `ReportStatus`: recebido, em_analise, resolvido, rejeitado.
  - `LocationQuality`: precisa, aproximada, manual.
- Geocoding proxy em `GeocodeController.php` com cache e viewbox de Tijucas (30 min).
- Throttle:
  - `/geocode/*` com `throttle:30,1`.
  - `/reports` com `throttle:5,1`.
- Endpoints no backend:
  - Publico: `/reports`, `/reports/stats`, `/report-categories`.
  - Auth: `/reports`, `/reports/me`, `/reports/{id}`, `/reports/{id}/media`, `/reports/{id}/status`.
- Offline basico: `syncQueueDB` usado no `report.service.ts` para fila de envio, sem worker de reenvio.
- `report.service.ts` envia FormData com `X-Idempotency-Key` e, em falha, coloca item na fila sem imagens.
- Model `CitizenReport`:
  - gera protocolo automaticamente `ETJ-YYYY-XXXXXX`.
  - salva historico de status em `ReportStatusHistory`.
  - possui soft delete.
- Banco usa `citizen_reports` (nao `reports`) com indices por status, user e bairro.

**Gaps principais (baseado no codigo)**
- Status inconsistentes entre front e backend.
- OpenAPI ainda aponta `GET /users/me/reports` enquanto o sistema usa `/reports/me`.
- Mapa ainda e placeholder, sem pino real e sem interacao de zoom/pan.
- Camera inicia no mount e aumenta erro de permissao.
- Draft nao persiste imagens, gerando perda de trabalho.
- Autocomplete nao envia bias lat/lon, reduzindo qualidade.
- Offline sem fallback claro no mapa.
- OpenAPI descreve imagens em base64 no JSON, mas o backend recebe multipart.
- OpenAPI usa `category_id`/`bairro_id`, mas o backend espera `categoryId`/`bairroId` (FormData).
- StepReview diz "descricao opcional", mas backend exige `description` com minimo 10 chars.
- Idempotency middleware existe, mas nao esta aplicado nas rotas de `/reports`.
- Query keys de categorias usam `['report','categories']`, divergindo do padrao sugerido.

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
- Atualizar OpenAPI para multipart no `POST /reports`.
- Ajustar StepReview para refletir campos obrigatorios (ou relaxar validacao).
- Aplicar middleware `idempotent` nas rotas de create report.

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

**Checklist de implementacao (ordenado por prioridade P0/P1)**

**P0 - Consistencia e correcoes de contrato (backend + frontend + docs)**
- [ ] Unificar enum oficial no front em `apps/web/src/types/report.ts`.
- [ ] Remover uso de `em_andamento` e `nao_procede` em KPIs, chips e badges (ex: `ReportScreen.tsx`, `useMyReports.ts`).
- [ ] Ajustar KPIs no front para refletir apenas status oficiais.
- [ ] Atualizar OpenAPI para `/api/v1/reports/me` em `contracts/openapi.yaml`.
- [ ] Atualizar OpenAPI do `POST /reports` para `multipart/form-data` (hoje esta como base64).
- [ ] Ajustar OpenAPI para `categoryId`/`bairroId` (camelCase) conforme backend.
- [ ] Confirmar rota `/api/v1/reports/me` no backend (`apps/api/routes/api.php` ja tem).
- [ ] Opcional: alias temporario `/users/me/reports` para compatibilidade.
- [ ] Criar script simples que valida config vs OpenAPI (alvo: `tools/contract-check/check-endpoints.mjs`).
- [ ] Aplicar middleware `idempotent` na rota `POST /reports`.
- [ ] Ajustar StepReview: alinhar "descricao opcional" com validacao real (ou atualizar copy).

**P0 - Camera robusta (frontend)**
- [ ] Remover auto-start no mount do `StepCamera`.
- [ ] Botao "Ativar camera" + "Escolher arquivo" sempre visivel.
- [ ] Desabilitar camera se `!window.isSecureContext`.
- [ ] Checar `enumerateDevices()` antes de ativar.
- [ ] Tratar `NotAllowedError`, `NotReadableError`, `NotFoundError` com mensagens claras.
- [ ] Mobile: usar `input capture="environment"` como atalho.
- [ ] Mostrar feedback de compressao (ex: 8.2MB -> 1.1MB).

**P1 - Mapa real no StepLocation (frontend)**
- [ ] Adicionar dependencias `leaflet` e `react-leaflet` no `apps/web/package.json`.
- [ ] Importar CSS do Leaflet globalmente.
- [ ] Integrar Leaflet com `MapContainer` + `TileLayer`.
- [ ] Implementar pino draggable e click-to-move.
- [ ] Reverse geocode apenas em `dragend` e `click` com debounce 300-500ms.
- [ ] Evitar reverse em `moveend` e `zoomend` (apenas salvar zoom no draft).
- [ ] Botao "Centralizar no GPS".
- [ ] Salvar `lat`, `lon`, `zoom`, `address_text`, `address_source`, `location_quality`.
- [ ] Autocomplete move o pino e chama `map.flyTo`.

**P1 - Offline no mapa (frontend)**
- [ ] Detectar online/offline com listeners.
- [ ] Se offline, nao carregar tiles e exibir placeholder.
- [ ] Permitir apenas GPS e endereco manual.
- [ ] Definir `location_quality` = `manual` ou `aproximada`.

**P1 - Drafts + imagens em IndexedDB (frontend)**
- [ ] Reaproveitar `idb-keyval` (ja instalado) ou criar wrapper simples.
- [ ] Criar `apps/web/src/lib/idb/reportDraftDB.ts`.
- [ ] Migrar draft do localStorage para IndexedDB na primeira abertura.
- [ ] Persistir imagens como Blob no draft.
- [ ] Recriar objectURL ao carregar do IDB.

**P1 - Outbox e sync automatico (frontend)**
- [ ] Evoluir o `syncQueueDB` existente em `apps/web/src/lib/localDatabase.ts` ou criar store dedicada.
- [ ] Criar `apps/web/src/services/reportSync.service.ts`.
- [ ] Implementar estados: `draft -> queued -> sending -> sent -> failed`.
- [ ] Implementar backoff exponencial.
- [ ] Enviar create report com `X-Idempotency-Key`.
- [ ] Enviar media por imagem em `/reports/{id}/media`.
- [ ] Marcar `failed` em erros 4xx sem retry automatico.

**P1 - Geocoding com bias (frontend + backend)**
- [ ] Autocomplete envia lat/lon quando houver.
- [ ] Debounce 250-350ms no autocomplete e abortar requests anteriores.
- [ ] Backend: cache por query + lat/lon arredondado (ja existe, revisar chaves).
- [ ] Backend: fallback quando Nominatim falhar (nao bloquear wizard).
- [ ] Evitar 404 no reverse; retornar payload com `warning`.

**P1 - Privacidade e visibilidade publica (backend + docs)**
- [ ] Confirmar que endpoint publico nao retorna `user_id` nem autor (ReportResource ja controla).
- [ ] Definir `is_public` ou `visibility` se necessario e documentar.
- [ ] Documentar regra de publicacao no OpenAPI e `DENUNCIAS_SPEC.md`.

**P1 - TanStack Query (frontend)**
- [ ] Padronizar keys: `['reports','public',filters]`, `['reports','mine',filters]`, `['reports','detail',id]`, `['reports','stats']`, `['reports','categories']`.
- [ ] Invalidar `mine` e `stats` apos envio.

**Testes manuais (aplicar apos P0/P1)**
- [ ] StepLocation: GPS permitido/negado, drag/click, autocomplete bias, offline fallback.
- [ ] StepCamera: HTTPS vs HTTP, sem camera, permissoes negadas, limite 3 imagens.
- [ ] Offline sync: criar denuncia offline e sincronizar ao voltar online.
- [ ] KPIs e filtros apenas com status oficial.
