<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\VereadorResource\RelationManagers;

use App\Domains\Votes\Models\Mandato;
use Filament\Forms;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Database\Eloquent\Builder;

class MandatosRelationManager extends RelationManager
{
    protected static string $relationship = 'mandatos';

    protected static ?string $title = 'Mandatos';

    public function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Mandato')
                    ->columns(2)
                    ->schema([
                        Select::make('partido_id')
                            ->label('Partido')
                            ->relationship('partido', 'sigla')
                            ->getOptionLabelFromRecordUsing(fn ($record) => "{$record->sigla} - {$record->nome}")
                            ->searchable()
                            ->preload()
                            ->required(),
                        Select::make('legislatura_id')
                            ->label('Legislatura')
                            ->relationship('legislatura', 'numero')
                            ->getOptionLabelFromRecordUsing(fn ($record) => $record->nome_completo)
                            ->searchable()
                            ->preload()
                            ->required(),
                        TextInput::make('cargo')
                            ->label('Cargo')
                            ->maxLength(150),
                        DatePicker::make('inicio')
                            ->label('Inicio'),
                        DatePicker::make('fim')
                            ->label('Fim'),
                        Toggle::make('em_exercicio')
                            ->label('Em exercicio')
                            ->default(false),
                        Textarea::make('observacoes')
                            ->label('Observacoes')
                            ->rows(3)
                            ->columnSpanFull(),
                    ]),
            ]);
    }

    public function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->modifyQueryUsing(fn (Builder $query): Builder => $query->with(['partido', 'legislatura']))
            ->columns([
                TextColumn::make('legislatura.nome_completo')
                    ->label('Legislatura')
                    ->toggleable(),
                TextColumn::make('partido.sigla')
                    ->label('Partido')
                    ->sortable(),
                TextColumn::make('cargo')
                    ->label('Cargo')
                    ->toggleable(),
                TextColumn::make('inicio')
                    ->label('Inicio')
                    ->date('d/m/Y')
                    ->sortable(),
                TextColumn::make('fim')
                    ->label('Fim')
                    ->date('d/m/Y')
                    ->toggleable(),
                IconColumn::make('em_exercicio')
                    ->label('Em exercicio')
                    ->boolean()
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('em_exercicio')
                    ->label('Em exercicio')
                    ->options([
                        1 => 'Sim',
                        0 => 'Nao',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make()
                    ->requiresConfirmation()
                    ->visible(fn (): bool => auth()->user()?->hasRole('admin') ?? false),
                Tables\Actions\DeleteAction::make()
                    ->requiresConfirmation()
                    ->visible(fn (): bool => auth()->user()?->hasRole('admin') ?? false),
            ])
            ->headerActions([
                Tables\Actions\CreateAction::make()
                    ->visible(fn (): bool => auth()->user()?->hasRole('admin') ?? false),
            ])
            ->defaultSort('em_exercicio', 'desc');
    }
}
