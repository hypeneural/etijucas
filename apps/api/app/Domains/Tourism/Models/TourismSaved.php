<?php

namespace App\Domains\Tourism\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TourismSaved extends Model
{
    use HasUuids;

    protected $table = 'tourism_saved';

    protected $fillable = ['user_id', 'spot_id'];

    public $timestamps = false;

    protected $casts = [
        'created_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($saved) {
            $saved->created_at = now();
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function spot(): BelongsTo
    {
        return $this->belongsTo(TourismSpot::class, 'spot_id');
    }
}
