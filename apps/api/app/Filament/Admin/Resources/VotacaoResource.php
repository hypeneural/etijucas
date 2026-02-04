<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domains\Votes\Enums\StatusVotacao;
use App\Domains\Votes\Models\Votacao;
use App\Filament\Admin\Resources\VotacaoResource\Pages;
use App\Filament\Admin\Resources\VotacaoResource\RelationManagers\CommentsRelationManager;
use App\Filament\Admin\Resources\VotacaoResource\RelationManagers\VotosRelationManager;
use Filament\Forms;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Actions\DeleteAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Actions\ViewAction;
use Filament\Tables\Columns\BadgeColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Database\Eloquent\Builder;

class VotacaoResource extends BaseResource
{
    protected static ?string $model = Votacao::class;

    protected static ?string $navigationGroup = 'Votacoes';

    protected static ?string $navigationIcon = 'heroicon-o-scale';

    protected static ?string $navigationLabel = 'Votacoes';

    protected static ?string $modelLabel = 'Votacao';

    protected static ?string $pluralModelLabel = 'Votacoes';

    protected static ?int $navigationSort = 21;

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Identificacao')
                    ->columns(2)
                    ->schema([
                        TextInput::make('titulo')
                            ->label('Título')
                            ->required()
                            ->helperText('Título oficial da votacao.')
                            ->maxLength(200),
                        TextInput::make('subtitulo')
                            ->label('Subtítulo')
                            ->maxLength(200),
                        TextInput::make('protocolo')
                            ->label('Protocolo')
                            ->maxLength(100),
                        TextInput::make('tipo')
                            ->label('Tipo')
                            ->required()
                            ->helperText('Ex: PROJETO_LEI, REQUERIMENTO.')
                            ->maxLength(80),
                        DatePicker::make('data')
                            ->label('Data')
                            ->required(),
                        TextInput::make('sessao')
                            ->label('Sessão')
                            ->maxLength(150),
                        Select::make('status')
                            ->label('Status')
                            ->options(collect(StatusVotacao::cases())
                                ->mapWithKeys(fn(StatusVotacao $status) => [$status->value => $status->label()])
                                ->toArray())
                            ->required()
                            ->default(StatusVotacao::EM_ANDAMENTO->value),
                    ]),
                Section::make('Descrição')
                    ->schema([
                        Textarea::make('descricao')
                            ->label('Descrição')
                            ->rows(5)
                            ->maxLength(5000),
                        Textarea::make('ementa')
                            ->label('Ementa')
                            ->rows(4)
                            ->maxLength(2000),
                    ]),
                Section::make('Links')
                    ->columns(2)
                    ->schema([
                        TextInput::make('url_fonte')
                            ->label('URL da fonte')
                            ->url()
                            ->maxLength(500)
                            ->helperText('Link oficial da votação ou sessão.'),
                        TextInput::make('url_documento')
                            ->label('URL do documento')
                            ->url()
                            ->maxLength(500)
                            ->helperText('PDF ou documento completo relacionado.'),
                    ]),
                Section::make('Tags')
                    ->schema([
                        TagsInput::make('tags')
                            ->label('Tags')
                            ->placeholder('transparencia, orcamento, saude')
                            ->separator(',')
                            ->helperText('Separe por vírgula. Ex: transparencia, orcamento.'),
                    ]),
                Section::make('Resultado (auto)')
                    ->columns(4)
                    ->schema([
                        TextInput::make('votos_sim')
                            ->label('Sim')
                            ->numeric()
                            ->disabled()
                            ->dehydrated(false),
                        TextInput::make('votos_nao')
                            ->label('Não')
                            ->numeric()
                            ->disabled()
                            ->dehydrated(false),
                        TextInput::make('votos_abstencao')
                            ->label('Abstenção')
                            ->numeric()
                            ->disabled()
                            ->dehydrated(false),
                        TextInput::make('votos_ausente')
                            ->label('Ausente')
                            ->numeric()
                            ->disabled()
                            ->dehydrated(false),
                    ]),
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
                    ->limit(50),
                TextColumn::make('protocolo')
                    ->label('Protocolo')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('tipo')
                    ->label('Tipo')
                    ->toggleable(),
                BadgeColumn::make('status')
                    ->label('Status')
                    ->formatStateUsing(fn(StatusVotacao $state): string => $state->label())
                    ->color(fn(StatusVotacao $state): string => match ($state) {
                        StatusVotacao::APROVADO => 'success',
                        StatusVotacao::REJEITADO => 'danger',
                        StatusVotacao::EM_ANDAMENTO => 'info',
                        StatusVotacao::ARQUIVADO => 'gray',
                    }),
                TextColumn::make('data')
                    ->label('Data')
                    ->date('d/m/Y')
                    ->sortable(),
                TextColumn::make('sessao')
                    ->label('Sessão')
                    ->toggleable(isToggledHiddenByDefault: true)
                    ->limit(40),
                TextColumn::make('votos_sim')
                    ->label('Sim')
                    ->alignCenter()
                    ->sortable(),
                TextColumn::make('votos_nao')
                    ->label('Não')
                    ->alignCenter()
                    ->sortable(),
                TextColumn::make('votos_abstencao')
                    ->label('Abstenção')
                    ->alignCenter()
                    ->sortable(),
                TextColumn::make('votos_ausente')
                    ->label('Ausente')
                    ->alignCenter()
                    ->sortable(),
                TextColumn::make('likes_count')
                    ->label('Likes')
                    ->alignCenter()
                    ->sortable(),
                TextColumn::make('dislikes_count')
                    ->label('Dislikes')
                    ->alignCenter()
                    ->sortable(),
                TextColumn::make('comments_count')
                    ->label('Comentários')
                    ->alignCenter()
                    ->sortable(),
                ...static::baseTableColumns(),
            ])
            ->filters([
                SelectFilter::make('ano')
                    ->label('Ano')
                    ->options(fn() => Votacao::query()
                        ->selectRaw('YEAR(data) as ano')
                        ->whereNotNull('data')
                        ->distinct()
                        ->orderByDesc('ano')
                        ->pluck('ano', 'ano')
                        ->toArray())
                    ->query(function (Builder $query, array $data): Builder {
                        if (!array_key_exists('value', $data) || !$data['value']) {
                            return $query;
                        }

                        return $query->whereYear('data', $data['value']);
                    }),
                SelectFilter::make('status')
                    ->label('Status')
                    ->options(collect(StatusVotacao::cases())
                        ->mapWithKeys(fn(StatusVotacao $status) => [$status->value => $status->label()])
                        ->toArray()),
                SelectFilter::make('tipo')
                    ->label('Tipo')
                    ->options(fn() => Votacao::query()->select('tipo')->distinct()->pluck('tipo', 'tipo')->toArray()),
                Tables\Filters\Filter::make('com_url_fonte')
                    ->label('Com URL fonte')
                    ->query(fn(Builder $query): Builder => $query->whereNotNull('url_fonte')),
                ...static::baseTableFilters(),
            ])
            ->actions([
                Action::make('recalcular')
                    ->label('Recalcular votos')
                    ->icon('heroicon-o-arrow-path')
                    ->requiresConfirmation()
                    ->action(fn(Votacao $record) => $record->recalcularVotos())
                    ->visible(fn(): bool => auth()->user()?->hasRole('admin') ?? false),
                ViewAction::make()
                    ->label('Resumo')
                    ->modalHeading(fn(Votacao $record): string => "Resumo: {$record->titulo}")
                    ->form([
                        Section::make('Votação')
                            ->columns(2)
                            ->schema([
                                Placeholder::make('status')
                                    ->label('Status')
                                    ->content(fn(Votacao $record): string => $record->status?->label() ?? '-'),
                                Placeholder::make('resultado')
                                    ->label('Resultado')
                                    ->content(fn(Votacao $record): string => $record->resultado),
                                Placeholder::make('total_votos')
                                    ->label('Total de votos')
                                    ->content(fn(Votacao $record): int => $record->total_votos),
                                Placeholder::make('sessao')
                                    ->label('Sessão')
                                    ->content(fn(Votacao $record): string => $record->sessao ?? '-'),
                            ]),
                        Section::make('Contagem')
                            ->columns(4)
                            ->schema([
                                Placeholder::make('votos_sim')
                                    ->label('Sim')
                                    ->content(fn(Votacao $record): int => $record->votos_sim),
                                Placeholder::make('votos_nao')
                                    ->label('Não')
                                    ->content(fn(Votacao $record): int => $record->votos_nao),
                                Placeholder::make('votos_abstencao')
                                    ->label('Abstenção')
                                    ->content(fn(Votacao $record): int => $record->votos_abstencao),
                                Placeholder::make('votos_ausente')
                                    ->label('Ausente')
                                    ->content(fn(Votacao $record): int => $record->votos_ausente),
                            ]),
                        Section::make('Engajamento')
                            ->columns(3)
                            ->schema([
                                Placeholder::make('likes_count')
                                    ->label('Likes')
                                    ->content(fn(Votacao $record): int => $record->likes_count ?? 0),
                                Placeholder::make('dislikes_count')
                                    ->label('Dislikes')
                                    ->content(fn(Votacao $record): int => $record->dislikes_count ?? 0),
                                Placeholder::make('comments_count')
                                    ->label('Comentários')
                                    ->content(fn(Votacao $record): int => $record->comments_count ?? 0),
                            ]),
                    ]),
                EditAction::make()->requiresConfirmation(),
                DeleteAction::make()->requiresConfirmation(),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            VotosRelationManager::class,
            CommentsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListVotacoes::route('/'),
            'create' => Pages\CreateVotacao::route('/create'),
            'edit' => Pages\EditVotacao::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return auth()->user()?->hasRole('admin') ?? false;
    }

    public static function getDefaultTableSortColumn(): ?string
    {
        return 'data';
    }

    public static function getDefaultTableSortDirection(): ?string
    {
        return 'desc';
    }
}
