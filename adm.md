# Administracao (Filament) - Analise e Estrategia de CRUD

## Objetivo
Fornecer um caminho robusto, rapido e seguro para criar CRUDs no painel Filament e administrar todo o sistema.

## Contexto atual (stack e arquitetura)
- Monorepo com API Laravel e PWA React. `ARCHITECTURE.md`
- Backend: Laravel 12, Filament 3.3, Sanctum, Spatie Permission, Spatie Media Library, Spatie Query Builder. `apps/api/composer.json`
- Contrato OpenAPI como fonte da verdade. `contracts/openapi.yaml`
- Ferramenta de scaffolding de CRUD para API e front. `tools/make-crud.js`
- API versionada em `/api/v1`, organizada por dominios. `apps/api/routes/api.php`

## Estado atual do admin (Filament)
- Painel Filament configurado com path `admin` e plugin Shield. `apps/api/app/Providers/Filament/AdminPanelProvider.php`
- Permissoes e roles com Filament Shield + Spatie Permission. `apps/api/config/filament-shield.php`
- Recursos Filament existentes em `apps/api/app/Filament/Admin/Resources`:
- `ActivityLogResource`
- `BairroResource`
- `CommentResource`
- `CommentReportResource`
- `ContentFlagResource`
- `EventCategoryResource`
- `EventResource`
- `EventRsvpResource`
- `OrganizerResource`
- `PhoneResource`
- `ReportCategoryResource`
- `TagResource`
- `TopicReportResource`
- `TopicResource`
- `TourismReviewResource`
- `TourismSpotResource`
- `UserResource`
- `UserRestrictionResource`
- `VenueResource`
- `CitizenReportResource`
- Paginas e widgets em `apps/api/app/Filament/Admin/Pages` e `apps/api/app/Filament/Admin/Widgets`:
- `Dashboard`
- `ModerationQueue`
- `AdminOverviewStats`
- `ReportsDashboard`
- `GeoIssues`
- `ReportsOverviewStats`

## Endpoints e dominios (resumo da API)
- Rotas publicas: auth OTP, bairros, forum (read), eventos (read), turismo (read), reports (read), geocode. `apps/api/routes/api.php`
- Rotas autenticadas: perfil, forum (write), RSVP/favorites, turismo likes/reviews, reports create e media. `apps/api/routes/api.php`
- Rotas admin na API: `/api/v1/admin/users`, moderacao forum, `/api/v1/admin/reports`. `apps/api/routes/api.php`
- Observacao: o painel Filament opera direto nos Models e Policies, nao consome os endpoints da API.

## Lacunas de cobertura no painel
- Turismo: categorias (se virar entidade propria).
- Outros CRUDs operacionais que hoje so existem via API ou seeders.

## Estrategia robusta para CRUDs no Filament
Principios
- API segue como fonte da verdade, Filament como camada administrativa. `ARCHITECTURE.md`
- Permissoes sempre por Policy + Shield, nunca apenas por UI. `apps/api/config/filament-shield.php`
- Evitar N+1 em tabelas: usar `with`, `withCount` e filtros bem definidos. Exemplo: `apps/api/app/Filament/Admin/Resources/UserResource.php`
- Auditoria obrigatoria para operacoes sensiveis com Activity Log. `apps/api/app/Filament/Admin/Resources/ActivityLogResource.php`

Fluxo recomendado (rapido e seguro)
1. Criar ou ajustar o dominio (Model, Migration, Requests, Resources) e rotas.
2. Manter contrato OpenAPI atualizado e gerar SDK. `contracts/openapi.yaml`
3. Gerar Resource Filament e ajustar form/table (usar `php artisan make:filament-resource Model --generate`).
4. Criar Policy e gerar permissoes via Shield.
5. Adicionar RelationManagers e Actions para fluxos de negocio (status, moderacao, aprovacao).
6. Adicionar audit log e testes minimos para status/roles.

## Padroes recomendados no Filament
Formularios
- Usar `Section` com colunas claras e labels curtos.
- Campos sensiveis com `dehydrated()` e validacao consistente.
- Selects com `relationship()->searchable()->preload()` quando a tabela for grande.

Tabelas
- `defaultSort`, `searchable`, `toggleable`.
- Filters alinhados a indices do banco.
- Actions destrutivas com `requiresConfirmation()`.

Query
- `getEloquentQuery()` com `with` e `withCount` para evitar N+1.
- Ordenacao padrao por `created_at` quando fizer sentido.

Seguranca
- `canCreate()` e `DeleteAction` restritos por role (padrao ja usado).
- Policies e Shield para `view_any`, `create`, `update`, `delete`.
- Soft delete quando apropriado.
- Auditar todas as alteracoes relevantes.

