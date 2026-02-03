# 📋 Respostas às Perguntas do Frontend - API de Eventos V2

**Data:** 01/02/2026  
**Backend:** Equipe Etijucas API  
**Documento:** Resposta completa a todas as dúvidas de migração

---

## 1. Estrutura de Resposta dos Eventos

### 1.1 Campo `coverImage`

✅ **Resposta: Opção B - Dentro de `media` no EventResource completo**

```json
// GET /events/{id} - Detalhes completos
{
  "id": "uuid",
  "title": "Festival de Verão",
  "media": {
    "coverImage": "https://...",
    "bannerImage": "https://...",        // V2
    "bannerImageMobile": "https://...",  // V2
    "gallery": [...]
  }
}

// GET /events (listagem) - Campo no root para conveniência
{
  "id": "uuid",
  "title": "Festival de Verão",
  "coverImage": "https://..."  // Direto no root na listagem
}
```

> **Resumo:** Na listagem (`EventListResource`) vem no root. Nos detalhes (`EventResource`) vem dentro de `media`.

---

### 1.2 Campo `ticket.type`

✅ **Resposta: Opção A - lowercase**

```json
{
  "ticket": {
    "type": "free",    // ou "paid" ou "donation"
    "minPrice": 0,
    "maxPrice": null,
    "currency": "BRL",
    "purchaseUrl": "https://...",
    "purchaseInfo": "Entrada gratuita...",
    "lots": [...]      // Apenas em detalhes
  }
}
```

**Valores possíveis para `ticket.type`:**
| Valor | Descrição |
|-------|-----------|
| `free` | Entrada gratuita |
| `paid` | Ingresso pago |
| `donation` | Contribuição voluntária |

---

### 1.3 Estrutura do `venue`

✅ **Resposta: Opção A - Objeto aninhado com bairro**

```json
{
  "venue": {
    "id": "uuid",
    "name": "Praça Central de Tijucas",
    "slug": "praca-central-tijucas",
    "address": "Praça XV de Novembro, s/n",
    "bairro": {
      "id": "uuid",
      "nome": "Centro"
    },
    "coordinates": {
      "latitude": -27.2419,
      "longitude": -48.6308
    },
    "capacity": 5000,
    "phone": "(48) 3263-1000"
  }
}
```

> **Observação:** O bairro usa `nome` (português) em vez de `name`.

---

### 1.4 Estrutura da `category`

✅ **Resposta: Opção A - Objeto completo**

```json
{
  "category": {
    "id": "uuid",
    "name": "Shows",
    "slug": "show",
    "icon": "🎵",
    "color": "#9333EA"
  }
}
```

---

## 2. Endpoints V2 Novos

### 2.1 GET `/events/home-featured`

✅ **Implementado e funcionando**

**Resposta exata:**
```json
{
  "data": {
    "highlight": {
      "id": "uuid",
      "title": "Festival de Verão Tijucas 2026",
      "slug": "festival-verao-tijucas-2026",
      "bannerImage": "https://...",  // Usa banner se disponível, senão cover
      "coverImage": "https://...",
      "startDateTime": "2026-02-15T18:00:00-03:00",
      "venue": {
        "name": "Orla de Meia Praia",
        "bairro": "Meia Praia"
      },
      "category": {
        "name": "Show",
        "color": "#9333EA"
      },
      "badge": {
        "text": "🔥 Em destaque",
        "color": "#EF4444"
      }
    },
    "today": [
      {
        "id": "uuid",
        "title": "Teatro Infantil: O Pequeno Príncipe",
        "slug": "...",
        "coverImage": "https://...",
        "startDateTime": "2026-02-01T15:00:00-03:00",
        "venue": { "name": "...", "bairro": "..." },
        "ticket": { "type": "free", "minPrice": 0 }
      }
    ],
    "weekend": [...],
    "upcoming": [...]
  },
  "success": true
}
```

**Respostas específicas:**

| Pergunta | Resposta |
|----------|----------|
| Limite por seção? | **6 eventos** por seção (today, weekend, upcoming) |
| Highlight pode ser null? | **Sim**, se não houver evento featured+upcoming |
| Eventos simplificados? | **Sim**, formato otimizado sem description, schedule, etc. |

**Cache:** 2 minutos para usuários anônimos.

---

### 2.2 GET `/events/calendar-summary?year=&month=`

✅ **Implementado e funcionando**

