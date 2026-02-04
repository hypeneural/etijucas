<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\EventCategoryResource\Pages;
use App\Models\EventCategory;
use Filament\Forms;
use Filament\Forms\Components\ColorPicker;
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

class EventCategoryResource extends BaseResource
{
    protected static ?string $model = EventCategory::class;

    protected static ?string $navigationGroup = 'Conteudo';

    protected static ?string $navigationIcon = 'heroicon-o-rectangle-stack';

    protected static ?string $navigationLabel = 'Categorias de Eventos';

    protected static ?int $navigationSort = 15;

    protected static array $defaultWithCount = ['events'];

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Categoria')
                    ->columns(2)
                    ->schema([
                        TextInput::make('name')
                            ->label('Nome')
                            ->required()
                            ->maxLength(120)
                            ->live(onBlur: true)
                            ->afterStateUpdated(function (string $state, callable $set): void {
                                $set('slug', Str::slug($state));
                            }),
                        TextInput::make('slug')
                            ->label('Slug')
                            ->required()
                            ->maxLength(120)
                            ->unique(ignoreRecord: true),
                        Textarea::make('description')
                            ->label('Descricao')
                            ->rows(3)
                            ->columnSpanFull(),
                        TextInput::make('icon')
                            ->label('Icone')
                            ->maxLength(120),
                        ColorPicker::make('color')
                            ->label('Cor')
                            ->nullable(),
                        TextInput::make('display_order')
                            ->label('Ordem')
                            ->numeric()
                            ->default(0),
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
                TextColumn::make('slug')
                    ->label('Slug')
                    ->toggleable(),
                TextColumn::make('events_count')
                    ->label('Eventos')
                    ->sortable(),
                TextColumn::make('display_order')
                    ->label('Ordem')
                    ->sortable()
                    ->toggleable(),
                IconColumn::make('is_active')
                    ->label('Ativo')
                    ->boolean()
                    ->sortable(),
                ...static::baseTableColumns(),
            ])
            ->filters([
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
            'index' => Pages\ListEventCategories::route('/'),
            'create' => Pages\CreateEventCategory::route('/create'),
            'edit' => Pages\EditEventCategory::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return auth()->user()?->hasRole('admin') ?? false;
    }
}
