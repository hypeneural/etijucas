<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domains\Reports\Enums\LocationQuality;
use App\Domains\Reports\Enums\ReportStatus;
use App\Domains\Reports\Models\CitizenReport;
use App\Filament\Admin\Resources\CitizenReportResource\Pages;
use App\Filament\Admin\Resources\CitizenReportResource\RelationManagers\MediaRelationManager;
use App\Filament\Admin\Resources\CitizenReportResource\RelationManagers\StatusHistoryRelationManager;
use App\Filament\Admin\Resources\Concerns\HasMediaLibraryTrait;
use Filament\Forms;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

class CitizenReportResource extends BaseResource
{
    use HasMediaLibraryTrait;

    protected static ?string $model = CitizenReport::class;

    protected static ?string $navigationGroup = 'Moderacao';

    protected static ?string $navigationIcon = 'heroicon-o-flag';

    protected static ?string $navigationLabel = 'Denuncias';

    protected static ?int $navigationSort = 6;

    protected static array $defaultEagerLoad = ['user', 'category', 'bairro'];

    protected static array $defaultWithCount = ['media'];

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
                    ->toggleable(),
                TextColumn::make('bairro.nome')
                    ->label('Bairro')
                    ->toggleable(),
                TextColumn::make('user.nome')
                    ->label('Usuario')
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
                ...static::baseTableFilters(),
            ])
            ->actions([
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
                        $previousStatus = $record->status;
                        $record->updateStatus(
                            ReportStatus::from($data['status']),
                            $data['note'] ?? null,
                            auth()->id()
                        );

                        activity()
                            ->causedBy(auth()->user())
                            ->performedOn($record)
                            ->withProperties([
                                'old' => $previousStatus?->value,
                                'new' => $data['status'],
                                'note' => $data['note'] ?? null,
                            ])
                            ->log('citizen_report_status_updated');
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
