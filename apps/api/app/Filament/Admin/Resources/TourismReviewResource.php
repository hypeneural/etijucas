<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domains\Tourism\Models\TourismReview;
use App\Filament\Admin\Resources\TourismReviewResource\Pages;
use Filament\Forms;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Tables;
use Filament\Tables\Actions\DeleteAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

class TourismReviewResource extends BaseResource
{
    protected static ?string $model = TourismReview::class;

    protected static ?string $navigationGroup = 'Conteudo';

    protected static ?string $navigationIcon = 'heroicon-o-star';

    protected static ?string $navigationLabel = 'Reviews Turismo';

    protected static ?string $modelLabel = 'Review Turismo';

    protected static ?string $pluralModelLabel = 'Reviews Turismo';

    protected static ?int $navigationSort = 19;

    protected static array $defaultEagerLoad = ['spot', 'user'];

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Review')
                    ->columns(2)
                    ->schema([
                        Select::make('spot_id')
                            ->label('Ponto')
                            ->relationship('spot', 'titulo')
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
                        TextInput::make('rating')
                            ->label('Nota')
                            ->numeric()
                            ->required(),
                        DatePicker::make('visit_date')
                            ->label('Data da visita'),
                        TextInput::make('titulo')
                            ->label('Titulo')
                            ->maxLength(200),
                        TextInput::make('likes_count')
                            ->label('Likes')
                            ->numeric()
                            ->disabled()
                            ->dehydrated(false),
                        Textarea::make('texto')
                            ->label('Texto')
                            ->rows(4)
                            ->columnSpanFull(),
                        Textarea::make('fotos')
                            ->label('Fotos (JSON)')
                            ->rows(3)
                            ->columnSpanFull(),
                    ]),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('spot.titulo')
                    ->label('Ponto')
                    ->searchable()
                    ->limit(40)
                    ->sortable(),
                TextColumn::make('user.nome')
                    ->label('Usuario')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('rating')
                    ->label('Nota')
                    ->badge()
                    ->color(fn(int $state): string => match (true) {
                        $state >= 4 => 'success',
                        $state === 3 => 'warning',
                        default => 'danger',
                    })
                    ->sortable(),
                TextColumn::make('titulo')
                    ->label('Titulo')
                    ->limit(30)
                    ->toggleable(),
                TextColumn::make('visit_date')
                    ->label('Visita')
                    ->date('d/m/Y')
                    ->toggleable(),
                TextColumn::make('likes_count')
                    ->label('Likes')
                    ->sortable()
                    ->alignCenter(),
                ...static::baseTableColumns(),
            ])
            ->filters([
                SelectFilter::make('spot_id')
                    ->label('Ponto')
                    ->relationship('spot', 'titulo')
                    ->preload(),
                SelectFilter::make('rating')
                    ->label('Nota')
                    ->options([
                        5 => '5',
                        4 => '4',
                        3 => '3',
                        2 => '2',
                        1 => '1',
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
            'index' => Pages\ListTourismReviews::route('/'),
            'view' => Pages\ViewTourismReview::route('/{record}'),
            'edit' => Pages\EditTourismReview::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }
}
