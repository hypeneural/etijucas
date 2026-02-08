# Weather PR Checklist (Obrigatorio)

Data base: 2026-02-08  
Escopo: backend, frontend, cache, tenancy, observabilidade do modulo weather

---

## 1. Status consolidado por PR

- [x] PR-WTH-000 Guardrails de encoding e padrao Weather 2.0.
- [x] PR-WTH-001 Dados de cidade: is_coastal, lat/lon/timezone e seeds.
- [x] PR-WTH-002 Tenant source of truth: tenant_key e headers X-Tenant-*.
- [x] PR-WTH-003 Arquitetura base: Contracts + Providers + Service novo.
- [x] PR-WTH-004 Cache robusto: soft/hard TTL, jitter, lock, stale-if-busy, circuit breaker.
- [x] PR-WTH-005 Endpoint GET /api/v1/weather/bundle com sections e contrato 2.0.
- [x] PR-WTH-006 Frontend transporte tenant-aware (X-City e tenantKey).
- [x] PR-WTH-007 Frontend cache tenant-aware (React Query + IndexedDB + offline).
- [x] PR-WTH-008 UI/UX timezone-safe e consumo por sections.
- [x] PR-WTH-009 HomeAggregator fix e limpeza de fallback hardcoded.
- [x] PR-WTH-010 Telemetria, regressao e hardening.
- [x] PR-WTH-011 Rollout controlado com feature flag e canary.

Fonte: `WEATHER_TASKS_EXECUCAO_PR.md`.

---

## 2. Checklist tecnico por PR

### 2.1 Encoding e integridade de arquivo

- [ ] Arquivos novos/alterados em UTF-8 sem BOM.
- [ ] Sem caracteres quebrados por encoding.
- [x] `pnpm check:tenancy` passou.
- [x] `pnpm check:weather` passou.

### 2.2 Contrato de API

- [x] `bundle` retorna `contract_version` e `provider`.
- [x] `bundle.location` contem `city_slug`, `lat`, `lon`, `timezone`, `is_coastal`.
    - [x] `bundle.cache` contem `generated_at_utc`, `expires_at_utc`, `stale_until_utc`.
- [x] `bundle.cache.degraded` e `bundle.cache.degraded_reason` corretos.
- [x] `bundle.errors` segue `null | {code,msg}` por secao.
- [x] `request_id` presente em body/header.

### 2.3 Tenancy e cache

- [x] Responses com `X-Tenant-City`, `X-Tenant-Timezone`, `X-Tenant-Key`.
- [x] Cache keys backend incluem tenant + params.
- [x] Query keys frontend incluem tenantKey + params.
- [x] IndexedDB keys incluem tenantKey + params.
- [x] Sem cache bleed entre cidades.

### 2.4 Resiliencia

- [x] lock anti-stampede ativo.
- [x] stale-if-busy ativo.
- [x] soft/hard TTL implementados.
- [x] circuit breaker por cidade/chave implementado.
- [x] fallback stale com `degraded=true` funcionando.

### 2.5 Testes

- [x] Unit tests novos/atualizados.
- [x] Feature tests novos/atualizados.
- [ ] E2E (quando aplicavel) cobrindo troca de cidade e offline.
- [ ] Plano de rollback descrito no PR.

---

## 3. Evidencias automatizadas (copiar no PR)

Backend/API:

```bash
pnpm check:tenancy
pnpm check:weather
pnpm --filter @repo/api test
```

Frontend:

```bash
pnpm --filter @repo/web test
pnpm --filter @repo/web build
```

Monorepo:

```bash
pnpm ci
```

---

## 4. Gate final antes de merge

- [ ] Escopo do PR limitado ao item planejado (sem escopo paralelo).
- [ ] Sem regressao de tenancy em rotas existentes.
- [ ] Sem regressao de UX na pagina de clima.
- [ ] Checklist tecnico preenchido no PR.
- [ ] Rollback valido e testavel.
