<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UpdateNotificationsRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Get the authenticated user's full profile.
     * 
     * GET /api/v1/users/me
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('bairro', 'roles');

        // Add stats (gracefully handle missing models)
        $stats = [
            'reportsCount' => 0,
            'topicsCount' => 0,
        ];

        try {
            if (method_exists($user, 'reports') && class_exists(\App\Models\Report::class)) {
                $stats['reportsCount'] = $user->reports()->count();
            }
        } catch (\Throwable $e) {
        }

        try {
            if (method_exists($user, 'topics') && class_exists(\App\Models\Topic::class)) {
                $stats['topicsCount'] = $user->topics()->count();
            }
        } catch (\Throwable $e) {
        }

        return response()->json([
            'data' => array_merge(
                (new UserResource($user))->toArray($request),
                ['stats' => $stats]
            ),
        ]);
    }

    /**
     * Update the authenticated user's profile.
     * 
     * PUT /api/v1/users/me
     */
    public function update(UpdateUserRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        // Map camelCase to snake_case
        $data = [];
        if (isset($validated['nome'])) {
            $data['nome'] = $validated['nome'];
        }
        if (array_key_exists('email', $validated)) {
            $data['email'] = $validated['email'];
        }
        if (array_key_exists('bairro_id', $validated) || array_key_exists('bairroId', $validated)) {
            $data['bairro_id'] = $validated['bairro_id'] ?? $validated['bairroId'] ?? null;
        }
        if (array_key_exists('address', $validated)) {
            $data['address'] = $validated['address'];
        }

        $user->update($data);

        return response()->json([
            'data' => new UserResource($user->fresh()->load('bairro', 'roles')),
            'message' => 'Perfil atualizado com sucesso',
        ]);
    }

    /**
     * Upload avatar for the authenticated user.
     * 
     * POST /api/v1/users/me/avatar
     * 
     * Accepts: image/jpeg, image/png, image/webp (max 5MB)
     * Generates: thumb (150x150), medium (300x300) conversions
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:5120'], // 5MB
        ], [
            'file.required' => 'Selecione uma imagem para upload.',
            'file.image' => 'O arquivo deve ser uma imagem.',
            'file.mimes' => 'Formatos aceitos: JPEG, PNG ou WebP.',
            'file.max' => 'A imagem deve ter no máximo 5MB.',
        ]);

        $user = $request->user();

        // Clear existing avatar
        $user->clearMediaCollection('avatar');

        // Add new avatar with custom properties
        $media = $user->addMediaFromRequest('file')
            ->usingFileName($this->generateAvatarFilename($request->file('file')))
            ->withCustomProperties([
                'uploaded_at' => now()->toIso8601String(),
                'original_name' => $request->file('file')->getClientOriginalName(),
            ])
            ->toMediaCollection('avatar');

        // Update avatar_url field for quick access
        $user->update(['avatar_url' => $media->getUrl()]);

        return response()->json([
            'url' => $media->getUrl(),
            'thumb' => $media->getUrl('thumb'),
            'medium' => $media->getUrl('medium'),
        ]);
    }

    /**
     * Remove avatar for the authenticated user.
     * 
     * DELETE /api/v1/users/me/avatar
     */
    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->clearMediaCollection('avatar');
        $user->update(['avatar_url' => null]);

        return response()->json([
            'success' => true,
            'message' => 'Avatar removido',
        ]);
    }

    /**
     * Update notification settings for the authenticated user.
     * 
     * PUT /api/v1/users/me/notifications
     */
    public function updateNotifications(UpdateNotificationsRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        // Merge with existing settings
        $currentSettings = $user->notification_settings ?? [];
        $newSettings = array_merge($currentSettings, $validated);

        $user->update([
            'notification_settings' => $newSettings,
        ]);

        return response()->json([
            'data' => $newSettings,
        ]);
    }

    /**
     * Generate a unique filename for avatar using UUID.
     */
    protected function generateAvatarFilename($file): string
    {
        $extension = $file->getClientOriginalExtension();
        return 'avatar_' . now()->format('Ymd_His') . '.' . $extension;
    }
}
