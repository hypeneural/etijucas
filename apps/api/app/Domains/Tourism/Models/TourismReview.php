<?php

namespace App\Domains\Tourism\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class TourismReview extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'user_id',
        'spot_id',
        'rating',
        'titulo',
        'texto',
        'fotos',
        'visit_date',
    ];

    protected $casts = [
        'rating' => 'integer',
        'fotos' => 'array',
        'visit_date' => 'date',
        'likes_count' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function spot(): BelongsTo
    {
        return $this->belongsTo(TourismSpot::class, 'spot_id');
    }

    protected static function booted(): void
    {
        // Recalculate spot rating when review is created/updated/deleted
        static::saved(function (TourismReview $review) {
            $review->spot->recalculateRating();
        });

        static::deleted(function (TourismReview $review) {
            $review->spot->recalculateRating();
        });
    }
}
