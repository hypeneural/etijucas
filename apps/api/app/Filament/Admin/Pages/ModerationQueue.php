<?php

declare(strict_types=1);

namespace App\Filament\Admin\Pages;

use App\Domain\Forum\Enums\ReportStatus as ForumReportStatus;
use App\Domain\Moderation\Enums\FlagStatus;
use App\Domains\Reports\Enums\ReportStatus as CitizenReportStatus;
use App\Filament\Admin\Resources\CitizenReportResource;
use App\Filament\Admin\Resources\CommentReportResource;
use App\Filament\Admin\Resources\ContentFlagResource;
use App\Filament\Admin\Resources\TopicReportResource;
use App\Models\ModerationQueueItem;
use App\Support\Tenant;
use Filament\Pages\Page;
use Filament\Tables\Actions\Action;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Concerns\InteractsWithTable;
use Filament\Tables\Contracts\HasTable;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class ModerationQueue extends Page implements HasTable
{
    use InteractsWithTable;

    protected static ?string $navigationIcon = 'heroicon-o-queue-list';

    protected static ?string $navigationLabel = 'Fila de Moderação';

    protected static ?string $navigationGroup = 'Modera??o';

    protected static ?string $title = 'Fila de Moderação';

    protected static ?int $navigationSort = 5;

    protected static string $view = 'filament.admin.pages.moderation-queue';

    public function getSubheading(): ?string
    {
        return 'Fila única com denúncias, reports e flags pendentes.';
    }

    public static function canAccess(): bool
    {
        return auth()->user()?->can('page_ModerationQueue') ?? false;
    }

    protected function getTableQuery(): Builder
    {
        $cityId = Tenant::cityId();
        if (!is_string($cityId) || $cityId === '') {
            return ModerationQueueItem::query()->whereRaw('1 = 0');
        }

        $flags = DB::table('content_flags')
            ->select([
                'content_flags.id as id',
                DB::raw("'flag' as kind"),
                'content_flags.status as status',
                'content_flags.reason as title',
                'content_flags.message as description',
                'content_flags.created_at as created_at',
            ])
            ->whereIn('content_flags.status', [
                FlagStatus::Open->value,
                FlagStatus::Reviewing->value,
            ])
            ->where(function ($query) use ($cityId): void {
                $query
                    ->where(function ($q) use ($cityId): void {
                        $q->where('content_flags.content_type', 'topic')
                            ->whereExists(function ($subQuery) use ($cityId): void {
                                $subQuery->select(DB::raw('1'))
                                    ->from('topics')
                                    ->whereColumn('topics.id', 'content_flags.content_id')
                                    ->where('topics.city_id', $cityId);
                            });
                    })
                    ->orWhere(function ($q) use ($cityId): void {
                        $q->where('content_flags.content_type', 'comment')
                            ->whereExists(function ($subQuery) use ($cityId): void {
                                $subQuery->select(DB::raw('1'))
                                    ->from('comments')
                                    ->whereColumn('comments.id', 'content_flags.content_id')
                                    ->where('comments.city_id', $cityId);
                            });
                    })
                    ->orWhere(function ($q) use ($cityId): void {
                        $q->where('content_flags.content_type', 'report')
                            ->whereExists(function ($subQuery) use ($cityId): void {
                                $subQuery->select(DB::raw('1'))
                                    ->from('citizen_reports')
                                    ->whereColumn('citizen_reports.id', 'content_flags.content_id')
                                    ->where('citizen_reports.city_id', $cityId);
                            });
                    })
                    ->orWhere(function ($q) use ($cityId): void {
                        $q->where('content_flags.content_type', 'user')
                            ->whereExists(function ($subQuery) use ($cityId): void {
                                $subQuery->select(DB::raw('1'))
                                    ->from('users')
                                    ->whereColumn('users.id', 'content_flags.content_id')
                                    ->where('users.city_id', $cityId);
                            });
                    });
            });

        $topicReports = DB::table('topic_reports')
            ->leftJoin('topics', 'topic_reports.topic_id', '=', 'topics.id')
            ->select([
                'topic_reports.id as id',
                DB::raw("'topic_report' as kind"),
                'topic_reports.status as status',
                'topics.titulo as title',
                'topic_reports.descricao as description',
                'topic_reports.created_at as created_at',
            ])
            ->where('topic_reports.status', ForumReportStatus::Pending->value)
            ->where('topics.city_id', $cityId);

        $commentReports = DB::table('comment_reports')
            ->leftJoin('comments', 'comment_reports.comment_id', '=', 'comments.id')
            ->leftJoin('topics', 'comments.topic_id', '=', 'topics.id')
            ->select([
                'comment_reports.id as id',
                DB::raw("'comment_report' as kind"),
                'comment_reports.status as status',
                'topics.titulo as title',
                'comment_reports.descricao as description',
                'comment_reports.created_at as created_at',
            ])
            ->where('comment_reports.status', ForumReportStatus::Pending->value)
            ->where('comments.city_id', $cityId);

        $citizenReports = DB::table('citizen_reports')
            ->select([
                'citizen_reports.id as id',
                DB::raw("'citizen_report' as kind"),
                'citizen_reports.status as status',
                'citizen_reports.title as title',
                'citizen_reports.description as description',
                'citizen_reports.created_at as created_at',
            ])
            ->whereIn('citizen_reports.status', [
                CitizenReportStatus::Recebido->value,
                CitizenReportStatus::EmAnalise->value,
            ])
            ->where('citizen_reports.city_id', $cityId);

        $union = $flags
            ->unionAll($topicReports)
            ->unionAll($commentReports)
            ->unionAll($citizenReports);

        return ModerationQueueItem::query()
            ->fromSub($union, 'moderation_queue')
            ->orderBy('created_at', 'desc');
    }

    protected function table(Table $table): Table
    {
        return $table->deferLoading();
    }

    protected function getTableColumns(): array
    {
        return [
            TextColumn::make('kind')
                ->label('Tipo')
                ->badge()
                ->formatStateUsing(fn(string $state): string => match ($state) {
                    'flag' => 'Flag',
                    'topic_report' => 'T?pico',
                    'comment_report' => 'Coment?rio',
                    'citizen_report' => 'Den?ncia',
                    default => $state,
                })
                ->color(fn(string $state): string => match ($state) {
                    'flag' => 'warning',
                    'topic_report', 'comment_report' => 'info',
                    'citizen_report' => 'success',
                    default => 'gray',
                }),
            TextColumn::make('status')
                ->label('Status')
                ->badge()
                ->formatStateUsing(function (string $state, $record): string {
                    return match ($record->kind) {
                        'flag' => FlagStatus::tryFrom($state)?->label() ?? $state,
                        'citizen_report' => CitizenReportStatus::tryFrom($state)?->label() ?? $state,
                        default => ForumReportStatus::tryFrom($state)?->label() ?? $state,
                    };
                })
                ->color(function (string $state, $record): string {
                    return match ($record->kind) {
                        'flag' => match (FlagStatus::tryFrom($state)) {
                                FlagStatus::Open => 'warning',
                                FlagStatus::Reviewing => 'info',
                                FlagStatus::ActionTaken => 'success',
                                FlagStatus::Dismissed => 'gray',
                                default => 'gray',
                            },
                        'citizen_report' => match (CitizenReportStatus::tryFrom($state)) {
                                CitizenReportStatus::Recebido => 'info',
                                CitizenReportStatus::EmAnalise => 'warning',
                                CitizenReportStatus::Resolvido => 'success',
                                CitizenReportStatus::Rejeitado => 'danger',
                                default => 'gray',
                            },
                        default => match (ForumReportStatus::tryFrom($state)) {
                                ForumReportStatus::Pending => 'warning',
                                ForumReportStatus::Reviewed => 'info',
                                ForumReportStatus::Dismissed => 'gray',
                                ForumReportStatus::ActionTaken => 'success',
                                default => 'gray',
                            },
                    };
                }),
            TextColumn::make('title')
                ->label('T?tulo')
                ->limit(40)
                ->searchable()
                ->toggleable(),
            TextColumn::make('description')
                ->label('Detalhe')
                ->limit(50)
                ->toggleable(),
            TextColumn::make('created_at')
                ->label('Criado em')
                ->dateTime('d/m/Y H:i')
                ->sortable(),
        ];
    }

    protected function getTableActions(): array
    {
        return [
            Action::make('open')
                ->label('Abrir')
                ->icon('heroicon-o-arrow-top-right-on-square')
                ->url(function ($record): ?string {
                    return match ($record->kind) {
                        'flag' => ContentFlagResource::getUrl('edit', ['record' => $record->id]),
                        'topic_report' => TopicReportResource::getUrl('view', ['record' => $record->id]),
                        'comment_report' => CommentReportResource::getUrl('view', ['record' => $record->id]),
                        'citizen_report' => CitizenReportResource::getUrl('edit', ['record' => $record->id]),
                        default => null,
                    };
                })
                ->openUrlInNewTab(),
        ];
    }

    protected function getTableFilters(): array
    {
        return [
            SelectFilter::make('kind')
                ->label('Tipo')
                ->options([
                    'flag' => 'Flag',
                    'topic_report' => 'T?pico',
                    'comment_report' => 'Coment?rio',
                    'citizen_report' => 'Den?ncia',
                ]),
            SelectFilter::make('status')
                ->label('Status')
                ->options([
                    FlagStatus::Open->value => FlagStatus::Open->label(),
                    FlagStatus::Reviewing->value => FlagStatus::Reviewing->label(),
                    ForumReportStatus::Pending->value => ForumReportStatus::Pending->label(),
                    CitizenReportStatus::Recebido->value => CitizenReportStatus::Recebido->label(),
                    CitizenReportStatus::EmAnalise->value => CitizenReportStatus::EmAnalise->label(),
                ]),
            SelectFilter::make('priority')
                ->label('Prioridade')
                ->options([
                    'overdue' => 'Atrasados (7d+)',
                    'week' => 'Últimos 7 dias',
                    'day' => 'Últimas 24h',
                ])
                ->query(function (Builder $query, array $data): Builder {
                    return match ($data['value'] ?? null) {
                        'overdue' => $query->where('created_at', '<', now()->subDays(7)),
                        'week' => $query->where('created_at', '>=', now()->subDays(7)),
                        'day' => $query->where('created_at', '>=', now()->subDay()),
                        default => $query,
                    };
                }),
        ];
    }

    public function getTableRecordKey($record): string
    {
        return "{$record->kind}:{$record->id}";
    }
}
