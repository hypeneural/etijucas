<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use {{ modelFqn }};
use Filament\Forms;
use Filament\Tables;

class {{ model }}Resource extends BaseResource
{
    protected static ?string $model = {{ model }}::class;

    protected static ?string $navigationGroup = '{{ navigationGroup }}';

    protected static ?string $navigationIcon = '{{ navigationIcon }}';

    protected static array $defaultEagerLoad = [
        // 'relation',
    ];

    protected static array $defaultWithCount = [
        // 'relation',
    ];

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                // Sections and fields
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                // Columns
                ...static::baseTableColumns(),
            ])
            ->filters([
                // Filters
                ...static::baseTableFilters(),
            ])
            ->actions([
                // Actions
                ...static::baseTableActions(),
            ]);
    }
}
