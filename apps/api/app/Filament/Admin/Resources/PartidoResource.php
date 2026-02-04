<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domains\Votes\Models\Partido;
use App\Filament\Admin\Resources\PartidoResource\Pages;
use Filament\Forms;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Tables;
use Filament\Tables\Actions\DeleteAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Actions\ViewAction;
use Filament\Tables\Columns\ColorColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;

class PartidoResource extends BaseResource
{
    protected static ?string $model = Partido::class;

    protected static ?string $navigationGroup = 'Votacoes';

    protected static ?string $navigationIcon = 'heroicon-o-flag';

    protected static ?string $navigationLabel = 'Partidos';

    protected static ?string $modelLabel = 'Partido';

    protected static ?string $pluralModelLabel = 'Partidos';

    protected static ?int $navigationSort = 15;

    protected static array $defaultWithCount = ['mandatos'];

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Partido')
                    ->columns(2)
                    ->schema([
                        TextInput::make('sigla')
                            ->label('Sigla')
                            ->required()
                            ->maxLength(20)
                            ->unique(ignoreRecord: true),
                        TextInput::make('nome')
                            ->label('Nome')
                            ->required()
                            ->maxLength(200),
                        TextInput::make('cor_hex')
                            ->label('Cor (HEX)')
                            ->maxLength(7)
                            ->helperText('Ex: #0055FF'),
                        TextInput::make('logo_url')
                            ->label('Logo URL')
                            ->url()
                            ->maxLength(500),
                    ]),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                ImageColumn::make('logo_url')
                    ->label('Logo')
                    ->circular()
                    ->size(28)
                    ->toggleable(),
                TextColumn::make('sigla')
                    ->label('Sigla')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('nome')
                    ->label('Nome')
                    ->searchable()
                    ->sortable(),
                ColorColumn::make('cor_hex')
                    ->label('Cor')
                    ->toggleable(),
                TextColumn::make('cor_hex')
                    ->label('Hex')
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('mandatos_count')
                    ->label('Mandatos')
                    ->alignCenter()
                    ->sortable(),
                ...static::baseTableColumns(),
            ])
            ->filters([
                ...static::baseTableFilters(),
            ])
            ->actions([
                ViewAction::make(),
                EditAction::make()->requiresConfirmation(),
                DeleteAction::make()
                    ->requiresConfirmation()
                    ->visible(fn (): bool => auth()->user()?->hasRole('admin') ?? false),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPartidos::route('/'),
            'create' => Pages\CreatePartido::route('/create'),
            'edit' => Pages\EditPartido::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return auth()->user()?->hasRole('admin') ?? false;
    }
}
