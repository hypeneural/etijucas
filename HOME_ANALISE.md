## Visão geral da Home

A tela `HomeScreen` é a **tela principal** do app, carregada pelo `AppShell` quando a aba ativa (`activeTab`) é `'home'`. Ela é pensada para **mobile-first**, com layout em coluna, cabeçalho hero animado, conteúdo rolável e uma bottom tab bar fixa com navegação tipo **native-like** (animações de transição, pull‑to‑refresh, feedback tátil e skeletons).

- **Componentes principais da Home**
  - **`HeroHeader`** (`HeroHeader.tsx`):
    - Branding (`eTijucas`) com animações de ondas SVG e “pontos flutuantes”.
    - Botão de notificações com badge hard-coded (`2`) por enquanto, ainda sem integração com endpoint de notificações.
    - Avatar/perfil:
      - Usa `useAuthStore` (`user`, `isAuthenticated`).
      - Navega para `/perfil` se autenticado, caso contrário `/login`.
    - Saudação dinâmica via `WelcomeGreeting` (recebe `todayEventsCount`, `hasActiveAlert`, `streakDays` — hoje ainda passados como valores fixos pela Home).
    - Seletor de bairro:
      - Usa `useAppStore` (`selectedBairro`, `setSelectedBairro`) e `bairros` de `constants`.
      - Exibe um `Sheet` bottom usando `Sheet`, `SheetContent`, `SheetTitle`.
      - A transição de altura do cabeçalho é vinculada ao scroll (`useScroll` com `scrollRef`), dando efeito de colapso conforme o usuário rola.
  - **`AlertBanner`** (`AlertBanner.tsx`):
    - Banner sticky no topo (classe `sticky top-0 z-50`).
    - Recebe `alerts: Alert[]` e cicla pelos alertas visíveis com animações de entrada/saída (`AnimatePresence`).
    - Ícones e cores variam por tipo de alerta: `obras`, `interdicao`, `evento`, `clima`.
    - Possui:
      - Botão de fechar (marca o alerta como “dismissed” localmente).
      - Contador de alertas (`1/N`) com navegação entre alertas.
      - Ação principal via `onTap` (ainda sem rota de detalhe implementada na Home).
  - **Pull‑to‑refresh nativo customizado** (dentro de `HomeScreen.tsx`):
    - Usa `useSpring` (`springPull`) e `useTransform` (`pullHeight`, `iconRotation`, `iconScale`) com constantes `PULL_THRESHOLD`, `MAX_PULL_DISTANCE`, `RUBBER_BAND_FACTOR`.
    - Gatilhos de toque:
      - `onTouchStart`: inicia o estado de “puxando” se o scroll está no topo.
      - `onTouchMove`: calcula `deltaY` com efeito borracha exponencial.
      - `onTouchEnd`: dispara `handleRefresh` se passou do threshold, senão reseta.
    - `handleRefresh` hoje apenas:
      - Marca `isRefreshing` no `useAppStore`.
      - Aguarda `setTimeout` de 1.5s.
      - Mostra toast genérico de “Conteúdo atualizado”.
      - **Não está encadeando uma refetch explícita dos hooks de dados** (eventos, turismo, fórum, denúncias).
  - **Conteúdo da Home** (dentro do container rolável principal):
    - `SearchBar`: campo de busca + chips inteligentes que mudam de tab (`TabId`) ou disparam ações futuras de filtro.
    - `InstallCard`: componente para incentivar instalação do PWA (não usa endpoints).
    - `TodayBentoGrid`: bloco “Hoje em Tijucas” com cards de eventos, missas, alertas e turismo.
    - `EventsCarousel`: carrossel horizontal de próximos eventos, usando API real.
    - `TourismHighlights`: destaque de pontos turísticos com hook offline-first.
    - `ReportCTA`: card “Fiscaliza Tijucas” com KPIs de denúncias via API.
    - `ForumPreview`: bloco “Boca no Trombone”, baseado em hook offline-first de tópicos.
    - `QuickAccessGrid`: atalhos fixos para rotas de serviços (`/agenda`, `/pontos-turisticos`, `/missas`, `/telefones`, `/coleta-lixo`, `/denuncias`).

