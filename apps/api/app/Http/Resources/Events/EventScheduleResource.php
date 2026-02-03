<?php

namespace App\Http\Resources\Events;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventScheduleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'time' => $this->formatted_time,
            'date' => $this->date?->format('Y-m-d'),
            'title' => $this->title,
            'description' => $this->description,
            'stage' => $this->stage,
            'performer' => $this->performer,
        ];
    }
}
