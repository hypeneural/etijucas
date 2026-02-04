# Votações (Vereadores, Votos e Comentários) - Mapa Completo

## Objetivo
Documentar de ponta a ponta o módulo de votações (vereadores, votações, votos, reações e comentários), para preparar a criação de CRUDs no Filament (admin), incluindo upload de foto do vereador, moderação de comentários e gestão de votos.

## Onde vive o domínio
- Backend (Laravel): `apps/api/app/Domains/Votes`
- Banco/Migrations: `apps/api/database/migrations/2026_02_04_*`
- Rotas públicas/autenticadas: `apps/api/routes/api.php`
- Frontend (PWA React): `apps/web/src/*` (types, pages, components, services)

## Estrutura de dados (tabelas)

### `vereadores`
Arquivo: `apps/api/database/migrations/2026_02_04_000003_create_vereadores_table.php`
Campos principais:
- `id` (uuid)
- `nome`, `slug`
- `nascimento`, `cpf`, `telefone`, `email`
- `foto_url` (URL da foto)
- `bio`
- `redes_sociais` (json)
- `site_oficial_url`
- `ativo` (bool)
- `softDeletes` + `timestamps`

### `votacoes`
Arquivo: `apps/api/database/migrations/2026_02_04_000005_create_votacoes_table.php`
Campos principais:
- `id` (uuid)
- `protocolo`, `titulo`, `subtitulo`, `descricao`, `ementa`
- `tipo` (default `PROJETO_LEI`)
- `status` enum: `APROVADO`, `REJEITADO`, `EM_ANDAMENTO`, `ARQUIVADO`
- `data`, `sessao`
- contadores: `votos_sim`, `votos_nao`, `votos_abstencao`, `votos_ausente`
- links: `url_fonte`, `url_documento`
- `tags` (json)
- índices por `data`, `status`, `tipo`

### `votos_registro`
Arquivo: `apps/api/database/migrations/2026_02_04_000006_create_votos_registro_table.php`
Campos principais:
- `votacao_id` (FK)
- `vereador_id` (FK)
- `voto` enum: `SIM`, `NAO`, `ABSTENCAO`, `NAO_VOTOU`
- `justificativa`, `url_video`
- `unique(votacao_id, vereador_id)`

### `votacao_reactions`
Arquivo: `apps/api/database/migrations/2026_02_04_100800_create_votacao_reactions_table.php`
Campos principais:
- `votacao_id` (FK)
- `user_id` (FK)
- `reaction` enum: `like`, `dislike`
- `unique(votacao_id, user_id)`

A migration também adiciona em `votacoes`:
- `likes_count`, `dislikes_count`, `comments_count`

## Modelos e relacionamentos

### `Vereador`
Arquivo: `apps/api/app/Domains/Votes/Models/Vereador.php`
- Relacionamentos:
  - `mandatos()`
  - `mandatoAtual()` (com `partido` e `legislatura`)
  - `votos()`
- Scopes:
  - `ativos()`, `emExercicio()`, `byPartido()`
- Accessors:
  - `partidoAtual`, `cargoAtual`, `idade`
- Estatísticas:
  - `estatisticas` calcula totais de votos (sim/nao/abstencao/ausencias) e presença
- Slug automático no `creating`

### `Votacao`
Arquivo: `apps/api/app/Domains/Votes/Models/Votacao.php`
- Relacionamentos:
  - `votos()` (VotoRegistro)
  - `comments()` (morphMany em `Comment`)
  - `reactions()` (VotacaoReaction)
- Scopes: `aprovados`, `rejeitados`, `doAno`, `doTipo`
- Accessors:
  - `total_votos`
  - `resultado` (`approved` ou `rejected`)
- Método crítico:
  - `recalcularVotos()` recalcula contadores e ajusta status com base nos votos

### `VotoRegistro`
Arquivo: `apps/api/app/Domains/Votes/Models/VotoRegistro.php`
- Relaciona `votacao` e `vereador`
- Boot: ao salvar ou deletar, chama `votacao->recalcularVotos()`

### `VotacaoReaction`
Arquivo: `apps/api/app/Domains/Votes/Models/VotacaoReaction.php`
- Relação `votacao` e `user`
- Helpers `isLike()` / `isDislike()`

## Endpoints (API)
Arquivo: `apps/api/routes/api.php`

### Vereadores (publico)
- `GET /api/v1/vereadores` -> lista (filtros: `partido`, `search`, `legislatura_atual`)
- `GET /api/v1/vereadores/{slug}` -> detalhe
- `GET /api/v1/vereadores/{slug}/votacoes` -> histórico do vereador com voto

Controller: `apps/api/app/Domains/Votes/Http/Controllers/VereadorController.php`

### Votações (publico)
- `GET /api/v1/votacoes` -> lista com filtros: `status`, `ano`, `tipo`, `search`, `vereador`, `partido`
- `GET /api/v1/votacoes/{votacao}` -> detalhes + votos
- `GET /api/v1/votacoes/stats` -> estatísticas gerais
- `GET /api/v1/votacoes/anos` -> anos disponíveis

Controller: `apps/api/app/Domains/Votes/Http/Controllers/VotacaoController.php`

### Comentários de votação
- `GET /api/v1/votacoes/{votacao}/comments` (publico)
- `POST /api/v1/votacoes/{votacao}/comments` (auth)
- `POST /api/v1/votacoes/{votacao}/comments/{comment}/like` (auth)
- `DELETE /api/v1/votacoes/{votacao}/comments/{comment}` (auth, dono/admin)

Controller: `apps/api/app/Domains/Votes/Http/Controllers/VotacaoCommentController.php`

