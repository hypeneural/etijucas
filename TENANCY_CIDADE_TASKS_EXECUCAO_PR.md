# Tenancy por Cidade - Tasks de Execucao por PR

Data: 2026-02-07  
Base: `TENANCY_CIDADE_ANALISE_COMPLETA.md`  
Formato: checklist tecnico executavel por PR  
Codificacao alvo: UTF-8 sem BOM

---

## Regras de execucao (obrigatorio em todo PR)

- [ ] Arquivos novos e alterados em UTF-8 sem BOM.
- [ ] Nenhum segredo em codigo, migration ou seed.
- [ ] Nenhuma quebra de contrato sem feature flag ou fase de compatibilidade.
- [ ] Todo PR com testes automatizados minimos (unitario e/ou integracao).
- [ ] Todo PR com plano de rollback simples e testado.
- [ ] Frontend consome estado de modulo apenas via `/api/v1/config`.
- [ ] Admin (Filament) sempre respeita contexto de cidade.

---

## Prioridades

- `P0` Bloqueante de seguranca e consistencia.
- `P1` Operacao e governanca (Filament + rollout).
- `P2` Moderacao por cidade (dados + regras + UI).
- `P3` Escalabilidade, observabilidade e hardening.

---

## Fase P0 - Bloqueantes

## PR-001 (P0) Canonicalizar slugs de modulos

Objetivo: ter um unico padrao de slug em backend, frontend, seeds e middleware.

Checklist:
- [ ] Definir lista canonica de slugs (ex.: `forum`, `events`, `denuncias`, `telefones`, `coleta-lixo`, `missas`, `veiculos`, `votacoes`, `vereadores`, `turismo`, `tempo`, `alertas`).
- [ ] Criar mapa de aliases legados (`reports`, `tourism`, `voting`, `council`, `phones`, `alerts`).
- [ ] Adicionar migration de normalizacao em `modules.slug` (com up/down).
- [ ] Atualizar `apps/api/routes/api.php` para usar somente slugs canonicos no `module:...`.
- [ ] Atualizar seeders para uma unica fonte de dados (`ModulesSeeder` e `SyncModulesSeeder` sem conflito).
- [ ] Atualizar gates do frontend (`apps/web/src/App.tsx`, `ModuleRoute`, `ModuleGate`) para slugs canonicos.
- [ ] Adicionar fase de compatibilidade temporaria para slug legado no middleware (janela curta).
- [ ] Adicionar teste cobrindo rota protegida com slug canonico e legado.

Criterios de aceite:
- [ ] `route:list` sem slugs legados em middleware de modulo.
- [ ] `/api/v1/config` retorna slugs canonicos unicos.
- [ ] Frontend nao depende de alias legado para liberar rota.

---

## PR-002 (P0) Unificar source of truth de modulo

Objetivo: eliminar divergencia entre `Tenant` e `ModuleService`.

Checklist:
- [ ] Definir regra unica de habilitacao (`enabled`, `is_core`, fallback) em um servico central.
- [ ] Refatorar `Tenant::enabledModules()` e `Tenant::moduleEnabled()` para usar o mesmo servico.
- [ ] Refatorar `ModuleEnabled` middleware para usar o mesmo servico.
- [ ] Refatorar `ConfigController` para emitir modulos com a mesma regra usada no runtime.
- [ ] Adicionar testes de contrato com cenarios: com pivot, sem pivot, modulo core, modulo opcional.
- [ ] Documentar regra em arquivo tecnico (`ARCHITECTURE.md` ou doc dedicado).

Criterios de aceite:
- [ ] Nao existe caminho de codigo com regra paralela para modulo ativo.
- [ ] Resultado de `/config` bate com decisao do middleware de rota.

---

## PR-003 (P0) Cache tenant-aware e headers corretos

Objetivo: impedir vazamento de cache entre cidades.

Checklist:
- [ ] Adicionar `Vary: X-City, Host` na resposta de `/api/v1/config`.
- [ ] Revisar `Cache-Control` para evitar cache publico perigoso em endpoints tenant-aware.
- [ ] Incluir `city_id` nas chaves de cache do Home aggregator.
- [ ] Incluir `city_id` nas chaves de cache publico do forum.
- [ ] Padronizar chave de cache de `city_domains` (set/get/invalidate iguais).
- [ ] Criar comando utilitario de invalidacao por cidade e por modulo.
- [ ] Teste de integracao: cidade A e cidade B nao compartilham payload de cache.

Criterios de aceite:
- [ ] Mesma URL em cidades diferentes retorna payload correto por tenant.
- [ ] Invalidation limpa exatamente as chaves usadas em runtime.

---

## PR-004 (P0) Tenancy efetivo no Filament

Objetivo: impedir leitura/escrita cross-city no admin.

