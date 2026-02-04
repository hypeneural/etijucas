<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domain\Events\Enums\AgeRating;
use App\Domain\Events\Enums\EventStatus;
use App\Domain\Events\Enums\EventType;
use App\Domain\Events\Enums\MediaType;
use App\Filament\Admin\Resources\Concerns\HasMediaLibraryTrait;
use App\Filament\Admin\Resources\EventResource\Pages;
use App\Filament\Admin\Resources\EventResource\RelationManagers\DaysRelationManager;
use App\Filament\Admin\Resources\EventResource\RelationManagers\LinksRelationManager;
use App\Filament\Admin\Resources\EventResource\RelationManagers\MediaRelationManager;
use App\Filament\Admin\Resources\EventResource\RelationManagers\RsvpsRelationManager;
use App\Filament\Admin\Resources\EventResource\RelationManagers\SchedulesRelationManager;
use App\Filament\Admin\Resources\EventResource\RelationManagers\TagsRelationManager;
use App\Filament\Admin\Resources\EventResource\RelationManagers\TicketRelationManager;
use App\Models\Event;
use Filament\Forms;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Notifications\Notification;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class EventResource extends BaseResource
{
    use HasMediaLibraryTrait;

    protected static ?string $model = Event::class;

    protected static ?string $navigationGroup = 'Conteudo';

    protected static ?string $navigationIcon = 'heroicon-o-calendar-days';

    protected static ?string $navigationLabel = 'Eventos';

    protected static ?int $navigationSort = 12;

    protected static array $defaultEagerLoad = ['category', 'venue', 'organizer'];

    protected static array $defaultWithCount = [
        'rsvps',
        'legacyMedia',
        'media',
    ];

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
                                ->mapWithKeys(fn(EventStatus $status) => [$status->value => $status->label()])
                                ->toArray())
                            ->required(),
                        Select::make('event_type')
                            ->label('Tipo')
                            ->options(collect(EventType::cases())
                                ->mapWithKeys(fn(EventType $type) => [$type->value => $type->label()])
                                ->toArray())
                            ->required(),
                        Select::make('age_rating')
                            ->label('Classificacao')
                            ->options(collect(AgeRating::cases())
                                ->mapWithKeys(fn(AgeRating $rating) => [$rating->value => $rating->label()])
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
                        static::mediaUploadField('cover', 'event_cover', 1)
                            ->label('Capa')
                            ->helperText('Upload preferencial.'),
                        static::mediaUploadField('banner', 'event_banner', 1)
                            ->label('Banner')
                            ->helperText('Upload preferencial.'),
                        static::mediaUploadField('banner_mobile', 'event_banner_mobile', 1)
                            ->label('Banner mobile')
                            ->helperText('Upload preferencial.'),
                        static::mediaUploadField('gallery', 'event_gallery', 8)
                            ->label('Galeria')
                            ->helperText('Imagens adicionais do evento.'),
                        TextInput::make('cover_image_url')
                            ->label('Capa URL (legado)')
                            ->url()
                            ->maxLength(500),
                        TextInput::make('banner_image_url')
                            ->label('Banner URL (legado)')
                            ->url()
                            ->maxLength(500),
                        TextInput::make('banner_image_mobile_url')
                            ->label('Banner mobile URL (legado)')
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
                    ->formatStateUsing(fn(EventStatus $state): string => $state->label())
                    ->color(fn(EventStatus $state): string => match ($state) {
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
                    ->alignCenter()
                    ->getStateUsing(fn(Event $record): int => (int) ($record->media_count ?? 0) + (int) ($record->legacy_media_count ?? 0))
                    ->sortable(query: fn(Builder $query, string $direction): Builder => $query->orderByRaw(
                        '(COALESCE(media_count, 0) + COALESCE(legacy_media_count, 0)) ' . $direction
                    )),
                ...static::baseTableColumns(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Status')
                    ->options(collect(EventStatus::cases())
                        ->mapWithKeys(fn(EventStatus $status) => [$status->value => $status->label()])
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
                        ->mapWithKeys(fn(EventType $type) => [$type->value => $type->label()])
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
                Action::make('importLegacyMedia')
                    ->label('Importar midia (URL)')
                    ->icon('heroicon-o-arrow-down-tray')
                    ->requiresConfirmation()
                    ->action(function (Event $record): void {
                        $imported = 0;
                        $skipped = 0;
                        $failed = 0;

                        $importSingle = function (string $field, string $collection) use ($record, &$imported, &$skipped, &$failed): void {
                            $url = $record->{$field};
                            if (!$url) {
                                $skipped++;
                                return;
                            }

                            if ($record->getMedia($collection)->isNotEmpty()) {
                                $skipped++;
                                return;
                            }

                            try {
                                $record->addMediaFromUrl($url)->toMediaCollection($collection);
                                $imported++;
                            } catch (\Throwable $exception) {
                                $failed++;
                            }
                        };

                        $importSingle('cover_image_url', 'event_cover');
                        $importSingle('banner_image_url', 'event_banner');
                        $importSingle('banner_image_mobile_url', 'event_banner_mobile');

                        $existingGalleryUrls = $record->getMedia('event_gallery')
                            ->map(fn($media) => $media->getCustomProperty('source_url'))
                            ->filter()
                            ->values()
                            ->all();

                        foreach ($record->legacyMedia as $legacyMedia) {
                            if (!$legacyMedia->url) {
                                $skipped++;
                                continue;
                            }

                            if ($legacyMedia->media_type !== MediaType::Image) {
                                $skipped++;
                                continue;
                            }

                            if (in_array($legacyMedia->url, $existingGalleryUrls, true)) {
                                $skipped++;
                                continue;
                            }

                            try {
                                $record->addMediaFromUrl($legacyMedia->url)
                                    ->withCustomProperties([
                                        'caption' => $legacyMedia->caption,
                                        'source_url' => $legacyMedia->url,
                                    ])
                                    ->toMediaCollection('event_gallery');
                                $imported++;
                                $existingGalleryUrls[] = $legacyMedia->url;
                            } catch (\Throwable $exception) {
                                $failed++;
                            }
                        }

                        Notification::make()
                            ->title('Importacao concluida')
                            ->body("Importados: {$imported}. Ignorados: {$skipped}. Falhas: {$failed}.")
                            ->success()
                            ->send();
                    })
                    ->visible(fn(): bool => auth()->user()?->hasRole('admin') ?? false),
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

    public static function getRelations(): array
    {
        return [
            SchedulesRelationManager::class,
            MediaRelationManager::class,
            TagsRelationManager::class,
            TicketRelationManager::class,
            LinksRelationManager::class,
            DaysRelationManager::class,
            RsvpsRelationManager::class,
        ];
    }

    public static function canCreate(): bool
    {
        return auth()->user()?->hasRole('admin') ?? false;
    }
}
