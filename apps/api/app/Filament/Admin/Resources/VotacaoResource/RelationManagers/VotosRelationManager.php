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
use Illuminate\Database\Eloquent\Builder;

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
            ->modifyQueryUsing(fn (Builder $query): Builder => $query->with('vereador'))
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
            ->defaultSort('vereador.nome', 'asc')
            ->filters([
                SelectFilter::make('vereador_id')
                    ->label('Vereador')
                    ->relationship('vereador', 'nome')
                    ->preload()
                    ->searchable(),
                SelectFilter::make('voto')
                    ->label('Voto')
                    ->options(collect(TipoVoto::cases())
                        ->mapWithKeys(fn (TipoVoto $tipo) => [$tipo->value => $tipo->label()])
                        ->toArray()),
                Tables\Filters\Filter::make('sem_justificativa')
                    ->label('Sem justificativa')
                    ->query(fn (Builder $query): Builder => $query->whereNull('justificativa')),
            ])
            ->actions([
                Tables\Actions\CreateAction::make()
                    ->visible(fn (): bool => auth()->user()?->hasRole('admin') ?? false),
                Tables\Actions\EditAction::make()
                    ->visible(fn (): bool => auth()->user()?->hasRole('admin') ?? false),
                Tables\Actions\DeleteAction::make()
                    ->visible(fn (): bool => auth()->user()?->hasRole('admin') ?? false),
            ])
            ->bulkActions([
                Tables\Actions\BulkAction::make('definir_voto')
                    ->label('Definir voto')
                    ->icon('heroicon-o-check-badge')
                    ->form([
                        Select::make('voto')
                            ->label('Voto')
                            ->options(collect(TipoVoto::cases())
                                ->mapWithKeys(fn (TipoVoto $tipo) => [$tipo->value => $tipo->label()])
                                ->toArray())
                            ->required(),
                        Textarea::make('justificativa')
                            ->label('Justificativa')
                            ->rows(3),
                        TextInput::make('url_video')
                            ->label('URL do video')
                            ->url()
                            ->maxLength(500),
                    ])
                    ->action(function ($records, array $data): void {
                        foreach ($records as $record) {
                            $record->update([
                                'voto' => $data['voto'],
                                'justificativa' => $data['justificativa'] ?? null,
                                'url_video' => $data['url_video'] ?? null,
                            ]);
                        }
                    })
                    ->visible(fn (): bool => auth()->user()?->hasRole('admin') ?? false),
                Tables\Actions\BulkAction::make('marcar_ausente')
                    ->label('Marcar como ausente')
                    ->icon('heroicon-o-minus-circle')
                    ->requiresConfirmation()
                    ->action(function ($records): void {
                        foreach ($records as $record) {
                            $record->update(['voto' => TipoVoto::NAO_VOTOU]);
                        }
                    })
                    ->visible(fn (): bool => auth()->user()?->hasRole('admin') ?? false),
            ]);
    }
}
