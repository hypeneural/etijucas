# Weather Cache Keys - Padrao Oficial

Data base: 2026-02-08  
Escopo: chaves de cache backend e frontend para Weather 2.0 tenant-aware

---

## 1. Regra geral

- Toda chave de weather deve incluir tenant e parametros da consulta.
- Nunca usar chave global para resposta weather de cidade.
- Chave precisa ser deterministicamente reproduzivel.

---

## 2. Chaves canonicas (backend)

## 2.1 Bundle

- `weather:bundle:{citySlug}:tz:{tz}:u:{units}:days:{days}:sections:{sections}:v1`

## 2.2 Forecast e marine (secoes internas)

- `weather:forecast:{citySlug}:tz:{tz}:u:{units}:days:{days}:v1`
- `weather:marine:{citySlug}:tz:{tz}:u:{units}:days:{days}:v1`

## 2.3 Locks e circuit breaker

- `weather:lock:{key}`
- `weather:circuit:{citySlug}:{section}`
- `weather:failcount:{citySlug}:{section}`

---

## 3. Chaves canonicas (frontend)

## 3.1 React Query key

- `['weather', 'bundle', tenantKey, days, units, sections]`

## 3.2 IndexedDB key

- `weather:bundle:{tenantKey}:days:{days}:units:{units}:sections:{sections}`

---

## 4. Politica de expiracao

- Soft TTL: 10-20 min (revalidacao).
- Hard TTL: 2-6 horas (fallback stale).
- Jitter: +/-10% para reduzir sincronismo de expiracao.

---

## 5. Regras de invalidacao

- Troca de cidade invalida todas as chaves de weather da cidade anterior no frontend.
- Mudanca de timezone da cidade invalida chaves da cidade.
- Mudanca de schema do payload incrementa sufixo de versao (`v1` -> `v2`).

