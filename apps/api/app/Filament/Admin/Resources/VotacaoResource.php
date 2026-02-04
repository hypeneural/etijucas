<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domains\Votes\Enums\StatusVotacao;
use App\Domains\Votes\Models\Votacao;
use App\Filament\Admin\Resources\VotacaoResource\Pages;
use App\Filament\Admin\Resources\VotacaoResource\RelationManagers\VotosRelationManager;
use Filament\Forms;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Tables;
use Filament\Tables\Actions\Action;
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
                            ->label('Titulo')
                            ->required()
                            ->helperText('Titulo oficial da votacao.')
                            ->maxLength(200),
                        TextInput::make('subtitulo')
                            ->label('Subtitulo')
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
                            ->label('Sessao')
                            ->maxLength(150),
                        Select::make('status')
                            ->label('Status')
                            ->options(collect(StatusVotacao::cases())
                                ->mapWithKeys(fn (StatusVotacao $status) => [$status->value => $status->label()])
                                ->toArray())
                            ->required()
                            ->default(StatusVotacao::EM_ANDAMENTO->value),
                    ]),
                Section::make('Descricao')
                    ->schema([
                        Textarea::make('descricao')
                            ->label('Descricao')
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
                            ->maxLength(500),
                        TextInput::make('url_documento')
                            ->label('URL do documento')
                            ->url()
                            ->maxLength(500),
                    ]),
                Section::make('Tags')
                    ->schema([
                        TagsInput::make('tags')
                            ->label('Tags')
                            ->placeholder('transparencia, orcamento, saude')
                            ->separator(','),
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
                            ->label('Nao')
                            ->numeric()
                            ->disabled()
                            ->dehydrated(false),
                        TextInput::make('votos_abstencao')
                            ->label('Abstencao')
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
                    ->label('Titulo')
                    ->searchable()
                    ->sortable()
                    ->limit(50),
                TextColumn::make('tipo')
                    ->label('Tipo')
                    ->toggleable(),
                BadgeColumn::make('status')
                    ->label('Status')
                    ->formatStateUsing(fn (StatusVotacao $state): string => $state->label())
                    ->color(fn (StatusVotacao $state): string => match ($state) {
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
                    ->label('Sessao')
                    ->toggleable(isToggledHiddenByDefault: true)
                    ->limit(40),
                TextColumn::make('votos_sim')
                    ->label('Sim')
                    ->alignCenter()
                    ->sortable(),
                TextColumn::make('votos_nao')
                    ->label('Nao')
                    ->alignCenter()
                    ->sortable(),
                TextColumn::make('votos_abstencao')
                    ->label('Abstencao')
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
                    ->label('Comentarios')
                    ->alignCenter()
                    ->sortable(),
                ...static::baseTableColumns(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Status')
                    ->options(collect(StatusVotacao::cases())
                        ->mapWithKeys(fn (StatusVotacao $status) => [$status->value => $status->label()])
                        ->toArray()),
                SelectFilter::make('tipo')
                    ->label('Tipo')
                    ->options(fn () => Votacao::query()->select('tipo')->distinct()->pluck('tipo', 'tipo')->toArray()),
                Tables\Filters\Filter::make('com_url_fonte')
                    ->label('Com URL fonte')
                    ->query(fn (Builder $query): Builder => $query->whereNotNull('url_fonte')),
                ...static::baseTableFilters(),
            ])
            ->actions([
                Action::make('recalcular')
                    ->label('Recalcular votos')
                    ->icon('heroicon-o-arrow-path')
                    ->requiresConfirmation()
                    ->action(fn (Votacao $record) => $record->recalcularVotos())
                    ->visible(fn (): bool => auth()->user()?->hasRole('admin') ?? false),
                ...static::baseTableActions(),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            VotosRelationManager::class,
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
}
