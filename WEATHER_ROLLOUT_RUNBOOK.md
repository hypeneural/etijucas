# Weather V2 Rollout Runbook

Data: 2026-02-08  
Escopo: `weather_v2` no backend/API e rollout por cidade (canary -> 100%)

---

## 1. Flags de controle

Variaveis de ambiente:

- `WEATHER_V2_ENABLED=true|false`
- `WEATHER_V2_ROLLOUT_MODE=all|canary|off`
- `WEATHER_V2_CANARY_CITIES=tijucas-sc,porto-belo-sc`

Comportamento:

- `off`: desativa bundle v2 para todas as cidades.
- `canary`: ativa somente cidades listadas em `WEATHER_V2_CANARY_CITIES`.
- `all`: ativa para todas as cidades.

---

## 2. Plano de rollout

### 2.1 Fase Canary (10% de risco operacional)

Cidades iniciais:

- `tijucas-sc`
- `porto-belo-sc`

Duracao minima:

- 24h corridas com monitoramento continuo.

### 2.2 Promocao para 100%

Promover para `WEATHER_V2_ROLLOUT_MODE=all` somente se os SLOs abaixo forem atendidos.

---

## 3. SLO de promocao

Janela de avaliacao: ultimas 24h no canary.

- `provider.error_rate` < 1.0%
- `weather_bundle.cache_stale` <= 5% das requisicoes do bundle
- `provider.latency_ms` p95 < 1200ms
- `bundle.payload_kb` p95 < 120KB
- Sem incidentes criticos de tenancy (cache bleed / cidade incorreta)

Se qualquer item falhar, manter canary e investigar.

---

## 4. Sinais e metricas a monitorar

Metricas emitidas no log estruturado (`weather_metric`):

- `weather_bundle.cache_hit`
- `weather_bundle.cache_miss`
- `weather_bundle.cache_stale`
- `provider.latency_ms`
- `provider.error_rate`
- `bundle.sections_requested`
- `bundle.payload_kb`

Campos de correlacao:

- `request_id`
- `tenant_key`
- `city_slug`
- `section`

---

## 5. Gatilhos de rollback

Executar rollback imediato se ocorrer:

- erro 5xx do weather > 5% por 5 minutos
- `provider.error_rate` >= 5% por 10 minutos
- incidente de tenancy confirmado
- indisponibilidade prolongada do provider externo sem stale funcional

---

## 6. Procedimento de rollback

1. Trocar para modo seguro global:
   - `WEATHER_V2_ROLLOUT_MODE=off`
2. Recarregar configuracao/deploy da API.
3. Confirmar resposta do endpoint:
   - `/api/v1/weather/bundle` deve retornar `WEATHER_V2_DISABLED`.
4. Validar rotas legadas:
   - `/api/v1/weather/home`
   - `/api/v1/weather/forecast`
   - `/api/v1/weather/marine`
   - `/api/v1/weather/insights`
5. Abrir incidente com `request_id` de exemplo e cidade afetada.

---

## 7. Procedimento de retomada

1. Corrigir causa raiz.
2. Voltar para `canary` com 1 cidade.
3. Aguardar 24h com SLO atendido.
4. Repetir canary com 2 cidades.
5. Promover para `all`.

---

## 8. Checklist operacional

- [ ] Flags conferidas no ambiente alvo.
- [ ] Canary cities definidas.
- [ ] Dashboard/consulta de logs com metricas de weather disponivel.
- [ ] Time on-call ciente do plano de rollback.
- [ ] Evidencias de SLO anexadas no PR de promocao.

