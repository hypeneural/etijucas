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
- [ ] Adicionar politicas/roles para admin/moderator:
  - [ ] admin: CRUD completo.
  - [ ] moderator: moderacao de comentarios e leitura de votacoes.
- [x] Resource de comentarios (Votacao): filtrar `commentable_type = Votacao`.

## Prioridade Media (UX/UI e fluxo operacional)
- [ ] Padrao de UX no form de votação:
  - [ ] Sections separadas: Identificacao, Descricao, Sessao, Resultado, Midia/Links.
  - [ ] `tags` com `TagsInput` e helper text.
  - [ ] `status` com badges e cores.
- [ ] VotoRegistro RelationManager:
  - [ ] default sort por vereador (nome) e voto.
  - [ ] filtros rapidos por tipo de voto.
  - [ ] actions em lote (ex: marcar como NAO_VOTOU).
- [ ] ViewAction com resumo (counts, resultado, total votos).
- [ ] Botao rapido "Recalcular Votos" na votacao (Action).

## Prioridade Media (comentarios / moderacao)
- [ ] `VotacaoCommentResource`:
  - [ ] listagem com usuario, texto, likes, is_anon, created_at.
  - [ ] filtros por `has_image`, `is_anon`, `likes_count`.
  - [ ] actions: remover, ocultar (soft delete), resetar likes.
- [ ] Se usar `Comment` global, criar scope `votacao()` no model para facilitar.

## Prioridade Baixa (estatisticas e dashboards)
- [x] Widget KPI de votacoes:
  - [x] total votacoes, aprovadas, rejeitadas, em andamento.
  - [ ] grafico por ano.
- [ ] Widget de engajamento:
  - [ ] likes, dislikes, comments.

## Verificacao e Qualidade
- [ ] Validar permissoes em todos os Resources (admin/moderator).
- [ ] Testar fluxo completo:
  - [ ] criar vereador com foto.
  - [ ] criar votacao + registrar votos.
  - [ ] validar contadores e status automatico.
  - [ ] criar/moderar comentario de votacao.
- [ ] Performance:
  - [ ] `with/withCount` nos Resources.
  - [ ] indices para filtros (status, data, vereador_id).
