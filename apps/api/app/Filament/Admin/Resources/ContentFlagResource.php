<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domain\Moderation\Enums\FlagAction;
use App\Domain\Moderation\Enums\FlagContentType;
use App\Domain\Moderation\Enums\FlagReason;
use App\Domain\Moderation\Enums\FlagStatus;
use App\Domain\Moderation\Services\ModerationActionService;
use App\Domain\Moderation\Enums\RestrictionScope;
use App\Domain\Moderation\Enums\RestrictionType;
use App\Filament\Admin\Resources\ContentFlagResource\Pages;
use App\Models\ContentFlag;
use App\Models\User;
use App\Support\Tenant;
use Filament\Forms;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Get;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ContentFlagResource extends BaseResource
{
    protected static ?string $model = ContentFlag::class;

    protected static ?string $navigationGroup = 'Modera??o';

    protected static ?string $navigationIcon = 'heroicon-o-flag';

    protected static ?int $navigationSort = 20;

    protected static ?string $navigationLabel = 'Den?ncias de Conte?do';

    protected static ?string $modelLabel = 'Den?ncia de Conte?do';
    protected static ?string $pluralModelLabel = 'Den?ncias de Conte?do';

    protected static array $defaultEagerLoad = ['reportedBy', 'handledBy'];

    public static function getEloquentQuery(): Builder
    {
        $query = parent::getEloquentQuery();
        $cityId = Tenant::cityId();

        if (!is_string($cityId) || $cityId === '') {
            return $query->whereRaw('1 = 0');
        }

        return $query->where(function (Builder $tenantQuery) use ($cityId): void {
            $tenantQuery
                ->where(function (Builder $topicQuery) use ($cityId): void {
                    $topicQuery
                        ->where('content_flags.content_type', FlagContentType::Topic->value)
                        ->whereExists(function ($existsQuery) use ($cityId): void {
                            $existsQuery
                                ->select(DB::raw('1'))
                                ->from('topics')
                                ->whereColumn('topics.id', 'content_flags.content_id')
                                ->where('topics.city_id', $cityId);
                        });
                })
                ->orWhere(function (Builder $commentQuery) use ($cityId): void {
                    $commentQuery
                        ->where('content_flags.content_type', FlagContentType::Comment->value)
                        ->whereExists(function ($existsQuery) use ($cityId): void {
                            $existsQuery
                                ->select(DB::raw('1'))
                                ->from('comments')
                                ->whereColumn('comments.id', 'content_flags.content_id')
                                ->where('comments.city_id', $cityId);
                        });
                })
                ->orWhere(function (Builder $reportQuery) use ($cityId): void {
                    $reportQuery
                        ->where('content_flags.content_type', FlagContentType::Report->value)
                        ->whereExists(function ($existsQuery) use ($cityId): void {
                            $existsQuery
                                ->select(DB::raw('1'))
                                ->from('citizen_reports')
                                ->whereColumn('citizen_reports.id', 'content_flags.content_id')
                                ->where('citizen_reports.city_id', $cityId);
                        });
                })
                ->orWhere(function (Builder $userQuery) use ($cityId): void {
                    $userQuery
                        ->where('content_flags.content_type', FlagContentType::User->value)
                        ->whereExists(function ($existsQuery) use ($cityId): void {
                            $existsQuery
                                ->select(DB::raw('1'))
                                ->from('users')
                                ->whereColumn('users.id', 'content_flags.content_id')
                                ->where('users.city_id', $cityId);
                        });
                });
        });
    }

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Select::make('content_type')
                    ->label('Tipo de conte?do')
                    ->options(collect(FlagContentType::cases())
                        ->mapWithKeys(fn (FlagContentType $type) => [$type->value => $type->label()])
                        ->toArray())
                    ->required(),
                Forms\Components\TextInput::make('content_id')
                    ->label('Conte?do ID')
                    ->disabled()
                    ->dehydrated(false),
                Textarea::make('message')
                    ->label('Mensagem')
                    ->rows(3),
                Select::make('reason')
                    ->label('Motivo')
                    ->options(collect(FlagReason::cases())
                        ->mapWithKeys(fn (FlagReason $reason) => [$reason->value => $reason->label()])
                        ->toArray())
                    ->required(),
                Select::make('status')
                    ->label('Status')
                    ->options(collect(FlagStatus::cases())
                        ->mapWithKeys(fn (FlagStatus $status) => [$status->value => $status->label()])
                        ->toArray())
                    ->required(),
                Select::make('action')
                    ->label('A??o')
                    ->options(collect(FlagAction::cases())
                        ->mapWithKeys(fn (FlagAction $action) => [$action->value => $action->label()])
                        ->toArray())
                    ->nullable(),
                Textarea::make('metadata')
                    ->label('Metadata')
                    ->rows(3)
                    ->nullable(),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
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
                    ->formatStateUsing(fn ($state) => $state?->label() ?? $state)
                    ->toggleable(),
                TextColumn::make('content_id')
                    ->label('Conte?do ID')
                    ->toggleable(),
                TextColumn::make('reason')
                    ->label('Motivo')
                    ->formatStateUsing(fn ($state) => $state?->label() ?? $state)
                    ->toggleable(),
                TextColumn::make('message')
                    ->label('Mensagem')
                    ->limit(40)
                    ->tooltip(fn ($record) => $record->message),
                TextColumn::make('reportedBy.nome')
                    ->label('Den?nciante')
                    ->toggleable(),
                TextColumn::make('handledBy.nome')
                    ->label('Respons?vel')
                    ->toggleable(),
                ...static::baseTableColumns(),
            ])
            ->filters([
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
                ...static::baseTableFilters(),
            ])
            ->actions([
                Action::make('markReviewing')
                    ->label('Marcar em an?lise')
                    ->icon('heroicon-o-eye')
                    ->color('info')
                    ->action(function (ContentFlag $record): void {
                        app(ModerationActionService::class)
                            ->markFlagReviewing($record, auth()->user());
                    })
                    ->visible(fn (ContentFlag $record) => $record->status === FlagStatus::Open
                        && (auth()->user()?->hasAnyRole(['admin', 'moderator']) ?? false)),
                Action::make('dismiss')
                    ->label('Dispensar')
                    ->icon('heroicon-o-x-circle')
                    ->color('gray')
                    ->requiresConfirmation()
                    ->action(function (ContentFlag $record): void {
                        app(ModerationActionService::class)
                            ->dismissFlag($record, auth()->user());
                    })
                    ->visible(fn (ContentFlag $record) => in_array($record->status, [FlagStatus::Open, FlagStatus::Reviewing], true)
                        && (auth()->user()?->hasAnyRole(['admin', 'moderator']) ?? false)),
                Action::make('takeAction')
                    ->label('A??o tomada')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->form([
                        Select::make('action')
                            ->label('A??o')
                            ->options(collect(FlagAction::cases())
                                ->mapWithKeys(fn (FlagAction $action) => [$action->value => $action->label()])
                                ->toArray())
                            ->required()
                            ->reactive(),
                        Select::make('user_id')
                            ->label('Usu?rio alvo')
                            ->searchable()
                            ->getSearchResultsUsing(function (string $search): array {
                                $tenantCityId = Tenant::cityId();

                                return User::query()
                                    ->when(
                                        is_string($tenantCityId) && $tenantCityId !== '',
                                        fn(Builder $query) => $query->where('city_id', $tenantCityId)
                                    )
                                    ->where(function (Builder $query) use ($search): void {
                                        $query
                                            ->where('nome', 'like', "%{$search}%")
                                            ->orWhere('email', 'like', "%{$search}%")
                                            ->orWhere('phone', 'like', "%{$search}%");
                                    })
                                    ->limit(20)
                                    ->pluck('nome', 'id')
                                    ->toArray();
                            })
                            ->getOptionLabelUsing(fn ($value): ?string => User::find($value)?->nome)
                            ->required(fn (Get $get) => $get('action') === FlagAction::RestrictUser->value)
                            ->visible(fn (Get $get) => $get('action') === FlagAction::RestrictUser->value),
                        Select::make('restriction_type')
                            ->label('Tipo de restri??o')
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
                            ->label('Fim da restri??o')
                            ->nullable()
                            ->visible(fn (Get $get) => $get('action') === FlagAction::RestrictUser->value),
                    ])
                    ->action(function (ContentFlag $record, array $data): void {
                        $tenantCityId = Tenant::cityId();
                        if (
                            isset($data['user_id']) &&
                            is_string($tenantCityId) &&
                            $tenantCityId !== ''
                        ) {
                            $validUser = User::query()
                                ->where('id', $data['user_id'])
                                ->where('city_id', $tenantCityId)
                                ->exists();

                            if (!$validUser) {
                                throw ValidationException::withMessages([
                                    'user_id' => 'Usuario fora do tenant selecionado.',
                                ]);
                            }
                        }

                        app(ModerationActionService::class)
                            ->takeFlagAction($record, auth()->user(), $data);
                    })
                    ->visible(fn (ContentFlag $record) => in_array($record->status, [FlagStatus::Open, FlagStatus::Reviewing], true)
                        && (auth()->user()?->hasAnyRole(['admin', 'moderator']) ?? false)),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListContentFlags::route('/'),
            'edit' => Pages\EditContentFlag::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }
}
