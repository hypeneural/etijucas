<?php

namespace App\Domains\Reports\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'protocol' => $this->protocol,
            'title' => $this->title,
            'description' => $this->description,

            // Status
            'status' => $this->status->value,
            'statusLabel' => $this->status->label(),
            'statusColor' => $this->status->color(),
            'statusIcon' => $this->status->icon(),

            // Category
            'category' => new ReportCategoryResource($this->whenLoaded('category')),
            'categoryId' => $this->category_id,

            // Location
            'addressText' => $this->address_text,
            'addressSource' => $this->address_source,
            'locationQuality' => $this->location_quality?->value,
            'locationQualityLabel' => $this->location_quality?->label(),
            'latitude' => $this->latitude ? (float) $this->latitude : null,
            'longitude' => $this->longitude ? (float) $this->longitude : null,
            'locationAccuracyM' => $this->location_accuracy_m,

            // Bairro
            'bairro' => $this->whenLoaded('bairro', fn() => [
                'id' => $this->bairro->id,
                'nome' => $this->bairro->nome,
            ]),
            'bairroId' => $this->bairro_id,

            // Media
            'media' => $this->whenLoaded(
                'media',
                fn() =>
                $this->getMedia('report_images')->map(fn($media) => [
                    'id' => $media->id,
                    'url' => $media->getUrl(),
                    'thumbUrl' => $media->getUrl('thumb'),
                    'webUrl' => $media->getUrl('web'),
                    'width' => $media->getCustomProperty('width'),
                    'height' => $media->getCustomProperty('height'),
                    'mimeType' => $media->mime_type,
                    'size' => $media->size,
                ])
            ),

            // History
            'history' => $this->whenLoaded(
                'statusHistory',
                fn() =>
                $this->statusHistory->map(fn($h) => [
                    'status' => $h->status,
                    'note' => $h->note,
                    'at' => $h->created_at->toIso8601String(),
                    'by' => $h->createdBy?->nome ?? 'Sistema',
                ])
            ),

            // User (only for admin)
            'user' => $this->when(
                $request->user()?->hasAnyRole(['admin', 'moderator']),
                fn() => $this->whenLoaded('user', fn() => [
                    'id' => $this->user->id,
                    'nome' => $this->user->nome,
                    'avatarUrl' => $this->user->avatar_url,
                ])
            ),

            // Timestamps
            'createdAt' => $this->created_at->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
            'resolvedAt' => $this->resolved_at?->toIso8601String(),
        ];
    }
}