## Mapa sugerido de CRUDs no painel
Eventos
- `EventResource` com RelationManagers para schedules, tickets, media, tags e organizadores.
- `EventCategoryResource`, `TagResource`, `VenueResource`, `OrganizerResource`, `TicketLotResource`.

Turismo
- `TourismSpotResource` com RelationManager de reviews.
- `TourismReviewResource` com filtros por spot, status e nota.

Denuncias cidadas
- `CitizenReportResource` com Actions para `updateStatus` e timeline de `ReportStatusHistory`.
- `ReportCategoryResource` para catalogo de categorias.

Forum
- `CommentResource` para moderacao direta.
- Manter `TopicReportResource` e `CommentReportResource` como filas.

Sistema
- Continuar com `ActivityLogResource`, `UserResource`, `UserRestrictionResource`.
- Adicionar pagina de configuracoes gerais se houver parametros globais.

## Checklist por CRUD
- Model com `fillable`, `casts`, `softDeletes` quando necessario.
- Policy registrada e permissoes geradas com Shield.
- Resource com form, table, filters e actions criticas.
- RelationManagers para 1:N e N:N.
- `getEloquentQuery()` otimizada.
- Logs de auditoria e validacao server-side.

---

## Checklist detalhado (padrao para todos os CRUDs)

## 1) Regra base: Filament nao consome a API
- Filament opera sobre Models + Policies, nao sobre endpoints.
- API continua sendo a fonte da verdade do contrato (OpenAPI, Requests, Resources).
- Filament e a interface administrativa usando os mesmos Models e as mesmas regras.
- Nao duplique regra de negocio em Controller e Filament.
- Coloque regra de negocio em `app/Domains/*/Actions/*` ou `app/Domains/*/Services/*`.
- Filament chama essas Actions/Services.

## 2) Kit CRUD Filament interno (templates + helpers)
Objetivo: 1 comando cria tudo e registra o basico.
- Criar gerador de Admin CRUD (Resource + Policy + Shield).
- Comando alvo: `php artisan make:admin-crud CitizenReport --domain=Reports --media=report_images --soft-deletes`

Saidas esperadas:
- `app/Filament/Admin/Resources/CitizenReportResource/*`
- `app/Policies/CitizenReportPolicy.php`
- Registrar Policy se nao houver auto-discovery.
- Rodar ou sugerir `php artisan shield:generate --resource=CitizenReport`
 - Stubs internos em `apps/api/stubs/filament-admin/*` para padronizar novos CRUDs

MVP do kit (script simples):
- `php artisan make:filament-resource Model --generate`
- `php artisan make:policy ModelPolicy --model=Model`
- `php artisan shield:generate --resource=Model`

## 3) Padrao unico para regra de negocio
- Controller API valida request, chama Action/Service, retorna Resource.
- Filament chama a mesma Action/Service em Actions ou `mutateFormData*`.

Exemplos:
- `UpdateReportStatusAction` (Reports)
- `ApproveEventAction` (Events)
- `ModerateCommentAction` (Forum)

## 4) BaseResource e Traits reutilizaveis

## 4.1) BaseResource (defaults)
- `defaultSort('created_at', 'desc')`
- `created_at` e `updated_at` toggleable
- Filtro de soft deletes quando aplicavel
- `TextColumn::make('id')->toggleable()->copyable()`
- Actions padrao com `requiresConfirmation()`

## 4.2) Traits sugeridos
- `HasAuditActionsTrait` para logar mudancas sensiveis
- `HasStatusBadgeTrait` para badge de enum de status
- `HasMediaLibraryTrait` para upload + preview + conversoes

## 5) RelationManagers agressivamente
Denuncias (CitizenReport)
- `CitizenReportResource`
- `ReportStatusHistoryRelationManager`
- `MediaRelationManager` (ou integrar no form)
- Action: alterar status (modal com note)
- Action: marcar como publico/privado (se existir)

Eventos
- `EventResource`
- RelationManagers: schedules, ticket lots, media, tags, organizers, venue
- Actions: publicar/despublicar, destacar, duplicar evento

## 6) Permissoes padronizadas (Shield + Policies)
- Policy obrigatoria: `viewAny`, `view`, `create`, `update`, `delete`
- Shield gera permissoes `resource_*`
- Roles padrao:
- `admin`: tudo
- `moderator`: denuncias + forum (moderacao)
- `operator`: eventos + turismo

## 7) Performance: padrao de query para evitar N+1
Todo Resource deve ter:
- `getEloquentQuery()` com `with()` e `withCount()`

Exemplos:
- Denuncias: `with(['user','category','bairro'])->withCount('media')`
- Eventos: `with(['venue','organizer'])->withCount(['rsvps','media'])`

