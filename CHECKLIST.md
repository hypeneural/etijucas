# ✅ Checklist Master — ETijucas Monorepo (Vibecoding Proof)

## 0) Saúde geral do monorepo

- [x] `pnpm install` roda na raiz sem warnings críticos
- [x] `pnpm dev` sobe API + Web sem erro *(testar manualmente)*
- [x] `pnpm build` passa *(scaffold ok, testar antes de deploy)*
- [x] Estrutura base existe e está consistente:
  - [x] `apps/api`
  - [x] `apps/web`
  - [x] `packages/sdk`
  - [x] `packages/shared`
  - [x] `contracts/openapi.yaml`
  - [x] `contracts/features.yaml`
  - [x] `ARCHITECTURE.md`, `DEPLOY.md`, `CONTRIBUTING.md`

---

## 1) Organização "Feature-First"

### Frontend

- [x] Existe `apps/web/src/features/<feature>/` para cada feature principal
- [x] Existe `apps/web/src/core/` para itens globais
- [x] Código gradualmente migrado para features *(em progresso)*
- [x] Cada feature tem:
  - [x] `pages/` (scaffold criado pelo make:feature)
  - [x] `components/` (scaffold criado pelo make:feature)
  - [x] `api/` (hooks/queryKeys)
  - [x] `index.ts` (exports)

### Backend

- [x] Existe `apps/api/app/Domains/<Domain>/` para cada domínio
- [x] Controllers usam Actions quando necessário
- [x] Validação em `Http/Requests/` (11 FormRequests existentes)
- [x] Policies podem ser adicionadas por feature

---

## 2) Mapa de features e contratos

- [x] `contracts/openapi.yaml` existe (28+ endpoints)
- [x] `contracts/features.yaml` existe com todas features
- [x] `pnpm check:features` passa sem erros críticos
- [x] `pnpm check:contracts` existe

---

## 3) SDK tipado

- [x] `packages/sdk` gera clientes tipados
- [x] `pnpm sdk:gen` funciona
- [x] SDK tem endpoints completos (auth, forum, events)
- [x] `api/client.ts` em `src/api/` + `core/api/` (re-exporta)

---

## 4) Padrão de endpoints

- [x] Rotas começam em `/api/v1/...`
- [x] Convenção por módulo documentada
- [x] List endpoints têm paginação (Topics, Events, Comments)
- [x] Responses com shape fixo (12 Resources existentes)

---

## 5) Segurança e permissões

### Backend
- [x] Autenticação via `auth:sanctum`
- [x] Rate limit em `/auth/send-otp`, `/auth/login`
- [x] Logs com `request_id` (RequestId middleware)

### Frontend
- [x] Guardas de rota (`AuthGuard`, `RoleGuard`)
- [x] Helper `can('forum.topic.create')` (`core/router/permissions`)

---

## 6) Offline-first

- [x] `src/core/offline/queue` existe (Zustand)
- [x] OfflineMutation inclui `idempotencyKey`
- [x] Retry policies definidas
- [x] Documentado em `OFFLINE_SYNC.md`
- [x] Backend aceita `Idempotency-Key` (IdempotencyKey middleware)

---

## 7) Performance

### Backend
- [x] Cache em endpoints estáticos (`CacheHeaders` middleware)
- [x] `config:cache`, `route:cache` documentados para deploy

### Frontend
- [x] Query keys consistentes por feature
- [x] `staleTime` configurado (24h para estáticos)
- [x] Lazy loading de rotas (App.tsx usa lazy())

---

# ✅ Checklist: Criar Nova Feature

## A) Back-end

```bash
pnpm make:feature nome-da-feature
```

- [ ] Criou Domain: `app/Domains/<Feature>/`
- [ ] Criou Model + Migration
- [ ] Criou Request (validação)
- [ ] Criou Action (regra de negócio)
- [ ] Criou Controller (orquestração)
- [ ] Criou Resource (response)
- [ ] Criou Policy (se owner/permissão)
- [ ] Registrou rota em `/api/v1/<feature>/...`
- [ ] Escreveu 1 teste mínimo
- [ ] Atualizou `contracts/openapi.yaml`
- [ ] Rodou `pnpm sdk:gen`

## B) Front-end

```bash
pnpm make:feature nome-da-feature
```

