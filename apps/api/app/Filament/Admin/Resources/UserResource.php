<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domain\Moderation\Enums\RestrictionScope;
use App\Domain\Moderation\Enums\RestrictionType;
use App\Filament\Admin\Resources\UserResource\Pages;
use App\Filament\Admin\Resources\UserResource\RelationManagers\ActivityLogsRelationManager;
use App\Filament\Admin\Resources\UserResource\RelationManagers\UserRestrictionsRelationManager;
use App\Models\User;
use App\Models\UserRestriction;
use Filament\Forms;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\KeyValue;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Actions\BulkAction;
use Filament\Tables\Actions\DeleteAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\Filter;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class UserResource extends Resource
{
    protected static ?string $model = User::class;

    protected static ?string $navigationGroup = 'Acesso & Usuarios';

    protected static ?string $navigationIcon = 'heroicon-o-users';

    protected static ?int $navigationSort = 1;

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Dados basicos')
                    ->columns(2)
                    ->schema([
                        TextInput::make('nome')
                            ->label('Nome')
                            ->required()
                            ->maxLength(100),
                        TextInput::make('phone')
                            ->label('Telefone')
                            ->required()
                            ->maxLength(11),
                        TextInput::make('email')
                            ->label('Email')
                            ->email()
                            ->maxLength(255),
                        TextInput::make('password')
                            ->label('Senha')
                            ->password()
                            ->dehydrated(fn ($state) => filled($state))
                            ->required(fn ($livewire) => $livewire instanceof Pages\CreateUser)
                            ->maxLength(255),
                        Select::make('bairro_id')
                            ->label('Bairro')
                            ->relationship('bairro', 'nome')
                            ->searchable()
                            ->preload()
                            ->nullable(),
                    ]),
                Section::make('Roles')
                    ->schema([
                        Select::make('roles')
                            ->label('Roles')
                            ->relationship('roles', 'name')
                            ->preload()
                            ->multiple()
                            ->searchable()
                            ->dehydrated(fn () => auth()->user()?->hasRole('admin') ?? false)
                            ->visible(fn () => auth()->user()?->hasRole('admin') ?? false),
                    ])
                    ->visible(fn () => auth()->user()?->hasRole('admin') ?? false),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('nome')
                    ->label('Nome')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('phone')
                    ->label('Telefone')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('email')
                    ->label('Email')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('bairro.nome')
                    ->label('Bairro')
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('roles.name')
                    ->label('Roles')
                    ->badge()
                    ->separator(',')
                    ->toggleable(),
                TextColumn::make('active_restrictions_count')
                    ->label('Status')
                    ->badge()
                    ->formatStateUsing(fn (int $state): string => $state > 0 ? 'Suspenso' : 'Ativo')
                    ->color(fn (int $state): string => $state > 0 ? 'danger' : 'success'),
                TextColumn::make('created_at')
                    ->label('Criado em')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(),
            ])
            ->filters([
                SelectFilter::make('role')
                    ->label('Role')
                    ->relationship('roles', 'name')
                    ->preload(),
                SelectFilter::make('bairro_id')
                    ->label('Bairro')
                    ->relationship('bairro', 'nome')
                    ->preload(),
                Filter::make('phone_verified')
                    ->label('Telefone verificado')
                    ->query(fn (Builder $query): Builder => $query->whereNotNull('phone_verified_at')),
                Filter::make('created_at')
                    ->form([
                        DateTimePicker::make('from')->label('De'),
                        DateTimePicker::make('until')->label('Ate'),
                    ])
                    ->query(function (Builder $query, array $data): Builder {
                        return $query
                            ->when($data['from'] ?? null, fn (Builder $q, $date) => $q->where('created_at', '>=', $date))
                            ->when($data['until'] ?? null, fn (Builder $q, $date) => $q->where('created_at', '<=', $date));
                    }),
            ])
            ->actions([
                EditAction::make(),
                Action::make('applyRestriction')
                    ->label('Aplicar restricao')
                    ->icon('heroicon-o-no-symbol')
                    ->color('warning')
                    ->form([
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
                            ->rows(3)
                            ->required(),
                        DateTimePicker::make('starts_at')
                            ->label('Inicio')
                            ->default(now()),
                        DateTimePicker::make('ends_at')
                            ->label('Fim')
                            ->nullable(),
                        KeyValue::make('metadata')
                            ->label('Metadata')
                            ->addButtonLabel('Adicionar')
                            ->keyLabel('Chave')
                            ->valueLabel('Valor')
                            ->nullable(),
                    ])
                    ->action(function (User $record, array $data): void {
                        UserRestriction::create([
                            'user_id' => $record->id,
                            'type' => $data['type'],
                            'scope' => $data['scope'],
                            'reason' => $data['reason'],
                            'created_by' => auth()->id(),
                            'starts_at' => $data['starts_at'] ?? now(),
                            'ends_at' => $data['ends_at'] ?? null,
                            'metadata' => $data['metadata'] ?? null,
                        ]);
                    })
                    ->visible(fn () => auth()->user()?->hasAnyRole(['admin', 'moderator']) ?? false),
                Action::make('revokeRestrictions')
                    ->label('Revogar restricoes')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->action(function (User $record): void {
                        $record->activeRestrictions()->update([
                            'revoked_at' => now(),
                            'revoked_by' => auth()->id(),
                        ]);
                    })
                    ->visible(fn (User $record): bool => ($record->active_restrictions_count ?? 0) > 0),
                DeleteAction::make()
                    ->visible(fn () => auth()->user()?->hasRole('admin') ?? false),
            ])
            ->bulkActions([
                BulkAction::make('revokeRestrictions')
                    ->label('Revogar restricoes')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->action(function (Collection $records): void {
                        $records->each(function (User $record): void {
                            $record->activeRestrictions()->update([
                                'revoked_at' => now(),
                                'revoked_by' => auth()->id(),
                            ]);
                        });
                    })
                    ->visible(fn () => auth()->user()?->hasAnyRole(['admin', 'moderator']) ?? false),
            ]);
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->with(['bairro', 'roles'])
            ->withCount(['activeRestrictions as active_restrictions_count']);
    }

    public static function getRelations(): array
    {
        return [
            UserRestrictionsRelationManager::class,
            ActivityLogsRelationManager::class,
            // Future: TopicsRelationManager, CommentsRelationManager, ReportsRelationManager
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListUsers::route('/'),
            'create' => Pages\CreateUser::route('/create'),
            'edit' => Pages\EditUser::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return auth()->user()?->hasRole('admin') ?? false;
    }
}
