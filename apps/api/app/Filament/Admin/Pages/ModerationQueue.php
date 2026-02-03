<?php

declare(strict_types=1);

namespace App\Filament\Admin\Pages;

use App\Domain\Moderation\Enums\FlagAction;
use App\Domain\Moderation\Enums\FlagContentType;
use App\Domain\Moderation\Enums\FlagReason;
use App\Domain\Moderation\Enums\FlagStatus;
use App\Domain\Moderation\Enums\RestrictionScope;
use App\Domain\Moderation\Enums\RestrictionType;
use App\Models\ContentFlag;
use App\Models\User;
use App\Models\UserRestriction;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Get;
use Filament\Pages\Page;
use Filament\Tables\Actions\Action;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Concerns\InteractsWithTable;
use Filament\Tables\Contracts\HasTable;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Tabs\Tab;
use Illuminate\Database\Eloquent\Builder;

class ModerationQueue extends Page implements HasTable
{
    use InteractsWithTable;

    protected static ?string $navigationIcon = 'heroicon-o-queue-list';

    protected static ?string $navigationLabel = 'Fila de Moderacao';

    protected static ?string $navigationGroup = 'Moderacao';

    protected static ?int $navigationSort = 5;

    protected static string $view = 'filament.admin.pages.moderation-queue';

    protected function getTableQuery(): Builder
    {
        return ContentFlag::query()
            ->with(['reportedBy', 'handledBy'])
            ->latest();
    }

    protected function getTableColumns(): array
    {
        return [
            TextColumn::make('status')
                ->label('Status')
                ->badge()
                ->formatStateUsing(fn ($state) => $state?->label() ?? $state)
                ->color(function ($state): string {
                    return match ($state?->value ?? $state) {
                        FlagStatus::Open->value => 'warning',
                        FlagStatus::Reviewing->value => 'info',
                        FlagStatus::ActionTaken->value => 'success',
                        FlagStatus::Dismissed->value => 'gray',
                        default => 'gray',
                    };
                }),
            TextColumn::make('content_type')
                ->label('Tipo')
                ->badge()
                ->formatStateUsing(fn ($state) => $state?->label() ?? $state),
            TextColumn::make('content_id')
                ->label('Conteudo ID')
                ->toggleable(),
            TextColumn::make('reason')
                ->label('Motivo')
                ->formatStateUsing(fn ($state) => $state?->label() ?? $state),
            TextColumn::make('message')
                ->label('Mensagem')
                ->limit(40)
                ->tooltip(fn ($record) => $record->message),
            TextColumn::make('reportedBy.nome')
                ->label('Denunciante')
                ->toggleable(),
            TextColumn::make('created_at')
                ->label('Criado em')
                ->dateTime('d/m/Y H:i')
                ->sortable(),
        ];
    }