O container principal da Home utiliza `className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide"` e é integrado ao sistema de **scroll por aba** do `AppShell` (`scrollRef`), preservando a posição de scroll entre trocas de tab — reforçando a sensação de app nativo.

## Fluxos de dados da Home e endpoints envolvidos

### `TodayBentoGrid` – “Hoje em Tijucas”

- **Fonte de dados de eventos**
  - Usa o hook offline-first `useUpcomingOfflineEvents(5)` (`useOfflineEvents.ts`):
    - Estratégia:
      - Lê primeiro do IndexedDB (`eventsDB.getAll()`).
      - Se online, chama `eventService.getUpcoming(limit)` (API real) e atualiza o cache.
      - Em caso de falha, mantém dados do cache local.
    - `eventService.getUpcoming(limit)` (`event.service.ts`):
      - Chama `apiClient.get(ENDPOINTS.events.upcoming, { limit })`.
      - Endpoint de backend (`apps/api`) correspondente (via `ENDPOINTS`):
        - Geralmente algo como `GET /api/events/upcoming` (a definição exata está em `api/config`, mas a semântica é esta).
  - O componente filtra esses eventos para o dia atual:
    - Compara `new Date(e.dateTime).toDateString()` com a data de hoje.
    - Mostra contagem de eventos de **hoje** e detalhe do próximo horário.

- **Missas, turismo e alertas**
  - `massSchedules`, `tourismSpots`, `alerts` vêm de `mockData.ts`:
    - São arrays estáticos com horários de missa, pontos turísticos e alertas da cidade (incluindo um alerta de tipo `clima`).
  - O TODO em `TodayBentoGrid` deixa claro que:
    - **Missas**, **turismo** e **alertas** ainda não usam hooks offline-first nem APIs dedicadas.
    - Futuro desejado: substituir esses mocks por hooks semelhantes a `useOfflineEvents` com IndexedDB + API.

### `EventsCarousel` – próximos eventos com API real

- **Hook de dados**
  - Usa `useEvents` (`hooks/queries/useEventsApi.ts`), que integra com a API V2 de eventos (`eventApiService`):
    - Chamada:
      - `useEvents({ perPage: 15, orderBy: 'startDateTime', order: 'asc' })`.
    - `useEvents` faz:
      - `eventApiService.getAll(filters)` com cache `react-query` (staleTime = 5 min).

- **Service de eventos V2 (`event.api.service.ts`)**
  - Endpoints utilizados pelo fluxo da Home (direta ou indiretamente):
    - `getAll` → `ENDPOINTS.events.list` → `GET /events` com query params (paginados, ordenados).
    - `getUpcoming` / `getToday` / `getWeekend` / `getFeatured`:
      - `ENDPOINTS.events.upcoming`, `...today`, `...weekend`, `...featured`.
    - `getHomeFeatured`:
      - Endpoint otimizado pensado para **Home**:
      - `GET ENDPOINTS.events.homeFeatured` (por ex. `/events/home/featured`).
      - Retorna bloco `HomeFeaturedResponse` com:
        - Highlight, eventos de hoje, fim de semana, próximos.
      - Atual estado da Home **ainda não consome** esse endpoint otimizado; ela monta as seções a partir de chamadas mais genéricas.
  - Esse service também:
    - Faz cache em IndexedDB (`eventsDB`) para offline.
    - Tem fallback de dados quando a API está indisponível, montando respostas a partir do cache.

### `TourismHighlights` – turismo offline-first

- **Hook `useOfflineTourism`**
  - Estratégia:
    - Verifica versão de cache (`TOURISM_CACHE_VERSION`).
    - Se online:
      - Tenta `tourismService.getAll()` (API real).
      - Cacheia em IndexedDB (`tourismDB`).
    - Se API falhar:
      - Fallback para IndexedDB.
      - Em DEV, fallback final para `tourismSpotsMock`.
  - Dados expostos:
    - `featuredSpots`: filtro de `spots` com `isDestaque`, limitado a 4.
    - `likeSpot`, `saveSpot`: mutações otimizadas que podem enfileirar ações em `syncQueueDB` para envio posterior quando online.