Checklist:
- [ ] Introduzir middleware de tenant no pipeline do painel Filament.
- [ ] Definir estrategia de resolucao de cidade no admin (dominio, sessao, ou city switcher).
- [ ] Bloquear moderador para cidade fixa vinculada ao usuario.
- [ ] Permitir super admin alternar cidade com auditoria de troca.
- [ ] Revisar recursos Filament sensiveis para garantir `BelongsToTenant` aplicado.
- [ ] Adicionar testes de autorizacao: moderador da cidade A nao acessa dados da cidade B.

Criterios de aceite:
- [ ] Toda tela de moderacao no Filament responde em escopo de cidade.
- [ ] Nao ha query global para recursos tenant-sensitive.

---

## Fase P1 - Operacao e governanca

## PR-005 (P1) Recursos Filament de tenancy

Objetivo: tirar ativacao de modulo do SQL manual.

Checklist:
- [ ] Criar `CityResource`.
- [ ] Criar `CityDomainResource`.
- [ ] Criar `ModuleResource` (catalogo e metadados).
- [ ] Criar `CityModuleResource` (estado efetivo por cidade).
- [ ] Adicionar politicas de acesso separando super admin e operador local.
- [ ] Adicionar filtros por cidade em tabelas de todos os recursos novos.
- [ ] Adicionar validacoes de integridade (slug unico, dominio unico, regras de status).

Criterios de aceite:
- [ ] Operador consegue habilitar/desabilitar modulo por cidade no painel.
- [ ] Nenhuma operacao critica exige SQL manual.

---

## PR-006 (P1) Rollout em massa com auditoria

Objetivo: suportar operacoes do tipo "ativar modulo X para todas as cidades".

Checklist:
- [ ] Criar tabela de auditoria de rollout (`module_rollout_logs`).
- [ ] Criar servico transacional para rollout (`enable`, `disable`, `target`, `exceptions`).
- [ ] Criar comando Artisan (`modules:rollout`) com `--dry-run`.
- [ ] Criar pagina Filament `ModuleRolloutPage` para operacao em lote.
- [ ] Suportar alvos: todas, ativas, por UF, por lista de cidades.
- [ ] Suportar exclusoes explicitas (`except_city_ids`).
- [ ] Registrar ator, diff antes/depois e timestamp.
- [ ] Adicionar rollback rapido (reverter ultimo rollout por `rollout_id`).

Criterios de aceite:
- [ ] Rollout em massa idempotente.
- [ ] Operacao gera trilha de auditoria confiavel e consultavel.

---

## PR-007 (P1) Contrato backend-frontend para modulos

Objetivo: frontend 100% orientado por contrato de config.

Checklist:
- [ ] Definir schema tipado de `config.modules` no backend e frontend.
- [ ] Remover hardcode restante de modulo no frontend.
- [ ] Ajustar componentes de home para nao renderizar bloco de modulo desativado.
- [ ] Padronizar fallback visual (`ModuleUnavailable`) para todos os modulos.
- [ ] Adicionar testes de rota protegida por modulo no frontend.

Criterios de aceite:
- [ ] Nenhuma tela de modulo desativado aparece no menu/home/rota.
- [ ] Frontend e backend concordam com os mesmos slugs e estados.

---

## PR-008 (P1) Seguranca de permissoes por cidade

Objetivo: reduzir risco de role global em operacao local.

Checklist:
- [ ] Definir modelo de permissao por cidade (team_id, pivot ou equivalente).
- [ ] Ajustar policy para validar role no contexto da cidade atual.
- [ ] Migrar usuarios operadores para associacao explicita com cidade.
- [ ] Proteger acoes sensiveis no Filament com verificacao de cidade.
- [ ] Testes de autorizacao para super admin, admin local e moderador local.

Criterios de aceite:
- [ ] Role local nao tem efeito fora da cidade vinculada.
- [ ] Super admin mantem controle global auditavel.

---

## Fase P2 - Moderacao por cidade

## PR-009 (P2) Modelo de dados de moderacao tenant-aware

Objetivo: gravar escopo geografico em todos os eventos de moderacao.

Checklist:
- [ ] Adicionar `city_id` em `topic_reports`.
- [ ] Adicionar `city_id` em `comment_reports`.
- [ ] Adicionar `city_id` em `content_flags`.
- [ ] Adicionar `city_id` ou `scope_city_id` em `user_restrictions`.
- [ ] Criar backfill com joins seguros e logs de consistencia.
- [ ] Adicionar indices compostos para consultas por `city_id + status + created_at`.
- [ ] Atualizar factories e seeders de moderacao.

Criterios de aceite:
- [ ] Novos registros de moderacao sempre saem com cidade definida.
- [ ] Backfill concluido sem perda de historico.