    protected function getTableActions(): array
    {
        return [
            Action::make('markReviewing')
                ->label('Marcar em analise')
                ->icon('heroicon-o-eye')
                ->color('info')
                ->action(function (ContentFlag $record): void {
                    $record->markReviewing(auth()->user());
                })
                ->visible(fn (ContentFlag $record) => $record->status === FlagStatus::Open),
            Action::make('dismiss')
                ->label('Dispensar')
                ->icon('heroicon-o-x-circle')
                ->color('gray')
                ->requiresConfirmation()
                ->action(function (ContentFlag $record): void {
                    $record->markDismissed(auth()->user());
                })
                ->visible(fn (ContentFlag $record) => in_array($record->status, [FlagStatus::Open, FlagStatus::Reviewing], true)),
            Action::make('takeAction')
                ->label('Acao tomada')
                ->icon('heroicon-o-check-circle')
                ->color('success')
                ->form([
                    Select::make('action')
                        ->label('Acao')
                        ->options(collect(FlagAction::cases())
                            ->mapWithKeys(fn (FlagAction $action) => [$action->value => $action->label()])
                            ->toArray())
                        ->required()
                        ->reactive(),
                    Select::make('user_id')
                        ->label('Usuario alvo')
                        ->searchable()
                        ->getSearchResultsUsing(function (string $search): array {
                            return User::query()
                                ->where('nome', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%")
                                ->limit(20)
                                ->pluck('nome', 'id')
                                ->toArray();
                        })
                        ->getOptionLabelUsing(fn ($value): ?string => User::find($value)?->nome)
                        ->required(fn (Get $get) => $get('action') === FlagAction::RestrictUser->value)
                        ->visible(fn (Get $get) => $get('action') === FlagAction::RestrictUser->value),
                    Select::make('restriction_type')
                        ->label('Tipo de restricao')
                        ->options(collect(RestrictionType::cases())
                            ->mapWithKeys(fn (RestrictionType $type) => [$type->value => $type->label()])
                            ->toArray())
                        ->required(fn (Get $get) => $get('action') === FlagAction::RestrictUser->value)
                        ->visible(fn (Get $get) => $get('action') === FlagAction::RestrictUser->value),
                    Select::make('restriction_scope')
                        ->label('Escopo')
                        ->options(collect(RestrictionScope::cases())
                            ->mapWithKeys(fn (RestrictionScope $scope) => [$scope->value => $scope->label()])
                            ->toArray())
                        ->default(RestrictionScope::Global->value)
                        ->required(fn (Get $get) => $get('action') === FlagAction::RestrictUser->value)
                        ->visible(fn (Get $get) => $get('action') === FlagAction::RestrictUser->value),
                    Textarea::make('restriction_reason')
                        ->label('Motivo')
                        ->rows(3)
                        ->required(fn (Get $get) => $get('action') === FlagAction::RestrictUser->value)
                        ->visible(fn (Get $get) => $get('action') === FlagAction::RestrictUser->value),
                    DateTimePicker::make('restriction_ends_at')
                        ->label('Fim da restricao')
                        ->nullable()
                        ->visible(fn (Get $get) => $get('action') === FlagAction::RestrictUser->value),
                ])
                ->action(function (ContentFlag $record, array $data): void {
                    $record->markActionTaken(auth()->user(), FlagAction::from($data['action']));

                    if (($data['action'] ?? null) === FlagAction::RestrictUser->value) {
                        UserRestriction::create([
                            'user_id' => $data['user_id'],
                            'type' => $data['restriction_type'],
                            'scope' => $data['restriction_scope'],
                            'reason' => $data['restriction_reason'] ?? 'Aplicada via moderacao',
                            'created_by' => auth()->id(),
                            'starts_at' => now(),
                            'ends_at' => $data['restriction_ends_at'] ?? null,
                        ]);
                    }
                })
                ->visible(fn (ContentFlag $record) => in_array($record->status, [FlagStatus::Open, FlagStatus::Reviewing], true)),
        ];
    }

    protected function getTableFilters(): array
    {
        return [
            SelectFilter::make('status')
                ->label('Status')
                ->options(collect(FlagStatus::cases())
                    ->mapWithKeys(fn (FlagStatus $status) => [$status->value => $status->label()])
                    ->toArray()),
            SelectFilter::make('reason')
                ->label('Motivo')
                ->options(collect(FlagReason::cases())
                    ->mapWithKeys(fn (FlagReason $reason) => [$reason->value => $reason->label()])
                    ->toArray()),
            SelectFilter::make('content_type')
                ->label('Tipo')
                ->options(collect(FlagContentType::cases())
                    ->mapWithKeys(fn (FlagContentType $type) => [$type->value => $type->label()])
                    ->toArray()),
        ];
    }

    public function getTableTabs(): array
    {
        return [
            'open' => Tab::make('Em aberto')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', FlagStatus::Open->value)),
            'reviewing' => Tab::make('Em analise')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', FlagStatus::Reviewing->value)),
            'action_taken' => Tab::make('Acao tomada')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', FlagStatus::ActionTaken->value)),
            'dismissed' => Tab::make('Dispensadas')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', FlagStatus::Dismissed->value)),
        ];
    }

    protected function getDefaultTableTab(): string
    {
        return 'open';
    }
}
