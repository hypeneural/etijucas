<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\Concerns;

use Filament\Tables\Columns\TextColumn;

trait HasStatusBadgeTrait
{
    protected static function statusBadgeColumn(
        string $field,
        array $colors,
        ?callable $formatState = null,
        ?string $label = null
    ): TextColumn {
        $column = TextColumn::make($field)->badge();

        if ($label) {
            $column->label($label);
        }

        if ($formatState) {
            $column->formatStateUsing($formatState);
        }

        $column->color(fn ($state): string => $colors[$state?->value ?? $state] ?? 'gray');

        return $column;
    }
}
