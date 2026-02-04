<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domains\Tourism\Models\TourismSpot;
use App\Filament\Admin\Resources\TourismSpotResource\Pages;
use App\Filament\Admin\Resources\TourismSpotResource\RelationManagers\ReviewsRelationManager;
use Filament\Forms;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Tables;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Support\Str;

class TourismSpotResource extends BaseResource
{
    protected static ?string $model = TourismSpot::class;

    protected static ?string $navigationGroup = 'Conteudo';

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
                Section::make('Descricao')
                    ->schema([
                        Textarea::make('desc_curta')
                            ->label('Descricao curta')
                            ->rows(3),
                        Textarea::make('desc_longa')
                            ->label('Descricao longa')
                            ->rows(6),
                    ]),
                Section::make('Midia')
                    ->columns(2)
                    ->schema([
                        TextInput::make('image_url')
                            ->label('Imagem principal')
                            ->url()
                            ->maxLength(500),
                        TextInput::make('video_url')
                            ->label('Video URL')
                            ->url()
                            ->maxLength(500),
                        Textarea::make('gallery')
                            ->label('Galeria (JSON)')
                            ->rows(3)
                            ->columnSpanFull(),
                    ]),
                Section::make('Localizacao')
                    ->columns(2)
                    ->schema([
                        TextInput::make('endereco')
                            ->label('Endereco')
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
                    ->label('Titulo')
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
        return auth()->user()?->hasAnyRole(['admin', 'operator']) ?? false;
    }
}
