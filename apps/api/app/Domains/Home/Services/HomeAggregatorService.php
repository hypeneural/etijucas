<?php

declare(strict_types=1);

namespace App\Domains\Home\Services;

use App\Domains\Weather\Services\OpenMeteoService;
use App\Domains\Weather\Services\WeatherInsightsService;
use App\Models\Alert;
use App\Models\Event;
use App\Models\Topic;
use App\Models\Comment;
use App\Models\TopicLike;
use App\Domains\Reports\Models\CitizenReport;
use App\Domains\Tourism\Models\TourismSpot;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Carbon;

/**
 * HomeAggregatorService - Aggregates all Home data in a single response
 * 
 * This service is the backbone of the "Hoje em Tijucas" experience,
 * providing all the data needed for the home screen in a single request.
 */
class HomeAggregatorService
{
    // Cache TTLs
    private const CACHE_TTL_HOME = 300; // 5 minutes
    private const CACHE_TTL_BOLETIM = 300; // 5 minutes
    private const CACHE_TTL_STATS = 600; // 10 minutes

    public function __construct(
        private OpenMeteoService $weatherService,
        private WeatherInsightsService $insightsService
    ) {
    }

    /**
     * Get aggregated home data
     * 
     * @param string|null $bairroId Filter by bairro
     * @param array $include Blocks to include
     * @param int $version API version for backwards compatibility
     * @return array
     */
    public function getHomeData(?string $bairroId = null, array $include = [], int $version = 1): array
    {
        $cacheKey = "home:aggregate:{$bairroId}:" . implode(',', $include) . ":v{$version}";

        return Cache::remember($cacheKey, self::CACHE_TTL_HOME, function () use ($bairroId, $include, $version) {
            $blocks = [];
            $errors = [];
            $priority = 1;

            // Default includes all if empty
            if (empty($include)) {
                $include = ['alerts', 'weather', 'boletim', 'fiscaliza', 'forum', 'quick_access', 'events', 'tourism', 'stats'];
            }

            // Helper to safely load blocks - prevents one failure from breaking entire endpoint
            $safeLoad = function (string $name, callable $loader) use (&$blocks, &$errors) {
                try {
                    $block = $loader();
                    if ($block !== null) {
                        $blocks[] = $block;
                    }
                } catch (\Exception $e) {
                    $errors[] = $name;
                    \Log::warning("Home block '{$name}' failed: " . $e->getMessage());
                }
            };

            // 1. Alert Banner
            if (in_array('alerts', $include)) {
                $safeLoad('alerts', fn() => $this->getAlertBannerBlock($priority++));
            }

            // 2. Weather Mini
            if (in_array('weather', $include)) {
                $safeLoad('weather', fn() => $this->getWeatherBlock($priority++));
            }

            // 3. Boletim do Dia
            if (in_array('boletim', $include)) {
                $safeLoad('boletim', fn() => $this->getBoletimBlock($priority++, $bairroId));
            }

            // 4. Fiscaliza Vivo
            if (in_array('fiscaliza', $include)) {
                $safeLoad('fiscaliza', fn() => $this->getFiscalizaBlock($priority++, $bairroId));
            }

            // 5. Fórum Vivo
            if (in_array('forum', $include)) {
                $safeLoad('forum', fn() => $this->getForumBlock($priority++, $bairroId));
            }

            // 6. Quick Access
            if (in_array('quick_access', $include)) {
                $safeLoad('quick_access', fn() => $this->getQuickAccessBlock($priority++, $bairroId));
            }

            // 7. Events
            if (in_array('events', $include)) {
                $safeLoad('events', fn() => $this->getEventsBlock($priority++, $bairroId));
            }

            // 8. Tourism
            if (in_array('tourism', $include)) {
                $safeLoad('tourism', fn() => $this->getTourismBlock($priority++));
            }

            // 9. Stats (Tijucanos counter)
            if (in_array('stats', $include)) {
                $safeLoad('stats', fn() => $this->getStatsBlock($priority++));
            }

            return [
                'meta' => [
                    'user_state' => auth()->check() ? 'logged_in' : 'guest',
                    'bairro' => $bairroId ? ['id' => $bairroId] : null,
                    'cache' => [
                        'ttl' => self::CACHE_TTL_HOME,
                        'stale_ok' => true,
                    ],
                    'generated_at' => now()->toIso8601String(),
                    'version' => $version,
                    'errors' => $errors, // Report which blocks failed (useful for debugging)
                ],
                'blocks' => array_filter($blocks),
            ];
        });
    }

