<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domain\Events\Enums\AgeRating;
use App\Domain\Events\Enums\EventStatus;
use App\Domain\Events\Enums\EventType;
use App\Filament\Admin\Resources\EventResource\Pages;
use App\Models\Event;
use Filament\Forms;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Tables;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Support\Str;

class EventResource extends BaseResource
{
    protected static ?string $model = Event::class;

    protected static ?string $navigationGroup = 'Conteudo';

    protected static ?string $navigationIcon = 'heroicon-o-calendar-days';

    protected static ?string $navigationLabel = 'Eventos';

    protected static ?int $navigationSort = 12;

    protected static array $defaultEagerLoad = ['category', 'venue', 'organizer'];

    protected static array $defaultWithCount = ['rsvps', 'media'];

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Evento')
                    ->columns(2)
                    ->schema([
                        TextInput::make('title')
                            ->label('Titulo')
                            ->required()
                            ->maxLength(200)
                            ->live(onBlur: true)
                            ->afterStateUpdated(function (string $state, callable $set): void {
                                $set('slug', Str::slug($state));
                            }),
                        TextInput::make('slug')
                            ->label('Slug')
                            ->required()
                            ->maxLength(200)
                            ->unique(ignoreRecord: true),
                        TextInput::make('edition')
                            ->label('Edicao')
                            ->maxLength(80),
                        Select::make('category_id')
                            ->label('Categoria')
                            ->relationship('category', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Select::make('venue_id')
                            ->label('Local')
                            ->relationship('venue', 'name')
                            ->searchable()
                            ->preload(),
                        Select::make('organizer_id')
                            ->label('Organizador')
                            ->relationship('organizer', 'name')
                            ->searchable()
                            ->preload(),
                        Select::make('status')
                            ->label('Status')
                            ->options(collect(EventStatus::cases())
                                ->mapWithKeys(fn (EventStatus $status) => [$status->value => $status->label()])
                                ->toArray())
                            ->required(),
                        Select::make('event_type')
                            ->label('Tipo')
                            ->options(collect(EventType::cases())
                                ->mapWithKeys(fn (EventType $type) => [$type->value => $type->label()])
                                ->toArray())
                            ->required(),
                        Select::make('age_rating')
                            ->label('Classificacao')
                            ->options(collect(AgeRating::cases())
                                ->mapWithKeys(fn (AgeRating $rating) => [$rating->value => $rating->label()])
                                ->toArray())
                            ->required(),
                        Select::make('tags')
                            ->label('Tags')
                            ->relationship('tags', 'name')
                            ->multiple()
                            ->searchable()
                            ->preload(),
                    ]),
                Section::make('Datas')
                    ->columns(2)
                    ->schema([
                        DateTimePicker::make('start_datetime')
                            ->label('Inicio')
                            ->required(),
                        DateTimePicker::make('end_datetime')
                            ->label('Fim')
                            ->required(),
                        DateTimePicker::make('published_at')
                            ->label('Publicado em'),
                    ]),
                Section::make('Descricao')
                    ->schema([
                        Textarea::make('description_short')
                            ->label('Descricao curta')
                            ->rows(3)
                            ->maxLength(500),
                        Textarea::make('description_full')
                            ->label('Descricao completa')
                            ->rows(6),
                    ]),
                Section::make('Midia')
                    ->columns(2)
                    ->schema([
                        TextInput::make('cover_image_url')
                            ->label('Capa URL')
                            ->url()
                            ->maxLength(500),
                        TextInput::make('banner_image_url')
                            ->label('Banner URL')
                            ->url()
                            ->maxLength(500),
                        TextInput::make('banner_image_mobile_url')
                            ->label('Banner mobile URL')
                            ->url()
                            ->maxLength(500),
                    ]),
                Section::make('Configuracoes')
                    ->columns(2)
                    ->schema([
                        Toggle::make('is_featured')
                            ->label('Destaque')
                            ->default(false),
                        Toggle::make('is_recurring')
                            ->label('Recorrente')
                            ->default(false),
                        Toggle::make('is_outdoor')
                            ->label('Ao ar livre')
                            ->default(false),
                        Toggle::make('has_accessibility')
                            ->label('Acessivel')
                            ->default(false),
                        Toggle::make('has_parking')
                            ->label('Estacionamento')
                            ->default(false),
                        TextInput::make('total_days')
                            ->label('Total dias')
                            ->numeric()
                            ->default(1),
                        Textarea::make('recurrence_rule')
                            ->label('Recorrencia (JSON)')
                            ->rows(3)
                            ->columnSpanFull(),
                    ]),
                Section::make('Metricas')
                    ->columns(3)
                    ->schema([
                        TextInput::make('popularity_score')
                            ->label('Popularidade')
                            ->numeric(),
                        TextInput::make('expected_audience')
                            ->label('Publico esperado')
                            ->numeric(),
                        TextInput::make('confirmed_attendance')
                            ->label('Confirmados')
                            ->numeric(),
                    ]),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('title')
                    ->label('Titulo')
                    ->searchable()
                    ->sortable()
                    ->limit(40),
                TextColumn::make('category.name')
                    ->label('Categoria')
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('venue.name')
                    ->label('Local')
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('organizer.name')
                    ->label('Organizador')
                    ->toggleable(),
                TextColumn::make('start_datetime')
                    ->label('Inicio')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->formatStateUsing(fn (EventStatus $state): string => $state->label())
                    ->color(fn (EventStatus $state): string => match ($state) {
                        EventStatus::Draft => 'gray',
                        EventStatus::Published => 'success',
                        EventStatus::Cancelled => 'danger',
                        EventStatus::Finished => 'info',
                    }),
                IconColumn::make('is_featured')
                    ->label('Destaque')
                    ->boolean()
                    ->toggleable(),
                TextColumn::make('rsvps_count')
                    ->label('RSVPs')
                    ->sortable()
                    ->alignCenter(),
                TextColumn::make('media_count')
                    ->label('Midias')
                    ->sortable()
                    ->alignCenter(),
                ...static::baseTableColumns(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Status')
                    ->options(collect(EventStatus::cases())
                        ->mapWithKeys(fn (EventStatus $status) => [$status->value => $status->label()])
                        ->toArray()),
                SelectFilter::make('category_id')
                    ->label('Categoria')
                    ->relationship('category', 'name')
                    ->preload(),
                SelectFilter::make('venue_id')
                    ->label('Local')
                    ->relationship('venue', 'name')
                    ->preload(),
                SelectFilter::make('organizer_id')
                    ->label('Organizador')
                    ->relationship('organizer', 'name')
                    ->preload(),
                SelectFilter::make('event_type')
                    ->label('Tipo')
                    ->options(collect(EventType::cases())
                        ->mapWithKeys(fn (EventType $type) => [$type->value => $type->label()])
                        ->toArray()),
                SelectFilter::make('is_featured')
                    ->label('Destaque')
                    ->options([
                        1 => 'Sim',
                        0 => 'Nao',
                    ]),
                ...static::baseTableFilters(),
            ])
            ->actions([
                ...static::baseTableActions(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListEvents::route('/'),
            'create' => Pages\CreateEvent::route('/create'),
            'edit' => Pages\EditEvent::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return auth()->user()?->hasAnyRole(['admin', 'operator']) ?? false;
    }
}
