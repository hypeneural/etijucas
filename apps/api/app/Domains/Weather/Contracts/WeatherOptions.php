<?php

declare(strict_types=1);

namespace App\Domains\Weather\Contracts;

final class WeatherOptions
{
    public function __construct(
        public readonly int $forecastDays = 7,
        public readonly string $units = 'metric',
        public readonly ?string $timezone = null,
        public readonly ?string $lang = 'pt',
        public readonly ?string $model = 'best_match',
    ) {
    }

    public function withTimezone(?string $timezone): self
    {
        return new self(
            forecastDays: $this->forecastDays,
            units: $this->units,
            timezone: $timezone,
            lang: $this->lang,
            model: $this->model,
        );
    }
}
