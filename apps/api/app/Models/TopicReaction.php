<?php

namespace App\Models;

use App\Domain\Forum\Enums\ReactionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * TopicReaction Model
 * 
 * Represents user interactions with topics:
 * - confirm: "Eu vi também" (I saw this too)
 * - support: "Apoiar" (I support this)
 */
class TopicReaction extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'topic_id',
        'user_id',
        'type',
    ];

    protected $casts = [
        'type' => ReactionType::class,
        'created_at' => 'datetime',
    ];

    /**
     * Get the topic this reaction belongs to.
     */
    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }

    /**
     * Get the user who made this reaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