---

## PR-010 (P2) Enforcement de restricoes por cidade

Objetivo: aplicar restricoes no runtime com escopo funcional e geografico.

Checklist:
- [ ] Definir motor unico de avaliacao de restricao (`global`, `modulo`, `cidade`).
- [ ] Aplicar checks em endpoints de forum, denuncias e uploads.
- [ ] Retornar erro padronizado para restricao ativa.
- [ ] Garantir compatibilidade com restricoes globais ja existentes.
- [ ] Testes de integracao cobrindo matriz de escopo.

Criterios de aceite:
- [ ] Usuario restrito na cidade A continua operando na cidade B quando permitido.
- [ ] Restricao global bloqueia em todas as cidades.

---

## PR-011 (P2) Filament de moderacao por cidade

Objetivo: fila, dashboard e operacao de moderacao segmentadas por tenant.

Checklist:
- [ ] Adicionar filtro fixo de cidade nos recursos de fila e reports.
- [ ] Atualizar widgets para cache e metricas por `city_id`.
- [ ] Exibir SLA por cidade e por modulo.
- [ ] Adicionar trilha de auditoria incluindo `city_id` e operador.
- [ ] Testes de UI e policy com dois tenants ativos.

Criterios de aceite:
- [ ] Moderador local ve somente fila e metricas da propria cidade.
- [ ] Super admin consegue visao consolidada sem quebrar isolamento operacional.

---

## Fase P3 - Escala e hardening

## PR-012 (P3) Granularidade de settings por modulo

Objetivo: sair de on/off e suportar configuracao fina por cidade.

Checklist:
- [ ] Definir schema versionado por modulo para `city_modules.settings`.
- [ ] Validar schema no backend ao salvar no admin.
- [ ] Expor somente chaves necessarias no `/config`.
- [ ] Adicionar UI de settings no `CityModuleResource` com validacao.
- [ ] Versionar mudancas de schema com migracao de dados quando necessario.

Criterios de aceite:
- [ ] Cada modulo tem contrato de settings claro e validado.
- [ ] Mudanca de settings nao quebra frontend em cidades antigas.

---

## PR-013 (P3) Suite de testes tenancy end-to-end

Objetivo: detectar regressao de isolamento antes de deploy.

Checklist:
- [ ] Criar testes de API com 2 cidades e modulos diferentes.
- [ ] Criar testes de middleware `ModuleEnabled` por cidade.
- [ ] Criar testes de Filament para autorizacao local vs global.
- [ ] Criar testes de frontend para bootstrap de config e gates.
- [ ] Incluir cenarios de cache e invalidacao tenant-aware.

Criterios de aceite:
- [ ] Pipeline bloqueia merge em caso de regressao de isolamento.
- [ ] Cobertura minima dos fluxos criticos acordada e publicada.

---

## PR-014 (P3) Observabilidade e operacao segura

Objetivo: tornar incidentes de tenancy rastreaveis e recuperaveis.

Checklist:
- [ ] Padronizar logs com `city_id`, `module_slug`, `actor_id`, `request_id`.
- [ ] Criar alertas para falhas de resolucao de tenant e erro de modulo.
- [ ] Criar dashboard operacional de rollout e cache hit/miss por cidade.
- [ ] Criar runbook de incidente: cache cross-city, slug mismatch, rollback de rollout.
- [ ] Revisar limites de rate limit por cidade/modulo.

Criterios de aceite:
- [ ] Time consegue diagnosticar incidente de tenant em minutos.
- [ ] Procedimento de rollback documentado e ensaiado.

---

## Dependencias entre PRs (ordem recomendada)

- [ ] PR-001 antes de PR-002 e PR-007.
- [ ] PR-002 antes de PR-003 e PR-007.
- [ ] PR-004 antes de PR-005, PR-006 e PR-011.
- [ ] PR-005 antes de PR-006.
- [ ] PR-009 antes de PR-010 e PR-011.
- [ ] PR-013 deve rodar apos PR-010 (base funcional completa).

---

## Definicao de pronto por PR (DoD)

- [ ] Codigo, migration e testes revisados.
- [ ] Sem BOM em arquivos alterados.
- [ ] Changelog tecnico atualizado com risco e rollback.
- [ ] Evidencia de teste anexada (logs de teste e cenarios por cidade).
- [ ] Aprovacao de seguranca para PRs P0 e P1.

---

## Checklist rapido para iniciar agora (Sprint 1)

- [ ] Executar PR-001.
- [ ] Executar PR-002.
- [ ] Executar PR-003.
- [ ] Executar PR-004.

Resultado esperado da Sprint 1:
- isolamento tenant consistente,
- contrato de modulo unificado,
- admin sem risco cross-city,
- base pronta para rollout operacional no Filament.
