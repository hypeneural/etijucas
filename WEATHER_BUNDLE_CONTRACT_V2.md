# Weather Bundle Contract v2.0

Data base: 2026-02-08  
Endpoint alvo: `GET /api/v1/weather/bundle`

---

## 1. Objetivo do contrato

- Payload unico, autoexplicavel, resiliente a erro parcial.
- Estrutura estavel para backend, web e mobile.
- Suporte a observabilidade e fallback stale sem quebra de UI.

---

## 2. Query params suportados

- `sections`: lista separada por virgula
  - ex: `current,hourly,daily,marine,insights`
- `days`: numero de dias (respeita limite do provider)
- `units`: `metric` ou `imperial`

---

## 3. Campos obrigatorios de resposta

## 3.1 Top-level

- `contract_version`: string (`"2.0"`)
- `provider`: string (ex: `"open_meteo"`)
- `request_id`: string
- `location`: object
- `cache`: object
- `errors`: object
- `data`: object

## 3.2 Location

- `city_slug`: string
- `lat`: number
- `lon`: number
- `timezone`: IANA string
- `is_coastal`: boolean

## 3.3 Cache

- `generated_at_utc`: ISO8601 UTC
- `expires_at_utc`: ISO8601 UTC
- `stale_until_utc`: ISO8601 UTC
- `degraded`: boolean
- `degraded_reason`: `null | string`

## 3.4 Errors

- Um campo por secao solicitada:
  - `forecast`
  - `marine`
  - `insights`
- Formato:
  - `null`
  - ou `{ "code": "<CODE>", "msg": "<mensagem>" }`

## 3.5 Data

- Contem somente secoes solicitadas em `sections`.
- Exemplo de secoes:
  - `current`
  - `hourly`
  - `daily`
  - `marine`
  - `insights`

---

## 4. Headers obrigatorios

- `X-Request-Id: <request_id>`
- `X-Tenant-City: <city_slug>`
- `X-Tenant-Timezone: <timezone>`
- `X-Tenant-Key: <tenant_key>`

---

## 5. Exemplo minimo

```json
{
  "contract_version": "2.0",
  "provider": "open_meteo",
  "request_id": "req_01HXYZ",
  "location": {
    "city_slug": "tijucas-sc",
    "lat": -27.2413,
    "lon": -48.6317,
    "timezone": "America/Sao_Paulo",
    "is_coastal": true
  },
  "cache": {
    "generated_at_utc": "2026-02-08T12:00:00Z",
    "expires_at_utc": "2026-02-08T12:15:00Z",
    "stale_until_utc": "2026-02-08T18:00:00Z",
    "degraded": false,
    "degraded_reason": null
  },
  "errors": {
    "forecast": null,
    "marine": null,
    "insights": null
  },
  "data": {
    "current": {},
    "hourly": [],
    "daily": [],
    "marine": null,
    "insights": []
  }
}
```

