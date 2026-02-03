<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\{{ resource }}\RelationManagers;

use Filament\Forms;
use Filament\Tables;
use Filament\Resources\RelationManagers\RelationManager;

class {{ relation }}RelationManager extends RelationManager
{
    protected static string $relationship = '{{ relationship }}';

    public function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                // Fields
            ]);
    }

    public function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                // Columns
            ])
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
