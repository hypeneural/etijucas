# task.md - Plano de Execucao Tenancy por Cidade (PR por PR)

Data: 2026-02-07  
Base: `TENANCY_CIDADE_ANALISE_COMPLETA.md`  
Objetivo: implementar tenancy por cidade de forma organizada, segura e dificil de quebrar  
Codificacao obrigatoria: UTF-8 sem BOM

---

## 1. Regras globais de execucao

- [ ] Nao criar arquivo com BOM.
- [ ] Nao usar cache global em dominio tenant-aware.
- [x] Nao criar tabela tenant-aware sem `city_id` indexado.
- [x] Nao criar rota tenant-required sem `RequireTenant`.
- [x] Nao criar Resource Filament tenant-aware sem escopo por cidade.
- [x] Todo PR com testes minimos + plano de rollback.
- [x] Todo PR com changelog tecnico curto (impacto, risco, rollback).

---

## 2. Ordem obrigatoria dos PRs

1. PR-000 Baseline e guardrails de pipeline  
2. PR-001 ModuleKey imutavel e slugs canonicos  
3. PR-002 Resolver unico de modulo efetivo  
4. PR-003 RequireTenant + cobertura de rotas  
5. PR-004 TenantContext em Filament com switcher/lock  
6. PR-005 TenantCache + headers Vary + invalidacao padrao  
7. PR-006 Recursos Filament de tenancy e rollout  
8. PR-007 Migracao moderacao com city_id + backfill  
9. PR-008 Enforcement de restricao por modulo e cidade  
10. PR-009 Jobs tenant-aware  
11. PR-010 Contrato frontend/app e limpeza de hardcode  
12. PR-011 SEO publico com SSR/SSG hibrido  
13. PR-012 Hardening final (testes E2E multi-cidade + observabilidade)

---

## 3. PR-000 - Baseline e guardrails de pipeline (P0)

Objetivo: travar erros estruturais antes de mexer no core.

Escopo tecnico:
- [x] Criar checklist de PR tenancy no repositorio.
- [x] Adicionar etapa CI para validar ausencia de BOM em arquivos texto alterados.
- [x] Adicionar regra CI para bloquear `Cache::remember` direto em pastas tenant-aware.
- [x] Adicionar regra CI para detectar rota tenant-required sem middleware de tenant.
- [x] Publicar padrao oficial de chaves de cache tenant-aware.

Testes:
- [x] Teste da pipeline com fixture contendo BOM deve falhar.
- [x] Teste da pipeline com uso direto de cache deve falhar.

Rollback:
- [ ] Reverter apenas scripts de CI e docs se gerar falso positivo.

Criterio de aceite:
- [x] CI bloqueia violacao de guardrail antes de merge.

---

## 4. PR-001 - ModuleKey imutavel e slugs canonicos (P0)

Objetivo: remover ambiguidade de modulo entre backend, frontend e seed.

Escopo tecnico:
- [x] Definir `module_key` tecnico imutavel para todos os modulos.
- [x] Criar migration para adicionar `module_key` e popular com mapa oficial.
- [x] Criar campos de apresentacao (`name_ptbr`, `route_slug_ptbr`) se ainda nao existirem.
- [x] Normalizar seeders para uma fonte unica de verdade.
- [x] Ajustar rotas backend para validar modulo por `module_key`.
- [x] Ajustar frontend para gate por `module_key`.
- [x] Manter alias legado temporario com prazo de remocao documentado.

Arquivos alvo iniciais:
- [x] `apps/api/database/seeders/ModulesSeeder.php`
- [x] `apps/api/database/seeders/SyncModulesSeeder.php`
- [x] `apps/api/routes/api.php`
- [x] `apps/web/src/App.tsx`

Testes:
- [x] Teste de modulo legado com alias (compatibilidade).
- [x] Teste de modulo canonico em rota protegida.
- [x] Teste de payload de `/api/v1/config` com `module_key`.

Rollback:
- [ ] Migration `down` restaura colunas e mapa anterior.

