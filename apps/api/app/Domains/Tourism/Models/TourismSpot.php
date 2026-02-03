<?php

namespace App\Domains\Tourism\Models;

use App\Models\User;
use App\Models\Bairro;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class TourismSpot extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'titulo',
        'slug',
        'desc_curta',
        'desc_longa',
        'categoria',
        'tags',
        'image_url',
        'gallery',
        'video_url',
        'endereco',
        'bairro_id',
        'latitude',
        'longitude',
        'como_chegar',
        'horarios',
        'telefone',
        'whatsapp',
        'website',
        'instagram',
        'preco',
        'duracao',
        'dificuldade',
        'acessibilidade',
        'dicas_visita',
        'is_destaque',
        'is_verificado',
    ];

    protected $casts = [
        'tags' => 'array',
        'gallery' => 'array',
        'horarios' => 'array',
        'acessibilidade' => 'array',
        'dicas_visita' => 'array',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'rating_avg' => 'decimal:1',
        'is_destaque' => 'boolean',
        'is_verificado' => 'boolean',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (TourismSpot $spot) {
            if (empty($spot->slug)) {
                $spot->slug = Str::slug($spot->titulo);
            }
        });
    }

    // ===== Relationships =====

    public function bairro(): BelongsTo
    {
        return $this->belongsTo(Bairro::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(TourismReview::class, 'spot_id');
    }

    public function likes(): HasMany
    {
        return $this->hasMany(TourismLike::class, 'spot_id');
    }

    public function likedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tourism_likes', 'spot_id', 'user_id')
            ->withTimestamps();
    }

    public function savedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tourism_saved', 'spot_id', 'user_id')
            ->withTimestamps();
    }

    // ===== Scopes =====

    public function scopeDestaque($query)
    {
        return $query->where('is_destaque', true);
    }

    public function scopeCategoria($query, string $categoria)
    {
        return $query->where('categoria', $categoria);
    }

    public function scopeBairro($query, string $bairroId)
    {
        return $query->where('bairro_id', $bairroId);
    }

    public function scopeMinRating($query, float $rating)
    {
        return $query->where('rating_avg', '>=', $rating);
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('titulo', 'like', "%{$search}%")
                ->orWhere('desc_curta', 'like', "%{$search}%")
                ->orWhere('desc_longa', 'like', "%{$search}%");
        });
    }

    // ===== Helpers =====

    public function isLikedBy(?User $user): bool
    {
        if (!$user)
            return false;
        return $this->likes()->where('user_id', $user->id)->exists();
    }

    public function isSavedBy(?User $user): bool
    {
        if (!$user)
            return false;
        return TourismSaved::where('user_id', $user->id)
            ->where('spot_id', $this->id)
            ->exists();
    }

    public function incrementViews(): void
    {
        $this->increment('views_count');
    }

    public function recalculateRating(): void
    {
        $this->rating_avg = $this->reviews()->avg('rating') ?? 0;
        $this->reviews_count = $this->reviews()->count();
        $this->save();
    }

    public function recalculateLikes(): void
    {
        $this->likes_count = $this->likes()->count();
        $this->save();
    }
}
