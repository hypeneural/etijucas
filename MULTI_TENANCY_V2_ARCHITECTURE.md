# 🏛️ Multi-Tenancy V2: Contrato Definitivo & Roadmap de Implementação

> **Documento Técnico para o Time de Experts**  
> **Versão**: 2.0  
> **Data**: 06/02/2026  
> **Filosofia**: Tenant é contrato, não filtro. Módulo é gate, não tabela.

---

## 📐 Princípios Fundamentais

| Conceito | Definição | Anti-Pattern a Evitar |
|----------|-----------|----------------------|
| **Tenant** | Contrato de isolamento jurídico | "Só um where city_id" |
| **Módulo** | Gate de acesso (bloqueio de rota + UI) | "Só uma tabela city_modules" |
| **Bairro** | Chave de relevância e filtragem | "Texto do ViaCEP" |
| **Domínio** | Atalho para resolução | "A fonte da verdade" |
| **Canônico** | `/{uf}/{cidade}` sempre | "Depende do host" |

---

## 🔒 Invariantes do Sistema (Não Negociáveis)

Estas regras são **lei**. Qualquer código que viole deve falhar no build/review.

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. TODA request tem tenant resolvido OU falha 400/404              │
│     → Exceção: rotas globais explícitas (/api/v1/cities)            │
├─────────────────────────────────────────────────────────────────────┤
│  2. TODA escrita em tabela tenant-aware grava city_id do tenant     │
│     → NUNCA aceitar city_id vindo do cliente                        │
├─────────────────────────────────────────────────────────────────────┤
│  3. TODA leitura em tabela tenant-aware filtra por city_id default  │
│     → Bypass só via scope explícito (withoutTenant, forCity)        │
├─────────────────────────────────────────────────────────────────────┤
│  4. SE existe bairro_id, ELE DEVE pertencer ao mesmo city_id        │
│     → Validação em FormRequest/Policy, não "na mão"                 │
├─────────────────────────────────────────────────────────────────────┤
│  5. Módulo desativado = Rota BLOQUEADA + UI ESCONDIDA               │
│     → Middleware `module:slug` obrigatório                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Riscos Críticos a Atacar AGORA

| Risco | Impacto | Status Atual | Prioridade |
|-------|---------|--------------|------------|
| **Host header injection** | Tenant resolvido por host malicioso | ❌ Sem proteção | P0 |
| **User fora do scope** | Vazamento em admin/exports/buscas | ❌ User sem city_id | P0 |
| **Jobs/Queue sem tenant** | Cidade errada ou nula em jobs | ⚠️ Não testado | P0 |
| **Gates de módulo ausentes** | Cidade acessando feature desativada | ❌ Não implementado | P0 |
| **Frontend/SDK sem tenant** | Requests sem contexto de cidade | ❌ Não implementado | P0 |

---

## 🗄️ Banco de Dados: Melhorias para Robustez

### 1. Índices Compostos de Performance

```sql
-- Índices que realmente importam em escala
-- Aplicar em TODAS as tabelas tenant-aware

-- Paginação e "últimos" (feed principal)
CREATE INDEX idx_city_created ON topics (city_id, created_at DESC);
CREATE INDEX idx_city_created ON events (city_id, created_at DESC);
CREATE INDEX idx_city_created ON citizen_reports (city_id, created_at DESC);

-- Feed por bairro (feature "Perto de Mim")
CREATE INDEX idx_city_bairro_created ON topics (city_id, bairro_id, created_at DESC);
CREATE INDEX idx_city_bairro_created ON citizen_reports (city_id, bairro_id, created_at DESC);

-- Moderação e status
CREATE INDEX idx_city_status_created ON citizen_reports (city_id, status, created_at DESC);

-- Rotas por slug
CREATE INDEX idx_city_slug ON events (city_id, slug);
CREATE INDEX idx_city_slug ON bairros (city_id, slug);
```

### 2. Consistência city↔bairro (Anti-Drift)

**Regra**: Guardar `city_id` E `bairro_id` nas tabelas que usam bairro.

```php
// Em FormRequest (NÃO na controller)
public function rules(): array
{
    return [
        'bairro_id' => [
            'required',
            'uuid',
            Rule::exists('bairros', 'id')->where('city_id', Tenant::cityId()),
        ],
    ];
}
```

### 3. UUID em MariaDB: Performance

