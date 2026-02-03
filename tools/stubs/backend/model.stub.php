<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
{{softDeletesUse}}

class {{Model}} extends Model
{
    use HasFactory{{hasUuidsTrait}}{{hasSoftDeletesTrait}};

{{uuidConfig}}

    protected $fillable = [
{{fillable}}
    ];

    protected function casts(): array
    {
        return [
{{casts}}
        ];
    }
}
