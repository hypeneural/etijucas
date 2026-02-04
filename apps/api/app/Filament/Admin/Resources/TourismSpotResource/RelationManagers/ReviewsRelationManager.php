<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\TourismSpotResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Columns\TextColumn;

class ReviewsRelationManager extends RelationManager
{
    protected static string $relationship = 'reviews';

    protected static ?string $title = 'Reviews';

    public function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Review')
                    ->columns(2)
                    ->schema([
                        Select::make('user_id')
                            ->label('Usu?rio')
                            ->relationship('user', 'nome')
                            ->searchable()
                            ->preload()
                            ->required(),
                        TextInput::make('rating')
                            ->label('Nota')
                            ->numeric()
                            ->required(),
                        TextInput::make('titulo')
                            ->label('T?tulo')
                            ->maxLength(200),
                        DatePicker::make('visit_date')
                            ->label('Data da visita'),
                        Textarea::make('texto')
                            ->label('Texto')
                            ->rows(4)
                            ->columnSpanFull(),
                    ]),
            ]);
    }

    public function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('user.nome')
                    ->label('Usu?rio')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('rating')
                    ->label('Nota')
                    ->sortable(),
                TextColumn::make('titulo')
                    ->label('T?tulo')
                    ->limit(40)
                    ->toggleable(),
                TextColumn::make('created_at')
                    ->label('Criado em')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                //
            ])
            ->actions([
                Tables\Actions\CreateAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ]);
    }
}
