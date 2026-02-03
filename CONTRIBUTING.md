# Guia de Contribuição - ETijucas

> **Quick Reference**: Onde colocar cada coisa no monorepo.

---

## 🎯 Regra de Ouro

| Tipo de Código | Onde Colocar |
|----------------|--------------|
| **Regra de negócio** | `apps/api/app/Services/` ou `app/Actions/` |
| **Validação de dados** | `apps/api/app/Http/Requests/` |
| **Novo endpoint** | `apps/api/routes/api.php` + Controller |
| **Nova tela** | `apps/web/src/pages/` ou `src/screens/` |
| **Componente reutilizável** | `apps/web/src/components/ui/` |
| **Hook de dados** | `apps/web/src/hooks/` |
| **Tipo compartilhado (UI)** | `packages/shared/src/types/` |
| **Tipo da API** | `packages/sdk/src/` (gerado do OpenAPI) |

---

## 📁 Estrutura de Pastas

### Backend (`apps/api`) - Domain-Driven

```
app/
├── Domains/                    # ← NOVO: Código por feature
│   ├── Auth/
│   │   ├── Http/Controllers/
│   │   ├── Http/Requests/
│   │   ├── Actions/
│   │   └── ...
│   ├── Forum/
│   ├── Events/
│   └── Reports/
├── Http/
│   ├── Controllers/Api/        # Controllers legados (migrar para Domains/)
│   └── Requests/
├── Services/                   # Serviços compartilhados
├── Models/                     # Models compartilhados
└── Policies/
```

### Frontend (`apps/web`) - Feature Modules

```
src/
├── features/                   # ← NOVO: Código por feature
│   ├── auth/
│   │   ├── api/               # Hooks de query/mutation
│   │   ├── components/        # Componentes da feature
│   │   ├── pages/             # Páginas da feature
│   │   └── index.ts           # Re-exports
│   ├── forum/
│   ├── events/
│   └── reports/
├── pages/                      # Páginas legadas
├── screens/                    # Telas principais (migrar para features/)
├── components/
│   └── ui/                     # Componentes base compartilhados
├── hooks/                      # Hooks compartilhados
└── lib/
    └── logger.ts               # Logging centralizado
```

---

## Criando Nova Feature (make:crud)

1. Rode o gerador
```bash
pnpm make:crud --feature=forum --model=Topic --fields="title:string, content:text, user_id:foreign:users"
```

2. O que ele cria:
- Backend: Model, Migration, Controller, Requests, Resource, Collection, Policy, Test, Domain README/routes
- Frontend: schema Zod, hooks, form e pages
- Contratos: atualiza `contracts/features.yaml` e adiciona paths em `contracts/openapi.yaml`

3. Ajustes obrigatorios:
- Revisar `apps/api/routes/api.php` (auth vs public)
- Completar schemas e responses no OpenAPI
- Ligar pages no router (`apps/web/src/App.tsx`)
- Rodar `pnpm sdk:gen` e `pnpm mocks:gen`

---

## Criando Novo Endpoint

Use `pnpm make:crud` quando o endpoint fizer parte de um CRUD novo.

### 1. Adicionar rota
```php
// apps/api/routes/api.php
Route::prefix('v1')->group(function () {
    Route::get('minha-feature', [MinhaFeatureController::class, 'index']);
});
```

### 2. Criar Controller
```php
// apps/api/app/Http/Controllers/Api/MinhaFeatureController.php
class MinhaFeatureController extends Controller
{
    public function index(Request $request)
    {
        return MinhaFeatureResource::collection(MinhaFeature::all());
    }
}
```

### 3. Atualizar OpenAPI
```yaml
# contracts/openapi.yaml
/api/v1/minha-feature:
  get:
    summary: Lista minha feature
    responses:
      '200':
        description: Success
```

### 4. Regenerar SDK
```bash
pnpm sdk:gen
```

---
## 🖥️ Criando Nova Tela

### 1. Criar página
```tsx
// apps/web/src/pages/MinhaFeaturePage.tsx
export default function MinhaFeaturePage() {
  const { data, isLoading } = useMinhaFeatureQuery();
  // ...
}
```

### 2. Adicionar rota
```tsx
// apps/web/src/App.tsx
<Route path="/minha-feature" element={<MinhaFeaturePage />} />
```

### 3. Criar hook de dados
```tsx
// apps/web/src/hooks/useMinhaFeature.ts
export function useMinhaFeatureQuery() {
  return useQuery({
    queryKey: ['minha-feature', 'list'],
    queryFn: () => apiClient.get('/minha-feature'),
  });
}
```

---

## 📝 Convenções de Nomes

### Rotas API
```
/api/v1/{modulo}/{recurso}
/api/v1/forum/topics
/api/v1/events
/api/v1/users/me/avatar
```

### Query Keys (TanStack Query)
```ts
['forum', 'topics']           // lista
['forum', 'topics', id]       // detalhe
['events', 'list', filters]   // com filtros
```

### Hooks
```ts
useForumTopicsQuery()         // GET lista
useForumTopicQuery(id)        // GET único
useCreateTopicMutation()      // POST
useUpdateTopicMutation()      // PUT/PATCH
```

### Componentes
```
TopicCard.tsx                 // Card de tópico
TopicList.tsx                 // Lista de tópicos
CreateTopicForm.tsx           # Formulário
TopicDetailPage.tsx           // Página completa
```

---

## ✅ Checklist para Nova Feature

- [ ] Feature criada via `pnpm make:crud` (ou manual)
- [ ] Endpoint criado em `routes/api.php`
- [ ] Controller com Resource para transformar response
- [ ] FormRequest para validacao
- [ ] Policy para autorizacao (se aplicavel)
- [ ] OpenAPI atualizado em `contracts/openapi.yaml`
- [ ] SDK regenerado (`pnpm sdk:gen`)
- [ ] Mocks regenerados (`pnpm mocks:gen`)
- [ ] Hook de query/mutation criado
- [ ] Pagina/tela criada
- [ ] Rota adicionada no React Router
