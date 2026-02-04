# Sistema de Denuncias - Documentacao Tecnica

Ultima atualizacao: 2026-02-04

## Visao geral
O modulo de Denuncias permite que cidadaos reportem problemas urbanos com descricao, fotos e localizacao. O fluxo e mobile-first e o back-end valida regras e status. O painel Filament e a interface administrativa (nao consome a API).

## Arquitetura (resumo)
### Backend (Laravel 12)
- Dominio: `apps/api/app/Domains/Reports`
- Models: `CitizenReport`, `ReportCategory`, `ReportStatusHistory`
- Enums: `ReportStatus`, `LocationQuality`
- Controller/API: `ReportController`, Requests e Resources
- Media: Spatie Media Library (colecao `report_images`)

### Frontend (React)
- Wizard de criacao (categoria, localizacao, detalhes, fotos, revisao)
- Lista publica e detalhe de denuncia
- Minhas denuncias (autenticado)

## Modelo de dados (real)
### report_categories
- id (UUID)
- name (string)
- slug (string, unico)
- icon (string)
- color (string)
- tips (JSON, array de strings)
- active (boolean)
- sort_order (int)
- created_at, updated_at

### citizen_reports
- id (UUID)
- user_id (UUID, FK users)
- category_id (UUID, FK report_categories)
- bairro_id (UUID, FK bairros, nullable)
- title (string)
- description (text)
- status (string: recebido, em_analise, resolvido, rejeitado)
- protocol (string unico)
- address_text (string, nullable)
- address_source (string: manual, gps, mapa)
- location_quality (string: precisa, aproximada, manual)
- latitude (decimal(10,7), nullable)
- longitude (decimal(10,7), nullable)
- location_accuracy_m (int, nullable)
- created_at, updated_at, resolved_at (nullable), deleted_at

Indices principais:
- (user_id, created_at)
- (status, created_at)
- bairro_id
- category_id

### report_status_history
- id (UUID)
- report_id (UUID, FK citizen_reports)
- status (string)
- note (text, nullable)
- created_by (UUID, FK users, nullable)
- created_at

### media (Spatie)
- Tabela `media` (padrao Spatie)
- Colecao `report_images`
- Conversoes: `thumb`, `web`

## Admin (Filament)
### Recursos
- `CitizenReportResource`
  - Edicao e visualizacao da denuncia
  - Action de atualizar status (com historico + audit log)
  - RelationManagers: `StatusHistory`, `Media`
- `ReportCategoryResource`
  - CRUD de categorias
  - Campo `tips` como array (TagsInput)

### Pages operacionais
- `ModerationQueue`
  - Fila unificada (flags, reports do forum, denuncias)
- `ReportsDashboard`
  - KPIs + lista de denuncias pendentes
- `GeoIssues`
  - Denuncias sem localizacao precisa
  - Acoes rapidas: abrir mapa, ajustar qualidade, corrigir localizacao

### Roles (admin painel)
- admin: acesso total
- moderator: moderacao (denuncias, reports, flags, widgets)
- user: sem acesso ao painel

## Fluxo admin (denuncias)
1. Moderador acessa `ReportsDashboard` ou `ModerationQueue`.
2. Abre a denuncia e revisa detalhes e midia.
3. Atualiza status via action (gera historico e audit log).
4. Se houver problema de localizacao, usa `GeoIssues` para corrigir.

## API (resumo)
Publicos:
- `GET /api/v1/reports`
- `GET /api/v1/reports/{id}`
- `GET /api/v1/reports/stats`
- `GET /api/v1/report-categories`

Autenticados:
- `GET /api/v1/me/reports`
- `POST /api/v1/me/reports`
- `POST /api/v1/me/reports/{id}/media`

## Comandos uteis
```bash
cd apps/api && php artisan db:seed --class=ReportCategorySeeder
```
