<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domains\Reports\Enums\LocationQuality;
use App\Domains\Reports\Enums\ReportStatus;
use App\Domains\Reports\Actions\AssignReportAction;
use App\Domains\Reports\Actions\UpdateReportStatusAction;
use App\Domains\Reports\Models\CitizenReport;
use App\Filament\Admin\Resources\CitizenReportResource\Pages;
use App\Filament\Admin\Resources\CitizenReportResource\RelationManagers\MediaRelationManager;
use App\Filament\Admin\Resources\CitizenReportResource\RelationManagers\StatusHistoryRelationManager;
use App\Filament\Admin\Resources\Concerns\HasMediaLibraryTrait;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Components\Actions;
use Filament\Forms\Components\Actions\Action as FormAction;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\HtmlString;

class CitizenReportResource extends BaseResource
{
    use HasMediaLibraryTrait;

    protected static ?string $model = CitizenReport::class;

    protected static ?string $navigationGroup = 'Moderacao';

    protected static ?string $navigationIcon = 'heroicon-o-flag';

    protected static ?string $navigationLabel = 'Denuncias';

    protected static ?int $navigationSort = 6;

    protected static array $defaultEagerLoad = ['user', 'category', 'bairro', 'assignedTo'];

    protected static array $defaultWithCount = ['media'];

