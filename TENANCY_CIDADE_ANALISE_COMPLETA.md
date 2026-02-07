# Tenancy por Cidade - Analise Completa e Guardrails de Plataforma

Data: 2026-02-07  
Escopo: `apps/api`, `apps/web`, painel Filament (`/admin`)  
Status: documento de referencia do time para arquitetura, seguranca e execucao  
Codificacao: UTF-8 sem BOM (obrigatorio)

---

## 1. Resumo executivo

O sistema ja tem base funcional de multi-tenancy por cidade, mas ainda existe risco de vazamento cruzado em cenarios onde o contexto de tenant nao e obrigatorio por arquitetura.

Diagnostico principal:
- API publica: matura, com contexto de tenant ja aplicado em boa parte.
- Filament/admin: ponto mais sensivel; precisa tenancy nativo e isolamento forte.
- Modulos: ainda existe risco de divergencia por slug e por regra duplicada.
- Cache: risco invisivel de contaminacao entre cidades se chaves e headers nao forem padronizados.
- Moderacao: precisa modelo de dados com `city_id` como regra estrutural.

Objetivo desta revisao:
- tornar isolamento "dificil de quebrar" por default,
- reduzir dependencia de cuidado manual em cada feature,
- padronizar contrato backend, frontend e admin.

---

## 2. Regra de ouro e decisoes imutaveis (guardrails)

## 2.1 Regra de ouro

Isolamento deve ser dificil de quebrar.

Se o dev esquecer um filtro em 1 endpoint, o sistema ainda deve barrar vazamento por design.

## 2.2 Decisoes imutaveis

- `City` e o tenant principal da plataforma.
- Dados tenant-aware devem ter `city_id` explicito, indexado e nao nulo.
- Admin/Filament sempre opera com tenant selecionado.
- Cache tenant-aware nao pode usar chave global.
- Modulo usa chave tecnica imutavel (`module_key`) como source of truth.
- Rotas tenant-required devem falhar sem tenant resolvido.
- `/api/v1/config` e contrato oficial de bootstrap para frontend/app.

---

## 3. Estado atual consolidado (base + gaps)

## 3.1 O que ja esta bom

- Estrutura `cities`, `modules`, `city_modules` ja existe.
- Frontend ja usa bootstrap por `/api/v1/config`.
- Existe gate de modulo em parte das rotas frontend.
- Trait `BelongsToTenant` e helper `Tenant` ja estao no projeto.
- Moderacao e conteudo ja possuem recursos relevantes no Filament.

## 3.2 Gaps de maior risco

- Filament sem tenancy robusto em todo fluxo.
- Slugs de modulo inconsistentes entre backend, seeders e frontend.
- Regra de modulo ativo duplicada em mais de um ponto.
- Cache sem segmentacao por `city_id` em pontos criticos.
- Tabelas de moderacao sem escopo geografico forte (`city_id`).

---

## 4. Arquitetura alvo de contexto de tenant

## 4.1 Precedencia de resolucao de cidade

1. URL (`/{uf}/{cidade}`)  
2. Dominio mapeado em `city_domains`  
3. Header `X-City` como fallback controlado  
4. Tenant default somente em rotas explicitamente globais

Regra de conflito:
- se URL e header divergirem, URL vence e o sistema registra evento de seguranca.

## 4.2 Middleware obrigatorio

- `TenantContext`: resolve e seta tenant no request.
- `RequireTenant`: bloqueia rotas tenant-required sem tenant valido.
- excecoes devem ser explicitas e documentadas (saude, auth global, webhooks globais).

## 4.3 Cobertura de contexto em todos os canais

- API: obrigatorio.
- Web: obrigatorio quando rota for tenant-aware.
- Filament: obrigatorio com tenant selecionado.
- Queue/jobs: obrigatorio via payload com `city_id` e middleware de job.

---

## 5. Modelo de dados alvo (isolamento forte)

## 5.1 Regra estrutural

Todo dado de cidade deve ter `city_id` `NOT NULL`.

## 5.2 Tabelas de conteudo

Manter/garantir `city_id NOT NULL` em:
- `topics`, `comments`, `events`, `citizen_reports`, `alerts`, `phones`, e equivalentes.

## 5.3 Tabelas de moderacao (gap atual)

