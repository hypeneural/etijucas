<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\CityDomainResource\Pages;
use App\Models\CityDomain;
use Filament\Forms;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Tables;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

class CityDomainResource extends BaseResource
{
    protected static ?string $model = CityDomain::class;

    protected static ?string $navigationGroup = 'Sistema & Auditoria';

    protected static ?string $navigationIcon = 'heroicon-o-globe-alt';

    protected static ?string $navigationLabel = 'Dominios por Cidade';

    protected static ?int $navigationSort = 71;

    protected static array $defaultEagerLoad = ['city'];

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Dominio')
                    ->columns(2)
                    ->schema([
                        Select::make('city_id')
                            ->label('Cidade')
                            ->relationship('city', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        TextInput::make('domain')
                            ->label('Dominio')
                            ->required()
                            ->maxLength(255)
                            ->dehydrateStateUsing(function (string $state): string {
                                $normalized = strtolower(trim($state));
                                $normalized = preg_replace('#^https?://#', '', $normalized) ?? $normalized;

                                return rtrim($normalized, '/');
                            })
                            ->unique(ignoreRecord: true),
                        Toggle::make('is_primary')
                            ->label('Principal')
                            ->default(false),
                        Toggle::make('is_canonical')
                            ->label('Canonical SEO')
                            ->default(false),
                        TextInput::make('redirect_to')
                            ->label('Redirecionar para')
                            ->maxLength(255)
                            ->columnSpanFull(),
                    ]),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('city.name')
                    ->label('Cidade')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('domain')
                    ->label('Dominio')
                    ->searchable()
                    ->copyable(),
                IconColumn::make('is_primary')
                    ->label('Principal')
                    ->boolean()
                    ->sortable(),
                IconColumn::make('is_canonical')
                    ->label('Canonical')
                    ->boolean()
                    ->sortable(),
                TextColumn::make('redirect_to')
                    ->label('Redirect')
                    ->limit(40)
                    ->toggleable(),
                ...static::baseTableColumns(),
            ])
            ->filters([
                SelectFilter::make('city_id')
                    ->label('Cidade')
                    ->relationship('city', 'name')
                    ->preload(),
                SelectFilter::make('is_primary')
                    ->label('Principal')
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
            'index' => Pages\ListCityDomains::route('/'),
            'create' => Pages\CreateCityDomain::route('/create'),
            'edit' => Pages\EditCityDomain::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return auth()->user()?->hasRole('admin') ?? false;
    }
}
