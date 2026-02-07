# 🏙️ Análise Multi-Tenancy: Relatório Técnico para o Time

> **Documento para o Time de Experts**
> **Data**: 06/02/2026  
> **Objetivo**: Análise completa do estado atual da implementação multi-tenancy e roadmap para expansão nacional

---

## 📊 Sumário Executivo

| Área | Status | Progresso |
|------|--------|-----------|
| **Banco de Dados** | ✅ Implementado | 90% |
| **Backend (Laravel)** | ✅ Implementado | 80% |
| **Frontend (React)** | ⚠️ Parcial | 30% |
| **SDK (@repo/sdk)** | ❌ Não implementado | 10% |
| **Painel Admin** | ⚠️ Parcial | 40% |

**Resumo**: A fundação do backend está sólida para multi-tenancy. O maior gap está no **Frontend** que não possui contexto de cidade e no **SDK** que não envia headers de tenant.

---

## 🔍 Análise Detalhada: O Que Já Foi Feito

### 1. Banco de Dados (90% Completo) ✅

#### Tabelas Criadas

| Tabela | Propósito | Status |
|--------|-----------|--------|
| `states` | Estados brasileiros (27 + DF) | ✅ Criada |
| `cities` | Cidades (tenants principais) | ✅ Criada |
| `city_domains` | Mapeamento domínio → cidade | ✅ Criada |
| `modules` | Features do sistema | ✅ Criada |
| `city_modules` | Feature flags por cidade | ✅ Criada |
| `bairro_aliases` | Nomes alternativos de bairros | ✅ Criada |
| `address_mismatch_agg` | Auditoria de CEPs | ✅ Criada |

#### Coluna `city_id` Adicionada

As seguintes tabelas já possuem a FK `city_id`:

```
✅ users            → add_city_bairro_to_users.php
✅ bairros          → add_city_id_to_bairros.php  
✅ topics           → add_city_id_to_topics_comments.php
✅ comments         → add_city_id_to_topics_comments.php
✅ citizen_reports  → add_city_id_to_citizen_reports.php
✅ events           → add_city_id_to_events.php
✅ phones           → add_city_id_to_other_tables.php
✅ venues           → add_city_id_to_other_tables.php
✅ alerts           → add_city_id_to_other_tables.php
```

#### Modelo `City` - Recursos Avançados

```php
// Campos disponíveis:
- id (UUID)
- state_id (FK)
- ibge_code (int) // Código IBGE oficial
- name, uf, slug  // Ex: "Tijucas", "SC", "tijucas-sc"
- status (enum: staging, active, inactive, archived)
- brand (JSON) // Logo, cores, configurações visuais
- lat, lon, ddd, timezone
- is_capital, siafi_id, population
```

**Destaque**: O modelo suporta **branding por cidade** (cores, logo, manifesto PWA) e **status de rollout** (staging → active).

---

### 2. Backend Laravel (80% Completo) ✅

#### Middleware `TenantContext`

Implementação robusta com 4 métodos de resolução (prioridade):

1. **Database Domain Mapping** (`city_domains` table)
2. **Header `X-City`** (mobile/dev)
3. **Path `/uf/cidade`** (ex: `/sc/tijucas`)
4. **Fallback** → `tijucas-sc`

```php
// O tenant fica disponível globalmente via:
app('tenant.city')           // Model City
Tenant::city()               // Helper estático
Tenant::cityId()             // UUID da cidade
$request->attributes->get('tenant_city_id')
```

#### Trait `BelongsToTenant`

**Modelos que já usam o trait** (8/15):

| Modelo | Usa Trait | Auto-filter | Auto-create |
|--------|-----------|-------------|-------------|
| `Bairro` | ✅ | ✅ | ✅ |
| `Topic` | ✅ | ✅ | ✅ |
| `Comment` | ✅ | ✅ | ✅ |
| `Event` | ✅ | ✅ | ✅ |
| `Phone` | ✅ | ✅ | ✅ |
| `Venue` | ✅ | ✅ | ✅ |
| `Alert` | ✅ | ✅ | ✅ |
| `CitizenReport` | ✅ | ✅ | ✅ |

**Funcionalidades do Trait**:
- Global Scope automático (`WHERE city_id = ?`)
- Auto-set `city_id` em `creating()`
- Scopes auxiliares: `withoutTenant()`, `forCity($id)`

#### Helpers de Suporte

```
app/Support/
├── Tenant.php        # Tenant::city(), Tenant::cityId()
├── TenantCache.php   # Cache por tenant (prefixo automático)
└── TenantUrl.php     # URLs com contexto de cidade
```

#### Feature Flags por Cidade

