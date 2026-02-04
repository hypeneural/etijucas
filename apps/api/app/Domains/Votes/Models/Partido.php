<?php

declare(strict_types=1);

namespace App\Domains\Votes\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Partido extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'partidos';

    protected $fillable = [
        'sigla',
        'nome',
        'cor_hex',
        'logo_url',
    ];

    // =========================================
    // Relationships
    // =========================================

    public function mandatos(): HasMany
    {
        return $this->hasMany(Mandato::class, 'partido_id');
    }

    public function vereadoresAtuais(): HasMany
    {
        return $this->mandatos()
            ->where('em_exercicio', true)
            ->whereHas('legislatura', fn($q) => $q->where('atual', true));
    }
}
