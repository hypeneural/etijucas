<?php

namespace App\Http\Middleware;

use App\Models\City;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Filament tenant context middleware.
 *
 * Rules:
 * - Moderator is always locked to own city_id.
 * - Admin can switch city via query ?tenant_city={city-slug} and session state.
 * - If neither applies, keeps tenant resolved by TenantContext (domain/path/header).
 */
class FilamentTenantContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        if ($user->hasRole('moderator') && !empty($user->city_id)) {
            $city = City::query()->where('id', $user->city_id)->where('active', true)->first();

            if ($city) {
                $this->bindTenant($request, $city, 'filament_user_lock');
            }

            return $next($request);
        }

        if ($user->hasRole('admin')) {
            $this->applyAdminSwitcher($request, $user);
        }

        return $next($request);
    }

    private function applyAdminSwitcher(Request $request, User $user): void
    {
        $requestedSlug = $request->query('tenant_city');
        $previousCityId = $request->session()->get('filament.tenant_city_id');

        if (is_string($requestedSlug) && $requestedSlug !== '') {
            $requestedSlug = strtolower(trim($requestedSlug));

            $requestedCity = $this->resolveActiveCityBySlug($requestedSlug);

            if ($requestedCity) {
                $request->session()->put('filament.tenant_city_id', $requestedCity->id);

                if ($previousCityId !== $requestedCity->id) {
                    Log::info('filament_tenant_switch', [
                        'user_id' => $user->id,
                        'previous_city_id' => $previousCityId,
                        'current_city_id' => $requestedCity->id,
                        'current_city_slug' => $requestedCity->slug,
                        'source' => 'query_param',
                    ]);
                }
            } else {
                Log::warning('filament_tenant_switch_invalid_city', [
                    'user_id' => $user->id,
                    'requested_slug' => $requestedSlug,
                ]);
            }
        }

        $sessionCityId = $request->session()->get('filament.tenant_city_id');

        if (!is_string($sessionCityId) || $sessionCityId === '') {
            $fallbackCity = $this->resolveFallbackCity($request, $user);
            if ($fallbackCity) {
                $request->session()->put('filament.tenant_city_id', $fallbackCity->id);

                Log::info('filament_tenant_switch', [
                    'user_id' => $user->id,
                    'previous_city_id' => null,
                    'current_city_id' => $fallbackCity->id,
                    'current_city_slug' => $fallbackCity->slug,
                    'source' => 'fallback',
                ]);

                $this->bindTenant($request, $fallbackCity, 'filament_admin_switcher');
            }

            return;
        }

        $city = $this->resolveActiveCityById($sessionCityId);

        if ($city) {
            $this->bindTenant($request, $city, 'filament_admin_switcher');
            return;
        }

        $request->session()->forget('filament.tenant_city_id');

        Log::warning('filament_tenant_switch_city_not_found', [
            'user_id' => $user->id,
            'city_id' => $sessionCityId,
        ]);
    }

    private function resolveFallbackCity(Request $request, User $user): ?City
    {
        $requestTenantCity = $request->attributes->get('tenant_city');
        if ($requestTenantCity instanceof City && $requestTenantCity->active) {
            return $requestTenantCity;
        }

        if (is_string($user->city_id) && $user->city_id !== '') {
            $city = $this->resolveActiveCityById($user->city_id);
            if ($city) {
                return $city;
            }
        }

        return City::query()->where('active', true)->orderBy('name')->first();
    }

    private function resolveActiveCityById(string $cityId): ?City
    {
        return City::query()
            ->where('id', $cityId)
            ->where('active', true)
            ->first();
    }

    private function resolveActiveCityBySlug(string $slug): ?City
    {
        return City::query()
            ->where('slug', $slug)
            ->where('active', true)
            ->first();
    }

    private function bindTenant(Request $request, City $city, string $source): void
    {
        app()->instance('tenant.city', $city);
        app()->instance('tenant.resolution_source', $source);

        $request->attributes->set('tenant_city', $city);
        $request->attributes->set('tenant_city_id', $city->id);
        $request->attributes->set('tenant_resolution_source', $source);
    }
}
