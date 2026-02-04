<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\EventResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TimePicker;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Columns\TextColumn;

class DaysRelationManager extends RelationManager
{
    protected static string $relationship = 'days';

    protected static ?string $title = 'Dias';

    public function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Dia')
                    ->columns(2)
                    ->schema([
                        TextInput::make('day_number')
                            ->label('Dia')
                            ->numeric()
                            ->required(),
                        DatePicker::make('date')
                            ->label('Data')
                            ->required(),
                        TextInput::make('title')
                            ->label('Titulo')
                            ->maxLength(150),
                        TimePicker::make('start_time')
                            ->label('Inicio')
                            ->required(),
                        TimePicker::make('end_time')
                            ->label('Fim'),
                        TextInput::make('cover_image_url')
                            ->label('Capa URL')
                            ->url()
                            ->maxLength(500),
                        Textarea::make('description')
                            ->label('Descricao')
                            ->rows(3)
                            ->columnSpanFull(),
                    ]),
            ]);
    }

    public function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('day_number')
                    ->label('Dia')
                    ->sortable(),
                TextColumn::make('date')
                    ->label('Data')
                    ->date('d/m/Y')
                    ->sortable(),
                TextColumn::make('title')
                    ->label('Titulo')
                    ->limit(30)
                    ->toggleable(),
                TextColumn::make('start_time')
                    ->label('Inicio')
                    ->time('H:i')
                    ->toggleable(),
                TextColumn::make('end_time')
                    ->label('Fim')
                    ->time('H:i')
                    ->toggleable(),
            ])
            ->defaultSort('day_number', 'asc')
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
