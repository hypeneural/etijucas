<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organizer extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'slug',
        'email',
        'phone',
        'whatsapp',
        'instagram',
        'website',
        'avatar_url',
        'description',
        'is_verified',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'is_verified' => 'boolean',
        ];
    }

    // =====================================================
    // Relationships
    // =====================================================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    // =====================================================
    // Scopes
    // =====================================================

    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    // =====================================================
    // Helpers
    // =====================================================

    public function getWhatsappLinkAttribute(): ?string
    {
        if (!$this->whatsapp) {
            return null;
        }

        $number = preg_replace('/[^0-9]/', '', $this->whatsapp);
        return "https://wa.me/{$number}";
    }

    public function getInstagramLinkAttribute(): ?string
    {
        if (!$this->instagram) {
            return null;
        }

        $handle = ltrim($this->instagram, '@');
        return "https://instagram.com/{$handle}";
    }
}
