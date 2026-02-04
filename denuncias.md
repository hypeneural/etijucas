# 📋 Sistema de Denúncias - Documentação Técnica

> **Fiscaliza Tijucas** - Módulo de Denúncias Cidadãs  
> Última atualização: 2026-02-03

---

## 🎯 Visão Geral

O módulo de Denúncias permite que cidadãos reportem problemas urbanos (buracos, iluminação, lixo, etc.) com fotos, localização GPS e descrição. O sistema é **mobile-first**, **offline-first** e **native-first**.

---

## 🏗️ Arquitetura

### Backend (Laravel 12)

```
apps/api/app/Domains/Reports/
├── Models/
│   ├── CitizenReport.php      # Denúncia principal
│   ├── ReportCategory.php     # Categorias (buraco, iluminação, etc.)
│   └── ReportMedia.php        # Fotos/vídeos anexados
├── Http/
│   ├── Controllers/
│   │   └── ReportController.php
│   ├── Requests/
│   │   └── CreateReportRequest.php
│   └── Resources/
│       └── ReportResource.php
├── Enums/
│   └── ReportStatus.php       # recebido, em_analise, resolvido, rejeitado
├── Services/
│   └── ReportService.php
└── Policies/
    └── ReportPolicy.php
```

### Frontend (React + TypeScript)

```
apps/web/src/
├── pages/
│   ├── ReportWizardPage.tsx   # Wizard de criação (4 steps)
│   ├── MyReportsPage.tsx      # Minhas denúncias (logado)
│   └── ReportDetailPage.tsx   # Detalhe da denúncia
├── screens/
│   └── ReportScreen.tsx       # Lista pública (/denuncias)
├── components/report/
│   ├── StepCategory.tsx       # Seleção de categoria
│   ├── StepLocation.tsx       # Mapa + GPS
│   ├── StepDetails.tsx        # Título + descrição
│   ├── StepPhotos.tsx         # Upload de fotos
│   ├── StepReview.tsx         # Revisão final
│   ├── LocationMap.tsx        # Componente de mapa
│   └── CategoryIcon.tsx       # Ícone dinâmico (Iconify MDI)
├── hooks/
│   ├── useMyReports.ts        # CRUD + cache
│   └── useReportCategories.ts # Categorias da API
└── services/
    └── report.service.ts      # API calls
```

---

## 🔧 Funcionalidades Implementadas

### ✅ Backend

| Feature | Status | Descrição |
|---------|--------|-----------|
| CRUD Denúncias | ✅ | Criar, listar, visualizar, atualizar |
| Upload de Mídia | ✅ | Fotos com thumbnails automáticos |
| Categorias Dinâmicas | ✅ | Via banco com ícones MDI |
| Geolocalização | ✅ | latitude/longitude/address |
| Protocolo Único | ✅ | Geração automática com retry |
| Status Workflow | ✅ | recebido → em_analise → resolvido |
| Histórico de Status | ✅ | JSON com timestamps |
| API Pública | ✅ | Listagem sem autenticação |
| API Autenticada | ✅ | Minhas denúncias |
| Filament CRUD | ✅ | Admin panel completo |

### ✅ Frontend

| Feature | Status | Descrição |
|---------|--------|-----------|
| Wizard 5 Steps | ✅ | Categoria → Local → Detalhes → Fotos → Revisão |
| Ícones MDI | ✅ | Via `@iconify/react` + API |
| Grid 3 Colunas | ✅ | Mobile-first na seleção de categoria |
| Mapa Interativo | ✅ | Leaflet com GPS e busca |
| Upload de Fotos | ✅ | Câmera/galeria com preview |
| Lista Pública | ✅ | `/denuncias` com filtros |
| Minhas Denúncias | ✅ | `/minhas-denuncias` (autenticado) |
| Detalhe | ✅ | `/denuncia/:id` com galeria e mapa |
| Thumbnails | ✅ | Exibição de fotos nas listas |
| Cache TanStack | ✅ | staleTime 30s, gcTime 5min |
| Offline Drafts | ✅ | Rascunhos em IndexedDB |

---

## 📊 Modelo de Dados

