# 📋 Multi-Tenancy: Tasks de Implementação

> **Documento Operacional para Execução**  
> **Data**: 06/02/2026  
> **Objetivo**: Guia detalhado com análise do atual vs esperado e tarefas ordenadas por prioridade

---

## 📊 Análise Comparativa: O Que Temos vs O Que Falta

### Backend Laravel

| Componente | Status | O Que Temos | O Que Falta |
|------------|--------|-------------|-------------|
| **TenantContext** | ⚠️ 70% | Middleware funcional, resolve por domínio/header/path/fallback | Blindagem de Host (aceita qualquer host) |
| **ModuleEnabled** | ✅ 100% | Middleware `module:slug` implementado e usado nas rotas | - |
| **Tenant Helper** | ⚠️ 60% | `Tenant::city()`, `cityId()`, `citySlug()`, `is()`, `isSet()` | `moduleEnabled()`, `config()`, `enabledModules()` |
| **BelongsToTenant** | ⚠️ 80% | Auto-scope e auto-set city_id | Proteção contra city_id diferente do tenant |
| **User city_id** | ❌ 0% | `bairro_id` apenas | Falta `city_id` no modelo e migration |
| **ConfigController** | ❌ 0% | Não existe | Endpoint `/api/v1/config` para bootstrap |
| **TenantAwareJob** | ❌ 0% | Não existe | Trait para Jobs manterem tenant context |
| **Request ID** | ❌ 0% | Não existe | Middleware para rastreabilidade |
| **Logs com Tenant** | ❌ 0% | Logs sem contexto | Logs com `tenant_city_id` e `request_id` |

### Frontend React + SDK

| Componente | Status | O Que Temos | O Que Falta |
|------------|--------|-------------|-------------|
| **SDK X-City** | ❌ 0% | SDK não envia nenhum header de tenant | Header `X-City` obrigatório |
| **useTenantStore** | ❌ 0% | Não existe | Store de tenant com bootstrap |
| **useAppStore** | ⚠️ 40% | `selectedBairro` | Falta `selectedCity` |
| **Bootstrap Flow** | ❌ 0% | App carrega direto | Não faz bootstrap via `/api/v1/config` |
| **ModuleGate** | ❌ 0% | Não existe | Componente para esconder UI de módulos desativados |
| **Dados Estáticos** | ❌ 0% | Lixo/Missas são JSONs hardcoded | Precisam vir da API |

### Banco de Dados

| Componente | Status | O Que Temos | O Que Falta |
|------------|--------|-------------|-------------|
| **cities** | ✅ 100% | Tabela completa com status, brand, ibge_code | - |
| **city_modules** | ✅ 100% | Tabela pivot com settings JSON | - |
| **city_domains** | ⚠️ 90% | Tabela funcional | Constraint is_primary única |
| **users.city_id** | ❌ 0% | Não existe | Migration pendente |
| **Índices Compostos** | ⚠️ 30% | Índices simples em city_id | Faltam (city_id, created_at), (city_id, bairro_id, created_at) |
| **Vereador/Votacao** | ❌ 0% | Sem city_id | Precisam de tenant-awareness |

---

## 🔴 P0 - CRÍTICO (Executar Esta Semana)

### Task P0-1: Blindagem de Host no TenantContext

**Prioridade**: 🔴 Crítica  
**Área**: Backend  
**Estimativa**: 2-3h  
**Risco se não fizer**: Host header injection, tenant resolvido por host malicioso

#### Estado Atual
```php
// TenantContext.php - ATUAL (linha 62-86)
private function resolveTenant(Request $request): ?City
{
    $host = $this->normalizeHost($request->getHost());
    $city = $this->resolveByDomain($host);  // ⚠️ ACEITA QUALQUER HOST
    if ($city) {
        return $city;
    }
    // ...
}
```

#### O Que Fazer

1. **Criar arquivo de config** `config/tenancy.php`:
```php
return [
    'trusted_hosts' => [
        env('APP_URL_HOST', 'etijucas.com.br'),
        '*.cidadeconectada.app',
        'localhost',
        '127.0.0.1',
    ],
    'allow_header_override' => env('TENANCY_ALLOW_HEADER', true),
    'default_city_slug' => 'tijucas-sc',
];
```

2. **Adicionar método `isHostTrusted()` no TenantContext**:
```php
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
```

3. **Modificar `handle()` para validar host antes de resolver**:
```php
public function handle(Request $request, Closure $next): Response
{
    $host = $this->normalizeHost($request->getHost());
    
    // 🛡️ BLINDAGEM: Bloquear hosts maliciosos
    if (!$this->isHostTrusted($host)) {
        return response()->json([
            'success' => false,
            'error' => 'HOST_NOT_TRUSTED',
            'message' => 'Host não autorizado.',
        ], 400);
    }
    
    // ... resto do código atual
}
```

