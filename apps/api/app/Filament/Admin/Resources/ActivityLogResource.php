<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\ActivityLogResource\Pages;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Columns\TextColumn;
use Illuminate\Database\Eloquent\Builder;
use Spatie\Activitylog\Models\Activity;

class ActivityLogResource extends Resource
{
    protected static ?string $model = Activity::class;

    protected static ?string $navigationGroup = 'Sistema & Auditoria';

    protected static ?string $navigationIcon = 'heroicon-o-clipboard-document-list';

    protected static ?int $navigationSort = 80;

    protected static ?string $navigationLabel = 'Auditoria';

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('created_at')
                    ->label('Data')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
                TextColumn::make('log_name')
                    ->label('Log')
                    ->badge(),
                TextColumn::make('event')
                    ->label('Evento')
                    ->badge(),
                TextColumn::make('description')
                    ->label('Descricao')
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
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListActivityLogs::route('/'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->with('causer');
    }

    public static function canCreate(): bool
    {
        return false;
    }
}
