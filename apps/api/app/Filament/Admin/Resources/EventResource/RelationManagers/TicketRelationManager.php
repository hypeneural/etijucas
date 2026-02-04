<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\EventResource\RelationManagers;

use App\Domain\Events\Enums\TicketType;
use Filament\Forms;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Columns\TextColumn;

class TicketRelationManager extends RelationManager
{
    protected static string $relationship = 'ticket';

    protected static ?string $title = 'Ingresso';

    public function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Ingresso')
                    ->columns(2)
                    ->schema([
                        Select::make('ticket_type')
                            ->label('Tipo')
                            ->options(collect(TicketType::cases())
                                ->mapWithKeys(fn (TicketType $type) => [$type->value => $type->label()])
                                ->toArray())
                            ->required(),
                        TextInput::make('currency')
                            ->label('Moeda')
                            ->maxLength(10)
                            ->default('BRL'),
                        TextInput::make('min_price')
                            ->label('Preco minimo')
                            ->numeric()
                            ->nullable(),
                        TextInput::make('max_price')
                            ->label('Preco maximo')
                            ->numeric()
                            ->nullable(),
                        TextInput::make('purchase_url')
                            ->label('Link de compra')
                            ->url()
                            ->maxLength(500),
                        Textarea::make('purchase_info')
                            ->label('Info de compra')
                            ->rows(3)
                            ->columnSpanFull(),
                    ]),
                Section::make('Lotes')
                    ->schema([
                        Repeater::make('lots')
                            ->label('Lotes')
                            ->relationship('lots')
                            ->orderable('display_order')
                            ->columns(3)
                            ->schema([
                                TextInput::make('name')
                                    ->label('Nome')
                                    ->required()
                                    ->maxLength(120),
                                TextInput::make('price')
                                    ->label('Preco')
                                    ->numeric()
                                    ->required(),
                                TextInput::make('quantity_total')
                                    ->label('Qtd total')
                                    ->numeric()
                                    ->nullable(),
                                TextInput::make('quantity_sold')
                                    ->label('Qtd vendida')
                                    ->numeric()
                                    ->disabled()
                                    ->dehydrated(false),
                                DateTimePicker::make('available_from')
                                    ->label('Disponivel de'),
                                DateTimePicker::make('available_until')
                                    ->label('Disponivel ate'),
                                Toggle::make('is_active')
                                    ->label('Ativo')
                                    ->default(true),
                                TextInput::make('display_order')
                                    ->label('Ordem')
                                    ->numeric()
                                    ->default(0),
                            ]),
                    ]),
            ]);
    }

    public function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('ticket_type')
                    ->label('Tipo')
                    ->badge()
                    ->formatStateUsing(fn (TicketType $state): string => $state->label()),
                TextColumn::make('price_range')
                    ->label('Preco')
                    ->toggleable(),
                TextColumn::make('min_price')
                    ->label('Min')
                    ->toggleable(),
                TextColumn::make('max_price')
                    ->label('Max')
                    ->toggleable(),
                TextColumn::make('currency')
                    ->label('Moeda')
                    ->toggleable(),
                TextColumn::make('purchase_url')
                    ->label('Compra')
                    ->limit(30)
                    ->toggleable(),
            ])
            ->filters([
                //
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->headerActions([
                Tables\Actions\CreateAction::make(),
            ]);
    }
}