| Estratégia | Tamanho Índice | Status |
|------------|----------------|--------|
| CHAR(36) | Grande | ⚠️ Atual |
| BINARY(16) | Compacto | 🎯 Recomendado |
| ULID | Ordenado + Compacto | 💎 Ideal para escala |

> **Decisão**: Manter CHAR(36) para MVP Tijucas. Planejar migração para BINARY(16)/ULID na Fase 2.

### 4. UUID Determinístico por IBGE

```php
// Gerar UUID baseado no código IBGE (idempotente)
use Ramsey\Uuid\Uuid;

public static function deterministicId(int $ibgeCode): string
{
    $namespace = Uuid::NAMESPACE_OID;
    return Uuid::uuid5($namespace, "ibge:{$ibgeCode}")->toString();
}

// Resultado: Tijucas (4218004) sempre tem o mesmo UUID em dev/staging/prod
```

### 5. city_domains: Blindagem

```sql
ALTER TABLE city_domains ADD CONSTRAINT uq_city_primary 
    UNIQUE (city_id, is_primary) WHERE is_primary = true;

-- Garantir lowercase e sem duplicatas
ALTER TABLE city_domains ADD CONSTRAINT ck_domain_format 
    CHECK (domain = LOWER(domain) AND domain NOT LIKE 'www.%');
```

---

## 🔧 Backend Laravel: Organização

### 1. TenantContext: Segurança de Host

```php
// config/tenancy.php
return [
    'trusted_hosts' => [
        '*.cidadeconectada.app',
        'localhost',
        '127.0.0.1',
    ],
    
    'allow_header_override' => env('TENANCY_ALLOW_HEADER', false),
    
    'default_city_slug' => 'tijucas-sc',
];

// TenantContext.php - ADICIONAR
private function isHostTrusted(string $host): bool
{
    $trusted = config('tenancy.trusted_hosts', []);
    
    foreach ($trusted as $pattern) {
        if (fnmatch($pattern, $host)) {
            return true;
        }
    }
    
    // Se não está em trusted_hosts, deve estar em city_domains
    return CityDomain::where('domain', $host)->exists();
}

public function handle(Request $request, Closure $next): Response
{
    $host = $this->normalizeHost($request->getHost());
    
    // 🛡️ SEGURANÇA: Bloquear hosts maliciosos
    if (!$this->isHostTrusted($host)) {
        abort(400, 'Host não autorizado');
    }
    
    // ... resto do código
}
```

### 2. Trait BelongsToTenant: Mais Robusto

```php
trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        // 🚫 BLOQUEAR se tenant não está setado (exceto em comandos/seeds)
        static::creating(function ($model) {
            if (!app()->runningInConsole() && !Tenant::isSet()) {
                throw new TenantNotSetException('Tenant obrigatório para criar ' . static::class);
            }
            
            // Se veio city_id diferente do tenant → erro (proteção contra import errado)
            if (!empty($model->city_id) && $model->city_id !== Tenant::cityId()) {
                throw new TenantMismatchException('city_id não corresponde ao tenant');
            }
            
            $model->city_id ??= Tenant::cityId();
        });

        static::addGlobalScope('tenant', function (Builder $builder) {
            if (Tenant::cityId()) {
                $builder->where(
                    $builder->getModel()->getTable() . '.city_id',
                    Tenant::cityId()
                );
            }
        });
    }
    
    // Configurável por model (futuro)
    public function tenantColumn(): string
    {
        return 'city_id';
    }
}
```

### 3. User: Decisão Arquitetural

**Recomendação**: User tem `city_id` como cidade primária.

```php
// User.php - ADICIONAR
class User extends Authenticatable
{
    protected $fillable = [
        // ... existentes
        'city_id', // ← ADICIONAR: cidade primária do usuário
    ];

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    // Scope para queries admin
    public function scopeForCity($query, string $cityId)
    {
        return $query->where('city_id', $cityId);
    }
}
```

**Futuro**: Se precisar "seguir outras cidades":
```sql
CREATE TABLE user_city_follows (
    user_id UUID REFERENCES users(id),
    city_id UUID REFERENCES cities(id),
    PRIMARY KEY (user_id, city_id)
);
```

### 4. Middleware de Módulo (Gate)