- **Comportamento na Home**
  - `TourismHighlights` consome `featuredSpots`:
    - Carrossel com auto-play, arraste horizontal (`drag="x"`).
    - Botões de like/salvar com atualizações otimistas.
    - Navegação interna para `/ponto-turistico/{id}` e `/pontos-turisticos`.
  - Endpoints envolvidos (via `tourismService`):
    - `GET /tourism/spots` (lista).
    - `GET /tourism/spots/{id}/reviews` (detalhes e avaliações, usados em telas detalhadas, não diretamente na Home).

### `ForumPreview` – Boca no Trombone (tópicos offline-first)

- **Hook `useOfflineTopics`**
  - Segue padrão offline-first:
    - Lê de IndexedDB.
    - Sincroniza com API quando online (detalhes no hook, não colados aqui).
  - `ForumPreview` usa:
    - `topics` (array).
    - `useLikeOfflineTopic` para like otimista com checagem de autenticação.

- **Comportamento na Home**
  - Mostra 3 tópicos mais relevantes segundo `sortBy`:
    - `'curtidos'`: ordena por `likesCount`.
    - `'recentes'`: ordena por `createdAt`.
    - `'perto'`: filtra por `selectedBairro.id`.
  - Exibe KPIs agregados:
    - Total de tópicos e total de comentários (somatório local).
  - Navegação:
    - Botão “Ver todos” muda tab para `'forum'`.
    - Clique em um card também leva para `'forum'` (via `onNavigate('forum')`).

### `ReportCTA` – Fiscaliza Tijucas com KPIs de denúncias

- **Hook de dados**
  - Usa `useQuery` direto com API:
    - `queryKey: QUERY_KEYS.reports.stats()`.
    - `queryFn: () => reportService.getReportsStats()`.
    - Cache de 10 minutos.
  - `reportService.getReportsStats()` (em `report.service.ts`):
    - Endpoint do backend (via `ENDPOINTS.reports.stats()`), semanticamente algo como:
      - `GET /reports/stats` ou similar.
    - Retorno com campos:
      - `total`, `byStatus`, `thisMonth`, `resolvedThisMonth`, etc.

- **Visualização na Home**
  - KPIs animados:
    - Total de denúncias, em análise, resolvidas (com `AnimatedCounter`).
  - Quick categories:
    - Botões “Buraco”, “Iluminação”, “Lixo”, “Outros” — todos redirecionando para o fluxo de criação (`/denuncia/nova`).
  - CTAs:
    - “Reportar agora” → `/denuncia/nova`.
    - “Ver” → `/denuncias`.

### `EventsCarousel` e integração com Agenda

- A Home oferece um **preview de agenda**:
  - Carrega eventos via `useEvents` com filtros e paginação.
  - Calcula:
    - Quantidade de eventos na semana.
    - Quantidade de eventos hoje.
    - Quantidade de eventos gratuitos (ticket `type === 'free'`).
  - Oferece:
    - Botão “Ver todos” → tab `'agenda'`.
    - Card “Ver agenda” ao final do carrossel → também tab `'agenda'`.
  - Endpoints por trás:
    - `GET ENDPOINTS.events.list` com filtros de ordenação.

### Outros componentes da Home

- **`SearchBar`**
  - Hoje não dispara busca real:
    - Input sem `onChange`/`onSubmit` conectado a endpoint.
    - “Smart chips” redirecionam para tabs (`'reportar'`, `'agenda'`, `'mais'`) ou marcações futuras de filtro.
  - O backend já possui endpoints adequados para busca (por exemplo, `useSearchEvents`, endpoints de tópicos, etc.), mas a Home ainda não orquestra isso a partir do campo de busca principal.

- **`QuickAccessGrid`**
  - Apenas navegação de rotas locais, sem consumir endpoints diretamente da Home.

- **`HeroHeader` + `WelcomeGreeting`**
  - `WelcomeGreeting` recebe `todayEventsCount`, `hasActiveAlert`, `streakDays`:
    - Atualmente os valores vêm fixos da Home (`0`, `activeAlerts.length > 0`, `3`).
    - Potencial de conexão:
      - `todayEventsCount` poderia ser derivado de `EventsCarousel` ou `useTodayEvents`.
      - `hasActiveAlert` já poderia ser calculado com base em alertas reais (quando migrados de mock para API).
      - `streakDays` poderia vir de uma API de gamificação/engajamento do usuário.

