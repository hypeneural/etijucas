<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Enums\CityStatus;
use App\Filament\Admin\Resources\CityResource\Pages;
use App\Models\City;
use Filament\Forms;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Tables;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Support\Str;

class CityResource extends BaseResource
{
    protected static ?string $model = City::class;

    protected static ?string $navigationGroup = 'Sistema & Auditoria';

    protected static ?string $navigationIcon = 'heroicon-o-building-office-2';

    protected static ?string $navigationLabel = 'Cidades';

    protected static ?int $navigationSort = 70;

    protected static array $defaultWithCount = ['domains', 'modules'];

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Cidade')
                    ->columns(2)
                    ->schema([
                        TextInput::make('name')
                            ->label('Nome')
                            ->required()
                            ->maxLength(120)
                            ->live(onBlur: true)
                            ->afterStateUpdated(function (string $state, callable $set): void {
                                $set('slug', Str::slug($state));
                            }),
                        TextInput::make('uf')
                            ->label('UF')
                            ->required()
                            ->length(2)
                            ->dehydrateStateUsing(fn(string $state): string => strtoupper($state)),
                        TextInput::make('slug')
                            ->label('Slug')
                            ->required()
                            ->maxLength(120)
                            ->unique(ignoreRecord: true),
                        TextInput::make('ibge_code')
                            ->label('IBGE')
                            ->numeric()
                            ->required(),
                        Select::make('status')
                            ->label('Status')
                            ->options(
                                collect(CityStatus::cases())->mapWithKeys(
                                    fn(CityStatus $status) => [$status->value => $status->label()]
                                )->toArray()
                            )
                            ->required(),
                        Toggle::make('active')
                            ->label('Ativa')
                            ->default(true),
                        Toggle::make('is_capital')
                            ->label('Capital')
                            ->default(false),
                    ]),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->label('Nome')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('uf')
                    ->label('UF')
                    ->sortable(),
                TextColumn::make('slug')
                    ->label('Slug')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->formatStateUsing(fn(CityStatus $state): string => $state->label())
                    ->color(fn(CityStatus $state): string => $state->color()),
                IconColumn::make('active')
                    ->label('Ativa')
                    ->boolean()
                    ->sortable(),
                TextColumn::make('domains_count')
                    ->label('Dominios')
                    ->sortable(),
                TextColumn::make('modules_count')
                    ->label('Modulos')
                    ->sortable(),
                ...static::baseTableColumns(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Status')
                    ->options(
                        collect(CityStatus::cases())->mapWithKeys(
                            fn(CityStatus $status) => [$status->value => $status->label()]
                        )->toArray()
                    ),
                SelectFilter::make('active')
                    ->label('Ativa')
                    ->options([
                        1 => 'Sim',
                        0 => 'Nao',
                    ]),
                ...static::baseTableFilters(),
            ])
            ->actions([
                ...static::baseTableActions(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListCities::route('/'),
            'create' => Pages\CreateCity::route('/create'),
            'edit' => Pages\EditCity::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return auth()->user()?->hasRole('admin') ?? false;
    }
}
