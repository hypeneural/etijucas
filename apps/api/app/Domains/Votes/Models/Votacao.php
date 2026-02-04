<?php

declare(strict_types=1);

namespace App\Domains\Votes\Models;

use App\Domains\Votes\Enums\StatusVotacao;
use App\Models\Comment;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Votacao extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'votacoes';

    protected $fillable = [
        'protocolo',
        'titulo',
        'subtitulo',
        'descricao',
        'ementa',
        'tipo',
        'status',
        'data',
        'sessao',
        'votos_sim',
        'votos_nao',
        'votos_abstencao',
        'votos_ausente',
        'url_fonte',
        'url_documento',
        'tags',
    ];

    protected $casts = [
        'data' => 'date',
        'status' => StatusVotacao::class,
        'tags' => 'array',
        'votos_sim' => 'integer',
        'votos_nao' => 'integer',
        'votos_abstencao' => 'integer',
        'votos_ausente' => 'integer',
    ];

    // =========================================
    // Relationships
    // =========================================

    public function votos(): HasMany
    {
        return $this->hasMany(VotoRegistro::class, 'votacao_id');
    }

    /**
     * Comments on this voting session (polymorphic)
     */
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    // =========================================
    // Scopes
    // =========================================

    public function scopeAprovados($query)
    {
        return $query->where('status', StatusVotacao::APROVADO);
    }

    public function scopeRejeitados($query)
    {
        return $query->where('status', StatusVotacao::REJEITADO);
    }

    public function scopeDoAno($query, int $ano)
    {
        return $query->whereYear('data', $ano);
    }

    public function scopeDoTipo($query, string $tipo)
    {
        return $query->where('tipo', $tipo);
    }

    // =========================================
    // Accessors
    // =========================================

    public function getTotalVotosAttribute(): int
    {
        return $this->votos_sim + $this->votos_nao + $this->votos_abstencao + $this->votos_ausente;
    }

    public function getResultadoAttribute(): string
    {
        return $this->votos_sim > $this->votos_nao ? 'approved' : 'rejected';
    }

    // =========================================
    // Methods
    // =========================================

    public function recalcularVotos(): void
    {
        $this->votos_sim = $this->votos()->where('voto', 'SIM')->count();
        $this->votos_nao = $this->votos()->where('voto', 'NAO')->count();
        $this->votos_abstencao = $this->votos()->where('voto', 'ABSTENCAO')->count();
        $this->votos_ausente = $this->votos()->where('voto', 'NAO_VOTOU')->count();

        // Auto-determine status based on votes
        if ($this->votos_sim > $this->votos_nao) {
            $this->status = StatusVotacao::APROVADO;
        } elseif ($this->votos_nao > $this->votos_sim) {
            $this->status = StatusVotacao::REJEITADO;
        }

        $this->save();
    }
}