## Navegação e Stacks

A navegação principal é **tab-based**, controlada por `AppShell` e `BottomTabBar`:

- **Tabs definidas em `BottomTabBar`**
  - `TabId = 'home' | 'reportar' | 'forum' | 'agenda' | 'mais'`.
  - Cada tab tem ícone (lucide) e label:
    - **home**: “Início”
    - **reportar**: “Fiscaliza”
    - **forum**: “Trombone”
    - **agenda**: “Agenda”
    - **mais**: “Mais”
  - A seleção de tab anima ícone, label e um pequeno indicador (“dot”) inferior com `framer-motion`, criando interação **native-like**.

- **Stack de telas dentro de `AppShell`**
  - `AppShell` mantém:
    - `activeTab` (via `useAppStore`).
    - `scrollRefs` e `scrollPositions` por aba, preservando scroll ao alternar.
  - Para cada `TabId`, é carregada uma “screen” com `React.lazy` + `Suspense`:
    - `HomeScreen`, `ReportScreen`, `ForumScreen`, `AgendaScreen`, `MoreScreen`.
  - As transições entre tabs são animadas com `AnimatePresence` e variantes (`pageVariants`) que deslocam o conteúdo no eixo X (efeito de “slide” horizontal).
  - A Home recebe `onNavigate` (que aponta para `handleTabChange`) e consegue mudar de aba ao interagir com componentes como `SearchBar` e `TodayBentoGrid`.

Além da tab bar, existe navegação interna por **rotas** (`react-router-dom`), usada em componentes como `TodayBentoGrid` (por exemplo, `navigate('/agenda')`), permitindo aprofundar a navegação a partir da Home (agenda, missas, pontos turísticos, etc.).

## Previsão do tempo na Home (mock ou API?)

Na versão atual, **não há um widget dedicado de “previsão do tempo” com dados de API meteorológica** na Home. O clima aparece de forma indireta por meio de **alertas de tipo `clima`**, e estes alertas estão baseados em **dados mockados**, não em uma integração real de API.

- **Fonte dos alertas na Home**
  - `HomeScreen` importa:
    - `import { alerts as mockAlerts } from '@/data/mockData';`
    - Há um comentário explícito: **`// Mock alerts (TODO: replace with real API)`**.
  - A constante `activeAlerts` é setada diretamente com `mockAlerts`.
  - Essa lista é passada para `AlertBanner`:
    - `AlertBanner alerts={activeAlerts} ... />`

- **Definição de alerta de clima**
  - No tipo `Alert` (`src/types/index.ts`), o campo `tipo` pode ser `'clima'`.
  - Em `AlertBanner`, o tipo `'clima'` usa:
    - Ícone `CloudRain`.
    - Gradiente `from-slate-600 to-slate-500`.
  - Em `mockData.ts`, há um alerta:
    - `titulo: 'Alerta de Chuva Forte'`
    - `tipo: 'clima'`
    - `descricao: 'Previsão de chuvas intensas para hoje à noite'`

- **Conclusão sobre a previsão/alertas de clima**
  - **Os alertas de clima exibidos na Home são 100% mockados**, vindos de `mockData.ts`, sem chamada a serviço externo.
  - Não há uso de API de previsão do tempo (por exemplo, OpenWeather, INMET, etc.) nem hook como `useWeather` ou similar.
  - O próprio arquivo `mockData.ts` se declara **deprecated** e documenta que os dados de `alerts` ainda serão migrados para uma abordagem “offline-first” com IndexedDB e API.

Portanto:
- **Hoje não existe um “card de previsão do tempo em tempo real” na Home.**
- **O que há são alertas de clima simulados**, exibidos no `AlertBanner` e/ou nos cards de “Hoje em Tijucas” (via `activeAlert` em `TodayBentoGrid`), baseados em mock.

## Avaliação da Home (UX/UI, mobile-first, native-like)

