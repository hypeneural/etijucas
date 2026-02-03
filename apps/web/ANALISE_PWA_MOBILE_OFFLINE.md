## Gaps e riscos principais
1) **Cache de API pode nao estar funcionando**
   - `vite.config.ts` usa `urlPattern: /^https:\/\/api\..*/`.
   - A API atual usa `http://localhost:8000/api/v1` (`src/api/config.ts`). Em producao, o dominio pode ser diferente, entao o runtime cache pode nao bater.

2) **Dados offline nao persistem entre recargas**
   - Fallback em `src/services/*` usa dados em memoria (perde ao recarregar).
   - React Query nao esta persistido em storage (sao caches em memoria).

3) **Fontes dependem de rede externa**
   - Google Fonts via `@import` em `src/index.css` e preload em `index.html`.
   - Em primeiro uso offline, fontes nao carregam; alem disso, `@import` pode atrasar render.

4) **Manifest com encoding quebrado**
   - `public/manifest.json` e `index.html` mostram caracteres quebrados (ex.: `Fórum`).
   - Isso aparece na install UI e em previews, impactando confianca e qualidade.

5) **Sem fallback offline dedicado**
   - Nao existe pagina offline/erro ou estrategia de fallback para navegacao e midia (ex.: imagens).

6) **Sincronizacao offline sem backoff/garantias**
   - A fila reprocessa em loop simples (sem backoff exponencial, sem dedupe, sem idempotencia).
   - Sem Background Sync (Workbox) para rodar com app fechado.

7) **Bundles grandes para mobile**
   - Dependencias pesadas (framer-motion, recharts, radix) podem cair no bundle inicial.
   - Possivel carregamento de telas nao usadas no primeiro paint.

## Melhorias recomendadas (priorizadas)

### A. PWA / Service Worker
1) **Corrigir o pattern do cache de API**
   - Usar `urlPattern` dinamico com base em `VITE_API_URL`.
   - Ex.: `({url}) => url.origin === new URL(import.meta.env.VITE_API_URL).origin`.

2) **Adicionar fallback offline para navegacao**
   - Precache de um `offline.html` simples e `navigateFallback`.
   - Em caso de erro de rede, mostrar estado offline amigavel.

3) **Ativar `navigationPreload`**
   - Melhora TTFB em redes lentas quando SW intercepta.

4) **Revisar estrategia de cache por tipo de endpoint**
   - Endpoints estaticos: `StaleWhileRevalidate` com TTL maior.
   - Endpoints criticos e mutaveis: `NetworkFirst` com timeout menor (3-5s).

5) **Evitar dupla forma de registro do SW**
   - Se usar `vite-plugin-pwa` com `injectRegister`, remover registro manual, ou vice-versa.

### B. Offline-first (dados e sync)
1) **Persistir cache do React Query**
   - Usar `@tanstack/react-query-persist-client` + IndexedDB (localforage ou idb-keyval).
   - Permite app abrir totalmente offline apos 1 acesso.

2) **Persistir dados de mock/offline**
   - Trocar `localReports/localTopics` em memoria por IndexedDB/SQLite (via WASM) ou localForage.

3) **Background Sync (quando suportado)**
   - Implementar `workbox-background-sync` para POST/PUT/DELETE.
   - Fallback para `useOnlineSync` quando nao suportado.

4) **Idempotencia e conflitos**
   - Gerar IDs de cliente (UUID) e enviar no payload.
   - Registrar `lastUpdatedAt` para reconciliar conflitos ao sincronizar.

### C. Mobile-first (performance e fluidez)
1) **Carregamento progressivo por rotas**
   - `React.lazy` + `Suspense` para telas menos usadas (Forum, Agenda, Graficos).

2) **Virtualizacao de listas**
   - Para listas longas (reports, topics), usar `react-window`/`react-virtual`.

3) **Otimizacao de imagens**
   - Fornecer `srcset/sizes` e `loading="lazy"`.
   - Usar WebP/AVIF e limitar dimensoes no upload.

4) **Reduzir custo de animacoes**
   - Em redes lentas/`saveData`, desativar animacoes pesadas.
   - Preferir `prefers-reduced-motion` para acessibilidade.

5) **Remover `@import` de fontes**
   - Trocar por self-hosted font ou `link rel="stylesheet"`.
   - Incluir `font-display: swap` para evitar bloqueio de render.

### D. Native-first (experiencia de app)
1) **Install UX**
   - Custom prompt de instalacao com `beforeinstallprompt`.
   - Detecao `display-mode` para UX especifica de app instalado.

2) **Splash e icons iOS**
   - Gerar `apple-touch-icon` 180x180 e `apple-touch-startup-image`.
   - Melhorar experiencia iOS (Safari nao usa manifest completo).

3) **Push / badges / share**
   - Push notifications para updates de reports e eventos.
   - Badging API (quando suportado) para pendencias offline.
   - Web Share API para compartilhar eventos e posts.

## Quick wins (baixo custo, alto impacto)
- Corrigir encoding em `index.html` e `public/manifest.json`.
- Ajustar `urlPattern` do cache da API para o dominio real.
- Persistir cache do React Query em IndexedDB.
- Remover `@import` de Google Fonts e self-host da fonte.

## Proximos passos sugeridos
1) Definir o dominio final da API e ajustar SW.
2) Implementar persistencia de cache e dados offline.
3) Criar offline fallback page.
4) Medir bundle e ativar code splitting por rotas.
5) Testar com Lighthouse PWA + throttling 3G.

---
Arquivo gerado automaticamente com base na estrutura atual do repo.