```php
// Módulos configuráveis por cidade
Module::where('slug', 'legislativo')->first();
CityModule::where(['city_id' => $x, 'module_id' => $y])
    ->where('enabled', true)->exists();
```

---

### 3. O Que Falta: BACKEND ❌

#### 3.1. Model `User` NÃO usa `BelongsToTenant`

**Problema**: O modelo User tem `bairro_id` mas não aplica o global scope de tenant.

```php
// User.php atual:
class User extends Authenticatable {
    use HasApiTokens, HasFactory, HasRoles, HasUuids...
    // ❌ FALTA: use BelongsToTenant;
}
```

**Impacto**: `User::all()` retorna usuários de todas as cidades.

**Solução**: Não aplicar `BelongsToTenant` diretamente (usuário pode pertencer a múltiplas cidades). Em vez disso:
1. Criar scope manual `scopeForCity()`
2. Derivar cidade via `bairro->city_id`
3. Ou adicionar coluna `primary_city_id` para performance

#### 3.2. Modelos Faltantes

| Modelo | Precisa `city_id`? | Prioridade |
|--------|-------------------|------------|
| `Vereador` | ✅ Sim | Alta |
| `Votacao` | ✅ Sim | Alta |
| `TourismSpot` | ✅ Sim | Média |
| `TourismReview` | ❌ Via spot | N/A |
| `EventCategory` | ⚠️ Avaliar | Baixa (global?) |

#### 3.3. Dados Estáticos no Backend

- **Coleta de Lixo**: Precisa de tabela `trash_schedules`
- **Horários de Missas**: Precisa de tabela `mass_schedules`
- **Pontos Turísticos**: Modelo existe, mas não testado multi-tenant

#### 3.4. Endpoints de Config por Cidade

Criar endpoint que retorna configuração dinâmica:

```
GET /api/v1/config
{
  "city": { "name": "Tijucas", "slug": "tijucas-sc", ... },
  "modules": ["forum", "events", "reports", "phones"],
  "brand": { "primaryColor": "#1976D2", "logo": "..." },
  "features": { "legislativo": false, "tourism": true }
}
```

---

### 4. O Que Falta: FRONTEND ❌❌

#### 4.1. SDK Não Envia Header `X-City`

**Problema Crítico**: O SDK `@repo/sdk` não envia nenhum identificador de tenant.

```typescript
// packages/sdk/src/client.ts (atual)
private async request<T>(...): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        // ❌ FALTA: 'X-City': getCitySlug()
    };
}
```

**Solução**:
```typescript
// ClientConfig deve incluir:
interface ClientConfig {
    baseUrl: string;
    getToken?: () => string | null;
    getCitySlug?: () => string;  // ← ADICIONAR
    // ...
}
```

#### 4.2. Store Não Possui Contexto de Cidade

**Problema**: `useAppStore` gerencia apenas `selectedBairro`, não `selectedCity`.

```typescript
// useAppStore.ts (atual)
interface AppState {
    selectedBairro: Bairro;
    // ❌ FALTA: selectedCity: City;
}
```

**Solução**: Criar `useTenantStore`:
```typescript
interface TenantState {
    city: City | null;
    modules: string[];
    brand: CityBrand;
    isLoading: boolean;
    fetchConfig: () => Promise<void>;
}
```

#### 4.3. Dados Estáticos no Frontend

Os seguintes dados são **hardcoded** em JSONs no frontend:

| Feature | Arquivo | Localização |
|---------|---------|-------------|
| Coleta de Lixo | `trashData.ts` | `apps/web/src/data/` |
| Horários de Missas | `massData.ts` | `apps/web/src/data/` |
| Telefones Úteis | `phonesData.ts` | `apps/web/src/data/` (parcial) |

**Para multi-city**: Esses dados devem vir da API, filtrados por cidade.

#### 4.4. Ausência de City Selector

Não existe UI para:
- Selecionar cidade no onboarding
- Trocar cidade no perfil
- Detectar cidade via GPS

---

## 🏗️ Arquitetura por Cidade: Granularidade

### Hierarquia Geográfica

```
Brasil
└── State (27)
    └── City (tenant) ⭐ NÍVEL PRINCIPAL
        └── Bairro (subdivisão)
```

**Decisão de Design**: A **cidade** é o tenant principal porque:
- Prefeituras são o cliente pagante (B2B2C)
- Legislação, eventos, telefones são municipais
- Bairros são apenas filtros de conveniência

### Escalabilidade para 5.570 Cidades

| Preocupação | Solução Atual | Status |
|-------------|---------------|--------|
| Isolamento de dados | Global Scope via trait | ✅ Implementado |
| Performance | Índices em `city_id` | ⚠️ Parcial |
| Cache | `TenantCache` com prefixo | ✅ Implementado |
| Admin cross-city | `withoutTenant()` scope | ✅ Implementado |
| Domínios customizados | Tabela `city_domains` | ✅ Implementado |

