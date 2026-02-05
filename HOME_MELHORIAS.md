# HOME - "Hoje em Tijucas" | Análise Completa e Plano de Melhorias

**Objetivo**: Transformar a Home em um painel diário VIVO, mobile-first e resiliente.  
**Última atualização**: 2026-02-05

## Resumo executivo (estado real do código)
- O backend do agregador já existe, é resiliente (safe-load por bloco) e expõe `GET /api/v1/home`, `GET /api/v1/today/brief` e `GET /api/v1/stats/users`.  
- A Home no front já consome o agregador, tem pull-to-refresh e renderiza os blocos principais com skeleton e fallback nos componentes críticos.  
- Faltam integrações chave (Events/Tourism via agregador), uso do streak no UI, correções de contrato (payloads/tipos/response shape) e ajustes de encoding/strings.
- Para ficar viral e “ritual diário”, ainda faltam loops de retorno (micro-ação + streak), conteúdo “perto de mim”, compartilhamento nativo e interações premium sem pesar performance.

## O que já foi feito (verificado no código)
**Backend**
- Agregador de Home com cache e tolerância a falhas por bloco (safe-load + `meta.errors`).  
`apps/api/app/Domains/Home/Services/HomeAggregatorService.php`
- Endpoints públicos para Home, Boletim e Stats.  
`apps/api/routes/api.php`  
`apps/api/app/Domains/Home/Http/Controllers/HomeController.php`
- Boletim do Dia com queries resilientes (alertas/eventos/denúncias/fórum).  
`apps/api/app/Domains/Home/Services/HomeAggregatorService.php`
- Metas dinâmicas do contador (goal + stageStart + progress + message).  
`apps/api/app/Domains/Home/Services/HomeAggregatorService.php`
- Sistema de streak implementado (migration, model, endpoints, relação no User).  
`apps/api/database/migrations/2026_02_04_235000_create_user_streaks_table.php`  
`apps/api/app/Models/UserStreak.php`  
`apps/api/app/Http/Controllers/Api/CheckInController.php`  
`apps/api/app/Models/User.php`

**Frontend**
- Hook `useHomeData` (React Query) com stale-while-revalidate e integração com agregador.  
`apps/web/src/hooks/useHomeData.ts`
- HomeScreen consumindo agregador e removendo render condicional de blocos críticos.  
`apps/web/src/screens/HomeScreen.tsx`
- Boletim do Dia com skeleton + fallback.  
`apps/web/src/components/home/BoletimDoDia.tsx`
- TijucanosCounter com skeleton, progresso por degrau, confetti e share.  
`apps/web/src/components/home/TijucanosCounter.tsx`
- EventsCarousel já aceita `data` externa (pronto para o agregador).  
`apps/web/src/components/home/EventsCarousel.tsx`
- QuickAccess VIVO com badges dinâmicos e fallback.  
`apps/web/src/components/home/QuickAccessGridVivo.tsx`

## Mapa dos blocos da Home (backend x frontend)
| Bloco | Backend (type) | Uso atual na Home | Status |
| --- | --- | --- | --- |
| Alertas | `alert_banner` | `AlertTotem` via `blocks.alerts` | Conectado |
| Clima | `weather_mini` | `HeaderSlim` via `blocks.weather` | Conectado |
| Boletim | `boletim_dia` | `BoletimDoDia` | Conectado |
| Fiscaliza | `fiscaliza_vivo` | `FiscalizaVivo` | Conectado (sem loading real) |
| Fórum | `forum_vivo` | `BocaNoTromboneVivo` | Conectado (sem loading real) |
| Quick Access | `quick_access` | `QuickAccessGridVivo` | Conectado |
| Events | `events_carousel` | `EventsCarousel` | Não conectado |
| Tourism | `tourism_carousel` | `TourismHighlights` | Não conectado |
| Stats | `tijucanos_counter` | `TijucanosCounter` | Conectado |

## Pendências críticas (corrigir antes de evoluir)
- **Contrato de resposta do agregador**: `home.service.ts` assume `{ data: ... }`, mas `/api/v1/home` retorna payload direto, e `/today/brief` e `/stats/users` retornam `{ success, data }`. Isso quebra o parsing.  
`apps/web/src/services/home.service.ts`  
`apps/api/app/Domains/Home/Http/Controllers/HomeController.php`
Formato recomendado (único para todo `/api/v1/*`):
```json
{
  "success": true,
  "data": { "...": "..." },
  "meta": { "cached": true, "stale": false, "errors": [], "ts": "..." }
}
```
- **Tipos desatualizados**: `HomeMeta` não inclui `meta.errors` nem `meta.user.streak`.  
`apps/web/src/types/home.types.ts`
- **Payloads incompatíveis**: `events_carousel` e `tourism_carousel` do backend não batem com `home.types.ts` nem com os componentes atuais.  
`apps/api/app/Domains/Home/Services/HomeAggregatorService.php`  
`apps/web/src/types/home.types.ts`  
`apps/web/src/components/home/EventsCarousel.tsx`  
`apps/web/src/components/home/TourismHighlights.tsx`
- **Status de denúncias inválidos** no Fiscaliza: backend usa `resolved/pending/in_progress`, mas a tabela usa `recebido/em_analise/resolvido`.  
`apps/api/app/Domains/Home/Services/HomeAggregatorService.php`  
`apps/api/database/migrations/2026_02_03_160002_create_citizen_reports_table.php`
- **Contagem de verificados** usa `email_verified_at`, coluna inexistente. Deve usar `phone_verified` (ou adicionar coluna).  
`apps/api/app/Domains/Home/Services/HomeAggregatorService.php`  
`apps/api/database/migrations/0001_01_01_000000_create_users_table.php`
- **Encoding quebrado** em textos (ex: “FÃ³rum”, “DenÃºncias”) em backend e frontend.  
`apps/api/app/Domains/Home/Services/HomeAggregatorService.php`  
`apps/web/src/components/home/*`

