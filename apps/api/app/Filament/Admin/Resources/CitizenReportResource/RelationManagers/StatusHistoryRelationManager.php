<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\CitizenReportResource\RelationManagers;

use App\Domains\Reports\Enums\ReportStatus;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Columns\TextColumn;

class StatusHistoryRelationManager extends RelationManager
{
    protected static string $relationship = 'statusHistory';

    protected static ?string $title = 'Historico de status';

    public function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->formatStateUsing(function ($state): string {
                        $status = ReportStatus::tryFrom((string) $state);
                        return $status?->label() ?? (string) $state;
                    })
                    ->color(function ($state): string {
                        $status = ReportStatus::tryFrom((string) $state);
                        return match ($status) {
                            ReportStatus::Recebido => 'info',
                            ReportStatus::EmAn?lise => 'warning',
                            ReportStatus::Resolvido => 'success',
                            ReportStatus::Rejeitado => 'danger',
                            default => 'gray',
                        };
                    }),
                TextColumn::make('note')
                    ->label('Nota')
                    ->limit(40)
                    ->toggleable(),
                TextColumn::make('createdBy.nome')
                    ->label('Autor')
                    ->toggleable(),
                TextColumn::make('created_at')
                    ->label('Data')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                //
            ])
            ->actions([
                //
            ]);
    }

    public function isReadOnly(): bool
    {
        return true;
    }
}
