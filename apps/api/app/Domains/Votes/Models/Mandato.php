<?php

declare(strict_types=1);

namespace App\Domains\Votes\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Mandato extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'mandatos';

    protected $fillable = [
        'vereador_id',
        'partido_id',
        'legislatura_id',
        'cargo',
        'inicio',
        'fim',
        'em_exercicio',
        'observacoes',
    ];

    protected $casts = [
        'inicio' => 'date',
        'fim' => 'date',
        'em_exercicio' => 'boolean',
    ];

    // =========================================
    // Relationships
    // =========================================

    public function vereador(): BelongsTo
    {
        return $this->belongsTo(Vereador::class, 'vereador_id');
    }

    public function partido(): BelongsTo
    {
        return $this->belongsTo(Partido::class, 'partido_id');
    }

    public function legislatura(): BelongsTo
    {
        return $this->belongsTo(Legislatura::class, 'legislatura_id');
    }

    // =========================================
    // Scopes
    // =========================================

    public function scopeEmExercicio($query)
    {
        return $query->where('em_exercicio', true);
    }

    public function scopeAtual($query)
    {
        return $query->whereHas('legislatura', fn($q) => $q->where('atual', true));
    }
}