Criterio de aceite:
- [x] Nao existe mais decisao de negocio baseada em slug legado.

---

## 5. PR-002 - Resolver unico de modulo efetivo (P0)

Objetivo: eliminar divergencia entre helper, middleware e config.

Escopo tecnico:
- [x] Criar `ModuleResolver` unico.
- [ ] Encapsular regra:
- [x] se existe `city_modules`, usar `enabled`.
- [x] se nao existe e modulo e core, `enabled=true`.
- [x] caso contrario, `enabled=false`.
- [x] Refatorar `Tenant::*module*` para usar `ModuleResolver`.
- [x] Refatorar middleware `ModuleEnabled` para usar `ModuleResolver`.
- [x] Refatorar `/api/v1/config` para usar `ModuleResolver`.
- [x] Cachear resultado em `modules_effective:{city_id}`.

Arquivos alvo iniciais:
- [x] `apps/api/app/Support/Tenant.php`
- [x] `apps/api/app/Services/ModuleService.php` (migrar para resolver unico)
- [x] `apps/api/app/Http/Middleware/ModuleEnabled.php`
- [x] `apps/api/app/Http/Controllers/Api/V1/ConfigController.php`

Testes:
- [x] Cenarios com/sem registro em pivot.
- [x] Cenarios `is_core` true/false.
- [x] Contrato: `/config` e middleware devem concordar.

Rollback:
- [ ] Reativar implementacao anterior com feature flag de compatibilidade.

Criterio de aceite:
- [x] 1 unica regra de modulo efetivo no backend.

---

## 6. PR-003 - RequireTenant e cobertura de rotas (P0)

Objetivo: impedir rota tenant-required sem tenant valido.

Escopo tecnico:
- [x] Criar middleware `RequireTenant`.
- [x] Definir lista explicita de rotas globais permitidas.
- [x] Aplicar `RequireTenant` em grupos tenant-required da API.
- [x] Aplicar `RequireTenant` em web tenant-aware quando aplicavel.
- [x] Criar teste que falha se rota tenant-required nascer sem middleware.

Arquivos alvo iniciais:
- [x] `apps/api/app/Http/Middleware/RequireTenant.php`
- [x] `apps/api/bootstrap/app.php`
- [x] `apps/api/routes/api.php`

Testes:
- [x] Request sem tenant em rota protegida retorna erro esperado.
- [x] Request em rota global continua funcionando.

Rollback:
- [ ] Remover binding do middleware de grupos especificos.

Criterio de aceite:
- [x] Nao existe acesso tenant-required com tenant nulo.

---

## 7. PR-004 - TenantContext em Filament com switcher/lock (P0)

Objetivo: isolamento forte no painel admin.

Escopo tecnico:
- [x] Ativar tenancy no painel Filament com `City` como tenant.
- [x] Super admin com tenant switcher.
- [x] Admin/moderador local com tenant fixo.
- [x] Garantir escopo padrao por `city_id` em Resources tenant-aware.
- [x] Aplicar defesa extra com `modifyQueryUsing` onde necessario.
- [x] Registrar auditoria de troca de tenant no painel.

Arquivos alvo iniciais:
- [x] `apps/api/app/Providers/Filament/AdminPanelProvider.php`
- [x] Resources de moderacao/conteudo no Filament

Testes:
- [x] Moderador cidade A nao ve cidade B.
- [x] Super admin alterna tenant e dados acompanham contexto.

Rollback:
- [ ] Desativar switcher e voltar para modo anterior com filtro manual temporario.

Criterio de aceite:
- [x] Sem leitura/escrita cross-city no painel.

---

## 8. PR-005 - TenantCache + Vary + invalidacao padrao (P0)

Objetivo: eliminar contaminacao de cache entre cidades.

Escopo tecnico:
- [x] Criar `TenantCache` wrapper para dominios tenant-aware.
- [x] Migrar home/forum/config para `TenantCache`.
- [x] Migrar caches de eventos (`events:list`, `events:home-featured`, `events:calendar`, `events:categories`, `events:tags`) para `TenantCache`.
- [x] Garantir `Vary: Host, X-City` em `/api/v1/config`.
- [x] Revisar `Cache-Control` de endpoints tenant-aware.
- [x] Padronizar invalidacao por chave de namespace.
- [x] Corrigir inconsistencia de chave em `city_domains`.

