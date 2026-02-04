<?php

declare(strict_types=1);

namespace App\Domains\Home\Http\Controllers;

use App\Domains\Home\Services\HomeAggregatorService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * HomeController - Aggregated Home endpoint
 * 
 * Provides the "Hoje em Tijucas" experience with all data in a single request.
 * This is the most important controller for mobile performance.
 */
class HomeController extends Controller
{
    public function __construct(
        private HomeAggregatorService $aggregator
    ) {
    }

    /**
     * GET /api/v1/home
     * 
     * Returns all home data blocks in a single response.
     * Supports filtering by bairro and selective block inclusion.
     * 
     * Query params:
     * - bairro_id: Filter by neighborhood
     * - include: Comma-separated list of blocks (alerts,weather,boletim,fiscaliza,forum,quick_access,events,tourism,stats)
     * - version: API version (default: 1)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $bairroId = $request->query('bairro_id');
        $include = $request->query('include')
            ? explode(',', $request->query('include'))
            : [];
        $version = (int) $request->query('version', '1');

        $data = $this->aggregator->getHomeData($bairroId, $include, $version);

        // Add user-specific data outside of cache
        $user = $request->user();
        if ($user) {
            $streak = $user->getOrCreateStreak();
            $data['meta']['user'] = [
                'id' => $user->id,
                'nome' => $user->nome,
                'streak' => $streak->getStreakData(),
            ];
        }

        return response()->json($data);
    }

    /**
     * GET /api/v1/today/brief
     * 
     * Returns the "Boletim do Dia" - a lightweight daily summary.
     * Perfect for notifications and quick glances.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function brief(Request $request): JsonResponse
    {
        $bairroId = $request->query('bairro_id');

        $data = $this->aggregator->getBoletimDoDia($bairroId);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * GET /api/v1/stats/users
     * 
     * Returns user stats for the "Tijucanos" counter.
     * 
     * @return JsonResponse
     */
    public function userStats(): JsonResponse
    {
        $data = $this->aggregator->getUserStats();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
