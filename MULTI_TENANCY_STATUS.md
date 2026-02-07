# Multi-Tenancy por Cidade - Status & Roadmap

> **Data:** 2026-02-07  
> **Versão:** 2.0  
> **Autor:** Claude (AI Assistant)

---

## Resumo Executivo

O app **ETijucas** implementou arquitetura multi-tenancy baseada em cidades. O sistema suporta:
- Isolamento de dados por cidade
- Módulos/features habilitáveis por cidade
- URLs dinâmicas `/uf/cidade` (ex: `/sc/itajai`)
- Fallback automático para Tijucas/SC

---

## 1. Arquitetura Implementada

### 1.1 Backend (Laravel)

```
┌─────────────────────────────────────────────────────────────┐
│                      HTTP Request                           │
│                   X-City: tijucas-sc                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              TenantContext Middleware                        │
│  - Resolve city from host/header                            │
│  - Popula Tenant::$current                                  │
│  - Disponibiliza Tenant::cityId()                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Models com BelongsToTenant                   │
│  - Topic, Comment, Event, CitizenReport                     │
│  - Scoped automaticamente por city_id                       │
└─────────────────────────────────────────────────────────────┘
```

#### Arquivos Chave (Backend)

| Arquivo | Propósito |
|---------|-----------|
| `app/Support/Tenant.php` | Singleton com contexto da cidade atual |
| `app/Http/Middleware/TenantContext.php` | Resolve tenant de header/host |
| `app/Traits/BelongsToTenant.php` | Trait para models tenant-aware |
| `app/Traits/TenantAwareJob.php` | Jobs com contexto de tenant |
| `app/Support/TenantCache.php` | Cache prefixado por tenant |

### 1.2 Frontend (React/Vite)

```
┌─────────────────────────────────────────────────────────────┐
│                      App.tsx                                 │
│                  TenantBootstrap                             │
│  - Detecta cidade da URL (/uf/cidade)                       │
│  - Fallback para 'tijucas-sc'                               │
│  - Chama useTenantStore.bootstrap()                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  useTenantStore (Zustand)                    │
│  - state: city, modules, brand, geo                         │
│  - actions: bootstrap(), isModuleEnabled()                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Componentes/Pages                         │
│  - useCityName() → nome da cidade                           │
│  - useCityRoute() → links com prefixo                       │
│  - QuickAccessGridVivo → filtra por módulos                 │
└─────────────────────────────────────────────────────────────┘
```

#### Arquivos Chave (Frontend)

| Arquivo | Propósito |
|---------|-----------|
| `constants/tenant.ts` | DEFAULT_CITY, ALL_MODULES, MODULE_ROUTES |
| `store/useTenantStore.ts` | Estado global do tenant |
| `hooks/useCityName.ts` | Hook para nome dinâmico da cidade |
| `hooks/useCityRoute.ts` | Hook para URLs com prefixo cidade |
| `components/ModuleGate.tsx` | Renderização condicional por módulo |
| `components/ModuleUnavailable.tsx` | Fallback para módulo desabilitado |

---

## 2. Status de Implementação

### ✅ COMPLETO

| Item | Backend | Frontend | Notas |
|------|---------|----------|-------|
| Tenant Resolution | ✅ | ✅ | Via header X-City ou URL |
| Tabela `cities` | ✅ | - | Com ibge_code, status, brand |
| Tabela `city_modules` | ✅ | - | N:N city ↔ module |
| `city_id` em todas tabelas | ✅ | - | topics, comments, events, reports, etc |
| Bootstrap automático | ✅ | ✅ | Carrega config no App init |
| API `/api/v1/config` | ✅ | ✅ | Retorna city, modules, brand, geo |
| Rotas `/:uf/:cidade/*` | - | ✅ | Ex: /sc/itajai/coleta-lixo |
| Filtro de módulos no grid | - | ✅ | QuickAccessGridVivo |
| City name dinâmico | - | ✅ | useCityName, useAppName |
| ibge_code corrigido | ✅ | - | 4218004 (era 4218007) |

### ⚠️ PARCIALMENTE IMPLEMENTADO

| Item | Status | O que falta |
|------|--------|-------------|
| Módulos por cidade | 70% | Tabela existe mas não está populada - endpoint retorna `modules: []` |
| ModuleGate nas rotas | 50% | Componente existe mas não está aplicado em todas rotas |
| URLs com prefixo cidade | 80% | Rotas funcionam, falta atualizar TODOS os navigate() |