#### Arquivos a Criar/Modificar
- `[CRIAR]` `config/tenancy.php`
- `[MODIFICAR]` `app/Http/Middleware/TenantContext.php`

#### Critérios de Aceite
- [ ] Hosts não listados em `trusted_hosts` retornam 400
- [ ] Hosts em `city_domains` são aceitos automaticamente
- [ ] Padrão wildcard funciona (ex: `*.cidadeconectada.app`)
- [ ] Teste unitário cobre os cenários

---

### Task P0-2: SDK Enviar Header X-City Obrigatório

**Prioridade**: 🔴 Crítica  
**Área**: Frontend (SDK)  
**Estimativa**: 2-3h  
**Risco se não fizer**: Frontend sem contexto de cidade, requests caem no fallback

#### Estado Atual
```typescript
// packages/sdk/src/client.ts - ATUAL (linha 170-178)
const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    // ❌ NÃO ENVIA X-City
};
```

#### O Que Fazer

1. **Modificar `ClientConfig` para incluir `getCitySlug`**:
```typescript
export interface ClientConfig {
    baseUrl: string;
    getToken?: () => string | null;
    getCitySlug: () => string;  // ← ADICIONAR (obrigatório)
    onTokenExpired?: () => void;
    onError?: (error: ApiClientError) => void;
    timeout?: number;
}
```

2. **Validar no construtor**:
```typescript
constructor(config: ClientConfig) {
    if (!config.getCitySlug) {
        throw new Error('[SDK] getCitySlug é obrigatório para multi-tenancy');
    }
    this.getCitySlug = config.getCitySlug;
    // ... resto
}
```

3. **Adicionar X-City e X-Request-Id nos headers**:
```typescript
private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const citySlug = this.getCitySlug();
    
    if (!citySlug) {
        throw new ApiClientError('Cidade não selecionada', 400, 'NO_TENANT');
    }
    
    const requestId = crypto.randomUUID();
    
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-City': citySlug,           // ← ADICIONAR
        'X-Request-Id': requestId,     // ← ADICIONAR
        ...(token && { Authorization: `Bearer ${token}` }),
    };
    // ...
}
```

#### Arquivos a Modificar
- `[MODIFICAR]` `packages/sdk/src/client.ts`

#### Critérios de Aceite
- [ ] SDK exige `getCitySlug` no construtor
- [ ] Toda request inclui header `X-City`
- [ ] Request sem citySlug dispara erro claro
- [ ] `X-Request-Id` é gerado e enviado

---

### Task P0-3: Criar useTenantStore com Bootstrap

**Prioridade**: 🔴 Crítica  
**Área**: Frontend  
**Estimativa**: 3-4h  
**Dependência**: Task P0-4 (endpoint /config)

#### Estado Atual
```typescript
// useAppStore.ts - NÃO TEM contexto de cidade
interface AppState {
    selectedBairro: Bairro;  // ← Só bairro, não cidade
    // ...
}
```

#### O Que Fazer

1. **Criar `apps/web/src/store/useTenantStore.ts`**:
```typescript
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
                        error: error instanceof Error ? error.message : 'Erro',
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

2. **Modificar `App.tsx` para fazer bootstrap**:
```typescript
function App() {
    const { isBootstrapped, isLoading, error, bootstrap } = useTenantStore();
    
    useEffect(() => {
        if (!isBootstrapped) {
            const citySlug = resolveCityFromUrl() || 'tijucas-sc';
            bootstrap(citySlug);
        }
    }, []);
    
    if (isLoading) return <SplashScreen />;
    if (error) return <CityNotFoundScreen />;
    if (!isBootstrapped) return <SplashScreen />;
    
    return <RouterProvider router={router} />;
}
```

3. **Criar factory do SDK com tenant**:
```typescript
// apps/web/src/api/client.ts
import { createApiClient } from '@repo/sdk';
import { useTenantStore } from '@/store/useTenantStore';

export const api = createApiClient({
    baseUrl: import.meta.env.VITE_API_URL || '',
    getToken: () => localStorage.getItem('accessToken'),
    getCitySlug: () => useTenantStore.getState().city?.slug ?? '',
});
```

#### Arquivos a Criar/Modificar
- `[CRIAR]` `apps/web/src/store/useTenantStore.ts`
- `[CRIAR]` `apps/web/src/api/client.ts`
- `[MODIFICAR]` `apps/web/src/App.tsx`

#### Critérios de Aceite
- [ ] Store persiste cidade selecionada
- [ ] Bootstrap carrega config da API
- [ ] App mostra loading durante bootstrap
- [ ] `isModuleEnabled()` funciona corretamente

---

### Task P0-4: Criar Endpoint /api/v1/config

**Prioridade**: 🔴 Crítica  
**Área**: Backend  
**Estimativa**: 2-3h  

#### Estado Atual
- Não existe endpoint de configuração
- Frontend não tem como descobrir módulos ativos

#### O Que Fazer

1. **Expandir `Tenant` helper** (`app/Support/Tenant.php`):
```php
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
            'defaultBairroId' => Bairro::where('city_id', $city->id)
                ->where('slug', 'centro')->first()?->id,
            'lat' => $city->lat,
            'lon' => $city->lon,
        ],
    ];
}

