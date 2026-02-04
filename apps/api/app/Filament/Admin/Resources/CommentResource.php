<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domain\Forum\Enums\ReportStatus as ForumReportStatus;
use App\Filament\Admin\Resources\CommentResource\Pages;
use App\Models\Comment;
use Filament\Forms;
use Filament\Forms\Components\Placeholder;
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
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class CommentResource extends BaseResource
{
    protected static ?string $model = Comment::class;

    protected static ?string $navigationGroup = 'Forum';

    protected static ?string $navigationIcon = 'heroicon-o-chat-bubble-left-right';

    protected static ?string $navigationLabel = 'Comentarios';

    protected static ?string $modelLabel = 'Comentario';

    protected static ?string $pluralModelLabel = 'Comentarios';

    protected static ?int $navigationSort = 2;

    protected static array $defaultEagerLoad = ['topic', 'user', 'parent'];

    protected static array $defaultWithCount = ['reports', 'replies'];

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Comentario')
                    ->columns(2)
                    ->schema([
                        Textarea::make('texto')
                            ->label('Texto')
                            ->rows(5)
                            ->required()
                            ->columnSpanFull(),
                        TextInput::make('image_url')
                            ->label('Imagem URL')
                            ->url()
                            ->maxLength(500),
                        Toggle::make('is_anon')
                            ->label('Anonimo'),
                        TextInput::make('depth')
                            ->label('Nivel')
                            ->numeric()
                            ->disabled()
                            ->dehydrated(false),
                        TextInput::make('likes_count')
                            ->label('Likes')
                            ->numeric()
                            ->disabled()
                            ->dehydrated(false),
                    ]),
                Section::make('Relacionamentos')
                    ->columns(2)
                    ->schema([
                        Select::make('topic_id')
                            ->label('Topico')
                            ->relationship('topic', 'titulo')
                            ->searchable()
                            ->preload()
                            ->disabled()
                            ->dehydrated(false),
                        Select::make('user_id')
                            ->label('Autor')
                            ->relationship('user', 'nome')
                            ->searchable()
                            ->preload()
                            ->disabled()
                            ->dehydrated(false),
                        Placeholder::make('parent_texto')
                            ->label('Resposta a')
                            ->content(fn(?Comment $record): string => Str::limit($record?->parent?->texto ?? '-', 120))
                            ->columnSpanFull(),
                    ]),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('topic.titulo')
                    ->label('Topico')
                    ->searchable()
                    ->limit(40)
                    ->sortable(),
                TextColumn::make('texto')
                    ->label('Comentario')
                    ->searchable()
                    ->limit(50),
                TextColumn::make('user.nome')
                    ->label('Autor')
                    ->searchable()
                    ->toggleable(),
                IconColumn::make('is_anon')
                    ->label('Anon')
                    ->boolean()
                    ->toggleable(),
                TextColumn::make('depth')
                    ->label('Nivel')
                    ->sortable()
                    ->alignCenter(),
                TextColumn::make('replies_count')
                    ->label('Respostas')
                    ->sortable()
                    ->alignCenter(),
                TextColumn::make('reports_count')
                    ->label('Denuncias')
                    ->sortable()
                    ->alignCenter()
                    ->color(fn(int $state): string => $state > 0 ? 'danger' : 'gray'),
                TextColumn::make('likes_count')
                    ->label('Likes')
                    ->sortable()
                    ->alignCenter(),
                ...static::baseTableColumns(),
            ])
            ->filters([
                SelectFilter::make('topic_id')
                    ->label('Topico')
                    ->relationship('topic', 'titulo')
                    ->preload(),
                SelectFilter::make('user_id')
                    ->label('Autor')
                    ->relationship('user', 'nome')
                    ->preload(),
                Tables\Filters\Filter::make('has_reports')
                    ->label('Com denuncias')
                    ->query(fn(Builder $query): Builder => $query->has('reports')),
                Tables\Filters\Filter::make('is_anon')
                    ->label('Anonimos')
                    ->query(fn(Builder $query): Builder => $query->where('is_anon', true)),
                ...static::baseTableFilters(),
            ])
            ->actions([
                ViewAction::make(),
                EditAction::make()->requiresConfirmation(),
                DeleteAction::make()
                    ->requiresConfirmation()
                    ->visible(fn(): bool => auth()->user()?->hasAnyRole(['admin', 'moderator']) ?? false),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListComments::route('/'),
            'view' => Pages\ViewComment::route('/{record}'),
            'edit' => Pages\EditComment::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function getNavigationBadge(): ?string
    {
        return (string) static::getModel()::whereHas('reports', fn($q) => $q->where('status', ForumReportStatus::Pending))->count() ?: null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'danger';
    }
}
