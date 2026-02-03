# 🔧 Melhorias Sugeridas - API Agenda de Eventos

**Documento para:** Time de Backend  
**Elaborado por:** Time de Frontend  
**Data:** 01/02/2026  
**Status:** 📋 Sugestões de Melhorias

---

## 📋 Índice

1. [Contexto e Análise](#-contexto-e-análise)
2. [Endpoints Prioritários](#-endpoints-prioritários)
3. [Melhorias no Modelo de Dados](#-melhorias-no-modelo-de-dados)
4. [Eventos Multi-dias](#-eventos-multi-dias)
5. [Sistema de Filtros](#-sistema-de-filtros)
6. [Calendário e Agrupamentos](#-calendário-e-agrupamentos)
7. [Programação do Evento](#-programação-do-evento)
8. [Perguntas para o Backend](#-perguntas-para-o-backend)
9. [Priorização Sugerida](#-priorização-sugerida)

---

## 🎯 Contexto e Análise

### Estado Atual
O frontend está 100% preparado para consumir a API, mas os endpoints ainda não foram implementados:

```
SQLSTATE[42S02]: Table 'idespach_apietijucas.events' doesn't exist
```

### Arquivos do Frontend Prontos
| Arquivo | Descrição |
|---------|-----------|
| `src/types/events.api.ts` | Tipos TypeScript para a nova API |
| `src/services/event.api.service.ts` | Serviço completo com offline-first |
| `src/hooks/queries/useEventsApi.ts` | React Query hooks |
| `src/hooks/useEventFiltersApi.ts` | Hook de filtros integrado |

### Componentes que Consomem os Dados
| Componente | Função |
|------------|--------|
| `EventsPage.tsx` | Listagem e calendário |
| `EventDetailsPage.tsx` | Página de detalhes |
| `EventCard.tsx` | Card de evento |
| `EventsCarousel.tsx` | Carousel na home |
| `FiltersSheet.tsx` | Modal de filtros |

---

## 🚀 Endpoints Prioritários

### 1. Banner do Evento (NOVO)

O frontend precisa de um campo **banner** para exibir uma imagem destacada no topo da página de detalhes:

```json
// Sugestão: Adicionar campo no EventDetail
{
  "bannerImage": "https://cdn.example.com/events/rock-banner-wide.jpg",
  "bannerImageMobile": "https://cdn.example.com/events/rock-banner-mobile.jpg"
}
```

**Diferença entre banner e cover:**
- `coverImage`: Imagem quadrada/retangular para cards (ratio 4:3 ou 1:1)
- `bannerImage`: Imagem wide para topo da página (ratio 21:9 ou 16:9)
- `bannerImageMobile`: Versão mobile do banner (ratio 3:2)

---

### 2. Endpoint para Box da Home (NOVO)

O `EventsCarousel.tsx` precisa de um endpoint otimizado para a home:

```http
GET /events/home-featured
```

**Response sugerida:**
```json
{
  "data": {
    "highlight": {
      "id": "uuid",
      "title": "Festa de Verão 2026",
      "bannerImage": "https://cdn.example.com/banner.jpg",
      "startDateTime": "2026-02-15T18:00:00-03:00",
      "venue": { "name": "Praça do Dino", "bairro": "Centro" },
      "badge": { "text": "🔥 Em alta", "color": "#EF4444" }
    },
    "today": [
      { "id": "...", "title": "...", "coverImage": "...", "startDateTime": "...", "venue": { ... } }
    ],
    "weekend": [
      { "id": "...", "title": "...", "coverImage": "...", "startDateTime": "...", "venue": { ... } }
    ],
    "upcoming": [
      { "id": "...", "title": "...", "coverImage": "...", "startDateTime": "...", "venue": { ... } }
    ]
  }
}
```

**Vantagens:**
- ✅ Uma única requisição para a home
- ✅ Backend controla o que destacar
- ✅ Menor payload (campos otimizados)
- ✅ Possibilidade de badges dinâmicos ("Últimos ingressos", "Novo", etc.)

---

### 3. Endpoint Otimizado para Calendário (NOVO)

O calendário precisa saber quais datas têm eventos sem carregar todos os detalhes:

```http
GET /events/calendar-summary?year=2026&month=02
```

**Response sugerida:**
```json
{
  "data": {
    "2026-02-01": { "count": 3, "hasHighlight": true },
    "2026-02-02": { "count": 1, "hasHighlight": false },
    "2026-02-05": { "count": 5, "hasHighlight": true },
    "2026-02-14": { "count": 8, "hasHighlight": true },
    "2026-02-15": { "count": 2, "hasHighlight": false }
  },
  "meta": {
    "month": 2,
    "year": 2026,
    "totalEvents": 19
  }
}
```

**Por quê?**
O frontend atual carrega TODOS os eventos do mês para renderizar os pontos no calendário. Com este endpoint:
- ✅ Payload 10x menor
- ✅ Resposta instantânea
- ✅ Possibilidade de mostrar "dias com destaque"

---

## 📊 Melhorias no Modelo de Dados

### Campos Sugeridos para Adicionar

```sql
ALTER TABLE events ADD COLUMN banner_image_url VARCHAR(500);
ALTER TABLE events ADD COLUMN banner_image_mobile_url VARCHAR(500);
ALTER TABLE events ADD COLUMN event_type VARCHAR(20) DEFAULT 'single'; -- single, multi_day, recurring
ALTER TABLE events ADD COLUMN total_days INT DEFAULT 1;
ALTER TABLE events ADD COLUMN edition VARCHAR(50); -- "3ª Edição", "Ano II", etc.
ALTER TABLE events ADD COLUMN expected_audience INT; -- público esperado
ALTER TABLE events ADD COLUMN confirmed_attendance INT DEFAULT 0;
```

### Enum de Tipos de Evento

```sql
-- event_type pode ser:
'single'      -- Evento de 1 dia (ex: Show, Palestra)
'multi_day'   -- Evento de múltiplos dias (ex: Festival 3 dias)
'recurring'   -- Evento recorrente (ex: Feira toda quinta)
```

---

## 📅 Eventos Multi-dias

### Problema Atual
O modelo atual considera apenas `startDateTime` e `endDateTime`, o que não funciona bem para eventos de múltiplos dias.

### Cenários de Eventos

#### Cenário 1: Evento de 1 dia
```json
{
  "title": "Show do João Rock",
  "eventType": "single",
  "totalDays": 1,
  "startDateTime": "2026-02-15T20:00:00-03:00",
  "endDateTime": "2026-02-16T02:00:00-03:00"
}
```

#### Cenário 2: Festival de 3 dias
```json
{
  "title": "Festival de Verão Tijucas",
  "eventType": "multi_day",
  "totalDays": 3,
  "edition": "5ª Edição",
  "startDateTime": "2026-02-14T18:00:00-03:00",
  "endDateTime": "2026-02-16T23:00:00-03:00",
  "days": [
    {
      "date": "2026-02-14",
      "title": "Dia 1 - Abertura",
      "startTime": "18:00",
      "endTime": "23:00",
      "schedule": [
        { "time": "18:00", "title": "Abertura dos portões" },
        { "time": "19:00", "title": "Banda Local A" },
        { "time": "21:00", "title": "Artista B" }
      ]
    },
    {
      "date": "2026-02-15",
      "title": "Dia 2 - Principal",
      "startTime": "16:00",
      "endTime": "02:00",
      "schedule": [
        { "time": "16:00", "title": "Abertura" },
        { "time": "18:00", "title": "Show Infantil" },
        { "time": "21:00", "title": "Atração Principal" }
      ]
    },
    {
      "date": "2026-02-16",
      "title": "Dia 3 - Encerramento",
      "startTime": "15:00",
      "endTime": "23:00",
      "schedule": [
        { "time": "15:00", "title": "Feira gastronômica" },
        { "time": "20:00", "title": "Show de encerramento" }
      ]
    }
  ]
}
```

### Tabela Sugerida: `event_days`

```sql
CREATE TABLE event_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    day_number INT NOT NULL,  -- 1, 2, 3...
    date DATE NOT NULL,
    title VARCHAR(150),  -- "Dia 1 - Abertura"
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description TEXT,
    cover_image_url VARCHAR(500),  -- Cada dia pode ter imagem própria
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(event_id, day_number),
    INDEX idx_event_days_date (date)
);
```

### Programação Vinculada ao Dia

```sql
ALTER TABLE event_schedules 
ADD COLUMN event_day_id UUID REFERENCES event_days(id);

-- Agora a programação pode ser vinculada a um dia específico
```

---

## 🔍 Sistema de Filtros

### Filtros Existentes no Frontend
O frontend já implementa estes filtros localmente:

| Filtro | Tipo | Status |
|--------|------|--------|
| `search` | string | ⏳ Precisa backend |
| `category` | slug | ⏳ Precisa backend |
| `bairroId` | uuid | ⏳ Precisa backend |
| `venueId` | uuid | ⏳ Precisa backend |
| `datePreset` | today/tomorrow/weekend | ⏳ Precisa backend |
| `fromDate` / `toDate` | date | ⏳ Precisa backend |
| `price` | free/paid | ⏳ Precisa backend |
| `priceMin` / `priceMax` | number | ⏳ Precisa backend |
| `timeOfDay` | morning/afternoon/night | ⏳ Precisa backend |
| `accessibility` | boolean | ⏳ Precisa backend |
| `parking` | boolean | ⏳ Precisa backend |
| `outdoor` | boolean | ⏳ Precisa backend |
| `kids` | boolean | ⏳ Precisa backend |
| `featured` | boolean | ⏳ Precisa backend |
| `orderBy` | field | ⏳ Precisa backend |

### Sugestões de Novos Filtros

```http
GET /events?hasSchedule=true          # Apenas eventos com programação
GET /events?hasTickets=true           # Apenas eventos com ingressos à venda
GET /events?multiDay=true             # Apenas festivais/eventos multi-dias
GET /events?organizerId=uuid          # Por organizador
GET /events?minCapacity=100           # Venues com capacidade mínima
GET /events?withRsvp=true             # Eventos com RSVP ativo
```

---

## 📆 Calendário e Agrupamentos

### Agrupamentos Disponíveis

```http
GET /events?groupBy=date              # Agrupa por data
GET /events?groupBy=category          # Agrupa por categoria
GET /events?groupBy=bairro            # Agrupa por bairro
GET /events?groupBy=week              # Agrupa por semana
```

### Response com Agrupamento

```json
{
  "data": {
    "2026-02-01": [
      { "id": "...", "title": "Evento 1" },
      { "id": "...", "title": "Evento 2" }
    ],
    "2026-02-02": [
      { "id": "...", "title": "Evento 3" }
    ]
  },
  "meta": {
    "groupBy": "date",
    "totalGroups": 2,
    "totalEvents": 3
  }
}
```

---

## 📋 Programação do Evento

### Estrutura Atual vs Sugerida

**Atual (simples):**
```json
{
  "schedule": [
    { "time": "18:00", "title": "Abertura", "details": "..." }
  ]
}
```

**Sugerida (completa):**
```json
{
  "schedule": {
    "hasMultipleDays": true,
    "totalDays": 3,
    "days": [
      {
        "dayNumber": 1,
        "date": "2026-02-14",
        "title": "Dia 1 - Abertura",
        "items": [
          {
            "id": "uuid",
            "time": "18:00",
            "endTime": "19:00",
            "title": "Abertura dos Portões",
            "description": "Chegue cedo para garantir seu lugar!",
            "stage": "Entrada Principal",
            "performer": null,
            "type": "info",  // info, show, workshop, food, break
            "icon": "door-open"
          },
          {
            "id": "uuid",
            "time": "19:00",
            "endTime": "20:30",
            "title": "Banda Local A",
            "description": "Rock clássico com toques regionais",
            "stage": "Palco Principal",
            "performer": {
              "name": "Banda Local A",
              "avatar": "https://...",
              "instagram": "@bandalocala"
            },
            "type": "show",
            "icon": "music"
          }
        ]
      }
    ]
  }
}
```

### Tipos de Item na Programação

| Tipo | Ícone | Descrição |
|------|-------|-----------|
| `info` | info | Informações gerais |
| `show` | music | Apresentação musical |
| `workshop` | graduation-cap | Oficina/palestra |
| `food` | utensils | Gastronomia |
| `break` | coffee | Intervalo |
| `ceremony` | award | Cerimônia/premiação |
| `kids` | baby | Atração infantil |

---

## ❓ Perguntas para o Backend

### Arquitetura

1. **Qual banco de dados estão usando?**
   - PostgreSQL, MySQL, MariaDB?
   - Suporte a JSON columns?

2. **Já existe a tabela `bairros` populada?**
   - O endpoint `/bairros` retorna dados?
   - Se sim, vamos usar o `bairro_id` como FK em `venues`?

3. **Como será feito o upload de imagens?**
   - AWS S3? Cloudinary? Storage local?
   - Vamos criar endpoints de upload ou usar URLs diretas?

### Modelo de Dados

4. **A tabela `users` já existe e está funcionando?**
   - Precisamos vincular RSVP e favoritos ao usuário
   - O `user_id` vem do JWT já decodificado?

5. **Vamos ter uma entidade `organizers` separada?**
   - Ou o organizador é sempre um `user`?
   - Organizador pode ter múltiplos eventos?

6. **Como preferem lidar com eventos recorrentes?**
   - Opção A: Uma linha por ocorrência (mais simples)
   - Opção B: Uma linha com regra de recorrência (RFC 5545 / iCal)

### Performance

7. **Redis está disponível para cache?**
   - Podemos cachear endpoints públicos?
   - TTL sugerido: 5 minutos para listagens

8. **Full-text search com Elasticsearch/Meilisearch?**
   - Ou busca simples com LIKE/ILIKE?

### Negócio

9. **Quem pode criar eventos?**
   - Qualquer usuário autenticado?
   - Apenas admins?
   - Organizadores verificados?

10. **Haverá moderação de eventos?**
    - Status: draft → pending_review → published
    - Ou publicação direta?

11. **Eventos podem ser duplicados/clonados?**
    - Para criar edições de eventos recorrentes

12. **RSVP tem limite de vagas?**
    - Evento com capacidade máxima
    - Lista de espera

---

## 🎯 Priorização Sugerida

### Fase 1 - MVP (Sprint 1-2)

| Prioridade | Endpoint/Feature | Justificativa |
|------------|------------------|---------------|
| 🔴 Alta | `GET /events` | Base para toda a agenda |
| 🔴 Alta | `GET /events/{id}` | Página de detalhes |
| 🔴 Alta | `GET /events/categories` | Filtros de categoria |
| 🟡 Média | `GET /events/today` | Quick filter |
| 🟡 Média | `GET /events/weekend` | Quick filter |
| 🟡 Média | `GET /events/upcoming` | Home carousel |

### Fase 2 - Interações (Sprint 3)

| Prioridade | Endpoint/Feature | Justificativa |
|------------|------------------|---------------|
| 🔴 Alta | `POST /events/{id}/favorite` | Engajamento |
| 🔴 Alta | `GET /users/me/favorites/events` | Área do usuário |
| 🟡 Média | `POST /events/{id}/rsvp` | Confirmação de presença |
| 🟡 Média | `GET /events/{id}/attendees` | Social proof |

### Fase 3 - Otimização (Sprint 4)

| Prioridade | Endpoint/Feature | Justificativa |
|------------|------------------|---------------|
| 🟡 Média | `GET /events/home-featured` | Performance home |
| 🟡 Média | `GET /events/calendar-summary` | Performance calendário |
| 🟢 Baixa | `GET /events/tags/trending` | Discovery |
| 🟢 Baixa | Suporte a eventos multi-dia | Feature avançada |

---

## 📞 Contato

Qualquer dúvida sobre a estrutura esperada pelo frontend, entrar em contato com a equipe de frontend.

**Documentação principal:** [`docs/AGENDA_API_DOCS.md`](./AGENDA_API_DOCS.md)
