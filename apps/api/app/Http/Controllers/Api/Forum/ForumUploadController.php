<?php

namespace App\Http\Controllers\Api\Forum;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class ForumUploadController extends Controller
{
    /**
     * Upload image for topic or comment.
     * 
     * POST /api/v1/forum/upload
     * 
     * Accepts: image/jpeg, image/png, image/webp (max 5MB)
     * Returns: { url, thumb, medium }
     */
    public function store(Request $request): JsonResponse
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

        // Use user as the media owner for orphan uploads
        $media = $user->addMediaFromRequest('file')
            ->usingFileName($this->generateFilename($request->file('file')))
            ->withCustomProperties([
                'uploaded_at' => now()->toIso8601String(),
                'context' => 'forum',
            ])
            ->toMediaCollection('forum_uploads');

        return response()->json([
            'url' => $media->getUrl(),
            'thumb' => $media->getUrl('thumb'),
            'medium' => $media->getUrl('medium'),
        ]);
    }

    /**
     * Generate unique filename.
     */
    protected function generateFilename($file): string
    {
        $extension = $file->getClientOriginalExtension();
        return 'forum_' . now()->format('Ymd_His') . '_' . uniqid() . '.' . $extension;
    }
}
