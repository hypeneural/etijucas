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

