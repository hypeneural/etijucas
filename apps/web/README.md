# 🏙️ eTijucas - Seu Dia a Dia

**eTijucas** é um Progressive Web App (PWA) mobile-first que conecta cidadãos de Tijucas/SC com a cidade. O aplicativo permite reportar problemas urbanos, participar do fórum comunitário, consultar eventos, acessar telefones úteis e muito mais - tudo funcionando **offline-first** com experiência **nativa**.

> 🚀 **Status**: Em desenvolvimento ativo | **Versão**: 0.2.0 (Beta)

---

## 📱 Sobre o Aplicativo

eTijucas transforma a interação dos cidadãos com a prefeitura e serviços locais, oferecendo:

- **💬 Boca no Trombone**: Fórum comunitário para discussões, alertas e sugestões
- **📢 Reportar Problemas**: Denúncias sobre buracos, iluminação, lixo e mais
- **📅 Agenda de Eventos**: Eventos culturais e comunitários
- **📞 Telefones Úteis**: Discador inteligente com busca e favoritos
- **⛪ Horários de Missas**: Consulte horários de igrejas por bairro
- **🏖️ Pontos Turísticos**: Explore as belezas de Tijucas
- **🗑️ Coleta de Lixo**: Horários de coleta por bairro

### 🎯 Diferenciais do eTijucas

| Diferencial | Descrição |
|-------------|-----------|
| ✅ **100% Offline** | Funciona sem internet - dados sincronizam automaticamente |
| ✅ **Mobile-First** | Otimizado para smartphones com gestos nativos |
| ✅ **PWA Instalável** | Funciona como app nativo sem Google Play/App Store |
| ✅ **Ultra-Rápido** | Lazy loading, code splitting e cache inteligente |
| ✅ **UX Nativa** | Pull-to-refresh, swipe actions, haptic feedback |
| ✅ **Smart Dialer** | Busca inteligente de telefones por nome, número ou tags |
| ✅ **Animações Premium** | Micro-interações com Framer Motion |
| ✅ **Dark Mode** | Tema automático (light/dark) |

---

## ✨ Features Implementadas

### 📞 Telefones Úteis - Smart City Dialer (NOVO!)

O discador inteligente da cidade com UX premium:

| Feature | Descrição |
|---------|-----------|
| **Busca Inteligente** | Pesquise por nome, número, tags ("ambulância" → SAMU) |
| **Chips de Categoria** | Filtros rápidos: Emergências, Saúde, Prefeitura, etc. |
| **25+ Contatos** | SAMU, Bombeiros, UPA, Delegacia, Prefeitura, CELESC, CASAN... |
| **Badges Visuais** | 24h, Gratuito, WhatsApp, Emergência |
| **Ações 1 Toque** | Ligar, Copiar, Abrir WhatsApp, Ver no Mapa |
| **Favoritos** | Salve contatos importantes (persistidos offline) |
| **Categorias Colapsáveis** | Accordion com contador por categoria |

### � Boca no Trombone - Fórum Comunitário

| Feature | Descrição |
|---------|-----------|
| **Categorias** | Reclamação, Sugestão, Alerta, Dúvida, Elogio |
| **Likes e Comentários** | Engajamento comunitário |
| **Comentários Threaded** | Respostas em cascata |
| **Imagens** | Anexar fotos em posts e comentários |
| **Animações Premium** | Cards com stagger animations |

### 📢 Sistema de Reports/Denúncias

| Feature | Descrição |
|---------|-----------|
| **Wizard 5 Passos** | Categoria → Foto → Bairro → Local → Descrição |
| **Dual View** | Toggle Nova Denúncia / Meus Reports |
| **Optimistic UI** | Feedback instantâneo, sync em background |
| **Sync Status** | Badges visuais (Pendente/Sincronizando/Erro) |
| **Swipe-to-Delete** | Gesto para deletar com haptic |
| **Retry Automático** | Botão para reenviar reports com erro |
| **Protocolo Único** | Cada denúncia recebe código rastreável |

### 📱 PWA & Instalação Inteligente

| Feature | Descrição |
|---------|-----------|
| **Banner Inteligente** | Aparece após 30s, com opções de dismiss |
| **Detecção de Plataforma** | Android (prompt nativo), iOS (tutorial) |
| **Persistência** | "Lembrar em 24h", "7 dias", "Nunca mostrar" |
| **Menu de Instalação** | Item "Instalar app" no menu Mais |
| **Shortcuts** | Atalhos diretos para Reportar, Agenda, Emergência |

### 🔌 Arquitetura Offline-First

| Feature | Descrição |
|---------|-----------|
| **Sync Queue** | Fila persistente de mutações offline |
| **Auto-Sync** | Sincronização automática ao voltar online |
| **Offline Images** | Armazenamento no IndexedDB |
| **Service Worker** | Cache de assets, API e fontes |
| **React Query** | networkMode: 'offlineFirst' |
| **Offline Indicator** | Banner visual quando sem conexão |

### 🎨 UX Native-Like

| Feature | Descrição |
|---------|-----------|
| **Pull-to-Refresh** | Física de molas com rubber banding |
| **Swipe Actions** | Gestos de slide em listas |
| **Haptic Feedback** | Vibrações em ações importantes |
| **Keyboard Avoidance** | Auto-scroll de inputs |
| **Dynamic Status Bar** | Cor ajusta ao tema |
| **Safe Area** | Suporte para notch/dynamic island |

---

