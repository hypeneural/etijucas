<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Comment extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    public const MAX_DEPTH = 2;

    protected $fillable = [
        'topic_id',
        'user_id',
        'parent_id',
        'texto',
        'image_url',
        'is_anon',
        'depth',
        'likes_count',
    ];

    protected function casts(): array
    {
        return [
            'is_anon' => 'boolean',
            'depth' => 'integer',
            'likes_count' => 'integer',
        ];
    }

    // =====================================================
    // Relationships
    // =====================================================

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(Comment::class, 'parent_id');
    }

    public function allReplies(): HasMany
    {
        return $this->replies()->with('allReplies');
    }

    public function likes(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'comment_likes')
            ->withPivot('created_at');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(CommentReport::class);
    }

    // =====================================================
    // Scopes
    // =====================================================

    public function scopeRoot($query)
    {
        return $query->whereNull('parent_id');
    }

    public function scopeWithUserLiked($query, ?string $userId)
    {
        if (!$userId) {
            return $query;
        }

        return $query->withExists(['likes as liked' => fn($q) => $q->where('user_id', $userId)]);
    }

    public function scopeWithRepliesTree($query)
    {
        return $query->with([
            'allReplies' => function ($q) {
                $q->orderBy('created_at', 'asc');
            },
            'allReplies.user',
        ]);
    }

    // =====================================================
    // Helpers
    // =====================================================

    public function calculateDepth(): int
    {
        if (!$this->parent_id) {
            return 0;
        }

        $parentDepth = $this->parent?->depth ?? 0;
        return min($parentDepth + 1, self::MAX_DEPTH);
    }

    public function incrementLikes(): void
    {
        $this->increment('likes_count');
    }

    public function decrementLikes(): void
    {
        $this->decrement('likes_count');
    }

    public function getRepliesCountAttribute(): int
    {
        return $this->replies()->count();
    }
}
