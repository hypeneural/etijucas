<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domain\Moderation\Enums\RestrictionScope;
use App\Domain\Moderation\Enums\RestrictionType;
use App\Filament\Admin\Resources\UserRestrictionResource\Pages;
use App\Models\UserRestriction;
use Filament\Forms;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\KeyValue;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\Filter;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Database\Eloquent\Builder;

class UserRestrictionResource extends Resource
{
    protected static ?string $model = UserRestriction::class;

    protected static ?string $navigationGroup = 'Moderacao';

    protected static ?string $navigationIcon = 'heroicon-o-no-symbol';

    protected static ?int $navigationSort = 10;

    protected static ?string $navigationLabel = 'Restricoes';

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Select::make('user_id')
                    ->relationship('user', 'nome')
                    ->searchable()
                    ->preload()
                    ->required(),
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

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('user.nome')
                    ->label('Usuario')
                    ->searchable()
                    ->sortable(),
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
            ->filters([
                SelectFilter::make('type')
                    ->label('Tipo')
                    ->options(collect(RestrictionType::cases())
                        ->mapWithKeys(fn (RestrictionType $type) => [$type->value => $type->label()])
                        ->toArray()),
                SelectFilter::make('scope')
                    ->label('Escopo')
                    ->options(collect(RestrictionScope::cases())
                        ->mapWithKeys(fn (RestrictionScope $scope) => [$scope->value => $scope->label()])
                        ->toArray()),
                Filter::make('active')
                    ->label('Ativas')
                    ->query(fn (Builder $query): Builder => $query->active()),
            ])
            ->actions([
                EditAction::make(),
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

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListUserRestrictions::route('/'),
            'create' => Pages\CreateUserRestriction::route('/create'),
            'edit' => Pages\EditUserRestriction::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->with('user');
    }
}