Filtros devem seguir indices:
- `status`, `category_id`, `bairro_id`, `created_at`

## 8) Pages e Widgets para operacao (nao CRUD)
Ampliar a ideia de:
- `ModerationQueue`: fila unificada (denuncias pendentes + reports do forum)
- `ReportsDashboard`: KPIs + graficos + ultimos pendentes
- `GeoIssues`: denuncias sem localizacao ou baixa qualidade

## 9) Estrategia pratica para criar 10 CRUDs em 1 dia
Ordem recomendada:
- CRUDs catalogo: `Category`, `Tag`, `Bairro`, `Venue`
- CRUDs principais: `Event`, `TourismSpot`, `CitizenReport`
- CRUDs moderacao: `Review`, `Comment`, `Flags/Reports`
- CRUDs sistema: `Settings`, `FeatureFlags` (se houver)

Em todos:
- Comecar com `--generate`, depois refinar form/table

## 10) Ritual de 15 minutos por CRUD
- Model + migration + relations
- Policy (admin/moderator/operator)
- `make:filament-resource --generate`
- `shield:generate --resource=Model`
- Ajustar `form()` com `Section` + `relationship()->searchable()->preload()`
- Ajustar `table()` com filtros + badge de status
- Ajustar `getEloquentQuery()` com `with/withCount`
- Adicionar RelationManagers
- Se operacao sensivel: Action chama DomainAction + log

---

## Plano de melhorias (checklist executavel)

## Fase 0 - Fundacao e padronizacao
- [x] Definir estrutura padrao de dominio para `Actions` e `Services` por modulo.
- [x] Criar `BaseResource` com defaults de tabela, filtros e actions.
- [x] Criar Traits reutilizaveis: `HasAuditActionsTrait`, `HasStatusBadgeTrait`, `HasMediaLibraryTrait`.
- [x] Padronizar `getEloquentQuery()` com `with/withCount` em todos os Resources existentes.
- [x] Definir roles base `admin`, `moderator`, `operator` e mapear permissoes por modulo.
- [x] Atualizar Policies existentes para refletir as roles base.

## Fase 1 - Kit CRUD Filament
- [x] Implementar script/command `make:admin-crud` (Resource + Policy + Shield).
- [x] Criar stubs internos para Resource, Policy e RelationManager.
- [x] Garantir que o kit roda `shield:generate --resource=Model`.
- [x] Documentar o uso do kit no repo e incluir no `CONTRIBUTING.md` se necessario.

## Fase 2 - CRUDs prioritarios
- [x] Catalogo: `EventCategory` (Categorias de Eventos).
- [x] Catalogo: `Tag`.
- [x] Catalogo: `Bairro` (ja existente).
- [x] Catalogo: `Venue`.
- [x] Catalogo: `ReportCategory` (Denuncias).
- [x] CRUD principal: `Event`.
- [x] CRUD principal: `Organizer`.
- [x] CRUD principal: `EventRsvp`.
- [x] CRUD principal: `TourismSpot`.
- [x] CRUD principal: `CitizenReport`.
- [x] Gerar permissoes Shield para novos resources e rodar seeder de roles.
- [x] CRUD moderacao: `Comment` (Forum).
- [x] CRUD moderacao: `TourismReview` (Turismo).
- [x] CRUD moderacao: `Flags/Reports` (TopicReport, CommentReport, ContentFlag).
- [ ] CRUDs sistema: `Settings`, `FeatureFlags` (se existirem).

## Fase 3 - RelationManagers e operacao
- [x] `EventResource`: RelationManagers para schedules, media, tags.
- [x] `EventResource`: Ticket lots (via `EventTicket` + repeater).
- [x] `TourismSpotResource`: RelationManager para reviews.
- [x] `CitizenReportResource`: RelationManagers para status history e media.
- [x] Action operacional: alterar status com nota (CitizenReport).

## Fase 4 - Pages e Widgets operacionais
- [x] Unificar a fila em `ModerationQueue` (forum + reports + flags).
- [x] Criar `ReportsDashboard` com KPIs e ultimos pendentes.
- [x] Criar `GeoIssues` para itens sem localizacao ou baixa qualidade.

## Fase 5 - Performance e qualidade
- [x] Revisar indices para filtros padrao (`status`, `category_id`, `bairro_id`, `created_at`).
- [x] Garantir `with/withCount` em todos os Resources criados.
- [x] Auditar actions sensiveis com Activity Log (status de denuncias).
- [x] Teste minimo: alteracao de status de denuncias (CitizenReport).
- [ ] Testes para acoes de moderacao (forum) e publicacao (events).