## 🛠️ Tech Stack

### **Frontend Core**
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.8.3 | Type safety |
| **Vite** | 5.4.19 | Build tool & dev server |
| **Tailwind CSS** | 3.4.17 | Styling & design system |

### **UI & Animation**
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Radix UI** | ~1.x | Componentes acessíveis |
| **shadcn/ui** | - | Component library |
| **Framer Motion** | 12.29.2 | Animações & gestos |
| **Lucide React** | 0.462.0 | Ícones consistentes |
| **Sonner** | 1.7.4 | Toast notifications |

### **State & Data**
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Zustand** | 5.0.10 | Global state (com persist) |
| **TanStack Query** | 5.83.0 | Data fetching & caching |
| **React Hook Form** | 7.61.1 | Formulários |
| **Zod** | 3.25.76 | Validação de schemas |

### **PWA & Offline**
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **vite-plugin-pwa** | 1.2.0 | PWA generation |
| **Workbox** | 7.4.0 | Service Worker strategies |
| **IndexedDB** | Native | Offline storage |

### **Routing & Navigation**
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **React Router** | 6.x | Navegação SPA |

---

## 🏗️ Arquitetura de Diretórios

```
src/
├── components/
│   ├── ui/                  # Componentes base (Button, Badge, Dialog...)
│   │   ├── InstallBanner.tsx    # PWA install prompt
│   │   ├── OfflineIndicator.tsx
│   │   └── SwipeableListItem.tsx
│   ├── home/                # Componentes da Home
│   ├── forum/               # TopicCard, CommentList, etc.
│   ├── phones/              # Smart Dialer components
│   │   ├── ContactCard.tsx
│   │   ├── CategoryChips.tsx
│   │   ├── EmptyState.tsx
│   │   └── SkeletonList.tsx
│   └── layout/
│       ├── AppShell.tsx
│       └── BottomTabBar.tsx
├── screens/
│   ├── HomeScreen.tsx
│   ├── ReportScreen.tsx
│   ├── ForumScreen.tsx
│   ├── AgendaScreen.tsx
│   ├── MoreScreen.tsx
│   └── UsefulPhonesScreen.tsx   # Smart City Dialer
├── pages/
│   ├── ProfilePage.tsx
│   ├── TopicDetailPage.tsx
│   ├── MassesPage.tsx
│   └── ...
├── hooks/
│   ├── useInstallPrompt.ts      # PWA install logic
│   ├── useOnlineSync.ts
│   ├── useKeyboardAvoidance.ts
│   └── useHaptics.ts
├── store/
│   └── useAppStore.ts           # Zustand com persist
├── data/
│   ├── mockData.ts
│   └── phoneContacts.ts         # 25+ contatos
├── lib/
│   ├── utils.ts
│   └── phoneFormat.ts           # Formatação BR
└── types/
    └── index.ts
```

---

## 🚦 Getting Started

### **Requisitos**
- Node.js 18+ 
- npm ou yarn

### **Instalação**

```bash
# Clone o repositório
git clone <YOUR_GIT_URL>
cd etijucas-seu-dia-a-dia

# Instale dependências
npm install

# Rode em desenvolvimento
npm run dev
```

O app estará disponível em `http://localhost:8080`

### **Scripts Disponíveis**

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Linter |
| `npm test` | Rodar testes |

---

## 📋 Roadmap - O Que Falta Fazer

### 🔴 Prioridade Alta

- [ ] **Backend Integration**
  - API REST para CRUD de reports e fórum
  - Autenticação (JWT)
  - Endpoints para agenda, turismo, missas

- [ ] **Push Notifications**
  - Notificar quando report for atualizado
  - Alertas de eventos próximos
  - Updates importantes da prefeitura

- [ ] **Background Sync API**
  - Sincronização em background mesmo com app fechado

### 🟡 Prioridade Média

- [ ] **Mapas Interativos**
  - Mapa de reports
  - Localização de pontos turísticos
  - Rotas para serviços

- [ ] **Perfil de Usuário Completo**
  - Login social (Google, Facebook)
  - Histórico de reports
  - Configurações de notificação

- [ ] **FilterSheet Avançado**
  - Telefones: filtros por 24h, WhatsApp, gratuito
  - Multi-select de categorias

- [ ] **Geolocalização**
  - Detectar bairro automaticamente
  - "Perto de mim" nos telefones

### 🟢 Melhorias Futuras

- [ ] Dark mode manual toggle
- [ ] Compartilhamento (WhatsApp, etc.)
- [ ] Busca global no app
- [ ] Multilíngua (PT/EN/ES)
- [ ] E2E tests (Playwright)
- [ ] Analytics (uso offline vs online)

---

## 🎨 Design System

### **Cores**
| Cor | Uso |
|-----|-----|
| **Primary** | Verde (identidade da cidade) |
| **Secondary** | Azul claro |
| **Accent** | Laranja (alertas) |
| **Destructive** | Vermelho (emergências) |

### **Tipografia**
- **Font**: Inter (Google Fonts)
- **Sizing**: 12px - 48px (fluid)

### **Componentes**
- Baseados em Radix UI (acessibilidade)
- Variantes com `class-variance-authority`
- Glassmorphism em cards

---

## 📄 Licença

Este projeto é de código fechado e propriedade da Hype Neural

---

## 📞 Suporte

- **Email**: contato@tijucas.sc.gov.br
- **Telefone**: (48) 3263-8100

---

**Feito com ❤️ para Tijucas**
