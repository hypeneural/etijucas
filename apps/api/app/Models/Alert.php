<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

/**
 * Alert Model - City-wide alerts and notifications
 * 
 * Used for weather warnings, road closures, events, and other important city announcements.
 */
class Alert extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tipo',
        'titulo',
        'descricao',
        'nivel',
        'icone',
        'priority',
        'active',
        'expires_at',
        'bairro_id',
        'metadata',
    ];

    protected $casts = [
        'active' => 'boolean',
        'priority' => 'integer',
        'expires_at' => 'datetime',
        'metadata' => 'array',
    ];

    /**
     * Scope: Active alerts only
     */
    public function scopeActive($query)
    {
        return $query->where('active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Scope: By type
     */
    public function scopeOfType($query, string $tipo)
    {
        return $query->where('tipo', $tipo);
    }

    /**
     * Scope: By level (info, warning, critical)
     */
    public function scopeOfLevel($query, string $nivel)
    {
        return $query->where('nivel', $nivel);
    }

    /**
     * Get icon for the alert type
     */
    public function getIconAttribute(): string
    {
        return $this->attributes['icone'] ?? match ($this->tipo) {
            'obras' => 'construction',
            'interdicao' => 'alert-triangle',
            'clima' => 'cloud-rain',
            'evento' => 'calendar',
            'seguranca' => 'shield-alert',
            default => 'info',
        };
    }
}
