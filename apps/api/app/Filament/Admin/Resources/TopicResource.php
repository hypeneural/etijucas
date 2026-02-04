<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domain\Forum\Enums\TopicCategory;
use App\Domain\Forum\Enums\TopicStatus;
use App\Domains\Forum\Actions\HideTopicAction;
use App\Domains\Forum\Actions\RestoreTopicAction;
use App\Filament\Admin\Resources\Concerns\HasMediaLibraryTrait;
use App\Filament\Admin\Resources\TopicResource\Pages;
use App\Filament\Admin\Resources\TopicResource\RelationManagers\CommentsRelationManager;
use App\Models\Topic;
use Filament\Forms;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Notifications\Notification;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Actions\DeleteAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Actions\ViewAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Database\Eloquent\Builder;

class TopicResource extends BaseResource
{
    use HasMediaLibraryTrait;

    protected static ?string $model = Topic::class;

    protected static ?string $navigationGroup = 'Forum';

    protected static ?string $navigationIcon = 'heroicon-o-chat-bubble-left-right';

    protected static ?string $navigationLabel = 'Tópicos';

    protected static ?string $modelLabel = 'Tópico';

    protected static ?string $pluralModelLabel = 'Tópicos';

    protected static ?int $navigationSort = 1;

    protected static array $defaultEagerLoad = ['user', 'bairro'];

