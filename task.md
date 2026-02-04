# Checklist - Admin (Filament)

## Prioridade Alta (seguranca, acesso, consistencia)
- [x] Unificar policies em `apps/api/app/Policies` e remover duplicadas de `app/Domains/*/Policies`.
- [x] Registrar policies faltantes no `AppServiceProvider` (CommentReport, TopicReport, Topic, Role).
- [x] Ajustar `make:admin-crud` para chamar `shield:generate` com `Resource` + `--panel=admin`.
- [x] Gerar permissoes Shield para resources/pages/widgets e rodar seeder de roles.
- [x] Definir estrategia de permissao para widgets (`widget_*`) e refletir no seeder (admin/moderator).
- [x] Auditar acoes de moderacao (TopicReport, CommentReport, ContentFlag) com Activity Log.
- [x] Restringir acoes destrutivas e delete de midia por role/permissao (ex: media em `CitizenReport`).
- [x] Revisar `RolePolicy` (mantida baseada em permissoes do Shield; admin com acesso total).
- [x] Consolidar roles para `admin`, `moderator`, `user` (remover `operator` do seeder e ajustar policies/resources).

## Prioridade Media (agilidade e UX do admin)
- [x] Adicionar RelationManager de RSVPs dentro de `EventResource`.
- [x] Incluir RelationManagers para `EventLinks` e `EventDays` se estiverem ativos no dominio.
- [x] Melhorar `GeoIssues` com acao rapida (corrigir localizacao / abrir mapa / ajustar qualidade).
- [x] Padronizar labels e navegacao das pages operacionais (PT-BR consistente).
- [x] Atualizar `denuncias.md` para refletir o schema real e fluxo do admin.

## Prioridade Media (dados e consistencia)
- [x] Migrar `report_categories.tips` para coluna JSON (DB + casts + validacao).
- [x] Validar serializacao de `tips` no `ReportCategoryResource`.

## Verificacao e Qualidade
- [ ] Validar acesso por role em todos os Resources, Pages e Widgets.
- [ ] Testar `ModerationQueue` com dados reais e links corretos.
- [x] Validar update de status de denuncia com historico + audit log.
- [ ] Testes para moderacao (forum) e publicacao de eventos.
- [ ] Verificar performance com dados volumosos (N+1 e indices).
