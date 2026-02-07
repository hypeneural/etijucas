<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantIncident extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'city_id',
        'type',
        'severity',
        'source',
        'module_key',
        'request_id',
        'trace_id',
        'context',
        'acknowledged_at',
    ];

    protected $casts = [
        'context' => 'array',
        'acknowledged_at' => 'datetime',
    ];

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }
}
