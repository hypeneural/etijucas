# Checklist - Admin (Filament)

## Prioridade Alta (fundacao e consistencia)
- [ ] Centralizar regras de negocio em `app/Domains/*/Actions` ou `Services` e usar as mesmas Actions no Filament e na API.
- [ ] Remover logica duplicada entre Controllers e Resources (migrar `mutateFormData` e Actions para Services).
- [x] Padronizar acoes de moderacao com helpers reutilizaveis (ex: `ModerationActionService`).
- [x] Migrar `Topic` para upload via Media Library (form + sync de `foto_url`).
- [x] Migrar `Organizer` para upload via Media Library (avatar).
- [x] Migrar `TourismSpot` para upload via Media Library (cover + gallery).
- [x] Migrar `Event` para upload via Media Library (cover + banner + gallery).

## Prioridade Media (padroes de UI e organizacao)
- [ ] Padronizar `form()` e `table()` usando `BaseResource` e Traits onde ainda houver inconsistencias.
- [ ] Revisar e unificar labels PT-BR em Resources/Pages/Widgets (sem mistura EN/PT).
- [ ] Revisar queries de pages customizadas para `with/withCount` e filtros alinhados a indices.
- [x] Ajustar `media_count` de eventos para refletir Media Library (com legado).

## Prioridade Media (performance e confiabilidade)
- [ ] Aplicar `getEloquentQuery()` com `with/withCount` em todos os Resources (auditar N+1).
- [ ] Garantir indices para filtros comuns (status, created_at, category_id, bairro_id).
- [ ] Usar `->deferLoading()` em tabelas pesadas quando fizer sentido.
- [ ] Cache curto (30-120s) para widgets de KPI.

## Prioridade Baixa (evolucao do admin)
- [ ] Criar pagina de configuracoes do sistema se existirem parametros globais.
- [ ] Criar widgets operacionais por dominio (KPIs de moderacao, eventos, turismo).

## Alinhamento API x Admin (acoes compartilhadas)
- [ ] Definir Actions por dominio (Events, Moderation, Reports) e usar em Controllers + Filament.
- [ ] Documentar o fluxo de cada Action no admin (entrada/saida/efeitos colaterais).

## Upload de imagens (migracao gradual)
- [ ] Definir colecoes Media Library por dominio: Events (`event_cover`, `event_banner`, `event_gallery`), Tourism (`tourism_cover`, `tourism_gallery`), Organizer (`organizer_avatar`), Topic (`topic_image`).
- [ ] Substituir campos `*_url` por `SpatieMediaLibraryFileUpload` via `HasMediaLibraryTrait`.
- [ ] Criar Action "Importar da URL" usando `addMediaFromUrl` para dados legados.
- [ ] Remover campos `*_url` depois da migracao e atualizar frontend/Resources.

## Verificacao e Qualidade
- [ ] Testar `ModerationQueue` com dados reais e links corretos.
- [ ] Testes de moderacao (forum) e publicacao de eventos.
- [ ] Verificar performance com dados volumosos (N+1, indices, pagination).