- **Pontos fortes**
  - **Mobile-first bem aplicado**:
    - Layout restrito a `max-w-[420px]`, ideal para viewport de smartphone.
    - Uso de `pt-safe-top` e `pb-safe-bottom` para lidar com notches e áreas seguras.
    - Scroll vertical suave, com `scrollbar-hide` para estética mobile.
  - **Experiência native-like**
    - Pull‑to‑refresh com:
      - `useSpring` + `useTransform` para altura, rotação e escala.
      - Efeito “borracha” (`RUBBER_BAND_FACTOR`) simulando física de apps nativos.
      - `hapticFeedback('medium' | 'success')` para reforçar a ação.
    - Transições animadas entre tabs com `framer-motion`.
    - `BottomTabBar` fixa com animações e indicador de tab ativa.
  - **Home como hub de contexto da cidade**
    - Seletor de bairro logo no hero, personalizando o conteúdo.
    - Seções que cobrem os principais “pilares” do app:
      - Eventos (TodayBentoGrid + EventsCarousel).
      - Turismo (TourismHighlights).
      - Denúncias (ReportCTA).
      - Fórum (ForumPreview).
      - Serviços úteis (QuickAccessGrid).
    - Forte uso de **offline-first**:
      - Eventos, turismo, fóruns e (em parte) denúncias utilizam IndexedDB e/ou estratégias híbridas para funcionar mesmo sem rede.
  - **Uso consistente de animações e feedback**
    - `framer-motion` é aplicado em praticamente todos os cards da Home (bentos, carrosséis, CTAs, chips), com:
      - Stagger de entrada.
      - Micro-animações em `whileTap`/`whileHover`.
    - Haptics (`hapticFeedback`) usados em interações-chave (pull‑to‑refresh, navegação, likes, carrosséis).

- **Pontos a melhorar (especialmente em clima/previsão e consistência de dados)**
  - Previsão de tempo/clima hoje é **apenas textual e mockada** em alertas.
  - Falta um **card visual de clima**, integrado com:
    - API real de tempo.
    - Alertas de `clima` (para situações severas).
  - **Fragmentação de fontes de dados** na Home:
    - Eventos:
      - `TodayBentoGrid` usa `useUpcomingOfflineEvents` (`eventService` + mocks).
      - `EventsCarousel` usa `useEvents` (`eventApiService` V2).
      - Existe ainda o endpoint `getHomeFeatured`, pensado justamente para consolidar dados da Home, mas que ainda não está sendo utilizado.
    - Turismo:
      - `TourismHighlights` usa `useOfflineTourism` (API + IndexedDB + mock).
      - `TodayBentoGrid` ainda usa `tourismSpots` de `mockData.ts`.
    - Alertas:
      - `AlertBanner` + `TodayBentoGrid` usam `alerts` de `mockData.ts`.
  - O **pull‑to‑refresh** da Home:
    - Hoje reseta apenas um estado booleano (`isRefreshing`) e mostra toast, mas **não** dispara refetch explícito dos hooks de dados (eventos, turismo, fórum, denúncias).
    - Perde a oportunidade de ser um “refresh unificado” de tudo que aparece na Home.
  - `SearchBar`:
    - Visualmente rica, mas ainda sem integração real com endpoints de busca (eventos, tópicos, turismo, telefones, etc.).

## Sugestões de melhorias para a Home

### 1. Widget de previsão do tempo real e interativo

- **Integrar com uma API de clima**
  - Criar um serviço dedicado, por exemplo `weather.service.ts`, encapsulando chamadas para um provedor (OpenWeather, WeatherAPI, etc.) ou dados oficiais locais.
  - Implementar um hook `useWeather` (offline-first):
    - Usa `react-query` para cache, revalidação e estados de carregamento.
    - Armazena a última previsão em IndexedDB, permitindo:
      - Uso rápido ao abrir a Home.
      - Funcionamento razoável em modo offline (mostrando “atualizado há X horas”).

- **Novo card na Home (ex: dentro de `TodayBentoGrid` ou logo abaixo do `HeroHeader`)**
  - Visualmente:
    - Fundo gradiente leve, coerente com o tema.
    - Ícone de condição de tempo em destaque.
    - Temperatura grande (tipografia forte).
  - Conteúdo:
    - “Agora em Tijucas, {condição}”.
    - Temperatura atual, mínima e máxima do dia.
    - Probabilidade de chuva.
    - Pequena indicação das próximas horas (ex.: “Próximas 3h: tendência de chuva fraca”).
  - Interação:
    - Toque no card abre uma tela/modal de detalhes de clima (com gráfico ou lista de horas/dias).
    - Animações sutis em hover/tap com `framer-motion` (escala, fade).

