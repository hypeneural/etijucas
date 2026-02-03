# Roadmap de Performance e Experiência do Usuário (eTijucas)

Este documento prioriza as melhorias identificadas para elevar a performance, usabilidade e capacidades offline do aplicativo eTijucas.

---

## 📊 Status Geral

| Categoria | Concluído | Pendente |
|-----------|-----------|----------|
| Quick Wins | 4/4 | 0 |
| Offline-First | 3/3 | 0 |
| Mobile-First | 2/3 | 1 |
| Sync/Background | 0/2 | 2 |
| Native/iOS | 1/1 | 0 |

---

## 🚀 Quick Wins (Alto Impacto, Baixo Esforço)

- [x] **Corrigir Encoding do Manifest e HTML**
  - ✅ Caracteres especiais escapados em `public/manifest.json`
  
- [x] **Remover `@import` de Fontes**
  - ✅ Fontes Inter baixadas e servidas localmente em `/public/fonts`
  - ✅ `@font-face` configurado em `src/index.css`
  - ✅ `index.html` atualizado com preload local
  
- [x] **Ajustar Cache de API no Service Worker**
  - ✅ `vite.config.ts` atualizado com `urlPattern` dinâmico
  - ✅ Estratégias de cache otimizadas (CacheFirst para imagens, NetworkFirst para API)
  
- [x] **Install UX**
  - ✅ Hook `useInstallPrompt` criado (`src/hooks/useInstallPrompt.ts`)
  - ✅ Componente `InstallBanner` criado (`src/components/ui/InstallBanner.tsx`)
  - ✅ Suporte iOS Safari com instruções visuais

---

## 📡 Prioridade Alta: Offline-First Robusto

- [x] **Persistência do React Query (IndexedDB)**
  - ✅ Instalado `@tanstack/react-query-persist-client` e `idb-keyval`
  - ✅ Persister criado em `src/lib/queryPersister.ts`
  - ✅ `App.tsx` usando `PersistQueryClientProvider`
  - ✅ Cache sobrevive reloads e funciona offline

- [x] **Fallback Offline para Navegação**
  - ✅ `public/offline.html` criado
  - ✅ `navigateFallback` configurado no SW

- [x] **Estratégia de Cache de Imagens**
  - ✅ CacheFirst para imagens com expiração de 30 dias

---

## ⚡ Prioridade Média: Performance e Mobile-First

- [x] **Code Splitting (Lazy Loading)**
  - ✅ Já implementado em `AppShell.tsx` com `React.lazy`
  - ✅ Todas as telas (Home, Report, Forum, Agenda, More) são lazy loaded

- [x] **Otimização de Imagens (Upload)**
  - ✅ Utilitário criado em `src/lib/imageCompression.ts`
  - ✅ Compressão WebP/JPEG com controle de qualidade
  - ✅ Redimensionamento automático (máx 1200x1200)
  - ⚠️ **Ação pendente:** Integrar no `ReportScreen` ao capturar foto

- [ ] **Virtualização de Listas**
  - **Ação:** Instalar `react-window` e aplicar no Fórum/Relatos se listas forem longas
  - **Prioridade:** Baixa (apenas se houver problemas de performance em listas)

---

## 🔄 Prioridade: Sync e Background

- [x] **Background Sync (Workbox)**
  - ✅ Configurado em `vite.config.ts` com `backgroundSync` plugin
  - ✅ Queue `etijucas-sync-queue` para POST/PUT/DELETE
  - ✅ Retry automático por 24 horas

- [x] **Tratamento de Conflitos e Idempotência**
  - ✅ Utilitário `src/lib/uuid.ts` criado com `generateUUID()`
  - ✅ `useAppStore.addReport()` agora gera UUID como `clientId`
  - ✅ Servidor pode usar UUID para detectar duplicatas

---

## 📱 Nativo e iOS

- [x] **Assets para iOS**
  - ✅ `apple-touch-icon` configurado em `index.html`
  - ✅ Meta tags iOS Safari presentes

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos
| Arquivo | Descrição |
|---------|-----------|
| `src/hooks/useInstallPrompt.ts` | Hook para gerenciar prompt de instalação PWA |
| `src/components/ui/InstallBanner.tsx` | Componente de banner de instalação |
| `src/lib/queryPersister.ts` | Persister IndexedDB para React Query |
| `src/lib/imageCompression.ts` | Utilitário de compressão de imagens |
| `public/offline.html` | Página de fallback offline |
| `public/fonts/*.ttf` | Fontes Inter locais |

### Arquivos Modificados
| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | PersistQueryClientProvider + InstallBanner |
| `src/index.css` | @font-face locais (removido @import) |
| `index.html` | Preload de fonte local |
| `vite.config.ts` | Workbox otimizado |
| `public/manifest.json` | Encoding corrigido |

---

## 🎯 Próximos Passos (Para o Time)

1. **Integrar compressão de imagem** no `ReportScreen` ao capturar foto
2. **Testar offline** carregando o app, desligando rede e navegando
3. **Verificar IndexedDB** no DevTools → Application → IndexedDB
4. **Monitorar bundle size** com `npm run build -- --analyze`
