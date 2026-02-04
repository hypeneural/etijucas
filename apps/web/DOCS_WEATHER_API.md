# 🌤️ Previsão do Tempo - Documentação Técnica

Integração completa com **Open-Meteo** para previsão do tempo e mar em Tijucas/SC.

---

## Stack Tecnológica

### Backend (Laravel 12)
| Tecnologia | Uso |
|------------|-----|
| **PHP 8.3** | Runtime |
| **Laravel 12** | Framework |
| **MariaDB** | Banco de dados |
| **Open-Meteo API** | Fonte de dados meteorológicos |
| **Cache::lock** | Anti-stampede / mutex |
| **HTTP Client** | Chamadas externas |

### Frontend (React/TypeScript)
| Tecnologia | Uso |
|------------|-----|
| **React 18** | UI Framework |
| **TypeScript** | Type safety |
| **TanStack Query** | Data fetching + cache |
| **Framer Motion** | Animações |
| **Iconify (MDI)** | Ícones de clima |
| **date-fns** | Formatação de datas |

---

## Arquitetura

```mermaid
flowchart TB
    subgraph "Frontend (PWA)"
        A[WeatherHomeCard] --> B[/weather/home]
        C[WeatherPage] --> D[/weather/forecast]
        C --> E[/weather/marine]
    end
    
    subgraph "Backend (Laravel)"
        B --> F[WeatherController]
        D --> F
        E --> F
        F --> G[OpenMeteoService]
        G --> H{Cache válido?}
        H -->|Sim| I[Retorna DB cache]
        H -->|Não| J[Lock + Fetch]
        J --> K[Open-Meteo APIs]
        K --> L[Salva cache 6h]
        L --> I
    end
    
    subgraph "External"
        K --> M[Weather API]
        K --> N[Marine API]
    end
```

---

## Endpoints da API

### `GET /api/v1/weather/home`
Card da home - payload leve e rápido.

**Parâmetros:**
| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `hours` | int | 8 | Qtd de horas futuras |
| `include` | string[] | todos | Blocos a incluir |

**Resposta:**
```json
{
  "location": { "key": "tijucas_sc", "name": "Tijucas/SC", "lat": -27.2414, "lon": -48.6336 },
  "cache": { "provider": "open_meteo", "cached": true, "stale": false, "fetched_at": "...", "expires_at": "..." },
  "current": { "temp_c": 28, "feels_like_c": 30, "weather_code": 3, "description": "Nublado", ... },
  "today": { "min_c": 22, "max_c": 30, "rain_prob_max_pct": 60, "sunrise": "...", "sunset": "..." },
  "next_hours": [{ "t": "...", "temp_c": 29, "rain_prob_pct": 25, "weather_code": 2 }, ...],
  "marine_preview": { "wave_m": 0.6, "wave_period_s": 6, "sea_temp_c": 26 }
}
```

---

### `GET /api/v1/weather/forecast`
Previsão completa em terra (hourly + daily).

**Parâmetros:**
| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `days` | int | 10 | Dias no bloco daily |
| `hours` | int | 72 | Horas no bloco hourly |
| `include` | string[] | todos | location, cache, current, hourly, daily |

---

### `GET /api/v1/weather/marine`
Previsão do mar (ondas, swell, correntes).

**Parâmetros:**
| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `days` | int | 10 | Dias no bloco daily |
| `hours` | int | 72 | Horas no bloco hourly |
| `include` | string[] | todos | location, cache, hourly, daily |

---

## Estrutura de Arquivos

### Backend
```
apps/api/
├── database/migrations/
│   └── 2026_02_04_140000_create_external_api_cache_table.php
└── app/Domains/Weather/
    ├── Models/
    │   └── ExternalApiCache.php
    ├── Services/
    │   └── OpenMeteoService.php
    └── Http/Controllers/
        └── WeatherController.php
```

### Frontend
```
apps/web/src/
├── types/
│   └── weather.ts              # Types + weather codes
├── services/
│   └── weather.service.ts      # API + React Query hooks
├── components/weather/
│   └── WeatherHomeCard.tsx     # Card animado
└── pages/
    └── WeatherPage.tsx         # Página com 3 abas
```