Arquivos alvo iniciais:
- [x] `apps/api/app/Domains/Home/Services/HomeAggregatorService.php`
- [x] `apps/api/app/Http/Controllers/Api/Forum/TopicController.php`
- [x] `apps/api/app/Http/Controllers/Api/V1/ConfigController.php`
- [x] `apps/api/app/Models/CityDomain.php`

Testes:
- [x] Cidade A e B com mesma URL nao compartilham resposta.
- [x] Alteracao de modulo invalida cache da cidade correta.

Rollback:
- [ ] Fallback temporario para cache disabled em endpoints criticos.

Criterio de aceite:
- [x] Nenhuma chave tenant-aware sem `city_id`.

---

## 9. PR-006 - Recursos Filament de tenancy e rollout (P1)

Objetivo: sair de operacao manual por SQL.

Escopo tecnico:
- [x] Criar `CityResource`.
- [x] Criar `CityDomainResource`.
- [x] Criar `ModuleResource`.
- [x] Criar `CityModuleResource`.
- [x] Criar pagina de rollout em massa por modulo.
- [x] Criar comando `modules:rollout` com `--dry-run`.
- [x] Criar log de auditoria de rollout.
- [x] Criar rollback por `rollout_id`.

Testes:
- [x] Rollout para todas cidades ativas.
- [x] Rollout com excecoes.
- [x] Rollback restaura estado anterior.

Rollback:
- [ ] Desativar tela/comando mantendo apenas estado atual de `city_modules`.

Criterio de aceite:
- [x] Ativacao/desativacao em massa operavel sem SQL manual.

---

## 10. PR-007 - Migracao moderacao com city_id + backfill (P1)

Objetivo: moderacao baseada em modelo de dados tenant-aware.

Escopo tecnico:
- [x] Adicionar `city_id` em `content_flags`.
- [x] Adicionar `city_id` em `topic_reports`.
- [x] Adicionar `city_id` em `comment_reports`.
- [x] Adicionar `city_id` em `moderation_queue_items`.
- [x] Adicionar `scope_city_id` em `user_restrictions` (nullable para global).
- [x] Criar backfill com joins por origem de conteudo.
- [x] Tornar colunas `NOT NULL` apos backfill (exceto `scope_city_id`).
- [x] Adicionar indices compostos por fila e status.

Testes:
- [x] Backfill sem perda de linhas.
- [x] Novos inserts exigem `city_id`.
- [x] Queries de fila usam indices corretos.

Rollback:
- [ ] Reverter colunas novas mantendo backup de dados de backfill.

Criterio de aceite:
- [x] Tabelas de moderacao com cidade explicita e auditavel.

---

## 11. PR-008 - Enforcement de restricao por modulo e cidade (P1)

Objetivo: aplicar bloqueio correto por escopo funcional + geografico.

Escopo tecnico:
- [x] Padronizar motor de restricao para ler `scope_module_key`.
- [x] Aplicar `scope_city_id` no runtime.
- [x] Integrar checks em forum/reports/uploads.
- [x] Mensagem de erro padronizada para bloqueio.
- [x] Garantir compatibilidade com restricao global.

Testes:
- [x] Restricao local bloqueia so na cidade alvo.
- [x] Restricao global bloqueia todas.
- [x] Restricao de modulo nao afeta modulo diferente.

Rollback:
- [ ] Voltar para comportamento global temporario com flag.

Criterio de aceite:
- [x] Restricao respeita modulo e cidade em todos os endpoints cobertos.

---

## 12. PR-009 - Jobs tenant-aware (P1)

Objetivo: garantir que jobs executem no tenant correto.