**Resposta exata:**
```json
{
  "data": {
    "2026-02-01": { "count": 1, "hasHighlight": false },
    "2026-02-03": { "count": 1, "hasHighlight": false },
    "2026-02-05": { "count": 1, "hasHighlight": false },
    "2026-02-07": { "count": 1, "hasHighlight": true },
    "2026-02-08": { "count": 1, "hasHighlight": false },
    "2026-02-10": { "count": 1, "hasHighlight": false },
    "2026-02-12": { "count": 1, "hasHighlight": true },
    "2026-02-14": { "count": 1, "hasHighlight": true },
    "2026-02-15": { "count": 1, "hasHighlight": true },
    "2026-02-16": { "count": 1, "hasHighlight": true }
  },
  "meta": {
    "year": 2026,
    "month": 2,
    "totalEvents": 10
  },
  "success": true
}
```

**Observações:**
- Dias sem eventos **não aparecem** no objeto (economia de payload)
- `hasHighlight: true` indica que há pelo menos 1 evento com `is_featured=true`
- **Cache:** 5 minutos para usuários anônimos

---

## 3. Paginação e Filtros

### 3.1 Campos de paginação no `meta`

**Estrutura do meta (padrão Laravel):**
```json
{
  "data": [...],
  "links": {
    "first": "https://api.../events?page=1",
    "last": "https://api.../events?page=8",
    "prev": null,
    "next": "https://api.../events?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 8,
    "path": "https://api.../events",
    "per_page": 15,
    "to": 15,
    "total": 120
  }
}
```

> **Nota:** Não existe campo `city` no meta. Use filtro por bairro se necessário.

---

### 3.2 Filtros suportados

| Param | Tipo | Exemplo | ✅ Suportado |
|-------|------|---------|-------------|
| `page` | int | `1` | ✅ Sim |
| `perPage` | int | `20` (max 50) | ✅ Sim |
| `category` | string | `"show"` (slug) | ✅ Sim |
| `categoryId` | uuid | `"abc-123"` | ✅ Sim (alternativa) |
| `bairroId` | uuid | `"abc-123"` | ✅ Sim |
| `venueId` | uuid | `"abc-123"` | ✅ Sim |
| `organizerId` | uuid | `"abc-123"` | ✅ Sim |
| `datePreset` | enum | `"today"`, `"tomorrow"`, `"weekend"`, `"this_week"`, `"this_month"` | ✅ Sim |
| `fromDate` | date | `"2026-02-01"` | ✅ Sim |
| `toDate` | date | `"2026-02-28"` | ✅ Sim |
| `price` | enum | `"free"`, `"paid"` | ✅ Sim |
| `priceMin` | float | `0` | ✅ Sim |
| `priceMax` | float | `100` | ✅ Sim |
| `search` | string | `"carnaval"` | ✅ Sim |
| `featured` | boolean | `true` | ✅ Sim |
| `orderBy` | string | `"startDateTime"`, `"popularityScore"`, `"createdAt"` | ✅ Sim |
| `order` | string | `"asc"`, `"desc"` | ✅ Sim |
| `tags` | string | `"gratuito,familia"` (comma-separated) | ✅ Sim |
| `ageRating` | string | `"livre"`, `"10"`, `"12"`, `"14"`, `"16"`, `"18"` | ✅ Sim |
| `timeOfDay` | enum | `"morning"`, `"afternoon"`, `"evening"`, `"night"` | ✅ Sim |
| `accessibility` | boolean | `true` | ✅ Sim |
| `parking` | boolean | `true` | ✅ Sim |
| `outdoor` | boolean | `true` | ✅ Sim |
| `kids` | boolean | `true` | ✅ Sim |
| `hasSchedule` | boolean | `true` | ✅ Sim (V2) |
| `hasTickets` | boolean | `true` | ✅ Sim (V2) |
| `multiDay` | boolean | `true` | ✅ Sim (V2) |
| `minCapacity` | int | `100` | ✅ Sim (V2) |
| `withRsvp` | boolean | `true` | ✅ Sim (V2) |

**Exemplo de uso:**
```
GET /events?datePreset=weekend&price=free&category=show&perPage=20&orderBy=popularityScore
```

---

## 4. Campos de Evento

### 4.1 Campos obrigatórios vs opcionais