```php
// app/Http/Middleware/ModuleGate.php
class ModuleGate
{
    public function handle(Request $request, Closure $next, string $moduleSlug): Response
    {
        if (!Tenant::moduleEnabled($moduleSlug)) {
            return response()->json([
                'success' => false,
                'error' => 'MODULE_DISABLED',
                'message' => "Módulo '{$moduleSlug}' não disponível para esta cidade",
            ], 404);
        }

        return $next($request);
    }
}

// Registrar no Kernel.php
protected $middlewareAliases = [
    'module' => \App\Http\Middleware\ModuleGate::class,
];

// Uso nas rotas
Route::prefix('forum')
    ->middleware(['auth:sanctum', 'module:forum'])
    ->group(function () {
        // ...
    });

Route::prefix('tourism')
    ->middleware(['module:tourism'])
    ->group(function () {
        // ...
    });
```

### 5. Tenant Helper: Expandir

```php
// app/Support/Tenant.php - EXPANDIR
class Tenant
{
    // ... métodos existentes
    
    public static function moduleEnabled(string $slug): bool
    {
        if (!self::isSet()) return false;
        
        return Cache::remember(
            "city:{$self::cityId()}:module:{$slug}",
            now()->addMinutes(15),
            fn () => CityModule::query()
                ->where('city_id', self::cityId())
                ->whereHas('module', fn ($q) => $q->where('slug', $slug))
                ->where('enabled', true)
                ->exists()
        );
    }
    
    public static function moduleSettings(string $slug): array
    {
        if (!self::isSet()) return [];
        
        return Cache::remember(
            "city:{$self::cityId()}:module:{$slug}:settings",
            now()->addMinutes(15),
            fn () => CityModule::query()
                ->where('city_id', self::cityId())
                ->whereHas('module', fn ($q) => $q->where('slug', $slug))
                ->first()?->settings ?? []
        );
    }
    
    public static function config(): array
    {
        if (!self::isSet()) return [];
        
        $city = self::city();
        
        return [
            'city' => [
                'id' => $city->id,
                'name' => $city->name,
                'slug' => $city->slug,
                'uf' => $city->uf,
                'status' => $city->status->value,
            ],
            'brand' => $city->brand_dto->toArray(),
            'modules' => self::enabledModules(),
            'geo' => [
                'defaultBairro' => Bairro::where('slug', 'centro')->first()?->id,
                'lat' => $city->lat,
                'lon' => $city->lon,
            ],
        ];
    }
    
    public static function enabledModules(): array
    {
        return Cache::remember(
            "city:{$self::cityId()}:modules",
            now()->addMinutes(15),
            fn () => CityModule::query()
                ->where('city_id', self::cityId())
                ->where('enabled', true)
                ->with('module:id,slug,name,icon')
                ->get()
                ->map(fn ($cm) => [
                    'slug' => $cm->module->slug,
                    'name' => $cm->module->name,
                    'icon' => $cm->module->icon,
                    'settings' => $cm->settings,
                ])
                ->toArray()
        );
    }
}
```

### 6. Endpoint /api/v1/config (Bootstrap)

```php
// routes/api.php
Route::get('/v1/config', [ConfigController::class, 'bootstrap'])
    ->middleware('tenant.context'); // Sem auth, mas com tenant

// app/Http/Controllers/Api/V1/ConfigController.php
class ConfigController extends Controller
{
    public function bootstrap(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => Tenant::config(),
            'meta' => [
                'request_id' => $request->header('X-Request-Id'),
                'cached_at' => now()->toISOString(),
            ],
        ])->header('Cache-Control', 'public, max-age=300');
    }
}
```

### 7. Observabilidade Obrigatória

```php
// app/Providers/AppServiceProvider.php
public function boot(): void
{
    // Adicionar tenant em TODOS os logs
    Log::shareContext([
        'tenant_city_id' => fn () => Tenant::cityId(),
        'tenant_slug' => fn () => Tenant::citySlug(),
    ]);
}

// Middleware para request_id
class RequestIdMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $request->header('X-Request-Id') ?? Str::uuid()->toString();
        
        Log::shareContext(['request_id' => $requestId]);
        
        $response = $next($request);
        
        return $response->header('X-Request-Id', $requestId);
    }
}
```

### 8. Jobs/Queue: Tenant Context

