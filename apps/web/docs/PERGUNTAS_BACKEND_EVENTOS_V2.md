# Perguntas para o Backend - Migração API de Eventos V2

**Data:** 01/02/2026  
**Contexto:** Migração do frontend de dados mock para API real

---

## 1. Estrutura de Resposta dos Eventos

### 1.1 Campo `coverImage`
O campo da imagem de capa vem no **root do objeto** ou dentro de um objeto `media`?

```json
// Opção A - Root (como esperamos)
{ "id": "...", "coverImage": "https://..." }

// Opção B - Dentro de media
{ "id": "...", "media": { "coverImage": "https://..." } }
```

### 1.2 Campo `ticket.type`
O tipo de ingresso é **lowercase** ou **UPPERCASE**?

```json
// Opção A - lowercase
{ "ticket": { "type": "free" } }

// Opção B - UPPERCASE
{ "ticket": { "type": "FREE" } }
```

### 1.3 Estrutura do `venue`
Como vem a estrutura do local/bairro?

```json
// Opção A - Objeto aninhado bairro
{
  "venue": {
    "id": "uuid",
    "name": "Arena XYZ",
    "bairro": { "id": "uuid", "nome": "Centro" }
  }
}

// Opção B - String direta
{
  "venue": {
    "name": "Arena XYZ",
    "neighborhood": "Centro"
  }
}
```

### 1.4 Estrutura da `category`
A categoria vem como **objeto** ou **string enum**?

```json
// Opção A - Objeto
{ "category": { "id": "uuid", "name": "Shows", "slug": "shows" } }

// Opção B - String enum
{ "category": "SHOW" }
```

---

## 2. Endpoints V2 Novos

### 2.1 GET `/events/home-featured`
Este endpoint está implementado? Qual é o formato exato da resposta?

**Formato esperado:**
```json
{
  "data": {
    "highlight": { /* evento destaque principal com bannerImage */ },
    "today": [ /* eventos de hoje */ ],
    "weekend": [ /* eventos do fim de semana */ ],
    "upcoming": [ /* próximos eventos */ ]
  },
  "success": true
}
```

**Perguntas:**
- Qual o limite de eventos em cada seção?
- O `highlight` pode ser `null` se não houver destaque?
- Os eventos retornados são simplificados ou completos?

### 2.2 GET `/events/calendar-summary?year=&month=`
Este endpoint está implementado?

**Formato esperado:**
```json
{
  "data": {
    "2026-02-01": { "count": 3, "hasHighlight": true },
    "2026-02-05": { "count": 1, "hasHighlight": false }
  },
  "meta": { "year": 2026, "month": 2, "totalEvents": 15 },
  "success": true
}
```

---

## 3. Paginação e Filtros

### 3.1 Campos de paginação no `meta`
Quais campos exatamente vêm no meta de listagem?

```json
{
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 150,
    "lastPage": 8,
    "city": "Tijucas" // existe esse campo?
  }
}
```

### 3.2 Filtros suportados
Quais query params são suportados na listagem `/events`?

| Param | Tipo | Exemplo | Suportado? |
|-------|------|---------|------------|
| `page` | number | 1 | ? |
| `perPage` | number | 20 | ? |
| `category` | string | "shows" | ? |
| `bairroId` | uuid | "abc-123" | ? |
| `datePreset` | enum | "today" / "weekend" | ? |
| `fromDate` | date | "2026-02-01" | ? |
| `toDate` | date | "2026-02-28" | ? |
| `price` | enum | "free" / "paid" | ? |
| `search` | string | "carnaval" | ? |
| `featured` | boolean | true | ? |
| `orderBy` | string | "startDateTime" | ? |

---

## 4. Campos de Evento

### 4.1 Campos obrigatórios vs opcionais
Quais campos podem ser `null` na resposta?

| Campo | Pode ser null? |
|-------|----------------|
| `coverImage` | ? |
| `venue` | ? |
| `ticket` | ? |
| `category` | ? |
| `tags` | ? |
| `schedule` | ? |
| `organizer` | ? |
| `flags` | ? |

### 4.2 Campos V2 novos
Estes campos já estão implementados?

| Campo | Implementado? | Descrição |
|-------|---------------|-----------|
| `bannerImage` | ? | Banner wide para hero |
| `bannerImageMobile` | ? | Banner mobile |
| `eventType` | ? | 'single' / 'multi_day' / 'recurring' |
| `totalDays` | ? | Número de dias (multi-day) |
| `edition` | ? | Edição do evento (ex: "15ª") |
| `expectedAudience` | ? | Público esperado |
| `confirmedAttendance` | ? | Confirmados via RSVP |

---

## 5. RSVP e Favoritos

### 5.1 RSVP no evento
O status de RSVP do usuário vem no próprio objeto do evento?

```json
{
  "id": "...",
  "userRsvpStatus": "going", // ou null se não confirmou
  "rsvpCount": 150
}
```

### 5.2 Endpoints de RSVP
- `POST /events/{id}/rsvp` - Criar RSVP
- `PUT /events/{id}/rsvp` - Atualizar RSVP
- `DELETE /events/{id}/rsvp` - Cancelar RSVP
- `GET /events/{id}/attendees` - Listar confirmados

Todos estão implementados?

---

## 6. Autenticação

### 6.1 Endpoints públicos vs autenticados
Quais endpoints requerem autenticação?

| Endpoint | Auth? |
|----------|-------|
| `GET /events` | ? |
| `GET /events/{id}` | ? |
| `GET /events/home-featured` | ? |
| `GET /events/calendar-summary` | ? |
| `POST /events/{id}/rsvp` | ? |
| `POST /events/{id}/favorite` | ? |

---

## 7. URL Base e Versionamento

- **URL atual configurada:** `https://api.natalemtijucas.com.br/api/v1`
- Esta URL está correta para produção?
- Existe ambiente de staging para testes?

---

## Próximos Passos

Após respostas:
1. Ajustar tipos TypeScript conforme formato real da API
2. Atualizar serviço de eventos
3. Migrar componentes gradualmente
4. Remover dados mock

---

**Contato Frontend:** [preencher]  
**Prazo desejado:** [preencher]