Adicionar/garantir `city_id NOT NULL` em:
- `content_flags`
- `topic_reports`
- `comment_reports`
- `moderation_queue_items`

Para restricoes de usuario:
- usar `scope_city_id` nullable em `user_restrictions` (`null` = global).

## 5.4 Indices compostos recomendados

Padrao de listagem:
- `(city_id, created_at)`

Padrao por bairro/local:
- `(city_id, bairro_id, created_at)`

Padrao de fila/admin:
- `(city_id, status, created_at)`

Padrao de busca por modulo:
- `(city_id, module_key, status, created_at)` quando aplicavel.

---

## 6. Sistema de modulos (de feature flag para plataforma)

## 6.1 Chave tecnica imutavel

Usar `modules.module_key` como identificador interno unico, estavel e imutavel.

Exemplos de `module_key`:
- `forum`
- `events`
- `reports`
- `tourism`
- `alerts`
- `phones`
- `weather`

Campos recomendados em `modules`:
- `module_key` (unico, tecnico, imutavel)
- `name_ptbr` (label)
- `route_slug_ptbr` (URL amigavel)
- `icon`
- `is_core`
- `current_version`

## 6.2 Estado por cidade

`city_modules` deve conter:
- `city_id`
- `module_id`
- `enabled`
- `settings`
- `settings_schema_version`
- `version`

## 6.3 Regra unica de resolucao (obrigatorio)

Criar um resolvedor unico, ex.: `ModuleResolver`.

Regra recomendada:
1. existe registro em `city_modules`? usar `enabled` do registro.
2. senao, se `modules.is_core = true`, habilitar.
3. senao, desabilitar.

Cache do resultado efetivo:
- `modules_effective:{city_id}`

Nao pode existir segunda regra paralela em helper/middleware/controller.

## 6.4 Rollout em massa

Implementar operacao formal, nao SQL manual:
- comando `modules:rollout`
- tela Filament para rollout
- `dry-run`
- auditoria completa
- rollback por `rollout_id`

---

## 7. Filament tenancy de verdade

## 7.1 Modelo operacional

- Super admin: pode alternar cidade (tenant switcher).
- Admin/moderador local: tenant travado na cidade vinculada.

## 7.2 Defesa em profundidade

Mesmo com tenancy ativo no painel:
- aplicar escopo defensivo em Resource critica (`modifyQueryUsing` com `city_id`).
- validar `city_id` em create/update.

## 7.3 Recursos obrigatorios no painel

- `CityResource`
- `CityDomainResource`
- `ModuleResource`
- `CityModuleResource`
- `ModuleRolloutPage`

## 7.4 Regras de seguranca no painel

- nenhuma query global para dado tenant-aware.
- toda acao relevante com auditoria (`actor_id`, `city_id`, antes/depois).

---

## 8. Jobs e filas tenant-aware

## 8.1 Contrato de job

Todo job tenant-aware deve carregar:
- `city_id`
- `module_key` quando aplicavel
- `trace_id` para auditoria

## 8.2 Middleware de job

Antes de `handle()`:
- resolver `city_id`
- setar contexto tenant
- falhar cedo se tenant invalido

## 8.3 Padrao recomendado

Pode usar base propria ou pacote de tenancy para jobs (ex.: Spatie Multitenancy em modo single database), mas o requisito funcional e obrigatorio: job sempre executa no tenant correto.

---

## 9. Cache e resposta HTTP tenant-aware

## 9.1 TenantCache obrigatorio

Dominios tenant-aware nao devem usar `Cache::remember` direto.

Criar wrapper unico (`TenantCache`) com:
- prefixo por `city_id`
- ttl padronizado
- invalidacao por namespace

## 9.2 Nomes de chave padrao

- `city_domains:map`
- `modules_effective:{city_id}`
- `bairros:{city_id}`
- `home_feed:{city_id}:{hash}`
- `forum_topics:{city_id}:{hash}`

## 9.3 Headers obrigatorios

Para `/api/v1/config`:
- `Vary: Host, X-City`
- politica de cache coerente com CDN/proxy

Sem `Vary`, existe risco real de entregar config de cidade errada.

## 9.4 Cache busting

