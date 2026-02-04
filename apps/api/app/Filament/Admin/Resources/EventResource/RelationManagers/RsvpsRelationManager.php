<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\EventResource\RelationManagers;

use App\Domain\Events\Enums\RsvpStatus;
use Filament\Forms;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;

class RsvpsRelationManager extends RelationManager
{
    protected static string $relationship = 'rsvps';

    protected static ?string $title = 'RSVPs';

    public function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('RSVP')
                    ->columns(2)
                    ->schema([
                        Select::make('user_id')
                            ->label('Usuario')
                            ->relationship('user', 'nome')
                            ->searchable()
                            ->preload()
                            ->disabled()
                            ->dehydrated(false),
                        Select::make('status')
                            ->label('Status')
                            ->options(collect(RsvpStatus::cases())
                                ->mapWithKeys(fn (RsvpStatus $status) => [$status->value => $status->label()])
                                ->toArray())
                            ->required(),
                        TextInput::make('guests_count')
                            ->label('Convidados')
                            ->numeric()
                            ->default(1),
                        Toggle::make('notified')
                            ->label('Notificado')
                            ->default(false),
                        Textarea::make('notes')
                            ->label('Notas')
                            ->rows(3)
                            ->columnSpanFull(),
                    ]),
            ]);
    }

    public function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('user.nome')
                    ->label('Usuario')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->formatStateUsing(fn (RsvpStatus $state): string => $state->label())
                    ->color(fn (RsvpStatus $state): string => match ($state) {
                        RsvpStatus::Going => 'success',
                        RsvpStatus::Maybe => 'warning',
                        RsvpStatus::NotGoing => 'danger',
                    }),
                TextColumn::make('guests_count')
                    ->label('Convidados')
                    ->sortable()
                    ->alignCenter(),
                IconColumn::make('notified')
                    ->label('Notificado')
                    ->boolean()
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
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make()
                    ->requiresConfirmation()
                    ->visible(fn (): bool => auth()->user()?->hasRole('admin') ?? false),
            ]);
    }
}
