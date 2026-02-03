# 📅 API de Agenda de Eventos - Documentação Frontend

> **Base URL:** `https://api.natalemtijucas.com.br/api/v1`  
> **Última atualização:** 2026-01-31

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [Endpoints Públicos](#endpoints-públicos)
4. [Endpoints Autenticados](#endpoints-autenticados)
5. [Schemas JSON](#schemas-json)
6. [Filtros Disponíveis](#filtros-disponíveis)
7. [Boas Práticas Frontend](#boas-práticas-frontend)
8. [Exemplos de Uso](#exemplos-de-uso)

---

## Visão Geral

A API de Eventos permite:
- 📋 Listar eventos com diversos filtros (data, categoria, bairro, preço, etc.)
- 🔍 Buscar eventos por texto
- 📅 Ver eventos por dia, semana, mês
- ⭐ Favoritar eventos (autenticado)
- ✅ Confirmar presença - RSVP (autenticado)
- 👥 Ver lista de participantes

### Padrão de Resposta

Todas as respostas seguem o padrão:

```json
{
  "data": [],           // Array de objetos ou objeto único
  "success": true,      // Boolean indicando sucesso
  "meta": {             // Metadados de paginação (quando aplicável)
    "total": 100,
    "page": 1,
    "perPage": 15,
    "lastPage": 7
  }
}
```

---

## Autenticação

### Endpoints Públicos
Não requerem autenticação. Se o usuário estiver autenticado, campos adicionais são retornados (`isFavorited`, `userRsvpStatus`).

### Endpoints Autenticados
Requerem header `Authorization: Bearer {token}` obtido via login.

```javascript
const headers = {
  'Authorization': `Bearer ${userToken}`,
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};
```

---

## Endpoints Públicos

### 1. Listar Eventos

```
GET /events
```

**Descrição:** Lista todos os eventos publicados com paginação e filtros.

**Query Parameters:**

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `perPage` | int | Itens por página (max: 50) | `?perPage=20` |
| `page` | int | Página atual | `?page=2` |
| `search` | string | Busca por texto | `?search=show` |
| `categoryId` | uuid | ID da categoria | `?categoryId=uuid` |
| `category` | string | Slug da categoria | `?category=show` |
| `bairroId` | uuid | ID do bairro | `?bairroId=uuid` |
| `venueId` | uuid | ID do local | `?venueId=uuid` |
| `organizerId` | uuid | ID do organizador | `?organizerId=uuid` |
| `tags` | string | Tags separadas por vírgula | `?tags=musica,gratuito` |
| `fromDate` | date | Data inicial (YYYY-MM-DD) | `?fromDate=2026-02-01` |
| `toDate` | date | Data final (YYYY-MM-DD) | `?toDate=2026-02-28` |
| `datePreset` | enum | Preset de data | `?datePreset=weekend` |
| `price` | enum | Tipo de preço: `free`, `paid` | `?price=free` |
| `priceMin` | float | Preço mínimo | `?priceMin=20` |
| `priceMax` | float | Preço máximo | `?priceMax=100` |
| `timeOfDay` | enum | Período: `morning`, `afternoon`, `night` | `?timeOfDay=night` |
| `ageRating` | string | Classificação etária | `?ageRating=livre` |
| `accessibility` | bool | Tem acessibilidade | `?accessibility=true` |
| `parking` | bool | Tem estacionamento | `?parking=true` |
| `outdoor` | bool | Ao ar livre | `?outdoor=true` |
| `kids` | bool | Para crianças | `?kids=true` |
| `featured` | bool | Em destaque | `?featured=true` |
| `orderBy` | enum | Ordenar por: `startDateTime`, `popularityScore`, `createdAt` | `?orderBy=popularityScore` |
| `order` | enum | Direção: `asc`, `desc` | `?order=desc` |

**Valores de `datePreset`:**
- `today` - Eventos de hoje
- `tomorrow` - Eventos de amanhã
- `weekend` - Eventos do fim de semana
- `this_week` - Eventos desta semana
- `this_month` - Eventos deste mês

**Resposta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Show do Artista",
      "slug": "show-do-artista",
      "category": {
        "id": "uuid",
        "name": "Show",
        "slug": "show",
        "icon": "music",
        "color": "#9333EA"
      },
      "tags": ["música", "ao ar livre"],
      "descriptionShort": "Uma noite especial...",
      "startDateTime": "2026-02-15T20:00:00-03:00",
      "endDateTime": "2026-02-16T02:00:00-03:00",
      "venue": {
        "id": "uuid",
        "name": "Praça Central",
        "bairro": {
          "id": "uuid",
          "nome": "Centro"
        }
      },
      "ticket": {
        "type": "paid",
        "minPrice": 50.00,
        "maxPrice": 150.00
      },
      "coverImage": "https://...",
      "flags": {
        "ageRating": "livre",
        "outdoor": true,
        "accessibility": true,
        "parking": true
      },
      "rsvpCount": 245,
      "popularityScore": 850,
      "isFeatured": true,
      "isFavorited": false,        // Só se autenticado
      "userRsvpStatus": "going"    // Só se autenticado
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "perPage": 15,
    "lastPage": 3
  }
}
```

---

### 2. Eventos Próximos

```
GET /events/upcoming
```

**Descrição:** Lista eventos futuros ordenados por data de início.

---

### 3. Eventos de Hoje

```
GET /events/today
```

**Descrição:** Lista eventos que acontecem hoje (incluindo eventos multi-dia).

---

### 4. Eventos do Fim de Semana

```
GET /events/weekend
```

**Descrição:** Lista eventos do próximo sábado e domingo.

---

### 5. Eventos em Destaque

```
GET /events/featured
```

**Descrição:** Lista eventos marcados como destaque, ordenados por popularidade.

---

### 6. Busca de Eventos

```
GET /events/search?q={termo}
```

**Parâmetros:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `q` | string | ✅ | Termo de busca (mínimo 2 caracteres) |

**Busca em:** título, descrição curta, descrição completa, nome do local, nome do organizador.

---

### 7. Eventos por Data

```
GET /events/date/{date}
```

**Parâmetros:**
| Parâmetro | Tipo | Formato | Exemplo |
|-----------|------|---------|---------|
| `date` | string | YYYY-MM-DD | `2026-02-15` |

**Descrição:** Lista eventos que acontecem em uma data específica.

---

### 8. Eventos por Mês

```
GET /events/month/{year}/{month}
```

**Parâmetros:**
| Parâmetro | Tipo | Exemplo |
|-----------|------|---------|
| `year` | int | `2026` |
| `month` | int | `2` (fevereiro) |

**Descrição:** Lista todos os eventos de um mês específico. Útil para calendários.

> **Dica:** Este endpoint retorna até 100 itens por página para facilitar renderização de calendários.

---

### 9. Eventos por Categoria

```
GET /events/category/{slug}
```

**Categorias disponíveis:**
| Slug | Nome | Ícone | Cor |
|------|------|-------|-----|
| `show` | Show | music | #9333EA |
| `festa` | Festa | party-popper | #F97316 |
| `cultura` | Cultura | theater | #3B82F6 |
| `infantil` | Infantil | baby | #10B981 |
| `gastronomico` | Gastronômico | utensils | #EF4444 |
| `esportes` | Esportes | trophy | #FBBF24 |
| `religioso` | Religioso | church | #8B5CF6 |
| `feira` | Feira | store | #EC4899 |
| `workshop` | Workshop | graduation-cap | #06B6D4 |
| `beneficente` | Beneficente | heart | #F43F5E |

---

### 10. Eventos por Bairro

```
GET /events/bairro/{bairroId}
```

**Descrição:** Lista eventos que acontecem em um bairro específico.

---

### 11. Eventos por Local

```
GET /events/venue/{venueId}
```

**Descrição:** Lista eventos que acontecem em um local específico.

---

### 12. Eventos por Tag

```
GET /events/tag/{slug}
```

**Tags disponíveis:**
| Slug | Nome | Destaque |
|------|------|----------|
| `ao-ar-livre` | ao ar livre | ✅ |
| `familia` | família | ✅ |
| `musica` | música | ✅ |
| `gratuito` | gratuito | ✅ |
| `food-truck` | food truck | |
| `criancas` | crianças | ✅ |
| `noturno` | noturno | |
| `fim-de-semana` | fim de semana | ✅ |
| `acessivel` | acessível | |
| `pet-friendly` | pet friendly | |
| `shows-ao-vivo` | shows ao vivo | ✅ |
| `gastronomia` | gastronomia | |
| `artesanato` | artesanato | |
| `cultural` | cultural | |
| `esportivo` | esportivo | |

---

### 13. Eventos por Organizador

```
GET /events/organizer/{organizerId}
```

**Descrição:** Lista eventos de um organizador específico.

---

### 14. Listar Categorias

```
GET /events/categories
```

**Descrição:** Retorna todas as categorias ativas com contagem de eventos.

**Resposta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Show",
      "slug": "show",
      "description": "Shows musicais, bandas, DJs",
      "icon": "music",
      "color": "#9333EA",
      "eventsCount": 12
    }
  ],
  "success": true
}
```

---

### 15. Listar Tags

```
GET /events/tags
```

**Descrição:** Retorna todas as tags ordenadas por uso.

**Resposta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "música",
      "slug": "musica",
      "color": "#9333EA",
      "isFeatured": true,
      "usageCount": 45
    }
  ],
  "success": true
}
```

---

### 16. Tags em Alta

```
GET /events/tags/trending
```

**Descrição:** Retorna as 10 tags mais usadas nos últimos 30 dias.

---

### 17. Detalhes do Evento

```
GET /events/{eventId}
```

**Descrição:** Retorna informações completas de um evento.

**Resposta:**
```json
{
  "data": {
    "id": "uuid",
    "title": "Festival de Música",
    "slug": "festival-de-musica",
    "category": {
      "id": "uuid",
      "name": "Show",
      "slug": "show",
      "description": "Shows musicais",
      "icon": "music",
      "color": "#9333EA"
    },
    "tags": [
      { "id": "uuid", "name": "música", "slug": "musica", "color": "#9333EA", "isFeatured": true }
    ],
    "descriptionShort": "O maior festival da região!",
    "descriptionFull": "Descrição completa em markdown...",
    "startDateTime": "2026-02-15T18:00:00-03:00",
    "endDateTime": "2026-02-16T04:00:00-03:00",
    "venue": {
      "id": "uuid",
      "name": "Parque Municipal",
      "slug": "parque-municipal",
      "address": "Rua das Flores, 123, Centro",
      "bairro": { "id": "uuid", "nome": "Centro" },
      "geo": { "lat": -27.2345, "lng": -48.6789 },
      "capacity": 5000,
      "phone": "(48) 3333-4444",
      "website": "https://..."
    },
    "ticket": {
      "type": "paid",
      "minPrice": 80.00,
      "maxPrice": 250.00,
      "currency": "BRL",
      "purchaseUrl": "https://...",
      "purchaseInfo": "Vendas online e na bilheteria",
      "lots": [
        { "id": "uuid", "name": "1º Lote", "price": 80.00, "available": 150, "isActive": true },
        { "id": "uuid", "name": "2º Lote", "price": 120.00, "available": 500, "isActive": false }
      ]
    },
    "links": {
      "instagram": "https://instagram.com/...",
      "whatsapp": "https://wa.me/...",
      "website": "https://...",
      "facebook": null,
      "youtube": null,
      "tiktok": null,
      "other": [
        { "type": "ticket", "url": "https://...", "label": "Comprar Ingresso" }
      ]
    },
    "media": {
      "coverImage": "https://...",
      "gallery": [
        { "id": "uuid", "type": "image", "url": "https://...", "thumbnail": "https://...", "caption": "Palco principal" },
        { "id": "uuid", "type": "video", "url": "https://...", "thumbnail": "https://...", "caption": "Teaser" }
      ]
    },
    "schedule": [
      { "id": "uuid", "time": "18:00", "date": "2026-02-15", "title": "Abertura dos Portões" },
      { "id": "uuid", "time": "19:00", "date": "2026-02-15", "title": "DJ Abertura", "stage": "Palco Principal", "performer": "DJ Mix" },
      { "id": "uuid", "time": "21:00", "date": "2026-02-15", "title": "Show Principal", "stage": "Palco Principal", "performer": "Banda XYZ" }
    ],
    "flags": {
      "ageRating": "16",
      "ageRatingLabel": "16 anos",
      "outdoor": true,
      "accessibility": true,
      "parking": true
    },
    "organizer": {
      "id": "uuid",
      "name": "Produtora ABC",
      "slug": "produtora-abc",
      "avatar": "https://...",
      "instagram": "@produtorabc",
      "whatsapp": "https://wa.me/...",
      "website": "https://...",
      "isVerified": true
    },
    "rsvp": {
      "count": 1250,
      "goingCount": 980,
      "maybeCount": 270,
      "attendees": [
        { "id": "uuid", "nome": "João S.", "avatarUrl": "https://..." },
        { "id": "uuid", "nome": "Maria L.", "avatarUrl": null }
      ],
      "userStatus": "going"    // Só se autenticado
    },
    "popularityScore": 2500,
    "isFeatured": true,
    "status": "published",
    "createdAt": "2026-01-15T10:00:00-03:00",
    "updatedAt": "2026-01-30T15:30:00-03:00",
    "isFavorited": true,        // Só se autenticado
    "userRsvpStatus": "going"   // Só se autenticado
  },
  "success": true
}
```

---

### 18. Lista de Participantes

```
GET /events/{eventId}/attendees
```

**Descrição:** Lista pública de pessoas que confirmaram presença.

**Query Parameters:**
| Parâmetro | Tipo | Default | Descrição |
|-----------|------|---------|-----------|
| `perPage` | int | 20 | Itens por página (max: 50) |

**Resposta:**
```json
{
  "data": {
    "total": 1250,
    "goingCount": 980,
    "maybeCount": 270,
    "attendees": [
      { "id": "uuid", "nome": "João S.", "avatarUrl": "https://...", "guestsCount": 2 },
      { "id": "uuid", "nome": "Maria L.", "avatarUrl": null, "guestsCount": 1 }
    ]
  },
  "meta": {
    "page": 1,
    "perPage": 20,
    "lastPage": 49
  },
  "success": true
}
```

---

## Endpoints Autenticados

> ⚠️ Requerem header `Authorization: Bearer {token}`

### 1. Ver Meu RSVP

```
GET /events/{eventId}/rsvp
```

**Descrição:** Retorna a confirmação do usuário para um evento.

**Resposta (se confirmou):**
```json
{
  "data": {
    "id": "uuid",
    "eventId": "uuid",
    "status": "going",
    "statusLabel": "Vou",
    "guestsCount": 2,
    "notes": "Vou levar minha esposa",
    "createdAt": "2026-01-20T10:00:00-03:00",
    "updatedAt": "2026-01-20T10:00:00-03:00"
  },
  "success": true
}
```

**Resposta (se não confirmou):**
```json
{
  "data": null,
  "success": true,
  "message": "Você ainda não confirmou presença neste evento."
}
```

---

### 2. Confirmar Presença (RSVP)

```
POST /events/{eventId}/rsvp
```

**Body:**
```json
{
  "status": "going",      // "going" | "maybe" | "not_going"
  "guestsCount": 2,       // Opcional, default: 1, max: 10
  "notes": "Observação"   // Opcional, max: 500 caracteres
}
```

**Resposta (201):**
```json
{
  "data": {
    "id": "uuid",
    "eventId": "uuid",
    "status": "going",
    "statusLabel": "Vou",
    "guestsCount": 2,
    "notes": "Observação",
    "createdAt": "2026-01-31T10:00:00-03:00"
  },
  "success": true,
  "message": "Presença confirmada! Nos vemos lá! 🎉"
}
```

**Erros:**
- `409` - Já confirmou presença (use PUT para atualizar)
- `422` - Evento já encerrado

---

### 3. Atualizar RSVP

```
PUT /events/{eventId}/rsvp
```

**Body:**
```json
{
  "status": "maybe",
  "guestsCount": 1
}
```

---

### 4. Cancelar RSVP

```
DELETE /events/{eventId}/rsvp
```

**Resposta:**
```json
{
  "success": true,
  "message": "Confirmação cancelada."
}
```

---

### 5. Favoritar/Desfavoritar

```
POST /events/{eventId}/favorite
```

**Descrição:** Toggle - adiciona ou remove dos favoritos.

**Resposta:**
```json
{
  "data": {
    "isFavorited": true
  },
  "success": true,
  "message": "Evento adicionado aos favoritos! ⭐"
}
```

---

### 6. Meus Eventos (RSVPs)

```
GET /users/me/events
```

**Query Parameters:**
| Parâmetro | Tipo | Default | Valores |
|-----------|------|---------|---------|
| `status` | string | `going` | `going`, `maybe`, `not_going`, `all` |
| `timeframe` | string | `upcoming` | `upcoming`, `past`, `all` |
| `perPage` | int | 15 | max: 50 |

**Resposta:**
```json
{
  "data": [
    {
      "event": { /* EventListResource */ },
      "rsvp": {
        "status": "going",
        "guestsCount": 2,
        "createdAt": "2026-01-20T10:00:00-03:00"
      }
    }
  ],
  "meta": { /* paginação */ },
  "success": true
}
```

---

### 7. Meus Favoritos

```
GET /users/me/favorites/events
```

**Query Parameters:**
| Parâmetro | Tipo | Default | Valores |
|-----------|------|---------|---------|
| `timeframe` | string | `upcoming` | `upcoming`, `past`, `all` |
| `perPage` | int | 15 | max: 50 |

---

## Schemas JSON

### EventListItem (para listagens)

```typescript
interface EventListItem {
  id: string;
  title: string;
  slug: string;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
  } | null;
  tags: string[];
  descriptionShort: string;
  startDateTime: string;  // ISO 8601
  endDateTime: string;    // ISO 8601
  venue: {
    id: string;
    name: string;
    bairro: { id: string; nome: string } | null;
  } | null;
  ticket: {
    type: 'free' | 'paid';
    minPrice: number;
    maxPrice: number | null;
  } | null;
  coverImage: string | null;
  flags: {
    ageRating: string;
    outdoor: boolean;
    accessibility: boolean;
    parking: boolean;
  };
  rsvpCount: number;
  popularityScore: number;
  isFeatured: boolean;
  isFavorited: boolean | null;      // null se não autenticado
  userRsvpStatus: string | null;    // null se não autenticado
}
```

### Category

```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  eventsCount: number;
}
```

### Tag

```typescript
interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  isFeatured: boolean;
  usageCount: number;
}
```

### Venue

```typescript
interface Venue {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  bairro: { id: string; nome: string } | null;
  geo: { lat: number; lng: number } | null;
  capacity: number | null;
  phone: string | null;
  website: string | null;
}
```

### RsvpStatus

```typescript
type RsvpStatus = 'going' | 'maybe' | 'not_going';
```

### AgeRating

```typescript
type AgeRating = 'livre' | '10' | '12' | '14' | '16' | '18';
```

---

## Filtros Disponíveis

### Combinando Filtros

Todos os filtros podem ser combinados:

```
GET /events?category=show&bairroId=uuid&price=free&datePreset=weekend&orderBy=popularityScore
```

### Hierarquia de Filtros de Data

O filtro `datePreset` tem precedência. Se não for especificado, usa `fromDate` e `toDate`. Se nenhum for especificado, retorna apenas eventos futuros (upcoming).

### Cache de Filtros Populares

Recomendamos cachear no frontend os resultados de:
- `/events/categories` (5 minutos)
- `/events/tags` (5 minutos)
- `/events/featured` (2 minutos)

---

## Boas Práticas Frontend

### 1. Otimização de Requisições

```javascript
// ❌ Evite
const events = await fetch('/events?perPage=100');