    /**
     * Get "Boletim do Dia" - the daily brief
     */
    public function getBoletimDoDia(?string $bairroId = null): array
    {
        $cacheKey = "boletim:today:{$bairroId}";

        return Cache::remember($cacheKey, self::CACHE_TTL_BOLETIM, function () use ($bairroId) {
            $today = Carbon::today();

            // Weather phrase
            $weather = $this->getWeatherBrief();

            // Alerts count (resilient - may fail if table doesn't exist)
            $alertasCount = 0;
            $alertaDestaque = null;
            try {
                $alertas = Alert::where('active', true)
                    ->where(function ($q) {
                        $q->whereNull('expires_at')
                            ->orWhere('expires_at', '>', now());
                    })
                    ->get();
                $alertasCount = $alertas->count();
                $alertaDestaque = $alertas->first()?->titulo;
            } catch (\Exception $e) {
                \Log::warning("Boletim: Alert query failed: " . $e->getMessage());
            }

            // Events today (resilient)
            $eventosHoje = 0;
            try {
                $eventosHoje = Event::whereDate('start_date', $today)
                    ->where('status', 'published')
                    ->count();
            } catch (\Exception $e) {
                \Log::warning("Boletim: Event query failed: " . $e->getMessage());
            }

            // Top report from bairro (resilient)
            $topReport = null;
            try {
                $topReport = CitizenReport::when($bairroId, fn($q) => $q->where('bairro_id', $bairroId))
                    ->where('created_at', '>=', $today->copy()->subDays(7))
                    ->orderByDesc('created_at')
                    ->first();
            } catch (\Exception $e) {
                \Log::warning("Boletim: CitizenReport query failed: " . $e->getMessage());
            }

            // Top forum topic (resilient)
            $topTopic = null;
            try {
                $topTopic = Topic::where('created_at', '>=', $today->copy()->subDays(7))
                    ->withCount('comments')
                    ->orderByDesc('comments_count')
                    ->first();
            } catch (\Exception $e) {
                \Log::warning("Boletim: Topic query failed: " . $e->getMessage());
            }

            return [
                'date' => $today->toDateString(),
                'clima' => $weather,
                'alertas_count' => $alertasCount,
                'alerta_destaque' => $alertaDestaque,
                'eventos_count' => $eventosHoje,
                'fiscaliza_destaque' => $topReport ? [
                    'titulo' => $topReport->titulo,
                    'apoios' => $topReport->supports_count ?? 0,
                ] : null,
                'forum_destaque' => $topTopic ? [
                    'titulo' => $topTopic->titulo,
                    'comentarios' => $topTopic->comments_count ?? 0,
                ] : null,
            ];
        });
    }

    /**
     * Get user stats for gamification with dynamic goals
     * 
     * Milestones: 10, 50, 100, 500, 1000, 5000, 10000, then +10k each
     */
    public function getUserStats(): array
    {
        return Cache::remember('home:user_stats', self::CACHE_TTL_STATS, function () {
            $total = User::count();
            $verified = User::whereNotNull('email_verified_at')->count();
            $newToday = User::whereDate('created_at', Carbon::today())->count();

            // Calculate dynamic goal
            $goal = $this->calcGoal($total);

            return [
                'total' => $total,
                'verified' => $verified,
                'new_today' => $newToday,
                'goal' => $goal,
            ];
        });
    }

    /**
     * Calculate dynamic goal based on current total
     * 
     * @param int $total Current user count
     * @return array Goal data with stageStart, target, remaining, progress
     */
    private function calcGoal(int $total): array
    {
        $n = max(0, $total);
        $fixed = [10, 50, 100, 500, 1000, 5000, 10000];

        foreach ($fixed as $i => $goal) {
            if ($n < $goal) {
                $stageStart = $i === 0 ? 0 : $fixed[$i - 1];
                return $this->buildGoal($n, $stageStart, $goal);
            }
        }

        // 10k+: metas de 10k em 10k
        $goal = (int) ((intdiv($n, 10000) + 1) * 10000);
        $stageStart = $goal - 10000;
        return $this->buildGoal($n, $stageStart, $goal);
    }

    private function buildGoal(int $n, int $stageStart, int $goal): array
    {
        $denom = max(1, $goal - $stageStart);
        $progress = ($n - $stageStart) / $denom;
        $progress = max(0, min(1, $progress));

        // Motivational message based on tier
        $message = match (true) {
            $n < 10 => 'Seja um dos primeiros! Ajude a cidade a crescer.',
            $n < 50 => 'Estamos ganhando tração — convide 1 amigo!',
            $n < 100 => 'Quase 100 tijucanos — bora bater essa meta!',
            $n < 500 => 'Crescendo rápido! Compartilhe com vizinhos.',
            $n < 1000 => 'Quase mil! A cidade está acordando.',
            $n < 5000 => 'A cidade está usando! Compartilhe com seu bairro.',
            $n < 10000 => 'Rumo aos 10 mil tijucanos conectados!',
            default => 'Tijucas conectada! Continue convidando.',
        };

        return [
            'stage_start' => $stageStart,
            'target' => $goal,
            'remaining' => max(0, $goal - $n),
            'progress' => $progress,
            'progress_pct' => round($progress * 100, 1),
            'message' => $message,
        ];
    }