### ❌ NÃO IMPLEMENTADO

| Item | Prioridade | Descrição |
|------|------------|-----------|
| Seleção de cidade no onboarding | P1 | Usuário escolher cidade no cadastro |
| Query string `?city=slug` | P2 | Alternativa à URL path |
| Temas (cores) por cidade | P2 | Usar brand.primaryColor |
| Validação de permissão de acesso | P2 | Usuário X pode acessar cidade Y? |
| Rate limiting por tenant | P3 | Prevenir abuso por cidade |
| Analytics por cidade | P3 | Métricas segmentadas |

---

## 3. Banco de Dados

### Schema Atual

```sql
-- Cidades
CREATE TABLE cities (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255),
  slug VARCHAR(255) UNIQUE,    -- 'tijucas-sc'
  state_id CHAR(36),
  ibge_code INT,               -- 4218004
  status ENUM('active','inactive','pending'),
  lat DECIMAL(10,8),
  lon DECIMAL(11,8),
  app_name VARCHAR(255),       -- 'eTijucas'
  primary_color VARCHAR(7),    -- '#10B981'
  secondary_color VARCHAR(7),
  created_at, updated_at
);

-- Módulos disponíveis
CREATE TABLE modules (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(50) UNIQUE,     -- 'forum', 'events', etc
  name VARCHAR(255),
  description TEXT,
  icon VARCHAR(50)
);

-- Módulos habilitados por cidade
CREATE TABLE city_modules (
  id CHAR(36) PRIMARY KEY,
  city_id CHAR(36),
  module_id CHAR(36),
  enabled BOOLEAN DEFAULT true,
  settings JSON,               -- Configurações específicas
  UNIQUE(city_id, module_id)
);

-- Domínios por cidade
CREATE TABLE city_domains (
  id CHAR(36) PRIMARY KEY,
  city_id CHAR(36),
  domain VARCHAR(255),         -- 'eitajai.com.br'
  is_primary BOOLEAN,
  is_canonical BOOLEAN
);
```

### Migrações Aplicadas

- [x] `create_cities_table`
- [x] `add_city_id_to_bairros`
- [x] `create_bairro_aliases_table`
- [x] `create_modules_table`
- [x] `create_city_modules_table`
- [x] `add_city_id_to_users_table`
- [x] `add_city_id_to_topics_comments`
- [x] `add_city_id_to_citizen_reports`
- [x] `add_city_id_to_events`
- [x] `create_trash_schedules_table`
- [x] `create_mass_schedules_table`
- [x] `fix_tijucas_ibge_code` ← **IMPORTANTE**

---

## 4. Fluxo de Dados

### 4.1 Bootstrap do Tenant

```
1. Usuário acessa /sc/itajai
2. TenantBootstrap detecta uf='sc', cidade='itajai'
3. Chama useTenantStore.bootstrap('itajai-sc')
4. SDK faz GET /api/v1/config com header X-City: itajai-sc
5. Backend resolve cidade, retorna config
6. Frontend armazena no Zustand
7. Componentes renderizam baseado no contexto
```

### 4.2 Verificação de Módulo

```typescript
// Frontend
const isModuleEnabled = useTenantStore(s => s.isModuleEnabled);

if (isModuleEnabled('forum')) {
  // Mostra item no grid
}

// Ou via componente
<ModuleGate module="forum">
  <ForumScreen />
</ModuleGate>
```

---

## 5. Próximos Passos - Roadmap

### P0: Crítico (Bloqueia lançamento)

| Task | Esforço | Descrição |
|------|---------|-----------|
| Popular tabela `city_modules` | 1h | INSERT Tijucas com todos módulos enabled |
| Limpar cache `/api/v1/config` | 5min | `php artisan cache:clear` em produção |
| Testar CEP em Tijucas | 30min | Verificar que ibge_code 4218004 funciona |

### P1: Alta Prioridade (1 semana)

