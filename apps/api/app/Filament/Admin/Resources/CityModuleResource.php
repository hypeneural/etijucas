<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\CityModuleResource\Pages;
use App\Models\CityModule;
use Filament\Forms;
use Filament\Forms\Components\KeyValue;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Tables;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

class CityModuleResource extends BaseResource
{
    protected static ?string $model = CityModule::class;

    protected static ?string $navigationGroup = 'Sistema & Auditoria';

    protected static ?string $navigationIcon = 'heroicon-o-adjustments-horizontal';

    protected static ?string $navigationLabel = 'Modulos por Cidade';

    protected static ?int $navigationSort = 73;

    protected static array $defaultEagerLoad = ['city', 'module'];

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Ativacao de modulo')
                    ->columns(2)
                    ->schema([
                        Select::make('city_id')
                            ->label('Cidade')
                            ->relationship('city', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Select::make('module_id')
                            ->label('Modulo')
                            ->relationship('module', 'module_key')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Toggle::make('enabled')
                            ->label('Habilitado')
                            ->default(true),
                        TextInput::make('version')
                            ->label('Versao')
                            ->numeric()
                            ->default(1)
                            ->required(),
                        KeyValue::make('settings')
                            ->label('Settings')
                            ->keyLabel('Chave')
                            ->valueLabel('Valor')
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
                TextColumn::make('module.module_key')
                    ->label('Modulo')
                    ->searchable()
                    ->sortable(),
                IconColumn::make('enabled')
                    ->label('Ativo')
                    ->boolean()
                    ->sortable(),
                TextColumn::make('version')
                    ->label('Versao')
                    ->sortable(),
                TextColumn::make('settings')
                    ->label('Settings')
                    ->formatStateUsing(fn($state) => is_array($state) ? json_encode($state) : (string) $state)
                    ->limit(50)
                    ->toggleable(),
                ...static::baseTableColumns(),
            ])
            ->filters([
                SelectFilter::make('city_id')
                    ->label('Cidade')
                    ->relationship('city', 'name')
                    ->preload(),
                SelectFilter::make('module_id')
                    ->label('Modulo')
                    ->relationship('module', 'module_key')
                    ->preload(),
                SelectFilter::make('enabled')
                    ->label('Ativo')
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
            'index' => Pages\ListCityModules::route('/'),
            'create' => Pages\CreateCityModule::route('/create'),
            'edit' => Pages\EditCityModule::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return auth()->user()?->hasRole('admin') ?? false;
    }
}