```php
// Trait para Jobs tenant-aware
trait TenantAwareJob
{
    protected ?string $tenantCityId = null;
    
    public function setTenantContext(): void
    {
        $this->tenantCityId = Tenant::cityId();
    }
    
    public function restoreTenantContext(): void
    {
        if ($this->tenantCityId) {
            $city = City::find($this->tenantCityId);
            app()->instance('tenant.city', $city);
        }
    }
}

// Uso em Jobs
class ProcessReportJob implements ShouldQueue
{
    use TenantAwareJob;
    
    public function __construct(public CitizenReport $report)
    {
        $this->setTenantContext();
    }
    
    public function handle(): void
    {
        $this->restoreTenantContext();
        
        // ... lógica do job
    }
}
```

---

## 🖥️ Frontend + SDK: Implementação

### 1. SDK com Tenant Obrigatório

```typescript
// packages/sdk/src/client.ts

export interface ClientConfig {
    baseUrl: string;
    getToken?: () => string | null;
    getCitySlug: () => string; // ← OBRIGATÓRIO
    onError?: (error: ApiClientError) => void;
}

export class ApiClient {
    private getCitySlug: () => string;
    
    constructor(config: ClientConfig) {
        if (!config.getCitySlug) {
            throw new Error('[SDK] getCitySlug é obrigatório para multi-tenancy');
        }
        this.getCitySlug = config.getCitySlug;
        // ...
    }
    
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const citySlug = this.getCitySlug();
        
        if (!citySlug) {
            throw new ApiClientError('Cidade não selecionada', 400, 'NO_TENANT');
        }
        
        const requestId = crypto.randomUUID();
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-City': citySlug,              // ← ADICIONAR
            'X-Request-Id': requestId,        // ← ADICIONAR
            'X-App-Version': APP_VERSION,     // ← ADICIONAR
            ...(token && { Authorization: `Bearer ${token}` }),
        };
        
        // ...
    }
}
```

### 2. Tenant Store

```typescript
// apps/web/src/store/useTenantStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CityConfig {
    id: string;
    name: string;
    slug: string;
    uf: string;
    status: 'staging' | 'active';
}

interface CityBrand {
    appName: string;
    primaryColor: string;
    logoUrl?: string;
}

interface Module {
    slug: string;
    name: string;
    icon: string;
    settings: Record<string, unknown>;
}

interface TenantState {
    city: CityConfig | null;
    brand: CityBrand | null;
    modules: Module[];
    isLoading: boolean;
    isBootstrapped: boolean;
    error: string | null;
    
    // Actions
    bootstrap: (citySlug: string) => Promise<void>;
    clear: () => void;
    isModuleEnabled: (slug: string) => boolean;
    getModuleSettings: (slug: string) => Record<string, unknown>;
}

export const useTenantStore = create<TenantState>()(
    persist(
        (set, get) => ({
            city: null,
            brand: null,
            modules: [],
            isLoading: false,
            isBootstrapped: false,
            error: null,
            
            bootstrap: async (citySlug: string) => {
                set({ isLoading: true, error: null });
                
                try {
                    const response = await fetch(`/api/v1/config`, {
                        headers: { 'X-City': citySlug },
                    });
                    
                    if (!response.ok) {
                        throw new Error('Cidade não encontrada');
                    }
                    
                    const { data } = await response.json();
                    
                    set({
                        city: data.city,
                        brand: data.brand,
                        modules: data.modules,
                        isLoading: false,
                        isBootstrapped: true,
                    });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Erro ao carregar',
                        isLoading: false,
                    });
                }
            },
            
            clear: () => set({
                city: null,
                brand: null,
                modules: [],
                isBootstrapped: false,
            }),
            
            isModuleEnabled: (slug: string) => {
                return get().modules.some(m => m.slug === slug);
            },
            
            getModuleSettings: (slug: string) => {
                return get().modules.find(m => m.slug === slug)?.settings ?? {};
            },
        }),
        {
            name: 'etijucas-tenant',
            partialize: (state) => ({
                city: state.city,
                brand: state.brand,
                modules: state.modules,
            }),
        }
    )
);
```

### 3. Bootstrap Flow no App

