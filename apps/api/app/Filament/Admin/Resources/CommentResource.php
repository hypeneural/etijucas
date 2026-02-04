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
use Filament\Tables\Actions\ForceDeleteAction;
use Filament\Tables\Actions\RestoreAction;
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

    protected static ?string $navigationLabel = 'Coment?rios';

    protected static ?string $modelLabel = 'Coment?rio';

    protected static ?string $pluralModelLabel = 'Coment?rios';

    protected static ?int $navigationSort = 2;

    protected static array $defaultEagerLoad = ['topic', 'user', 'parent'];

    protected static array $defaultWithCount = ['reports', 'replies'];

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Coment?rio')
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
                            ->label('An?nimo'),
                        TextInput::make('depth')
                            ->label('N?vel')
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
                            ->label('T?pico')
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
                    ->label('T?pico')
                    ->searchable()
                    ->limit(40)
                    ->sortable(),
                TextColumn::make('texto')
                    ->label('Coment?rio')
                    ->searchable()
                    ->limit(50),
                TextColumn::make('user.nome')
                    ->label('Autor')
                    ->searchable()
                    ->toggleable(),
                IconColumn::make('is_anon')
                    ->label('An?nimo')
                    ->boolean()
                    ->toggleable(),
                TextColumn::make('depth')
                    ->label('N?vel')
                    ->sortable()
                    ->alignCenter(),
                TextColumn::make('replies_count')
                    ->label('Respostas')
                    ->sortable()
                    ->alignCenter(),
                TextColumn::make('reports_count')
                    ->label('Den?ncias')
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
                    ->label('T?pico')
                    ->relationship('topic', 'titulo')
                    ->preload(),
                SelectFilter::make('user_id')
                    ->label('Autor')
                    ->relationship('user', 'nome')
                    ->preload(),
                Tables\Filters\Filter::make('has_reports')
                    ->label('Com den?ncias')
                    ->query(fn(Builder $query): Builder => $query->has('reports')),
                Tables\Filters\Filter::make('is_anon')
                    ->label('An?nimos')
                    ->query(fn(Builder $query): Builder => $query->where('is_anon', true)),
                ...static::baseTableFilters(),
            ])
            ->actions([
                ViewAction::make(),
                EditAction::make()->requiresConfirmation(),
                DeleteAction::make()
                    ->requiresConfirmation()
                    ->using(function (Comment $record): bool {
                        if (! $record->trashed() && $record->topic) {
                            $record->topic->decrementComments();
                        }

                        $deleted = (bool) $record->delete();

                        if ($deleted && function_exists('activity')) {
                            activity()
                                ->causedBy(auth()->user())
                                ->performedOn($record)
                                ->withProperties([
                                    'topic_id' => $record->topic_id,
                                    'commentable_type' => $record->commentable_type,
                                ])
                                ->log('forum_comment_deleted');
                        }

                        return $deleted;
                    })
                    ->visible(fn(): bool => auth()->user()?->hasAnyRole(['admin', 'moderator']) ?? false),
                RestoreAction::make()
                    ->requiresConfirmation()
                    ->using(function (Comment $record): bool {
                        $restored = (bool) $record->restore();

                        if ($restored && $record->topic) {
                            $record->topic->incrementComments();
                        }

                        if ($restored && function_exists('activity')) {
                            activity()
                                ->causedBy(auth()->user())
                                ->performedOn($record)
                                ->withProperties([
                                    'topic_id' => $record->topic_id,
                                ])
                                ->log('forum_comment_restored');
                        }

                        return $restored;
                    })
                    ->visible(fn(): bool => auth()->user()?->hasAnyRole(['admin', 'moderator']) ?? false),
                ForceDeleteAction::make()
                    ->requiresConfirmation()
                    ->visible(fn(): bool => auth()->user()?->hasRole('admin') ?? false),
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