    // ================================================================
    // Private block builders
    // ================================================================

    private function getAlertBannerBlock(int $priority): ?array
    {
        $alerts = Alert::where('active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->orderByDesc('priority')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'tipo', 'titulo', 'descricao', 'nivel', 'created_at'])
            ->toArray();

        if (empty($alerts)) {
            return null;
        }

        return [
            'type' => 'alert_banner',
            'priority' => $priority,
            'visible' => true,
            'payload' => [
                'alerts' => $alerts,
            ],
        ];
    }

    private function getWeatherBlock(int $priority): array
    {
        $weather = $this->getWeatherBrief();

        return [
            'type' => 'weather_mini',
            'priority' => $priority,
            'visible' => true,
            'payload' => $weather,
        ];
    }

    private function getWeatherBrief(): array
    {
        try {
            $weather = $this->weatherService->getWeather();
            $marine = $this->weatherService->getMarine();
            $insights = $this->insightsService->generateInsights($weather ?? [], $marine ?? []);

            $current = $weather['current'] ?? [];

            return [
                'temp' => (int) ($current['temperature_2m'] ?? 25),
                'icon' => $current['weather_code'] ?? 0,
                'frase' => $insights['beach']['headline'] ?? 'Tempo bom em Tijucas',
                'uv' => $insights['uv']['severity'] ?? 'moderate',
            ];
        } catch (\Exception $e) {
            return [
                'temp' => 25,
                'icon' => 0,
                'frase' => 'Tempo bom em Tijucas',
                'uv' => 'moderate',
            ];
        }
    }

    private function getBoletimBlock(int $priority, ?string $bairroId): array
    {
        $boletim = $this->getBoletimDoDia($bairroId);

        return [
            'type' => 'boletim_dia',
            'priority' => $priority,
            'visible' => true,
            'payload' => $boletim,
        ];
    }

    private function getFiscalizaBlock(int $priority, ?string $bairroId): array
    {
        $today = Carbon::today();
        $weekAgo = $today->copy()->subDays(7);

        $total = CitizenReport::count();
        $resolvidos = CitizenReport::where('status', 'resolved')->count();
        $hoje = CitizenReport::whereDate('created_at', $today)->count();

        $novasBairro = CitizenReport::when($bairroId, fn($q) => $q->where('bairro_id', $bairroId))
            ->whereDate('created_at', $today)
            ->count();

        $resolvidasSemana = CitizenReport::when($bairroId, fn($q) => $q->where('bairro_id', $bairroId))
            ->where('status', 'resolved')
            ->where('updated_at', '>=', $weekAgo)
            ->count();

        $pendentesBairro = CitizenReport::when($bairroId, fn($q) => $q->where('bairro_id', $bairroId))
            ->whereIn('status', ['pending', 'in_progress'])
            ->count();

        // Dynamic phrases
        $frases = [];
        if ($novasBairro > 0) {
            $frases[] = "{$novasBairro} nova(s) denúncia(s) hoje";
        }
        if ($resolvidasSemana > 0) {
            $frases[] = "✅ {$resolvidasSemana} resolvida(s) esta semana";
        }

        return [
            'type' => 'fiscaliza_vivo',
            'priority' => $priority,
            'visible' => true,
            'payload' => [
                'total' => $total,
                'resolvidos' => $resolvidos,
                'hoje' => $hoje,
                'novas_bairro' => $novasBairro,
                'resolvidas_semana' => $resolvidasSemana,
                'pendentes_bairro' => $pendentesBairro,
                'frases' => $frases,
            ],
        ];
    }

    private function getForumBlock(int $priority, ?string $bairroId): array
    {
        $today = Carbon::today();
        $weekAgo = $today->copy()->subDays(7);

        $comentariosHoje = \App\Models\Comment::whereDate('created_at', $today)->count();

        $curtidasSemana = \App\Models\TopicLike::where('created_at', '>=', $weekAgo)->count();

        $topTopico = Topic::withCount(['comments', 'likes'])
            ->where('created_at', '>=', $weekAgo)
            ->orderByDesc('comments_count')
            ->first();

        return [
            'type' => 'forum_vivo',
            'priority' => $priority,
            'visible' => true,
            'payload' => [
                'comentarios_hoje' => $comentariosHoje,
                'curtidas_semana' => $curtidasSemana,
                'top_topico' => $topTopico ? [
                    'id' => $topTopico->id,
                    'titulo' => $topTopico->titulo,
                    'comments_count' => $topTopico->comments_count ?? 0,
                    'likes_count' => $topTopico->likes_count ?? 0,
                ] : null,
            ],
        ];
    }

    private function getQuickAccessBlock(int $priority, ?string $bairroId): array
    {
        $today = Carbon::today();

        // Dynamic badges
        $eventosHoje = Event::whereDate('start_date', $today)
            ->where('status', 'published')
            ->count();

        $reportsPerto = CitizenReport::when($bairroId, fn($q) => $q->where('bairro_id', $bairroId))
            ->whereIn('status', ['pending', 'in_progress'])
            ->count();

        // Get today's garbage collection type (mock - should come from real API)
        $coletaHoje = $this->getColetaHoje();

        $items = [
            [
                'id' => 'eventos',
                'label' => 'Eventos',
                'icon' => 'calendar',
                'route' => '/agenda',
                'badge' => $eventosHoje > 0 ? "{$eventosHoje} hoje" : null,
                'badge_color' => 'blue',
                'highlight' => $eventosHoje > 0,
            ],
            [
                'id' => 'missas',
                'label' => 'Missas',
                'icon' => 'church',
                'route' => '/missas',
                'badge' => null,
            ],
            [
                'id' => 'coleta',
                'label' => 'Coleta',
                'icon' => 'trash',
                'route' => '/coleta-lixo',
                'badge' => $coletaHoje,
                'badge_color' => 'green',
            ],
            [
                'id' => 'telefones',
                'label' => 'Telefones',
                'icon' => 'phone',
                'route' => '/telefones',
                'badge' => null,
            ],
            [
                'id' => 'turismo',
                'label' => 'Turismo',
                'icon' => 'map-pin',
                'route' => '/pontos-turisticos',
                'badge' => null,
            ],
            [
                'id' => 'fiscaliza',
                'label' => 'Fiscaliza',
                'icon' => 'alert-triangle',
                'route' => '/denuncias',
                'badge' => $reportsPerto > 0 ? "{$reportsPerto} perto" : null,
                'badge_color' => 'orange',
                'highlight' => $reportsPerto > 0,
            ],
            [
                'id' => 'tempo',
                'label' => 'Tempo',
                'icon' => 'cloud-sun',
                'route' => '/tempo',
                'badge' => null,
            ],
            [
                'id' => 'forum',
                'label' => 'Fórum',
                'icon' => 'message-circle',
                'route' => '/forum',
                'badge' => null,
            ],
        ];

        return [
            'type' => 'quick_access',
            'priority' => $priority,
            'visible' => true,
            'payload' => [
                'items' => $items,
            ],
        ];
    }

    private function getEventsBlock(int $priority, ?string $bairroId): array
    {
        $events = Event::where('status', 'published')
            ->where('start_date', '>=', now())
            ->when($bairroId, fn($q) => $q->where('bairro_id', $bairroId))
            ->orderBy('start_date')
            ->limit(10)
            ->get(['id', 'titulo', 'start_date', 'end_date', 'local', 'cover_image'])
            ->toArray();

        return [
            'type' => 'events_carousel',
            'priority' => $priority,
            'visible' => count($events) > 0,
            'payload' => [
                'events' => $events,
            ],
        ];
    }

    private function getTourismBlock(int $priority): array
    {
        $spots = TourismSpot::where('is_active', true)
            ->where('is_featured', true)
            ->orderByDesc('rating')
            ->limit(6)
            ->get(['id', 'nome', 'descricao_curta', 'categoria', 'imagem_capa', 'rating'])
            ->toArray();

        return [
            'type' => 'tourism_carousel',
            'priority' => $priority,
            'visible' => count($spots) > 0,
            'payload' => [
                'title' => '📍 Descubra Tijucas',
                'spots' => $spots,
            ],
        ];
    }

    private function getStatsBlock(int $priority): array
    {
        $stats = $this->getUserStats();

        return [
            'type' => 'tijucanos_counter',
            'priority' => $priority,
            'visible' => true,
            'payload' => $stats,
        ];
    }

    /**
     * Get garbage collection type for today
     * TODO: Replace with real API when available
     */
    private function getColetaHoje(): ?string
    {
        $dayOfWeek = now()->dayOfWeek;

        // Simple mock logic
        return match ($dayOfWeek) {
            1, 3, 5 => 'orgânico', // Mon, Wed, Fri
            2, 4 => 'reciclável', // Tue, Thu
            default => null,
        };
    }
}
