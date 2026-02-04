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

## Analise atual do admin (Filament)
- BaseResource centraliza sort, colunas padrao, filtros e eager loading por Resource.
- Traits adicionadas para media, status badge e auditoria de acoes sensiveis.
- `make:admin-crud` e stubs internos aceleram o bootstrap de novos CRUDs.
- CRUDs principais de conteudo, moderacao e sistema estao cobertos no painel.
- ModerationQueue unifica flags, reports do forum e denuncias cidadas.
- Pages operacionais para denuncias com KPIs e foco em qualidade de geolocalizacao.
- Shield gerou permissoes para resources, pages e widgets; roles base seedadas.
- Politica unica: todas as policies ficam em `apps/api/app/Policies` e sao registradas no Gate.

## Analise das denuncias no admin
- `CitizenReportResource` com action dedicada para update de status e registro no historico.
- RelationManagers para historico de status e midias (Media Library).
- `ReportCategoryResource` para gerenciar categorias e dicas.
- `ReportsDashboard` e `GeoIssues` como funis operacionais.
- `ModerationQueue` inclui denuncias com status Recebido e Em Analise.
- Atualizacao de status cria `ReportStatusHistory` e registra `resolved_at`.

## Inconsistencias atuais de Denuncias (documento vs implementacao)
- `denuncias.md` descreve `status_history` JSON e tabela `report_media`, mas a implementacao usa `report_status_history` e Spatie Media Library.
- `denuncias.md` cita `user_id` nullable e `is_anonymous`, mas a migration exige `user_id` e nao possui `is_anonymous`.
- `denuncias.md` usa `address` e `status_history`, mas o schema real usa `address_text`, `address_source`, `location_quality` e `location_accuracy_m`.
- `report_categories.tips` esta como `text` no banco e `array` no model, sem coluna JSON.

## Checklist de melhorias (prioridade alta)
- Definir fonte unica de policies (app/Policies vs app/Domains/*/Policies) e remover duplicadas.
- Registrar policies faltantes no `AppServiceProvider` para recursos de moderacao.
- Ajustar `make:admin-crud` para chamar `shield:generate` com o nome do Resource e `--panel=admin`.
- Rever permissoes de widgets (`widget_*`) e definir se serao restringidos por role.
- Adicionar auditoria nas acoes de moderacao (TopicReport, CommentReport, ContentFlag).
- Restringir acoes destrutivas e delete de midia por role/permissao.

## Checklist de melhorias (prioridade media)
- Adicionar RelationManager de RSVPs dentro de `EventResource`.
- Incluir RelationManagers para `EventLinks` e `EventDays` se fizerem parte do modelo.
- Melhorar `GeoIssues` com acao rapida de ajuste de localizacao.
- Atualizar `denuncias.md` para refletir o schema real e o fluxo do admin.
- Migrar `report_categories.tips` para coluna JSON.

## Checklist de verificacao (operacao e qualidade)
- Validar acesso por role em todos os Resources, Pages e Widgets do painel.
- Verificar `ModerationQueue` com dados reais e links corretos para cada tipo.
- Validar update de status de denuncia com historico e audit log.
- Validar serializacao de `tips` em `ReportCategoryResource`.
- Verificar performance das queries com dados volumosos e N+1.
