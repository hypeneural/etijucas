**Denuncias - Analise e Melhorias**
Documento com analise da estrutura atual do modulo de denuncias e sugestoes de melhoria focadas em UX, mapa e camera, alinhadas a stack atual.

**Fonte (arquivos revisados)**
- Frontend wizard: `apps/web/src/pages/ReportWizardPage.tsx`
- Etapas: `apps/web/src/components/report/StepCategory.tsx`, `apps/web/src/components/report/StepLocation.tsx`, `apps/web/src/components/report/StepCamera.tsx`, `apps/web/src/components/report/StepReview.tsx`
- Tipos: `apps/web/src/types/report.ts`
- Service: `apps/web/src/services/report.service.ts`
- API config: `apps/web/src/api/config.ts`
- Backend routes: `apps/api/routes/api.php`
- Controller reports: `apps/api/app/Domains/Reports/Http/Controllers/ReportController.php`
- Geocoding proxy: `apps/api/app/Domains/Geocoding/Http/Controllers/GeocodeController.php`
- Spec atual: `DENUNCIAS_SPEC.md`

**Resumo do que ja existe**
- Wizard em 4 passos: categoria, localizacao, fotos, revisao.
- Draft salvo em localStorage (sem persistir imagens).
- Upload via multipart com limite de 3 imagens no backend.
- Geocoding via backend proxy (Nominatim) com cache e throttle.
- Endpoints de reports completos: create, list public, list me, detail, media, status, stats.
- PWA com offline e fila (syncQueueDB) para envios sem rede.

**Pontos fortes**
- Flow guiado com CTA claro e progressao visivel.
- Tratamento de erros de camera e localizacao com mensagens orientadas.
- Geocode proxy evita expor chave no front e reduz custo.
- Backend ja suporta media, status e historico.

**Gaps e inconsistencias atuais**
- Mapa ainda e placeholder visual sem pino real e sem ajuste por zoom/pan.
- OpenAPI ainda aponta `GET /users/me/reports` enquanto front/back usam `/reports/me`.
- Front usa status `em_andamento` e `nao_procede` nas KPIs, mas backend retorna apenas `recebido`, `em_analise`, `resolvido`, `rejeitado`.
- Draft nao persiste imagens (imagens sao removidas ao salvar no localStorage).
- Geocode autocomplete nao usa bias de lat/lon no front (passa apenas query).
- Camera inicia automaticamente no mount, o que pode gerar negacao de permissao logo na abertura.

**1) Consistencia de dominio (bug "invisivel")**
1.1. Status unificados
- Conflito atual: front/KPIs usam `em_andamento` e `nao_procede`, backend nao.
- Definir enum oficial e aplicar em API, KPIs, front e docs.
- Status principal (minimo viavel): `recebido | em_analise | resolvido | rejeitado`.
- Substatus opcional: `em_andamento | aguardando | ...`.
- KPIs usam apenas status principal.

1.2. Paths alinhados
- OpenAPI precisa bater 100% com front/back.
- Padrao atual: `/api/v1/reports/me` (e nao `/users/me/reports`).
- Rodar teste simples que compara `apps/web/src/api/config.ts` com `contracts/openapi.yaml`.

**2) Mapa real (maior upgrade de UX)**
2.1. Pin draggable + click-to-move (Leaflet)
- Reverse geocode apenas em `dragend` e `click`.
- Debounce 300-500ms no reverse.
- Botao "Centralizar no GPS".
- Salvar no draft: `lat`, `lon`, `zoom`, `address_text`, `location_quality`, `address_source`.

2.2. Modo offline (fallback inteligente)
- Offline nao carrega tiles ou usa mapa estatico.
- Habilitar apenas endereco manual e GPS (se disponivel).
- Marcar `location_quality` = `manual` ou `aproximada` com texto claro.

**Mapa real com pino e zoom (detalhe tecnico)**
Opcoes de stack
- Leaflet + OpenStreetMap (sem chave, leve).
- Mapbox ou Google Maps (mais ricos, requer chave e billing).

Comportamento recomendado
- Mapa com pino draggable.
- Clique no mapa move o pino.
- `dragend` chama reverse geocode e atualiza endereco final.
- `zoomend` nao chama reverse; apenas mantem zoom salvo no draft.
- Botao "Centralizar" para voltar ao GPS.
- Ao selecionar autocomplete, chamar `map.flyTo(lat, lon, zoom)` e mover pino.
- Passar bias de lat/lon para autocomplete.

