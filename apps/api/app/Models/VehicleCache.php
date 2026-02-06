<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VehicleCache extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'vehicle_cache';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'plate',
        'plate_type',
        'final_digit',
        'brand',
        'model',
        'color',
        'uf',
        'municipio',
        'situacao',
        'logo_url',
        'payload',
        'extra',
        'fipe',
        'fetched_at',
        'expires_at',
        'last_status',
        'last_error',
        'hits',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'extra' => 'array',
            'fipe' => 'array',
            'fetched_at' => 'datetime',
            'expires_at' => 'datetime',
            'final_digit' => 'integer',
            'last_status' => 'integer',
            'hits' => 'integer',
        ];
    }

    /**
     * Check if cache is still valid.
     */
    public function isValid(): bool
    {
        return $this->expires_at && $this->expires_at->isFuture() && $this->payload;
    }

    /**
     * Check if this was a successful lookup.
     */
    public function isSuccess(): bool
    {
        return $this->last_status === 200 && $this->payload !== null;
    }

    /**
     * Scope to find by plate.
     */
    public function scopeByPlate($query, string $plate)
    {
        return $query->where('plate', strtoupper(preg_replace('/[^A-Z0-9]/i', '', $plate)));
    }

    /**
     * Scope to find valid (non-expired) entries.
     */
    public function scopeValid($query)
    {
        return $query->where('expires_at', '>', now())->whereNotNull('payload');
    }

    /**
     * Scope by plate type.
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('plate_type', $type);
    }

    /**
     * Scope by final digit (for IPVA rules).
     */
    public function scopeByFinalDigit($query, int $digit)
    {
        return $query->where('final_digit', $digit);
    }
}
