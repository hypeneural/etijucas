# TENANCY Incident Runbook

Data: 2026-02-07  
Escopo: incidentes de isolamento por cidade, cache contaminado e mismatch de tenant.

## 1. Sinais de alerta

- Evento `tenant_header_path_mismatch` em alta.
- Evento `tenant_job_missing_city_id` ou `tenant_job_city_not_found`.
- Usuario reporta dados de outra cidade no painel/web/API.

## 2. Triage inicial (5 min)

1. Validar volume dos incidentes:
```bash
php artisan tenancy:incidents:summary --minutes=30
```
2. Verificar quais cidades/rotas estao afetadas.
3. Confirmar se houve deploy recente em middleware, cache, modulo ou jobs.

## 3. Contencao rapida

1. Ativar fallback legado de gate no frontend (temporario):
```env
VITE_TENANT_LEGACY_GATE_FALLBACK=1
```
2. Invalidar cache tenant-aware:
```bash
php artisan cache:clear
```
3. Em caso de mismatch massivo, subir limiar temporariamente:
```env
TENANCY_MISMATCH_THRESHOLD=20
TENANCY_MISMATCH_WINDOW=300
```

## 4. Diagnostico tecnico

1. Conferir politica de tenant:
- URL canonica: `/{uf}/{cidade}`
- Header fallback: `X-City`

2. Verificar incidentes recentes:
```sql
SELECT type, severity, city_id, created_at
FROM tenant_incidents
ORDER BY created_at DESC
LIMIT 100;
```

3. Revisar se novos endpoints estao com:
- middleware `tenant`
- middleware `require-tenant` (quando tenant-required)
- keys de cache com namespace de cidade

## 5. Recuperacao

1. Corrigir origem (rota, middleware, job payload, cache key).
2. Validar com testes:
```bash
php artisan test tests/Unit tests/Feature/Web/WebTenantRouteTest.php
pnpm --filter @repo/web test
pnpm check:tenancy
```
3. Confirmar queda de incidentes:
```bash
php artisan tenancy:incidents:summary --minutes=10
```

## 6. Pos-incidente

1. Registrar causa raiz e PR de correcao.
2. Atualizar `task.md` com lacuna descoberta.
3. Definir alerta preventivo novo se necessario.