    private const SLA_DAYS = 7;

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Denuncia')
                    ->columns(2)
                    ->schema([
                        TextInput::make('protocol')
                            ->label('Protocolo')
                            ->disabled()
                            ->dehydrated(false),
                        TextInput::make('title')
                            ->label('Titulo')
                            ->required()
                            ->maxLength(200),
                        Select::make('status')
                            ->label('Status')
                            ->options(collect(ReportStatus::cases())
                                ->mapWithKeys(fn (ReportStatus $status) => [$status->value => $status->label()])
                                ->toArray())
                            ->required()
                            ->disabled()
                            ->dehydrated(false),
                        Select::make('category_id')
                            ->label('Categoria')
                            ->relationship('category', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Select::make('bairro_id')
                            ->label('Bairro')
                            ->relationship('bairro', 'nome')
                            ->searchable()
                            ->preload(),
                        Select::make('user_id')
                            ->label('Usuario')
                            ->relationship('user', 'nome')
                            ->searchable()
                            ->preload()
                            ->disabled()
                            ->dehydrated(false),
                        Select::make('assigned_to')
                            ->label('Responsavel')
                            ->options(fn () => User::role(['admin', 'moderator'])
                                ->orderBy('nome')
                                ->pluck('nome', 'id')
                                ->toArray())
                            ->searchable()
                            ->preload()
                            ->disabled()
                            ->dehydrated(false)
                            ->visible(fn (): bool => auth()->user()?->hasAnyRole(['admin', 'moderator']) ?? false),
                        DateTimePicker::make('assigned_at')
                            ->label('Atribuido em')
                            ->disabled()
                            ->dehydrated(false),
                    ]),
                Section::make('Descricao')
                    ->schema([
                        Textarea::make('description')
                            ->label('Descricao')
                            ->rows(5)
                            ->required(),
                    ]),
                Section::make('Localizacao')
                    ->columns(2)
                    ->schema([
                        TextInput::make('address_text')
                            ->label('Endereco')
                            ->maxLength(255),
                        Select::make('location_quality')
                            ->label('Qualidade')
                            ->options(collect(LocationQuality::cases())
                                ->mapWithKeys(fn (LocationQuality $quality) => [$quality->value => $quality->label()])
                                ->toArray()),
                        TextInput::make('latitude')
                            ->label('Latitude')
                            ->numeric(),
                        TextInput::make('longitude')
                            ->label('Longitude')
                            ->numeric(),
                        TextInput::make('location_accuracy_m')
                            ->label('Precisao (m)')
                            ->numeric(),
                        DateTimePicker::make('resolved_at')
                            ->label('Resolvido em'),
                        Placeholder::make('map_preview')
                            ->label('Mapa')
                            ->content(function (?CitizenReport $record): HtmlString {
                                if (! $record) {
                                    return new HtmlString('<span class="text-sm text-gray-500">Sem dados de localizacao.</span>');
                                }

                                $mapUrl = null;
                                $embedUrl = null;

                                if (filled($record->latitude) && filled($record->longitude)) {
                                    $query = $record->latitude . ',' . $record->longitude;
                                    $mapUrl = 'https://www.google.com/maps/search/?api=1&query=' . $query;
                                    $embedUrl = 'https://maps.google.com/maps?q=' . $query . '&z=15&output=embed';
                                } elseif (filled($record->address_text)) {
                                    $query = rawurlencode($record->address_text);
                                    $mapUrl = 'https://www.google.com/maps/search/?api=1&query=' . $query;
                                    $embedUrl = 'https://maps.google.com/maps?q=' . $query . '&z=15&output=embed';
                                }

                                if (! $mapUrl || ! $embedUrl) {
                                    return new HtmlString('<span class="text-sm text-gray-500">Sem localizacao informada.</span>');
                                }

                                $iframe = sprintf(
                                    '<div class="aspect-video overflow-hidden rounded-lg border border-gray-200 bg-gray-50"><iframe src="%s" class="h-full w-full" loading="lazy"></iframe></div>',
                                    e($embedUrl)
                                );

                                $link = sprintf(
                                    '<a href="%s" target="_blank" rel="noopener" class="mt-2 inline-flex text-sm font-medium text-primary-600 hover:text-primary-700">Abrir no mapa</a>',
                                    e($mapUrl)
                                );

                                return new HtmlString($iframe . $link);
                            })
                            ->columnSpanFull(),
                        Actions::make([
                            FormAction::make('openMap')
                                ->label('Abrir mapa')
                                ->icon('heroicon-o-map')
                                ->url(function (?CitizenReport $record): ?string {
                                    if (! $record) {
                                        return null;
                                    }

                                    if (filled($record->latitude) && filled($record->longitude)) {
                                        return 'https://www.google.com/maps/search/?api=1&query='
                                            . $record->latitude . ',' . $record->longitude;
                                    }

                                    if (filled($record->address_text)) {
                                        return 'https://www.google.com/maps/search/?api=1&query='
                                            . rawurlencode($record->address_text);
                                    }

                                    return null;
                                })
                                ->openUrlInNewTab()
                                ->visible(fn (?CitizenReport $record): bool => (bool) $record
                                    && (filled($record->latitude) || filled($record->address_text))),
                        ])
                            ->columnSpanFull(),
                    ]),
                Section::make('Midia')
                    ->schema([
                        static::mediaUploadField('images', 'report_images', 3)
                            ->label('Imagens')
                            ->columnSpanFull(),
                    ]),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->deferLoading()
            ->columns([
                TextColumn::make('protocol')
                    ->label('Protocolo')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('title')
                    ->label('Titulo')
                    ->searchable()
                    ->limit(40),
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
                TextColumn::make('assignedTo.nome')
                    ->label('Responsavel')
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
                TextColumn::make('media_count')
                    ->label('Midias')
                    ->sortable()
                    ->alignCenter(),
                TextColumn::make('tempo_aberto')
                    ->label('Em aberto')
                    ->getStateUsing(function (CitizenReport $record): string {
                        $end = $record->resolved_at ?? now();
                        $days = $record->created_at?->diffInDays($end) ?? 0;
                        $hours = $record->created_at?->diffInHours($end) ?? 0;
                        $hoursRemainder = $hours % 24;

                        if ($days > 0) {
                            return "{$days}d {$hoursRemainder}h";
                        }

                        return "{$hours}h";
                    })
                    ->color(function (CitizenReport $record): string {
                        $end = $record->resolved_at ?? now();
                        $days = $record->created_at?->diffInDays($end) ?? 0;

                        if (in_array($record->status, [ReportStatus::Recebido, ReportStatus::EmAnalise], true)
                            && $days >= self::SLA_DAYS) {
                            return 'danger';
                        }

                        return 'gray';
                    })
                    ->tooltip(fn (): string => 'SLA padrao: ' . self::SLA_DAYS . ' dias'),
                ...static::baseTableColumns(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Status')
                    ->options(collect(ReportStatus::cases())
                        ->mapWithKeys(fn (ReportStatus $status) => [$status->value => $status->label()])
                        ->toArray()),
                SelectFilter::make('category_id')
                    ->label('Categoria')
                    ->relationship('category', 'name')
                    ->preload(),
                SelectFilter::make('bairro_id')
                    ->label('Bairro')
                    ->relationship('bairro', 'nome')
                    ->preload(),
                SelectFilter::make('assigned_to')
                    ->label('Responsavel')
                    ->options(fn () => User::role(['admin', 'moderator'])
                        ->orderBy('nome')
                        ->pluck('nome', 'id')
                        ->toArray()),
                Tables\Filters\Filter::make('sem_responsavel')
                    ->label('Sem responsavel')
                    ->query(fn (Builder $query): Builder => $query->whereNull('assigned_to')),
                Tables\Filters\Filter::make('sla_atrasado')
                    ->label('SLA atrasado')
                    ->query(function (Builder $query): Builder {
                        return $query->whereIn('status', [
                                ReportStatus::Recebido->value,
                                ReportStatus::EmAnalise->value,
                            ])
                            ->where('created_at', '<=', now()->subDays(self::SLA_DAYS));
                    }),
                ...static::baseTableFilters(),
            ])
            ->actions([
                Action::make('assignMe')
                    ->label('Assumir')
                    ->icon('heroicon-o-user-plus')
                    ->color('info')
                    ->requiresConfirmation()
                    ->action(function (CitizenReport $record): void {
                        $user = auth()->user();
                        if (!$user) {
                            return;
                        }

                        app(AssignReportAction::class)->execute(
                            $record,
                            $user,
                            $user
                        );
                    })
                    ->visible(fn (): bool => auth()->user()?->hasAnyRole(['admin', 'moderator']) ?? false),
                Action::make('assign')
                    ->label('Atribuir')
                    ->icon('heroicon-o-user-group')
                    ->form([
                        Select::make('assigned_to')
                            ->label('Responsavel')
                            ->options(fn () => User::role(['admin', 'moderator'])
                                ->orderBy('nome')
                                ->pluck('nome', 'id')
                                ->toArray())
                            ->searchable()
                            ->required(),
                        Textarea::make('note')
                            ->label('Nota')
                            ->rows(3),
                    ])
                    ->action(function (CitizenReport $record, array $data): void {
                        $assignee = User::find($data['assigned_to']);
                        app(AssignReportAction::class)->execute(
                            $record,
                            $assignee,
                            auth()->user(),
                            $data['note'] ?? null
                        );
                    })
                    ->visible(fn (): bool => auth()->user()?->hasAnyRole(['admin', 'moderator']) ?? false),
                Action::make('updateStatus')
                    ->label('Alterar status')
                    ->icon('heroicon-o-adjustments-horizontal')
                    ->color('warning')
                    ->form([
                        Select::make('status')
                            ->label('Status')
                            ->options(collect(ReportStatus::cases())
                                ->mapWithKeys(fn (ReportStatus $status) => [$status->value => $status->label()])
                                ->toArray())
                            ->required(),
                        Textarea::make('note')
                            ->label('Nota')
                            ->rows(3),
                    ])
                    ->action(function (CitizenReport $record, array $data): void {
                        app(UpdateReportStatusAction::class)->execute(
                            $record,
                            ReportStatus::from($data['status']),
                            $data['note'] ?? null,
                            auth()->user()
                        );
                    })
                    ->visible(fn (): bool => auth()->user()?->hasAnyRole(['admin', 'moderator']) ?? false),
                ...static::baseTableActions(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListCitizenReports::route('/'),
            'edit' => Pages\EditCitizenReport::route('/{record}/edit'),
        ];
    }

    public static function getRelations(): array
    {
        return [
            StatusHistoryRelationManager::class,
            MediaRelationManager::class,
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }
}
