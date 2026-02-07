# Tenancy Cache Keys - Padrao Oficial

Data base: 2026-02-07  
Escopo: chaves e invalidacao para cache tenant-aware

---

## 1. Regra geral

- Toda chave tenant-aware deve incluir cidade no prefixo:
  - `city:{city_id}:{domain}:{entity}:{qualifier}`
- Nunca usar cache global para dado de tenant.
- Para utilitarios globais, prefixo obrigatorio:
  - `global:{domain}:{entity}:{qualifier}`

---

## 2. Chaves canonicas

## 2.1 Tenant bootstrap/config

- `city:{city_id}:modules_effective`
- `city:{city_id}:tenant_config`

## 2.2 Mapeamento de dominio

- `global:city_domains:map`

## 2.3 Geo/bairros

- `city:{city_id}:bairros:list`
- `city:{city_id}:bairros:by_slug:{slug}`

## 2.4 Home/feed

- `city:{city_id}:home:feed:{hash}`
- `city:{city_id}:home:highlights:{hash}`

## 2.5 Forum

- `city:{city_id}:forum:topics:list:{hash}`
- `city:{city_id}:forum:topic:{topic_id}`

## 2.6 Eventos

- `city:{city_id}:events:list:{hash}`
- `city:{city_id}:events:home_featured`
- `city:{city_id}:events:calendar:{month}`
- `city:{city_id}:events:categories`
- `city:{city_id}:events:tags`

---

## 3. Politica de invalidacao

## 3.1 Mudanca de modulo por cidade

- Invalida:
  - `city:{city_id}:modules_effective`
  - `city:{city_id}:tenant_config`

## 3.2 Mudanca de dominio

- Invalida:
  - `global:city_domains:map`

## 3.3 Mudanca de bairro/geo

- Invalida:
  - `city:{city_id}:bairros:list`
  - `city:{city_id}:bairros:by_slug:*`

## 3.4 Mudanca de conteudo de home/forum/eventos

- Invalida somente prefixo da cidade alvo:
  - `city:{city_id}:home:*`
  - `city:{city_id}:forum:*`
  - `city:{city_id}:events:*`

---

## 4. Regras de implementacao

- Em codigo tenant-aware, usar `TenantCache`.
- Para cidade explicita, usar `TenantCache::rememberForCity(...)`.
- Nao adicionar excecao de cache direto sem justificativa em PR.
- Endpoints de config devem manter:
  - `Vary: Host, X-City`
  - cache-control coerente com proxy/CDN.

