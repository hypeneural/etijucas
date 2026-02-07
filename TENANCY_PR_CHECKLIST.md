# Tenancy PR Checklist (Obrigatorio)

Data base: 2026-02-07  
Escopo: API, Web, Filament, Jobs e Cache tenant-aware

---

## 1. Isolamento de tenant

- [ ] Toda leitura/escrita tenant-aware usa `city_id`.
- [ ] Nao existe query tenant-aware sem filtro por `city_id`.
- [ ] Rotas tenant-required estao em grupo com `RequireTenant`.
- [ ] Nao foi criada rota nova tenant-aware fora do grupo protegido.

## 2. Modulos e contrato

- [ ] Modulos novos usam `module_key` canonico.
- [ ] Nao existe regra duplicada para modulo efetivo.
- [ ] `/api/v1/config` e middleware de modulo retornam comportamento identico.
- [ ] Alias legado (se usado) esta documentado com plano de remocao.

## 3. Filament/admin

- [ ] Resource tenant-aware aplica escopo por cidade.
- [ ] Moderador local nao acessa cidade diferente.
- [ ] Super admin alterna tenant sem vazamento de dados.
- [ ] Acao sensivel do admin gera log de auditoria.

## 4. Cache tenant-aware

- [ ] Nao foi usado `Cache::remember` direto em dominio tenant-aware.
- [ ] Chaves tenant-aware usam prefixo de cidade.
- [ ] Invalidation afeta somente cidade alvo.
- [ ] Endpoints de config usam `Vary: Host, X-City`.

## 5. Jobs e filas

- [ ] Job tenant-aware carrega `city_id`, `module_key`, `trace_id`.
- [ ] Job tenant-aware seta contexto antes do `handle()`.
- [ ] Job sem `city_id` falha cedo com log estruturado.
- [ ] Logs de fila incluem `city_id`.

## 6. Banco e migracoes

- [ ] Tabela tenant-aware nova tem `city_id` indexado.
- [ ] Tabela de moderacao tem `city_id` explicito quando aplicavel.
- [ ] Backfill/migracao inclui validacao de consistencia.
- [ ] Plano de rollback de schema foi definido no PR.

## 7. Testes minimos por PR

- [ ] Teste de isolamento entre cidade A e B.
- [ ] Teste de cache contamination entre cidade A e B (se houver cache).
- [ ] Teste de middleware tenant-required (quando rota nova).
- [ ] Teste de contrato de modulo (quando alterar modulos/config).

## 8. Evidencia e rollout

- [ ] Changelog tecnico curto (impacto, risco, rollback) anexado no PR.
- [ ] Evidencia de execucao de testes anexada no PR.
- [ ] Se houver feature flag, estrategia de rollback esta documentada.
- [ ] Se houver migration destrutiva, estrategia de restore esta documentada.

