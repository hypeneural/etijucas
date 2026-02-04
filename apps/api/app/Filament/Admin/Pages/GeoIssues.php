<?php

declare(strict_types=1);

namespace App\Filament\Admin\Pages;

use App\Domains\Reports\Enums\LocationQuality;
use App\Domains\Reports\Models\CitizenReport;
use App\Filament\Admin\Resources\CitizenReportResource;
use Filament\Pages\Page;
use Filament\Tables\Actions\Action;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Concerns\InteractsWithTable;
use Filament\Tables\Contracts\HasTable;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Database\Eloquent\Builder;

class GeoIssues extends Page implements HasTable
{
    use InteractsWithTable;

    protected static ?string $navigationIcon = 'heroicon-o-globe-alt';

    protected static ?string $navigationLabel = 'Geo Issues';

    protected static ?string $navigationGroup = 'Moderacao';

    protected static ?int $navigationSort = 8;

    protected static string $view = 'filament.admin.pages.geo-issues';

    protected function getTableQuery(): Builder
    {
        return CitizenReport::query()
            ->with(['category', 'bairro'])
            ->where(function (Builder $query): void {
                $query
                    ->whereNull('latitude')
                    ->orWhereNull('longitude')
                    ->orWhereIn('location_quality', [
                        LocationQuality::Manual->value,
                        LocationQuality::Aproximada->value,
                    ]);
            })
            ->latest();
    }

    protected function getTableColumns(): array
    {
        return [
            TextColumn::make('protocol')
                ->label('Protocolo')
                ->searchable()
                ->sortable(),
            TextColumn::make('title')
                ->label('Titulo')
                ->limit(40)
                ->searchable(),
            TextColumn::make('category.name')
                ->label('Categoria')
                ->toggleable(),
            TextColumn::make('bairro.nome')
                ->label('Bairro')
                ->toggleable(),
            TextColumn::make('location_quality')
                ->label('Qualidade')
                ->badge()
                ->formatStateUsing(fn (LocationQuality $state): string => $state->label())
                ->color(fn (LocationQuality $state): string => match ($state) {
                    LocationQuality::Precisa => 'success',
                    LocationQuality::Aproximada => 'warning',
                    LocationQuality::Manual => 'gray',
                }),
            TextColumn::make('address_text')
                ->label('Endereco')
                ->limit(40)
                ->toggleable(),
            TextColumn::make('created_at')
                ->label('Criado em')
                ->dateTime('d/m/Y H:i')
                ->sortable(),
        ];
    }

    protected function getTableFilters(): array
    {
        return [
            SelectFilter::make('location_quality')
                ->label('Qualidade')
                ->options(collect(LocationQuality::cases())
                    ->mapWithKeys(fn (LocationQuality $quality) => [$quality->value => $quality->label()])
                    ->toArray()),
        ];
    }

    protected function getTableActions(): array
    {
        return [
            Action::make('open')
                ->label('Abrir')
                ->icon('heroicon-o-arrow-top-right-on-square')
                ->url(fn (CitizenReport $record) => CitizenReportResource::getUrl('edit', ['record' => $record]))
                ->openUrlInNewTab(),
        ];
    }
}
