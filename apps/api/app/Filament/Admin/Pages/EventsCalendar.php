<?php

declare(strict_types=1);

namespace App\Filament\Admin\Pages;

use App\Models\Event;
use Filament\Pages\Page;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class EventsCalendar extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-calendar-days';

    protected static ?string $navigationLabel = 'Calendário de Eventos';

    protected static ?string $navigationGroup = 'Conte?do';

    protected static ?int $navigationSort = 6;

    protected static string $view = 'filament.admin.pages.events-calendar';

    public string $viewMode = 'month';

    public string $focusDate;

    public static function canAccess(): bool
    {
        return auth()->user()?->can('page_EventsCalendar') ?? false;
    }

    public function mount(): void
    {
        $this->focusDate = now()->toDateString();
    }

    public function setViewMode(string $mode): void
    {
        if (! in_array($mode, ['month', 'week'], true)) {
            return;
        }

        $this->viewMode = $mode;
    }

    public function previousPeriod(): void
    {
        $focus = $this->focusCarbon;

        $this->focusDate = $this->viewMode === 'month'
            ? $focus->subMonthNoOverflow()->toDateString()
            : $focus->subWeek()->toDateString();
    }

    public function nextPeriod(): void
    {
        $focus = $this->focusCarbon;

        $this->focusDate = $this->viewMode === 'month'
            ? $focus->addMonthNoOverflow()->toDateString()
            : $focus->addWeek()->toDateString();
    }

    public function goToToday(): void
    {
        $this->focusDate = now()->toDateString();
    }

    public function getFocusCarbonProperty(): Carbon
    {
        return Carbon::parse($this->focusDate ?? now()->toDateString());
    }

    public function getRangeStartProperty(): Carbon
    {
        $focus = $this->focusCarbon;

        return $this->viewMode === 'month'
            ? $focus->copy()->startOfMonth()->startOfWeek()
            : $focus->copy()->startOfWeek();
    }

    public function getRangeEndProperty(): Carbon
    {
        $focus = $this->focusCarbon;

        return $this->viewMode === 'month'
            ? $focus->copy()->endOfMonth()->endOfWeek()
            : $focus->copy()->endOfWeek();
    }

    public function getPeriodLabelProperty(): string
    {
        if ($this->viewMode === 'month') {
            return $this->focusCarbon->translatedFormat('F Y');
        }

        return sprintf(
            'Semana de %s a %s',
            $this->rangeStart->format('d/m'),
            $this->rangeEnd->format('d/m')
        );
    }

    /**
     * @return Collection<int, Event>
     */
    public function getEventsProperty(): Collection
    {
        return Event::query()
            ->select(['id', 'title', 'start_datetime', 'end_datetime', 'status', 'is_featured'])
            ->where('start_datetime', '<=', $this->rangeEnd->copy()->endOfDay())
            ->where('end_datetime', '>=', $this->rangeStart->copy()->startOfDay())
            ->orderBy('start_datetime')
            ->get();
    }

    /**
     * @return array<string, array<int, Event>>
     */
    public function getEventsByDayProperty(): array
    {
        $rangeStart = $this->rangeStart->copy()->startOfDay();
        $rangeEnd = $this->rangeEnd->copy()->endOfDay();

        $byDay = [];

        foreach ($this->events as $event) {
            $eventStart = $event->start_datetime?->copy()->startOfDay();
            $eventEnd = $event->end_datetime?->copy()->startOfDay() ?? $eventStart;

            if (! $eventStart) {
                continue;
            }

            if ($eventEnd->lt($eventStart)) {
                $eventEnd = $eventStart->copy();
            }

            $cursor = $eventStart->copy();

            while ($cursor->lte($eventEnd)) {
                if ($cursor->lt($rangeStart) || $cursor->gt($rangeEnd)) {
                    $cursor->addDay();
                    continue;
                }

                $key = $cursor->toDateString();
                $byDay[$key][] = $event;
                $cursor->addDay();
            }
        }

        return $byDay;
    }

    /**
     * @return array<int, Carbon>
     */
    public function getWeekDaysProperty(): array
    {
        $days = [];
        $cursor = $this->rangeStart->copy();

        for ($i = 0; $i < 7; $i++) {
            $days[] = $cursor->copy();
            $cursor->addDay();
        }

        return $days;
    }

    /**
     * @return array<int, Carbon>
     */
    public function getMonthDaysProperty(): array
    {
        $days = [];
        $cursor = $this->rangeStart->copy();
        $end = $this->rangeEnd->copy();

        while ($cursor->lte($end)) {
            $days[] = $cursor->copy();
            $cursor->addDay();
        }

        return $days;
    }
}
