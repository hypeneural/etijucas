<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Bairro extends Model
{
    use HasUuids;

    /**
     * The primary key type.
     */
    protected $keyType = 'string';

    /**
     * Indicates if the IDs are auto-incrementing.
     */
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'nome',
        'slug',
        'active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'active' => 'boolean',
        ];
    }

    // =====================================================
    // Relationships
    // =====================================================

    /**
     * Get the users for the bairro.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    // =====================================================
    // Scopes
    // =====================================================

    /**
     * Scope a query to only include active bairros.
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
