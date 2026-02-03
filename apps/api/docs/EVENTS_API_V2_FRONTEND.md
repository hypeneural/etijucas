# 📅 API de Agenda de Eventos V2 - Documentação Frontend

> **Base URL:** `https://api.natalemtijucas.com.br/api/v1`  
> **Versão:** 2.0  
> **Última atualização:** 2026-02-01

---

## 📋 Changelog V2

### Novos Endpoints
- `GET /events/home-featured` - Endpoint otimizado para home
- `GET /events/calendar-summary` - Resumo do calendário mensal

### Novos Campos
- `bannerImage` e `bannerImageMobile` - Imagens para destaque
- `eventType` - Tipo de evento: `single`, `multi_day`, `recurring`
- `totalDays` - Número de dias do evento
- `edition` - Edição do evento (ex: "5ª Edição")
- `expectedAudience` - Público esperado
- `confirmedAttendance` - Confirmados via RSVP

### Novos Filtros
- `hasSchedule=true` - Eventos com programação
- `hasTickets=true` - Eventos com ingressos
- `multiDay=true` - Apenas eventos multi-dia
- `minCapacity=100` - Venues com capacidade mínima
- `withRsvp=true` - Eventos com RSVP ativo

### Suporte Multi-dia
- Eventos podem ter múltiplos dias (`event_days`)
- Programação vinculada a cada dia específico

---

## 🏠 Endpoint para Home (NOVO)

### `GET /events/home-featured`

Endpoint otimizado que retorna todos os dados necessários para a home em uma única requisição.

**Resposta:**
```json
{
  "data": {
    "highlight": {
      "id": "uuid",
      "title": "Festival de Verão 2026",
      "slug": "festival-de-verao-2026",
      "bannerImage": "https://cdn.example.com/banner.jpg",
      "coverImage": "https://cdn.example.com/cover.jpg",
      "startDateTime": "2026-02-15T18:00:00-03:00",
      "venue": {
        "name": "Praça Central",
        "bairro": "Centro"
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
        "title": "Feira Gastronômica",
        "slug": "feira-gastronomica",
        "coverImage": "https://...",
        "startDateTime": "2026-02-01T12:00:00-03:00",
        "venue": { "name": "Praça do Dino", "bairro": "Centro" },
        "ticket": { "type": "free", "minPrice": 0 }
      }
    ],
    "weekend": [ /* mesma estrutura */ ],
    "upcoming": [ /* mesma estrutura */ ]
  },
  "success": true
}
```

**Vantagens:**
- ✅ Uma única requisição para a home
- ✅ Backend controla o que destacar
- ✅ Payload otimizado (menor que múltiplas requisições)
- ✅ Cache de 2 minutos para usuários anônimos

**Uso no Frontend:**
```javascript
// Home.tsx
const { data } = useQuery({
  queryKey: ['events', 'home-featured'],
  queryFn: () => fetch('/api/v1/events/home-featured').then(r => r.json()),
  staleTime: 2 * 60 * 1000, // 2 minutos
});

// Acessar dados
const { highlight, today, weekend, upcoming } = data.data;
```

---

## 📆 Endpoint de Calendário (NOVO)

### `GET /events/calendar-summary`

Retorna um resumo de quais dias do mês têm eventos, sem carregar todos os detalhes.

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `year` | int | ✅ | Ano (2020-2100) |
| `month` | int | ✅ | Mês (1-12) |

**Resposta:**
```json
{
  "data": {
    "2026-02-01": { "count": 3, "hasHighlight": true },
    "2026-02-02": { "count": 1, "hasHighlight": false },
    "2026-02-14": { "count": 8, "hasHighlight": true },
    "2026-02-15": { "count": 5, "hasHighlight": true }
  },
  "meta": {
    "year": 2026,
    "month": 2,
    "totalEvents": 17
  },
  "success": true
}
```

**Vantagens:**
- ✅ Payload 10x menor que carregar todos os eventos
- ✅ Cache de 5 minutos para usuários anônimos
- ✅ Indica quais dias têm eventos em destaque