## P0: Home “inquebrável” e ultra-rápida
- Unificar o shape de resposta (acima) em `/api/v1/home`, `/api/v1/today/brief`, `/api/v1/stats/users`.
- Atualizar `home.service.ts` para parar de “adivinhar” o formato.
- Corrigir encoding em toda a cadeia:
DB em `utf8mb4`, header `Content-Type: application/json; charset=utf-8`, evitar strings “double-encoded” no backend e salvar arquivos em UTF-8 no front.
- “Loading real” nos blocos vivos:
Skeleton leve em Fiscaliza/Fórum e fallback quando `meta.errors` indicar falha (CTA “Tentar de novo” / “Abrir mesmo assim”).

## Pendências funcionais
**Integração do agregador (Events + Tourism)**
- Passar `blocks.events?.payload` para `EventsCarousel`.  
`apps/web/src/screens/HomeScreen.tsx`
- Adicionar suporte a `data` em `TourismHighlights` (ou criar adaptador).  
`apps/web/src/components/home/TourismHighlights.tsx`
- Criar mapeadores para converter payload do backend em `EventListItem` e `TourismSpotEnhanced` (ou alinhar o backend).  
`apps/web/src/types/home.types.ts`

**Streak / Check-in na Home**
- Consumir `meta.user.streak` do agregador e/ou usar `useCheckIn()` na Home.  
`apps/web/src/hooks/useCheckIn.ts`  
`apps/web/src/screens/HomeScreen.tsx`
- Exibir streak no `BoletimDoDia` e/ou `HeaderSlim`.  
`apps/web/src/components/home/BoletimDoDia.tsx`  
`apps/web/src/components/home/HeaderSlim.tsx`
- Confetti em marcos (7/14/30/60/90) no UI.  
`apps/web/src/hooks/useCheckIn.ts`

**Resiliência visual (loading/fallback)**
- Implementar skeleton/placeholder real em `FiscalizaVivo` e `BocaNoTromboneVivo`.  
`apps/web/src/components/home/FiscalizaVivo.tsx`  
`apps/web/src/components/home/BocaNoTromboneVivo.tsx`
- Usar `meta.errors` para fallback específico por bloco.  
`apps/web/src/hooks/useHomeData.ts`  
`apps/web/src/types/home.types.ts`

## Melhorias necessárias para ficar incrível (além do backlog atual)
**Loops de retorno diário**
- “Boletim do Dia” como ritual com micro-ação (ex: marcar como visto).  
`apps/web/src/components/home/BoletimDoDia.tsx`
- Enquetes relâmpago diárias com resultado em tempo real.
- Alertas úteis por bairro (interdição, chuva, coleta, eventos do dia).
- Check-in automático quando o usuário completa uma micro-ação útil (não apenas abrir o app).
- UI simples do streak:
“🔥 Você está em X dias seguidos”, barra pequena “Próxima recompensa: 7 dias”.
- Confetti só em marcos (3/7/14/30/60/90), rápido e discreto.

**Sensação de cidade viva**
- Fiscaliza e Fórum com textos dinâmicos reais (“2 novas denúncias no seu bairro hoje”).
- Badges vivos no QuickAccess (Eventos hoje, Fiscaliza perto, Coleta do dia).
- Mini preview de mapa no Fiscaliza (3 pinos recentes).

**Perto de você (bairro + contexto)**
- Bloco “Perto de você” (bento com 3 cards pequenos): Fiscaliza no bairro, Evento perto, Alerta/serviço local.
- QuickAccess com badges explicativos e que mudam diariamente:
“Eventos (3 hoje)”, “Fiscaliza (2 perto)”, “Tempo (vento forte)”, “Fórum (15 novos comentários)”.

**Viralização (conteúdo compartilhável)**
- Cartão “Hoje em Tijucas” (clima + 1 evento + 1 alerta + 1 fiscaliza).
- Cartão “Meta Tijucanos” (progresso + CTA “Convide 1 amigo”).
- Cartão “Boletim do Dia” (resumo curto).
- Botão “Compartilhar” usando Web Share API + deep link para o app/PWA.

