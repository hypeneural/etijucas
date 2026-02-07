<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\ModuleResource\Pages;
use App\Models\Module;
use Filament\Forms;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Tables;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

class ModuleResource extends BaseResource
{
    protected static ?string $model = Module::class;

    protected static ?string $navigationGroup = 'Sistema & Auditoria';

    protected static ?string $navigationIcon = 'heroicon-o-puzzle-piece';

    protected static ?string $navigationLabel = 'Catalogo de Modulos';

    protected static ?int $navigationSort = 72;

    protected static array $defaultWithCount = ['cityModules'];

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Modulo')
                    ->columns(2)
                    ->schema([
                        TextInput::make('module_key')
                            ->label('Module Key')
                            ->required()
                            ->maxLength(50)
                            ->unique(ignoreRecord: true)
                            ->helperText('Chave tecnica imutavel.'),
                        TextInput::make('slug')
                            ->label('Slug')
                            ->required()
                            ->maxLength(80),
                        TextInput::make('route_slug_ptbr')
                            ->label('Slug de rota PT-BR')
                            ->maxLength(80),
                        TextInput::make('name')
                            ->label('Nome tecnico')
                            ->required()
                            ->maxLength(100),
                        TextInput::make('name_ptbr')
                            ->label('Nome exibicao')
                            ->maxLength(100),
                        TextInput::make('icon')
                            ->label('Icone')
                            ->maxLength(120),
                        TextInput::make('current_version')
                            ->label('Versao atual')
                            ->numeric()
                            ->default(1)
                            ->required(),
                        TextInput::make('sort_order')
                            ->label('Ordem')
                            ->numeric()
                            ->default(0),
                        Toggle::make('is_core')
                            ->label('Core')
                            ->default(false),
                    ]),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('module_key')
                    ->label('Key')
                    ->searchable()
                    ->sortable()
                    ->copyable(),
                TextColumn::make('name_ptbr')
                    ->label('Nome')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('route_slug_ptbr')
                    ->label('Rota PT-BR')
                    ->toggleable(),
                IconColumn::make('is_core')
                    ->label('Core')
                    ->boolean()
                    ->sortable(),
                TextColumn::make('current_version')
                    ->label('Versao')
                    ->sortable(),
                TextColumn::make('city_modules_count')
                    ->label('Cidades')
                    ->sortable(),
                ...static::baseTableColumns(),
            ])
            ->filters([
                SelectFilter::make('is_core')
                    ->label('Core')
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
            'index' => Pages\ListModules::route('/'),
            'create' => Pages\CreateModule::route('/create'),
            'edit' => Pages\EditModule::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return auth()->user()?->hasRole('admin') ?? false;
    }
}
