# Tenancy PR Checklist (Obrigatorio)

Data base: 2026-02-07  
Ultima atualizacao: 2026-02-07  
Escopo: API, Web, Filament, Jobs e Cache tenant-aware

---

## 1. Status consolidado por PR

- [x] PR-000 Baseline e guardrails de pipeline.
- [x] PR-001 ModuleKey imutavel e slugs canonicos.
- [x] PR-002 Resolver unico de modulo efetivo.
- [x] PR-003 RequireTenant + cobertura de rotas.
- [x] PR-004 TenantContext em Filament com switcher/lock.
- [x] PR-005 TenantCache + Vary + invalidacao padrao.
- [x] PR-006 Recursos Filament de tenancy e rollout.
- [x] PR-007 Migracao moderacao com city_id + backfill.
- [x] PR-008 Enforcement de restricao por modulo e cidade.
- [x] PR-009 Jobs tenant-aware.
- [x] PR-010 Contrato frontend/app e limpeza de hardcode.
- [x] PR-011 SEO publico com SSR/SSG hibrido.
- [x] PR-012 Hardening final (E2E multi-cidade + observabilidade).

Fonte: `task.md`.

---

## 2. Checklist tecnico (preenchido para o estado atual)

### 2.1 Isolamento de tenant

- [x] Rotas tenant-required estao em grupo com `RequireTenant`.
- [x] Nao foi criada rota nova tenant-aware fora do grupo protegido.
- [x] Testes de isolamento entre cidades cobrem API/Web/Filament.
- [ ] Revisao manual adicional de queries antigas sem `city_id` (auditoria continua).

### 2.2 Modulos e contrato

- [x] Modulos usam `module_key` canonico.
- [x] Nao existe regra duplicada para modulo efetivo.
- [x] `/api/v1/config` e middleware de modulo seguem contrato alinhado.
- [x] Alias legado mantido com compatibilidade controlada.

### 2.3 Filament/admin

- [x] Resource tenant-aware aplica escopo por cidade.
- [x] Moderador local nao acessa cidade diferente.
- [x] Super admin alterna tenant sem vazamento de dados.
- [x] Troca de tenant no painel gera log.

### 2.4 Cache tenant-aware

- [x] Nao usar `Cache::remember` direto em dominio tenant-aware (guardrail ativo).
- [x] Chaves tenant-aware usam prefixo de cidade.
- [x] Invalidation afeta somente cidade alvo.
- [x] `/api/v1/config` responde com `Vary: Host, X-City`.

### 2.5 Jobs e filas

- [x] Job tenant-aware carrega `city_id`, `module_key`, `trace_id`.
- [x] Job tenant-aware seta contexto antes do `handle()`.
- [x] Job sem `city_id` falha cedo com log estruturado.
- [x] Logs de fila incluem contexto tenant.

### 2.6 Banco e migracoes

- [x] Tabelas tenant-aware novas com `city_id` e indices compostos.
- [x] Moderacao com `city_id` explicito.
- [x] Backfill com testes de consistencia.
- [x] Rollback documentado por PR (flags/comandos/runbook).

---

## 3. Evidencias automatizadas (ultima execucao)

### 3.1 Backend

Comando:

```bash
php artisan test tests/Feature/Web/WebTenantRouteTest.php tests/Feature/Web/TenantSeoPublicPageTest.php tests/Feature/Tenancy tests/Unit tests/Feature/Modules/ModulesRolloutCommandTest.php
```

Resultado:

- [x] `51 passed`
- [x] `155 assertions`

### 3.2 Frontend

Comando:

```bash
pnpm --filter @repo/web test
```

Resultado:

- [x] `6 files passed`
- [x] `14 tests passed`

### 3.3 Guardrails tenancy

Comando:

```bash
pnpm check:tenancy
```

Resultado:

- [x] Guardrails passou sem violacoes novas.

### 3.4 BOM/encoding

- [x] Verificacao de BOM executada em arquivos alterados.
- [x] Sem BOM nos arquivos modificados neste ciclo.

---

## 4. Changelog tecnico curto por PR (pronto para descricao)

### PR-010 Contrato frontend/app e limpeza de hardcode

Impacto:

- Frontend passou a depender do contrato de `/api/v1/config`.
- Remocao de hardcode local de modulos na UI.
- Contrato compartilhado preparado para SDK/mobile.

Risco:

- Divergencia de payload entre backend e clientes antigos.

Rollback:

- Flag `VITE_TENANT_LEGACY_GATE_FALLBACK=1`.

### PR-011 SEO publico com SSR/SSG hibrido

Impacto:

- Rotas publicas de cidade renderizam HTML indexavel no servidor.
- Canonical URL por `/{uf}/{cidade}`.
- Areas autenticadas/painel continuam em SPA.

Risco:

- Regressao de roteamento em paths publicos/especificos.

Rollback:

- Reverter rota canonical para `TenantSpaResponder`.

### PR-012 Hardening final

Impacto:

- Suite E2E multi-cidade ativa.
- Telemetria de incidentes por `city_id`.
- Alerta de mismatch `X-City` vs URL com escalonamento.
- Runbook operacional publicado.

Risco:

- Ruido de alertas em ambientes com proxy/header inconsistente.

Rollback:

- `TENANCY_MISMATCH_ALERTS_ENABLED=false` (mantem log estruturado).

---

## 5. Itens manuais para gate final de merge

- [ ] Aprovar arquitetura para PRs P0/P1 (se exigido pelo fluxo do time).
- [ ] Anexar evidencias de teste no corpo do PR (copiar secao 3).
- [ ] Validar se ha warning critico de seguranca no pipeline de seguranca do repositorio.
- [ ] Confirmar aprovacao de produto/SEO para paginas publicas indexaveis.
