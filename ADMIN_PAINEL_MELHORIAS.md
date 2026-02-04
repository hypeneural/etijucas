# Painel Administrativo - Analise Geral e Plano de Melhorias

## Contexto atual
- Stack principal: Laravel 12 + Filament 3 + Sanctum + Spatie Permission + Spatie Media Library.
- O painel Filament opera direto nos Models + Policies. A API (OpenAPI/Requests/Resources) segue como fonte de verdade.
- Roles padrao em uso: admin, moderator, user. Permissoes geradas com Filament Shield e complementadas no seeder.

## Endpoints relevantes (API)
### Denuncias cidadas
- GET `/api/v1/report-categories`
- GET `/api/v1/reports`
- GET `/api/v1/reports/{id}`
- GET `/api/v1/reports/stats`
- GET `/api/v1/reports/map`
- POST `/api/v1/reports` (auth)
- POST `/api/v1/reports/{id}/media` (auth)
- DELETE `/api/v1/reports/{id}/media/{mediaId}` (auth)
- PATCH `/api/v1/reports/{id}/status` (admin|moderator)

### Forum
- GET `/api/v1/forum/topics`
- GET `/api/v1/forum/topics/{topic}`
- GET `/api/v1/forum/topics/{topic}/comments`
- POST `/api/v1/forum/topics` (auth)
- PUT `/api/v1/forum/topics/{topic}` (auth)
- DELETE `/api/v1/forum/topics/{topic}` (auth)
- POST `/api/v1/forum/topics/{topic}/report` (auth)
- POST `/api/v1/forum/topics/{topic}/comments` (auth)
- POST `/api/v1/comments/{comment}/report` (auth)
- POST `/api/v1/admin/forum/topics/{topic}/hide` (admin|moderator)
- POST `/api/v1/admin/forum/users/{user}/suspend` (admin|moderator)

### Eventos (agenda)
- GET `/api/v1/events` + filtros (data, bairro, categoria, tag, organizer)
- GET `/api/v1/events/date/{date}` e `/api/v1/events/month/{year}/{month}`
- GET `/api/v1/events/{event}`
- GET `/api/v1/events/{event}/attendees`
- POST `/api/v1/events/{event}/rsvp` (auth)
- POST `/api/v1/events/{event}/favorite` (auth)

## Cobertura atual no painel (Filament)
### Denuncias
- `CitizenReportResource` com RelationManagers (StatusHistory, Media) e Action de update status.
- `ReportCategoryResource` com tags de dicas e ordenacao.
- `ContentFlagResource` com fluxo de moderacao (review, dismiss, action taken).
- Pages: `ModerationQueue`, `ReportsDashboard`, `GeoIssues`.

### Forum
- `TopicResource`, `CommentResource`, `TopicReportResource`, `CommentReportResource`.
- Acoes de moderacao em topicos e denuncias (hide/restore/dismiss).

### Eventos (agenda)
- `EventResource` com RelationManagers (schedules, tickets, links, days, rsvps, media, tags).
- Recursos de catalogo: `EventCategory`, `Organizer`, `Venue`, `Tag`.

## Pontos de melhoria gerais (admin)
- Normalizar labels PT-BR quebrados no modulo Forum (ex: T??pico, Coment??rio).
- Ajustar grupos de navegacao do painel para incluir `Forum` e ordenar por fluxo de trabalho.
- Centralizar regra de negocio em Actions/Services e reutilizar no Filament e na API.
- Padronizar UX nos formularios e tabelas com `BaseResource` e traits reutilizaveis.

## Melhorias por dominio
### Denuncias cidadas (Citizen Reports + Content Flags)
- Criar fluxo de atribuir denuncia a um moderador e registrar responsavel.
- Exibir tempo em aberto (SLA) e alertas visuais para atrasos.
- Adicionar actions rapidas na listagem para mudar status e registrar nota.
- Adicionar preview de mapa e ajuste de localizacao direto no formulario principal.
- Consolidar fila de moderacao com filtros por prioridade e tipo.
- Garantir auditoria de todas as alteracoes (status, localizacao, exclusao de midia).

### Forum (Topicos, Comentarios, Denuncias)
- Corrigir labels e textos com encoding quebrado no admin e nos resources.
- Adicionar acao de ocultar/restaurar comentario direto na listagem.
- Mostrar contexto do conteudo denunciado no modal (trecho + link para o topico).
- Incluir badges de quantidade de denuncias e ultima atividade por topico.
- Criar acao rapida para suspender usuario a partir de topicos/comentarios.

### Eventos (agenda)
- Criar pagina de calendario (mes/semana) para visualizar e editar eventos.
- Adicionar actions rapidas de publicar/despublicar, destacar e duplicar evento.
- Exibir resumo de RSVP e favoritos diretamente na listagem.
- Melhorar filtros de agenda com ranges de data e status.

## UX/UI do painel
- Adicionar grupo de navegacao `Forum` e reordenar menus por fluxo real.
- Aplicar badges e cores consistentes para status nos recursos.
- Usar `image()` e `imageEditor()` para uploads em todos os recursos.
- Melhorar busca com colunas importantes (titulo, protocolo, usuario, bairro).
- Reduzir clique excessivo com actions em lote e quick actions.

## Permissoes e seguranca
- Consolidar permissoes de pages/widgets (`page_*`, `widget_*`) para admin e moderator.
- Restringir acoes destrutivas para admin e manter moderator apenas com moderacao.
- Validar Policies para todos os Resources e RelationManagers.

## Performance e dados
- Garantir `with/withCount` nas listagens mais pesadas.
- Indexar colunas usadas em filtros (status, categoria, bairro, created_at).
- Usar cache curto para dashboards de KPIs.
- Implementar `deferLoading()` em tabelas volumosas.

## Uploads e midia
- Substituir campos de URL por Media Library onde houver upload manual.
- Manter action de importacao por URL para dados legados.
- Garantir conversoes (thumb/web) para imagens criticas.
- Verificar storage link e permissao de escrita em producao.

## Checklist recomendado (priorizado)
### Prioridade alta
- Corrigir labels/encoding no Forum (admin e front).
- Incluir grupo `Forum` na navegacao do painel.
- Adicionar atribuicao de moderador e SLA nas denuncias.
- Criar calendario de eventos no admin.
- Garantir auditoria nas acoes de moderacao (denuncias e forum).

### Prioridade media
- Acoes rapidas e bulk actions para status de denuncias e moderacao.
- Melhorar filtros e ordenacoes (denuncias, forum, eventos).
- Exibir KPIs no dashboard de moderacao com cache curto.
- Adicionar preview de mapa nas denuncias.

### Prioridade baixa
- Refino visual de labels, helpers e placeholders.
- Melhorias de layout em formul?rios muito longos.
- Padronizar cores e badges em todos os recursos.

## Arquivos chave para referencia
- `apps/api/routes/api.php`
- `apps/api/app/Filament/Admin/Resources`
- `apps/api/app/Filament/Admin/Pages`
- `apps/api/app/Filament/Admin/Widgets`
- `apps/api/app/Providers/Filament/AdminPanelProvider.php`