Escopo tecnico:
- [x] Definir contrato de payload de job (`city_id`, `module_key`, `trace_id`).
- [x] Criar middleware de job para setar tenant antes de `handle()`.
- [x] Atualizar jobs criticos (midia, notificacao, agregacao, sync).
- [x] Registrar logs com `city_id`.
- [x] Avaliar adocao de base Spatie Multitenancy para padrao de fila.

Testes:
- [x] Job com cidade A nao afeta cidade B.
- [x] Job sem `city_id` falha cedo e loga erro.
    
Rollback:
- [ ] Fallback para execucao sincrona temporaria de jobs criticos.

Criterio de aceite:
- [x] 100% dos jobs tenant-aware carregam e aplicam tenant.

---

## 13. PR-010 - Contrato frontend/app e limpeza de hardcode (P2)

Objetivo: frontend completamente orientado ao contrato de backend.

Escopo tecnico:
- [x] Tipar contrato de `/api/v1/config`.
- [ ] Remover hardcode de modulo no app web.
- [x] Garantir gate de rota/menu/home por `module_key`.
- [x] Padronizar politica de conflito URL vs `X-City` (URL vence).
- [ ] Preparar SDK/mobile para mesmo contrato.

Testes:
- [x] Pagina de modulo desativado nao aparece.
- [x] Deep link com cidade incorreta corrige contexto.
- [x] Store reflete exatamente payload de `/config`.

Rollback:
- [ ] Fallback parcial para gates antigos por flag.

Criterio de aceite:
- [ ] Nenhum fluxo de UI depende de lista local fixa de modulo.

---

## 14. PR-011 - SEO publico com SSR/SSG hibrido (P2)

Objetivo: melhorar indexacao de paginas publicas por cidade.

Escopo tecnico:
- [ ] Definir rotas publicas para SSR/SSG (home cidade, listagens, detalhes publicos).
- [ ] Preservar SPA para painel e area autenticada.
- [ ] Gerar metadados por cidade/modulo publico.
- [ ] Garantir canonical URL por `/{uf}/{cidade}`.

Testes:
- [ ] HTML inicial contem conteudo indexavel.
- [ ] Lighthouse/SEO baseline melhora nas paginas alvo.

Rollback:
- [ ] Reverter rotas selecionadas para SPA se houver instabilidade.

Criterio de aceite:
- [ ] Public pages indexaveis sem depender de hidracao tardia.

---

## 15. PR-012 - Hardening final (P3)

Objetivo: fechar operacao com observabilidade e cobertura de regressao.

Escopo tecnico:
- [ ] Criar suite E2E multi-cidade (API + Filament + web).
- [ ] Adicionar dashboards de erro por `city_id`.
- [ ] Adicionar alertas de mismatch de tenant.
- [ ] Publicar runbook de incidente tenancy/cache/modulo.
- [ ] Revisar limites de rate-limit por cidade/modulo.

Testes:
- [ ] E2E bloqueia merge em regressao de isolamento.
- [ ] Simulacao de incidente com rollback executavel.

Rollback:
- [ ] Desativar alertas novos isoladamente sem remover logs estruturados.

Criterio de aceite:
- [ ] Time consegue detectar e responder incidente de tenancy em minutos.

---

## 16. Checklist de qualidade por PR (template)

- [ ] Escopo tecnico implementado.
- [ ] Testes automatizados criados/atualizados.
- [ ] Evidencia manual documentada (quando aplicavel).
- [ ] Sem BOM em arquivos alterados.
- [ ] Sem warning critico de seguranca.
- [ ] Changelog tecnico e plano de rollback no PR.
- [ ] Aprovacao de arquitetura para PRs P0/P1.

---

## 17. Entregavel da Sprint 1 (minimo para blindar futuro)

- [ ] PR-000 concluido.
- [ ] PR-001 concluido.
- [ ] PR-002 concluido.
- [ ] PR-003 concluido.
- [ ] PR-004 concluido.
- [ ] PR-005 concluido.

Resultado esperado:
- isolamento forte na API e no admin,
- modulo com regra unica e previsivel,
- cache protegido por tenant,
- base pronta para moderacao e rollout em escala.
