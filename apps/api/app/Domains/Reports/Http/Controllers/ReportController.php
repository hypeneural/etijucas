<?php

namespace App\Domains\Reports\Http\Controllers;

use App\Domains\Reports\Actions\UpdateReportStatusAction;
use App\Domains\Reports\Enums\ReportStatus;
use App\Domains\Reports\Http\Requests\CreateReportRequest;
use App\Domains\Reports\Http\Resources\PublicReportResource;
use App\Domains\Reports\Http\Requests\UpdateReportStatusRequest;
use App\Domains\Reports\Http\Resources\ReportResource;
use App\Domains\Reports\Models\CitizenReport;
use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ReportController extends Controller
{
    /**
     * GET /api/v1/reports
     * List public reports (all approved/visible)
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        // Public reports query
        $query = CitizenReport::with(['category', 'media', 'bairro', 'statusHistory'])
            ->publicVisible()
            ->orderByDesc('created_at');

        // Filter by status
        if ($request->filled('status')) {
            $status = ReportStatus::tryFrom($request->input('status'));
            if ($status) {
                $query->byStatus($status);
            }
        }

        // Filter by category
        if ($request->filled('categoryId')) {
            $query->byCategory($request->input('categoryId'));
        }

        // Search by title or protocol
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('protocol', 'like', "%{$search}%");
            });
        }

        // Pagination
        $perPage = min($request->integer('perPage', 10), 50);
        $reports = $query->paginate($perPage);

        return PublicReportResource::collection($reports);
    }

    /**
     * GET /api/v1/reports/stats
     * Get report statistics (KPIs)
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total' => CitizenReport::count(),
            'byStatus' => [
                'recebido' => CitizenReport::byStatus(ReportStatus::Recebido)->count(),
                'em_analise' => CitizenReport::byStatus(ReportStatus::EmAnalise)->count(),
                'resolvido' => CitizenReport::byStatus(ReportStatus::Resolvido)->count(),
                'rejeitado' => CitizenReport::byStatus(ReportStatus::Rejeitado)->count(),
            ],
            'thisMonth' => CitizenReport::whereMonth('created_at', now()->month)->count(),
            'resolvedThisMonth' => CitizenReport::byStatus(ReportStatus::Resolvido)
                ->whereMonth('updated_at', now()->month)
                ->count(),
        ];

        return response()->json(['data' => $stats]);
    }

    /**
     * POST /api/v1/reports
     * Create a new citizen report
     */
    public function store(CreateReportRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        // Create the report
        $report = CitizenReport::create([
            'user_id' => $user->id,
            'category_id' => $validated['categoryId'],
            'bairro_id' => $validated['bairroId'] ?? null,
            'title' => $validated['title'],
            'description' => isset($validated['description']) ? strip_tags($validated['description']) : '', // XSS protection
            'status' => ReportStatus::Recebido,
            'address_text' => $validated['addressText'] ?? null,
            'address_source' => $validated['addressSource'] ?? 'manual',
            'location_quality' => $validated['locationQuality'] ?? 'manual',
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'location_accuracy_m' => $validated['locationAccuracyM'] ?? null,
        ]);

        // Handle image uploads
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                // Get dimensions before processing (temp file might be moved/deleted by Spatie)
                $dimensions = [];
                try {
                    $realPath = $image->getRealPath();
                    if ($realPath && file_exists($realPath)) {
                        $dims = @getimagesize($realPath);
                        if ($dims) {
                            $dimensions = ['width' => $dims[0], 'height' => $dims[1]];
                        }
                    }
                } catch (\Throwable $e) {
                    // Ignore dimension extraction errors to not block report creation
                    \Log::warning('[ReportController] Failed to get image dimensions: ' . $e->getMessage());
                }

                $media = $report->addMedia($image)
                    ->sanitizingFileName(fn($fileName) => sanitize_filename($fileName))
                    ->toMediaCollection('report_images');

                // Store dimensions if captured
                if (!empty($dimensions)) {
                    $media->setCustomProperty('width', $dimensions['width']);
                    $media->setCustomProperty('height', $dimensions['height']);
                    $media->save();
                }
            }
        }

        // Load relationships for response
        $report->load(['category', 'bairro', 'media']);

        return response()->json([
            'success' => true,
            'message' => 'Denúncia enviada com sucesso!',
            'data' => new ReportResource($report),
        ], 201);
    }

    /**
     * GET /api/v1/reports/me
     * List current user's reports
     */
    public function myReports(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $query = CitizenReport::byUser($user->id)
            ->with(['category', 'media'])
            ->orderByDesc('created_at');

        // Filter by status
        if ($request->filled('status')) {
            $status = ReportStatus::tryFrom($request->input('status'));
            if ($status) {
                $query->byStatus($status);
            }
        }

        // Filter by category
        if ($request->filled('categoryId')) {
            $query->byCategory($request->input('categoryId'));
        }

        // Pagination
        $perPage = min($request->integer('perPage', 10), 50);
        $reports = $query->paginate($perPage);

        return ReportResource::collection($reports);
    }

    /**
     * GET /api/v1/reports/{id}
     * Get report details (public - anyone can view)
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $user = $this->resolveAuthenticatedUser($request);
        $report = CitizenReport::with(['category', 'bairro', 'statusHistory.createdBy', 'media'])
            ->findOrFail($id);

        $canViewPrivate = $this->canViewPrivateReport($user, $report);
        if (!$canViewPrivate && !$report->isPubliclyVisible()) {
            abort(404);
        }

        $resource = $canViewPrivate
            ? new ReportResource($report)
            : new PublicReportResource($report);

        return response()->json([
            'success' => true,
            'data' => $resource,
        ]);
    }

    /**
     * POST /api/v1/reports/{id}/media
     * Add images to existing report
     */
    public function addMedia(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $report = CitizenReport::findOrFail($id);

        // Check authorization
        if ($report->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Você não pode adicionar fotos a esta denúncia.',
            ], 403);
        }

        // Check current image count
        $currentCount = $report->getMedia('report_images')->count();
        if ($currentCount >= 3) {
            return response()->json([
                'success' => false,
                'message' => 'Esta denúncia já possui o máximo de 3 fotos.',
            ], 422);
        }

        $request->validate([
            'images' => 'required|array|max:' . (3 - $currentCount),
            'images.*' => 'image|mimes:jpeg,png,webp|max:8192',
        ]);

        // Add images
        foreach ($request->file('images') as $image) {
            if ($report->getMedia('report_images')->count() >= 3) {
                break;
            }

            $media = $report->addMedia($image)
                ->sanitizingFileName(fn($fileName) => sanitize_filename($fileName))
                ->toMediaCollection('report_images');

            if ($dimensions = getimagesize($image->getRealPath())) {
                $media->setCustomProperty('width', $dimensions[0]);
                $media->setCustomProperty('height', $dimensions[1]);
                $media->save();
            }
        }

        $report->load('media');

        return response()->json([
            'success' => true,
            'message' => 'Fotos adicionadas com sucesso!',
            'data' => new ReportResource($report),
        ]);
    }

    /**
     * DELETE /api/v1/reports/{id}/media/{mediaId}
     * Remove image from report
     */
    public function removeMedia(Request $request, string $id, string $mediaId): JsonResponse
    {
        $user = $request->user();
        $report = CitizenReport::findOrFail($id);

        // Check authorization
        if ($report->user_id !== $user->id && !$user->hasAnyRole(['admin', 'moderator'])) {
            return response()->json([
                'success' => false,
                'message' => 'Você não pode remover fotos desta denúncia.',
            ], 403);
        }

        $media = $report->getMedia('report_images')->where('id', $mediaId)->first();

        if (!$media) {
            return response()->json([
                'success' => false,
                'message' => 'Foto não encontrada.',
            ], 404);
        }

        $media->delete();

        return response()->json([
            'success' => true,
            'message' => 'Foto removida com sucesso!',
        ]);
    }

    /**
     * PATCH /api/v1/reports/{id}/status
     * Update report status (admin only)
     */
    public function updateStatus(UpdateReportStatusRequest $request, string $id, UpdateReportStatusAction $action): JsonResponse
    {
        $user = $request->user();
        $report = CitizenReport::findOrFail($id);
        $validated = $request->validated();
        $expectedVersion = CarbonImmutable::parse($validated['version']);
        $currentVersion = $report->updated_at?->toImmutable() ?? $report->created_at?->toImmutable();

        if ($currentVersion !== null && !$currentVersion->equalTo($expectedVersion)) {
            $report->load(['category', 'bairro', 'statusHistory.createdBy', 'media']);

            return response()->json([
                'success' => false,
                'message' => 'A denuncia foi atualizada por outro moderador. Recarregue para ver as mudancas.',
                'code' => 'REPORT_STATUS_CONFLICT',
                'currentVersion' => $currentVersion->toIso8601String(),
                'data' => new ReportResource($report),
            ], 409);
        }

        $newStatus = ReportStatus::from($validated['status']);
        $note = $validated['note'] ?? null;

        $action->execute($report, $newStatus, $note, $user);
        $report->load(['category', 'bairro', 'statusHistory.createdBy', 'media']);

        return response()->json([
            'success' => true,
            'message' => 'Status atualizado para: ' . $newStatus->label(),
            'data' => new ReportResource($report),
        ]);
    }

    /**
     * GET /api/v1/admin/reports
     * List all reports (admin only)
     */
    public function adminIndex(Request $request): AnonymousResourceCollection
    {
        $query = CitizenReport::with(['category', 'bairro', 'user', 'media'])
            ->orderByDesc('created_at');

        // Filter by status
        if ($request->filled('status')) {
            $status = ReportStatus::tryFrom($request->input('status'));
            if ($status) {
                $query->byStatus($status);
            }
        }

        // Filter by category
        if ($request->filled('categoryId')) {
            $query->byCategory($request->input('categoryId'));
        }

        // Filter by bairro
        if ($request->filled('bairroId')) {
            $query->byBairro($request->input('bairroId'));
        }

        // Pagination
        $perPage = min($request->integer('perPage', 20), 100);
        $reports = $query->paginate($perPage);

        return ReportResource::collection($reports);
    }

    private function resolveAuthenticatedUser(Request $request): ?User
    {
        $requestUser = $request->user();
        if ($requestUser instanceof User) {
            return $requestUser;
        }

        $sanctumUser = auth('sanctum')->user();
        return $sanctumUser instanceof User ? $sanctumUser : null;
    }

    private function canViewPrivateReport(?User $user, CitizenReport $report): bool
    {
        if (!$user) {
            return false;
        }

        if ($user->id === $report->user_id) {
            return true;
        }

        return $user->hasAnyRole(['admin', 'moderator']);
    }
}

/**
 * Helper function to sanitize filenames
 */
if (!function_exists('sanitize_filename')) {
    function sanitize_filename(string $fileName): string
    {
        $pathInfo = pathinfo($fileName);
        $baseName = preg_replace('/[^a-zA-Z0-9_-]/', '', $pathInfo['filename']);
        $extension = $pathInfo['extension'] ?? 'jpg';
        return $baseName . '_' . time() . '.' . $extension;
    }
}