```typescript
// apps/web/src/App.tsx
import { useTenantStore } from '@/store/useTenantStore';

function App() {
    const { isBootstrapped, isLoading, error, bootstrap } = useTenantStore();
    
    useEffect(() => {
        const citySlug = resolveCityFromUrl(); // ou 'tijucas-sc' default
        
        if (!isBootstrapped) {
            bootstrap(citySlug);
        }
    }, []);
    
    if (isLoading) {
        return <SplashScreen />;
    }
    
    if (error) {
        return <CityNotFoundScreen />;
    }
    
    if (!isBootstrapped) {
        return <CitySelector />;
    }
    
    return <RouterProvider router={router} />;
}

function resolveCityFromUrl(): string {
    const path = window.location.pathname;
    const match = path.match(/^\/([a-z]{2})\/([a-z0-9-]+)/i);
    
    if (match) {
        return `${match[2]}-${match[1]}`; // "tijucas-sc"
    }
    
    return 'tijucas-sc'; // fallback
}
```

### 4. SDK Factory com Tenant

```typescript
// apps/web/src/api/client.ts
import { createApiClient } from '@repo/sdk';
import { useTenantStore } from '@/store/useTenantStore';

export const api = createApiClient({
    baseUrl: import.meta.env.VITE_API_URL || '',
    getToken: () => localStorage.getItem('accessToken'),
    getCitySlug: () => useTenantStore.getState().city?.slug ?? '',
    onTokenExpired: () => {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
    },
});
```

### 5. Router Canônico

```typescript
// apps/web/src/router.tsx
const router = createBrowserRouter([
    // Pattern canônico: /{uf}/{cidade}/...
    {
        path: '/:uf/:cidade',
        element: <AppLayout />,
        children: [
            { index: true, element: <HomePage /> },
            { path: 'forum', element: <ForumPage /> },
            { path: 'eventos', element: <EventsPage /> },
            // ...
        ],
    },
    
    // Redirect de domínio customizado para canônico (se necessário)
    {
        path: '/',
        element: <CityRedirect />, // Detecta cidade e redireciona
    },
]);
```

---

## ✅ Tasks: Ordem de Execução

### 🔴 P0 - Crítico (Esta Semana)

| # | Task | Área | Estimativa | Dependência |
|---|------|------|------------|-------------|
| 1 | Implementar blindagem de Host em `TenantContext` | Backend | 2h | - |
| 2 | Criar config `tenancy.trusted_hosts` | Backend | 30min | #1 |
| 3 | Modificar SDK para enviar `X-City` obrigatório | Frontend | 2h | - |
| 4 | Criar `useTenantStore` com bootstrap | Frontend | 3h | #3 |
| 5 | Criar endpoint `GET /api/v1/config` | Backend | 2h | - |
| 6 | Criar middleware `module:slug` para gates | Backend | 2h | - |
| 7 | Aplicar `module:slug` em todas as rotas de módulos | Backend | 1h | #6 |
| 8 | Expandir `Tenant::moduleEnabled()` e `config()` | Backend | 2h | #5 |
| 9 | Adicionar `city_id` ao modelo User | Backend | 1h | - |
| 10 | Criar migration para `users.city_id` | Backend | 30min | #9 |
| 11 | Adicionar logs com `tenant_city_id` e `request_id` | Backend | 1h | - |
| 12 | Criar trait `TenantAwareJob` para Jobs | Backend | 1h | - |

### 🟡 P1 - Alta Prioridade (Próxima Sprint)

| # | Task | Área | Estimativa | Dependência |
|---|------|------|------------|-------------|
| 13 | Criar tabela `trash_schedules` (migrar lixo) | Backend | 3h | - |
| 14 | Criar endpoint `/api/v1/trash-schedules` | Backend | 2h | #13 |
| 15 | Migrar frontend para buscar lixo da API | Frontend | 2h | #14 |
| 16 | Criar tabela `mass_schedules` (migrar missas) | Backend | 3h | - |
| 17 | Criar endpoint `/api/v1/mass-schedules` | Backend | 2h | #16 |
| 18 | Migrar frontend para buscar missas da API | Frontend | 2h | #17 |
| 19 | Adicionar `city_id` a `Vereador` e `Votacao` | Backend | 2h | - |
| 20 | Aplicar trait `BelongsToTenant` aos novos modelos | Backend | 1h | #19 |
| 21 | Criar índices compostos de performance | Backend | 2h | - |
| 22 | Implementar `ValidatesTenant` em FormRequests | Backend | 3h | - |
| 23 | Admin: Tela de ativar/desativar módulos por cidade | Admin | 4h | #6 |
| 24 | Frontend: Componente `<ModuleGate>` para UI | Frontend | 2h | #4 |

### 🟢 P2 - Média Prioridade (Fase 2)

