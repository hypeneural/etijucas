<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\CitizenReportResource\RelationManagers;

use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Columns\TextColumn;

class MediaRelationManager extends RelationManager
{
    protected static string $relationship = 'media';

    protected static ?string $title = 'M?dias';

    public function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('file_name')
                    ->label('Arquivo')
                    ->limit(40)
                    ->searchable(),
                TextColumn::make('collection_name')
                    ->label('Colecao')
                    ->toggleable(),
                TextColumn::make('size')
                    ->label('Tamanho')
                    ->formatStateUsing(fn ($state) => number_format(((int) $state) / 1024, 1) . ' KB')
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
                Tables\Actions\DeleteAction::make()
                    ->requiresConfirmation()
                    ->visible(fn (): bool => auth()->user()?->hasAnyRole(['admin', 'moderator']) ?? false),
            ]);
    }
}
