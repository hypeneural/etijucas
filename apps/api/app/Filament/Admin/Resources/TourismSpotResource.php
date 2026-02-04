<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domains\Tourism\Models\TourismSpot;
use App\Filament\Admin\Resources\Concerns\HasMediaLibraryTrait;
use App\Filament\Admin\Resources\TourismSpotResource\Pages;
use App\Filament\Admin\Resources\TourismSpotResource\RelationManagers\ReviewsRelationManager;
use Filament\Forms;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Notifications\Notification;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Support\Str;

class TourismSpotResource extends BaseResource
{
    use HasMediaLibraryTrait;

    protected static ?string $model = TourismSpot::class;

    protected static ?string $navigationGroup = 'Conte?do';

    protected static ?string $navigationIcon = 'heroicon-o-map';

    protected static ?string $navigationLabel = 'Turismo';

    protected static ?int $navigationSort = 18;

    protected static array $defaultEagerLoad = ['bairro'];

    protected static array $defaultWithCount = ['reviews', 'likes'];

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Ponto turistico')
                    ->columns(2)
                    ->schema([
                        TextInput::make('titulo')
                            ->label('T?tulo')
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
                        TextInput::make('categoria')
                            ->label('Categoria')
                            ->maxLength(120),
                        Select::make('bairro_id')
                            ->label('Bairro')
                            ->relationship('bairro', 'nome')
                            ->searchable()
                            ->preload(),
                        Toggle::make('is_destaque')
                            ->label('Destaque')
                            ->default(false),
                        Toggle::make('is_verificado')
                            ->label('Verificado')
                            ->default(false),
                        TextInput::make('preco')
                            ->label('Preco')
                            ->maxLength(80),
                        TextInput::make('duracao')
                            ->label('Duracao')
                            ->maxLength(80),
                        TextInput::make('dificuldade')
                            ->label('Dificuldade')
                            ->maxLength(80),
                    ]),
                Section::make('Descri??o')
                    ->schema([
                        Textarea::make('desc_curta')
                            ->label('Descri??o curta')
                            ->rows(3),
                        Textarea::make('desc_longa')
                            ->label('Descri??o longa')
                            ->rows(6),
                    ]),
                Section::make('M?dia')
                    ->columns(2)
                    ->schema([
                        static::mediaUploadField('cover', 'tourism_cover', 1)
                            ->label('Imagem principal')
                            ->helperText('Upload preferencial. Gera thumbnails automaticamente.'),
                        static::mediaUploadField('gallery_media', 'tourism_gallery', 6)
                            ->label('Galeria')
                            ->helperText('Imagens adicionais do ponto turistico.'),
                    ]),
                Section::make('M?dia (legado)')
                    ->collapsible()
                    ->collapsed()
                    ->schema([
                        TextInput::make('image_url')
                            ->label('Imagem principal (legado)')
                            ->url()
                            ->maxLength(500),
                        TextInput::make('video_url')
                            ->label('V?deo URL')
                            ->url()
                            ->maxLength(500),
                        Textarea::make('gallery')
                            ->label('Galeria (JSON - legado)')
                            ->rows(3)
                            ->columnSpanFull(),
                    ]),
                Section::make('Localiza??o')
                    ->columns(2)
                    ->schema([
                        TextInput::make('endereco')
                            ->label('Endere?o')
                            ->maxLength(255),
                        TextInput::make('latitude')
                            ->label('Latitude')
                            ->numeric(),
                        TextInput::make('longitude')
                            ->label('Longitude')
                            ->numeric(),
                        Textarea::make('como_chegar')
                            ->label('Como chegar')
                            ->rows(3)
                            ->columnSpanFull(),
                    ]),
                Section::make('Contato')
                    ->columns(2)
                    ->schema([
                        TextInput::make('telefone')
                            ->label('Telefone')
                            ->maxLength(60),
                        TextInput::make('whatsapp')
                            ->label('WhatsApp')
                            ->maxLength(60),
                        TextInput::make('website')
                            ->label('Site')
                            ->url()
                            ->maxLength(200),
                        TextInput::make('instagram')
                            ->label('Instagram')
                            ->maxLength(200),
                    ]),
                Section::make('Extras')
                    ->schema([
                        TagsInput::make('tags')
                            ->label('Tags')
                            ->separator(','),
                        Textarea::make('horarios')
                            ->label('Horarios (JSON)')
                            ->rows(3),
                        Textarea::make('acessibilidade')
                            ->label('Acessibilidade (JSON)')
                            ->rows(3),
                        Textarea::make('dicas_visita')
                            ->label('Dicas (JSON)')
                            ->rows(3),
                    ]),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('titulo')
                    ->label('T?tulo')
                    ->searchable()
                    ->sortable()
                    ->limit(40),
                TextColumn::make('categoria')
                    ->label('Categoria')
                    ->toggleable(),
                TextColumn::make('bairro.nome')
                    ->label('Bairro')
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('reviews_count')
                    ->label('Reviews')
                    ->sortable()
                    ->alignCenter(),
                TextColumn::make('likes_count')
                    ->label('Likes')
                    ->sortable()
                    ->alignCenter(),
                IconColumn::make('is_destaque')
                    ->label('Destaque')
                    ->boolean()
                    ->toggleable(),
                IconColumn::make('is_verificado')
                    ->label('Verificado')
                    ->boolean()
                    ->toggleable(),
                ...static::baseTableColumns(),
            ])
            ->filters([
                SelectFilter::make('bairro_id')
                    ->label('Bairro')
                    ->relationship('bairro', 'nome')
                    ->preload(),
                SelectFilter::make('is_destaque')
                    ->label('Destaque')
                    ->options([
                        1 => 'Sim',
                        0 => 'Nao',
                    ]),
                SelectFilter::make('is_verificado')
                    ->label('Verificado')
                    ->options([
                        1 => 'Sim',
                        0 => 'Nao',
                    ]),
                ...static::baseTableFilters(),
            ])
            ->actions([
                Action::make('importLegacyMedia')
                    ->label('Importar m?dia (URL)')
                    ->icon('heroicon-o-arrow-down-tray')
                    ->requiresConfirmation()
                    ->action(function (TourismSpot $record): void {
                        $imported = 0;
                        $skipped = 0;
                        $failed = 0;

                        if ($record->image_url && $record->getMedia('tourism_cover')->isEmpty()) {
                            try {
                                $record->addMediaFromUrl($record->image_url)->toMediaCollection('tourism_cover');
                                $imported++;
                            } catch (\Throwable $exception) {
                                $failed++;
                            }
                        } else {
                            $skipped++;
                        }

                        $galleryUrls = [];
                        if ($record->gallery) {
                            if (is_array($record->gallery)) {
                                $galleryUrls = $record->gallery;
                            } else {
                                $decoded = json_decode((string) $record->gallery, true);
                                if (is_array($decoded)) {
                                    $galleryUrls = $decoded;
                                } else {
                                    $galleryUrls = preg_split('/\s*,\s*|\R+/', (string) $record->gallery) ?: [];
                                }
                            }
                        }

                        $galleryUrls = array_values(array_filter(array_map('trim', $galleryUrls)));
                        if (!empty($galleryUrls)) {
                            $existingGalleryUrls = $record->getMedia('tourism_gallery')
                                ->map(fn ($media) => $media->getCustomProperty('source_url'))
                                ->filter()
                                ->values()
                                ->all();

                            foreach ($galleryUrls as $url) {
                                if (!$url || in_array($url, $existingGalleryUrls, true)) {
                                    $skipped++;
                                    continue;
                                }

                                try {
                                    $record->addMediaFromUrl($url)
                                        ->withCustomProperties(['source_url' => $url])
                                        ->toMediaCollection('tourism_gallery');
                                    $imported++;
                                    $existingGalleryUrls[] = $url;
                                } catch (\Throwable $exception) {
                                    $failed++;
                                }
                            }
                        }

                        Notification::make()
                            ->title('Importacao concluida')
                            ->body("Importados: {$imported}. Ignorados: {$skipped}. Falhas: {$failed}.")
                            ->success()
                            ->send();
                    })
                    ->visible(fn (): bool => auth()->user()?->hasRole('admin') ?? false),
                ...static::baseTableActions(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListTourismSpots::route('/'),
            'create' => Pages\CreateTourismSpot::route('/create'),
            'edit' => Pages\EditTourismSpot::route('/{record}/edit'),
        ];
    }

    public static function getRelations(): array
    {
        return [
            ReviewsRelationManager::class,
        ];
    }

    public static function canCreate(): bool
    {
        return auth()->user()?->hasRole('admin') ?? false;
    }
}
