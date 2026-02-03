<?php

namespace App\Http\Controllers\Api\Forum;

use App\Domain\Forum\Enums\TopicCategory;
use App\Domain\Forum\Enums\TopicStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Forum\StoreTopicRequest;
use App\Http\Requests\Forum\UpdateTopicRequest;
use App\Http\Resources\TopicCollection;
use App\Http\Resources\TopicResource;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TopicController extends Controller
{
    /**
     * List topics with filters and pagination.
     * 
     * GET /api/v1/forum/topics
     */
    /**
     * List topics with filters and pagination.
     * 
     * GET /api/v1/forum/topics
     */
    public function index(Request $request): TopicCollection
    {
        // 1. Authenticated users: bypass cache to ensure liked/saved status is personalized
        if ($request->user()) {
            return new TopicCollection($this->fetchTopics($request));
        }

        // 2. Anonymous users: cache the result for performance (60 seconds)
        // Note: cache key depends on full URL (filters, pagination, sorting)
        $cacheKey = 'forum:topics:public:' . md5($request->fullUrl());

        $topics = \Illuminate\Support\Facades\Cache::remember($cacheKey, 60, function () use ($request) {
            return $this->fetchTopics($request);
        });

        return new TopicCollection($topics);
    }

    /**
     * Helper to build and execute the topic query with filters.
     */
    private function fetchTopics(Request $request)
    {
        $query = Topic::query()
            ->with(['user', 'bairro'])
            ->active();

        // User interactions (liked, saved) only if authenticated
        if ($request->user()) {
            $query->withUserInteractions($request->user()->id);
        }

        // Filters
        if ($request->filled('bairroId')) {
            $query->byBairro($request->input('bairroId'));
        }

        if ($request->filled('categoria')) {
            $categoria = TopicCategory::tryFrom($request->input('categoria'));
            if ($categoria) {
                $query->byCategoria($categoria);
            }
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('titulo', 'like', "%{$search}%")
                    ->orWhere('texto', 'like', "%{$search}%");
            });
        }

        if ($request->filled('periodo')) {
            $query->inPeriod($request->input('periodo'));
        }

        if ($request->boolean('comFoto')) {
            $query->comFoto();
        }

        // Ordering
        $orderBy = $request->input('orderBy', 'createdAt');
        $order = $request->input('order', 'desc');

        $query = match ($orderBy) {
            'likesCount' => $query->orderBy('likes_count', $order),
            'commentsCount' => $query->orderBy('comments_count', $order),
            'hotScore' => $query->orderByHotScore(),
            default => $query->orderBy('created_at', $order),
        };

        // Pagination
        $perPage = min($request->input('perPage', 15), 50);

        return $query->paginate($perPage);
    }

    /**
     * Get single topic by ID.
     * 
     * GET /api/v1/forum/topics/{topic}
     */
    public function show(Request $request, Topic $topic): JsonResponse
    {
        // Only show active topics to non-admin users
        if ($topic->status !== TopicStatus::Active) {
            $user = $request->user();
            if (!$user || !$user->hasAnyRole(['admin', 'moderator'])) {
                abort(404);
            }
        }

        $topic->load(['user', 'bairro']);

        // Add user interactions if authenticated
        if ($request->user()) {
            $topic->liked = $topic->likes()->where('user_id', $request->user()->id)->exists();
            $topic->is_saved = $topic->saves()->where('user_id', $request->user()->id)->exists();
        }

        return response()->json([
            'data' => new TopicResource($topic),
            'success' => true,
        ]);
    }

    /**
     * Create a new topic.
     * 
     * POST /api/v1/forum/topics
     */
    public function store(StoreTopicRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $topic = Topic::create([
            'user_id' => $request->user()->id,
            'bairro_id' => $validated['bairroId'],
            'titulo' => $validated['titulo'],
            'texto' => $validated['texto'],
            'categoria' => $validated['categoria'],
            'foto_url' => $validated['fotoUrl'] ?? null,
            'is_anon' => $validated['isAnon'] ?? false,
            'status' => TopicStatus::Active,
        ]);

        $topic->load(['user', 'bairro']);

        return response()->json([
            'data' => new TopicResource($topic),
            'success' => true,
            'message' => 'Tópico criado com sucesso',
        ], 201);
    }

    /**
     * Update an existing topic.
     * 
     * PUT /api/v1/forum/topics/{topic}
     */
    public function update(UpdateTopicRequest $request, Topic $topic): JsonResponse
    {
        $validated = $request->validated();

        $updateData = [];

        if (isset($validated['titulo'])) {
            $updateData['titulo'] = $validated['titulo'];
        }
        if (isset($validated['texto'])) {
            $updateData['texto'] = $validated['texto'];
        }
        if (isset($validated['categoria'])) {
            $updateData['categoria'] = $validated['categoria'];
        }
        if (array_key_exists('fotoUrl', $validated)) {
            $updateData['foto_url'] = $validated['fotoUrl'];
        }

        $topic->update($updateData);
        $topic->load(['user', 'bairro']);

        return response()->json([
            'data' => new TopicResource($topic),
            'success' => true,
            'message' => 'Tópico atualizado com sucesso',
        ]);
    }

    /**
     * Soft delete a topic.
     * 
     * DELETE /api/v1/forum/topics/{topic}
     */
    public function destroy(Request $request, Topic $topic): JsonResponse
    {
        $this->authorize('delete', $topic);

        $topic->update(['status' => TopicStatus::Deleted]);
        $topic->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tópico removido',
        ]);
    }
}