| # | Task | Área | Estimativa | Dependência |
|---|------|------|------------|-------------|
| 25 | UUID determinístico por IBGE | Backend | 2h | - |
| 26 | Constraint `is_primary` única em `city_domains` | Backend | 1h | - |
| 27 | Migrar UUID CHAR(36) para BINARY(16) | Backend | 8h | - |
| 28 | Implementar rate limiting por tenant | Backend | 3h | - |
| 29 | City selector no onboarding | Frontend | 4h | #4 |
| 30 | Detecção de cidade via GPS | Frontend | 4h | #29 |
| 31 | Processo de ativação de nova cidade (checklist) | Admin | 6h | - |
| 32 | Sitemaps e páginas públicas por cidade | Backend | 4h | - |
| 33 | Métricas e alertas por cidade | DevOps | 6h | - |

---

## 🧪 Testes Obrigatórios

### Teste de Contrato (Linter)

```php
// tests/Architecture/TenantContractTest.php
class TenantContractTest extends TestCase
{
    public function test_all_tenant_aware_models_have_city_id(): void
    {
        $tenantAwareModels = [
            Bairro::class, Topic::class, Comment::class, Event::class,
            Phone::class, Venue::class, Alert::class, CitizenReport::class,
        ];
        
        foreach ($tenantAwareModels as $modelClass) {
            $model = new $modelClass();
            $this->assertTrue(
                Schema::hasColumn($model->getTable(), 'city_id'),
                "{$modelClass} deve ter coluna city_id"
            );
        }
    }
    
    public function test_all_tenant_aware_models_use_trait(): void
    {
        $tenantAwareModels = [...];
        
        foreach ($tenantAwareModels as $modelClass) {
            $this->assertContains(
                BelongsToTenant::class,
                class_uses_recursive($modelClass),
                "{$modelClass} deve usar BelongsToTenant"
            );
        }
    }
}
```

### Teste E2E de Bootstrap

```typescript
// apps/web/src/__tests__/bootstrap.e2e.ts
describe('Tenant Bootstrap', () => {
    it('should load city config on app start', async () => {
        // Navegar para /sc/tijucas
        // Verificar que config foi carregado
        // Verificar que módulos aparecem corretamente
    });
    
    it('should redirect unknown city to selector', async () => {
        // Navegar para /sc/cidade-inexistente
        // Verificar redirect para seletor
    });
    
    it('should hide disabled modules in UI', async () => {
        // Mock cidade sem módulo "tourism"
        // Verificar que aba turismo não aparece
    });
});
```

---

## 📊 Métricas de Sucesso

| Métrica | Meta | Como Medir |
|---------|------|------------|
| **Isolamento de dados** | 0 vazamentos | Teste de contrato + Audit logs |
| **Performance de queries** | < 50ms p95 | APM com filtro por city_id |
| **Tempo de bootstrap** | < 500ms | RUM no frontend |
| **Falhas de tenant** | 0 erros 400 | Logs de TenantNotSet/Mismatch |
| **Cobertura de gates** | 100% rotas | Script de auditoria de rotas |

---

## 📁 Arquivos a Criar/Modificar

```
apps/api/
├── config/
│   └── tenancy.php                    [CRIAR]
├── app/
│   ├── Http/
│   │   ├── Middleware/
│   │   │   ├── TenantContext.php      [MODIFICAR]
│   │   │   ├── ModuleGate.php         [CRIAR]
│   │   │   └── RequestIdMiddleware.php [CRIAR]
│   │   └── Controllers/Api/V1/
│   │       └── ConfigController.php   [CRIAR]
│   ├── Support/
│   │   └── Tenant.php                 [MODIFICAR]
│   ├── Traits/
│   │   ├── BelongsToTenant.php        [MODIFICAR]
│   │   └── TenantAwareJob.php         [CRIAR]
│   └── Models/
│       └── User.php                   [MODIFICAR]
└── database/migrations/
    └── 2026_02_07_000001_add_city_id_to_users.php [CRIAR]

packages/sdk/src/
└── client.ts                          [MODIFICAR]

apps/web/src/
├── store/
│   └── useTenantStore.ts              [CRIAR]
├── api/
│   └── client.ts                      [CRIAR]
├── components/
│   └── ModuleGate.tsx                 [CRIAR]
└── App.tsx                            [MODIFICAR]
```

---

> 💬 **Próximo Passo**: Começar pelas tasks P0 #1-#5 em paralelo (Backend + Frontend).