**Uso no Frontend (Calendário):**
```javascript
// CalendarView.tsx
const { data } = useQuery({
  queryKey: ['events', 'calendar', year, month],
  queryFn: () => fetch(`/api/v1/events/calendar-summary?year=${year}&month=${month}`).then(r => r.json()),
});

// Renderizar pontos no calendário
const hasEvents = (day: number) => {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return data.data[dateStr]?.count > 0;
};

const isHighlight = (day: number) => {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return data.data[dateStr]?.hasHighlight;
};
```

---

## 🖼️ Campos de Mídia Atualizados

### Schema de Mídia
```typescript
interface EventMedia {
  coverImage: string | null;       // Imagem para cards (4:3 ou 1:1)
  bannerImage: string | null;      // Imagem wide para destaque (16:9 ou 21:9)
  bannerImageMobile: string | null; // Banner mobile (3:2)
  gallery: {
    id: string;
    type: 'image' | 'video';
    url: string;
    thumbnail: string | null;
    caption: string | null;
  }[];
}
```

**Uso de Imagens:**
```jsx
// EventDetailsPage.tsx - Banner no topo
<div className="hero-banner">
  <picture>
    <source media="(max-width: 768px)" srcSet={event.media.bannerImageMobile ?? event.media.bannerImage} />
    <img src={event.media.bannerImage ?? event.media.coverImage} alt={event.title} />
  </picture>
</div>

// EventCard.tsx - Cover para cards
<img src={event.coverImage} alt={event.title} />
```

---

## 📅 Eventos Multi-dia

### Schema de Evento com Dias
```typescript
interface Event {
  id: string;
  title: string;
  edition: string | null;      // "5ª Edição"
  eventType: 'single' | 'multi_day' | 'recurring';
  totalDays: number;           // 1 para single, 3+ para multi_day
  // ... outros campos
  
  schedule: {
    hasMultipleDays: boolean;
    totalDays: number;
    
    // Para eventos multi-dia (hasMultipleDays = true)
    days?: {
      dayNumber: number;        // 1, 2, 3...
      date: string;             // "2026-02-14"
      title: string;            // "Dia 1 - Abertura"
      startTime: string;        // "18:00"
      endTime: string;          // "23:00"
      description: string | null;
      coverImage: string | null;
      items: ScheduleItem[];    // Programação do dia
    }[];
    
    // Para eventos single-day (hasMultipleDays = false)
    items?: ScheduleItem[];
  };
}

interface ScheduleItem {
  id: string;
  time: string;               // "19:00"
  date: string | null;        // "2026-02-14"
  title: string;
  description: string | null;
  stage: string | null;       // "Palco Principal"
  performer: string | null;   // "Banda XYZ"
}
```

**Renderização Condicional:**
```jsx
// EventSchedule.tsx
function EventSchedule({ schedule }) {
  if (schedule.hasMultipleDays && schedule.days) {
    return (
      <Tabs defaultValue="day-1">
        <TabsList>
          {schedule.days.map(day => (
            <TabsTrigger key={day.dayNumber} value={`day-${day.dayNumber}`}>
              {day.title}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {schedule.days.map(day => (
          <TabsContent key={day.dayNumber} value={`day-${day.dayNumber}`}>
            <p className="text-sm text-muted">{day.date} • {day.startTime} - {day.endTime}</p>
            <ScheduleList items={day.items} />
          </TabsContent>
        ))}
      </Tabs>
    );
  }
  
  // Evento single-day
  return <ScheduleList items={schedule.items} />;
}
```

---

## 🔍 Novos Filtros

### Filtros V2
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `hasSchedule` | boolean | Apenas eventos com programação |
| `hasTickets` | boolean | Apenas eventos com ingressos |
| `multiDay` | boolean | Apenas eventos multi-dia (festivais) |
| `minCapacity` | int | Venues com capacidade mínima |
| `withRsvp` | boolean | Eventos com RSVP ativo |