    protected static array $defaultWithCount = ['reports'];

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Informações do Tópico')
                    ->columns(2)
                    ->schema([
                        TextInput::make('titulo')
                            ->label('Título')
                            ->required()
                            ->maxLength(150),
                        Select::make('categoria')
                            ->label('Categoria')
                            ->options(collect(TopicCategory::cases())
                                ->mapWithKeys(fn(TopicCategory $cat) => [$cat->value => $cat->label()])
                                ->toArray())
                            ->required(),
                        Select::make('bairro_id')
                            ->label('Bairro')
                            ->relationship('bairro', 'nome')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Select::make('status')
                            ->label('Status')
                            ->options(collect(TopicStatus::cases())
                                ->mapWithKeys(fn(TopicStatus $status) => [$status->value => $status->label()])
                                ->toArray())
                            ->required(),
                        Toggle::make('is_anon')
                            ->label('Anônimo')
                            ->helperText('Se marcado, o autor não será exibido publicamente'),
                    ]),
                Section::make('Conteúdo')
                    ->schema([
                        Textarea::make('texto')
                            ->label('Texto')
                            ->required()
                            ->rows(6)
                            ->maxLength(5000),
                        static::mediaUploadField('foto', 'foto', 1)
                            ->label('Foto')
                            ->helperText('Upload preferencial. Gera thumbnails automaticamente.'),
                        TextInput::make('foto_url')
                            ->label('URL da Foto (legado)')
                            ->url()
                            ->maxLength(500)
                            ->helperText('Opcional. Use o upload acima sempre que possível.'),
                    ]),
                Section::make('Autor')
                    ->columns(2)
                    ->schema([
                        Select::make('user_id')
                            ->label('Autor')
                            ->relationship('user', 'nome')
                            ->searchable()
                            ->preload()
                            ->disabled(),
                    ])
                    ->visibleOn('edit'),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('titulo')
                    ->label('Título')
                    ->searchable()
                    ->sortable()
                    ->limit(40),
                TextColumn::make('categoria')
                    ->label('Categoria')
                    ->badge()
                    ->formatStateUsing(fn(TopicCategory $state): string => $state->label())
                    ->color(fn(TopicCategory $state): string => match ($state) {
                        TopicCategory::Reclamacao => 'danger',
                        TopicCategory::Sugestao => 'info',
                        TopicCategory::Duvida => 'warning',
                        TopicCategory::Alerta => 'warning',
                        TopicCategory::Elogio => 'success',
                        TopicCategory::Outros => 'gray',
                    })
                    ->sortable(),
                TextColumn::make('user.nome')
                    ->label('Autor')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('bairro.nome')
                    ->label('Bairro')
                    ->sortable()
                    ->toggleable(),
                IconColumn::make('is_anon')
                    ->label('Anônimo')
                    ->boolean()
                    ->toggleable(),
                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->formatStateUsing(fn(TopicStatus $state): string => $state->label())
                    ->color(fn(TopicStatus $state): string => match ($state) {
                        TopicStatus::Active => 'success',
                        TopicStatus::Hidden => 'warning',
                        TopicStatus::Deleted => 'danger',
                    }),
                TextColumn::make('likes_count')
                    ->label('Likes')
                    ->sortable()
                    ->alignCenter(),
                TextColumn::make('comments_count')
                    ->label('Comentários')
                    ->sortable()
                    ->alignCenter(),
                TextColumn::make('reports_count')
                    ->label('Denúncias')
                    ->sortable()
                    ->alignCenter()
                    ->color(fn(int $state): string => $state > 0 ? 'danger' : 'gray'),
                ...static::baseTableColumns(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('categoria')
                    ->label('Categoria')
                    ->options(collect(TopicCategory::cases())
                        ->mapWithKeys(fn(TopicCategory $cat) => [$cat->value => $cat->label()])
                        ->toArray()),
                SelectFilter::make('status')
                    ->label('Status')
                    ->options(collect(TopicStatus::cases())
                        ->mapWithKeys(fn(TopicStatus $status) => [$status->value => $status->label()])
                        ->toArray()),
                SelectFilter::make('bairro_id')
                    ->label('Bairro')
                    ->relationship('bairro', 'nome')
                    ->preload(),
                Tables\Filters\Filter::make('has_reports')
                    ->label('Com denúncias')
                    ->query(fn(Builder $query): Builder => $query->has('reports')),
                Tables\Filters\Filter::make('is_anon')
                    ->label('Anônimos')
                    ->query(fn(Builder $query): Builder => $query->where('is_anon', true)),
                ...static::baseTableFilters(),
            ])
            ->actions([
                ViewAction::make(),
                EditAction::make(),
                Action::make('importLegacyPhoto')
                    ->label('Importar foto (URL)')
                    ->icon('heroicon-o-arrow-down-tray')
                    ->requiresConfirmation()
                    ->action(function (Topic $record): void {
                        $imported = 0;
                        $skipped = 0;
                        $failed = 0;

                        if (!$record->foto_url) {
                            $skipped++;
                        } elseif ($record->getMedia('foto')->isNotEmpty()) {
                            $skipped++;
                        } else {
                            try {
                                $record->addMediaFromUrl($record->foto_url)->toMediaCollection('foto');
                                $imported++;
                            } catch (\Throwable $exception) {
                                $failed++;
                            }
                        }

                        Notification::make()
                            ->title('Importação concluída')
                            ->body("Importados: {$imported}. Ignorados: {$skipped}. Falhas: {$failed}.")
                            ->success()
                            ->send();
                    })
                    ->visible(fn (): bool => auth()->user()?->hasRole('admin') ?? false),
                Action::make('hide')
                    ->label('Ocultar')
                    ->icon('heroicon-o-eye-slash')
                    ->color('warning')
                    ->requiresConfirmation()
                    ->modalHeading('Ocultar Tópico')
                    ->modalDescription('Este tópico ficará invisível para usuários comuns.')
                    ->form([
                        Textarea::make('motivo')
                            ->label('Motivo')
                            ->rows(3)
                            ->required(),
                    ])
                    ->action(function (Topic $record, array $data): void {
                        app(HideTopicAction::class)->execute($record, auth()->user(), $data['motivo']);
                    })
                    ->visible(fn(Topic $record): bool => $record->status === TopicStatus::Active),
                Action::make('restore')
                    ->label('Restaurar')
                    ->icon('heroicon-o-eye')
                    ->color('success')
                    ->requiresConfirmation()
                    ->action(fn(Topic $record) => app(RestoreTopicAction::class)->execute($record, auth()->user()))
                    ->visible(fn(Topic $record): bool => $record->status === TopicStatus::Hidden),
                DeleteAction::make()
                    ->requiresConfirmation()
                    ->visible(fn() => auth()->user()?->hasRole('admin') ?? false),
            ])
            ->bulkActions([
                Tables\Actions\BulkAction::make('hide')
                    ->label('Ocultar selecionados')
                    ->icon('heroicon-o-eye-slash')
                    ->color('warning')
                    ->requiresConfirmation()
                    ->form([
                        Textarea::make('motivo')
                            ->label('Motivo')
                            ->rows(3)
                            ->required(),
                    ])
                    ->action(function ($records, array $data): void {
                        $action = app(HideTopicAction::class);
                        foreach ($records as $record) {
                            $action->execute($record, auth()->user(), $data['motivo']);
                        }
                    }),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            CommentsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListTopics::route('/'),
            'create' => Pages\CreateTopic::route('/create'),
            'view' => Pages\ViewTopic::route('/{record}'),
            'edit' => Pages\EditTopic::route('/{record}/edit'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        return (string) static::getModel()::whereHas('reports', fn($q) => $q->where('status', 'pending'))->count() ?: null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'danger';
    }
}
