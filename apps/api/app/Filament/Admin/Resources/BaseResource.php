<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Actions\DeleteAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TrashedFilter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;

abstract class BaseResource extends Resource
{
    protected static array $defaultEagerLoad = [];

    protected static array $defaultWithCount = [];

    public static function getDefaultTableSortColumn(): ?string
    {
        return 'created_at';
    }

    public static function getDefaultTableSortDirection(): ?string
    {
        return 'desc';
    }

    public static function getEloquentQuery(): Builder
    {
        $query = parent::getEloquentQuery();

        if (!empty(static::$defaultEagerLoad)) {
            $query->with(static::$defaultEagerLoad);
        }

        if (!empty(static::$defaultWithCount)) {
            $query->withCount(static::$defaultWithCount);
        }

        return $query;
    }

    protected static function baseTableColumns(): array
    {
        return [
            TextColumn::make('id')
                ->label('ID')
                ->toggleable(isToggledHiddenByDefault: true)
                ->copyable(),
            TextColumn::make('created_at')
                ->label('Criado em')
                ->dateTime('d/m/Y H:i')
                ->sortable()
                ->toggleable(),
            TextColumn::make('updated_at')
                ->label('Atualizado em')
                ->dateTime('d/m/Y H:i')
                ->sortable()
                ->toggleable(isToggledHiddenByDefault: true),
        ];
    }

    protected static function baseTableActions(): array
    {
        return [
            ViewAction::make(),
            EditAction::make()->requiresConfirmation(),
            DeleteAction::make()->requiresConfirmation(),
        ];
    }

    protected static function baseTableFilters(): array
    {
        return static::usesSoftDeletes()
            ? [TrashedFilter::make()]
            : [];
    }

    protected static function usesSoftDeletes(): bool
    {
        $model = static::getModel();

        if (!$model) {
            return false;
        }

        return in_array(SoftDeletes::class, class_uses_recursive($model), true);
    }
}