**Engajamento leve e saudável**
- Streak baseado em micro-ação útil (ver boletim, apoiar denúncia, votar em enquete).
- Conquistas simples (“Cidadão Atento”, “Mão na Massa”).
- Confetti + feedback haptic em marcos.

**Mobile-first “tocável”**
- Scale-on-press em todos os cards.
- Haptics consistentes em CTAs importantes.
- Pull-to-refresh com feedback curto (já existe, ajustar sensação).
- Gestos nativos que leigos entendem:
Swipe entre “Hoje / Perto de mim / Destaques”.
- Carregamento progressivo:
render acima da dobra primeiro (Header + Boletim + Fiscaliza/Fórum), depois Events/Tourism.
Suporte a `?include=` no agregador para payload “lite”.

**Acessibilidade (Modo Simples)**
- Toggle no Settings para fonte maior (+20%) e layout mais limpo.
- Remover animações via `prefers-reduced-motion`.
- Garantir touch targets de 44px.

## 3 features pequenas que aumentam MUITO retorno diário
**A) Enquete relâmpago diária (1 toque)**  
Ex: “Como está o trânsito hoje?” (Bom / Médio / Ruim). Resultado em tempo real + “ponto cidadão”.

**B) Missão do dia (ultra simples)**  
“Veja 1 alerta”, “Apoie 1 denúncia”, “Vote na enquete”. Motivo claro para abrir.

**C) Mini mapa no Fiscaliza (preview)**  
3 pins recentes (visual) + CTA “Ver no mapa”.

## Métricas e guardrails (para não virar só “bonito”)
Eventos a instrumentar:
- `home_loaded` (com tempo)
- `boletim_viewed`
- `checkin_completed`
- `share_clicked`
- `cta_fiscaliza_clicked` / `cta_forum_clicked`

KPIs principais:
- D1/D7 retention
- Tempo na Home
- CTR dos cards
- Share rate

## Regra de ouro (5 segundos)
Todo dia a Home precisa responder:
1. O que tem de importante hoje?
2. O que tem perto de mim?
3. O que eu posso fazer agora com 1 toque?

## Plano sugerido (prioridades)
**P0 (bloqueadores técnicos)**
1. Unificar o shape de resposta em `/api/v1/home`, `/today/brief`, `/stats/users`.
2. Corrigir `home.service.ts` para parsear responses corretamente.
3. Ajustar tipos `home.types.ts` (meta.user, meta.errors, payloads).
4. Corrigir status de denúncias e verificados no backend.
5. Corrigir encoding em strings PT-BR.
6. Loading real em Fiscaliza/Fórum + fallback com `meta.errors`.

**P1 (entrega do “painel vivo”)**
1. Conectar Events e Tourism ao agregador (mapeamento ou mudança no backend).
2. Integrar streak na Home (Boletim + Header + confetti).
3. Micro-ação diária como gatilho de check-in (boletim/enquete/alerta).
4. Bloco “Perto de você” e badges vivos no QuickAccess.
5. Compartilhamento nativo (cards do dia + meta).

**P2 (UX e engajamento)**
1. Mini mapa no Fiscaliza + badges vivos no QuickAccess.
2. Enquetes relâmpago diárias.
3. Copy dinâmica por faixa de meta no TijucanosCounter.
4. Gestos nativos (swipe entre seções) e progressivo “above the fold”.

**P3 (polish & deploy)**
1. Scale-on-press global e spring animations consistentes.
2. Lighthouse 90+.
3. Deploy do backend com migrations em produção.

## Checklist final de validação
- Home responde em 1 request com dados parciais quando algum bloco falhar.
- Estado offline mostra cache + fallback coerente.
- Streak aparece para usuário logado e não duplica check-in no mesmo dia.
- Check-in acontece ao completar micro-ação (boletim/enquete/alerta), não só abrir o app.
- Events/Tourism não fazem double-fetch quando agregador ativo.
- Bloco “Perto de você” responde ao bairro e muda diariamente.
- Compartilhamento nativo gera cards e abre Web Share API.
- Sem strings quebradas (UTF-8 consistente).
- Mobile: 44px touch targets e animações reduzidas quando solicitado.

## Arquivos-chave para referência
`apps/api/app/Domains/Home/Services/HomeAggregatorService.php`  
`apps/api/app/Domains/Home/Http/Controllers/HomeController.php`  
`apps/api/database/migrations/2026_02_04_235000_create_user_streaks_table.php`  
`apps/api/app/Models/UserStreak.php`  
`apps/api/app/Http/Controllers/Api/CheckInController.php`  
`apps/web/src/hooks/useHomeData.ts`  
`apps/web/src/services/home.service.ts`  
`apps/web/src/types/home.types.ts`  
`apps/web/src/screens/HomeScreen.tsx`  
`apps/web/src/components/home/BoletimDoDia.tsx`  
`apps/web/src/components/home/FiscalizaVivo.tsx`  
`apps/web/src/components/home/BocaNoTromboneVivo.tsx`  
`apps/web/src/components/home/TijucanosCounter.tsx`  
`apps/web/src/components/home/EventsCarousel.tsx`  
`apps/web/src/components/home/TourismHighlights.tsx`
