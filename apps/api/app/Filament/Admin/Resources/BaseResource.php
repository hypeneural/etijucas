<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Support\Tenant;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Actions\DeleteAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TrashedFilter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

abstract class BaseResource extends Resource
{
    protected static array $defaultEagerLoad = [];

    protected static array $defaultWithCount = [];

    protected static bool $tenantScoped = false;

    protected static ?string $tenantColumn = 'city_id';

    /**
     * Dot-notation relationship path(s) that can be used to resolve tenant scope
     * when the model does not expose city_id directly.
     *
     * Example: ['topic'] or ['comment.topic']
     *
     * @var list<string>
     */
    protected static array $tenantRelationScopes = [];

    protected static bool $failClosedWithoutTenant = true;

    /**
     * @var array<string, bool>
     */
    private static array $tenantColumnCache = [];

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

        $query = static::applyTenantScope($query);

        if (!empty(static::$defaultEagerLoad)) {
            $query->with(static::$defaultEagerLoad);
        }

        if (!empty(static::$defaultWithCount)) {
            $query->withCount(static::$defaultWithCount);
        }

        return $query;
    }

    protected static function applyTenantScope(Builder $query): Builder
    {
        if (!static::$tenantScoped) {
            return $query;
        }

        $cityId = Tenant::cityId();

        if (!is_string($cityId) || $cityId === '') {
            return static::$failClosedWithoutTenant ? $query->whereRaw('1 = 0') : $query;
        }

        $model = $query->getModel();
        $tenantColumn = static::$tenantColumn;

        if (is_string($tenantColumn) && $tenantColumn !== '' && static::modelHasColumn($model, $tenantColumn)) {
            return $query->where($model->getTable() . '.' . $tenantColumn, $cityId);
        }

        if (empty(static::$tenantRelationScopes)) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where(function (Builder $tenantQuery) use ($cityId): void {
            foreach (array_values(static::$tenantRelationScopes) as $index => $relationPath) {
                $method = $index === 0 ? 'whereHas' : 'orWhereHas';
                $tenantQuery->{$method}($relationPath, function (Builder $relationQuery) use ($cityId): void {
                    $relationQuery->where('city_id', $cityId);
                });
            }
        });
    }

    protected static function modelHasColumn(Model $model, string $column): bool
    {
        $cacheKey = get_class($model) . ':' . $column;

        if (!array_key_exists($cacheKey, self::$tenantColumnCache)) {
            self::$tenantColumnCache[$cacheKey] = Schema::hasColumn($model->getTable(), $column);
        }

        return self::$tenantColumnCache[$cacheKey];
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
