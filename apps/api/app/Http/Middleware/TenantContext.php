<?php

namespace App\Http\Middleware;

use App\Models\City;
use App\Models\CityDomain;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Tenant Context Middleware
 * 
 * Resolves the active city (tenant) for multi-tenancy support.
 * 
 * Security: Validates hosts against trusted list before resolution.
 * 
 * Resolution priority:
 * 1. city_domains table (database-driven, cached)
 * 2. X-City header (when allowed, for dev/mobile)
 * 3. Path /uf/cidade (canonical URLs)
 * 4. Fallback to default city (configurable)
 * 
 * @see config/tenancy.php for configuration options
 */
class TenantContext
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $host = $this->normalizeHost($request->getHost());

        // 🛡️ SECURITY: Validate host before resolving tenant
        if (!$this->isHostTrusted($host)) {
            Log::warning('Untrusted host attempted tenant resolution', [
                'host' => $host,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'HOST_NOT_TRUSTED',
                'message' => 'Host não autorizado.',
            ], 400);
        }

        $city = $this->resolveTenant($request, $host);

        if (!$city) {
            if (config('tenancy.strict_mode', false)) {
                return response()->json([
                    'success' => false,
                    'error' => 'TENANT_NOT_FOUND',
                    'message' => 'Cidade não encontrada.',
                ], 404);
            }

            // Fallback to default city
            $city = City::whereSlug(config('tenancy.default_city_slug', 'tijucas-sc'))->first();
        }

        if (!$city || !$city->active) {
            return response()->json([
                'success' => false,
                'error' => 'CITY_INACTIVE',
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
     * Check if host is trusted (in whitelist or city_domains).
     */
    private function isHostTrusted(string $host): bool
    {
        // Check trusted hosts from config (supports wildcards)
        $trustedHosts = config('tenancy.trusted_hosts', []);

        foreach ($trustedHosts as $pattern) {
            if (empty($pattern))
                continue;

            // Exact match
            if ($pattern === $host) {
                return true;
            }

            // Wildcard match (e.g., *.cidadeconectada.app)
            if (str_starts_with($pattern, '*.')) {
                $suffix = substr($pattern, 1); // .cidadeconectada.app
                if (str_ends_with($host, $suffix)) {
                    return true;
                }
            }
        }

        // Check if host exists in city_domains (database whitelist)
        return $this->isHostInDomains($host);
    }

    /**
     * Check if host exists in city_domains table (cached).
     */
    private function isHostInDomains(string $host): bool
    {
        $domainMap = $this->getDomainMap();
        return isset($domainMap[$host]);
    }

    /**
     * Resolve tenant city from request.
     */
    private function resolveTenant(Request $request, string $host): ?City
    {
        // 1. Resolve by domain (database-driven, cached)
        $city = $this->resolveByDomain($host);
        if ($city) {
            return $city;
        }

        // 2. Header X-City (when allowed, for dev/mobile)
        if (config('tenancy.allow_header_override', true)) {
            $headerSlug = $request->header('X-City');
            if ($headerSlug) {
                $slug = strtolower(trim($headerSlug));
                $city = City::whereSlug($slug)->where('active', true)->first();
                if ($city) {
                    return $city;
                }
            }
        }

        // 3. Path /uf/cidade (e.g., /sc/tijucas)
        $pathSlug = $this->resolveByPath($request->getPathInfo());
        if ($pathSlug) {
            return City::whereSlug($pathSlug)->where('active', true)->first();
        }

        // 4. Return null - caller will use fallback
        return null;
    }

    /**
     * Resolve city by domain using cached city_domains table.
     */
    private function resolveByDomain(string $host): ?City
    {
        $domainMap = $this->getDomainMap();

        if (!isset($domainMap[$host])) {
            return null;
        }

        // Domain map stores arrays, need to hydrate to City
        $cityData = $domainMap[$host];
        if (is_array($cityData) && isset($cityData['id'])) {
            return City::find($cityData['id']);
        }

        return null;
    }

    /**
     * Get cached domain map.
     */
    private function getDomainMap(): array
    {
        $ttl = config('tenancy.cache.domain_map_ttl', 3600);

        return Cache::remember('city_domains:map', $ttl, function () {
            return CityDomain::with('city')
                ->get()
                ->mapWithKeys(fn($d) => [
                    $d->domain => $d->city ? $d->city->toArray() : null
                ])
                ->filter()
                ->toArray();
        });
    }

    /**
     * Resolve city slug from URL path.
     * Supports canonical URLs: /uf/cidade (e.g., /sc/tijucas)
     */
    private function resolveByPath(string $path): ?string
    {
        // Match /api/v1/... paths - skip API prefix
        if (preg_match('#^/api/v1/([a-z]{2})/([a-z0-9-]+)#i', $path, $matches)) {
            $uf = strtolower($matches[1]);
            $cidade = strtolower($matches[2]);
            return "{$cidade}-{$uf}";
        }

        // Match /uf/cidade paths
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
