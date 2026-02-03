<?php

namespace App\Domains\Tourism\Http\Controllers;

use App\Domains\Tourism\Http\Requests\CreateReviewRequest;
use App\Domains\Tourism\Http\Resources\TourismReviewResource;
use App\Domains\Tourism\Models\TourismReview;
use App\Domains\Tourism\Models\TourismSpot;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TourismReviewController extends Controller
{
    /**
     * GET /api/v1/tourism/spots/{spotId}/reviews
     * List reviews for a spot
     */
    public function index(Request $request, string $spotId): AnonymousResourceCollection
    {
        $spot = TourismSpot::findOrFail($spotId);

        $reviews = $spot->reviews()
            ->with('user')
            ->orderByDesc('created_at')
            ->paginate(10);

        return TourismReviewResource::collection($reviews);
    }

    /**
     * POST /api/v1/tourism/spots/{spotId}/reviews
     * Create a review (auth required)
     */
    public function store(CreateReviewRequest $request, string $spotId): JsonResponse
    {
        $spot = TourismSpot::findOrFail($spotId);
        $user = $request->user();

        // Check if user already reviewed this spot
        $existingReview = TourismReview::where('user_id', $user->id)
            ->where('spot_id', $spot->id)
            ->first();

        if ($existingReview) {
            return response()->json([
                'success' => false,
                'message' => 'Você já avaliou este local',
                'code' => 'ALREADY_REVIEWED',
            ], 422);
        }

        $review = TourismReview::create([
            'user_id' => $user->id,
            'spot_id' => $spot->id,
            'rating' => $request->integer('rating'),
            'titulo' => $request->input('titulo'),
            'texto' => $request->input('texto'),
            'fotos' => $request->input('fotos'),
            'visit_date' => $request->input('visitDate'),
        ]);

        $review->load('user');

        return response()->json([
            'success' => true,
            'message' => 'Avaliação enviada com sucesso!',
            'data' => new TourismReviewResource($review),
        ], 201);
    }

    /**
     * DELETE /api/v1/tourism/reviews/{id}
     * Delete own review (auth required)
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $review = TourismReview::findOrFail($id);
        $user = $request->user();

        if ($review->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Você não pode deletar esta avaliação',
            ], 403);
        }

        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'Avaliação removida',
        ]);
    }
}
