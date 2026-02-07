<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Support\Tenant;
use App\Support\TenantSpaResponder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TenantPublicPageController extends Controller
{
    /**
     * Public routes that should be rendered server-side for SEO.
     */
    private const SEO_PUBLIC_PATTERNS = [
        '',
        'agenda',
        'agenda/*',
        'forum',
        'topico/*',
        'denuncias',
        'denuncias/mapa',
        'coleta-lixo',
        'missas',
        'telefones',
        'telefones-uteis',
        'pontos-turisticos',
        'ponto-turistico/*',
        'turismo',
        'previsao',
        'tempo',
        'votacoes',
        'votacoes/*',
        'vereadores',
        'vereadores/*',
        'veiculos',
        'consulta-veiculo',
    ];

    /**
     * Area paths kept in SPA mode.
     */
    private const SPA_ONLY_PREFIXES = [
        'perfil',
        'mais',
        'login',
        'cadastro',
        'esqueci-senha',
        'denuncia/nova',
        'minhas-denuncias',
    ];

    public function __invoke(Request $request, string $uf, string $cidade, ?string $any = null)
    {
        $path = trim((string) ($any ?? ''), '/');
        $normalizedPath = strtolower($path);

        if ($this->mustServeSpa($normalizedPath) || !$this->isSeoPublicPath($normalizedPath)) {
            return TenantSpaResponder::make();
        }

        $city = Tenant::city();
        if (!$city) {
            return TenantSpaResponder::make();
        }

        $moduleKey = $this->resolveModuleKey($normalizedPath);
        $moduleEnabled = $this->isModuleEnabledSafe($moduleKey);

        $canonicalPath = '/' . strtolower($uf) . '/' . strtolower($cidade) . ($normalizedPath !== '' ? '/' . $normalizedPath : '');
        $cityBasePath = '/' . strtolower($uf) . '/' . strtolower($cidade);
        $cityBaseUrl = rtrim($request->getSchemeAndHttpHost(), '/') . $cityBasePath;
        $canonicalUrl = rtrim($request->getSchemeAndHttpHost(), '/') . $canonicalPath;

        $seo = $this->buildSeoPayload(
            cityName: (string) $city->name,
            cityUf: (string) $city->uf,
            path: $normalizedPath,
            moduleKey: $moduleKey,
            moduleEnabled: $moduleEnabled,
            canonicalUrl: $canonicalUrl,
            cityBaseUrl: $cityBaseUrl
        );

        return response()
            ->view('tenant-seo', $seo)
            ->header('Cache-Control', 'public, max-age=120, stale-while-revalidate=60')
            ->header('Vary', 'Host, X-City')
            ->header('X-App-Renderer', 'seo');
    }

    private function mustServeSpa(string $path): bool
    {
        foreach (self::SPA_ONLY_PREFIXES as $prefix) {
            if ($path === $prefix || str_starts_with($path, $prefix . '/')) {
                return true;
            }
        }

        return false;
    }

    private function isSeoPublicPath(string $path): bool
    {
        foreach (self::SEO_PUBLIC_PATTERNS as $pattern) {
            if ($pattern === $path) {
                return true;
            }

            if (str_ends_with($pattern, '/*')) {
                $prefix = substr($pattern, 0, -2);
                if ($path !== '' && ($path === $prefix || str_starts_with($path, $prefix . '/'))) {
                    return true;
                }
            }
        }

        return false;
    }

    private function resolveModuleKey(string $path): ?string
    {
        $first = explode('/', $path)[0] ?? '';

        return match ($first) {
            '', 'home' => null,
            'agenda', 'evento' => 'events',
            'forum', 'topico' => 'forum',
            'denuncias', 'denuncia', 'minhas-denuncias' => 'reports',
            'coleta-lixo', 'coleta' => 'trash',
            'missas' => 'masses',
            'telefones', 'telefones-uteis' => 'phones',
            'pontos-turisticos', 'ponto-turistico', 'turismo' => 'tourism',
            'previsao', 'tempo' => 'weather',
            'votacoes' => 'voting',
            'vereadores' => 'council',
            'veiculos', 'consulta-veiculo' => 'vehicles',
            default => null,
        };
    }

    private function isModuleEnabledSafe(?string $moduleKey): bool
    {
        if (!is_string($moduleKey) || $moduleKey === '') {
            return true;
        }

        if (!Schema::hasTable('modules') || !Schema::hasTable('city_modules')) {
            return true;
        }

        try {
            return Tenant::moduleEnabled($moduleKey);
        } catch (\Throwable) {
            return true;
        }
    }

    /**
     * @return array{
     *   title: string,
     *   description: string,
     *   canonicalUrl: string,
     *   cityBaseUrl: string,
     *   robots: string,
     *   heading: string,
     *   intro: string,
     *   cityLabel: string,
     *   publicLinks: array<int, array{label: string, href: string}>,
     *   highlights: array<int, array{title: string, href: string, meta: string}>,
     *   moduleEnabled: bool
     * }
     */
    private function buildSeoPayload(
        string $cityName,
        string $cityUf,
        string $path,
        ?string $moduleKey,
        bool $moduleEnabled,
        string $canonicalUrl,
        string $cityBaseUrl
    ): array {
        $first = explode('/', $path)[0] ?? '';
        $cityLabel = $cityName . '/' . $cityUf;

        $pageTitle = match ($first) {
            '', 'home' => 'Portal da Cidade',
            'agenda', 'evento' => 'Agenda de Eventos',
            'forum', 'topico' => 'Forum da Comunidade',
            'denuncias', 'denuncia' => 'Fiscaliza Cidadao',
            'coleta-lixo', 'coleta' => 'Coleta de Lixo',
            'missas' => 'Horarios de Missas',
            'telefones', 'telefones-uteis' => 'Telefones Uteis',
            'pontos-turisticos', 'ponto-turistico', 'turismo' => 'Pontos Turisticos',
            'previsao', 'tempo' => 'Previsao do Tempo',
            'votacoes' => 'Votacoes',
            'vereadores' => 'Vereadores',
            'veiculos', 'consulta-veiculo' => 'Consulta de Veiculos',
            default => 'Servicos da Cidade',
        };

        $description = $moduleEnabled
            ? "{$pageTitle} em {$cityLabel}. Acesse informacoes publicas e servicos por cidade."
            : "{$pageTitle} em {$cityLabel} esta indisponivel no momento para esta cidade.";

        $heading = $moduleEnabled
            ? "{$pageTitle} - {$cityLabel}"
            : "{$pageTitle} indisponivel - {$cityLabel}";

        $intro = $moduleEnabled
            ? "Conteudo publico indexavel por cidade com URL canonica e sem dependencia de hidratacao tardia."
            : "Este modulo nao esta ativo para esta cidade no momento.";

        return [
            'title' => "{$pageTitle} em {$cityLabel} | e{$cityName}",
            'description' => $description,
            'canonicalUrl' => $canonicalUrl,
            'cityBaseUrl' => $cityBaseUrl,
            'robots' => $moduleEnabled ? 'index,follow' : 'noindex,nofollow',
            'heading' => $heading,
            'intro' => $intro,
            'cityLabel' => $cityLabel,
            'publicLinks' => $this->buildPublicLinks($moduleEnabled ? $moduleKey : null),
            'highlights' => $this->buildHighlights($path),
            'moduleEnabled' => $moduleEnabled,
        ];
    }

    /**
     * @return array<int, array{label: string, href: string}>
     */
    private function buildPublicLinks(?string $activeModule): array
    {
        $base = [
            ['label' => 'Agenda', 'href' => 'agenda', 'module' => 'events'],
            ['label' => 'Forum', 'href' => 'forum', 'module' => 'forum'],
            ['label' => 'Denuncias', 'href' => 'denuncias', 'module' => 'reports'],
            ['label' => 'Turismo', 'href' => 'pontos-turisticos', 'module' => 'tourism'],
            ['label' => 'Votacoes', 'href' => 'votacoes', 'module' => 'voting'],
            ['label' => 'Vereadores', 'href' => 'vereadores', 'module' => 'council'],
        ];

        $links = [];
        foreach ($base as $item) {
            if (!$this->isModuleEnabledSafe($item['module'])) {
                continue;
            }

            $label = $item['label'];
            if ($activeModule === $item['module']) {
                $label .= ' (pagina atual)';
            }

            $links[] = [
                'label' => $label,
                'href' => $item['href'],
            ];
        }

        return $links;
    }

    /**
     * @return array<int, array{title: string, href: string, meta: string}>
     */
    private function buildHighlights(string $path): array
    {
        $first = explode('/', $path)[0] ?? '';

        if ($first === 'agenda' || $first === '') {
            return $this->buildEventHighlights();
        }

        if ($first === 'pontos-turisticos' || $first === 'turismo' || $first === 'ponto-turistico') {
            return $this->buildTourismHighlights();
        }

        if ($first === 'forum' || $first === 'topico') {
            return $this->buildForumHighlights();
        }

        return [];
    }

    /**
     * @return array<int, array{title: string, href: string, meta: string}>
     */
    private function buildEventHighlights(): array
    {
        if (!Schema::hasTable('events') || !Schema::hasColumn('events', 'title')) {
            return [];
        }

        $query = DB::table('events')
            ->orderBy('start_datetime')
            ->limit(6);

        if (Schema::hasColumn('events', 'status')) {
            $query->where('status', 'published');
        }

        if (Schema::hasColumn('events', 'city_id') && is_string(Tenant::cityId())) {
            $query->where('city_id', Tenant::cityId());
        }

        if (Schema::hasColumn('events', 'deleted_at')) {
            $query->whereNull('deleted_at');
        }

        $rows = $query->get(['id', 'slug', 'title', 'start_datetime']);

        return $rows->map(static function ($row): array {
            $idOrSlug = is_string($row->slug ?? null) && $row->slug !== '' ? $row->slug : (string) $row->id;
            return [
                'title' => (string) $row->title,
                'href' => 'agenda/' . $idOrSlug,
                'meta' => is_string($row->start_datetime ?? null) ? substr($row->start_datetime, 0, 10) : '',
            ];
        })->all();
    }

    /**
     * @return array<int, array{title: string, href: string, meta: string}>
     */
    private function buildTourismHighlights(): array
    {
        if (!Schema::hasTable('tourism_spots') || !Schema::hasColumn('tourism_spots', 'titulo')) {
            return [];
        }

        $query = DB::table('tourism_spots as spots')
            ->limit(6);

        if (Schema::hasColumn('tourism_spots', 'is_destaque')) {
            $query->orderByDesc('spots.is_destaque');
        }
        $query->orderBy('spots.titulo');

        if (
            Schema::hasColumn('tourism_spots', 'bairro_id') &&
            Schema::hasTable('bairros') &&
            Schema::hasColumn('bairros', 'city_id') &&
            is_string(Tenant::cityId())
        ) {
            $query->join('bairros as b', 'b.id', '=', 'spots.bairro_id')
                ->where('b.city_id', Tenant::cityId());
        }

        if (Schema::hasColumn('tourism_spots', 'deleted_at')) {
            $query->whereNull('spots.deleted_at');
        }

        $rows = $query->get(['spots.id', 'spots.slug', 'spots.titulo', 'spots.categoria']);

        return $rows->map(static function ($row): array {
            $idOrSlug = is_string($row->slug ?? null) && $row->slug !== '' ? $row->slug : (string) $row->id;
            return [
                'title' => (string) $row->titulo,
                'href' => 'ponto-turistico/' . $idOrSlug,
                'meta' => (string) ($row->categoria ?? ''),
            ];
        })->all();
    }

    /**
     * @return array<int, array{title: string, href: string, meta: string}>
     */
    private function buildForumHighlights(): array
    {
        if (!Schema::hasTable('topics') || !Schema::hasColumn('topics', 'titulo')) {
            return [];
        }

        $query = DB::table('topics')
            ->orderByDesc('created_at')
            ->limit(6);

        if (Schema::hasColumn('topics', 'city_id') && is_string(Tenant::cityId())) {
            $query->where('city_id', Tenant::cityId());
        }

        if (Schema::hasColumn('topics', 'deleted_at')) {
            $query->whereNull('deleted_at');
        }

        $rows = $query->get(['id', 'titulo', 'created_at']);

        return $rows->map(static function ($row): array {
            return [
                'title' => (string) $row->titulo,
                'href' => 'topico/' . (string) $row->id,
                'meta' => is_string($row->created_at ?? null) ? substr($row->created_at, 0, 10) : '',
            ];
        })->all();
    }
}
