# PR-04 Tasks Detalhadas - Politica de Visibilidade Publica

Data: 2026-02-08
Escopo: `apps/api`
Status geral: `CONCLUIDO`

---

## Objetivo do PR-04

Garantir que endpoints publicos de denuncias retornem apenas itens publicaveis, com payload sanitizado (sem campos internos de moderacao), mantendo acesso completo apenas para dono da denuncia e perfis administrativos.

---

## Task Board (com IDs)

### `PR04-T001` - Definir politica explicita de visibilidade publica no model
Status: `DONE`
Objetivo: centralizar regra de quem pode aparecer em endpoints publicos.

Subtarefas:
- `PR04-T001.1` Adicionar lista de status publicos no `CitizenReport`.
- `PR04-T001.2` Criar `scopePublicVisible()`.
- `PR04-T001.3` Criar `isPubliclyVisible()` para avaliacao pontual em `show`.
  - Arquivo: `apps/api/app/Domains/Reports/Models/CitizenReport.php`

Resultado:
- Regras de visibilidade nao ficam mais espalhadas em controllers.
- Status publico atual ficou explicito (somente `resolvido`).

---

### `PR04-T002` - Separar resource publico e privado
Status: `DONE`
Objetivo: impedir vazamento de campos internos no consumo publico.

Subtarefas:
- `PR04-T002.1` Criar `PublicReportResource` com payload sanitizado.
- `PR04-T002.2` Excluir dados internos de moderacao na timeline publica (`note`, `by`).
  - Arquivo: `apps/api/app/Domains/Reports/Http/Resources/PublicReportResource.php`

Resultado:
- Payload publico nao expoe observacoes internas nem identificacao de moderador.

---

### `PR04-T003` - Aplicar politica no `ReportController`
Status: `DONE`
Objetivo: padronizar retorno publico/privado nos endpoints principais.

Subtarefas:
- `PR04-T003.1` `index()` passa a usar `publicVisible()` + `PublicReportResource`.
- `PR04-T003.2` `show()` agora decide recurso por permissao:
  - dono/admin/moderador => `ReportResource` (privado)
  - demais => apenas se `isPubliclyVisible()`, com `PublicReportResource`
- `PR04-T003.3` Bloquear leitura de item nao-publico para nao autorizado com `404`.
- `PR04-T003.4` Criar helpers de resolucao de usuario autenticado opcional (`request->user`/`sanctum`).
  - Arquivo: `apps/api/app/Domains/Reports/Http/Controllers/ReportController.php`

Resultado:
- Endpoint de listagem publica ficou restrito e sanitizado.
- Detalhe respeita regra de visibilidade por perfil.

---

### `PR04-T004` - Aplicar politica no mapa publico
Status: `DONE`
Objetivo: alinhar `reports/map` com mesma regra de visibilidade e corrigir inconsistencias.

Subtarefas:
- `PR04-T004.1` Aplicar `publicVisible()` no `ReportMapController`.
- `PR04-T004.2` Corrigir campo de endereco para `address_text` (antes usava `address`).
- `PR04-T004.3` Normalizar status para valor string (`$report->status->value`).
  - Arquivo: `apps/api/app/Domains/Reports/Http/Controllers/ReportMapController.php`

Resultado:
- Mapa publico nao retorna denuncias nao-publicas.
- Endereco voltou consistente com schema real da tabela.

---

### `PR04-T005` - Cobertura automatizada de visibilidade
Status: `DONE`
Objetivo: evitar regressao de privacidade/publicacao em evolucoes futuras.

Subtarefas:
- `PR04-T005.1` Criar teste de listagem publica retornando somente status publico.
- `PR04-T005.2` Criar teste de bloqueio para usuario nao-dono em denuncia nao-publica.
- `PR04-T005.3` Criar teste de acesso do dono com payload privado completo.
- `PR04-T005.4` Criar teste de mapa publico filtrado + endereco correto.
  - Arquivo: `apps/api/tests/Feature/Reports/PublicReportsVisibilityTest.php`

Resultado:
- Regras de visibilidade agora estao protegidas por testes de feature.

---

## Evidencias de Teste (Gate da PR)

### 1) Suite API focada (PR-04 + regressao reports/tenancy)
Comando:
- `php artisan test --testsuite=Feature --filter="(PublicReportsVisibilityTest|ReportIdempotencyTest|CitizenReportStatusTest|TenantContextHeadersTest)"`

Resultado:
- `PASS` (10 testes, 46 assertions)

---

## Checklist de Saida PR-04

- [x] `scopePublicVisible()` implementado no model.
- [x] `PublicReportResource` criado e aplicado no endpoint publico.
- [x] `show` com politica de acesso por perfil (publico vs privado).
- [x] `reports/map` alinhado com visibilidade publica.
- [x] Inconsistencia de endereco (`address` -> `address_text`) corrigida.
- [x] Testes de visibilidade adicionados e passando.

---

## Observacoes

- No estado atual das regras de negocio, visibilidade publica foi fixada em `status = resolvido`.
- Se surgir flag dedicada de moderacao/publicacao (ex.: `public_visible`), o `scopePublicVisible()` ja centraliza o ponto de troca.
