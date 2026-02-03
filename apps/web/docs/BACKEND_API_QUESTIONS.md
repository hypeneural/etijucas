# Documentação de Perguntas - API Forum (Boca no Trombone)

**Data:** 28/01/2026  
**Frontend:** eTijucas App  
**API:** `https://api.natalemtijucas.com.br/api/v1`

---

## 🔴 Problema Atual

Ao acessar `/topico/{uuid}` diretamente (ex: link compartilhado), a página mostra "Tópico não encontrado".

**Causa técnica:** O frontend busca o tópico apenas na store local (Zustand). Se o usuário não passou pela listagem antes, a store está vazia.

**Solução frontend:** Implementar fetch do tópico individual via API quando não encontrado na store.

---

## Perguntas para o Backend

### 1. Endpoint de Tópico Individual

| Pergunta | Contexto |
|----------|----------|
| O endpoint `GET /api/v1/forum/topics/{id}` existe e está funcional? | Precisamos buscar um tópico específico por UUID |
| Qual a estrutura exata do response? | Conferir se bate com nosso type `Topic` |
| O endpoint funciona para visitantes (não autenticados)? | Links compartilhados devem abrir sem login |
| Retorna 404 para tópicos deletados ou inexistentes? | Para diferenciar de erro de rede |

### 2. Listagem de Tópicos

| Pergunta | Contexto |
|----------|----------|
| O endpoint `GET /api/v1/forum/topics` está ativo? | Atualmente recebemos erro CORS |
| Quais filtros estão implementados? | Esperamos: `bairroId`, `categoria`, `search`, `page`, `perPage` |
| Como funciona a ordenação? | `orderBy=createdAt`, `order=desc`, etc. |
| Inclui metadados de paginação? | `total`, `page`, `lastPage`, etc. |

### 3. Comentários

| Pergunta | Contexto |
|----------|----------|
| `GET /api/v1/forum/topics/{id}/comments` retorna todos ou só raiz? | Precisamos saber se replies vêm aninhadas |
| Qual a estrutura de `parentId` para replies? | Para montar threads |
| Limite de profundidade de replies? | UI suporta até 2 níveis |

### 4. Interações (Like/Save/Report)

| Pergunta | Contexto |
|----------|----------|
| Os endpoints de like (`POST /topics/{id}/like`) são toggle? | Um único endpoint para curtir/descurtir |
| Qual o response esperado? | Ex: `{ liked: boolean, likesCount: number }` |
| Qual o rate limit para reports? | Para evitar spam |

### 5. Upload de Imagens

| Pergunta | Contexto |
|----------|----------|
| `POST /api/v1/forum/upload` está funcional? | Para anexar fotos em tópicos/comentários |
| Qual o limite de tamanho de arquivo? | Para validar no frontend |
| Formatos aceitos? | Ex: jpg, png, webp |
| Retorna URL absoluta ou relativa? | Para montar src da imagem |

---

## Sugestões de Melhorias na API

### 1. Documentação OpenAPI/Swagger
- Prover spec Swagger para todos endpoints do forum
- Incluir exemplos de request/response

### 2. Response Padronizado
```json
{
  "success": true,
  "data": { ... },
  "meta": { "total": 100, "page": 1 },
  "error": null
}
```

### 3. Filtros Avançados
- `hasImage=true` - apenas tópicos com foto
- `fromDate`/`toDate` - range de datas
- `trending` - ordenar por engajamento recente

### 4. Endpoints de Trending/Destaques
- `GET /forum/topics/trending` - mais curtidos da semana
- `GET /forum/topics/featured` - curados pelo admin

### 5. Notificações Push
- Webhook quando alguém responde ao tópico do usuário
- Webhook quando tópico atinge X curtidas

### 6. Cache Headers
- `Cache-Control` e `ETag` para listagens
- Permite stale-while-revalidate no frontend

### 7. Soft Delete com Flag
```json
{
  "id": "...",
  "deletedAt": null,
  "status": "active" | "pending" | "deleted"
}
```

### 8. Rate Limiting Transparente
- Headers `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Retornar 429 com `Retry-After`

---

## Schema Esperado pelo Frontend

### Topic

```typescript
interface Topic {
  id: string;                // UUID
  titulo: string;
  texto: string;
  categoria: 'reclamacao' | 'sugestao' | 'duvida' | 'alerta' | 'elogio' | 'outros';
  bairroId: string;
  fotoUrl?: string;          // URL da imagem anexada
  isAnon: boolean;
  autorNome?: string;        // null se anônimo
  autorId?: string;
  avatarUrl?: string;
  likesCount: number;
  commentsCount: number;
  liked: boolean;            // se o usuário logado curtiu
  isSaved: boolean;          // se o usuário salvou
  createdAt: string;         // ISO 8601
  updatedAt?: string;
}
```

### Comment

```typescript
interface Comment {
  id: string;
  topicId: string;
  parentId?: string;         // null = comentário raiz
  texto: string;
  imageUrl?: string;
  isAnon: boolean;
  autor: {
    id: string | null;
    nome: string;
    avatarUrl: string | null;
  };
  likesCount: number;
  liked: boolean;
  depth: number;             // 0 = raiz, 1 = reply
  createdAt: string;
}
```

---

## Próximos Passos Frontend

1. [ ] Implementar fetch de tópico individual quando não na store
2. [ ] Adicionar loading state para página de tópico
3. [ ] Tratar 404 vs erro de rede
4. [ ] Testar endpoints com Postman/Insomnia
