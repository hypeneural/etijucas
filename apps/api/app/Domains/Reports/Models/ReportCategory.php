<?php

namespace App\Domains\Reports\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ReportCategory extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'slug',
        'icon',
        'color',
        'tips',
        'active',
        'sort_order',
    ];

    protected $casts = [
        'tips' => 'array',
        'active' => 'boolean',
        'sort_order' => 'integer',
    ];

    // =====================================================
    // Relationships
    // =====================================================

    public function reports(): HasMany
    {
        return $this->hasMany(CitizenReport::class, 'category_id');
    }

    // =====================================================
    // Scopes
    // =====================================================

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    // =====================================================
    // Boot
    // =====================================================

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (ReportCategory $category) {
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });
    }
}
