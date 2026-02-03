<?php

declare(strict_types=1);

namespace App\Models;

use App\Domain\Content\Enums\PhoneCategory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Phone extends Model
{
    use HasUuids;
    use LogsActivity;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $table = 'phones';
    protected static string $logName = 'content';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'category',
        'name',
        'number',
        'whatsapp',
        'is_emergency',
        'is_pinned',
        'address',
        'hours',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'category' => PhoneCategory::class,
            'whatsapp' => 'boolean',
            'is_emergency' => 'boolean',
            'is_pinned' => 'boolean',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'category',
                'name',
                'number',
                'whatsapp',
                'is_emergency',
                'is_pinned',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
