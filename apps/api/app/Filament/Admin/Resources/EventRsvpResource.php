<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domain\Events\Enums\RsvpStatus;
use App\Filament\Admin\Resources\EventRsvpResource\Pages;
use App\Models\EventRsvp;
use Filament\Forms;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Tables;
use Filament\Tables\Actions\DeleteAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Actions\ViewAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

class EventRsvpResource extends BaseResource
{
    protected static ?string $model = EventRsvp::class;

    protected static ?string $navigationGroup = 'Conteudo';

    protected static ?string $navigationIcon = 'heroicon-o-user-plus';

    protected static ?string $navigationLabel = 'RSVPs';

    protected static ?string $modelLabel = 'RSVP';

    protected static ?string $pluralModelLabel = 'RSVPs';

    protected static ?int $navigationSort = 15;

    protected static array $defaultEagerLoad = ['event', 'user'];

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('RSVP')
                    ->columns(2)
                    ->schema([
                        Select::make('event_id')
                            ->label('Evento')
                            ->relationship('event', 'title')
                            ->searchable()
                            ->preload()
                            ->disabled()
                            ->dehydrated(false),
                        Select::make('user_id')
                            ->label('Usuario')
                            ->relationship('user', 'nome')
                            ->searchable()
                            ->preload()
                            ->disabled()
                            ->dehydrated(false),
                        Select::make('status')
                            ->label('Status')
                            ->options(collect(RsvpStatus::cases())
                                ->mapWithKeys(fn (RsvpStatus $status) => [$status->value => $status->label()])
                                ->toArray())
                            ->required(),
                        TextInput::make('guests_count')
                            ->label('Convidados')
                            ->numeric()
                            ->default(1),
                        Toggle::make('notified')
                            ->label('Notificado')
                            ->default(false),
                        Textarea::make('notes')
                            ->label('Notas')
                            ->rows(3)
                            ->columnSpanFull(),
                    ]),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('event.title')
                    ->label('Evento')
                    ->searchable()
                    ->limit(40)
                    ->sortable(),
                TextColumn::make('user.nome')
                    ->label('Usuario')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->formatStateUsing(fn (RsvpStatus $state): string => $state->label())
                    ->color(fn (RsvpStatus $state): string => match ($state) {
                        RsvpStatus::Going => 'success',
                        RsvpStatus::Maybe => 'warning',
                        RsvpStatus::NotGoing => 'danger',
                    }),
                TextColumn::make('guests_count')
                    ->label('Convidados')
                    ->sortable()
                    ->alignCenter(),
                IconColumn::make('notified')
                    ->label('Notificado')
                    ->boolean()
                    ->toggleable(),
                ...static::baseTableColumns(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Status')
                    ->options(collect(RsvpStatus::cases())
                        ->mapWithKeys(fn (RsvpStatus $status) => [$status->value => $status->label()])
                        ->toArray()),
                SelectFilter::make('event_id')
                    ->label('Evento')
                    ->relationship('event', 'title')
                    ->preload(),
                SelectFilter::make('notified')
                    ->label('Notificado')
                    ->options([
                        1 => 'Sim',
                        0 => 'Nao',
                    ]),
                ...static::baseTableFilters(),
            ])
            ->actions([
                ViewAction::make(),
                EditAction::make()->requiresConfirmation(),
                DeleteAction::make()
                    ->requiresConfirmation()
                    ->visible(fn(): bool => auth()->user()?->hasRole('admin') ?? false),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListEventRsvps::route('/'),
            'view' => Pages\ViewEventRsvp::route('/{record}'),
            'edit' => Pages\EditEventRsvp::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }
}
