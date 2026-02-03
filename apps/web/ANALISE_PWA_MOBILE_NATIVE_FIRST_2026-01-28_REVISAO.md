# Analise Tecnica — PWA / Mobile-First / Offline-First / Native-First (2026-01-28)

## Escopo analisado
- PWA/Service Worker: `vite.config.ts`, `public/manifest.json`, `public/offline.html`, `src/main.tsx`, `src/sw-background-sync.ts`
- Entrada e roteamento: `index.html`, `src/App.tsx`, `src/components/layout/AppShell.tsx`
- Rede e cache: `src/api/client.ts`, `src/api/config.ts`
- Offline e sync: `src/lib/localDatabase.ts`, `src/hooks/useOnlineSync.ts`, `src/hooks/useNetworkStatus.ts`, `src/store/useAppStore.ts`, `src/store/useSyncStore.ts`
- Persistencia de cache: `src/lib/queryPersister.ts`
- UI/UX mobile: `src/index.css`, `src/hooks/useKeyboardAvoidance.ts`, `src/hooks/useThemeColor.ts`
- Telas principais: `src/screens/*`, `src/pages/*`, `src/components/*`

## Estrutura atual (visao geral)
- Stack: Vite + React + TS (SWC), React Router, Zustand, React Query, Tailwind, framer-motion.
- PWA: `vite-plugin-pwa` com Workbox (precache + runtime caching).
- Telas: tabs principais em `src/screens/*` (lazy via `AppShell`), rotas extras em `src/pages/*` (import direto em `App.tsx`).
- Dados: existem 2 camadas paralelas
  - UI usa `useAppStore` (Zustand + localStorage) com dados mock e estado otimista.
  - Services + React Query + IndexedDB existem, mas parecem nao estar ligados as telas.
- Offline: ha cache de assets e API via SW, alem de `localDatabase` (IndexedDB) e fila de sync.

## Pontos fortes
- `AppShell` ja faz code-splitting das tabs (boa base para performance).
- `useNetworkStatus` + `OfflineIndicator` melhoram percepcao de offline/2G.
- `useKeyboardAvoidance` e `useThemeColor` ajudam no mobile/native feel.
- Workbox com cache de imagens e fontes configurado.
- Persistencia de cache do React Query (estrutura pronta).

## Gaps e riscos (prioridade alta)

### P0 — Camadas de dados duplicadas e desconectadas
**Impacto:** offline-first inconsistente, dados divergentes, mais bugs.
- UI usa `useAppStore` e mock data (`src/store/useAppStore.ts`, `src/data/mockData`).
- Services/React Query/IndexedDB existem mas nao sao usados pelas telas (`src/hooks/queries/*`).

**Melhoria:** escolher uma unica fonte de verdade (ex: React Query + IndexedDB) e ligar as telas a ela.

### P0 — Background Sync praticamente nao funciona
**Impacto:** mutacoes offline nao sincronizam via SW.
- `vite.config.ts` usa `runtimeCaching` com `NetworkOnly` + `backgroundSync`, mas o metodo default do Workbox e `GET`.
- `src/sw-background-sync.ts` existe, porem nao e injetado no SW.

**Melhoria:** definir `method` para POST/PUT/DELETE/PATCH ou migrar para `injectManifest` e importar `sw-background-sync.ts`.

### P0 — Fila offline manual usa URL errada e sem auth
**Impacto:** sync falha quando voltar online.
- `useOnlineSync` faz `fetch(ENDPOINTS.*)` sem aplicar `API_CONFIG.baseURL` e sem token.

**Melhoria:** reutilizar `apiClient` ou montar URL completa + Authorization.

### P0 — Persistencia pesada em localStorage
**Impacto:** jank em celulares fracos, limite baixo de armazenamento.
- `useAppStore` persiste arrays grandes em localStorage (sync). Imagens sao removidas no `partialize`.

**Melhoria:** mover persistencia para IndexedDB (async) e salvar imagens via `useOfflineImage`.

### P0 — Encoding quebrado em UI/manifest
**Impacto:** baixa confianca e PWA com textos corrompidos.
- Exemplo em `index.html`, `public/manifest.json`, `public/offline.html`, varios componentes.

