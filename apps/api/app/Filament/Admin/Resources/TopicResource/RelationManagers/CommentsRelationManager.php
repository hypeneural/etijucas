<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\TopicResource\RelationManagers;

use App\Models\Comment;
use Filament\Forms\Components\Textarea;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Actions\DeleteAction;
use Filament\Tables\Actions\ForceDeleteAction;
use Filament\Tables\Actions\RestoreAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TrashedFilter;

class CommentsRelationManager extends RelationManager
{
    protected static string $relationship = 'comments';

    protected static ?string $title = 'Comentários';

    protected static ?string $recordTitleAttribute = 'texto';

    public function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('user.nome')
                    ->label('Autor')
                    ->searchable(),
                TextColumn::make('texto')
                    ->label('Texto')
                    ->limit(50)
                    ->wrap(),
                IconColumn::make('is_anon')
                    ->label('Anon')
                    ->boolean(),
                TextColumn::make('depth')
                    ->label('Nível')
                    ->alignCenter(),
                TextColumn::make('likes_count')
                    ->label('Likes')
                    ->sortable()
                    ->alignCenter(),
                TextColumn::make('created_at')
                    ->label('Data')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'asc')
            ->filters([
                Tables\Filters\Filter::make('is_anon')
                    ->label('Anônimos')
                    ->query(fn($query) => $query->where('is_anon', true)),
                TrashedFilter::make(),
            ])
            ->actions([
                Action::make('viewFull')
                    ->label('Ver')
                    ->icon('heroicon-o-eye')
                    ->modalHeading('Comentário Completo')
                    ->modalContent(fn(Comment $record) => view('filament.modals.comment-detail', ['comment' => $record]))
                    ->modalWidth('lg')
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Fechar'),
                DeleteAction::make()
                    ->label('Remover')
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
            ])
            ->bulkActions([
                Tables\Actions\DeleteBulkAction::make(),
            ]);
    }
}
