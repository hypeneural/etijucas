<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\OrganizerResource\Pages;
use App\Models\Organizer;
use Filament\Forms;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Tables;
use Filament\Tables\Actions\DeleteAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Actions\ViewAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Support\Str;

class OrganizerResource extends BaseResource
{
    protected static ?string $model = Organizer::class;

    protected static ?string $navigationGroup = 'Conteudo';

    protected static ?string $navigationIcon = 'heroicon-o-user-group';

    protected static ?string $navigationLabel = 'Organizadores';

    protected static ?string $modelLabel = 'Organizador';

    protected static ?string $pluralModelLabel = 'Organizadores';

    protected static ?int $navigationSort = 14;

    protected static array $defaultEagerLoad = ['user'];

    protected static array $defaultWithCount = ['events'];

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Organizador')
                    ->columns(2)
                    ->schema([
                        TextInput::make('name')
                            ->label('Nome')
                            ->required()
                            ->maxLength(150)
                            ->live(onBlur: true)
                            ->afterStateUpdated(function (string $state, callable $set): void {
                                $set('slug', Str::slug($state));
                            }),
                        TextInput::make('slug')
                            ->label('Slug')
                            ->required()
                            ->maxLength(170)
                            ->unique(ignoreRecord: true),
                        Toggle::make('is_verified')
                            ->label('Verificado')
                            ->default(false),
                        Select::make('user_id')
                            ->label('Usuario')
                            ->relationship('user', 'nome')
                            ->searchable()
                            ->preload(),
                    ]),
                Section::make('Contato')
                    ->columns(2)
                    ->schema([
                        TextInput::make('email')
                            ->label('Email')
                            ->email()
                            ->maxLength(255),
                        TextInput::make('phone')
                            ->label('Telefone')
                            ->maxLength(20),
                        TextInput::make('whatsapp')
                            ->label('WhatsApp')
                            ->maxLength(20),
                        TextInput::make('instagram')
                            ->label('Instagram')
                            ->maxLength(100),
                        TextInput::make('website')
                            ->label('Site')
                            ->url()
                            ->maxLength(300),
                        TextInput::make('avatar_url')
                            ->label('Avatar URL')
                            ->url()
                            ->maxLength(500),
                    ]),
                Section::make('Descricao')
                    ->schema([
                        Textarea::make('description')
                            ->label('Descricao')
                            ->rows(4),
                    ]),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->label('Nome')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('email')
                    ->label('Email')
                    ->toggleable(),
                TextColumn::make('phone')
                    ->label('Telefone')
                    ->toggleable(),
                IconColumn::make('is_verified')
                    ->label('Verificado')
                    ->boolean()
                    ->toggleable(),
                TextColumn::make('events_count')
                    ->label('Eventos')
                    ->sortable()
                    ->alignCenter(),
                ...static::baseTableColumns(),
            ])
            ->filters([
                SelectFilter::make('is_verified')
                    ->label('Verificado')
                    ->options([
                        1 => 'Sim',
                        0 => 'Nao',
                    ]),
                ...static::baseTableFilters(),
            ])
            ->actions([
                ViewAction::make(),
                EditAction::make()->requiresConfirmation(),
                DeleteAction::make()
                    ->requiresConfirmation()
                    ->visible(fn(): bool => auth()->user()?->hasAnyRole(['admin', 'operator']) ?? false),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListOrganizers::route('/'),
            'create' => Pages\CreateOrganizer::route('/create'),
            'edit' => Pages\EditOrganizer::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return auth()->user()?->hasAnyRole(['admin', 'operator']) ?? false;
    }
}