Implementacao sugerida (Leaflet)
- `MapContainer` com `TileLayer` OSM ou MapTiler.
- `Marker` com `draggable=true`.
- `useMapEvents` para `click` e `moveend`.
- Debounce de reverse geocode (300-500ms) apenas em `dragend`/`click`.

**3) Drafts + imagens (PWA real)**
3.1. Migrar draft para IndexedDB com Blob
- Guardar: `draft_id`, `step`, campos do form, `images: Blob[]`, `created_at`, `updated_at`.
- Manter uma Outbox para envios pendentes.

3.2. Outbox com estados formais
- Estados: `draft -> queued -> sending -> sent -> failed`.
- Campos: `last_error`, `retry_at`, `attempts`.

**4) Camera (reduzir desistencias)**
4.1. Nao iniciar camera automaticamente
- Mostrar preview estatico e botao "Ativar camera".
- Se erro, fallback imediato para file input.

4.2. Camera-first com fallback universal
- Mobile: `input accept="image/*" capture="environment"` como opcao rapida.
- Desktop: upload padrao.
- `NotAllowedError`: tutorial curto para liberar permissao.
- `NotReadableError`: orientar fechar outros apps.
- `NotFoundError`: detectar falta de camera e sugerir galeria.

Prevencao do NotFoundError
- Detectar `window.isSecureContext` e avisar se nao for HTTPS.
- Antes de abrir camera, usar `enumerateDevices()` e verificar `videoinput`.
- Em emulador, mostrar dica: "Ative camera virtual no emulador".

**5) Geocoding (qualidade sem custo extra)**
5.1. Autocomplete com bias de lat/lon
- Enviar lat/lon quando existir.
- Priorizar sugestoes proximas.

5.2. Cache e circuit breaker
- Cache por query + lat/lon arredondado (5-30 min).
- Throttle por IP/usuario.
- Se Nominatim falhar, manter `address_text` manual e nao bloquear envio.

**6) API publica (privacidade e abuso)**
6.1. Payload publico
- Nao retornar `user_id` nem dados do autor.
- Evitar coordenadas com precisao se expor residencia for risco.
- Retornar `author_type: "anon"` ou nao retornar nada do autor.

6.2. Moderation state
- Incluir `is_public` ou `visibility: public|private`.
- Garantir que somente aprovados aparecem em `/reports` publico.

**7) Front (organizacao sem reescrever)**
7.1. Types sincronizados
- Gerar types de status a partir do OpenAPI ou manter enum unico no `@repo/shared`.

7.2. TanStack Query
- Padronizar chaves: `['reports','public',filters]`, `['reports','mine',filters]`, `['reports','detail',id]`, `['reports','stats']`.

**8) Pos-envio (engajamento)**
- "Acompanhar" abre detalhe com timeline.
- Notificacao in-app mesmo sem push.
- Botao "Adicionar informacao" no detalhe (nota/foto) com limites.

**Sugestoes de UX para tornar mais facil e viciante**
- Categoria com grid principal + "Ver todas" + recentes no topo.
- Localizacao com 3 cards fixos (GPS, Buscar, Mapa) sempre visiveis.
- Stepper sempre visivel e micro-feedbacks: "Localizacao atualizada", "Salvo automaticamente".
- Revisao final com botao "Editar" por secao.
- Tela de sucesso com protocolo curto e botao copiar.
- "Minhas denuncias" com chips de status e categoria, e alertas de pendencias offline.
- Detalhe com timeline simples e botao "Adicionar informacao".

**Ajustes tecnicos prioritarios**
- Unificar status e atualizar KPIs e docs.
- Alinhar OpenAPI para `/reports/me`.
- Persistir rascunho no IndexedDB (incluindo imagens como Blob).
- Passar lat/lon no autocomplete para melhorar sugestoes.
- Adicionar mapa real no `StepLocation`.
- Implementar outbox com estados formais.

**Prioridade recomendada (ordem)**
1. Unificar status + corrigir OpenAPI paths.
2. Mapa real com pin + reverse em `dragend`/`click`.
3. Draft + imagens no IndexedDB + Outbox.
4. Camera nao automatica + fallback robusto.
5. Autocomplete com bias + melhorias do proxy.
6. Ajustes de privacidade e visibilidade publica.

**Mudancas rapidas (1-2 dias)**
- Parar de abrir camera no mount + fallback.
- Pin draggable com reverse somente no `dragend`.
- Ajustar enum de status e KPIs (front e doc).

**Checklist para producao (camera)**
- Rodar sempre em HTTPS (camera bloqueia HTTP).
- Validar permissao de camera e fallback para upload.
- Testar em Android, iOS e desktop.
- Testar em emuladores com camera virtual ativa.
