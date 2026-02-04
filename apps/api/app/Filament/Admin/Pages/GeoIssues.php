<?php

declare(strict_types=1);

namespace App\Filament\Admin\Pages;

use App\Domains\Reports\Enums\LocationQuality;
use App\Domains\Reports\Models\CitizenReport;
use App\Filament\Admin\Resources\CitizenReportResource;
use Filament\Pages\Page;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Tables\Actions\Action;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Concerns\InteractsWithTable;
use Filament\Tables\Contracts\HasTable;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class GeoIssues extends Page implements HasTable
{
    use InteractsWithTable;

    protected static ?string $navigationIcon = 'heroicon-o-globe-alt';

    protected static ?string $navigationLabel = 'Problemas de Localização';

    protected static ?string $navigationGroup = 'Modera??o';

    protected static ?int $navigationSort = 8;

    protected static string $view = 'filament.admin.pages.geo-issues';

    public static function canAccess(): bool
    {
        return auth()->user()?->can('page_GeoIssues') ?? false;
    }

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

    protected function table(Table $table): Table
    {
        return $table->deferLoading();
    }

    protected function getTableColumns(): array
    {
        return [
            TextColumn::make('protocol')
                ->label('Protocolo')
                ->searchable()
                ->sortable(),
            TextColumn::make('title')
                ->label('T?tulo')
                ->limit(40)
                ->searchable(),
            TextColumn::make('category.name')
                ->label('Categoria')
                ->toggleable(),
            TextColumn::make('bairro.nome')
                ->label('Bairro')
                ->searchable()
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
                ->label('Endere?o')
                ->limit(40)
                ->searchable()
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
            Action::make('openMap')
                ->label('Abrir mapa')
                ->icon('heroicon-o-map')
                ->url(function (CitizenReport $record): ?string {
                    if (filled($record->latitude) && filled($record->longitude)) {
                        return sprintf(
                            'https://www.google.com/maps/search/?api=1&query=%s,%s',
                            $record->latitude,
                            $record->longitude
                        );
                    }

                    if (filled($record->address_text)) {
                        return 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode($record->address_text);
                    }

                    return null;
                })
                ->openUrlInNewTab()
                ->visible(fn (CitizenReport $record): bool => filled($record->latitude) || filled($record->address_text)),
            Action::make('setQuality')
                ->label('Ajustar qualidade')
                ->icon('heroicon-o-adjustments-horizontal')
                ->form([
                    Select::make('location_quality')
                        ->label('Qualidade')
                        ->options(collect(LocationQuality::cases())
                            ->mapWithKeys(fn (LocationQuality $quality) => [$quality->value => $quality->label()])
                            ->toArray())
                        ->required()
                        ->default(fn (CitizenReport $record): ?string => $record->location_quality?->value),
                ])
                ->action(function (CitizenReport $record, array $data): void {
                    $previous = $record->location_quality?->value;
                    $record->location_quality = LocationQuality::from($data['location_quality']);
                    $record->save();

                    activity()
                        ->causedBy(auth()->user())
                        ->performedOn($record)
                        ->withProperties([
                            'old' => $previous,
                            'new' => $data['location_quality'],
                        ])
                        ->log('citizen_report_location_quality_updated');
                })
                ->visible(fn (): bool => auth()->user()?->hasAnyRole(['admin', 'moderator']) ?? false),
            Action::make('fixLocation')
                ->label('Corrigir localizacao')
                ->icon('heroicon-o-pencil-square')
                ->form([
                    TextInput::make('address_text')
                        ->label('Endere?o')
                        ->maxLength(500)
                        ->default(fn (CitizenReport $record): ?string => $record->address_text),
                    TextInput::make('latitude')
                        ->label('Latitude')
                        ->numeric()
                        ->default(fn (CitizenReport $record): ?string => $record->latitude),
                    TextInput::make('longitude')
                        ->label('Longitude')
                        ->numeric()
                        ->default(fn (CitizenReport $record): ?string => $record->longitude),
                    TextInput::make('location_accuracy_m')
                        ->label('Precis?o (m)')
                        ->numeric()
                        ->default(fn (CitizenReport $record): ?string => $record->location_accuracy_m),
                    Select::make('location_quality')
                        ->label('Qualidade')
                        ->options(collect(LocationQuality::cases())
                            ->mapWithKeys(fn (LocationQuality $quality) => [$quality->value => $quality->label()])
                            ->toArray())
                        ->required()
                        ->default(fn (CitizenReport $record): ?string => $record->location_quality?->value),
                ])
                ->action(function (CitizenReport $record, array $data): void {
                    $before = $record->only([
                        'address_text',
                        'latitude',
                        'longitude',
                        'location_accuracy_m',
                        'location_quality',
                    ]);

                    $record->fill([
                        'address_text' => $data['address_text'] ?? null,
                        'latitude' => $data['latitude'] ?? null,
                        'longitude' => $data['longitude'] ?? null,
                        'location_accuracy_m' => $data['location_accuracy_m'] ?? null,
                        'location_quality' => $data['location_quality'] ?? $record->location_quality?->value,
                    ]);
                    $record->save();

                    $after = $record->only([
                        'address_text',
                        'latitude',
                        'longitude',
                        'location_accuracy_m',
                        'location_quality',
                    ]);

                    activity()
                        ->causedBy(auth()->user())
                        ->performedOn($record)
                        ->withProperties([
                            'old' => $before,
                            'new' => $after,
                        ])
                        ->log('citizen_report_location_updated');
                })
                ->visible(fn (): bool => auth()->user()?->hasAnyRole(['admin', 'moderator']) ?? false),
        ];
    }
}