- [ ] Criou pasta `src/features/<feature>/`
- [ ] Criou página em `pages/`
- [ ] Registrou rota no router
- [ ] Criou hooks em `api/`
- [ ] Usou `@repo/sdk`
- [ ] Lidou com loading/error
- [ ] Se offline: mutation com idempotencyKey
- [ ] Se permissão: esconde UI + trata 403

## C) Validação

```bash
pnpm check:features   # Valida estrutura
pnpm check:contracts  # Valida SDK vs OpenAPI
pnpm lint             # Sem erros
pnpm dev              # Testa fluxo
```

---

# ✅ Checklist de Deploy

```bash
# Local
pnpm prod:build

# Servidor
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan migrate --force
php artisan storage:link
```

- [ ] `apps/api/public/app/` gerado
- [ ] Servidor serve SPA com fallback
- [ ] `/api` aponta para Laravel
- [ ] `.env` revisado

---

# ✅ Sinais de Sucesso (Vibecoding Proof)

> Estes são critérios de validação, não checkboxes de tarefas.

1. **Feature isolada** — Código não espalhado fora do módulo
2. **Contrato atualizado** — OpenAPI + SDK gerado
3. **Sem fetch solto** — Usa SDK/client oficial
4. **Lógica no lugar certo** — Actions no back, hooks no front
5. **Permissões refletidas** — Back + Front sincronizados
6. **Offline resiliente** — Idempotência funcionando

---

# ✅ Checklist — Denúncias Cidadãs (Vibecoding)

**Objetivo**
Aplicar mudanças cirúrgicas no módulo de Denúncias Cidadãs para garantir consistência, mapa real, câmera robusta, PWA real e geocoding com bias.

**Aceite final**
1. Status e KPIs consistentes: `recebido | em_analise | resolvido | rejeitado`.
2. OpenAPI e frontend usam `GET /api/v1/reports/me`.
3. StepLocation com mapa real, pin draggable e reverse apenas em `dragend/click`.
4. StepCamera sem auto-start, com fallback de upload.
5. Drafts e imagens persistem em IndexedDB (Blob).
6. Outbox com estados `draft -> queued -> sending -> sent -> failed` e backoff.
7. Autocomplete com bias lat/lon quando disponível.
8. Offline com fallback inteligente sem travar o wizard.

---

## 1) Consistência de domínio: status + paths

- [ ] Definir enum oficial no front: `ReportStatus = 'recebido'|'em_analise'|'resolvido'|'rejeitado'` em `apps/web/src/types/report.ts`.
- [ ] Remover uso de `em_andamento` e `nao_procede` em KPIs, chips e badges do front.
- [ ] Se precisar granularidade, criar `substatus` opcional sem impactar KPIs.
- [ ] Atualizar OpenAPI para `/api/v1/reports/me` em `contracts/openapi.yaml`.
- [ ] Garantir config do front usa `/reports/me` em `apps/web/src/api/config.ts`.
- [ ] Confirmar rota `/api/v1/reports/me` no backend em `apps/api/routes/api.php`.
- [ ] Se necessário, criar alias temporário `/users/me/reports` apontando para `/reports/me`.

## 2) Mapa real no StepLocation (Leaflet)

- [ ] Adicionar `react-leaflet` no StepLocation e renderizar mapa real com `MapContainer` + `TileLayer`.
- [ ] Implementar pin draggable e click-to-move com `Marker` + `useMapEvents`.
- [ ] Chamar reverse geocode somente em `dragend` e `click` com debounce 300-500ms.
- [ ] Evitar reverse em `moveend` e `zoomend`; salvar zoom no draft sem request.
- [ ] Botão "Centralizar no GPS" quando houver coordenadas.
- [ ] Ao selecionar autocomplete, usar `map.flyTo([lat, lon], 17)` e mover pin.
- [ ] Salvar no draft: `lat`, `lon`, `zoom`, `address_text`, `address_source`, `location_quality`, `location_accuracy_m`.

## 3) Modo offline no mapa (fallback inteligente)

- [ ] Detectar `navigator.onLine` e usar listeners `online/offline`.
- [ ] Se offline, não carregar tiles e exibir placeholder estático.
- [ ] Permitir somente endereço manual + GPS (se disponível).
- [ ] Definir `location_quality` = `manual` ou `aproximada` com texto claro no UI.

## 4) Drafts + imagens em IndexedDB (PWA real)

