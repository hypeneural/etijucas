<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Domains\Votes\Models\Vereador;
use App\Filament\Admin\Resources\Concerns\HasMediaLibraryTrait;
use App\Filament\Admin\Resources\VereadorResource\Pages;
use Filament\Forms;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\KeyValue;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Tables;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Support\Str;

class VereadorResource extends BaseResource
{
    use HasMediaLibraryTrait;

    protected static ?string $model = Vereador::class;

    protected static ?string $navigationGroup = 'Votacoes';

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
                        TextInput::make('foto_url')
                            ->label('Foto URL (legado)')
                            ->url()
                            ->maxLength(500)
                            ->helperText('Opcional. Use o upload acima sempre que possível.'),
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
                SelectFilter::make('ativo')
                    ->label('Ativo')
                    ->options([
                        1 => 'Sim',
                        0 => 'Nao',
                    ]),
                ...static::baseTableFilters(),
            ])
            ->actions([
                ...static::baseTableActions(),
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

    public static function canCreate(): bool
    {
        return auth()->user()?->hasRole('admin') ?? false;
    }
}
