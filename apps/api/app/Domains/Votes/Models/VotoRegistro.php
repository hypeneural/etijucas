<?php

declare(strict_types=1);

namespace App\Domains\Votes\Models;

use App\Domains\Votes\Enums\TipoVoto;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VotoRegistro extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'votos_registro';

    protected $fillable = [
        'votacao_id',
        'vereador_id',
        'voto',
        'justificativa',
        'url_video',
    ];

    protected $casts = [
        'voto' => TipoVoto::class,
    ];

    // =========================================
    // Relationships
    // =========================================

    public function votacao(): BelongsTo
    {
        return $this->belongsTo(Votacao::class, 'votacao_id');
    }

    public function vereador(): BelongsTo
    {
        return $this->belongsTo(Vereador::class, 'vereador_id');
    }

    // =========================================
    // Boot
    // =========================================

    protected static function booted(): void
    {
        static::saved(function (VotoRegistro $voto) {
            $voto->votacao->recalcularVotos();
        });

        static::deleted(function (VotoRegistro $voto) {
            $voto->votacao->recalcularVotos();
        });
    }
}
