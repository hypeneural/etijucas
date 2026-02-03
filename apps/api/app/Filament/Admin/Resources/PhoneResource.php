<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domain\Content\Enums\PhoneCategory;
use App\Filament\Admin\Resources\PhoneResource\Pages;
use App\Models\Phone;
use Filament\Forms;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Actions\DeleteAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

class PhoneResource extends Resource
{
    protected static ?string $model = Phone::class;

    protected static ?string $navigationGroup = 'Conteudo';

    protected static ?string $navigationIcon = 'heroicon-o-phone';

    protected static ?int $navigationSort = 40;

    protected static ?string $navigationLabel = 'Telefones Uteis';

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Telefone util')
                    ->columns(2)
                    ->schema([
                        Select::make('category')
                            ->label('Categoria')
                            ->options(collect(PhoneCategory::cases())
                                ->mapWithKeys(fn (PhoneCategory $category) => [$category->value => $category->label()])
                                ->toArray())
                            ->required(),
                        TextInput::make('name')
                            ->label('Nome')
                            ->required()
                            ->maxLength(150),
                        TextInput::make('number')
                            ->label('Numero')
                            ->required()
                            ->maxLength(40),
                        TextInput::make('address')
                            ->label('Endereco')
                            ->maxLength(255),
                        TextInput::make('hours')
                            ->label('Horario')
                            ->maxLength(120),
                        Toggle::make('whatsapp')
                            ->label('WhatsApp')
                            ->default(false),
                        Toggle::make('is_emergency')
                            ->label('Emergencia')
                            ->default(false),
                        Toggle::make('is_pinned')
                            ->label('Destaque')
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
                TextColumn::make('category')
                    ->label('Categoria')
                    ->formatStateUsing(fn ($state) => $state?->label() ?? $state)
                    ->toggleable(),
                TextColumn::make('number')
                    ->label('Numero')
                    ->toggleable(),
                IconColumn::make('whatsapp')
                    ->label('WhatsApp')
                    ->boolean(),
                IconColumn::make('is_emergency')
                    ->label('Emergencia')
                    ->boolean(),
                IconColumn::make('is_pinned')
                    ->label('Destaque')
                    ->boolean(),
            ])
            ->filters([
                SelectFilter::make('category')
                    ->label('Categoria')
                    ->options(collect(PhoneCategory::cases())
                        ->mapWithKeys(fn (PhoneCategory $category) => [$category->value => $category->label()])
                        ->toArray()),
                SelectFilter::make('is_emergency')
                    ->label('Emergencia')
                    ->options([
                        1 => 'Sim',
                        0 => 'Nao',
                    ]),
                SelectFilter::make('is_pinned')
                    ->label('Destaque')
                    ->options([
                        1 => 'Sim',
                        0 => 'Nao',
                    ]),
            ])
            ->actions([
                EditAction::make(),
                DeleteAction::make()
                    ->visible(fn () => auth()->user()?->hasRole('admin') ?? false),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPhones::route('/'),
            'create' => Pages\CreatePhone::route('/create'),
            'edit' => Pages\EditPhone::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return auth()->user()?->hasRole('admin') ?? false;
    }
}
