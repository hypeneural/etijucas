<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\UserResource\RelationManagers;

use App\Domain\Moderation\Enums\RestrictionScope;
use App\Domain\Moderation\Enums\RestrictionType;
use App\Models\UserRestriction;
use Filament\Forms;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\KeyValue;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Actions\CreateAction;
use Filament\Tables\Columns\TextColumn;
use Illuminate\Database\Eloquent\Builder;

class UserRestrictionsRelationManager extends RelationManager
{
    protected static string $relationship = 'restrictions';

    protected static ?string $title = 'Restricoes';

    public function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Select::make('type')
                    ->label('Tipo')
                    ->options(collect(RestrictionType::cases())
                        ->mapWithKeys(fn (RestrictionType $type) => [$type->value => $type->label()])
                        ->toArray())
                    ->required(),
                Select::make('scope')
                    ->label('Escopo')
                    ->options(collect(RestrictionScope::cases())
                        ->mapWithKeys(fn (RestrictionScope $scope) => [$scope->value => $scope->label()])
                        ->toArray())
                    ->default(RestrictionScope::Global->value)
                    ->required(),
                Textarea::make('reason')
                    ->label('Motivo')
                    ->required(),
                DateTimePicker::make('starts_at')
                    ->label('Inicio')
                    ->default(now()),
                DateTimePicker::make('ends_at')
                    ->label('Fim')
                    ->nullable(),
                KeyValue::make('metadata')
                    ->label('Metadata')
                    ->nullable(),
            ]);
    }

    public function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->recordTitleAttribute('type')
            ->columns([
                TextColumn::make('type')
                    ->label('Tipo')
                    ->badge()
                    ->formatStateUsing(fn ($state) => $state?->label() ?? $state),
                TextColumn::make('scope')
                    ->label('Escopo')
                    ->formatStateUsing(fn ($state) => $state?->label() ?? $state)
                    ->toggleable(),
                TextColumn::make('reason')
                    ->label('Motivo')
                    ->limit(40)
                    ->tooltip(fn ($record) => $record->reason),
                TextColumn::make('starts_at')
                    ->label('Inicio')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
                TextColumn::make('ends_at')
                    ->label('Fim')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->getStateUsing(function (UserRestriction $record): string {
                        if ($record->revoked_at) {
                            return 'Revogada';
                        }
                        if ($record->ends_at && $record->ends_at->isPast()) {
                            return 'Expirada';
                        }
                        return 'Ativa';
                    })
                    ->color(function (UserRestriction $record): string {
                        if ($record->revoked_at) {
                            return 'gray';
                        }
                        if ($record->ends_at && $record->ends_at->isPast()) {
                            return 'warning';
                        }
                        return 'danger';
                    }),
            ])
            ->headerActions([
                CreateAction::make()
                    ->mutateFormDataUsing(function (array $data): array {
                        $data['created_by'] = auth()->id();
                        return $data;
                    })
                    ->visible(fn () => auth()->user()?->hasAnyRole(['admin', 'moderator']) ?? false),
            ])
            ->actions([
                Action::make('revoke')
                    ->label('Revogar')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->action(function (UserRestriction $record): void {
                        $record->revoke(auth()->user());
                    })
                    ->visible(fn (UserRestriction $record) => $record->isActive()),
            ]);
    }
}
