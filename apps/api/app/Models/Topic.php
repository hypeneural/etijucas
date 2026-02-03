<?php

namespace App\Models;

use App\Domain\Forum\Enums\TopicCategory;
use App\Domain\Forum\Enums\TopicStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Topic extends Model implements HasMedia
{
    use HasFactory, HasUuids, SoftDeletes, InteractsWithMedia;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'bairro_id',
        'titulo',
        'texto',
        'categoria',
        'foto_url',
        'is_anon',
        'status',
        'likes_count',
        'comments_count',
    ];

    protected function casts(): array
    {
        return [
            'categoria' => TopicCategory::class,
            'status' => TopicStatus::class,
            'is_anon' => 'boolean',
            'likes_count' => 'integer',
            'comments_count' => 'integer',
        ];
    }

    // =====================================================
    // Relationships
    // =====================================================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bairro(): BelongsTo
    {
        return $this->belongsTo(Bairro::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function rootComments(): HasMany
    {
        return $this->hasMany(Comment::class)->whereNull('parent_id');
    }

    public function likes(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'topic_likes')
            ->withPivot('created_at');
    }

    public function saves(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'saved_topics')
            ->withPivot('created_at');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(TopicReport::class);
    }

    // =====================================================
    // Media Collections
    // =====================================================

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('foto')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    public function registerMediaConversions(\Spatie\MediaLibrary\MediaCollections\Models\Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(150)
            ->height(150)
            ->performOnCollections('foto')
            ->nonQueued();

        $this->addMediaConversion('medium')
            ->width(600)
            ->height(600)
            ->performOnCollections('foto')
            ->nonQueued();
    }

    // =====================================================
    // Scopes
    // =====================================================

    public function scopeActive($query)
    {
        return $query->where('status', TopicStatus::Active);
    }

    public function scopeByCategoria($query, TopicCategory $categoria)
    {
        return $query->where('categoria', $categoria);
    }

    public function scopeByBairro($query, string $bairroId)
    {
        return $query->where('bairro_id', $bairroId);
    }

    public function scopeWithUserInteractions($query, ?string $userId)
    {
        if (!$userId) {
            return $query;
        }

        return $query
            ->withExists(['likes as liked' => fn($q) => $q->where('user_id', $userId)])
            ->withExists(['saves as is_saved' => fn($q) => $q->where('user_id', $userId)]);
    }

    public function scopeOrderByHotScore($query)
    {
        // Hot Score: likes * 2 + comments * 3 + recency_bonus
        // recency_bonus = max(0, 100 - hours_since_creation)
        return $query->orderByRaw('
            (likes_count * 2) + 
            (comments_count * 3) + 
            GREATEST(0, 100 - TIMESTAMPDIFF(HOUR, created_at, NOW())) 
            DESC
        ');
    }

    public function scopeInPeriod($query, string $periodo)
    {
        return match ($periodo) {
            'hoje' => $query->whereDate('created_at', today()),
            '7dias' => $query->where('created_at', '>=', now()->subDays(7)),
            '30dias' => $query->where('created_at', '>=', now()->subDays(30)),
            default => $query,
        };
    }

    public function scopeComFoto($query)
    {
        return $query->whereNotNull('foto_url');
    }

    // =====================================================
    // Helpers
    // =====================================================

    public function isEditableByAuthor(): bool
    {
        return $this->created_at->diffInHours(now()) <= 24;
    }

    public function incrementLikes(): void
    {
        $this->increment('likes_count');
    }

    public function decrementLikes(): void
    {
        $this->decrement('likes_count');
    }

    public function incrementComments(): void
    {
        $this->increment('comments_count');
    }

    public function decrementComments(): void
    {
        $this->decrement('comments_count');
    }
}
