<?php

declare(strict_types=1);

namespace App\Domains\Votes\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VotacaoReaction extends Model
{
    use HasUuids;

    protected $table = 'votacao_reactions';

    protected $fillable = [
        'votacao_id',
        'user_id',
        'reaction',
    ];

    // =========================================
    // Relationships
    // =========================================

    public function votacao(): BelongsTo
    {
        return $this->belongsTo(Votacao::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // =========================================
    // Helpers
    // =========================================

    public function isLike(): bool
    {
        return $this->reaction === 'like';
    }

    public function isDislike(): bool
    {
        return $this->reaction === 'dislike';
    }
}
