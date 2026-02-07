# Multi-Tenancy Análise Completa & Plano de Melhorias

> **Data:** 2026-02-07  
> **Objetivo:** Análise cirúrgica da implementação atual + plano de melhorias priorizado

---

## 📊 Diagnóstico do Estado Atual

### Stack Atual

| Camada | Tecnologia | Status |
|--------|------------|--------|
| **Backend** | Laravel 11 + MariaDB | ✅ Produção |
| **Frontend** | React + Vite + Zustand | ✅ Produção |
| **Banco** | MariaDB 10.x (remoto) | ✅ Produção |
| **Cache** | Laravel File Cache | ⚠️ Deveria ser Redis |
| **Queue** | Sync (sem workers) | ⚠️ Sem queue real |

---

## ✅ O Que Está Ótimo (Manter)

### 1. TenantContext Middleware
```
📁 app/Http/Middleware/TenantContext.php (232 linhas)
```

| Funcionalidade | Status | Implementação |
|----------------|--------|---------------|
| Host validation | ✅ | `isHostTrusted()` valida contra config + city_domains |
| Cache de domínios | ✅ | `getDomainMap()` TTL 1h |
| Resolução por path | ✅ | `/uf/cidade` → `cidade-uf` |
| Header X-City | ✅ | Configurável via `allow_header_override` |
| Logging de host malicioso | ✅ | Log::warning com IP e User-Agent |

**Código sólido**, sem melhorias críticas imediatas.

### 2. Tenant Helper
```
📁 app/Support/Tenant.php (224 linhas)
```

| Funcionalidade | Status | Implementação |
|----------------|--------|---------------|
| `Tenant::city()` | ✅ | Acesso fácil via container |
| `moduleEnabled()` | ✅ | Cache por módulo, TTL 15min |
| `enabledModules()` | ✅ | Lista todos habilitados |
| `config()` | ✅ | Retorna city + brand + modules + geo |
| `clearCache()` | ✅ | Limpa cache por tenant |

**Bem estruturado**, apenas melhorias menores.

### 3. BelongsToTenant Trait
```
📁 app/Traits/BelongsToTenant.php (95 linhas)
```

| Funcionalidade | Status | Implementação |
|----------------|--------|---------------|
| Global scope | ✅ | `where city_id = Tenant::cityId()` |
| Auto-set city_id | ✅ | No `creating()` se vazio |
| Validação bairro↔cidade | ✅ | No `saving()` com DomainException |
| `withoutTenant()` | ✅ | Para admin/reports |
| `forCity($id)` | ✅ | Para queries específicas |

**Contrato bem definido**, 2 melhorias sugeridas.

### 4. Config Tenancy
```
📁 config/tenancy.php (70 linhas)
```

| Config | Valor | Status |
|--------|-------|--------|
| `trusted_hosts` | etijucas.com.br, *.cidadeconectada.app, localhost | ✅ |
| `allow_header_override` | true (env) | ✅ |
| `default_city_slug` | tijucas-sc | ✅ |
| `domain_map_ttl` | 3600 (1h) | ✅ |
| `module_status_ttl` | 900 (15min) | ✅ |
| `strict_mode` | false | ⚠️ Habilitar em prod |

### 5. Frontend SDK
```
📁 store/useTenantStore.ts:92
```

```typescript
headers: { 'X-City': citySlug }
```

**O SDK já envia X-City** ✅

---

## ⚠️ Gaps Identificados

### 🔴 P0 - Crítico (Bloqueia lançamento multi-cidade)

| Gap | Risco | Arquivo |
|-----|-------|---------|
| **Sem middleware `module:slug`** | Rotas de módulo desativado acessíveis | routes/api.php |
| **Jobs sem tenant context** | Escrita com city_id errado | Todos jobs |
| **User sem scope obrigatório** | Vazamento em admin/exports | User queries |
| **withoutTenant() sem auditoria** | Uso indevido não rastreável | BelongsToTenant |

### 🟡 P1 - Alta Prioridade

| Gap | Risco | Arquivo |
|-----|-------|---------|
| **Sem request_id nos logs** | Debug difícil em multi-tenant | Logs globais |
| **Sem validação city_id no save** | Alguém pode forçar city_id errado | BelongsToTenant |
| **Cache file-based** | Performance em escala | config/cache.php |
| **UUID como CHAR(36)** | Índices pesados | Migrations |

### 🟢 P2 - Média Prioridade

