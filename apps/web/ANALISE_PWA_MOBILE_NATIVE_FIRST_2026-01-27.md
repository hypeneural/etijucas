# Analise PWA Mobile / Offline First / Native First (2026-01-27)

## Escopo analisado
- `vite.config.ts` (VitePWA + Workbox)
- `src/main.tsx` (registro do Service Worker)
- `src/App.tsx`, `src/lib/queryPersister.ts` (React Query persist)
- `src/api/client.ts` + `src/api/config.ts` (timeout/retry)
- `src/services/*.ts` (fallback offline)
- `src/store/useSyncStore.ts`, `src/hooks/useOnlineSync.ts` (fila offline)
- `src/hooks/useNetworkStatus.ts`, `src/components/ui/OfflineIndicator.tsx`
- `public/manifest.json`, `public/offline.html`, `index.html`, `src/index.css`

## Resumo executivo (o que mais impacta a experiencia offline e a fluidez)
1) **Offline real ainda perde dados criados pelo usuario**: `report.service.ts` e `topic.service.ts` usam memoria e reiniciam ao recarregar. Isso quebra a confianca em modo offline.
2) **Service Worker tem pontos inconsistentes**: `src/main.tsx` registra SW manualmente e o `vite-plugin-pwa` provavelmente injeta registro automatico; isso pode gerar comportamentos duplicados. `public/offline.html` existe, mas nao esta sendo usado como fallback.
3) **Tempo de espera alto em rede ruim**: `src/api/client.ts` tem timeout 10s + 3 tentativas. Em rede lenta/offline, o app fica "travado" antes de cair no fallback local.
4) **Encoding quebrado em strings**: `index.html`, `public/manifest.json`, `public/offline.html` e alguns componentes exibem `fÃ³rum`, `alteraÃ§Ã£o` etc. Isso afeta a percepcao de qualidade.

## Pontos criticos (impacto alto)

### 1) Persistencia local de dados (offline first real)
**Achado**
- `src/services/report.service.ts` e `src/services/topic.service.ts` usam arrays em memoria (`localReports`, `localTopics`). Ao recarregar, tudo some.

**Melhoria recomendada**
- Persistir esses dados em IndexedDB (pode reaproveitar `idb-keyval` ou criar um mini repositorio local).
- Integrar a fila de `useSyncStore` com esses dados locais, para manter consistencia entre UI e sincronizacao.

### 2) Fallback offline nao esta ativo
**Achado**
- `public/offline.html` existe e esta no `includeAssets`, mas `vite.config.ts` usa `navigateFallback: "index.html"`. Em falha de rede, o fallback offline nao aparece.

**Melhoria recomendada**
- Definir `navigateFallback` para `offline.html` (ou usar `navigateFallbackDenylist` para rotas de API) e garantir precache dessa pagina.
- Alternativa: manter SPA no `index.html`, mas adicionar fallback manual na camada de fetch para imagens e paginas criticas.

### 3) Registro duplicado de Service Worker
**Achado**
- `src/main.tsx` registra SW manualmente. `vite-plugin-pwa` com `registerType: "autoUpdate"` tende a injetar registro automatico.

**Melhoria recomendada**
- Centralizar o registro com `virtual:pwa-register` (do plugin) ou manter manual, mas desabilitar a injeção automatica. Isso evita conflitos em update, evento `onUpdate`, etc.

### 4) Background Sync parcial
**Achado**
- Em `vite.config.ts`, o `runtimeCaching` do Workbox configura Background Sync, mas a regra usa `method: "POST"` (logo PUT/DELETE/PATCH nao entram na fila) e o `urlPattern` tenta cobrir todos os metodos.
- `src/sw-background-sync.ts` existe, mas nao esta importado no SW do Workbox (ficou "orfao").

**Melhoria recomendada**
- Criar regras separadas por metodo (POST/PUT/DELETE/PATCH) ou remover o `method` e filtrar no `urlPattern`.
- Decidir entre `runtimeCaching` simples **ou** `sw-background-sync.ts` (com `injectManifest/importScripts`). Hoje esta duplicado e incompleto.

### 5) Timeouts/retry pesados em rede ruim
**Achado**
- `src/api/client.ts` usa timeout 10s e 3 tentativas. Em conexao 2G/offline, a UI fica esperando muito antes de cair no mock/local.

**Melhoria recomendada**
- Se `navigator.onLine === false`, pular fetch imediatamente e usar fallback local.
- Reduzir timeout em rede lenta (usar `useNetworkStatus` para ajustar). Ex: 3s/1 tentativa em 2G.

### 6) Encoding quebrado em textos
**Achado**
- `index.html`, `public/manifest.json`, `public/offline.html` e varios componentes exibem caracteres corrompidos (ex: `fÃ³rum`).

**Melhoria recomendada**
- Garantir UTF-8 real nesses arquivos (salvar corretamente). Isso tambem afeta Install UI do PWA e SEO.

## Melhorias recomendadas (priorizadas)

