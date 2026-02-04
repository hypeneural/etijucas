<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Virtual model for the moderation queue (from subquery union).
 */
class ModerationQueueItem extends Model
{
    protected $table = 'moderation_queue';

    protected $guarded = [];

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';
}
