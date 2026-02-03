<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tag extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'slug',
        'color',
        'is_featured',
        'usage_count',
    ];

    protected function casts(): array
    {
        return [
            'is_featured' => 'boolean',
            'usage_count' => 'integer',
        ];
    }

    // =====================================================
    // Relationships
    // =====================================================

    public function events()
    {
        return $this->belongsToMany(Event::class, 'event_tags');
    }

    // =====================================================
    // Scopes
    // =====================================================

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopePopular($query)
    {
        return $query->orderBy('usage_count', 'desc');
    }

    public function scopeTrending($query, int $days = 30)
    {
        return $query
            ->withCount([
                'events' => function ($q) use ($days) {
                    $q->where('events.created_at', '>=', now()->subDays($days));
                }
            ])
            ->orderBy('events_count', 'desc');
    }

    // =====================================================
    // Helpers
    // =====================================================

    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }

    public function decrementUsage(): void
    {
        if ($this->usage_count > 0) {
            $this->decrement('usage_count');
        }
    }
}