### Reações (like/dislike na votação)
- `POST /api/v1/votacoes/{votacao}/reaction` (auth)

Controller: `apps/api/app/Domains/Votes/Http/Controllers/VotacaoReactionController.php`

## Recursos (API Resources)

### `VotacaoListResource`
Arquivo: `apps/api/app/Domains/Votes/Http/Resources/VotacaoListResource.php`
Retorna para listagem:
- dados base + contadores (`counts`, `likesCount`, `dislikesCount`, `commentsCount`)
- `userReaction` quando autenticado

### `VotacaoResource`
Arquivo: `apps/api/app/Domains/Votes/Http/Resources/VotacaoResource.php`
Retorna detalhe completo:
- dados completos + `votos` (VotoRegistroResource)
- `counts`, `totalVotos`, `resultado`
- `userReaction`

### `VereadorListResource`
Arquivo: `apps/api/app/Domains/Votes/Http/Resources/VereadorListResource.php`
- `fotoUrl`, `partido`, `cargo`, `emExercicio`

### `VereadorResource`
Arquivo: `apps/api/app/Domains/Votes/Http/Resources/VereadorResource.php`
- detalhe completo + `mandatoAtual`, `mandatos`, `estatisticas`

## Comentários (votação)
- Comentários são `Comment` polimórficos (`commentable_type` = Votacao)
- `VotacaoCommentController` suporta:
  - threads (parentId, depth, max depth)
  - `isAnon`
  - `imageUrl` (URL no payload)
- Ao criar/remover comentário: incrementa/decrementa `comments_count` em `votacoes`

Front (PWA): `apps/web/src/components/votes/VotacaoComments.tsx`
- Usa `CommentList` e `CommentComposer` (mesmo padrão do fórum)
- Gate de login
- Toasts de sucesso/erro

## Reações (like/dislike em votação)
- `VotacaoReactionController` mantém `likes_count` e `dislikes_count` atualizados
- 1 reação por usuário por votação (unique)
- No frontend: `votacoesService.toggleReaction` -> `VoteListCard` e `VoteDetailPage`

## Seed de dados
Arquivo: `apps/api/database/seeders/VotesSeeder.php`
- Cria vereadores com `foto_url`, `bio`, `redes_sociais`, `site_oficial_url`
- Cria votações com `votos` (e recalcula contadores)

## Frontend (referências)

### Types
Arquivo: `apps/web/src/types/votes.ts`
- Define `VereadorList`, `VereadorFull`, `VotacaoList`, `VotacaoFull`, `VotoRegistro`, `VotacoesStats`
- Observação: há strings quebradas (ex: `VotaÃ§Ãµes`, `NÃ£o`). Isso é encoding no arquivo.

### Services
Arquivo: `apps/web/src/services/votes.service.ts`
- `vereadoresService`: listagem, detalhe, votações por vereador
- `votacoesService`: listagem, detalhe, stats, anos, reações

### Pages
- `/votacoes` -> `VotesListPage`
- `/votacoes/:id` -> `VoteDetailPage`
- `/vereadores` -> `VereadoresListPage`
- `/vereadores/:slug` -> `VereadorDetailPage`

## Pontos críticos para o Admin (Filament)

### CRUDs necessários
- `Vereador` (com upload de foto)
- `Votacao`
- `VotoRegistro` (relacionado a votação e vereador)
- `VotacaoReaction` (apenas leitura ou moderação?)
- Comentários (`Comment` com `commentable_type = Votacao`)

### Upload de foto do vereador
- Hoje usa `foto_url` (string). Recomendado migrar para Media Library
- Estratégia sugerida:
  - `Vereador` implementa `HasMedia` e coleção `vereador_avatar`
  - Form Filament: `SpatieMediaLibraryFileUpload`
  - Sync de `foto_url` para compatibilidade (legado)

### Moderação de comentários
- Comentários de votação usam o mesmo model `Comment` do fórum
- Criar Resource/RelationManager:
  - `VotacaoCommentResource` filtrando `commentable_type = Votacao`
  - Ações: ocultar/deletar, resetar likes, marcar como spam

### Gestão de votos
- `VotoRegistro` atualiza automaticamente contadores ao salvar/deletar
- Admin deve controlar:
  - voto do vereador
  - justificativa
  - URL de vídeo

### Consistência (API x Admin)
- Regras de negócio devem ficar em Actions/Services do domínio (ex: recalcular votos, atualizar status)
- Filament chama Actions/Services (não duplicar lógica)

## Checklist para Filament (quando for iniciar)
- [ ] Criar `VereadorResource` com upload de foto via Media Library + sync `foto_url`
- [ ] Criar `VotacaoResource` com RelationManager de `VotoRegistro`
- [ ] Criar Resource para moderação de `Comment` (tipo Votacao)
- [ ] Criar páginas de KPIs: total votações, aprovação, engajamento
- [ ] Ajustar policies e roles (admin/moderator)
- [ ] Normalizar encoding PT-BR nos arquivos de votes (front/back)

## Observações de encoding PT-BR
Há vários textos com caracteres quebrados (`TÃ³pico`, `ComentÃ¡rio`, etc.).
Isso está presente em:
- `apps/api/app/Domains/Votes/Http/Controllers/VotacaoCommentController.php`
- `apps/api/app/Domains/Votes/Http/Controllers/VotacaoReactionController.php`
- `apps/api/app/Domains/Votes/Http/Resources/VereadorResource.php`
- `apps/web/src/types/votes.ts`
- `apps/web/src/components/votes/VotacaoComments.tsx`

Recomendação: padronizar encoding UTF-8 e corrigir strings.