// ✅ Prefira paginação
const events = await fetch('/events?perPage=15&page=1');
```

### 2. Cache Local

```javascript
// Cachear categorias e tags
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function getCategories() {
  const cached = localStorage.getItem('event_categories');
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
  }
  
  const response = await fetch('/api/v1/events/categories');
  const { data } = await response.json();
  
  localStorage.setItem('event_categories', JSON.stringify({
    data,
    timestamp: Date.now()
  }));
  
  return data;
}
```

### 3. Loading States

```javascript
// Skeleton loading para listas
<EventCardSkeleton count={6} />

// Infinite scroll para listas grandes
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['events'],
  queryFn: ({ pageParam = 1 }) => fetchEvents({ page: pageParam }),
  getNextPageParam: (lastPage) => 
    lastPage.meta.page < lastPage.meta.lastPage 
      ? lastPage.meta.page + 1 
      : undefined,
});
```

### 4. Favoritos Otimista

```javascript
// Atualizar UI imediatamente, reverter se falhar
const toggleFavorite = async (eventId) => {
  // Atualiza estado local imediatamente
  setIsFavorited(!isFavorited);
  
  try {
    await fetch(`/events/${eventId}/favorite`, { method: 'POST' });
  } catch (error) {
    // Reverte se falhar
    setIsFavorited(!isFavorited);
    toast.error('Erro ao favoritar');
  }
};
```

### 5. Formatação de Datas

```javascript
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function formatEventDate(startDateTime: string) {
  const date = new Date(startDateTime);
  
  if (isToday(date)) return `Hoje, ${format(date, 'HH:mm')}`;
  if (isTomorrow(date)) return `Amanhã, ${format(date, 'HH:mm')}`;
  if (isThisWeek(date)) return format(date, "EEEE, HH:mm", { locale: ptBR });
  
  return format(date, "dd 'de' MMMM, HH:mm", { locale: ptBR });
}

