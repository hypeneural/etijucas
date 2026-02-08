<?php

namespace App\Models;

use App\Enums\CityStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * City Model
 * 
 * Represents a city in the multi-tenant system.
 * Uses IBGE codes for standardization.
 * 
 * @property string $id
 * @property string|null $state_id
 * @property int $ibge_code
 * @property string $name
 * @property string $uf
 * @property string $slug
 * @property CityStatus $status
 * @property float|null $lat
 * @property float|null $lon
 * @property string|null $ddd
 * @property string $timezone
 * @property bool $active
 * @property bool $is_capital
 * @property int|null $siafi_id
 * @property int|null $population
 */
class City extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'state_id',
        'ibge_code',
        'name',
        'uf',
        'slug',
        'status',
        'brand',
        'lat',
        'lon',
        'ddd',
        'timezone',
        'is_coastal',
        'active',
        'is_capital',
        'siafi_id',
        'population',
    ];

    protected $casts = [
        'ibge_code' => 'integer',
        'status' => CityStatus::class,
        'brand' => 'array',
        'lat' => 'decimal:8',
        'lon' => 'decimal:8',
        'is_coastal' => 'boolean',
        'active' => 'boolean',
        'is_capital' => 'boolean',
        'siafi_id' => 'integer',
        'population' => 'integer',
    ];

    // ──────────────────────────────────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Get the state this city belongs to.
     */
    public function state(): BelongsTo
    {
        return $this->belongsTo(State::class);
    }

    /**
     * Get all domains for this city.
     */
    public function domains(): HasMany
    {
        return $this->hasMany(CityDomain::class);
    }

    /**
     * Get all bairros for this city.
     */
    public function bairros(): HasMany
    {
        return $this->hasMany(Bairro::class);
    }

    /**
     * Get all bairro aliases for this city.
     */
    public function bairroAliases(): HasMany
    {
        return $this->hasMany(BairroAlias::class);
    }

    /**
     * Get all address mismatches for this city.
     */
    public function addressMismatches(): HasMany
    {
        return $this->hasMany(AddressMismatchAgg::class);
    }

    /**
     * Get all modules enabled for this city.
     */
    public function modules(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Module::class, 'city_modules')
            ->withPivot(['enabled', 'version', 'settings'])
            ->withTimestamps();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Scope to only active cities (legacy - prefer byStatus).
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Scope to filter by status.
     */
    public function scopeByStatus($query, CityStatus $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to publicly visible cities (status = active).
     */
    public function scopePublic($query)
    {
        return $query->where('status', CityStatus::Active);
    }

    /**
     * Scope to cities that accept new content (staging or active).
     */
    public function scopeCanAcceptContent($query)
    {
        return $query->whereIn('status', [
            CityStatus::Staging,
            CityStatus::Active,
        ]);
    }

    /**
     * Scope to filter by UF.
     */
    public function scopeWhereUf($query, string $uf)
    {
        return $query->where('uf', strtoupper($uf));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Accessors
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Get full name with UF (e.g., "Tijucas/SC").
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->name}/{$this->uf}";
    }

    /**
     * Get brand as CityBrandDTO.
     */
    public function getBrandDtoAttribute(): \App\DataTransferObjects\CityBrandDTO
    {
        $dto = \App\DataTransferObjects\CityBrandDTO::fromArray($this->brand);

        return $dto ?? \App\DataTransferObjects\CityBrandDTO::default($this->name);
    }

    /**
     * Set brand from CityBrandDTO.
     */
    public function setBrandFromDto(\App\DataTransferObjects\CityBrandDTO $dto): void
    {
        $this->brand = $dto->toArray();
    }

    /**
     * Get PWA manifest for this city.
     */
    public function getPwaManifest(): array
    {
        return $this->brand_dto->getPwaManifest($this->name, $this->slug);
    }
}
