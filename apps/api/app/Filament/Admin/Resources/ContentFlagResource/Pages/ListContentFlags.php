<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\ContentFlagResource\Pages;

use App\Domain\Moderation\Enums\FlagStatus;
use App\Filament\Admin\Resources\ContentFlagResource;
use Filament\Resources\Pages\ListRecords;
use Filament\Resources\Pages\ListRecords\Tab;
use Illuminate\Database\Eloquent\Builder;

class ListContentFlags extends ListRecords
{
    protected static string $resource = ContentFlagResource::class;

    public function getTitle(): string
    {
        return 'Denúncias de Conteúdo';
    }

    public function getSubheading(): ?string
    {
        return 'Flags enviadas por usuários sobre conteúdos suspeitos ou inadequados.';
    }

    public function getTabs(): array
    {
        return [
            'all' => Tab::make('Todos'),
            'open' => Tab::make('Em aberto')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', FlagStatus::Open->value)),
            'reviewing' => Tab::make('Em análise')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', FlagStatus::Reviewing->value)),
            'action_taken' => Tab::make('Ação tomada')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', FlagStatus::ActionTaken->value)),
            'dismissed' => Tab::make('Dispensadas')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', FlagStatus::Dismissed->value)),
        ];
    }

    public function getDefaultActiveTab(): string
    {
        return 'open';
    }
}
