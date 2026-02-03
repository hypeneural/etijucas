<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domain\Forum\Enums\ReportMotivo;
use App\Domain\Forum\Enums\ReportStatus;
use App\Filament\Admin\Resources\CommentReportResource\Pages;
use App\Models\CommentReport;
use Filament\Forms;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Database\Eloquent\Builder;

class CommentReportResource extends Resource
{
    protected static ?string $model = CommentReport::class;

    protected static ?string $navigationGroup = 'Forum';

    protected static ?string $navigationIcon = 'heroicon-o-flag';

    protected static ?string $navigationLabel = 'Denúncias de Comentários';

    protected static ?string $modelLabel = 'Denúncia';

    protected static ?string $pluralModelLabel = 'Denúncias de Comentários';

    protected static ?int $navigationSort = 4;

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Denúncia')
                    ->columns(2)
                    ->schema([
                        Select::make('motivo')
                            ->label('Motivo')
                            ->options(collect(ReportMotivo::cases())
                                ->mapWithKeys(fn(ReportMotivo $m) => [$m->value => $m->label()])
                                ->toArray())
                            ->disabled(),
                        Select::make('status')
                            ->label('Status')
                            ->options(collect(ReportStatus::cases())
                                ->mapWithKeys(fn(ReportStatus $s) => [$s->value => $s->label()])
                                ->toArray())
                            ->required(),
                        Textarea::make('descricao')
                            ->label('Descrição')
                            ->columnSpanFull()
                            ->disabled(),
                    ]),
                Section::make('Comentário Denunciado')
                    ->schema([
                        Forms\Components\Placeholder::make('comment_texto')
                            ->label('Texto')
                            ->content(fn($record) => $record->comment?->texto ?? '-'),
                        Forms\Components\Placeholder::make('topic_titulo')
                            ->label('Tópico')
                            ->content(fn($record) => $record->comment?->topic?->titulo ?? '-'),
                    ]),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('comment.texto')
                    ->label('Comentário')
                    ->searchable()
                    ->limit(40),
                TextColumn::make('comment.topic.titulo')
                    ->label('Tópico')
                    ->limit(25)
                    ->toggleable(),
                TextColumn::make('user.nome')
                    ->label('Denunciante')
                    ->searchable(),
                TextColumn::make('motivo')
                    ->label('Motivo')
                    ->badge()
                    ->formatStateUsing(fn(ReportMotivo $state): string => $state->label())
                    ->color(fn(ReportMotivo $state): string => match ($state) {
                        ReportMotivo::Spam => 'gray',
                        ReportMotivo::Ofensivo => 'danger',
                        ReportMotivo::Falso => 'warning',
                        ReportMotivo::Outro => 'info',
                    }),
                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->formatStateUsing(fn(ReportStatus $state): string => $state->label())
                    ->color(fn(ReportStatus $state): string => match ($state) {
                        ReportStatus::Pending => 'warning',
                        ReportStatus::Reviewed => 'info',
                        ReportStatus::Dismissed => 'gray',
                        ReportStatus::ActionTaken => 'success',
                    }),
                TextColumn::make('created_at')
                    ->label('Data')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('status')
                    ->label('Status')
                    ->options(collect(ReportStatus::cases())
                        ->mapWithKeys(fn(ReportStatus $s) => [$s->value => $s->label()])
                        ->toArray())
                    ->default(ReportStatus::Pending->value),
                SelectFilter::make('motivo')
                    ->label('Motivo')
                    ->options(collect(ReportMotivo::cases())
                        ->mapWithKeys(fn(ReportMotivo $m) => [$m->value => $m->label()])
                        ->toArray()),
            ])
            ->actions([
                ViewAction::make(),
                Action::make('dismiss')
                    ->label('Ignorar')
                    ->icon('heroicon-o-x-circle')
                    ->color('gray')
                    ->requiresConfirmation()
                    ->action(fn($record) => $record->update(['status' => ReportStatus::Dismissed]))
                    ->visible(fn($record) => $record->status === ReportStatus::Pending),
                Action::make('deleteComment')
                    ->label('Remover Comentário')
                    ->icon('heroicon-o-trash')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->modalHeading('Remover Comentário')
                    ->modalDescription('O comentário será removido permanentemente.')
                    ->action(function ($record) {
                        $record->comment?->delete();
                        $record->update(['status' => ReportStatus::ActionTaken]);
                    })
                    ->visible(fn($record) => $record->status === ReportStatus::Pending),
            ])
            ->bulkActions([
                Tables\Actions\BulkAction::make('dismissAll')
                    ->label('Ignorar selecionados')
                    ->icon('heroicon-o-x-circle')
                    ->requiresConfirmation()
                    ->action(fn($records) => $records->each->update(['status' => ReportStatus::Dismissed])),
            ]);
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->with(['comment.topic', 'user']);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListCommentReports::route('/'),
            'view' => Pages\ViewCommentReport::route('/{record}'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        return (string) static::getModel()::where('status', ReportStatus::Pending)->count() ?: null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'danger';
    }
}