| Campo | Pode ser `null`? | Observação |
|-------|------------------|------------|
| `id` | ❌ Não | UUID obrigatório |
| `title` | ❌ Não | Sempre presente |
| `slug` | ❌ Não | Sempre presente |
| `descriptionShort` | ❌ Não | Sempre presente |
| `descriptionFull` | ✅ Sim | Pode ser null |
| `startDateTime` | ❌ Não | ISO 8601 |
| `endDateTime` | ❌ Não | ISO 8601 |
| `coverImage` | ✅ Sim | Pode ser null |
| `bannerImage` | ✅ Sim | Pode ser null |
| `bannerImageMobile` | ✅ Sim | Pode ser null |
| `venue` | ✅ Sim | Pode ser null (evento online) |
| `ticket` | ✅ Sim | Pode ser null (sem info de ingresso) |
| `category` | ❌ Não | Sempre presente (obrigatório) |
| `tags` | ✅ Sim | Array vazio `[]` se não houver |
| `schedule` | ✅ Sim | Objeto com `items: []` se não houver |
| `organizer` | ✅ Sim | Pode ser null |
| `flags` | ❌ Não | Sempre presente com defaults |
| `rsvp` | ❌ Não | Sempre presente (counts podem ser 0) |
| `isFavorited` | ✅ Sim | `null` para usuários anônimos |
| `userRsvpStatus` | ✅ Sim | `null` para usuários anônimos |

---

### 4.2 Campos V2 novos

| Campo | ✅ Implementado | Tipo | Descrição |
|-------|-----------------|------|-----------|
| `bannerImage` | ✅ Sim | `string \| null` | Em `media.bannerImage` |
| `bannerImageMobile` | ✅ Sim | `string \| null` | Em `media.bannerImageMobile` |
| `eventType` | ✅ Sim | `'single' \| 'multi_day' \| 'recurring'` | Tipo do evento |
| `totalDays` | ✅ Sim | `number` | 1 para single, 2+ para multi_day |
| `edition` | ✅ Sim | `string \| null` | Ex: "5ª Edição", "Ano II" |
| `expectedAudience` | ✅ Sim | `number \| null` | Público esperado |
| `confirmedAttendance` | ✅ Sim | `number` | Confirmados via RSVP |

**Estrutura schedule para multi-day:**
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
        "startTime": "18:00",
        "endTime": "23:59",
        "description": "...",
        "coverImage": "https://...",
        "items": [
          {
            "id": "uuid",
            "time": "19:00",
            "title": "DJ Set Abertura",
            "stage": "Palco Principal",
            "performer": "DJ Local"
          }
        ]
      }
    ]
  }
}
```

---

## 5. RSVP e Favoritos

### 5.1 RSVP no evento

✅ **Sim, o status do usuário vem no objeto do evento:**

```json
{
  "id": "uuid",
  "title": "Festival de Verão",
  
  // Campos de RSVP
  "userRsvpStatus": "going",  // ou "maybe", "not_going", null
  "isFavorited": true,        // ou false, null
  
  // Contagem agregada
  "rsvp": {
    "count": 195,             // total going + maybe
    "goingCount": 150,
    "maybeCount": 45,
    "attendees": [            // primeiros 10 confirmados
      { "id": "uuid", "nome": "João", "avatarUrl": "..." }
    ],
    "userStatus": "going"     // redundante com userRsvpStatus
  }
}
```

---

### 5.2 Endpoints de RSVP

| Endpoint | ✅ Implementado | Auth | Descrição |
|----------|-----------------|------|-----------|
| `GET /events/{id}/rsvp` | ✅ Sim | 🔐 | Ver meu RSVP |
| `POST /events/{id}/rsvp` | ✅ Sim | 🔐 | Criar RSVP |
| `PUT /events/{id}/rsvp` | ✅ Sim | 🔐 | Atualizar RSVP |
| `DELETE /events/{id}/rsvp` | ✅ Sim | 🔐 | Cancelar RSVP |
| `GET /events/{id}/attendees` | ✅ Sim | 🔓 | Listar confirmados (público) |
| `POST /events/{id}/favorite` | ✅ Sim | 🔐 | Toggle favorito |

**Body para POST/PUT `/events/{id}/rsvp`:**
```json
{
  "status": "going",     // "going" | "maybe" | "not_going"
  "guests_count": 2,     // opcional, default 1
  "notes": "Levarei 2 amigos"  // opcional
}
```

**Resposta:**
```json
{
  "data": {
    "id": "uuid",
    "status": "going",
    "guestsCount": 2,
    "notes": "Levarei 2 amigos",
    "createdAt": "2026-02-01T10:00:00-03:00"
  },
  "success": true,
  "message": "Presença confirmada!"
}
```

---

## 6. Autenticação

### 6.1 Endpoints públicos vs autenticados

| Endpoint | Auth | Observação |
|----------|------|------------|
| `GET /events` | 🔓 Público | Com auth: retorna `isFavorited`, `userRsvpStatus` |
| `GET /events/{id}` | 🔓 Público | Com auth: retorna dados do usuário |
| `GET /events/home-featured` | 🔓 Público | Cache otimizado |
| `GET /events/calendar-summary` | 🔓 Público | Cache otimizado |
| `GET /events/upcoming` | 🔓 Público | |
| `GET /events/today` | 🔓 Público | |
| `GET /events/weekend` | 🔓 Público | |
| `GET /events/featured` | 🔓 Público | |
| `GET /events/search` | 🔓 Público | |
| `GET /events/categories` | 🔓 Público | |
| `GET /events/tags` | 🔓 Público | |
| `GET /events/{id}/attendees` | 🔓 Público | |
| `POST /events/{id}/rsvp` | 🔐 **Auth** | Bearer token |
| `PUT /events/{id}/rsvp` | 🔐 **Auth** | Bearer token |
| `DELETE /events/{id}/rsvp` | 🔐 **Auth** | Bearer token |
| `POST /events/{id}/favorite` | 🔐 **Auth** | Bearer token |
| `GET /users/me/events` | 🔐 **Auth** | Meus RSVPs |
| `GET /users/me/favorites/events` | 🔐 **Auth** | Meus favoritos |

**Header de autenticação:**
```
Authorization: Bearer <token>
```

---

## 7. URL Base e Versionamento

| Ambiente | URL | Status |
|----------|-----|--------|
| **Produção** | `https://api.natalemtijucas.com.br/api/v1` | ✅ Ativa |
| **Staging** | `https://staging-api.natalemtijucas.com.br/api/v1` | ⚠️ Em configuração |
| **Local** | `http://localhost:8000/api/v1` | ✅ Disponível |

