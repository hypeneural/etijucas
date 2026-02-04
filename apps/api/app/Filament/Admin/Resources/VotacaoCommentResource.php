<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domains\Votes\Models\Votacao;
use App\Filament\Admin\Resources\VotacaoCommentResource\Pages;
use App\Models\Comment;
use Filament\Forms;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Tables;
use Filament\Tables\Actions\Action;
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

class VotacaoCommentResource extends BaseResource
{
    protected static ?string $model = Comment::class;

    protected static ?string $navigationGroup = 'Vota??es';

    protected static ?string $navigationIcon = 'heroicon-o-chat-bubble-left-right';

    protected static ?string $navigationLabel = 'Coment?rios (Vota??es)';

    protected static ?string $modelLabel = 'Coment?rio (Votacao)';

    protected static ?string $pluralModelLabel = 'Coment?rios (Vota??es)';

    protected static ?int $navigationSort = 22;

    protected static array $defaultEagerLoad = ['user', 'parent', 'commentable'];

    protected static array $defaultWithCount = ['replies'];

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->votacao();
    }

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
                        Select::make('commentable_id')
                            ->label('Votacao')
                            ->options(fn () => Votacao::query()->orderByDesc('data')->limit(200)->pluck('titulo', 'id'))
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
                TextColumn::make('commentable.titulo')
                    ->label('Votacao')
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
                TextColumn::make('likes_count')
                    ->label('Likes')
                    ->sortable()
                    ->alignCenter(),
                ...static::baseTableColumns(),
            ])
            ->filters([
                SelectFilter::make('commentable_id')
                    ->label('Votacao')
                    ->options(fn () => Votacao::query()->orderByDesc('data')->limit(200)->pluck('titulo', 'id')),
                SelectFilter::make('user_id')
                    ->label('Autor')
                    ->relationship('user', 'nome')
                    ->preload(),
                Tables\Filters\Filter::make('has_image')
                    ->label('Com imagem')
                    ->query(fn(Builder $query): Builder => $query->whereNotNull('image_url')),
                Tables\Filters\Filter::make('is_anon')
                    ->label('An?nimos')
                    ->query(fn(Builder $query): Builder => $query->where('is_anon', true)),
                ...static::baseTableFilters(),
            ])
            ->actions([
                Action::make('resetLikes')
                    ->label('Resetar likes')
                    ->icon('heroicon-o-heart')
                    ->requiresConfirmation()
                    ->action(function (Comment $record): void {
                        $record->likes()->detach();
                        $record->forceFill(['likes_count' => 0])->saveQuietly();
                    })
                    ->visible(fn (): bool => auth()->user()?->hasAnyRole(['admin', 'moderator']) ?? false),
                ViewAction::make(),
                EditAction::make()->requiresConfirmation(),
                DeleteAction::make()
                    ->requiresConfirmation()
                    ->using(function (Comment $record): bool {
                        $commentable = $record->commentable;
                        if (! $record->trashed() && $commentable instanceof Votacao) {
                            $commentable->decrement('comments_count');
                        }

                        $deleted = (bool) $record->delete();

                        if ($deleted && function_exists('activity')) {
                            activity()
                                ->causedBy(auth()->user())
                                ->performedOn($record)
                                ->withProperties([
                                    'votacao_id' => $record->commentable_id,
                                ])
                                ->log('votacao_comment_deleted');
                        }

                        return $deleted;
                    })
                    ->visible(fn(): bool => auth()->user()?->hasAnyRole(['admin', 'moderator']) ?? false),
                RestoreAction::make()
                    ->requiresConfirmation()
                    ->using(function (Comment $record): bool {
                        $restored = (bool) $record->restore();
                        if ($restored && $record->commentable instanceof Votacao) {
                            $record->commentable->increment('comments_count');
                        }

                        if ($restored && function_exists('activity')) {
                            activity()
                                ->causedBy(auth()->user())
                                ->performedOn($record)
                                ->withProperties([
                                    'votacao_id' => $record->commentable_id,
                                ])
                                ->log('votacao_comment_restored');
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
            'index' => Pages\ListVotacaoComments::route('/'),
            'view' => Pages\ViewVotacaoComment::route('/{record}'),
            'edit' => Pages\EditVotacaoComment::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }
}
