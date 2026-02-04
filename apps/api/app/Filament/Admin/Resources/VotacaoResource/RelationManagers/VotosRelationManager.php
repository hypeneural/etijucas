<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\VotacaoResource\RelationManagers;

use App\Domains\Votes\Enums\TipoVoto;
use App\Domains\Votes\Models\VotoRegistro;
use Filament\Forms;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

class VotosRelationManager extends RelationManager
{
    protected static string $relationship = 'votos';

    protected static ?string $title = 'Votos';

    public function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Voto')
                    ->columns(2)
                    ->schema([
                        Select::make('vereador_id')
                            ->label('Vereador')
                            ->relationship('vereador', 'nome')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Select::make('voto')
                            ->label('Voto')
                            ->options(collect(TipoVoto::cases())
                                ->mapWithKeys(fn (TipoVoto $tipo) => [$tipo->value => $tipo->label()])
                                ->toArray())
                            ->required(),
                        TextInput::make('url_video')
                            ->label('URL do video')
                            ->url()
                            ->maxLength(500),
                        Textarea::make('justificativa')
                            ->label('Justificativa')
                            ->rows(3)
                            ->columnSpanFull(),
                    ]),
            ]);
    }

    public function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('vereador.nome')
                    ->label('Vereador')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('voto')
                    ->label('Voto')
                    ->badge()
                    ->formatStateUsing(fn (TipoVoto $state): string => $state->label())
                    ->color(fn (TipoVoto $state): string => match ($state) {
                        TipoVoto::SIM => 'success',
                        TipoVoto::NAO => 'danger',
                        TipoVoto::ABSTENCAO => 'warning',
                        TipoVoto::NAO_VOTOU => 'gray',
                    }),
                TextColumn::make('justificativa')
                    ->label('Justificativa')
                    ->limit(40)
                    ->toggleable(),
                TextColumn::make('url_video')
                    ->label('Video')
                    ->limit(30)
                    ->toggleable(),
                TextColumn::make('created_at')
                    ->label('Criado em')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('voto')
                    ->label('Voto')
                    ->options(collect(TipoVoto::cases())
                        ->mapWithKeys(fn (TipoVoto $tipo) => [$tipo->value => $tipo->label()])
                        ->toArray()),
            ])
            ->actions([
                Tables\Actions\CreateAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ]);
    }
}
