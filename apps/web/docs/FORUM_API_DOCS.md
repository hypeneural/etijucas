# 📚 Documentação Completa - API Forum (Boca no Trombone)

**Base URL:** `https://api.natalemtijucas.com.br/api/v1`  
**Última Atualização:** 28/01/2026  
**Status:** ✅ Todos os endpoints funcionais

---

## 📋 Índice

1. [Endpoints de Tópicos](#-endpoints-de-tópicos)
2. [Endpoints de Comentários](#-endpoints-de-comentários)
3. [Endpoints de Interações](#-endpoints-de-interações)
4. [Endpoint de Upload](#-endpoint-de-upload)
5. [Schemas TypeScript](#-schemas-typescript)
6. [Códigos de Erro](#-códigos-de-erro)

---

## 📝 Endpoints de Tópicos

### GET /forum/topics

Lista tópicos com filtros e paginação.

**Query Parameters:**

| Param | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `bairroId` | uuid | - | Filtrar por bairro |
| `categoria` | string | - | `reclamacao`, `sugestao`, `duvida`, `alerta`, `elogio`, `outros` |
| `search` | string | - | Busca em título e texto |
| `comFoto` | boolean | false | Apenas tópicos com foto |
| `orderBy` | string | `createdAt` | `createdAt`, `likesCount`, `commentsCount`, `hotScore` |
| `order` | string | `desc` | `asc` ou `desc` |
| `page` | int | 1 | Página atual |
| `perPage` | int | 15 | Itens por página (máx: 50) |

---

### GET /forum/topics/{id}

Obtém um tópico específico por UUID. **Funciona sem autenticação.**

---

### POST /forum/topics

Cria um novo tópico. 🔒 Autenticação obrigatória.

**Request Body:**

```json
{
  "titulo": "string (5-150 chars)",
  "texto": "string (10-5000 chars)",
  "categoria": "reclamacao | sugestao | duvida | alerta | elogio | outros",
  "bairroId": "uuid",
  "isAnon": false,
  "fotoUrl": "https://..." | null
}
```

---

## 💬 Endpoints de Comentários

### GET /forum/topics/{topicId}/comments

Lista comentários com replies aninhadas. Profundidade máxima: 2 níveis.

### POST /forum/topics/{topicId}/comments

Cria comentário. 🔒 Autenticação obrigatória.

---

## ❤️ Endpoints de Interações

| Endpoint | Descrição | Response |
|----------|-----------|----------|
| `POST /forum/topics/{id}/like` | Toggle like | `{ liked, likesCount }` |
| `POST /forum/topics/{id}/save` | Toggle salvar | `{ saved }` |
| `POST /forum/comments/{id}/like` | Toggle like | `{ liked, likesCount }` |
| `POST /forum/topics/{id}/report` | Denunciar | `{ success, message }` |

---

## 📤 Endpoint de Upload

### POST /forum/upload

- **Limite:** 5MB
- **Formatos:** jpeg, png, webp
- **Response:** `{ url, thumb, medium }` (URLs absolutas)

---

## 📐 Schemas TypeScript

```typescript
interface Topic {
  id: string;
  titulo: string;
  texto: string;
  categoria: TopicCategory;
  categoriaLabel: string;
  categoriaColor: string;
  bairroId: string;
  isAnon: boolean;
  fotoUrl: string | null;
  likesCount: number;
  commentsCount: number;
  status: 'active' | 'pending' | 'hidden' | 'deleted';
  liked: boolean | null;
  isSaved: boolean | null;
  autor: { id: string | null; nome: string; avatarUrl: string | null };
  bairro: { id: string; nome: string };
  createdAt: string;
  updatedAt: string | null;
}

interface Comment {
  id: string;
  topicId: string;
  parentId: string | null;
  texto: string;
  imageUrl: string | null;
  isAnon: boolean;
  likesCount: number;
  depth: number;
  liked: boolean;
  autor: { id: string | null; nome: string; avatarUrl: string | null };
  replies: Comment[];
  repliesCount: number;
  createdAt: string;
}
```

---

## ❌ Códigos de Erro

| Código | Significado |
|--------|-------------|
| 401 | Token inválido/ausente |
| 403 | Sem permissão |
| 404 | Não encontrado |
| 409 | Ação duplicada |
| 422 | Validação falhou |
| 429 | Rate limit |
