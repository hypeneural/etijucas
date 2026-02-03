# Analise Completa — PWA / Mobile‑First / Offline‑First / Native‑First (2026-01-28)

## Escopo analisado
- Configuracoes: `vite.config.ts`, `index.html`, `public/manifest.json`, `public/offline.html`
- Entrada do app: `src/main.tsx`, `src/App.tsx`
- PWA/Service Worker: `vite-plugin-pwa` + Workbox (runtimeCaching)
- Persistencia: `src/lib/queryPersister.ts`, `src/store/useSyncStore.ts`
- API/fetch: `src/api/client.ts`, `src/api/config.ts`
- Offline/estado de rede: `src/hooks/useNetworkStatus.ts`, `src/hooks/useOnlineSync.ts`, `src/components/ui/OfflineIndicator.tsx`
- Services com fallback offline: `src/services/*.ts`
- Estilos globais: `src/index.css`

## Resumo executivo (alto impacto)
1) **Offline real ainda nao e confiavel**: `report.service.ts` e `topic.service.ts` salvam em memoria e perdem ao recarregar. Para offline-first real, precisa IndexedDB/localforage.
2) **Service Worker esta inconsistente**: registro manual em `src/main.tsx` + `vite-plugin-pwa` com autoUpdate. Fallback offline existe, mas nao esta sendo usado como `navigateFallback`.
3) **Rede lenta causa travas**: `timeout 10s` + `retry 3x` em `src/api/client.ts` torna UX pesada em 2G/offline antes de cair no fallback.
4) **Encoding quebrado em textos**: `index.html`, `public/manifest.json`, `public/offline.html` e alguns componentes exibem caracteres corrompidos. Impacta instalacao PWA e confianca.

## Visao geral da estrutura atual
- **PWA**: `vite-plugin-pwa` com runtime caching (API network-first, imagens cache-first, fontes cache-first).
- **Offline data**: React Query com persistencia em IndexedDB (bom), mas **services mockados nao persistem**.
- **Sync offline**: fila local em `zustand` (`useSyncStore`) + tentativa de sync em `useOnlineSync` (sem backoff/dedupe/idempotencia).
- **UI**: framer-motion e shadcn/ui com boas animacoes, mas sem degradacao para rede lenta.
- **Performance**: code-splitting configurado em `vite.config.ts` (manualChunks). Porem listas longas ainda sem virtualizacao.

## Pontos fortes
- React Query com persistencia em IndexedDB ja implementada.
- `useNetworkStatus` detecta conexao lenta e pode guiar degradacoes.
- Workbox com cache por tipo (API, imagens, fontes) ja existe.
- AppShell com lazy loading de telas (boa base para performance).

## Gaps e riscos (priorizados)

### 1) Offline-first verdadeiro (dados mutaveis)
**Problema**
- `localReports` e `localTopics` sao arrays em memoria e perdem tudo no refresh.

**Melhoria**
- Persistir essas colecoes em IndexedDB (ex.: idb-keyval) e criar repositorios locais.
- Sincronizar `useSyncStore` com esses dados locais para evitar inconsistencias.

### 2) Fallback offline nao ativo
**Problema**
- `public/offline.html` existe mas `navigateFallback` aponta para `index.html`.

**Melhoria**
- Trocar para `offline.html` como fallback real ou implementar fallback interno no fetch.

### 3) Registro duplicado do SW
**Problema**
- `src/main.tsx` registra SW manualmente e `vite-plugin-pwa` faz autoUpdate.

**Melhoria**
- Usar `virtual:pwa-register` (plugin) OU manter manual, mas desligar injecao automatica.

### 4) Background Sync incompleto
**Problema**
- Workbox runtimeCaching define `method: "POST"`, mas quer cobrir PUT/DELETE/PATCH.
- `src/sw-background-sync.ts` existe, mas nao esta integrado ao SW gerado.

**Melhoria**
- Corrigir regras por metodo e centralizar a implementacao em um unico lugar.

### 5) Tempo de espera alto em rede ruim
**Problema**
- timeout 10s e 3 retries = UX lenta em 2G/offline.

**Melhoria**
- Ajustar timeout/retry dinamicamente usando `useNetworkStatus`.
- Se `navigator.onLine === false`, pular fetch e ir direto ao fallback.

### 6) Encoding quebrado
**Problema**
- Textos em HTML/manifest/offline exibem `fÃ³rum`, `alteraÃ§Ã£o`, etc.

**Melhoria**
- Re-salvar arquivos em UTF-8 e revisar strings.

## Melhorias recomendadas (detalhadas)

### A) PWA / Service Worker
1) **Fallback offline dedicado**
   - Precache e usar `offline.html`.
   - Ajustar `navigateFallback` e `navigateFallbackDenylist`.

2) **Unificar registro do SW**
   - Preferir `virtual:pwa-register`.

3) **Cache de API mais inteligente**
   - APIs criticas: NetworkFirst com timeout pequeno (3–5s).
   - APIs estaveis: StaleWhileRevalidate.

4) **Navigation Preload**
   - Ativar `navigationPreload` para reduzir TTFB.

### B) Offline-first (dados e sync)
1) **Persistencia local real**
   - Salvar `reports` e `topics` em IndexedDB e hidratar no boot.

2) **Fila offline robusta**
   - Backoff exponencial, dedupe, idempotency key.

3) **Persistir favoritos e filtros**
   - Ja existe em Agenda, mas revisar em outras features.

### C) Mobile-first / Performance
1) **Virtualizacao de listas**
   - `ReportScreen` e `ForumScreen` podem travar em devices fracos.

2) **Reducao de animacoes em 2G**
   - Degradar animacoes e blur quando `saveData` ou `2g`.

3) **Fontes e imagens**
   - Trocar TTF por WOFF2.
   - Preferir WebP/AVIF e `loading="lazy"`.

4) **CPU/JS budget**
   - Monitorar bundle inicial e lazy load de telas menos acessadas.

### D) Native-first
1) **Haptics leves**
   - `navigator.vibrate(10)` em favoritas, compartilhamento, CTA.

2) **Status bar/standalone**
   - Ajustar paddings e UI quando app estiver instalado.

3) **iOS assets completos**
   - `apple-touch-icon` 180px e `apple-touch-startup-image`.

### E) Confianca e qualidade
1) **Encoding e textos corretos**
2) **Logs leves de sync/falhas**
3) **Error boundaries** em rotas criticas

## Quick wins (baixo custo, alto impacto)
- Corrigir encoding.
- Ativar fallback offline real.
- Ajustar timeout/retry baseado em rede lenta.
- Corrigir Background Sync para PUT/DELETE/PATCH.
- Persistir `localReports` / `localTopics` em IndexedDB.

## Checklist de validacao
- Offline total: app abre e navega com dados locais.
- Criar report/topic offline: persiste depois de refresh.
- Voltar online: fila sincroniza sem duplicar.
- Em Slow 3G: input responsivo, rolagem fluida.
- PWA instalado: sem barras do browser, splash ok.

## Proposta de fases
**Fase 1 (1–2 dias)**
- Encoding + fallback offline + unificar SW.

**Fase 2 (3–5 dias)**
- Persistencia local real + fila com backoff/dedupe.

**Fase 3 (1–2 semanas)**
- Otimizacoes de performance + virtualizacao + assets nativos.

---
Se quiser, posso transformar este diagnostico em tarefas concretas e ja aplicar as melhorias por prioridade.
