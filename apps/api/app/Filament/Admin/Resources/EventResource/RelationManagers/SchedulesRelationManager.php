<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\EventResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TimePicker;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Columns\TextColumn;

class SchedulesRelationManager extends RelationManager
{
    protected static string $relationship = 'schedules';

    protected static ?string $title = 'Programacao';

    public function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Agenda')
                    ->columns(2)
                    ->schema([
                        DatePicker::make('date')
                            ->label('Data')
                            ->required(),
                        TimePicker::make('time')
                            ->label('Horario')
                            ->required(),
                        TextInput::make('title')
                            ->label('Titulo')
                            ->required()
                            ->maxLength(160),
                        TextInput::make('stage')
                            ->label('Palco')
                            ->maxLength(120),
                        TextInput::make('performer')
                            ->label('Atração')
                            ->maxLength(120),
                        Select::make('event_day_id')
                            ->label('Dia do evento')
                            ->relationship('eventDay', 'day_number')
                            ->searchable()
                            ->preload(),
                        TextInput::make('display_order')
                            ->label('Ordem')
                            ->numeric()
                            ->default(0),
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
                TextColumn::make('date')
                    ->label('Data')
                    ->date('d/m/Y')
                    ->sortable(),
                TextColumn::make('time')
                    ->label('Horario')
                    ->time('H:i')
                    ->sortable(),
                TextColumn::make('title')
                    ->label('Titulo')
                    ->searchable()
                    ->limit(30),
                TextColumn::make('stage')
                    ->label('Palco')
                    ->toggleable(),
                TextColumn::make('performer')
                    ->label('Atração')
                    ->toggleable(),
                TextColumn::make('display_order')
                    ->label('Ordem')
                    ->sortable()
                    ->toggleable(),
            ])
            ->defaultSort('date', 'asc')
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
