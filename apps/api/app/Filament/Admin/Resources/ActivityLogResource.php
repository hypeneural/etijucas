<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\ActivityLogResource\Pages;
use Filament\Tables;
use Filament\Tables\Columns\TextColumn;
use Spatie\Activitylog\Models\Activity;

class ActivityLogResource extends BaseResource
{
    protected static ?string $model = Activity::class;

    protected static ?string $navigationGroup = 'Sistema & Auditoria';

    protected static ?string $navigationIcon = 'heroicon-o-clipboard-document-list';

    protected static ?int $navigationSort = 80;

    protected static ?string $navigationLabel = 'Auditoria';

    protected static array $defaultEagerLoad = ['causer'];

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('log_name')
                    ->label('Log')
                    ->badge(),
                TextColumn::make('event')
                    ->label('Evento')
                    ->badge(),
                TextColumn::make('description')
                    ->label('Descri??o')
                    ->limit(50)
                    ->tooltip(fn ($record) => $record->description),
                TextColumn::make('causer.nome')
                    ->label('Autor')
                    ->toggleable(),
                TextColumn::make('subject_type')
                    ->label('Tipo')
                    ->toggleable(),
                TextColumn::make('subject_id')
                    ->label('ID')
                    ->toggleable(),
                ...static::baseTableColumns(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                ...static::baseTableFilters(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListActivityLogs::route('/'),
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }
}
