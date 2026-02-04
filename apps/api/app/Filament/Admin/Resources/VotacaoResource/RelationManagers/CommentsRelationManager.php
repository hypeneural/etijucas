<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\VotacaoResource\RelationManagers;

use App\Domains\Votes\Models\Votacao;
use App\Models\Comment;
use Filament\Forms;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Actions\DeleteAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Actions\ForceDeleteAction;
use Filament\Tables\Actions\RestoreAction;
use Filament\Tables\Actions\ViewAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TrashedFilter;
use Illuminate\Database\Eloquent\Builder;

class CommentsRelationManager extends RelationManager
{
    protected static string $relationship = 'comments';

    protected static ?string $title = 'Coment?rios';

    public function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Coment?rio')
                    ->columns(2)
                    ->schema([
                        Textarea::make('texto')
                            ->label('Texto')
                            ->rows(4)
                            ->required()
                            ->columnSpanFull(),
                        TextInput::make('image_url')
                            ->label('Imagem URL')
                            ->url()
                            ->maxLength(500),
                        Toggle::make('is_anon')
                            ->label('An?nimo'),
                        TextInput::make('likes_count')
                            ->label('Likes')
                            ->numeric()
                            ->disabled()
                            ->dehydrated(false),
                    ]),
            ]);
    }

    public function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->modifyQueryUsing(fn (Builder $query): Builder => $query->with('user'))
            ->columns([
                TextColumn::make('texto')
                    ->label('Coment?rio')
                    ->searchable()
                    ->limit(60),
                TextColumn::make('user.nome')
                    ->label('Autor')
                    ->searchable()
                    ->toggleable(),
                IconColumn::make('is_anon')
                    ->label('Anon')
                    ->boolean()
                    ->toggleable(),
                TextColumn::make('likes_count')
                    ->label('Likes')
                    ->alignCenter()
                    ->sortable(),
                TextColumn::make('created_at')
                    ->label('Criado em')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\Filter::make('has_image')
                    ->label('Com imagem')
                    ->query(fn (Builder $query): Builder => $query->whereNotNull('image_url')),
                Tables\Filters\Filter::make('is_anon')
                    ->label('An?nimos')
                    ->query(fn (Builder $query): Builder => $query->where('is_anon', true)),
                TrashedFilter::make(),
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
            ])
            ->defaultSort('created_at', 'desc');
    }
}