**Melhoria:** regravar arquivos em UTF-8 consistente e revisar strings.

## Gaps e riscos (prioridade media)

### P1 — Query keys inconsistentes (React Query)
**Impacto:** crash/bugs se os hooks forem usados.
- `QUERY_KEYS` mudou para objeto, mas hooks usam `...QUERY_KEYS.topics` como se fosse array (`src/hooks/queries/*`).

**Melhoria:** alinhar keys ou remover hooks nao usados.

### P1 — `apiClient` gera preflight em GET
**Impacto:** latencia extra em rede lenta.
- `Content-Type: application/json` e setado em todas as requests, inclusive GET.

**Melhoria:** setar `Content-Type` apenas quando houver body.

### P1 — PWA shortcuts nao mudam tab
**Impacto:** atalhos do manifest abrem sempre Home.
- `public/manifest.json` usa `/?tab=reportar`, mas `AppShell` nao le query param.

**Melhoria:** ler `tab` da URL e sincronizar com `useAppStore`.

### P1 — Roteamento sem lazy nas paginas extras
**Impacto:** bundle inicial maior.
- `App.tsx` importa `MassesPage`, `LoginPage`, etc direto.

**Melhoria:** `React.lazy` + `Suspense` nas rotas secundarias.

### P1 — Assets pesados (TTF)
**Impacto:** download maior em 3G/2G.
- Fontes em `public/fonts/*.ttf`.

**Melhoria:** gerar WOFF2, preload apenas pesos essenciais.

## Melhorias recomendadas (por tema)

### 1) PWA e Service Worker
- Corrigir background sync (definir `method` no Workbox ou usar `injectManifest`).
- Habilitar `navigationPreload` e `cleanupOutdatedCaches`.
- Decidir fallback: manter `index.html` (app shell) e mostrar offline state interno, ou usar `offline.html` como fallback real.
- Ajustar `registerSW` para UI nao bloqueante (toast em vez de `confirm`).

### 2) Offline-first real (dados e sync)
- Unificar dados em React Query + IndexedDB (ou Zustand + IDB). Evitar dupla fonte de verdade.
- Usar `localDatabase` para reports/topics/comments e ligar as telas.
- Integrar `useOfflineImage` + `imageCompression` no fluxo de report.
- Definir idempotency key sem `Date.now()` para permitir dedupe real.

### 3) Mobile-first performance
- Lazy load das paginas secundarias e componentes pesados.
- Virtualizar listas grandes (reports, topics) para reduzir custo de render.
- Reduzir blur/animacoes quando `saveData` ou `prefers-reduced-motion`.
- Evitar preflight em GET (reduz latencia em redes ruins).

### 4) Native-first (sensacao de app)
- Haptics em acoes chave (favoritar, publicar, enviar).
- Ajustes de safe-area e status bar em modo standalone.
- Revisar `viewport` (`user-scalable=no`) por acessibilidade.

### 5) Qualidade e confianca
- Corrigir encoding (UTF-8) nos arquivos base.
- Alinhar `QUERY_KEYS` e remover codigo morto (hooks/services nao usados).
- Garantir que manifest e atalhos reflitam comportamento real.

## Quick wins (baixo custo, alto impacto)
1) Corrigir encoding em `index.html`, `public/manifest.json`, `public/offline.html`.
2) Fix do background sync (metodos POST/PUT/DELETE/PATCH) + remover `sw-background-sync.ts` se nao usado.
3) Corrigir URL base e auth na fila de sync.
4) Lazy load das paginas extras em `App.tsx`.
5) Migrar fontes para WOFF2.

## Checklists de validacao
- Offline total: abrir app, navegar tabs, ver dados locais sem travar.
- Criar report/topic offline, fechar/reabrir app, dados persistem.
- Voltar online: fila sincroniza sem duplicar.
- Em Slow 3G: scroll fluido e TTI aceitavel.
- PWA instalado: atalhos abrem na tab correta.

## Sugestao de fases
- Fase 1: encoding + SW sync + lazy routes + WOFF2.
- Fase 2: unificar camada de dados + IDB + offline images.
- Fase 3: performance profunda (virtualizacao, reducao de animacoes, prefetch inteligente).