Padronizar invalidacao por eventos:
- alteracao de dominio da cidade
- alteracao de modulo por cidade
- alteracao de settings de modulo

---

## 10. Moderacao por cidade (modelo e enforcement)

## 10.1 Modelo de dados

Moderacao deve ser orientada por `city_id` em nivel de tabela, nao apenas filtro de query.

## 10.2 Escopo de restricao

Em `user_restrictions`:
- `scope_module_key` (`forum`, `reports`, etc.)
- `scope_city_id` nullable (`null` = global)

## 10.3 Regra de enforcement

Bloqueio so e aplicado quando as duas dimensoes batem:
- escopo funcional
- escopo geografico

Exemplos:
- restricao global bloqueia em todas as cidades.
- restricao local bloqueia apenas na cidade alvo.

---

## 11. Frontend, SDK e SEO

## 11.1 Contrato de tenant no cliente

Padrao recomendado:
- URL para contexto primario: `/{uf}/{cidade}/...`
- header `X-City` para resiliencia (mobile/SDK)

Regra:
- URL vence em caso de conflito.

## 11.2 Contrato unico de configuracao

Frontend deve depender de `/api/v1/config` para:
- tenant atual
- modulos efetivos
- settings necessarios de modulo

Sem hardcode de modulo no frontend.

## 11.3 SEO de paginas publicas

Para escalar indexacao em multiplas cidades:
- usar SSR/SSG nas paginas publicas (home da cidade, listagens, detalhes publicos)
- manter SPA em painel e areas autenticadas

---

## 12. Guardrails automaticos (detectar antes de producao)

## 12.1 Testes obrigatorios

- teste de data leak entre cidade A e B.
- teste de contaminacao de cache entre cidade A e B.
- teste de rota tenant-required sem tenant (deve falhar).
- teste de modulo ativo comparando `/config` e middleware.

## 12.2 Lint/regras de PR

- bloquear uso direto de cache em dominios tenant-aware.
- bloquear recurso Filament tenant-aware sem escopo de cidade.
- bloquear migration tenant-aware sem indice por `city_id`.

## 12.3 Evidencias de seguranca por release

- relatorio de testes multi-cidade.
- relatorio de cache key coverage por tenant.
- auditoria de rotas globais permitidas.

---

## 13. Roadmap orientado a risco

## 13.1 Ordem recomendada

1. Filament tenancy forte (risco de vazamento administrativo).  
2. Sistema de modulos unificado (source of truth unico).  
3. Cache tenant-aware e headers (`Vary`).  
4. Moderacao com `city_id` e escopo geografico.  
5. Jobs tenant-aware.  
6. SEO SSR/SSG para publico.

## 13.2 Entregas de curto prazo (blindagem minima)

- unificar `module_key` e resolver unico de modulo.
- ativar tenancy real no Filament com switcher/lock.
- padronizar `TenantCache` e `Vary` em `/config`.
- migrar moderacao para `city_id` com backfill.
- padronizar contrato de job com `city_id`.

---

## 14. Decisoes de modelagem para evitar refactor grande

- `users.city_id` como cidade primaria (obrigatorio).
- multiplas cidades apenas para staff via pivot `user_cities` quando necessario.
- `city_domains.domain` sempre normalizado (lowercase, `www` alias controlado).
- usar apenas `cities.status` como fonte de verdade (`staging`, `active`, `inactive`, `archived`).
- campo `active` deve ser derivado ou removido para evitar regra duplicada.

---

## 15. Definicao de pronto de arquitetura tenancy

Arquitetura pode ser considerada madura quando:
- nao existe query tenant-aware sem `city_id`,
- admin local nao enxerga dados de outra cidade,
- `/config` e middleware concordam no modulo efetivo,
- cache nao cruza cidades,
- moderacao aplica escopo funcional + geografico,
- jobs executam com tenant definido antes do `handle()`.

---

## 16. Proximo passo objetivo

Executar em sequencia:
1. unificacao de modulos (`module_key`, resolver unico, migracao de slugs),
2. tenancy real no Filament (switcher/lock),
3. hardening de cache (`TenantCache` + `Vary`),
4. migracao de moderacao com `city_id` e backfill,
5. jobs tenant-aware por contrato.

Este documento deve ser usado em conjunto com `task.md` para execucao por PR.
