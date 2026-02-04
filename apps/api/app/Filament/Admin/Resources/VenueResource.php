<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\VenueResource\Pages;
use App\Models\Venue;
use Filament\Forms;
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

class VenueResource extends BaseResource
{
    protected static ?string $model = Venue::class;

    protected static ?string $navigationGroup = 'Conteudo';

    protected static ?string $navigationIcon = 'heroicon-o-map-pin';

    protected static ?string $navigationLabel = 'Locais';

    protected static ?int $navigationSort = 17;

    protected static array $defaultEagerLoad = ['bairro'];

    protected static array $defaultWithCount = ['events'];

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Local')
                    ->columns(2)
                    ->schema([
                        TextInput::make('name')
                            ->label('Nome')
                            ->required()
                            ->maxLength(150)
                            ->live(onBlur: true)
                            ->afterStateUpdated(function (string $state, callable $set): void {
                                $set('slug', Str::slug($state));
                            }),
                        TextInput::make('slug')
                            ->label('Slug')
                            ->required()
                            ->maxLength(150)
                            ->unique(ignoreRecord: true),
                        Select::make('bairro_id')
                            ->label('Bairro')
                            ->relationship('bairro', 'nome')
                            ->searchable()
                            ->preload()
                            ->required(),
                        TextInput::make('cep')
                            ->label('CEP')
                            ->maxLength(20),
                        TextInput::make('address')
                            ->label('Endereco')
                            ->maxLength(255),
                        TextInput::make('address_number')
                            ->label('Numero')
                            ->maxLength(20),
                        TextInput::make('address_complement')
                            ->label('Complemento')
                            ->maxLength(120),
                        TextInput::make('latitude')
                            ->label('Latitude')
                            ->numeric(),
                        TextInput::make('longitude')
                            ->label('Longitude')
                            ->numeric(),
                        TextInput::make('capacity')
                            ->label('Capacidade')
                            ->numeric(),
                        TextInput::make('phone')
                            ->label('Telefone')
                            ->maxLength(60),
                        TextInput::make('website')
                            ->label('Site')
                            ->url()
                            ->maxLength(200),
                        Textarea::make('description')
                            ->label('Descricao')
                            ->rows(3)
                            ->columnSpanFull(),
                        Toggle::make('is_active')
                            ->label('Ativo')
                            ->default(true),
                    ]),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->label('Nome')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('bairro.nome')
                    ->label('Bairro')
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('events_count')
                    ->label('Eventos')
                    ->sortable(),
                IconColumn::make('is_active')
                    ->label('Ativo')
                    ->boolean()
                    ->sortable(),
                ...static::baseTableColumns(),
            ])
            ->filters([
                SelectFilter::make('bairro_id')
                    ->label('Bairro')
                    ->relationship('bairro', 'nome')
                    ->preload(),
                SelectFilter::make('is_active')
                    ->label('Ativo')
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
            'index' => Pages\ListVenues::route('/'),
            'create' => Pages\CreateVenue::route('/create'),
            'edit' => Pages\EditVenue::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return auth()->user()?->hasRole('admin') ?? false;
    }
}
