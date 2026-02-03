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
- `CommentReportResource`
- `ContentFlagResource`
- `PhoneResource`
- `TopicReportResource`
- `TopicResource`
- `UserResource`
- `UserRestrictionResource`
- Paginas e widgets em `apps/api/app/Filament/Admin/Pages` e `apps/api/app/Filament/Admin/Widgets`:
- `Dashboard`
- `ModerationQueue`
- `AdminOverviewStats`

## Endpoints e dominios (resumo da API)
- Rotas publicas: auth OTP, bairros, forum (read), eventos (read), turismo (read), reports (read), geocode. `apps/api/routes/api.php`
- Rotas autenticadas: perfil, forum (write), RSVP/favorites, turismo likes/reviews, reports create e media. `apps/api/routes/api.php`
- Rotas admin na API: `/api/v1/admin/users`, moderacao forum, `/api/v1/admin/reports`. `apps/api/routes/api.php`
- Observacao: o painel Filament opera direto nos Models e Policies, nao consome os endpoints da API.

## Lacunas de cobertura no painel
- Eventos: `Event`, `EventCategory`, `Tag`, `Organizer`, `Venue`, `EventSchedule`, `TicketLot`, `EventMedia`, `EventRsvp`.
- Turismo: `TourismSpot`, `TourismReview`, categorias.
- Denuncias cidadas: `CitizenReport`, `ReportCategory`, `ReportStatusHistory`.
- Forum: `Comment` (nao ha Resource dedicado para CRUD/moderacao).
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
