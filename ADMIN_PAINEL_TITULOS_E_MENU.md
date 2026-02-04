# Admin - Titulos, Menu e Organizacao (Analise)

## Objetivo
Mapear paginas com titulo em ingles, corrigir problemas de encoding no menu e propor uma nova organizacao por dominio (Turismo, Eventos, Forum, etc.).

## 1) Paginas com titulo em ingles (corrigir titulo + descricao)
As paginas abaixo exibem titulo em ingles no topo. Sugestao: definir titulo PT-BR e uma descricao curta abaixo do titulo (subtitle/description) explicando o objetivo da pagina.

### Tabela de ajuste
| URL | Titulo atual | Titulo sugerido (PT-BR) | Descricao sugerida (uma linha) | Onde ajustar |
|---|---|---|---|---|
| `/admin/users` | Users | Usuarios | Gerencie contas, roles, restricoes e dados de acesso. | `apps/api/app/Filament/Admin/Resources/UserResource.php` (navigationLabel/modelLabel/pluralModelLabel) e `ListUsers` se precisar `getTitle()` |
| `/admin/moderation-queue` | Moderation Queue | Fila de Moderacao | Fila unica com denuncias, reports e flags pendentes. | `apps/api/app/Filament/Admin/Pages/ModerationQueue.php` (`protected static ?string $title`) |
| `/admin/content-flags` | Content Flags | Denuncias de Conteudo | Flags enviadas por usuarios sobre conteudos suspeitos. | `apps/api/app/Filament/Admin/Resources/ContentFlagResource.php` (modelLabel/pluralModelLabel) |
| `/admin/reports-dashboard` | Reports Dashboard | Dashboard de Denuncias | KPIs e acesso rapido as denuncias pendentes. | `apps/api/app/Filament/Admin/Pages/ReportsDashboard.php` (`protected static ?string $title`) |

### Observacoes
- Para Resources: use `protected static ?string $navigationLabel`, `modelLabel` e `pluralModelLabel` para forcar PT-BR.
- Para Pages: use `protected static ?string $title` (ou `getTitle()`) e opcionalmente `getHeading()`/`getSubheading()` para exibir descricao abaixo do titulo.

## 2) Itens do menu com erro de encoding (exemplos encontrados)
Abaixo estao itens exibindo acento quebrado (ex: `?`). Isso indica encoding errado ou strings sem acento.

### Itens com problema
- `Fila de Modera??o` (corrigir para **Fila de Moderação**)  
  Arquivo: `apps/api/app/Filament/Admin/Pages/ModerationQueue.php`
- `Coment?rios` / `Coment?rios (Votacoes)` (corrigir para **Comentários**)  
  Arquivos: `apps/api/app/Filament/Admin/Resources/CommentResource.php`, `apps/api/app/Filament/Admin/Resources/VotacaoCommentResource.php`
- `Problemas de Localiza??o` (corrigir para **Problemas de Localização**)  
  Arquivo: `apps/api/app/Filament/Admin/Pages/GeoIssues.php`
- `Restri??es` (corrigir para **Restrições**)  
  Arquivo: `apps/api/app/Filament/Admin/Resources/UserRestrictionResource.php`
- `Denuncias` (corrigir para **Denúncias**)  
  Arquivos: `apps/api/app/Filament/Admin/Resources/CitizenReportResource.php`, `apps/api/app/Filament/Admin/Resources/ContentFlagResource.php`
- `Dashboard de Denuncias` (corrigir para **Dashboard de Denúncias**)  
  Arquivo: `apps/api/app/Filament/Admin/Pages/ReportsDashboard.php`
- `Telefones Uteis` (corrigir para **Telefones Úteis**)  
  Arquivo: `apps/api/app/Filament/Admin/Resources/PhoneResource.php`
- Grupos do menu: `Acesso & Usuarios`, `Moderacao`, `Forum`, `Votacoes`, `Conteudo`  
  Corrigir para **Acesso & Usuários**, **Moderação**, **Fórum**, **Votações**, **Conteúdo**
  Arquivo: `apps/api/app/Providers/Filament/AdminPanelProvider.php`

### Recomendacao tecnica
- Garantir que os arquivos estejam em **UTF-8 sem BOM**.
- Evitar editores que salvem com BOM (impacta acentos e `declare(strict_types=1)` em PHP).

## 3) Proposta de agrupamento do menu por dominio
Hoje a navegacao esta muito ampla em `Conteudo`. Sugestao: separar por dominio funcional para melhorar o fluxo.

### Sugestao de grupos (novo)
1. **Acesso & Usuarios**
   - Usuarios
   - Restricoes (ou mover para Moderação se preferir)

2. **Moderação**
   - Fila de Moderação
   - Denuncias (cidadas)
   - Denuncias de Conteudo (Content Flags)
   - Categorias de Denuncia
   - Dashboard de Denuncias
   - Problemas de Localizacao

3. **Forum**
   - Topicos
   - Comentarios
   - Denuncias de Topicos
   - Denuncias de Comentarios

4. **Eventos**
   - Calendario de Eventos
   - Eventos
   - Categorias de Eventos
   - Locais
   - Organizadores
   - RSVPs (sugestao: **Confirmacoes**)
   - Tags (se forem de eventos)

5. **Turismo**
   - Turismo (pontos)
   - Reviews Turismo (sugestao: **Avaliacoes de Turismo**)

6. **Votacoes**
   - Votacoes
   - Vereadores
   - Partidos
   - Legislaturas
   - Comentarios (Votacoes)

7. **Sistema & Auditoria**
   - Auditoria (Activity Log)
   - Outros itens globais (se existirem)

## 4) Itens com titulo tecnico/abreviado (avaliar PT-BR)
- `RSVPs` -> Sugestao: **Confirmacoes (RSVP)**
- `Reviews Turismo` -> Sugestao: **Avaliacoes de Turismo**
- `Tags` -> Sugestao: **Tags de Eventos** (se for exclusivo de eventos)

## 5) Checklist de ajustes (resumido)
- Padronizar titulos das paginas listadas (Users, Moderation Queue, Content Flags, Reports Dashboard).
- Corrigir labels de navegacao com acento quebrado.
- Ajustar `navigationGroup` no `AdminPanelProvider` para refletir os novos grupos.
- (Opcional) Adicionar `getSubheading()` nas paginas para mostrar a descricao breve abaixo do titulo.