> **Nota:** A URL de produção está correta. Após deploy das alterações V2, os novos endpoints estarão disponíveis.

---

## 8. TypeScript Types - Referência

```typescript
// Tipos principais para migração

interface EventListItem {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  startDateTime: string; // ISO 8601
  endDateTime: string;
  venue: {
    id: string;
    name: string;
    bairro: { id: string; nome: string } | null;
  } | null;
  category: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
  ticket: {
    type: 'free' | 'paid' | 'donation';
    minPrice: number;
    maxPrice: number | null;
  } | null;
  tags: { id: string; name: string; slug: string }[];
  isFeatured: boolean;
  popularityScore: number;
  // Campos de usuário (requerem auth)
  isFavorited: boolean | null;
  userRsvpStatus: 'going' | 'maybe' | 'not_going' | null;
}

interface EventDetail extends EventListItem {
  edition: string | null;
  descriptionShort: string;
  descriptionFull: string | null;
  eventType: 'single' | 'multi_day' | 'recurring';
  totalDays: number;
  expectedAudience: number | null;
  confirmedAttendance: number;
  media: {
    coverImage: string | null;
    bannerImage: string | null;
    bannerImageMobile: string | null;
    gallery: MediaItem[];
  };
  flags: {
    ageRating: string;
    ageRatingLabel: string;
    outdoor: boolean;
    accessibility: boolean;
    parking: boolean;
  };
  organizer: Organizer | null;
  schedule: Schedule;
  links: EventLinks;
  rsvp: RsvpSummary;
}

interface HomeFeaturedResponse {
  data: {
    highlight: HighlightEvent | null;
    today: HomeEventItem[];
    weekend: HomeEventItem[];
    upcoming: HomeEventItem[];
  };
  success: true;
}

interface CalendarSummaryResponse {
  data: Record<string, { count: number; hasHighlight: boolean }>;
  meta: { year: number; month: number; totalEvents: number };
  success: true;
}
```

---

## ✅ Checklist de Migração

Após ler este documento:

- [ ] Atualizar types TypeScript com as estruturas acima
- [ ] Ajustar serviço para `media.coverImage` em detalhes
- [ ] Usar `/home-featured` na home (substitui múltiplas chamadas)
- [ ] Usar `/calendar-summary` no calendário
- [ ] Implementar lógica de multi-day (`schedule.hasMultipleDays`)
- [ ] Tratar campos nullable com fallbacks
- [ ] Adicionar header `Authorization` quando usuário logado
- [ ] Testar filtros de listagem
- [ ] Remover dados mock

---

**Dúvidas adicionais?** Contatar equipe backend via Slack #dev-backend.
