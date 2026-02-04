<?php

declare(strict_types=1);

namespace App\Filament\Admin\Pages;

use App\Domains\Reports\Enums\ReportStatus;
use App\Domains\Reports\Models\CitizenReport;
use App\Filament\Admin\Resources\CitizenReportResource;
use App\Filament\Admin\Widgets\ReportsOverviewStats;
use Filament\Pages\Page;
use Filament\Tables\Actions\Action;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Concerns\InteractsWithTable;
use Filament\Tables\Contracts\HasTable;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class ReportsDashboard extends Page implements HasTable
{
    use InteractsWithTable;

    protected static ?string $navigationIcon = 'heroicon-o-chart-bar';

    protected static ?string $navigationLabel = 'Dashboard de Denuncias';

    protected static ?string $navigationGroup = 'Moderacao';

    protected static ?int $navigationSort = 7;

    protected static string $view = 'filament.admin.pages.reports-dashboard';

    public static function canAccess(): bool
    {
        return auth()->user()?->can('page_ReportsDashboard') ?? false;
    }

    protected function getHeaderWidgets(): array
    {
        return [
            ReportsOverviewStats::class,
        ];
    }

    protected function getTableQuery(): Builder
    {
        return CitizenReport::query()
            ->with(['category', 'bairro', 'user'])
            ->whereIn('status', [
                ReportStatus::Recebido->value,
                ReportStatus::EmAnalise->value,
            ])
            ->latest();
    }

    protected function table(Table $table): Table
    {
        return $table->deferLoading();
    }

    protected function getTableColumns(): array
    {
        return [
            TextColumn::make('protocol')
                ->label('Protocolo')
                ->searchable()
                ->sortable(),
            TextColumn::make('title')
                ->label('Titulo')
                ->limit(40)
                ->searchable(),
            TextColumn::make('category.name')
                ->label('Categoria')
                ->searchable()
                ->toggleable(),
            TextColumn::make('bairro.nome')
                ->label('Bairro')
                ->searchable()
                ->toggleable(),
            TextColumn::make('user.nome')
                ->label('Usuario')
                ->searchable()
                ->toggleable(),
            TextColumn::make('status')
                ->label('Status')
                ->badge()
                ->formatStateUsing(fn (ReportStatus $state): string => $state->label())
                ->color(fn (ReportStatus $state): string => match ($state) {
                    ReportStatus::Recebido => 'info',
                    ReportStatus::EmAnalise => 'warning',
                    ReportStatus::Resolvido => 'success',
                    ReportStatus::Rejeitado => 'danger',
                }),
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
                ->url(fn (CitizenReport $record) => CitizenReportResource::getUrl('edit', ['record' => $record]))
                ->openUrlInNewTab(),
        ];
    }
}