public static function enabledModules(): array
{
    return Cache::remember(
        "city:{$self::cityId()}:modules:list",
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
            ])
            ->toArray()
    );
}
```

2. **Criar controller** (`app/Http/Controllers/Api/V1/ConfigController.php`):
```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

3. **Adicionar rota** (`routes/api.php`):
```php
// Antes das rotas autenticadas
Route::get('config', [\App\Http\Controllers\Api\V1\ConfigController::class, 'bootstrap']);
```

#### Arquivos a Criar/Modificar
- `[CRIAR]` `app/Http/Controllers/Api/V1/ConfigController.php`
- `[MODIFICAR]` `app/Support/Tenant.php`
- `[MODIFICAR]` `routes/api.php`

#### Critérios de Aceite
- [ ] `GET /api/v1/config` retorna city, brand, modules
- [ ] Resposta é cacheável (Cache-Control)
- [ ] Módulos desativados não aparecem na lista
- [ ] `X-Request-Id` é refletido na resposta

---

### Task P0-5: Adicionar city_id ao User

**Prioridade**: 🔴 Crítica  
**Área**: Backend  
**Estimativa**: 2h  
**Risco se não fizer**: Vazamento de dados em admin/exports/buscas

#### Estado Atual
```php
// User.php - ATUAL
protected $fillable = [
    'phone', 'email', 'password', 'nome',
    'bairro_id',  // ← Só bairro
    // ❌ NÃO TEM city_id
];
```

#### O Que Fazer

1. **Criar migration**:
```bash
php artisan make:migration add_city_id_to_users_table
```

```php
public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->uuid('city_id')->nullable()->after('id');
        $table->foreign('city_id')->references('id')->on('cities')
            ->onDelete('set null');
        $table->index(['city_id', 'created_at']);
    });
    
    // Backfill: derivar city_id do bairro
    DB::statement("
        UPDATE users u
        SET city_id = (SELECT city_id FROM bairros b WHERE b.id = u.bairro_id)
        WHERE u.bairro_id IS NOT NULL
    ");
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropForeign(['city_id']);
        $table->dropColumn('city_id');
    });
}
```

2. **Modificar modelo User**:
```php
protected $fillable = [
    'city_id',  // ← ADICIONAR
    // ... resto
];

public function city(): BelongsTo
{
    return $this->belongsTo(City::class);
}

public function scopeForCity($query, string $cityId)
{
    return $query->where('city_id', $cityId);
}
```

3. **Atualizar AuthController/RegisterRequest** para setar city_id na criação:
```php
// No registro, derivar do bairro ou do tenant
$user->city_id = $bairro->city_id ?? Tenant::cityId();
```

#### Arquivos a Criar/Modificar
- `[CRIAR]` `database/migrations/2026_02_07_XXXXXX_add_city_id_to_users_table.php`
- `[MODIFICAR]` `app/Models/User.php`
- `[MODIFICAR]` `app/Http/Controllers/Auth/AuthController.php`

#### Critérios de Aceite
- [ ] Coluna `city_id` existe em users
- [ ] Usuários existentes têm city_id preenchido via backfill
- [ ] Novos usuários têm city_id definido automaticamente
- [ ] Scope `forCity()` funciona

---

### Task P0-6: Logs com Contexto de Tenant

**Prioridade**: 🔴 Crítica  
**Área**: Backend  
**Estimativa**: 1-2h  
**Risco se não fizer**: Debugging muito difícil em produção multi-city

#### O Que Fazer

1. **Criar middleware RequestId**:
```php
// app/Http/Middleware/RequestIdMiddleware.php
class RequestIdMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $request->header('X-Request-Id') ?? Str::uuid()->toString();
        
        // Compartilhar com todos os logs
        Log::shareContext([
            'request_id' => $requestId,
            'tenant_city_id' => fn () => Tenant::cityId(),
            'tenant_slug' => fn () => Tenant::citySlug(),
        ]);
        
        $response = $next($request);
        
        return $response->header('X-Request-Id', $requestId);
    }
}
```

2. **Registrar middleware global**:
```php
// app/Http/Kernel.php - middleware global
protected $middleware = [
    // ... outros
    \App\Http\Middleware\RequestIdMiddleware::class,
];
```

