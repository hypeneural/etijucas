# Análise: Transformação para Multi-Tenancy por Cidade

> **Data**: 05/02/2026
> **Objetivo**: Tornar o sistema robusto, escalável e granular para atender múltiplas cidades (SaaS), mantendo a lógica atual mas permitindo ativação de módulos por cidade.

---

## 1. Diagnóstico Atual

Atualmente, o sistema opera em **Single-Tenancy** (implícito para "Tijucas-SC").

### Pontos Críticos Identificados:
1.  **Ausência de Entidades Geográficas Superiores**:
    - Não existem models `City` (Cidade) ou `State` (Estado).
    - `Bairro` existe como entidade raiz geográfica, sem vínculo com cidade.
    - `User`, `Topic`, `Venue` vinculam-se diretamente a `Bairro`.
2.  **Acoplamento Implícito**:
    - Features como "Lixo" e "Missas" são *Frontend-Driven* com dados estáticos (JSONs) específicos de Tijucas.
    - O código assume implicitamente que só existe uma prefeitura/câmara.
3.  **Modelos Ausentes/Inconsistentes**:
    - O model `User.php` faz referência a `Report::class`, mas o arquivo aparenta não existir ou ter nome divergente (provavelmente `CitizenReport`), o que quebraria a relação em um ambiente mais rigoroso.

---

## 2. Estratégia de Banco de Dados (Database)

A estratégia recomendada é **Multi-Tenancy com Database Único e Coluna Discriminadora (`city_id`)**.
*Motivo*: Mais fácil de manter, permite queries cross-city (ex: "eventos na região"), e simplifica backups e deploy para centenas de cidades pequenas.

### Novas Tabelas Necessárias

```sql
-- Estados
CREATE TABLE states (
    id CHAR(2) PRIMARY KEY, -- SC, SP, RJ
    name VARCHAR(100) NOT NULL
);

-- Cidades (O Tenat Principal)
CREATE TABLE cities (
    id UUID PRIMARY KEY,
    state_id CHAR(2) REFERENCES states(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL, -- ex: tijucas-sc, balneario-sc (usado na URL/API)
    
    -- Configurações visuais/básicas
    logo_url VARCHAR(255),
    primary_color VARCHAR(20),
    allow_registration BOOLEAN DEFAULT TRUE,
    
    is_active BOOLEAN DEFAULT TRUE
);

-- Módulos/Features por Cidade
CREATE TABLE city_features (
    id UUID PRIMARY KEY,
    city_id UUID REFERENCES cities(id),
    feature_key VARCHAR(50) NOT NULL, -- ex: 'module_legislativo', 'module_events', 'module_trash'
    is_enabled BOOLEAN DEFAULT FALSE,
    settings JSON, -- Config específicas (ex: URL do calendário de lixo, links externos)
    UNIQUE(city_id, feature_key)
);
```

### Alterações em Tabelas Existentes

Todas as tabelas principais devem receber `city_id` e indexação para performance.

| Tabela | Ação | Motivo |
| :--- | :--- | :--- |
| `users` | Add `city_id` (fk) | Define a "cidade casa" do usuário (default para filtros). |
| `bairros` | Add `city_id` (fk) | Bairros pertencem a uma cidade específica. |
| `citizen_reports` | Add `city_id` (fk) | Denúncias são roteadas para a prefeitura da cidade. |
| `events` | Add `city_id` (fk) | Eventos ocorrem em uma cidade (crucial para filtro 'Home'). |
| `topics` | Add `city_id` (fk) | Fórum deve ser segmentado (discussões locais). |
| `vereadores` | Add `city_id` (fk) | Vereadores são de uma câmara municipal específica. |
| `votacoes` | Add `city_id` (fk) | Sessões da câmara daquela cidade. |
| `phones` | Add `city_id` (fk) | Telefones úteis variam 100% por cidade. |

> **Nota**: `Venue` (Locais) pode herdar a cidade via `Bairro`, mas recomenda-se ter `city_id` direto para facilitar queries de mapa sem joins complexos.

---

## 3. Organização da Lógica (Backend)

Para garantir robustez e evitar vazamento de dados entre cidades (Data Leaking):

### A. Middleware de Tenancy (`DetectCity`)
Criar um middleware que intercepta todas as requisições API.
1.  Verifica header `X-City-ID` ou subdomínio/slug.
2.  Define a "Cidade Atual" em um Singleton/Service Container (`CurrentCity::get()`).
3.  Aplica o escopo globalmente.

### B. Global Scopes (Eloquent)
Criar uma Trait `BelongsToCity` que aplica automaticamente o `where('city_id', $currentCityId)`.

```php
trait BelongsToCity {
    public static function bootBelongsToCity() {
        static::addGlobalScope(new CityScope);
        static::creating(function ($model) {
            $model->city_id = CurrentCity::id();
        });
    }
}
```
Isso garante que `Event::all()` retorne apenas eventos da cidade atual, sem o desenvolvedor "esquecer" o filtro.

### C. Granularidade de Features (Feature Toggles)
Ao invés de `if ($city == 'Tijucas')`, use o service de features:

```php
if (CityFeature::isEnabled('module_legislativo')) {
    // Retorna dados da câmara
} else {
    // Retorna 404 ou vazio
}
```
Isso permite vender pacotes diferentes para prefeituras diferentes (ex: Plano Básico vs Plano Completo).

---

## 4. Organização do Frontend (Mobile/App)

### A. City Provider (Contexto)
O App deve ter um seletor de cidade no Onboarding (ou detectar via GPS).
Este estado (`selectedCity`) deve permear todas as chamadas API (enviando o header `X-City-ID`).

### B. Dados Dinâmicos vs Estáticos
Mover a lógica de "Lixo" e "Missas" (atualmente JSONs no frontend) para o Backend:
1.  Criar tabelas `trash_schedules` e `masse_schedules` no banco.
2.  A API retorna esses dados filtrados pela cidade.
3.  Isso elimina a necessidade de recompilar o App para adicionar uma nova cidade.

---

## 5. Roteiro Passo-a-Passo (Sugestão de Execução)

1.  **Fundação**: Criar migrations `states`, `cities`, `city_features`.
2.  **Migração de Dados**: Criar cidade "Tijucas" e vincular todos os registros atuais (users, bairros, events) a ela.
3.  **Refatoração Backend**: Implementar `TenantScope` e alterar Controllers para respeitar a cidade ativa.
4.  **Refatoração API**: Expor endpoints de configuração (`/api/v1/config`) para o App saber quais módulos ativar (ex: Esconder aba "Câmara" se a cidade não contratou o módulo).
5.  **Refatoração Frontend**: Criar selector de cidade e adapter para carregar configs dinâmicas.

---

## Resumo da Arquitetura

| Camada | Solução |
| :--- | :--- |
| **Banco** | Tabela Única por Entidade + Coluna `city_id` (Tenant Column). |
| **Código** | Traits de Escopo Global (`BelongsToCity`) + Middleware de Contexto. |
| **Config** | Tabela `city_features` (JSON settings) para flags de módulos. |
| **Frontend** | Contexto de Cidade + Header `X-City-ID` + UI Adaptativa via Flags. |

Esta arquitetura é a padrão de mercado para SaaS B2B2C (Prefeitura -> Cidadão) e escala para milhares de cidades sem sobrecarga de infraestrutura.