- **Alinhamento com o `AlertBanner`**
  - Quando existir **alerta de clima severo**:
    - Destacar esse estado no card de clima com uma “badge” de alerta.
    - Sincronizar cor e ícone com `AlertBanner` (consistência visual).

### 2. Unificar e otimizar os fluxos de dados da Home (endpoints e hooks)

- **Aproveitar `getHomeFeatured` (V2) para reduzir múltiplas chamadas**
  - Hoje, a Home:
    - Usa `useUpcomingOfflineEvents` para “Eventos hoje” no `TodayBentoGrid`.
    - Usa `useEvents` com filtros para o `EventsCarousel`.
  - Recomenda-se:
    - Consumir `useHomeFeatured()` (hook já pronto em `useEventsApi`) na Home:
      - `useHomeFeatured` chama `eventApiService.getHomeFeatured()` → `ENDPOINTS.events.homeFeatured`.
      - Esse endpoint já foi pensado para devolver **em um único payload**:
        - Destaque principal.
        - Eventos de hoje.
        - Eventos do fim de semana.
        - Próximos eventos.
    - A Home poderia:
      - Derivar `todayEventsCount` diretamente desse payload.
      - Alimentar `EventsCarousel` com os blocos retornados (sem nova chamada).
      - Usar o mesmo dado para enriquecer `TodayBentoGrid`.
  - Benefícios:
    - Menos chamadas HTTP.
    - Consistência de dados (o mesmo evento “de hoje” será mostrado na saudação, no bento e no carrossel).

- **Migrar `TodayBentoGrid` para o mesmo stack de dados de eventos**
  - Em vez de usar apenas `useUpcomingOfflineEvents`, integrar:
    - Caso `useHomeFeatured` esteja carregado, reutilizar os eventos de hoje/semana de lá.
    - Manter `useUpcomingOfflineEvents` como fallback offline.
  - Resultado:
    - Comportamento consistente entre Home, Agenda e qualquer outra tela que consome eventos.

- **Substituir mocks de turismo e alertas por hooks/offline-first reais**
  - Turismo:
    - Hoje:
      - `TourismHighlights` já usa `useOfflineTourism` (API+IndexedDB+mock).
      - `TodayBentoGrid` ainda usa `tourismSpots` de `mockData.ts`.
    - Sugestão:
      - Expor do hook `useOfflineTourism` um `getFeaturedSpot()` simples.
      - Injetar esse dado no card de turismo do `TodayBentoGrid`.
  - Alertas:
    - Criar um hook `useOfflineAlerts` seguindo o padrão de `useOfflineEvents`/`useOfflineTourism`:
      - IndexedDB + API + fallback opcional de mock em DEV.
    - Usar esse hook em:
      - `HomeScreen` (para `AlertBanner`).
      - `TodayBentoGrid` (card de alertas).
    - Com isso, o card de alertas pode:
      - Mostrar o tipo (`clima`, `obras`, etc.) com badge.
      - Filtrar por `selectedBairro` se o backend expuser esse filtro.

### 3. Micro‑integrações com endpoints existentes (melhorando interatividade)

- **Conectar `SearchBar` a buscas reais**
  - Para eventos:
    - Integrar o campo de busca com `useSearchEvents(query)`:
      - Mostrar sugestões rápidas num dropdown (ex.: próximos eventos que batem com o texto).
      - Encaminhar para a tela de Agenda com o filtro já aplicado.
  - Para tópicos do fórum:
    - Expor um endpoint de busca de tópicos (se já não existir) e usar um hook correspondente.
    - Permitir que o chip “Mais curtidos” use filtros reais (e não só sort local) quando o backend oferecer esse ranking.
  - Experiência:
    - Manter a simplicidade atual (chips redirecionando para tabs), mas adicionar **sugestões imediatas** quando o usuário digitar.