| Gap | Risco |
|-----|-------|
| Sem sitemap por cidade | SEO fraco |
| Sem SSR/SSG para páginas públicas | Indexação limitada |
| Sem métricas por tenant | Sem visibilidade operacional |

---

## 🛠️ Plano de Melhorias

### Fase 1: P0 - Crítico (Implementar Agora)

#### 1.1 Middleware `module:slug`

**Criar:** `app/Http/Middleware/EnsureModuleEnabled.php`

```php
<?php
namespace App\Http\Middleware;

use App\Support\Tenant;
use Closure;
use Illuminate\Http\Request;

class EnsureModuleEnabled
{
    public function handle(Request $request, Closure $next, string $module)
    {
        if (!Tenant::moduleEnabled($module)) {
            return response()->json([
                'success' => false,
                'error' => 'MODULE_DISABLED',
                'message' => 'Este recurso não está disponível nesta cidade.',
            ], 404);
        }

        return $next($request);
    }
}
```

**Registrar em** `bootstrap/app.php`:
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'module' => \App\Http\Middleware\EnsureModuleEnabled::class,
    ]);
})
```

**Aplicar nas rotas:**
```php
Route::middleware(['module:forum'])->group(function () {
    Route::get('/forum/topics', [TopicController::class, 'index']);
    // ...
});
```

---

#### 1.2 TenantAwareJob Obrigatório

**Atualizar:** `app/Traits/TenantAwareJob.php`

```php
<?php
namespace App\Traits;

use App\Support\Tenant;
use App\Models\City;

trait TenantAwareJob
{
    protected ?string $tenantCityId = null;

    public function __construct()
    {
        // Captura tenant no dispatch
        $this->tenantCityId = Tenant::cityId();
    }

    protected function setTenantContext(): void
    {
        if ($this->tenantCityId) {
            $city = City::find($this->tenantCityId);
            if ($city) {
                app()->instance('tenant.city', $city);
            }
        }
    }

    // Chamar no início do handle()
    // $this->setTenantContext();
}
```

---

#### 1.3 Validação de city_id no Save

**Adicionar no BelongsToTenant.php:**

```php
static::saving(function ($model) {
    // INVARIANTE #2: city_id do model deve ser igual ao tenant
    if ($model->city_id && Tenant::cityId() && $model->city_id !== Tenant::cityId()) {
        // Só bloqueia se estiver em contexto HTTP (não em CLI/jobs)
        if (app()->runningInConsole() === false) {
            throw new \DomainException(
                "Tentativa de salvar com city_id diferente do tenant"
            );
        }
    }
    
    // ... validação de bairro existente
});
```

---

#### 1.4 Auditoria de withoutTenant()

**Melhoria no BelongsToTenant.php:**

```php
public function scopeWithoutTenant(Builder $query): Builder
{
    // Log para auditoria
    Log::info('withoutTenant() usado', [
        'model' => get_class($query->getModel()),
        'caller' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 3)[2] ?? null,
        'user_id' => auth()->id(),
    ]);

    return $query->withoutGlobalScope('tenant');
}
```

---

### Fase 2: P1 - Alta Prioridade (Próxima Sprint)

#### 2.1 Request ID em Todos Logs

**Criar middleware:** `app/Http/Middleware/RequestId.php`

```php
<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class RequestId
{
    public function handle($request, Closure $next)
    {
        $requestId = $request->header('X-Request-Id') ?? Str::uuid()->toString();
        
        // Setar no context global de log
        Log::shareContext([
            'request_id' => $requestId,
            'tenant_city_id' => app('tenant.city')?->id,
            'tenant_slug' => app('tenant.city')?->slug,
        ]);

        $response = $next($request);
        
        // Retornar para o client
        $response->headers->set('X-Request-Id', $requestId);
        
        return $response;
    }
}
```

---

#### 2.2 User Scope Seguro

**Criar:** `app/Models/Scopes/UserCityScope.php`

```php
trait UserCityQueryable
{
    public function scopeForCurrentTenant(Builder $query): Builder
    {
        if (Tenant::cityId()) {
            return $query->where('city_id', Tenant::cityId());
        }
        
        throw new \RuntimeException('User::forCurrentTenant() chamado sem tenant');
    }
}
```

**Regra:** Em controladores, sempre usar `User::forCurrentTenant()->...`

---

#### 2.3 Migrar para Redis Cache

```bash
composer require predis/predis
```

**.env:**
```
CACHE_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

---

