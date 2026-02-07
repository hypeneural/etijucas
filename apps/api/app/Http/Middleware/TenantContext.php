<?php

namespace App\Http\Middleware;

use App\Models\City;
use App\Models\CityDomain;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Tenant Context Middleware
 * 
 * Resolves the active city (tenant) for multi-tenancy support.
 * Resolution priority:
 * 1. city_domains table (database-driven, no regex)
 * 2. X-City header (dev/mobile)
 * 3. Path /uf/cidade
 * 4. Default: Tijucas
 */
class TenantContext
{
    /**
     * Default city slug when no context is provided.
     */
    private const DEFAULT_CITY_SLUG = 'tijucas-sc';

    /**
     * Cache TTL for domain mapping (1 hour).
     */
    private const DOMAIN_CACHE_TTL = 3600;

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $city = $this->resolveTenant($request);

        if (!$city || !$city->active) {
            return response()->json([
                'success' => false,
                'error' => 'Cidade não atendida',
                'message' => 'O serviço não está disponível para esta localidade.',
            ], 400);
        }

        // Bind city to container for easy access
        app()->instance('tenant.city', $city);

        // Also set on request for controllers
        $request->attributes->set('tenant_city_id', $city->id);
        $request->attributes->set('tenant_city', $city);

        return $next($request);
    }

    /**
     * Resolve tenant city from request.
     */
    private function resolveTenant(Request $request): ?City
    {
        // 1. Resolve by domain (database-driven, cached)
        $host = $this->normalizeHost($request->getHost());
        $city = $this->resolveByDomain($host);
        if ($city) {
            return $city;
        }

        // 2. Header X-City (dev/mobile)
        $headerSlug = $request->header('X-City');
        if ($headerSlug) {
            $slug = strtolower(trim($headerSlug));
            return City::whereSlug($slug)->where('active', true)->first();
        }

        // 3. Path /uf/cidade (e.g., /sc/florianopolis)
        $pathSlug = $this->resolveByPath($request->getPathInfo());
        if ($pathSlug) {
            return City::whereSlug($pathSlug)->where('active', true)->first();
        }

        // 4. Fallback to default
        return City::whereSlug(self::DEFAULT_CITY_SLUG)->first();
    }

    /**
     * Resolve city by domain using cached city_domains table.
     */
    private function resolveByDomain(string $host): ?City
    {
        $domainMap = Cache::remember('city_domains:map', self::DOMAIN_CACHE_TTL, function () {
            return CityDomain::with('city')
                ->get()
                ->mapWithKeys(fn($d) => [$d->domain => $d->city])
                ->toArray();
        });

        return $domainMap[$host] ?? null;
    }

    /**
     * Resolve city slug from URL path.
     * Supports: /uf/cidade (e.g., /sc/tijucas)
     */
    private function resolveByPath(string $path): ?string
    {
        if (preg_match('#^/([a-z]{2})/([a-z0-9-]+)#i', $path, $matches)) {
            $uf = strtolower($matches[1]);
            $cidade = strtolower($matches[2]);
            return "{$cidade}-{$uf}";
        }

        return null;
    }

    /**
     * Normalize host by removing www prefix and port.
     */
    private function normalizeHost(string $host): string
    {
        // Remove www prefix
        $host = preg_replace('/^www\./i', '', $host);

        // Remove port
        $host = preg_replace('/:\d+$/', '', $host);

        return strtolower($host);
    }
}