- **Sincronizar `HeroHeader` com dados reais**
  - `todayEventsCount`:
    - Em vez de vir hard-coded, ligar ao resultado de `useTodayEvents()` ou do payload de `useHomeFeatured`.
  - `hasActiveAlert`:
    - Derivar de `useOfflineAlerts` (ex.: `alerts.some(a => a.tipo === 'clima' || a.severity === 'danger')`).
  - `streakDays`:
    - Integrar com um endpoint de engajamento (ex.: `GET /users/me/streak`), quando existente.

- **Pull‑to‑refresh disparando refetch explícito**
  - No `handleRefresh`, além do `setTimeout`:
    - Injetar dependências de `queryClient` (`react-query`) e chamar:
      - `invalidateQueries` para chaves relevantes:
        - Eventos (`eventQueryKeys.all` ou ao menos `homeFeatured`, `list`, `upcoming`).
        - Turismo (`QUERY_KEYS.tourism.spots`).
        - Fórum (`topics` offline-first).
        - Denúncias (`QUERY_KEYS.reports.stats`).
    - Isso alinhará a experiência visual do pull-to-refresh com a atualização real dos dados.

- **HeroHeader**
  - Animar levemente o seletor de bairro ao trocar (feedback visual de mudança de contexto).
  - Ao abrir o `Sheet` de bairros, usar um `drag handle` visual (linha no topo) para reforçar o padrão “bottom sheet” típico de apps nativos.

- **Pull‑to‑refresh específico para clima**
  - Além do refresh global, permitir que o **card de clima** tenha um pequeno botão/gesto próprio para atualizar somente esse dado (com micro‑haptic e spinner local).

### 4. Acessibilidade e feedback de estado

- **Carregamento do clima**
  - Mostrar estado de “carregando previsão” com skeleton suave ou shimmer dentro do card.
  - Em caso de erro de API:
    - Exibir mensagem amigável (“Não conseguimos carregar o clima agora”) com opção de tentar novamente.

- **Offline**
  - Indicar claramente quando a previsão está sendo mostrada de cache (“Última atualização há 3h”).

- **5. Organização de código e evolução da stack**

- **Hooks offline-first para clima/alertas**
  - Seguir o padrão já iniciado para eventos (`useUpcomingOfflineEvents`) e turismo (`useOfflineTourism`):
    - Criar `useOfflineAlerts` e `useOfflineWeather`.
    - Migrar dados de `alerts` do `mockData.ts` para IndexedDB + API real.
  - Isso permitirá que a Home opere de forma coerente:
    - Eventos, turismo, fórum, denúncias **e clima/alertas** usando sempre a mesma filosofia offline-first.

- **Clareza na distinção entre mock e produção**
  - Manter comentários claros (como já existe em `HomeScreen` e `mockData.ts`) e idealmente:
    - Ter um “Feature Flag” ou `env` para controlar uso de mock vs. API.
    - Documentar no README do app web as dependências externas (incluindo o serviço de clima quando for integrado).
  - Especificamente para a Home:
    - Documentar que `getHomeFeatured` é o endpoint recomendado para montar o “contexto do dia” (eventos), e não apenas `list`/`upcoming`.

---

**Resumo**:  
A Home está bem desenhada para **mobile**, com forte foco em experiência **native-like** (animações, pull‑to‑refresh, haptics, tab bar fixa e preservação de scroll) e já faz uso intenso de uma stack **offline-first** (IndexedDB + React Query + serviços de API para eventos, turismo, fórum e denúncias). A parte de **previsão/alertas de clima**, entretanto, continua baseada em **mock (`mockData.ts`)**, e a Home ainda não aproveita totalmente endpoints otimizados como `getHomeFeatured` para consolidar os dados em uma única chamada. Os próximos passos naturais são: **(1)** criar um widget de clima em tempo real com hook offline-first, **(2)** unificar os fluxos de eventos em torno de `useHomeFeatured`/`eventApiService`, **(3)** migrar alertas e pontos mockados para hooks reais, e **(4)** ligar o pull‑to‑refresh e a barra de busca diretamente a refetches e endpoints existentes, tornando a Home ainda mais interativa e consistente com o backend.


