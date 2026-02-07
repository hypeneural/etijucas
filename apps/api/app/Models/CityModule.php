<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * CityModule Model
 * 
 * Configuration of a module for a specific city.
 * 
 * @property string $id
 * @property string $city_id
 * @property string $module_id
 * @property bool $enabled
 * @property int $version
 * @property array|null $settings
 */
class CityModule extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'city_id',
        'module_id',
        'enabled',
        'version',
        'settings',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'version' => 'integer',
        'settings' => 'array',
    ];

    // =====================================================
    // Relationships
    // =====================================================

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    // =====================================================
    // Settings Accessors
    // =====================================================

    /**
     * Get a specific setting value
     */
    public function getSetting(string $key, mixed $default = null): mixed
    {
        return data_get($this->settings, $key, $default);
    }

    /**
     * Get UI settings
     */
    public function getUiSettings(): array
    {
        return $this->getSetting('ui', []);
    }

    /**
     * Get rules settings
     */
    public function getRulesSettings(): array
    {
        return $this->getSetting('rules', []);
    }

    /**
     * Get integrations settings
     */
    public function getIntegrationsSettings(): array
    {
        return $this->getSetting('integrations', []);
    }
}