### citizen_reports
```sql
id              UUID PRIMARY KEY
user_id         UUID FK (nullable para anônimas)
category_id     UUID FK
title           VARCHAR(200)
description     TEXT NULLABLE
status          ENUM (recebido, em_analise, resolvido, rejeitado)
protocol        VARCHAR(20) UNIQUE
latitude        DECIMAL(10,7)
longitude       DECIMAL(10,7)
address         TEXT NULLABLE
status_history  JSON
is_anonymous    BOOLEAN
resolved_at     TIMESTAMP NULLABLE
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### report_categories
```sql
id          UUID PRIMARY KEY
name        VARCHAR(100)
slug        VARCHAR(100) UNIQUE
icon        VARCHAR(50)   -- Iconify MDI (ex: mdi:road-variant)
color       VARCHAR(20)   -- Hex (ex: #ef4444)
tips        JSON          -- Dicas para o usuário
active      BOOLEAN
sort_order  INTEGER
```

### report_media
```sql
id          UUID PRIMARY KEY
report_id   UUID FK
url         VARCHAR(500)
thumb_url   VARCHAR(500)
type        ENUM (image, video)
```

---

## 🔌 Endpoints API

### Públicos (sem auth)
```
GET  /api/v1/reports                    # Lista pública
GET  /api/v1/reports/{id}               # Detalhe
GET  /api/v1/reports/stats              # KPIs
GET  /api/v1/report-categories          # Categorias
```

### Autenticados (Bearer Token)
```
GET  /api/v1/me/reports                 # Minhas denúncias
POST /api/v1/me/reports                 # Criar denúncia
POST /api/v1/me/reports/{id}/media      # Upload de mídia
```

---

## 🎨 Categorias Atuais

| Slug | Nome | Ícone MDI | Cor |
|------|------|-----------|-----|
| `buraco` | Buraco na Rua | `mdi:road-variant` | #ef4444 |
| `iluminacao` | Iluminação Pública | `mdi:lightbulb-on-outline` | #f59e0b |
| `lixo` | Lixo/Entulho | `mdi:trash-can-outline` | #10b981 |
| `calcada` | Calçada Danificada | `mdi:walk` | #3b82f6 |
| `arvore` | Árvore/Mato Alto | `mdi:tree` | #22c55e |
| `vazamento` | Vazamento/Esgoto | `mdi:pipe` | #06b6d4 |
| `estacionamento` | Estacionamento Irregular | `mdi:parking` | #8b5cf6 |
| `perturbacao` | Perturbação do Sossego | `mdi:volume-high` | #f97316 |
| `outros` | Outros | `mdi:dots-horizontal` | #64748b |

---

## 🚧 O QUE FALTA FAZER

### Alta Prioridade

- [ ] **Mapa Interativo de Denúncias** (próxima feature)
  - Tela fullscreen com mapa
  - Pinos com ícone da categoria
  - Modal ao clicar no pino
  - Zoom in/out
  - Cluster de pinos próximos

- [ ] **Notificações Push**
  - Atualização de status
  - Nova resposta da prefeitura

### Média Prioridade

- [ ] **Comentários/Feedback**
  - Prefeitura responder ao cidadão
  - Cidadão adicionar informações

- [ ] **Votação/Apoio**
  - Outros cidadãos apoiarem uma denúncia
  - Ranking por relevância

- [ ] **Fotos Antes/Depois**
  - Comparativo visual da resolução

### Baixa Prioridade

- [ ] **Exportar PDF**
  - Protocolo completo em PDF

- [ ] **Integração WhatsApp**
  - Notificações via WhatsApp

---

## 🗺️ PRÓXIMA FEATURE: Mapa de Denúncias

### Objetivo
Criar uma tela **fullscreen mobile-first** com mapa interativo mostrando todas as denúncias como pinos. Ao clicar em um pino, abre um modal com detalhes.

### Especificação

#### UI/UX
```
┌─────────────────────────────────┐
│  ← Denúncias          🔍 [✓]   │  ← Header fixo
├─────────────────────────────────┤
│                                 │
│         [MAPA LEAFLET]          │
│                                 │
│      📍   📍                    │
│         📍    📍   📍           │
│    📍         📍                │
│              📍                 │
│                                 │
├─────────────────────────────────┤
│  [Categoria] [Status] [Zoom]    │  ← Filtros bottom
└─────────────────────────────────┘
```

#### Componentes
1. **ReportsMapScreen.tsx** - Tela principal
2. **MapMarker.tsx** - Pino customizado com CategoryIcon
3. **ReportPreviewModal.tsx** - Modal de preview ao clicar

#### API
```
GET /api/v1/reports/map?bounds=lat1,lng1,lat2,lng2
```
Retorna denúncias dentro do viewport para otimizar performance.

#### Bibliotecas
- `react-leaflet` (já instalado)
- `leaflet.markercluster` (agrupar pinos próximos)

#### Interações
- **Tap no pino** → Abre modal com preview
- **Tap "Ver mais"** → Navega para `/denuncia/:id`
- **Pinch zoom** → Zoom in/out nativo
- **Drag** → Move o mapa
- **Filtros** → Dropdown de categoria/status

---

## 📱 Fluxo do Usuário

```mermaid
flowchart TD
    A[Home] --> B{Logado?}
    B -->|Não| C[/denuncias - Lista Pública]
    B -->|Sim| D[/minhas-denuncias]
    
    C --> E[Detalhe da Denúncia]
    D --> E
    
    B -->|Sim| F[/denuncia/nova]
    F --> G[1. Categoria]
    G --> H[2. Localização]
    H --> I[3. Detalhes]
    I --> J[4. Fotos]
    J --> K[5. Revisão]
    K --> L[Enviar]
    L --> M[Protocolo Gerado]
    M --> D
```

---

## 🔧 Comandos Úteis

```bash
# Rodar seeder de categorias
cd apps/api && php artisan db:seed --class=ReportCategorySeeder

# Build frontend
cd apps/web && pnpm build

# Dev server
cd apps/web && pnpm dev
```

---

## 📁 Arquivos Chave

| Arquivo | Descrição |
|---------|-----------|
| `apps/api/app/Domains/Reports/Models/CitizenReport.php` | Model principal |
| `apps/api/app/Domains/Reports/Http/Controllers/ReportController.php` | Controller API |
| `apps/api/database/seeders/ReportCategorySeeder.php` | Seed das categorias |
| `apps/web/src/pages/ReportWizardPage.tsx` | Wizard de criação |
| `apps/web/src/components/report/CategoryIcon.tsx` | Renderização de ícones |
| `apps/web/src/hooks/useMyReports.ts` | Hooks de cache |