### Fase 3: P2 - Média Prioridade (Próximo Mês)

| Melhoria | Esforço | Descrição |
|----------|---------|-----------|
| Sitemap dinâmico | 4h | `/sitemap-{city_slug}.xml` |
| SSR para páginas públicas | 16h | Next.js ou Laravel Blade |
| Métricas Prometheus | 8h | `tenant_requests_total{city="tijucas"}` |
| UUID binário | 8h | Migrar para BINARY(16) |

---

## 📋 Checklist de PR (Validar Antes de Merge)

```markdown
- [ ] Toda rota tenant-aware passa por TenantContext
- [ ] Toda rota de módulo passa por `module:slug`
- [ ] Toda escrita ignora city_id do client e usa o tenant
- [ ] Todo model tenant-aware tem city_id + índice + trait
- [ ] withoutTenant() só em admin (e auditável)
- [ ] /api/v1/config implementado e cacheado
- [ ] SDK envia X-City sempre
- [ ] Jobs usam TenantAwareJob
- [ ] Logs incluem request_id e tenant_city_id
```

---

## 📊 Índices Recomendados

```sql
-- Performance em listagens
CREATE INDEX idx_topics_tenant_created ON topics(city_id, created_at);
CREATE INDEX idx_topics_tenant_bairro ON topics(city_id, bairro_id, created_at);
CREATE INDEX idx_comments_tenant_created ON comments(city_id, created_at);
CREATE INDEX idx_events_tenant_date ON events(city_id, event_date);
CREATE INDEX idx_citizen_reports_tenant ON citizen_reports(city_id, status, created_at);
CREATE INDEX idx_users_tenant_bairro ON users(city_id, bairro_id);

-- Unique por tenant (evitar slug duplicado)
CREATE UNIQUE INDEX idx_topics_tenant_slug ON topics(city_id, slug);
```

---

## 🔒 Invariantes do Multi-Tenancy

> Regras que NUNCA podem ser violadas

1. **Toda request tem tenant resolvido** (ou falha com 400/404)
2. **Toda escrita em tabela tenant-aware grava city_id do tenant**, nunca do client
3. **Toda leitura em tabela tenant-aware filtra por city_id** por padrão
4. **Se existe bairro_id, ele pertence ao mesmo city_id**
5. **Módulo desativado = rota bloqueada + UI escondida**
6. **withoutTenant() só em contextos auditáveis** (admin, CLI, relatórios)
7. **Jobs preservam contexto do tenant** que disparou

---

## 📁 Arquivos Chave

### Backend

| Arquivo | Propósito | Linhas |
|---------|-----------|--------|
| [Tenant.php](file:///c:/laragon/www/etijucas/apps/api/app/Support/Tenant.php) | Helper de acesso ao tenant | 224 |
| [TenantContext.php](file:///c:/laragon/www/etijucas/apps/api/app/Http/Middleware/TenantContext.php) | Middleware de resolução | 232 |
| [BelongsToTenant.php](file:///c:/laragon/www/etijucas/apps/api/app/Traits/BelongsToTenant.php) | Trait para models | 95 |
| [tenancy.php](file:///c:/laragon/www/etijucas/apps/api/config/tenancy.php) | Config de tenancy | 70 |
| [TenantAwareJob.php](file:///c:/laragon/www/etijucas/apps/api/app/Traits/TenantAwareJob.php) | Trait para jobs | ~50 |

### Frontend

| Arquivo | Propósito |
|---------|-----------|
| [useTenantStore.ts](file:///c:/laragon/www/etijucas/apps/web/src/store/useTenantStore.ts) | State global do tenant |
| [tenant.ts](file:///c:/laragon/www/etijucas/apps/web/src/constants/tenant.ts) | Constantes de tenant |
| [useCityRoute.ts](file:///c:/laragon/www/etijucas/apps/web/src/hooks/useCityRoute.ts) | Hook para rotas prefixadas |

---

## ⚡ Comandos Rápidos

```bash
# Limpar cache de tenant
php artisan cache:clear

# Rodar seeders de tenant
php artisan db:seed --class=ModulesSeeder
php artisan db:seed --class=CityModulesSeeder

# Verificar módulos de Tijucas
php artisan tinker --execute="App\Support\Tenant::enabledModules()"

# Listar hosts trusted
php artisan tinker --execute="config('tenancy.trusted_hosts')"
```

---

> **Próximo Passo:** Implementar P0.1 (middleware `module:slug`) e testar.
