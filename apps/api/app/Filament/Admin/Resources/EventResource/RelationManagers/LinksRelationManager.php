<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\EventResource\RelationManagers;

use App\Domain\Events\Enums\LinkType;
use Filament\Forms;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Columns\TextColumn;

class LinksRelationManager extends RelationManager
{
    protected static string $relationship = 'links';

    protected static ?string $title = 'Links';

    public function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Section::make('Link')
                    ->columns(2)
                    ->schema([
                        Select::make('link_type')
                            ->label('Tipo')
                            ->options(collect(LinkType::cases())
                                ->mapWithKeys(fn (LinkType $type) => [$type->value => $type->label()])
                                ->toArray())
                            ->required(),
                        TextInput::make('url')
                            ->label('URL')
                            ->url()
                            ->required()
                            ->maxLength(500),
                        TextInput::make('label')
                            ->label('Label')
                            ->maxLength(100),
                    ]),
            ]);
    }

    public function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                TextColumn::make('link_type')
                    ->label('Tipo')
                    ->badge()
                    ->formatStateUsing(fn (LinkType $state): string => $state->label())
                    ->sortable(),
                TextColumn::make('label')
                    ->label('Label')
                    ->limit(30)
                    ->toggleable(),
                TextColumn::make('url')
                    ->label('URL')
                    ->limit(40)
                    ->toggleable(),
            ])
            ->defaultSort('created_at', 'desc')
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
