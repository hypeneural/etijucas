<?php

namespace App\Domains\Reports\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicReportResource extends JsonResource
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

            // Public timeline (no internal notes, no moderator names)
            'history' => $this->whenLoaded(
                'statusHistory',
                fn() =>
                $this->statusHistory->map(fn($h) => [
                    'status' => $h->status,
                    'at' => $h->created_at->toIso8601String(),
                ])
            ),

            // Timestamps
            'createdAt' => $this->created_at->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
            'resolvedAt' => $this->resolved_at?->toIso8601String(),
        ];
    }
}

