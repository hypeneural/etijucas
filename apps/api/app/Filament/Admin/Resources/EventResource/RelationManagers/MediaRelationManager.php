<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\EventResource\RelationManagers;

use App\Domain\Events\Enums\MediaType;
use Filament\Forms;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Columns\TextColumn;

class MediaRelationManager extends RelationManager
{
    protected static string $relationship = 'legacyMedia';

    protected static ?string $title = 'Midias';

    public function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Midia')
                    ->columns(2)
                    ->schema([
                        Select::make('media_type')
                            ->label('Tipo')
                            ->options(collect(MediaType::cases())
                                ->mapWithKeys(fn (MediaType $type) => [$type->value => $type->label()])
                                ->toArray())
                            ->required(),
                        TextInput::make('url')
                            ->label('URL')
                            ->required()
                            ->url()
                            ->maxLength(500),
                        TextInput::make('thumbnail_url')
                            ->label('Thumbnail URL')
                            ->url()
                            ->maxLength(500),
                        TextInput::make('display_order')
                            ->label('Ordem')
                            ->numeric()
                            ->default(0),
                        Textarea::make('caption')
                            ->label('Legenda')
                            ->rows(3)
                            ->columnSpanFull(),
                    ]),
            ]);
    }

    public function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('media_type')
                    ->label('Tipo')
                    ->badge()
                    ->formatStateUsing(fn (MediaType $state): string => $state->label())
                    ->color(fn (MediaType $state): string => $state === MediaType::Image ? 'success' : 'info'),
                TextColumn::make('url')
                    ->label('URL')
                    ->limit(40)
                    ->toggleable(),
                TextColumn::make('caption')
                    ->label('Legenda')
                    ->limit(40)
                    ->toggleable(),
                TextColumn::make('display_order')
                    ->label('Ordem')
                    ->sortable()
                    ->toggleable(),
            ])
            ->defaultSort('display_order', 'asc')
            ->filters([
                //
            ])
            ->actions([
                Tables\Actions\CreateAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ]);
    }
}
