<?php

declare(strict_types=1);

namespace App\Domains\Votes\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Vereador extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'vereadores';

    protected $fillable = [
        'nome',
        'slug',
        'nascimento',
        'cpf',
        'telefone',
        'email',
        'foto_url',
        'bio',
        'redes_sociais',
        'site_oficial_url',
        'ativo',
    ];

    protected $casts = [
        'nascimento' => 'date',
        'redes_sociais' => 'array',
        'ativo' => 'boolean',
    ];

    // =========================================
    // Boot - Auto-generate slug
    // =========================================

    protected static function booted(): void
    {
        static::creating(function (Vereador $vereador) {
            if (empty($vereador->slug)) {
                $vereador->slug = Str::slug($vereador->nome);
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }


    // =========================================
    // Relationships
    // =========================================

    public function mandatos(): HasMany
    {
        return $this->hasMany(Mandato::class, 'vereador_id');
    }

    public function mandatoAtual(): HasOne
    {
        return $this->hasOne(Mandato::class, 'vereador_id')
            ->where('em_exercicio', true)
            ->whereHas('legislatura', fn($q) => $q->where('atual', true))
            ->with(['partido', 'legislatura']);
    }

    public function votos(): HasMany
    {
        return $this->hasMany(VotoRegistro::class, 'vereador_id');
    }

    // =========================================
    // Scopes
    // =========================================

    public function scopeAtivos($query)
    {
        return $query->where('ativo', true);
    }

    public function scopeEmExercicio($query)
    {
        return $query->whereHas('mandatoAtual');
    }

    public function scopeByPartido($query, string $sigla)
    {
        return $query->whereHas('mandatoAtual.partido', fn($q) => $q->where('sigla', $sigla));
    }

    // =========================================
    // Accessors
    // =========================================

    public function getPartidoAtualAttribute(): ?Partido
    {
        return $this->mandatoAtual?->partido;
    }

    public function getCargoAtualAttribute(): ?string
    {
        return $this->mandatoAtual?->cargo;
    }

    public function getIdadeAttribute(): ?int
    {
        return $this->nascimento?->age;
    }

    // =========================================
    // Statistics
    // =========================================

    public function getEstatisticasAttribute(): array
    {
        $votos = $this->votos;
        $total = $votos->count();

        if ($total === 0) {
            return [
                'total_votos' => 0,
                'votou_sim' => 0,
                'votou_nao' => 0,
                'abstencoes' => 0,
                'ausencias' => 0,
                'presenca_percent' => 0,
            ];
        }

        $sim = $votos->where('voto', 'SIM')->count();
        $nao = $votos->where('voto', 'NAO')->count();
        $abstencao = $votos->where('voto', 'ABSTENCAO')->count();
        $ausente = $votos->where('voto', 'NAO_VOTOU')->count();
        $presenca = $total > 0 ? round((($total - $ausente) / $total) * 100, 1) : 0;

        return [
            'total_votos' => $total,
            'votou_sim' => $sim,
            'votou_nao' => $nao,
            'abstencoes' => $abstencao,
            'ausencias' => $ausente,
            'presenca_percent' => $presenca,
        ];
    }
}
