<?php

namespace App\Http\Middleware;

use App\Models\City;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Tenant Context Middleware
 * 
 * Resolves the active city (tenant) for multi-tenancy support.
 * Resolution priority:
 * 1. Host domain (future: eflorianopolis.com.br)
 * 2. X-City header (tijucas-sc)
 * 3. Default: Tijucas
 */
class TenantContext
{
    /**
     * Default city slug when no context is provided.
     */
    private const DEFAULT_CITY_SLUG = 'tijucas-sc';

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $slug = $this->resolveSlug($request);

        $city = City::whereSlug($slug)
            ->where('active', true)
            ->first();

        // Fallback to default if resolved city not found
        if (!$city && $slug !== self::DEFAULT_CITY_SLUG) {
            $city = City::whereSlug(self::DEFAULT_CITY_SLUG)
                ->where('active', true)
                ->first();
        }

        if (!$city) {
            return response()->json([
                'success' => false,
                'error' => 'Cidade não atendida',
                'message' => 'O serviço não está disponível para esta cidade.',
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
     * Resolve city slug from request.
     */
    private function resolveSlug(Request $request): string
    {
        // 1. Header X-City
        $headerSlug = $request->header('X-City');
        if ($headerSlug) {
            return strtolower(trim($headerSlug));
        }

        // 2. Host domain mapping (future implementation)
        $hostSlug = $this->resolveFromHost($request->getHost());
        if ($hostSlug) {
            return $hostSlug;
        }

        // 3. Default
        return self::DEFAULT_CITY_SLUG;
    }

    /**
     * Resolve city slug from host domain.
     * 
     * Future implementation for multi-domain support:
     * - eflorianopolis.com.br -> florianopolis-sc
     * - etijucas.com.br -> tijucas-sc
     */
    private function resolveFromHost(string $host): ?string
    {
        // Remove www prefix
        $host = preg_replace('/^www\./', '', $host);

        // Domain mapping (can be moved to config)
        $domainMap = [
            'etijucas.com.br' => 'tijucas-sc',
            'etijucas.local' => 'tijucas-sc',
            'localhost' => 'tijucas-sc',
            // Future:
            // 'eflorianopolis.com.br' => 'florianopolis-sc',
        ];

        return $domainMap[$host] ?? null;
    }
}
