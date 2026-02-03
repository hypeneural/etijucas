<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'phone' => $this->phone,
            'nome' => $this->nome,
            'email' => $this->email,
            'avatarUrl' => $this->avatar_url,
            'bairroId' => $this->bairro_id,
            'bairro' => $this->whenLoaded('bairro', fn() => [
                'id' => $this->bairro->id,
                'nome' => $this->bairro->nome,
            ]),
            'address' => $this->address,
            'notificationSettings' => $this->notification_settings,
            'phoneVerified' => $this->phone_verified,
            'phoneVerifiedAt' => $this->phone_verified_at?->toIso8601String(),
            'roles' => $this->whenLoaded('roles', fn() => $this->roles->pluck('name')),
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
