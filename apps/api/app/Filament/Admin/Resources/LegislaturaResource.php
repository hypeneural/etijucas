<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domains\Votes\Models\Legislatura;
use App\Filament\Admin\Resources\LegislaturaResource\Pages;
use Filament\Forms;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Tables;
use Filament\Tables\Actions\DeleteAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Actions\ViewAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

class LegislaturaResource extends BaseResource
{
    protected static ?string $model = Legislatura::class;

    protected static ?string $navigationGroup = 'Votacoes';

    protected static ?string $navigationIcon = 'heroicon-o-document-text';

    protected static ?string $navigationLabel = 'Legislaturas';

    protected static ?string $modelLabel = 'Legislatura';

    protected static ?string $pluralModelLabel = 'Legislaturas';

    protected static ?int $navigationSort = 16;

    protected static array $defaultWithCount = ['mandatos'];

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Legislatura')
                    ->columns(2)
                    ->schema([
                        TextInput::make('numero')
                            ->label('Numero')
                            ->numeric()
                            ->required(),
                        TextInput::make('ano_inicio')
                            ->label('Ano inicio')
                            ->numeric()
                            ->required(),
                        TextInput::make('ano_fim')
                            ->label('Ano fim')
                            ->numeric()
                            ->required(),
                        Toggle::make('atual')
                            ->label('Atual')
                            ->default(false),
                    ]),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('numero')
                    ->label('Numero')
                    ->sortable(),
                TextColumn::make('periodo')
                    ->label('Periodo')
                    ->toggleable(),
                IconColumn::make('atual')
                    ->label('Atual')
                    ->boolean()
                    ->sortable(),
                TextColumn::make('mandatos_count')
                    ->label('Mandatos')
                    ->alignCenter()
                    ->sortable(),
                ...static::baseTableColumns(),
            ])
            ->filters([
                SelectFilter::make('atual')
                    ->label('Atual')
                    ->options([
                        1 => 'Sim',
                        0 => 'Nao',
                    ]),
                ...static::baseTableFilters(),
            ])
            ->actions([
                ViewAction::make(),
                EditAction::make()->requiresConfirmation(),
                DeleteAction::make()
                    ->requiresConfirmation()
                    ->visible(fn (): bool => auth()->user()?->hasRole('admin') ?? false),
            ])
            ->defaultSort('numero', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListLegislaturas::route('/'),
            'create' => Pages\CreateLegislatura::route('/create'),
            'edit' => Pages\EditLegislatura::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return auth()->user()?->hasRole('admin') ?? false;
    }
}
