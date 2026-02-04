# Task - Admin (Filament) Votacoes / Vereadores

## Prioridade Alta (fundacao e CRUDs essenciais)
- [x] Criar `VereadorResource` (Filament) com campos principais e validacoes.
- [x] Implementar upload de foto do vereador via Media Library:
  - [x] `Vereador` implementar `HasMedia` + collection `vereador_avatar`.
  - [x] Form com `SpatieMediaLibraryFileUpload`.
  - [x] Sync `foto_url` para compatibilidade (legado).
- [x] Criar `VotacaoResource` com form completo (titulo, subtitulo, descricao, ementa, tipo, status, data, sessao, links, tags).
- [x] Criar `VotoRegistro` RelationManager dentro de `VotacaoResource`:
  - [x] selecionar `vereador_id` (searchable/preload).
  - [x] `voto` (SIM/NAO/ABSTENCAO/NAO_VOTOU), `justificativa`, `url_video`.
  - [x] ao salvar/deletar, garantir `recalcularVotos()`.
- [x] Adicionar politicas/roles para admin/moderator:
  - [x] admin: CRUD completo.
  - [x] moderator: moderacao de comentarios e leitura de votacoes.
  - [x] widgets de votacoes liberados para moderator (via permissions).
- [x] Resource de comentarios (Votacao): filtrar `commentable_type = Votacao`.

## Prioridade Media (UX/UI e fluxo operacional)
- [x] Padrao de UX no form de votação:
  - [x] Sections separadas: Identificacao, Descricao, Sessao, Resultado, Midia/Links.
  - [x] `tags` com `TagsInput` e helper text.
  - [x] `status` com badges e cores.
- [x] VotoRegistro RelationManager:
  - [x] default sort por vereador (nome).
  - [x] filtros rapidos por tipo de voto.
  - [x] actions em lote (ex: marcar como NAO_VOTOU).
- [x] ViewAction com resumo (counts, resultado, total votos).
- [x] Botao rapido "Recalcular Votos" na votacao (Action).
- [x] Filtro por ano em `VotacaoResource` (data).
- [x] Filtros por partido/legislatura/em exercicio em `VereadorResource` + sort padrao por nome.
- [x] Mostrar avatar no grid de `VereadorResource`.
- [x] Mostrar `protocolo` na tabela de `VotacaoResource` (searchable).
- [x] Action para importar foto do vereador a partir de `foto_url` (Media Library).
- [x] Melhorar grid de `PartidoResource` com logo + cor (ColorColumn).
- [x] Bulk action para importar fotos de vereadores via URL (Media Library).

## Prioridade Media (cadastros auxiliares)
- [x] Criar `PartidoResource` (sigla, nome, cor, logo).
- [x] Criar `LegislaturaResource` (numero, periodo, atual).
- [x] Adicionar `MandatosRelationManager` em `VereadorResource` (partido, legislatura, cargo, periodo).
- [x] Criar policies e registrar no Gate para `Partido`, `Legislatura`, `Mandato`.

## Prioridade Media (comentarios / moderacao)
- [x] `VotacaoCommentResource`:
  - [x] listagem com usuario, texto, likes, is_anon, created_at.
  - [x] filtros por `has_image`, `is_anon`, `likes_count`.
  - [x] actions: remover, ocultar (soft delete), resetar likes.
  - [x] restore/force delete com ajuste de `comments_count`.
- [x] Se usar `Comment` global, criar scope `votacao()` no model para facilitar.

## Prioridade Baixa (estatisticas e dashboards)
- [x] Widget KPI de votacoes:
  - [x] total votacoes, aprovadas, rejeitadas, em andamento.
  - [x] grafico por ano.
- [x] Widget de engajamento:
  - [x] likes, dislikes, comments.

## Verificacao e Qualidade
- [x] Validar permissoes em todos os Resources (admin/moderator).
- [x] Rodar `php artisan db:seed --class=RolesAndPermissionsSeeder` (apos novos resources).
- [ ] Testar fluxo completo:
  - [ ] criar vereador com foto.
  - [x] criar votacao + registrar votos.
  - [x] validar contadores e status automatico.
  - [ ] criar/moderar comentario de votacao.
- [ ] Testar CRUD auxiliar:
  - [ ] criar partido e legislatura (admin).
  - [ ] adicionar mandato em vereador (relation manager).
- [x] Performance:
  - [x] `with/withCount` nos Resources.
  - [x] indices para filtros (status, data, vereador_id).
