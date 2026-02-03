<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\TagResource\Pages;
use App\Models\Tag;
use Filament\Forms;
use Filament\Forms\Components\ColorPicker;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Tables;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Support\Str;

class TagResource extends BaseResource
{
    protected static ?string $model = Tag::class;

    protected static ?string $navigationGroup = 'Conteudo';

    protected static ?string $navigationIcon = 'heroicon-o-tag';

    protected static ?string $navigationLabel = 'Tags';

    protected static ?int $navigationSort = 16;

    protected static array $defaultWithCount = ['events'];

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Tag')
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
                        ColorPicker::make('color')
                            ->label('Cor')
                            ->nullable(),
                        Toggle::make('is_featured')
                            ->label('Destaque')
                            ->default(false),
                        TextInput::make('usage_count')
                            ->label('Uso')
                            ->numeric()
                            ->disabled()
                            ->dehydrated(false),
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
                TextColumn::make('usage_count')
                    ->label('Uso')
                    ->sortable()
                    ->toggleable(),
                IconColumn::make('is_featured')
                    ->label('Destaque')
                    ->boolean()
                    ->sortable(),
                ...static::baseTableColumns(),
            ])
            ->filters([
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
            'index' => Pages\ListTags::route('/'),
            'create' => Pages\CreateTag::route('/create'),
            'edit' => Pages\EditTag::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return auth()->user()?->hasAnyRole(['admin', 'operator']) ?? false;
    }
}
