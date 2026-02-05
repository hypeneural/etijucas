# Especificação: Onboarding, Endereçamento e Integração ViaCEP "Native-Like"

> [!IMPORTANT]
> Este documento define o padrão **definitivo** para endereçamento, normalização de bairros e fluxo de onboarding no application. O objetivo é garantir dados limpos (canonical data) enquanto oferece uma experiência de usuário fluida e "mágica" (native-like).

---

## 1. Visão Geral da Arquitetura de Dados

A premissa central é separar **Dados Canônicos** (controle do sistema) de **Dados Auxiliares** (inputs externos/ViaCEP).

### 1.1 Modelo de Banco de Dados (Schema)

#### Tabela: `cities` (Nova)
Fonte única de verdade para cidades. Preparado para multi-tenancy.
```sql
create table cities (
    id uuid primary key,
    ibge_code integer unique not null, -- ex: 4218007
    name varchar(255) not null,        -- ex: "Tijucas"
    uf char(2) not null,               -- ex: "SC"
    slug varchar(255) unique not null, -- ex: "tijucas-sc"
    lat decimal(10, 8),
    lon decimal(10, 8),
    timezone varchar(50) default 'America/Sao_Paulo',
    active boolean default false
);
```

#### Tabela: `bairros` (Alterada)
Vínculo forte com cidades. `locked` impede criação automática de lixo.
```sql
-- Adicionar city_id e unique constraint
alter table bairros add column city_id uuid references cities(id);
alter table bairros add column locked boolean default true;
alter table bairros add UNIQUE (city_id, slug);
```

#### Tabela: `bairro_aliases` (Nova)
O segredo para não deixar o ViaCEP sujar o banco. Mapeia "texto do ViaCEP" para "ID oficial".
```sql
create table bairro_aliases (
    id uuid primary key,
    city_id uuid references cities(id),
    bairro_id uuid references bairros(id),
    alias varchar(255) not null,       -- ex: "Várzea / Sertãozinho"
    alias_slug varchar(255) not null,  -- ex: "varzea-sertaozinho"
    unique(city_id, alias_slug)
);
```

#### Tabela: `users` (Ajuste)
```sql
-- users.city_id (novo, redundante mas útil para tenant scope rápido)
-- users.bairro_id (já existe - CANÔNICO)
-- users.address (JSON - AUXILIAR + DETALHES)
```

### 1.2 Schema Unificado de Endereço (DTO)
Este DTO deve ser idêntico no Backend (`AddressDTO`) e Frontend (`Address`).

```typescript
export interface AddressDTO {
  cep: string;              // "88200-000" (com máscara) ou "88200000" (limpo)
  logradouro?: string;      // "Rua Coronel Buchele"
  numero?: string;          // "123"
  complemento?: string;     // "Apto 101"
  bairro_text?: string;     // "Centro" (Texto original do ViaCEP/Input)
  city_name?: string;       // "Tijucas"
  uf?: string;              // "SC"
  ibge_code?: string;       // "4218007"
  source?: 'manual' | 'viacep' | 'gps';
}
```

---

## 2. Lógica de Normalização "Smart Match"

O backend deve possuir um serviço robusto para encontrar o bairro correto sem criar duplicatas.

### 2.1 Algoritmo `normalizeNeighborhood` (Backend)

```php
function resolveBairro(string $cityId, string $bairroText): ?string
{
    // 1. Normalização básica de string
    $normalizedText = Str::of($bairroText)
        ->ascii()                // Remove acentos (Várzea -> Varzea)
        ->lower()                // Lowercase
        ->replace(['/', '-'], ' ') // "Várzea / Sertãozinho" -> "varzea sertaozinho"
        ->squish()               // Remove espaços duplos
        ->finish();              // "varzea sertaozinho"
    
    $slug = Str::slug($bairroText); // Slug padrão Laravel

    // 2. Tentativa 1: Match Exato via Slug na tabela BAIRROS
    $bairro = Bairro::where('city_id', $cityId)
        ->where('slug', $slug)
        ->first();
    
    if ($bairro) return $bairro->id;

    // 3. Tentativa 2: Match via Alias na tabela BAIRRO_ALIASES
    // Útil para casos onde ViaCEP retorna "Várzea" mas o bairro chama "Várzea / Sertãozinho"
    // Ou erros de digitação comuns mapeados
    $alias = BairroAlias::where('city_id', $cityId)
        ->where('alias_slug', Str::slug($normalizedText)) -- Simplificação aqui
        ->first();

    if ($alias) return $alias->bairro_id;

    // 4. Tentativa 3: Fuzzy Match (Opcional Futuro - Levenshtein)
    
    // 5. Fallback: Retorna null (Front pede confirmação manual ou usa "Outros")
    return null; // ou Bairro::whereSlug('outros')->id
}
```

---

## 3. Fluxo de UX: Onboarding "Native-Like"

O objetivo é atrito zero. O CEP entra apenas como facilitador, nunca como bloqueio.

### Fluxograma

