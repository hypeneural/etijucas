<?php

namespace App\Domains\Tourism\Http\Controllers;

use App\Domains\Tourism\Http\Requests\ListSpotsRequest;
use App\Domains\Tourism\Http\Resources\TourismSpotResource;
use App\Domains\Tourism\Models\TourismSpot;
use App\Domains\Tourism\Models\TourismLike;
use App\Domains\Tourism\Models\TourismSaved;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TourismSpotController extends Controller
{
    /**
     * GET /api/v1/tourism/spots
     * List spots with filters
     */
    public function index(ListSpotsRequest $request): AnonymousResourceCollection
    {
        $query = TourismSpot::query()->with('bairro');

        // Apply filters
        if ($request->filled('categoria')) {
            $query->categoria($request->categoria);
        }

        if ($request->filled('bairroId')) {
            $query->bairro($request->bairroId);
        }

        if ($request->filled('preco')) {
            $query->where('preco', $request->preco);
        }

        if ($request->filled('rating')) {
            $query->minRating((float) $request->rating);
        }

        if ($request->filled('search')) {
            $query->search($request->search);
        }

        if ($request->boolean('destaque')) {
            $query->destaque();
        }

        // Sorting
        $sortBy = $request->input('sortBy', 'popular');
        match ($sortBy) {
            'rating' => $query->orderByDesc('rating_avg'),
            'reviews' => $query->orderByDesc('reviews_count'),
            'recent' => $query->orderByDesc('created_at'),
            'popular' => $query->orderByDesc('views_count')->orderByDesc('likes_count'),
            default => $query->orderByDesc('rating_avg'),
        };

        $perPage = $request->integer('perPage', 20);
        $spots = $query->paginate($perPage);

        return TourismSpotResource::collection($spots);
    }

    /**
     * GET /api/v1/tourism/spots/{id}
     * Show single spot with reviews
     */
    public function show(string $id): TourismSpotResource
    {
        $spot = TourismSpot::with(['bairro', 'reviews.user'])
            ->findOrFail($id);

        // Increment view counter
        $spot->incrementViews();

        return new TourismSpotResource($spot);
    }

    /**
     * GET /api/v1/tourism/categories
     * List available categories
     */
    public function categories(): JsonResponse
    {
        $categories = [
            ['value' => 'natureza', 'label' => 'Natureza', 'icon' => '🌿'],
            ['value' => 'cultura', 'label' => 'Cultura', 'icon' => '🎭'],
            ['value' => 'historia', 'label' => 'História', 'icon' => '🏛️'],
            ['value' => 'gastronomia', 'label' => 'Gastronomia', 'icon' => '🍽️'],
            ['value' => 'aventura', 'label' => 'Aventura', 'icon' => '🧗'],
            ['value' => 'praia', 'label' => 'Praia', 'icon' => '🏖️'],
            ['value' => 'religioso', 'label' => 'Religioso', 'icon' => '⛪'],
            ['value' => 'familia', 'label' => 'Família', 'icon' => '👨‍👩‍👧‍👦'],
            ['value' => 'compras', 'label' => 'Compras', 'icon' => '🛍️'],
            ['value' => 'lazer', 'label' => 'Lazer', 'icon' => '🎡'],
        ];

        return response()->json(['data' => $categories]);
    }

    /**
     * POST /api/v1/tourism/spots/{id}/like
     * Toggle like on spot (auth required)
     */
    public function toggleLike(Request $request, string $id): JsonResponse
    {
        $spot = TourismSpot::findOrFail($id);
        $user = $request->user();

        $like = TourismLike::where('user_id', $user->id)
            ->where('spot_id', $spot->id)
            ->first();

        if ($like) {
            $like->delete();
            $liked = false;
        } else {
            TourismLike::create([
                'user_id' => $user->id,
                'spot_id' => $spot->id,
            ]);
            $liked = true;
        }

        // Recalculate likes count
        $spot->recalculateLikes();

        return response()->json([
            'liked' => $liked,
            'likesCount' => $spot->fresh()->likes_count,
        ]);
    }

    /**
     * POST /api/v1/tourism/spots/{id}/save
     * Toggle save/favorite on spot (auth required)
     */
    public function toggleSave(Request $request, string $id): JsonResponse
    {
        $spot = TourismSpot::findOrFail($id);
        $user = $request->user();

        $saved = TourismSaved::where('user_id', $user->id)
            ->where('spot_id', $spot->id)
            ->first();

        if ($saved) {
            $saved->delete();
            $isSaved = false;
        } else {
            TourismSaved::create([
                'user_id' => $user->id,
                'spot_id' => $spot->id,
            ]);
            $isSaved = true;
        }

        return response()->json([
            'isSaved' => $isSaved,
        ]);
    }
}