**Recomendação**: Para produção nacional, considerar:
- Read replicas por região
- Cache distribuído (Redis Cluster)
- CDN para assets por cidade

---

## 📋 Checklist: Preparar para Produção (Tijucas SC)

### Backend (Prioridade Alta)

- [ ] Adicionar `city_id` aos modelos `Vereador` e `Votacao`
- [ ] Criar endpoint `GET /api/v1/config` para configuração dinâmica
- [ ] Seeder completo com cidade "Tijucas-SC" e todos bairros vinculados
- [ ] Migrar dados existentes: vincular todos registros atuais a Tijucas
- [ ] Criar tabelas `trash_schedules` e `mass_schedules`
- [ ] Testar isolamento: criar cidade "Teste" e garantir zero vazamento

### Frontend (Prioridade Alta)

- [ ] Modificar SDK para enviar header `X-City`
- [ ] Criar `useTenantStore` com fetch de config
- [ ] Remover dados hardcoded (lixo, missas)
- [ ] Criar fallback visual quando cidade não está ativa

### Painel Admin (Prioridade Média)

- [ ] Dashboard com seletor de cidade
- [ ] CRUD de `CityModule` (ativar/desativar features)
- [ ] Upload de branding por cidade
- [ ] Relatórios filtrados por cidade

### DevOps (Prioridade Baixa para MVP)

- [ ] Domínio wildcard `*.cidadeconectada.app`
- [ ] SSL wildcard ou Caddy auto-cert
- [ ] Pipeline de deploy com flag de cidade

---

## 🎯 Recomendação: Próximos Passos

### Fase 1: Consolidar Tijucas (Esta Sprint)

1. **Backend**: Endpoint `/api/v1/config` + migration de dados existentes
2. **Frontend**: SDK com `X-City` + `useTenantStore` básico
3. **Testar**: Flow completo de um usuário novo

### Fase 2: Robustez (Próxima Sprint)

1. Mover dados estáticos (lixo, missas) para banco
2. Feature flags funcionais no frontend
3. Painel admin com seletor de cidade

### Fase 3: Expansão (Futuro)

1. Segunda cidade como piloto (ex: Balneário Camboriú)
2. GPS auto-detect
3. Domain mapping por cidade

---

## 📁 Estrutura de Arquivos Relevantes

```
apps/api/
├── app/
│   ├── Http/Middleware/
│   │   └── TenantContext.php       ✅ Middleware principal
│   ├── Models/
│   │   ├── City.php                ✅ Modelo completo
│   │   ├── State.php               ✅ Modelo completo
│   │   ├── Module.php              ✅ Modelo completo
│   │   ├── CityModule.php          ✅ Modelo completo
│   │   ├── CityDomain.php          ✅ Modelo completo
│   │   └── User.php                ⚠️ Falta city_id scope
│   ├── Support/
│   │   ├── Tenant.php              ✅ Helper estático
│   │   ├── TenantCache.php         ✅ Cache por tenant
│   │   └── TenantUrl.php           ✅ URLs com tenant
│   └── Traits/
│       ├── BelongsToTenant.php     ✅ Trait principal
│       └── ValidatesTenant.php     ✅ Validação
└── database/migrations/
    ├── 2026_02_06_200001_create_cities_table.php
    ├── 2026_02_06_210001_create_states_table.php
    ├── 2026_02_06_210002_create_city_domains_table.php
    ├── 2026_02_06_210100_create_modules_table.php
    └── 2026_02_06_210101_create_city_modules_table.php

apps/web/src/
├── store/
│   ├── useAppStore.ts              ⚠️ Não tem city context
│   └── useAuthStore.ts             ⚠️ Não usa tenant
└── data/
    ├── trashData.ts                ❌ Hardcoded para Tijucas
    └── massData.ts                 ❌ Hardcoded para Tijucas

packages/sdk/src/
├── client.ts                       ❌ Não envia X-City header
└── index.ts
```

---

## 💡 Conclusão

A **fundação está sólida**. O trabalho de banco de dados e backend (80%) está bem executado com:
- Arquitetura de tenant column (`city_id`) correta
- Global scopes via trait (padrão Laravel)
- Sistema de feature flags por cidade
- Suporte a branding/white-label

O **gap principal é o Frontend**:
- SDK não envia identificador de cidade
- Não existe store de tenant
- Dados hardcoded impedem multi-city

**Prioridade 1**: Conectar o frontend ao contexto de cidade que já existe no backend.

---

> 💬 **Dúvidas?** Entre em contato com o time de arquitetura.
