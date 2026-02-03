<?php

namespace App\Http\Controllers\Api\Events;

use App\Http\Controllers\Controller;
use App\Http\Resources\Events\TagResource;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class EventTagController extends Controller
{
    /**
     * List all tags.
     *
     * GET /api/v1/events/tags
     */
    public function index(Request $request): JsonResponse
    {
        $tags = Cache::remember('events:tags', 300, function () {
            return Tag::query()
                ->orderBy('usage_count', 'desc')
                ->limit(50)
                ->get();
        });

        return response()->json([
            'data' => TagResource::collection($tags),
            'success' => true,
        ]);
    }

    /**
     * Get trending tags (most used in last 30 days).
     *
     * GET /api/v1/events/tags/trending
     */
    public function trending(Request $request): JsonResponse
    {
        $tags = Cache::remember('events:tags:trending', 300, function () {
            return Tag::query()
                ->trending(30)
                ->limit(10)
                ->get();
        });

        return response()->json([
            'data' => TagResource::collection($tags),
            'success' => true,
        ]);
    }
}
