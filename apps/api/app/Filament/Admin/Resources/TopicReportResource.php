<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domain\Forum\Enums\ReportMotivo;
use App\Domain\Forum\Enums\ReportStatus;
use App\Domain\Forum\Enums\TopicStatus;
use App\Filament\Admin\Resources\TopicReportResource\Pages;
use App\Models\TopicReport;
use Filament\Forms;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

class TopicReportResource extends BaseResource
{
    protected static ?string $model = TopicReport::class;

    protected static ?string $navigationGroup = 'Forum';

    protected static ?string $navigationIcon = 'heroicon-o-flag';

    protected static ?string $navigationLabel = 'Denúncias de Tópicos';

    protected static ?string $modelLabel = 'Denúncia';

    protected static ?string $pluralModelLabel = 'Denúncias de Tópicos';

    protected static ?int $navigationSort = 3;

    protected static array $defaultEagerLoad = ['topic', 'user'];

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
                Section::make('Tópico Denunciado')
                    ->schema([
                        Forms\Components\Placeholder::make('topic_titulo')
                            ->label('Título')
                            ->content(fn($record) => $record->topic?->titulo ?? '-'),
                        Forms\Components\Placeholder::make('topic_texto')
                            ->label('Conteúdo')
                            ->content(fn($record) => $record->topic?->texto ?? '-'),
                    ]),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('topic.titulo')
                    ->label('Tópico')
                    ->searchable()
                    ->limit(30)
                    ->url(fn($record) => TopicResource::getUrl('view', ['record' => $record->topic_id])),
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
                ...static::baseTableColumns(),
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
                ...static::baseTableFilters(),
            ])
            ->actions([
                ViewAction::make(),
                Action::make('dismiss')
                    ->label('Ignorar')
                    ->icon('heroicon-o-x-circle')
                    ->color('gray')
                    ->requiresConfirmation()
                    ->action(function (TopicReport $record): void {
                        $record->update(['status' => ReportStatus::Dismissed]);

                        activity()
                            ->causedBy(auth()->user())
                            ->performedOn($record)
                            ->withProperties([
                                'status' => ReportStatus::Dismissed->value,
                            ])
                            ->log('topic_report_dismissed');
                    })
                    ->visible(fn (TopicReport $record) => $record->status === ReportStatus::Pending
                        && (auth()->user()?->hasAnyRole(['admin', 'moderator']) ?? false)),
                Action::make('hideTopic')
                    ->label('Ocultar Topico')
                    ->icon('heroicon-o-eye-slash')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->modalHeading('Ocultar Topico')
                    ->modalDescription('O topico sera ocultado e a denuncia marcada como processada.')
                    ->action(function (TopicReport $record): void {
                        $topicId = $record->topic_id;
                        $record->topic?->update(['status' => TopicStatus::Hidden]);
                        $record->update(['status' => ReportStatus::ActionTaken]);

                        activity()
                            ->causedBy(auth()->user())
                            ->performedOn($record)
                            ->withProperties([
                                'status' => ReportStatus::ActionTaken->value,
                                'topic_id' => $topicId,
                            ])
                            ->log('topic_report_topic_hidden');
                    })
                    ->visible(fn (TopicReport $record) => $record->status === ReportStatus::Pending
                        && (auth()->user()?->hasAnyRole(['admin', 'moderator']) ?? false)),
            ])
            ->bulkActions([
                Tables\Actions\BulkAction::make('dismissAll')
                    ->label('Ignorar selecionados')
                    ->icon('heroicon-o-x-circle')
                    ->requiresConfirmation()
                    ->action(fn($records) => $records->each->update(['status' => ReportStatus::Dismissed]))
                    ->visible(fn (): bool => auth()->user()?->hasAnyRole(['admin', 'moderator']) ?? false),
            ]);
    }


    public static function getPages(): array
    {
        return [
            'index' => Pages\ListTopicReports::route('/'),
            'view' => Pages\ViewTopicReport::route('/{record}'),
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