| Task | Esforço | Descrição |
|------|---------|-----------|
| Aplicar `ModuleGate` em TODAS rotas | 4h | Proteger /forum, /missas, /coleta, etc |
| Atualizar TODOS `navigate()` | 4h | Usar `buildRoute()` do useCityRoute |
| Footer dinâmico | 2h | Links do footer usar cidade atual |
| Back button preservar cidade | 2h | Voltar para /sc/itajai/mais, não /mais |
| Loading skeleton no bootstrap | 2h | Melhorar UX inicial |

### P2: Média Prioridade (2-4 semanas)

| Task | Esforço | Descrição |
|------|---------|-----------|
| Seleção de cidade no cadastro | 8h | Dropdown ou autocomplete de cidades |
| Painel admin de cidades | 16h | CRUD de cities, modules, domains |
| Temas dinâmicos | 8h | CSS variables baseadas em brand.primaryColor |
| SEO por cidade | 4h | Meta tags, title dinâmico |

### P3: Futuro

- Analytics segmentado por cidade
- Rate limiting por tenant
- Webhooks por cidade
- API pública multi-tenant

---

## 6. Configuração de Nova Cidade

### Checklist para Adicionar Cidade

```bash
# 1. Inserir cidade
INSERT INTO cities (id, name, slug, state_id, ibge_code, status, app_name)
VALUES (UUID(), 'Itajaí', 'itajai-sc', '<state_id_sc>', 4208203, 'active', 'eItajai');

# 2. Copiar bairros (se existirem)
INSERT INTO bairros (id, name, slug, city_id, active)
SELECT UUID(), name, slug, '<new_city_id>', true
FROM bairros WHERE city_id = '<tijucas_id>';

# 3. Habilitar módulos
INSERT INTO city_modules (id, city_id, module_id, enabled)
SELECT UUID(), '<new_city_id>', id, true
FROM modules WHERE slug IN ('forum', 'denuncias', 'tempo');

# 4. Configurar domínio (opcional)
INSERT INTO city_domains (id, city_id, domain, is_primary)
VALUES (UUID(), '<new_city_id>', 'eitajai.com.br', true);
```

### Módulos Default para Novas Cidades

Definido em `constants/tenant.ts`:

```typescript
export const DEFAULT_CITY_MODULES = ['forum', 'denuncias', 'tempo'];
```

---

## 7. API Reference

### GET /api/v1/config

**Headers:** `X-City: tijucas-sc`

**Response:**
```json
{
  "success": true,
  "data": {
    "city": {
      "id": "019c35d1-0fa0-7134-8bc4-553d0d9d0f98",
      "name": "Tijucas",
      "slug": "tijucas-sc",
      "uf": "SC",
      "fullName": "Tijucas/SC",
      "status": "active",
      "ibgeCode": 4218004
    },
    "brand": {
      "appName": "eTijucas",
      "primaryColor": "#10B981",
      "secondaryColor": "#059669"
    },
    "modules": [
      { "slug": "forum", "name": "Boca no Trombone", "enabled": true },
      { "slug": "events", "name": "Agenda de Eventos", "enabled": true }
    ],
    "geo": {
      "defaultBairroId": "019c35d3-7ee3-7375-963f-25db17a9a1f5",
      "lat": "-27.23540000",
      "lon": "-48.63220000"
    }
  }
}
```

---

## 8. Troubleshooting

### Problema: modules retorna array vazio

**Causa:** Tabela `city_modules` não populada.

**Solução:**
```sql
-- Verificar
SELECT * FROM city_modules WHERE city_id = '<tijucas_id>';

-- Popular
INSERT INTO city_modules (id, city_id, module_id, enabled)
SELECT UUID(), c.id, m.id, true
FROM cities c
CROSS JOIN modules m
WHERE c.slug = 'tijucas-sc';
```

### Problema: ibgeCode errado no /config

**Causa:** Cache.

**Solução:**
```bash
php artisan cache:clear
# Ou aguardar expiração (5min default)
```

### Problema: Rota /sc/itajai não funciona

**Causa:** Rotas com prefixo não definidas ou cidade não existe.

**Verificar:**
1. App.tsx tem `<Route path="/:uf/:cidade" ...>`
2. Cidade existe no banco com status 'active'
3. Console do browser não mostra 404 no /api/v1/config

---

## 9. Contatos

- **Backend:** [Backend Team]
- **Frontend:** [Frontend Team]
- **DevOps:** [DevOps Team]

---

> *Este documento deve ser atualizado a cada sprint de multi-tenancy.*