// "Hoje, 20:00"
// "Amanhã, 19:30"
// "sábado, 21:00"
// "15 de fevereiro, 20:00"
```

### 6. Formatação de Preços

```javascript
function formatPrice(ticket) {
  if (ticket.type === 'free') return 'Gratuito';
  
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  
  if (!ticket.maxPrice || ticket.minPrice === ticket.maxPrice) {
    return formatter.format(ticket.minPrice);
  }
  
  return `${formatter.format(ticket.minPrice)} - ${formatter.format(ticket.maxPrice)}`;
}

// "Gratuito"
// "R$ 50,00"
// "R$ 50,00 - R$ 150,00"
```

### 7. Classificação Etária

```javascript
const ageRatingColors = {
  'livre': '#10B981',   // Verde
  '10': '#3B82F6',      // Azul
  '12': '#FBBF24',      // Amarelo
  '14': '#F97316',      // Laranja
  '16': '#EF4444',      // Vermelho
  '18': '#111827',      // Preto
};

function AgeRatingBadge({ rating }) {
  return (
    <span 
      className="px-2 py-1 rounded text-white text-xs font-bold"
      style={{ backgroundColor: ageRatingColors[rating] }}
    >
      {rating === 'livre' ? 'L' : rating}
    </span>
  );
}
```

### 8. Tratamento de Erros

```javascript
async function fetchEvents(filters) {
  try {
    const response = await fetch(`/api/v1/events?${new URLSearchParams(filters)}`);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado
        await refreshToken();
        return fetchEvents(filters);
      }
      throw new Error('Erro ao carregar eventos');
    }
    
    return response.json();
  } catch (error) {
    // Log para debugging
    console.error('Fetch events error:', error);
    
    // Retorna estrutura vazia para não quebrar UI
    return { data: [], meta: { total: 0, page: 1, perPage: 15, lastPage: 1 } };
  }
}
```

---

## Exemplos de Uso

### Página Inicial (Home)

```javascript
// Carregar dados em paralelo
const [featured, categories, today, weekend] = await Promise.all([
  fetch('/api/v1/events/featured?perPage=6'),
  fetch('/api/v1/events/categories'),
  fetch('/api/v1/events/today?perPage=4'),
  fetch('/api/v1/events/weekend?perPage=4')
]);
```

### Calendário Mensal

```javascript
// Buscar todos os eventos do mês
const events = await fetch('/api/v1/events/month/2026/2?perPage=100');

// Agrupar por dia
const eventsByDay = events.data.reduce((acc, event) => {
  const day = new Date(event.startDateTime).getDate();
  if (!acc[day]) acc[day] = [];
  acc[day].push(event);
  return acc;
}, {});
```

### Filtros Avançados

```javascript
const [filters, setFilters] = useState({
  category: null,
  bairroId: null,
  price: null,
  datePreset: 'upcoming',
  tags: [],
  accessibility: false,
  kids: false,
});

// Construir query string
const queryParams = new URLSearchParams();
Object.entries(filters).forEach(([key, value]) => {
  if (value !== null && value !== false && value.length > 0) {
    if (Array.isArray(value)) {
      queryParams.set(key, value.join(','));
    } else {
      queryParams.set(key, value);
    }
  }
});

const events = await fetch(`/api/v1/events?${queryParams}`);
```

---

## Suporte

Em caso de dúvidas ou problemas, entre em contato com a equipe de backend.

**Versão da API:** 1.0  
**Última atualização:** 2026-01-31