#### Arquivos a Criar/Modificar
- `[CRIAR]` `app/Http/Middleware/RequestIdMiddleware.php`
- `[MODIFICAR]` `app/Http/Kernel.php`

#### Critérios de Aceite
- [ ] Todos os logs incluem `tenant_city_id`
- [ ] Todos os logs incluem `request_id`
- [ ] Response inclui header `X-Request-Id`

---

## 🟡 P1 - ALTA PRIORIDADE (Próxima Sprint)

### Task P1-1: Trait TenantAwareJob para Jobs/Queue

**Área**: Backend  
**Estimativa**: 2h

#### O Que Fazer

```php
// app/Traits/TenantAwareJob.php
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
```

Usar em todos os Jobs que manipulam dados tenant-aware.

---

### Task P1-2: Migrar Lixo para Tabela trash_schedules

**Área**: Backend  
**Estimativa**: 4h

1. Criar migration `trash_schedules`
2. Criar model com `BelongsToTenant`
3. Criar seeder com dados de Tijucas
4. Criar endpoint `GET /api/v1/trash-schedules`
5. Atualizar frontend para consumir API

---

### Task P1-3: Migrar Missas para Tabela mass_schedules

**Área**: Backend  
**Estimativa**: 4h

Mesma estrutura da Task P1-2.

---

### Task P1-4: Adicionar city_id a Vereador e Votacao

**Área**: Backend  
**Estimativa**: 3h

1. Criar migrations adicionando `city_id`
2. Aplicar trait `BelongsToTenant`
3. Backfill para Tijucas

---

### Task P1-5: Índices Compostos de Performance

**Área**: Backend  
**Estimativa**: 2h

```sql
CREATE INDEX idx_topics_city_created ON topics (city_id, created_at DESC);
CREATE INDEX idx_topics_city_bairro_created ON topics (city_id, bairro_id, created_at DESC);
CREATE INDEX idx_events_city_created ON events (city_id, created_at DESC);
CREATE INDEX idx_reports_city_status_created ON citizen_reports (city_id, status, created_at DESC);
```

---

### Task P1-6: Componente ModuleGate no Frontend

**Área**: Frontend  
**Estimativa**: 2h

```tsx
// components/ModuleGate.tsx
export function ModuleGate({ 
    module, 
    children, 
    fallback = null 
}: { 
    module: string; 
    children: React.ReactNode;
    fallback?: React.ReactNode;
}) {
    const isEnabled = useTenantStore(s => s.isModuleEnabled(module));
    
    if (!isEnabled) return fallback;
    return children;
}

// Uso:
<ModuleGate module="tourism">
    <TourismTab />
</ModuleGate>
```

---

### Task P1-7: ValidatesTenant em FormRequests

**Área**: Backend  
**Estimativa**: 3h

Criar trait e aplicar em todas as FormRequests que aceitam `bairro_id`:

```php
trait ValidatesTenant
{
    protected function bairroRule(): array
    {
        return [
            'bairro_id' => [
                'nullable',
                'uuid',
                Rule::exists('bairros', 'id')->where('city_id', Tenant::cityId()),
            ],
        ];
    }
}
```

---

## 🟢 P2 - MÉDIA PRIORIDADE (Fase 2)

| # | Task | Estimativa |
|---|------|------------|
| P2-1 | UUID determinístico por IBGE | 2h |
| P2-2 | Constraint is_primary em city_domains | 1h |
| P2-3 | Rate limiting por tenant | 3h |
| P2-4 | City selector no onboarding | 4h |
| P2-5 | Detecção de cidade via GPS | 4h |
| P2-6 | Admin: CRUD de módulos por cidade | 6h |
| P2-7 | Processo de ativação de nova cidade | 6h |
| P2-8 | Sitemaps por cidade | 4h |

---

## 📝 Checklist de Execução

### Sprint Atual (P0)

- [ ] **P0-1**: Blindagem de Host no TenantContext
- [ ] **P0-2**: SDK enviar X-City obrigatório
- [ ] **P0-3**: Criar useTenantStore
- [ ] **P0-4**: Endpoint /api/v1/config
- [ ] **P0-5**: city_id no User
- [ ] **P0-6**: Logs com contexto de tenant

### Próxima Sprint (P1)

- [ ] **P1-1**: TenantAwareJob
- [ ] **P1-2**: Migrar Lixo
- [ ] **P1-3**: Migrar Missas
- [ ] **P1-4**: city_id em Vereador/Votacao
- [ ] **P1-5**: Índices compostos
- [ ] **P1-6**: ModuleGate frontend
- [ ] **P1-7**: ValidatesTenant em FormRequests

---

> 💡 **Dica**: Executar P0-1 e P0-2 em paralelo (Backend + Frontend).  
> Depois P0-4 seguido de P0-3 (endpoint antes do store que consome).
