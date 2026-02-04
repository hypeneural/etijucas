<?php

declare(strict_types=1);

namespace App\Domains\Votes\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Legislatura extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'legislaturas';

    protected $fillable = [
        'numero',
        'ano_inicio',
        'ano_fim',
        'atual',
    ];

    protected $casts = [
        'numero' => 'integer',
        'ano_inicio' => 'integer',
        'ano_fim' => 'integer',
        'atual' => 'boolean',
    ];

    // =========================================
    // Relationships
    // =========================================

    public function mandatos(): HasMany
    {
        return $this->hasMany(Mandato::class, 'legislatura_id');
    }

    // =========================================
    // Scopes
    // =========================================

    public function scopeAtual($query)
    {
        return $query->where('atual', true);
    }

    // =========================================
    // Helpers
    // =========================================

    public function getPeriodoAttribute(): string
    {
        return "{$this->ano_inicio} - {$this->ano_fim}";
    }

    public function getNomeCompletoAttribute(): string
    {
        return "{$this->numero}ª Legislatura ({$this->periodo})";
    }
}