---

## Cache Strategy

| Camada | TTL | Descrição |
|--------|-----|-----------|
| **Database** | 6 horas | `external_api_cache` table |
| **React Query** | 5 min | `staleTime` no hook |
| **Browser** | 1 min | `Cache-Control: max-age=60` |

### Anti-Stampede
Usa `Cache::lock('lock:weather:tijucas', 30)` para evitar múltiplas requisições simultâneas ao Open-Meteo.

### Fallback Stale
Se o Open-Meteo falhar e existir cache expirado, retorna dados antigos com `stale: true`.

---

## Weather Codes (WMO)

| Code | Descrição | Ícone |
|------|-----------|-------|
| 0 | Céu limpo | `mdi:weather-sunny` |
| 1-2 | Parcialmente nublado | `mdi:weather-partly-cloudy` |
| 3 | Nublado | `mdi:weather-cloudy` |
| 45, 48 | Neblina | `mdi:weather-fog` |
| 51-55 | Garoa | `mdi:weather-rainy` |
| 61-65 | Chuva | `mdi:weather-pouring` |
| 80-82 | Pancadas | `mdi:weather-pouring` |
| 95-99 | Tempestade | `mdi:weather-lightning-rainy` |

---

## 🚀 Melhorias Sugeridas

### Offline-First

| Melhoria | Prioridade | Descrição |
|----------|------------|-----------|
| **IndexedDB cache** | 🔴 Alta | Salvar última resposta no IndexedDB para exibir imediatamente |
| **Background Sync** | 🟡 Média | Service Worker atualiza cache quando volta online |
| **Stale-while-revalidate** | 🔴 Alta | Mostrar dados antigos enquanto busca novos |
| **Prefetch** | 🟢 Baixa | Prefetch da página de previsão ao hover no card |

### Mobile-First

| Melhoria | Prioridade | Descrição |
|----------|------------|-----------|
| **Skeleton loading** | ✅ Feito | Já implementado |
| **Pull-to-refresh** | 🟡 Média | Adicionar na WeatherPage |
| **Swipe entre abas** | 🟡 Média | Usar `react-swipeable` ou gesture |
| **Adaptive colors** | 🟡 Média | Cores baseadas no weather_code atual |

### Native-Like

| Melhoria | Prioridade | Descrição |
|----------|------------|-----------|
| **Haptic feedback** | 🟡 Média | Vibrar ao mudar de aba |
| **Page transitions** | ✅ Feito | Framer Motion já aplicado |
| **Shared element** | 🟢 Baixa | Animação do card para página |
| **Weather widget** | 🟢 Baixa | Compartilhar via Web Share API |

### Performance

| Melhoria | Prioridade | Descrição |
|----------|------------|-----------|
| **ETag/304** | ✅ Feito | Suporte a If-None-Match |
| **Compression** | 🔴 Alta | Habilitar gzip no Laravel |
| **CDN** | 🟢 Baixa | Cache estático da resposta em CDN |
| **Partial updates** | 🟡 Média | Atualizar só `current` a cada hora |

### UX

| Melhoria | Prioridade | Descrição |
|----------|------------|-----------|
| **Notificações push** | 🟡 Média | Alertar sobre mudanças bruscas |
| **Favoritos** | 🟢 Baixa | Salvar horários/dias favoritos |
| **Comparação** | 🟢 Baixa | "Ontem vs Hoje" |
| **Gráficos** | 🟡 Média | Recharts para temperatura/chuva |

---

## Deploy

```bash
# No servidor
git pull origin main
php artisan migrate
php artisan cache:clear
```

A primeira requisição à API busca dados do Open-Meteo e cacheia por 6 horas.

---

## Referências

- [Open-Meteo Weather API](https://open-meteo.com/en/docs)
- [Open-Meteo Marine API](https://open-meteo.com/en/docs/marine-weather-api)
- [WMO Weather Codes](https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM)