**Exemplo de Uso:**
```
GET /events?multiDay=true&price=paid&orderBy=startDateTime

# Retorna apenas festivais pagos ordenados por data
```

---

## 📊 Campos V2 na Resposta

### Novos Campos em EventResource
```typescript
interface EventDetail {
  // Campos existentes...
  id: string;
  title: string;
  slug: string;
  // ...

  // NOVOS CAMPOS V2
  edition: string | null;          // "3ª Edição", "Ano II"
  eventType: 'single' | 'multi_day' | 'recurring';
  totalDays: number;
  expectedAudience: number | null; // Público esperado
  confirmedAttendance: number;     // Confirmados via RSVP
  
  // Mídia atualizada
  media: {
    coverImage: string | null;
    bannerImage: string | null;      // NOVO
    bannerImageMobile: string | null; // NOVO
    gallery: MediaItem[];
  };
  
  // Programação com multi-dia
  schedule: MultiDaySchedule;        // ATUALIZADO
}
```

---

## 🔄 Migração do Frontend

### Checklist de Atualização
- [ ] Atualizar tipos TypeScript com novos campos
- [ ] Usar novo endpoint `/home-featured` na home
- [ ] Usar novo endpoint `/calendar-summary` no calendário
- [ ] Adicionar suporte a banners na página de detalhes
- [ ] Implementar tabs de dias para eventos multi-dia
- [ ] Atualizar filtros com novas opções

### Backward Compatibility
- ✅ Todos os endpoints V1 continuam funcionando
- ✅ Campos V2 são opcionais (podem ser null)
- ✅ `schedule.items` funciona para eventos single-day

---

## 📞 Perguntas Frequentes

### 1. Quando usar banner vs cover?
- **coverImage**: Cards, listagens, thumbnails (ratio 4:3 ou 1:1)
- **bannerImage**: Hero da página de detalhes (ratio 16:9)
- **bannerImageMobile**: Hero em dispositivos móveis (ratio 3:2)

### 2. Como identificar um evento multi-dia?
```javascript
const isMultiDay = event.eventType === 'multi_day' && event.totalDays > 1;
```

### 3. Como otimizar o calendário?
Use `/calendar-summary` para renderizar os pontos e só carregue os detalhes ao clicar em um dia com `/events/date/{date}`.

### 4. Cache recomendado?
- `/home-featured`: 2 minutos
- `/calendar-summary`: 5 minutos
- `/events`: 1 minuto
- `/events/{id}`: 30 segundos

---

## 📜 Lista Completa de Endpoints

### Públicos (sem autenticação)
```
GET /events                          # Lista com filtros
GET /events/upcoming                 # Próximos
GET /events/today                    # Hoje
GET /events/weekend                  # Fim de semana
GET /events/featured                 # Em destaque
GET /events/home-featured            # V2: Otimizado para home
GET /events/calendar-summary         # V2: Resumo do calendário
GET /events/search?q=                # Busca
GET /events/date/{date}              # Por data
GET /events/month/{year}/{month}     # Por mês
GET /events/category/{slug}          # Por categoria
GET /events/bairro/{id}              # Por bairro
GET /events/venue/{id}               # Por local
GET /events/tag/{slug}               # Por tag
GET /events/organizer/{id}           # Por organizador
GET /events/categories               # Lista categorias
GET /events/tags                     # Lista tags
GET /events/tags/trending            # Tags em alta
GET /events/{event}                  # Detalhes
GET /events/{event}/attendees        # Participantes
```

### Autenticados (requer Bearer token)
```
GET     /events/{event}/rsvp         # Ver meu RSVP
POST    /events/{event}/rsvp         # Confirmar presença
PUT     /events/{event}/rsvp         # Atualizar RSVP
DELETE  /events/{event}/rsvp         # Cancelar RSVP
POST    /events/{event}/favorite     # Toggle favorito

GET /users/me/events                 # Meus RSVPs
GET /users/me/favorites/events       # Meus favoritos
```

---

**Suporte:** Em caso de dúvidas, contatar a equipe de backend.
