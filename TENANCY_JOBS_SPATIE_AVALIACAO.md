# Avaliacao Spatie Multitenancy para Jobs

Data: 2026-02-07  
Escopo: filas e jobs tenant-aware no `apps/api`

---

## 1. Contexto atual

- Jobs em uso:
  - `LogAddressMismatch` (tenant-aware)
  - `BackfillCityId` (operacional/global)
- Foi adicionado contrato explicito:
  - `TenantAwareJob` para jobs por cidade
  - `GlobalQueueJob` para jobs globais intencionais
- Foi adicionado middleware:
  - `EnsureTenantContext` para setar tenant antes do `handle()`

---

## 2. Necessidade real hoje

No estado atual, o projeto ainda nao possui volume de jobs de dominio
(midia, notificacoes em massa, agregacoes por cidade) suficiente para justificar
migracao imediata para pacote externo de multitenancy em fila.

Risco atual ficou coberto por:

- contrato obrigatorio por interface,
- fail-fast sem `city_id`,
- logs com `city_id` para jobs tenant-aware,
- teste automatizado que bloqueia novos jobs sem contrato.

---

## 3. Recomendacao tecnica

## Decisao atual

- **Nao adotar Spatie Multitenancy agora**.
- Manter abordagem atual (middleware + contrato explicito + guardrail de teste).

## Gatilhos para reavaliar adocao

- mais de 5 jobs tenant-aware de negocio em producao,
- necessidade de trocar contexto em listeners/chains/batches complexos,
- necessidade de padrao unificado de tenant bootstrapping em workers multiplos,
- necessidade de isolamento mais forte entre filas por tenant.

---

## 4. Plano de revisao

- Revisar decisao quando entrar PR de jobs de:
  - notificacao por cidade,
  - processamento de midia por cidade,
  - agregacao de feed por cidade.
- Se 2 ou mais desses fluxos entrarem, abrir ADR para comparar:
  - manutencao interna atual,
  - adocao de Spatie Multitenancy.

