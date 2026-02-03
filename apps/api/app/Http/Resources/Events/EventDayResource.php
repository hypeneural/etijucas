<?php

namespace App\Http\Resources\Events;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventDayResource extends JsonResource
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
            'dayNumber' => $this->day_number,
            'date' => $this->date?->format('Y-m-d'),
            'title' => $this->title ?? "Dia {$this->day_number}",
            'startTime' => substr($this->start_time, 0, 5),
            'endTime' => substr($this->end_time, 0, 5),
            'description' => $this->description,
            'coverImage' => $this->cover_image_url,
            'schedule' => EventScheduleResource::collection($this->whenLoaded('schedules')),
        ];
    }
}