### A) PWA / Service Worker
1) **Ativar fallback offline dedicado**
   - Ajustar `navigateFallback` para `offline.html` ou adicionar `navigateFallbackAllowlist` e `offline.html` precache.
   - Arquivos: `vite.config.ts`, `public/offline.html`.

2) **Unificar registro do SW**
   - Usar `virtual:pwa-register` e remover registro manual ou desabilitar injection.
   - Arquivo: `src/main.tsx`.

3) **Background Sync correto e consistente**
   - Regras por metodo + `idempotency key` para evitar duplicacao.
   - Arquivos: `vite.config.ts`, `src/sw-background-sync.ts`, `src/store/useSyncStore.ts`.

4) **Navigation Preload**
   - Ativar `navigationPreload` para reduzir TTFB com SW ativo.
   - Arquivo: `vite.config.ts` (Workbox).

### B) Offline-first de verdade (dados e estado)
1) **Persistencia local dos dados mutaveis**
   - Migrar `localReports` e `localTopics` para IndexedDB.
   - Arquivos: `src/services/report.service.ts`, `src/services/topic.service.ts`.

2) **Fila offline com backoff e dedupe**
   - Implementar backoff exponencial e deduplicacao por endpoint+payload.
   - Registrar `idempotencyKey` no payload/cabecalho.
   - Arquivos: `src/store/useSyncStore.ts`, `src/hooks/useOnlineSync.ts`, `src/api/client.ts`.

3) **Persistencia do cache por mais tempo**
   - `PersistQueryClientProvider` esta em 24h; para dados de cidade (bairros, eventos), faz sentido 7d.
   - Arquivo: `src/App.tsx`.

### C) Performance em rede lenta / device fraco
1) **Timeout adaptativo**
   - Ajustar `API_CONFIG.timeout` com base em `useNetworkStatus`.
   - Arquivos: `src/api/client.ts`, `src/hooks/useNetworkStatus.ts`.

2) **Reducao de animacoes em 2G / saveData**
   - Quando `effectiveType` for `2g/slow-2g` ou `saveData`, desativar `backdrop-filter` e animacoes pesadas.
   - Arquivos: `src/index.css`, `src/components/*` (Framer Motion).

3) **Virtualizacao para listas longas**
   - `ReportScreen` e `ForumScreen` podem ficar pesados. Usar `react-window` ou `react-virtual`.
   - Arquivos: `src/screens/ReportScreen.tsx`, `src/screens/ForumScreen.tsx`.

4) **Imagens mais leves**
   - Trocar `.ttf` por `.woff2`, usar `.webp/.avif` nas imagens grandes.
   - Arquivos: `public/fonts/*`, `public/images/*`, `src/index.css`.

### D) Native-first (percepcao de app nativo)
1) **Haptics leves (opcional)**
   - `navigator.vibrate(10)` em favoritar, enviar, compartilhar.
   - Arquivos: `src/components/*` (cards, botoes).

2) **Status bar e display-mode**
   - Ajustar UI quando `display-mode: standalone` (ex.: esconder barra do navegador, aumentar paddings).
   - Arquivos: `src/hooks/useThemeColor.ts`, `src/index.css`.

3) **Icons e splash iOS mais completos**
   - Adicionar `apple-touch-icon` 180 e `apple-touch-startup-image`.
   - Arquivos: `index.html`, `public/`.

### E) Qualidade e confianca
1) **Corrigir encoding em todo o front**
   - Re-salvar arquivos HTML/JSON/TSX em UTF-8 e validar com `rg`.
   - Arquivos: `index.html`, `public/manifest.json`, `public/offline.html`, varios componentes.

2) **Logs e telemetria leves**
   - Logar tempo de sync e falhas para debug em campo (sem PII).
   - Arquivos: `src/hooks/useOnlineSync.ts`.

## Quick wins (baixo custo, alto impacto)
- Corrigir encoding quebrado em HTML/manifest/offline.
- Reduzir timeout/retry quando offline/2G.
- Ativar fallback real para offline (`offline.html`).
- Corrigir Background Sync para PUT/DELETE/PATCH.
- Migrar `localReports`/`localTopics` para IndexedDB.

## Checklist de validacao (rede ruim/offline)
- Primeira carga online -> offline -> recarga: app abre com dados locais.
- Criar report/topic offline, fechar app, reabrir: dados persistem.
- Voltar online: fila sincroniza sem duplicar.
- Em "Slow 3G": TTI < 3s, lista scrolla em 60fps.
- PWA instalado: sem barras do browser, sem flashes de reload, com splash iOS.

## Proposta de fases
**Fase 1 (1-2 dias)**
- Encoding + fallback offline + ajuste de SW.

**Fase 2 (3-5 dias)**
- Persistencia de dados locais + fila com backoff/dedupe.

**Fase 3 (1-2 semanas)**
- Otimizacoes de performance + virtualizacao + imagens/woff2.

---
Se quiser, posso transformar este diagnostico em um plano de implementacao (PRs pequenos e organizados).
