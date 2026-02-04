<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domains\Reports\Models\ReportCategory;
use App\Filament\Admin\Resources\ReportCategoryResource\Pages;
use Filament\Forms;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Toggle;
use Filament\Tables;
use Filament\Tables\Actions\DeleteAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Actions\ViewAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class ReportCategoryResource extends BaseResource
{
    protected static ?string $model = ReportCategory::class;

    protected static ?string $navigationGroup = 'Moderacao';

    protected static ?string $navigationIcon = 'heroicon-o-rectangle-stack';

    protected static ?string $navigationLabel = 'Categorias de Denuncia';

    protected static ?string $modelLabel = 'Categoria';

    protected static ?string $pluralModelLabel = 'Categorias de Denuncia';

    protected static ?int $navigationSort = 7;

    protected static array $defaultWithCount = ['reports'];

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
                            ->maxLength(100)
                            ->live(onBlur: true)
                            ->afterStateUpdated(function (string $state, callable $set): void {
                                $set('slug', Str::slug($state));
                            }),
                        TextInput::make('slug')
                            ->label('Slug')
                            ->required()
                            ->maxLength(100)
                            ->unique(ignoreRecord: true),
                        TextInput::make('icon')
                            ->label('Icone')
                            ->maxLength(50),
                        TextInput::make('color')
                            ->label('Cor')
                            ->maxLength(20),
                        Toggle::make('active')
                            ->label('Ativo')
                            ->default(true),
                        TextInput::make('sort_order')
                            ->label('Ordem')
                            ->numeric()
                            ->default(0),
                    ]),
                Section::make('Dicas')
                    ->schema([
                        TagsInput::make('tips')
                            ->label('Dicas')
                            ->separator(','),
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
                TextColumn::make('icon')
                    ->label('Icone')
                    ->toggleable(),
                TextColumn::make('color')
                    ->label('Cor')
                    ->toggleable(),
                IconColumn::make('active')
                    ->label('Ativo')
                    ->boolean()
                    ->toggleable(),
                TextColumn::make('sort_order')
                    ->label('Ordem')
                    ->sortable()
                    ->alignCenter(),
                TextColumn::make('reports_count')
                    ->label('Denuncias')
                    ->sortable()
                    ->alignCenter(),
                ...static::baseTableColumns(),
            ])
            ->filters([
                SelectFilter::make('active')
                    ->label('Ativo')
                    ->options([
                        1 => 'Sim',
                        0 => 'Nao',
                    ]),
                Tables\Filters\Filter::make('has_reports')
                    ->label('Com denuncias')
                    ->query(fn(Builder $query): Builder => $query->has('reports')),
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
            'index' => Pages\ListReportCategories::route('/'),
            'create' => Pages\CreateReportCategory::route('/create'),
            'edit' => Pages\EditReportCategory::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return auth()->user()?->hasRole('admin') ?? false;
    }
}
