<?php

namespace App\Http\Controllers\Api\Events;

use App\Http\Controllers\Controller;
use App\Http\Resources\Events\EventCategoryResource;
use App\Models\EventCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class EventCategoryController extends Controller
{
    /**
     * List all event categories.
     *
     * GET /api/v1/events/categories
     */
    public function index(Request $request): JsonResponse
    {
        $categories = Cache::remember('events:categories', 300, function () {
            return EventCategory::query()
                ->active()
                ->ordered()
                ->withCount(['events' => fn($q) => $q->published()->upcoming()])
                ->get();
        });

        return response()->json([
            'data' => EventCategoryResource::collection($categories),
            'success' => true,
        ]);
    }
}