```mermaid
graph TD
    A[Usuário abre App pela 1ª vez] -->|Guest| B[Splash Screen]
    B --> C{Tem Bairro Salvo?}
    C -->|Não| D[Seletor de Bairro Guest]
    C -->|Sim| E[Home Page]
    D -->|Salva no IndexedDB| E
    
    E --> F[Clicar em Entrar/Perfil]
    F --> G[Login Passwordless/OTP]
    G --> H[Verificação Concluída]
    
    H --> I{Perfil Completo?}
    I -->|Sim| J[Home Logado]
    I -->|Não| K[Onboarding Sheet]
    
    subgraph "Onboarding Sheet (Obrigatório)"
        K --> L[Etapa 1: Nome + Bairro]
        L -->|Bairro pré-preenchido do GuestDB| M[Botão Continuar]
        M --> N[Etapa 2: Endereço Smart]
    end
    
    N --> O[Digita CEP (Busca Auto)]
    O -->|ViaCEP Sucesso| P[Preenche Campos]
    P --> Q{Bairro Match?}
    Q -->|Sim (100%)| R[Exibe Endereço Completo]
    Q -->|Não/Dúvida| S[Pede Confirmação do Bairro]
    
    S --> R
    R --> T[Salvar e Finalizar]
```

### Detalhes das Telas

#### Estado 1: Guest (Não Logado) - Home Header
*   **Componente**: `NeighborhoodSelector`
*   **Ação**: Dropdown simples listando apenas `bairros` (active=true).
*   **Persistência**: `localStorage` / `IndexedDB` (`guest_city_slug`, `guest_bairro_id`).

#### Estado 2: Onboarding - Passo "Nome e Local" (Fast)
*   **Campos**:
    *   `Nome` (Input Text)
    *   `Bairro` (Select) -> **Vem pré-selecionado** com o valor do Guest.
*   **Botão**: "Continuar"
*   *Nota*: Isso garante que o usuário já tenha um bairro válido (users.bairro_id) mesmo se abandonar o CEP.

#### Estado 3: Onboarding - Passo "Endereço Completo" (Enrichment)
*   **Campos**:
    *   `CEP` (Mask 00000-000)
    *   Botão **"Buscar"** (ou auto-trigger ao completar 8 dígitos).
*   **Feedback Visual "Native-Like"**:
    *   Enquanto busca: *Skeleton Loader* nos campos abaixo.
    *   Sucesso: Campos aparecem com animação *Fade In*.
*   **Campos de Endereço**:
    *   `Logradouro` (Preenchido)
    *   `Número` (Foco automático aqui!)
    *   `Complemento` (Opcional)
    *   `Bairro` (Confirmar):
        *   Se o backend retornou `match.bairro_ok = true`: Mostra texto estático "Bairro: Centro" (com ícone de check).
        *   Se `match.bairro_ok = false`: Mostra Select com o bairro sugerido selecionado ou "Selecione..." se não achou nada.

---

## 4. Integração API

### Endpoint: `GET /api/v1/cep/{cep}`

**Request**:
`GET /api/v1/cep/88200000`

**Response**:
```json
{
  "success": true,
  "data": {
    "address": {
      "cep": "88200000",
      "logradouro": "Avenida Bayer Filho",
      "bairro_text": "Centro",
      "city_name": "Tijucas",
      "uf": "SC",
      "ibge_code": "4218007",
      "source": "viacep"
    },
    // Metadados de Match para o Frontend tomar decisão inteligente
    "match": {
      "city_id": "uuid-tijucas-123",
      "city_ok": true,          // Se false, mostrar erro "Ainda não atendemos sua cidade"
      "bairro_id": "uuid-centro-456",
      "bairro_ok": true,        // Se true, pode travar o select de bairro ou só mostrar
      "method": "direct"        // direct, alias, fuzzy, manual
    }
  }
}
```

---

## 5. Plano de Execução (Roadmap)

1.  **Database Migration**:
    *   Criar `cities` (seed inicial: Tijucas).
    *   Atualizar `bairros` (add `city_id` e `locked`).
    *   Criar `bairro_aliases`.
2.  **Seeders**:
    *   Populando Tijucas com dados reais do IBGE (dataset municipios-brasileiros).
    *   Criar Aliases comuns para Tijucas (baseado em logs ou conhecimento local).
3.  **Backend Logic**:
    *   Implementar `ViaCepService` com Cache.
    *   Implementar `NeighborhoodMatcher` (lógica de normalização).
    *   Criar endpoint `GET /cep/{cep}`.
4.  **Frontend Refactor**:
    *   Atualizar tipos `AddressDTO`.
    *   Criar store slice para `onboarding`.
    *   Implementar novas telas de Onboarding no `RegisterFlow`.

---

## Exemplos de "Microinterações Native-Like"

> [!TIP]
> **O "Pulo do Gato" (Cursor Focus)**
> Quando o CEP retorna sucesso:
> 1. Preencha os campos `Logradouro`, `Bairro`, `Cidade`.
> 2. Mova o cursor **automaticamente** para o campo `Número`.
> 3. Abra o teclado numérico (se mobile).
> Isso cria a sensação de agilidade extrema.

> [!TIP]
> **Confirmação Sutil**
> Ao invés de perguntar "O bairro X está correto?", simplesmente mostre o bairro preenchido num campo "disabled" mas com um botão pequeno "Alterar" ao lado. Se o usuário não tocar, assumimos que o match foi perfeito.
