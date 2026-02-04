# Admin (Filament) - Analise Completa e Plano de Otimizacao

Ultima atualizacao: 2026-02-04

## Resumo executivo
O admin ja opera em cima de Models + Policies e nao consome a API. A base esta solida (Shield + Policies + BaseResource + Actions de moderacao), e o foco agora deve ser: padronizar regras de negocio via Actions/Services, melhorar upload de midia (substituir URLs por Media Library), e garantir performance/qualidade em telas com volume.

## O que ja foi feito
- Painel Filament configurado com `admin` e Shield ativo. `apps/api/app/Providers/Filament/AdminPanelProvider.php`
- Policies unificadas em `apps/api/app/Policies` e registradas no Gate. `apps/api/app/Providers/AppServiceProvider.php`
- Roles consolidadas: `admin`, `moderator`, `user` com permissao por resource/page/widget. `apps/api/database/seeders/RolesAndPermissionsSeeder.php`
- `BaseResource` com defaults de sort, colunas padrao, filtros e eager load. `apps/api/app/Filament/Admin/Resources/BaseResource.php`
- Traits reutilizaveis: `HasAuditActionsTrait`, `HasStatusBadgeTrait`, `HasMediaLibraryTrait`.
- `make:admin-crud` gerando Resource + Policy + Shield com `--panel=admin`. `apps/api/app/Console/Commands/MakeAdminCrud.php`
- Moderacao: Actions com audit log em TopicReport, CommentReport e ContentFlag.
- Paginas operacionais: `ModerationQueue`, `ReportsDashboard`, `GeoIssues`.
- Ajustes de acesso para pages/widgets com `canAccess` e `canView`.
- Correcoes recentes:
  - `ContentFlagResource` tabs corrigidos para `Filament\Resources\Pages\ListRecords\Tab`.
  - `ModerationQueue` usa Eloquent Builder via model virtual `ModerationQueueItem`.

## Estado atual do admin
- Recursos (CRUDs) principais cobertos: usuarios, moderacao, eventos, turismo, denuncias cidadas, telefonia, bairros, etc.
- Filas e dashboards de moderacao ja existem e centralizam operacao.
- Acoes sensiveis ja registram audit log.
- Base de permissao com Shield esta funcionando e roles estao centralizadas.

## Pontos de melhoria (otimizacao e organizacao)
### Prioridade alta
- Centralizar regras de negocio em `app/Domains/*/Actions` ou `Services` e chamar essas Actions no Filament.
- Remover logica duplicada entre Controllers e Resources (mutateFormData e Actions).
- Padronizar acao de moderacao com helpers (ex: `ModerationActionService`).
- Substituir uploads por URL com Media Library (ver plano abaixo).

### Prioridade media
- Padronizar form/table defaults via `BaseResource` e Traits nos Resources ainda inconsistentes.
- Reforcar consistencia de labels PT-BR (evitar misto EN/PT).
- Revisar pages customizadas para filtros mais otimizados (indices e `with/withCount`).

### Prioridade baixa
- Criar pagina de configuracoes do sistema se houver parametros globais.
- Adicionar widgets de operacao (KPIs por dominio) com cache de curto prazo.

## Alinhamento API x Admin
- A API e o contrato oficial (OpenAPI). O Admin usa o mesmo Model/Policy.
- Controllers da API devem validar request e chamar Actions/Services.
- Filament deve chamar as mesmas Actions/Services para garantir 1 regra de negocio.
- Resultado esperado: criacao de CRUD vira apenas “UI + chamadas de Action”.

## Upload de imagens (substituir URL por Media Library)
Hoje existem campos de URL em recursos como Eventos, Turismo, Organizadores, Topics. Isso aumenta erro humano e padronizacao fraca. Plano recomendado:

### 1) Padrao unico de midia
- Usar Spatie Media Library como fonte oficial de arquivos.
- Definir colecoes por dominio:
  - Events: `event_cover`, `event_banner`, `event_gallery`
  - Tourism: `tourism_cover`, `tourism_gallery`
  - Organizer: `organizer_avatar`
  - Topic: `topic_image`

### 2) Filament forms
- Substituir `TextInput::make('*_url')` por `SpatieMediaLibraryFileUpload` via `HasMediaLibraryTrait`.
- Habilitar preview, limite de tamanho e conversoes (thumb/web).
- Adicionar `maxFiles` e `acceptedFileTypes` por recurso.

### 3) Migracao gradual
- Manter campos `*_url` enquanto a migracao ocorre.
- Criar Action “Importar da URL” usando `addMediaFromUrl` para dados legados.
- Ao finalizar, remover os campos `*_url` e garantir acessos via media.

### 4) Beneficios
- Menos erro manual, controle central de storage, CDN futuro, thumb automatico e performance.

## Otimizacao de performance
- Todos os Resources devem usar `getEloquentQuery()` com `with/withCount`.
- Garantir indices para filtros comuns (status, created_at, category_id, bairro_id).
- Aplicar `->deferLoading()` em tabelas pesadas se necessario.
- Implementar cache curto em widgets de KPI (30-120s).

## Verificacoes pendentes
- Teste real do `ModerationQueue` com dados produtivos.
- Testes de moderacao (forum) e publicacao de eventos.
- Verificacao de N+1 com volume e ajuste de indices.

## Proximas acoes sugeridas (curto prazo)
- Migrar imagens de Event/Tourism/Organizer para Media Library.
- Criar Actions de negocio para eventos e moderacao e reutilizar no Filament.
- Executar testes de fluxo no painel (moderator e admin).
- Revisar performance e aplicar ajustes de query.

## Arquivos chave
- `apps/api/app/Providers/Filament/AdminPanelProvider.php`
- `apps/api/app/Filament/Admin/Resources/BaseResource.php`
- `apps/api/app/Filament/Admin/Resources/Concerns/HasMediaLibraryTrait.php`
- `apps/api/app/Console/Commands/MakeAdminCrud.php`
- `apps/api/app/Providers/AppServiceProvider.php`