- [ ] Criar `apps/web/src/lib/idb/reportDraftDB.ts` com store `drafts`.
- [ ] Persistir `draft_id`, `step`, `form`, `location`, `images: Blob[]`, `created_at`, `updated_at`.
- [ ] Criar store `outbox` com estados `draft|queued|sending|sent|failed`.
- [ ] Migrar draft de localStorage para IndexedDB na primeira abertura do wizard.
- [ ] Em StepCamera, salvar imagens como Blob comprimido e regenerar `objectURL` ao carregar do IDB.

## 5) Outbox e sync automático

- [ ] Criar `apps/web/src/services/reportSync.service.ts`.
- [ ] Processar itens `queued/failed` quando online com backoff exponencial.
- [ ] Criar denúncia com `X-Idempotency-Key` e registrar `report_id`.
- [ ] Enviar imagens uma a uma em `/reports/{id}/media`.
- [ ] Se erro 4xx, marcar como `failed` sem retry automático.

## 6) Câmera robusta (sem auto-start)

- [ ] Remover auto-start da câmera no mount em `apps/web/src/components/report/StepCamera.tsx`.
- [ ] Mostrar botão "Ativar câmera" e "Escolher arquivo" sempre disponível.
- [ ] Se `!window.isSecureContext`, desativar câmera e informar necessidade de HTTPS.
- [ ] Antes de ativar, usar `enumerateDevices()` e checar `videoinput`.
- [ ] Tratar `NotAllowedError`, `NotReadableError`, `NotFoundError` com mensagens claras e fallback.
- [ ] Usar `input accept="image/*" capture="environment"` no mobile como atalho.
- [ ] Exibir feedback de compressão: "8.2MB -> 1.1MB".

## 7) Geocoding com bias e proxy resiliente

- [ ] No front, enviar `lat/lon` no autocomplete quando existir.
- [ ] Usar debounce 250-350ms no autocomplete e abortar requests anteriores.
- [ ] No backend, cache por query + lat/lon arredondado e TTL curto.
- [ ] No reverse, cache por lat/lon arredondado com TTL longo.
- [ ] Se Nominatim falhar, retornar payload de fallback sem bloquear envio.

## 8) Privacidade e visibilidade pública

- [ ] No endpoint público `/api/v1/reports`, não retornar `user_id` nem dados do autor.
- [ ] Definir regra clara de visibilidade pública (`is_public` ou `visibility`).
- [ ] Documentar essa regra no OpenAPI e em `DENUNCIAS_SPEC.md`.

## 9) TanStack Query e cache

- [ ] Padronizar chaves: `['reports','public',filters]`, `['reports','mine',filters]`, `['reports','detail',id]`, `['reports','stats']`, `['reports','categories']`.
- [ ] Invalidar `mine` e `stats` após envio.

## 10) Entregáveis (arquivos)

- [ ] Front: `apps/web/src/pages/ReportWizardPage.tsx` (fluxo e persistência).
- [ ] Front: `apps/web/src/components/report/StepLocation.tsx` (mapa real).
- [ ] Front: `apps/web/src/components/report/StepCamera.tsx` (sem auto-start).
- [ ] Front: `apps/web/src/types/report.ts` (status unificado).
- [ ] Front: `apps/web/src/services/report.service.ts` (geocoding bias).
- [ ] Front: `apps/web/src/api/config.ts` (paths).
- [ ] Front: `apps/web/src/lib/idb/reportDraftDB.ts` (novo).
- [ ] Front: `apps/web/src/services/reportSync.service.ts` (novo).
- [ ] Back: `apps/api/app/Domains/Geocoding/Http/Controllers/GeocodeController.php`.
- [ ] Back: `apps/api/app/Domains/Reports/Http/Controllers/ReportController.php`.
- [ ] Back: `apps/api/routes/api.php` (alias opcional).
- [ ] Spec: `contracts/openapi.yaml` e `DENUNCIAS_SPEC.md`.

## 11) Testes manuais obrigatórios

- [ ] StepLocation: GPS permitido/negado, pin drag/click, autocomplete com bias, offline fallback.
- [ ] StepCamera: HTTPS vs HTTP, sem câmera, permissões negadas, limite 3 imagens.
- [ ] Offline: criar denúncia offline e sincronizar depois.
- [ ] KPIs e filtros: somente status oficial.

## 12) Quick wins (1-2 dias)

- [ ] Parar de abrir câmera no mount e implementar fallback de upload.
- [ ] Pin draggable com reverse apenas em `dragend/click`.
- [ ] Ajustar enum de status e KPIs no front e docs.

