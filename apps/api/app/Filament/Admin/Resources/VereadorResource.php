<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domains\Votes\Models\Legislatura;
use App\Domains\Votes\Models\Partido;
use App\Domains\Votes\Models\Vereador;
use App\Filament\Admin\Resources\Concerns\HasMediaLibraryTrait;
use App\Filament\Admin\Resources\VereadorResource\Pages;
use App\Filament\Admin\Resources\VereadorResource\RelationManagers\MandatosRelationManager;
use Filament\Forms;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\KeyValue;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Notifications\Notification;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class VereadorResource extends BaseResource
{
    use HasMediaLibraryTrait;

    protected static ?string $model = Vereador::class;

    protected static ?string $navigationGroup = 'Vota??es';

    protected static ?string $navigationIcon = 'heroicon-o-user-group';

    protected static ?string $navigationLabel = 'Vereadores';

    protected static ?string $modelLabel = 'Vereador';

    protected static ?string $pluralModelLabel = 'Vereadores';

    protected static ?int $navigationSort = 20;

    protected static array $defaultEagerLoad = ['mandatoAtual.partido', 'mandatoAtual.legislatura'];

    protected static array $defaultWithCount = ['votos'];

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Dados do Vereador')
                    ->columns(2)
                    ->schema([
                        TextInput::make('nome')
                            ->label('Nome')
                            ->required()
                            ->maxLength(200)
                            ->live(onBlur: true)
                            ->afterStateUpdated(function (string $state, callable $set): void {
                                $set('slug', Str::slug($state));
                            }),
                        TextInput::make('slug')
                            ->label('Slug')
                            ->required()
                            ->maxLength(220)
                            ->unique(ignoreRecord: true),
                        DatePicker::make('nascimento')
                            ->label('Nascimento'),
                        TextInput::make('cpf')
                            ->label('CPF')
                            ->maxLength(14),
                        TextInput::make('telefone')
                            ->label('Telefone')
                            ->maxLength(20),
                        TextInput::make('email')
                            ->label('Email')
                            ->email()
                            ->maxLength(255),
                        TextInput::make('site_oficial_url')
                            ->label('Site oficial')
                            ->url()
                            ->maxLength(500),
                        Toggle::make('ativo')
                            ->label('Ativo')
                            ->default(true),
                    ]),
                Section::make('Foto')
                    ->columns(2)
                    ->schema([
                        static::mediaUploadField('avatar', 'vereador_avatar', 1)
                            ->label('Avatar')
                            ->helperText('Upload preferencial. Gera thumbnails automaticamente.'),
                    ]),
                Section::make('Foto (legado)')
                    ->collapsible()
                    ->collapsed()
                    ->schema([
                        TextInput::make('foto_url')
                            ->label('Foto URL (legado)')
                            ->url()
                            ->maxLength(500)
                            ->helperText('Opcional. Use o upload acima sempre que poss?vel.'),
                    ]),
                Section::make('Bio')
                    ->schema([
                        Textarea::make('bio')
                            ->label('Bio')
                            ->rows(5),
                    ]),
                Section::make('Redes sociais')
                    ->schema([
                        KeyValue::make('redes_sociais')
                            ->label('Redes sociais')
                            ->keyLabel('Canal')
                            ->valueLabel('URL/Usuário')
                            ->addActionLabel('Adicionar rede')
                            ->helperText('Ex: facebook, instagram, youtube, whatsapp'),
                    ]),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                ImageColumn::make('avatar')
                    ->label('Foto')
                    ->circular()
                    ->size(36)
                    ->getStateUsing(fn (Vereador $record): ?string => $record->getFirstMediaUrl('vereador_avatar') ?: $record->foto_url),
                TextColumn::make('nome')
                    ->label('Nome')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('mandatoAtual.partido.sigla')
                    ->label('Partido')
                    ->toggleable(),
                TextColumn::make('mandatoAtual.cargo')
                    ->label('Cargo')
                    ->toggleable(),
                TextColumn::make('mandatoAtual.legislatura.periodo')
                    ->label('Legislatura')
                    ->toggleable(),
                IconColumn::make('ativo')
                    ->label('Ativo')
                    ->boolean()
                    ->toggleable(),
                TextColumn::make('votos_count')
                    ->label('Votos')
                    ->sortable()
                    ->alignCenter(),
                ...static::baseTableColumns(),
            ])
            ->filters([
                SelectFilter::make('em_exercicio')
                    ->label('Em exercicio')
                    ->options([
                        1 => 'Sim',
                        0 => 'Nao',
                    ])
                    ->query(function (Builder $query, array $data): Builder {
                        if (! array_key_exists('value', $data) || $data['value'] === null || $data['value'] === '') {
                            return $query;
                        }

                        return $data['value']
                            ? $query->whereHas('mandatoAtual')
                            : $query->whereDoesntHave('mandatoAtual');
                    }),
                SelectFilter::make('partido_id')
                    ->label('Partido')
                    ->options(fn () => Partido::query()->orderBy('sigla')->pluck('sigla', 'id')->toArray())
                    ->searchable()
                    ->query(function (Builder $query, array $data): Builder {
                        if (! array_key_exists('value', $data) || ! $data['value']) {
                            return $query;
                        }

                        return $query->whereHas('mandatoAtual', fn (Builder $sub) => $sub->where('partido_id', $data['value']));
                    }),
                SelectFilter::make('legislatura_id')
                    ->label('Legislatura')
                    ->options(fn () => Legislatura::query()
                        ->orderByDesc('ano_inicio')
                        ->get()
                        ->mapWithKeys(fn (Legislatura $legislatura) => [$legislatura->id => $legislatura->nome_completo])
                        ->toArray())
                    ->searchable()
                    ->query(function (Builder $query, array $data): Builder {
                        if (! array_key_exists('value', $data) || ! $data['value']) {
                            return $query;
                        }

                        return $query->whereHas('mandatoAtual', fn (Builder $sub) => $sub->where('legislatura_id', $data['value']));
                    }),
                SelectFilter::make('ativo')
                    ->label('Ativo')
                    ->options([
                        1 => 'Sim',
                        0 => 'Nao',
                    ]),
                ...static::baseTableFilters(),
            ])
            ->actions([
                Action::make('importFoto')
                    ->label('Importar m?dia (URL)')
                    ->icon('heroicon-o-arrow-down-tray')
                    ->requiresConfirmation()
                    ->action(function (Vereador $record): void {
                        if (! $record->foto_url) {
                            Notification::make()
                                ->title('Sem URL de foto')
                                ->warning()
                                ->send();
                            return;
                        }

                        if ($record->getMedia('vereador_avatar')->isNotEmpty()) {
                            Notification::make()
                                ->title('Avatar ja cadastrado')
                                ->warning()
                                ->send();
                            return;
                        }

                        try {
                            $record->addMediaFromUrl($record->foto_url)
                                ->toMediaCollection('vereador_avatar');

                            $mediaUrl = $record->getFirstMediaUrl('vereador_avatar');
                            if ($mediaUrl) {
                                $record->forceFill(['foto_url' => $mediaUrl])->saveQuietly();
                            }

                            Notification::make()
                                ->title('Foto importada com sucesso')
                                ->success()
                                ->send();
                        } catch (\Throwable $exception) {
                            Notification::make()
                                ->title('Falha ao importar a foto')
                                ->danger()
                                ->send();
                        }
                    })
                    ->visible(fn (): bool => auth()->user()?->hasRole('admin') ?? false),
                ...static::baseTableActions(),
            ])
            ->bulkActions([
                Tables\Actions\BulkAction::make('importFotos')
                    ->label('Importar m?dias (URL)')
                    ->icon('heroicon-o-arrow-down-tray')
                    ->requiresConfirmation()
                    ->action(function ($records): void {
                        $imported = 0;
                        $skipped = 0;
                        $failed = 0;

                        foreach ($records as $record) {
                            if (! $record->foto_url) {
                                $skipped++;
                                continue;
                            }

                            if ($record->getMedia('vereador_avatar')->isNotEmpty()) {
                                $skipped++;
                                continue;
                            }

                            try {
                                $record->addMediaFromUrl($record->foto_url)
                                    ->toMediaCollection('vereador_avatar');

                                $mediaUrl = $record->getFirstMediaUrl('vereador_avatar');
                                if ($mediaUrl) {
                                    $record->forceFill(['foto_url' => $mediaUrl])->saveQuietly();
                                }

                                $imported++;
                            } catch (\Throwable $exception) {
                                $failed++;
                            }
                        }

                        Notification::make()
                            ->title('Importacao concluida')
                            ->body("Importados: {$imported}. Ignorados: {$skipped}. Falhas: {$failed}.")
                            ->success()
                            ->send();
                    })
                    ->deselectRecordsAfterCompletion()
                    ->visible(fn (): bool => auth()->user()?->hasRole('admin') ?? false),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListVereadores::route('/'),
            'create' => Pages\CreateVereador::route('/create'),
            'edit' => Pages\EditVereador::route('/{record}/edit'),
        ];
    }

    public static function getRelations(): array
    {
        return [
            MandatosRelationManager::class,
        ];
    }

    public static function canCreate(): bool
    {
        return auth()->user()?->hasRole('admin') ?? false;
    }

    public static function getDefaultTableSortColumn(): ?string
    {
        return 'nome';
    }

    public static function getDefaultTableSortDirection(): ?string
    {
        return 'asc';
    }
}
