<x-filament-panels::page>
    @php
        use Illuminate\Support\Str;

        $eventsByDay = $this->eventsByDay;
        $rangeStart = $this->rangeStart;
        $rangeEnd = $this->rangeEnd;
        $focusMonth = $this->focusCarbon->month;
    @endphp

    <div class="space-y-4">
        <div class="flex flex-wrap items-center gap-2">
            <x-filament::button color="gray" icon="heroicon-o-chevron-left" wire:click="previousPeriod">
                Anterior
            </x-filament::button>

            <x-filament::button color="gray" icon="heroicon-o-calendar" wire:click="goToToday">
                Hoje
            </x-filament::button>

            <x-filament::button color="gray" icon="heroicon-o-chevron-right" wire:click="nextPeriod">
                Próximo
            </x-filament::button>

            <div class="ml-auto flex items-center gap-2">
                <x-filament::button
                    :color="$viewMode === 'month' ? 'primary' : 'gray'"
                    wire:click="setViewMode('month')"
                >
                    Mês
                </x-filament::button>

                <x-filament::button
                    :color="$viewMode === 'week' ? 'primary' : 'gray'"
                    wire:click="setViewMode('week')"
                >
                    Semana
                </x-filament::button>
            </div>
        </div>

        <div class="text-sm text-gray-500">
            <span class="font-medium text-gray-700">{{ $this->periodLabel }}</span>
            <span class="ml-2">{{ $rangeStart->format('d/m/Y') }} - {{ $rangeEnd->format('d/m/Y') }}</span>
        </div>

        <div class="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200">
            <div class="col-span-7 grid grid-cols-7 bg-gray-50 text-xs font-semibold text-gray-600">
                @foreach ($this->weekDays as $day)
                    <div class="p-2 text-center">{{ $day->translatedFormat('D') }}</div>
                @endforeach
            </div>

            @if ($viewMode === 'month')
                @foreach ($this->monthDays as $day)
                    @php
                        $dateKey = $day->toDateString();
                        $events = $eventsByDay[$dateKey] ?? [];
                        $isToday = $day->isToday();
                        $inMonth = $day->month === $focusMonth;
                    @endphp
                    <div class="min-h-[120px] bg-white p-2">
                        <div class="flex items-center justify-between text-xs">
                            <span class="{{ $inMonth ? 'text-gray-900 font-semibold' : 'text-gray-400' }}">
                                {{ $day->format('d') }}
                            </span>
                            @if ($isToday)
                                <span class="rounded bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
                                    Hoje
                                </span>
                            @endif
                        </div>
                        <div class="mt-2 space-y-1">
                            @foreach ($events as $event)
                                <a
                                    href="{{ \App\Filament\Admin\Resources\EventResource::getUrl('edit', ['record' => $event]) }}"
                                    class="block rounded bg-gray-100 px-2 py-1 text-xs hover:bg-primary-50"
                                >
                                    <div class="flex items-center justify-between gap-2">
                                        <span class="font-medium text-gray-700">
                                            {{ $event->start_datetime->format('H:i') }}
                                        </span>
                                        @if ($event->is_featured)
                                            <span class="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                                Destaque
                                            </span>
                                        @endif
                                    </div>
                                    <div class="text-gray-700">
                                        {{ Str::limit($event->title, 32) }}
                                    </div>
                                </a>
                            @endforeach
                        </div>
                    </div>
                @endforeach
            @else
                @foreach ($this->weekDays as $day)
                    @php
                        $dateKey = $day->toDateString();
                        $events = $eventsByDay[$dateKey] ?? [];
                        $isToday = $day->isToday();
                    @endphp
                    <div class="min-h-[200px] bg-white p-2">
                        <div class="flex items-center justify-between text-xs font-semibold">
                            <span class="{{ $isToday ? 'text-primary-700' : 'text-gray-700' }}">
                                {{ $day->format('d/m') }}
                            </span>
                            @if ($isToday)
                                <span class="rounded bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
                                    Hoje
                                </span>
                            @endif
                        </div>
                        <div class="mt-2 space-y-2">
                            @forelse ($events as $event)
                                <a
                                    href="{{ \App\Filament\Admin\Resources\EventResource::getUrl('edit', ['record' => $event]) }}"
                                    class="block rounded-lg border border-gray-100 p-2 text-xs hover:border-primary-200 hover:bg-primary-50"
                                >
                                    <div class="flex items-center justify-between">
                                        <span class="font-medium text-gray-700">
                                            {{ $event->start_datetime->format('H:i') }}
                                        </span>
                                        <span class="text-gray-400">
                                            {{ $event->end_datetime->format('H:i') }}
                                        </span>
                                    </div>
                                    <div class="text-gray-800">
                                        {{ Str::limit($event->title, 40) }}
                                    </div>
                                </a>
                            @empty
                                <div class="text-xs text-gray-400">Sem eventos</div>
                            @endforelse
                        </div>
                    </div>
                @endforeach
            @endif
        </div>
    </div>
</x-filament-panels::page>
